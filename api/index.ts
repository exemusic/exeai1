import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

// JSON body parser
app.use(express.json());

// Helper to calculate credit cost based on message length (kept for compatibility)
function getCreditCost(text: string): number {
  const len = (text || "").trim().length;
  if (len < 20) return 1;
  if (len < 100) return 2;
  if (len < 300) return 3;
  return 4;
}

// Helper to get Cerebras API key
function getCerebrasApiKey() {
  return process.env.CEREBRAS_API_KEY || "csk-t4v6w2fwymkv2n6n24rm2j2xy9fh4pff59f5wcfjn5jkwepn";
}

// Helper to map UI model ID to actual Cerebras model ID
function getCerebrasModel(uiModel: string): string {
  const apiKey = getCerebrasApiKey();
  // If using sandbox/fallback key, return the mock IDs as-is
  if (apiKey === "csk-t4v6w2fwymkv2n6n24rm2j2xy9fh4pff59f5wcfjn5jkwepn" || apiKey.startsWith("csk-t4")) {
    return uiModel || "gemma-4-31b";
  }
  
  // Otherwise, map to standard official Cerebras API model IDs
  switch (uiModel) {
    case "gemma-4-31b":
      return "llama3.1-8b";
    case "zai-glm-4.7":
      return "llama3.1-70b";
    case "gpt-oss-120b":
      return "llama-3.3-70b";
    default:
      return "llama3.1-8b";
  }
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!getCerebrasApiKey()
  });
});

// Secure endpoint to get or create guest credits (returns 99999 for unlimited use)
app.post("/api/user/get-or-create-credits", (req, res) => {
  return res.json({ credits: 99999 });
});

async function streamGemini(messages: any[], systemInstruction: string, temperature: number, res: any) {
  const geminiKey = process.env.GEMINI_API_KEY || "AQ.Ab8RN6JmEkETYlx3cH-qZwcJMOlGaVFpt491zP1T11A5hH3hMA";
  const ai = new GoogleGenAI({
    apiKey: geminiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
  const contents = messages.map((m: any) => ({
    role: m.role === "model" || m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));
  const responseStream = await ai.models.generateContentStream({
    model: "gemini-3.5-flash",
    contents: contents,
    config: {
      systemInstruction: systemInstruction || "Anda adalah ExeAi, asisten AI modern yang sangat pintar, ramah, dan solutif.",
      temperature: temperature !== undefined ? Number(temperature) : 0.7
    }
  });
  for await (const chunk of responseStream) {
    const text = chunk.text;
    if (text) {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
  }
}

app.post("/api/chat/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const { messages, systemInstruction, temperature, model = "gemma-4-31b" } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.write(`data: ${JSON.stringify({ error: "Invalid or missing messages array" })}\n\n`);
      return res.end();
    }

    if (model === "gemini-3.5-flash") {
      await streamGemini(messages, systemInstruction, temperature, res);
      res.write("data: [DONE]\n\n");
      return res.end();
    }

    const apiKey = getCerebrasApiKey();
    if (!apiKey) {
      res.write(`data: ${JSON.stringify({ error: "Cerebras API key is not configured" })}\n\n`);
      return res.end();
    }

    // Format messages into Cerebras (OpenAI-compatible) format
    const systemMessage = {
      role: "system",
      content: systemInstruction || "Anda adalah ExeAi, asisten AI modern yang sangat pintar, ramah, dan solutif."
    };

    const mappedMessages = messages.map((m: any) => ({
      role: m.role === "model" ? "assistant" : "user",
      content: m.content
    }));

    const allMessages = [systemMessage, ...mappedMessages];

    // Request stream from Cerebras endpoint
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: getCerebrasModel(model),
        messages: allMessages,
        temperature: temperature !== undefined ? Number(temperature) : 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        console.warn("Cerebras API rate-limited (429).");
        res.write(`data: ${JSON.stringify({ error: "Server sedang sibuk. Silakan coba lagi nanti." })}\n\n`);
        return res.end();
      }

      console.warn("Cerebras API Error status:", response.status, errorText);
      res.write(`data: ${JSON.stringify({ error: `Cerebras API Error (${response.status}).` })}\n\n`);
      return res.end();
    }

    const reader = response.body;
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: "Response body from Cerebras is not readable" })}\n\n`);
      return res.end();
    }

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    // Support both Node.js stream types and Web ReadableStreams in Vercel / serverless environment
    if (typeof (reader as any).getReader === "function") {
      const webReader = (reader as any).getReader();
      while (true) {
        const { value, done } = await webReader.read();
        if (done) break;

        let decodedChunk = "";
        if (typeof value === "string") {
          decodedChunk = value;
        } else if (value) {
          decodedChunk = decoder.decode(value, { stream: true });
        }
        buffer += decodedChunk;
        let lineEndIdx;
        while ((lineEndIdx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.substring(0, lineEndIdx).trim();
          buffer = buffer.substring(lineEndIdx + 1);

          if (!line) continue;
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6).trim();
            if (dataStr === "[DONE]") {
              continue;
            }
            try {
              const parsed = JSON.parse(dataStr);
              const text = parsed.choices?.[0]?.delta?.content;
              if (text) {
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
              }
            } catch (err) {
              // Ignore parser errors
            }
          }
        }
      }
    } else {
      // Async iterable fallback for node-fetch or other stream formats
      for await (const chunk of reader as any) {
        let decodedChunk = "";
        if (typeof chunk === "string") {
          decodedChunk = chunk;
        } else if (chunk) {
          decodedChunk = decoder.decode(chunk, { stream: true });
        }
        buffer += decodedChunk;
        let lineEndIdx;
        while ((lineEndIdx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.substring(0, lineEndIdx).trim();
          buffer = buffer.substring(lineEndIdx + 1);

          if (!line) continue;
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6).trim();
            if (dataStr === "[DONE]") {
              continue;
            }
            try {
              const parsed = JSON.parse(dataStr);
              const text = parsed.choices?.[0]?.delta?.content;
              if (text) {
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
              }
            } catch (err) {
              // Ignore parser errors
            }
          }
        }
      }
    }

    // Signal completion
    res.write("data: [DONE]\n\n");
  } catch (error: any) {
    console.warn("Cerebras Proxy Error:", error && error.message ? error.message : error);
    res.write(`data: ${JSON.stringify({ error: "Server mengalami masalah internal. Silakan coba lagi nanti." })}\n\n`);
  } finally {
    res.end();
  }
});

export default app;

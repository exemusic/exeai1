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

async function runGeminiModel(
  ai: any,
  modelName: string,
  contents: any[],
  config: any,
  useSearch: boolean,
  res: any
): Promise<boolean> {
  const finalConfig = { ...config };
  if (useSearch) {
    finalConfig.tools = [{ googleSearch: {} }];
  } else {
    delete finalConfig.tools;
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model: modelName,
      contents: contents,
      config: finalConfig
    });
    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
    return true;
  } catch (err: any) {
    const errString = String(err.message || JSON.stringify(err));
    console.error(`Gemini model ${modelName} failed with error:`, errString);
    
    // Fallback to NO search on the same model if search fails or hits quota
    if (useSearch && (
      errString.includes("RESOURCE_EXHAUSTED") || 
      errString.includes("quota") || 
      errString.includes("PERMISSION_DENIED") || 
      errString.includes("not allowed") || 
      errString.includes("Search") || 
      errString.includes("tool")
    )) {
      console.warn(`Search failed on ${modelName}, falling back to direct answering...`);
      res.write(`data: ${JSON.stringify({ text: "*(Mengoptimalkan pencarian dan memproses informasi secara langsung...)*\n\n" })}\n\n`);
      
      const retryConfig = { ...config };
      delete retryConfig.tools;
      
      try {
        const responseStream = await ai.models.generateContentStream({
          model: modelName,
          contents: contents,
          config: retryConfig
        });
        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }
        return true;
      } catch (retryErr: any) {
        throw retryErr;
      }
    }
    
    throw err;
  }
}

async function streamGemini(messages: any[], systemInstruction: string, temperature: number, webSearchEnabled: boolean, res: any) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const geminiKey2 = process.env.GEMINI2_API_KEY;

  const keysToTry: { key: string; name: string }[] = [];
  if (geminiKey) {
    keysToTry.push({ key: geminiKey, name: "Utama" });
  }
  if (geminiKey2) {
    keysToTry.push({ key: geminiKey2, name: "Cadangan" });
  }

  const contents = messages.map((m: any) => ({
    role: m.role === "model" || m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));
  
  const config: any = {
    systemInstruction: systemInstruction || "Anda adalah ExeAi, asisten AI modern yang sangat pintar, ramah, dan solutif.",
    temperature: temperature !== undefined ? Number(temperature) : 0.7
  };

  // If no Gemini API keys are configured, fallback directly to Cerebras
  if (keysToTry.length === 0) {
    console.warn("No Gemini API keys defined. Falling back directly to ExeAI (Cerebras)...");
    try {
      res.write(`data: ${JSON.stringify({ text: "*(Sistem tidak mendeteksi Kunci API Google, mengalihkan secara dinamis ke ExeAI Engine...)*\n\n" })}\n\n`);
      await runCerebrasModel("gemma-4-31b", messages, systemInstruction, temperature, res);
      return;
    } catch (err3: any) {
      handleGeminiError(err3, res);
      return;
    }
  }

  // Iterate over available keys
  for (let i = 0; i < keysToTry.length; i++) {
    const { key, name } = keysToTry[i];
    const isBackup = i > 0;
    
    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    if (isBackup) {
      res.write(`data: ${JSON.stringify({ text: "*(Batas kuota Kunci API Utama tercapai, menghubungkan ke Kunci API Cadangan...)*\n\n" })}\n\n`);
    }

    // 1. Try gemini-3.5-flash with this key
    try {
      await runGeminiModel(ai, "gemini-3.5-flash", contents, config, webSearchEnabled, res);
      return; // Success!
    } catch (err1: any) {
      const errStr1 = String(err1.message || JSON.stringify(err1));
      console.warn(`gemini-3.5-flash failed with Key ${name}:`, errStr1);
      
      // 2. Try gemini-3.1-flash-lite with this key
      try {
        res.write(`data: ${JSON.stringify({ text: "*(Mengaktifkan mode hemat daya dan beralih ke engine Gemini Flash Lite...)*\n\n" })}\n\n`);
        await runGeminiModel(ai, "gemini-3.1-flash-lite", contents, config, webSearchEnabled, res);
        return; // Success!
      } catch (err2: any) {
        const errStr2 = String(err2.message || JSON.stringify(err2));
        console.warn(`gemini-3.1-flash-lite failed with Key ${name}:`, errStr2);
        
        // If there's another Gemini key, continue to the next loop iteration
        if (i < keysToTry.length - 1) {
          continue;
        }
        
        // No more Gemini keys left. Fallback to ExeAI (Cerebras)
        console.warn("All Gemini API keys failed or exhausted. Falling back to ExeAI (Cerebras)...");
        try {
          res.write(`data: ${JSON.stringify({ text: "*(Sistem mendeteksi kapasitas puncak pada seluruh Google AI, mengalihkan secara dinamis ke ExeAI Engine...)*\n\n" })}\n\n`);
          await runCerebrasModel("gemma-4-31b", messages, systemInstruction, temperature, res);
          return;
        } catch (err3: any) {
          // If everything fails, show error
          handleGeminiError(err2, res);
        }
      }
    }
  }
}

async function runCerebrasModel(
  model: string,
  messages: any[],
  systemInstruction: string,
  temperature: number,
  res: any
) {
  const apiKey = getCerebrasApiKey();
  if (!apiKey) {
    throw new Error("Cerebras API key is not configured");
  }

  const systemMessage = {
    role: "system",
    content: systemInstruction || "Anda adalah ExeAi, asisten AI modern yang sangat pintar, ramah, dan solutif."
  };

  const mappedMessages = messages.map((m: any) => ({
    role: m.role === "model" ? "assistant" : "user",
    content: m.content
  }));

  const allMessages = [systemMessage, ...mappedMessages];

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
    throw new Error(`Cerebras API Error (${response.status}): ${errorText}`);
  }

  const reader = response.body;
  if (!reader) {
    throw new Error("Response body from Cerebras is not readable");
  }

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

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
}

function handleGeminiError(err: any, res: any) {
  console.error("Gemini stream error:", err);
  let errMsg = "Terjadi kesalahan saat memanggil Gemini API.";
  const errString = String(err.message || JSON.stringify(err));
  if (errString.includes("API key not valid") || errString.includes("API_KEY_INVALID") || errString.includes("INVALID_ARGUMENT")) {
    errMsg = "Kunci API Gemini (GEMINI_API_KEY) Anda tidak valid atau telah kedaluwarsa. Silakan periksa atau perbarui Kunci API Anda di menu Settings > Secrets di pojok kanan atas.";
  } else if (errString.includes("PERMISSION_DENIED")) {
    errMsg = "Akses ditolak (Permission Denied) oleh Gemini API. Pastikan model gemini-3.5-flash diaktifkan untuk Kunci API Anda di menu Settings > Secrets.";
  } else if (errString.includes("RESOURCE_EXHAUSTED") || errString.includes("quota")) {
    errMsg = "Batas kuota Gemini API tercapai (Rate Limit). Silakan coba beberapa saat lagi atau gunakan Kunci API yang mendukung penagihan aktif di menu Settings > Secrets.";
  } else {
    errMsg = `Gagal menghubungi Gemini API: ${errString}`;
  }
  res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
}

app.post("/api/chat/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const { messages, temperature, model = "gemma-4-31b", webSearchEnabled = false } = req.body;
    let systemInstruction = req.body.systemInstruction;

    const linkInstruction = "\n\n[ATURAN PENTING MENGENAI LINK/URL]:\n" +
      "1. JANGAN PERNAH menyingkat/memotong URL atau menggunakan karakter ellipsis (contoh buruk: 'https://drive.google.com/\u2026', 'https://www.dropbox.com/\u2026').\n" +
      "2. Selalu tulis URL lengkap yang valid, benar, dan fungsional dari situs web modern resmi yang bereputasi tinggi (misalnya: 'https://drive.google.com', 'https://www.dropbox.com', 'https://wetransfer.com', 'https://www.pcloud.com').\n" +
      "3. Selalu format link/URL menggunakan format markdown link: `[Teks Deskriptif](URL)` (misalnya: `[Buka Google Drive](https://drive.google.com)`) agar tautan tersebut rapi, profesional, dan dapat diklik secara interaktif oleh pengguna di dalam obrolan.";

    systemInstruction = (systemInstruction || "Anda adalah ExeAi, asisten AI modern yang sangat pintar, ramah, dan solutif.") + linkInstruction;

    if (!messages || !Array.isArray(messages)) {
      res.write(`data: ${JSON.stringify({ error: "Invalid or missing messages array" })}\n\n`);
      return res.end();
    }

    if (model === "gemini-ai" || model === "gemini-3.5-flash" || webSearchEnabled) {
      await streamGemini(messages, systemInstruction, temperature, webSearchEnabled, res);
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

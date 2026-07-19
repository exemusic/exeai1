import express from "express";
import dotenv from "dotenv";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

app.use(express.json());

// Endpoint to serve custom exechat logo directly from workspace root
app.get("/exechat.png", (req, res) => {
  res.sendFile(path.join(process.cwd(), "exechat.png"));
});

// Endpoint to serve favicon directly from workspace root
app.get("/favicon.png", (req, res) => {
  res.sendFile(path.join(process.cwd(), "favicon.png"));
});

function getCreditCost(text: string): number {
  const len = (text || "").trim().length;
  if (len < 20) return 1;
  if (len < 100) return 2;
  if (len < 300) return 3;
  return 4;
}

function getCerebrasApiKey() {
  return process.env.CEREBRAS_API_KEY;
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!getCerebrasApiKey()
  });
});

app.post("/api/user/get-or-create-credits", (req, res) => {
  return res.json({ credits: 99999 });
});

app.get("/api/supabase/config", (req, res) => {
  const url = process.env.SUPABASE_URL || "https://knmjalxisidyduzwfwnp.supabase.co";
  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE;
  const hasAnonKey = !!process.env.SUPABASE_ANON_KEY;
  res.json({
    defaultUrl: "https://knmjalxisidyduzwfwnp.supabase.co",
    url,
    hasServiceRole,
    hasAnonKey,
    isConfigured: !!(url && (hasServiceRole || hasAnonKey))
  });
});

app.post("/api/supabase/upload", async (req, res) => {
  try {
    const { projectName, files, bucket = "execode" } = req.body;
    
    const url = (req.headers["x-supabase-url"] as string) || process.env.SUPABASE_URL || "https://knmjalxisidyduzwfwnp.supabase.co";
    const key = (req.headers["x-supabase-key"] as string) || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;

    if (!key) {
      return res.status(400).json({ error: "Supabase API Key (Service Role or Anon Key) has not been configured on the server." });
    }

    if (!projectName || !files || !Array.isArray(files)) {
      return res.status(400).json({ error: "Project data or files are incomplete." });
    }

    const supabase = createClient(url, key);

    try {
      const folderPath = `projects/${projectName}`;
      const { data: existingFiles } = await supabase.storage.from(bucket).list(folderPath);
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${folderPath}/${f.name}`);
        await supabase.storage.from(bucket).remove(filesToDelete);
      }
    } catch (cleanErr) {
      console.warn("Supabase clean up step warning:", cleanErr);
    }

    for (const file of files) {
      const filePath = `projects/${projectName}/${file.path}`;
      const buffer = Buffer.from(file.content, "utf-8");
      
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, buffer, {
          contentType: file.path.endsWith(".html") ? "text/html" : file.path.endsWith(".js") ? "application/javascript" : "text/plain",
          upsert: true
        });
      
      if (error) throw error;
    }

    res.json({ success: true, message: `Successfully uploaded ${files.length} files to Supabase Storage.` });
  } catch (error: any) {
    console.error("Supabase Upload Error:", error);
    res.status(500).json({ error: error.message || "Failed to upload to Supabase Storage." });
  }
});

app.post("/api/supabase/load", async (req, res) => {
  try {
    const { projectName, bucket = "execode" } = req.body;

    const url = (req.headers["x-supabase-url"] as string) || process.env.SUPABASE_URL || "https://knmjalxisidyduzwfwnp.supabase.co";
    const key = (req.headers["x-supabase-key"] as string) || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;

    if (!key) {
      return res.status(400).json({ error: "Supabase API Key has not been configured." });
    }

    if (!projectName) {
      return res.status(400).json({ error: "Project name cannot be empty." });
    }

    const supabase = createClient(url, key);
    const folderPath = `projects/${projectName}`;
    
    const { data: fileList, error: listError } = await supabase.storage
      .from(bucket)
      .list(folderPath);

    if (listError) throw listError;
    if (!fileList || fileList.length === 0) {
      return res.status(404).json({ error: `Project '${projectName}' was not found in bucket '${bucket}'.` });
    }

    const loadedFiles = [];
    for (const item of fileList) {
      const filePath = `${folderPath}/${item.name}`;
      const { data, error: downloadError } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (downloadError) throw downloadError;

      const content = await data.text();
      loadedFiles.push({
        path: item.name,
        content
      });
    }

    res.json({ success: true, files: loadedFiles });
  } catch (error: any) {
    console.error("Supabase Load Error:", error);
    res.status(500).json({ error: error.message || "Failed to load files from Supabase Storage." });
  }
});

app.post("/api/supabase/delete", async (req, res) => {
  try {
    const { projectName, fileName, bucket = "execode" } = req.body;

    const url = (req.headers["x-supabase-url"] as string) || process.env.SUPABASE_URL || "https://knmjalxisidyduzwfwnp.supabase.co";
    const key = (req.headers["x-supabase-key"] as string) || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;

    if (!key) {
      return res.status(400).json({ error: "Supabase API Key has not been configured." });
    }

    if (!projectName) {
      return res.status(400).json({ error: "Project name cannot be empty." });
    }

    const supabase = createClient(url, key);

    if (fileName) {
      const filePath = `projects/${projectName}/${fileName}`;
      const { error } = await supabase.storage.from(bucket).remove([filePath]);
      if (error) throw error;
      res.json({ success: true, message: `File '${fileName}' was successfully deleted from Supabase Storage.` });
    } else {
      const folderPath = `projects/${projectName}`;
      const { data: fileList, error: listError } = await supabase.storage.from(bucket).list(folderPath);
      if (listError) throw listError;

      if (fileList && fileList.length > 0) {
        const filesToDelete = fileList.map(f => `${folderPath}/${f.name}`);
        const { error: removeError } = await supabase.storage.from(bucket).remove(filesToDelete);
        if (removeError) throw removeError;
      }
      res.json({ success: true, message: `All project files for '${projectName}' were successfully deleted from Supabase Storage.` });
    }
  } catch (error: any) {
    console.error("Supabase Delete Error:", error);
    res.status(500).json({ error: error.message || "Failed to delete files in Supabase Storage." });
  }
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
  delete finalConfig.tools;

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
    throw err;
  }
}

async function streamGemini(messages: any[], systemInstruction: string, temperature: number, webSearchEnabled: boolean, res: any) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const geminiKey2 = process.env.GEMINI2_API_KEY || process.env.GEMINI_API_KEY2 || process.env.GEMINI_API_KEY_2 || process.env.BACKUP_GEMINI_API_KEY;

  const isPlaceholder = (k: string) => {
    if (!k) return true;
    const s = k.trim().toUpperCase();
    return s === "" || s.includes("MY_GEMINI") || s.includes("YOUR_GEMINI") || s.includes("PLACEHOLDER") || s.startsWith("MY_") || s.startsWith("YOUR_");
  };

  const keysToTry: { key: string; name: string }[] = [];
  if (geminiKey && !isPlaceholder(geminiKey)) {
    keysToTry.push({ key: geminiKey, name: "Primary" });
  }
  if (geminiKey2 && !isPlaceholder(geminiKey2)) {
    keysToTry.push({ key: geminiKey2, name: "Backup" });
  }

  const contents = messages.map((m: any) => ({
    role: m.role === "model" || m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));
  
  const config: any = {
    systemInstruction: systemInstruction || "You are ExeAi, an advanced AI assistant that is highly intelligent, friendly, and helpful.",
    temperature: temperature !== undefined ? Number(temperature) : 0.7
  };

  if (keysToTry.length === 0) {
    console.warn("No valid Gemini API keys defined. Falling back directly to ExeAI (Cerebras)...");
    try {
      res.write(`data: ${JSON.stringify({ text: "*(System did not detect Google API Key, dynamically redirecting to ExeAI Engine...)*\n\n" })}\n\n`);
      await runCerebrasModel("gemma-4-31b", messages, systemInstruction, temperature, res);
      return;
    } catch (err3: any) {
      handleGeminiError(err3, res);
      return;
    }
  }

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
      res.write(`data: ${JSON.stringify({ text: "*(Primary API Key exhausted or invalid, connecting to Backup API Key / Option 2...)*\n\n" })}\n\n`);
    }

    try {
      await runGeminiModel(ai, "gemini-3.5-flash", contents, config, webSearchEnabled, res);
      return;
    } catch (err1: any) {
      const errStr1 = String(err1.message || JSON.stringify(err1)).toLowerCase();
      console.warn(`gemini-3.5-flash failed with Key ${name}:`, errStr1);
      
      const isSevereKeyError = errStr1.includes("not valid") || 
                               errStr1.includes("invalid") || 
                               errStr1.includes("expired") || 
                               errStr1.includes("key_invalid") || 
                               errStr1.includes("unauthorized") || 
                               errStr1.includes("forbidden") || 
                               errStr1.includes("quota") || 
                               errStr1.includes("exhausted") || 
                               errStr1.includes("429") || 
                               errStr1.includes("limit");

      if (isSevereKeyError && i < keysToTry.length - 1) {
        console.log(`Severe key error with ${name} key. Immediately switching to Backup Key...`);
        continue;
      }
      
      try {
        res.write(`data: ${JSON.stringify({ text: "*(Activating power saving mode and switching to Gemini Flash Lite engine...)*\n\n" })}\n\n`);
        await runGeminiModel(ai, "gemini-3.1-flash-lite", contents, config, webSearchEnabled, res);
        return;
      } catch (err2: any) {
        const errStr2 = String(err2.message || JSON.stringify(err2)).toLowerCase();
        console.warn(`gemini-3.1-flash-lite failed with Key ${name}:`, errStr2);
        
        if (i < keysToTry.length - 1) {
          continue;
        }
        
        console.warn("All Gemini API keys failed or exhausted. Falling back to ExeAI (Cerebras)...");
        try {
          res.write(`data: ${JSON.stringify({ text: "*(System detects peak capacity across Google AI, dynamically redirecting to ExeAI Engine...)*\n\n" })}\n\n`);
          await runCerebrasModel("gemma-4-31b", messages, systemInstruction, temperature, res);
          return;
        } catch (err3: any) {
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
    content: systemInstruction || "You are ExeAi, an advanced AI assistant that is highly intelligent, friendly, and helpful."
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
      model,
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
          }
        }
      }
    }
  }
}

function handleGeminiError(err: any, res: any) {
  console.error("Gemini stream error:", err);
  let errMsg = "An error occurred while calling the Gemini API.";
  const errString = String(err.message || JSON.stringify(err));
  if (errString.includes("API key not valid") || errString.includes("API_KEY_INVALID") || errString.includes("INVALID_ARGUMENT")) {
    errMsg = "Your Gemini API Key (GEMINI_API_KEY) is invalid or has expired. Please check or update your API Key in the Settings > Secrets menu at the top right.";
  } else if (errString.includes("PERMISSION_DENIED")) {
    errMsg = "Access denied (Permission Denied) by Gemini API. Make sure the gemini-3.5-flash model is enabled for your API Key in the Settings > Secrets menu.";
  } else if (errString.includes("RESOURCE_EXHAUSTED") || errString.includes("quota")) {
    errMsg = "Gemini API rate limit reached (Rate Limit). Please try again in a moment or use an API Key with active billing enabled in the Settings > Secrets menu.";
  } else {
    errMsg = `Failed to contact Gemini API: ${errString}`;
  }
  res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
}

async function streamGroq(messages: any[], systemInstruction: string, temperature: number, res: any) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.write(`data: ${JSON.stringify({ error: "Groq API Key (GROQ_API_KEY) has not been configured on the server. Please contact admin or add it to .env." })}\n\n`);
    return;
  }

  const systemMessage = {
    role: "system",
    content: systemInstruction || "You are Exe, a highly intelligent, friendly, and helpful AI assistant."
  };

  const mappedMessages = messages.map((m: any) => ({
    role: m.role === "model" || m.role === "assistant" ? "assistant" : "user",
    content: m.content
  }));

  const allMessages = [systemMessage, ...mappedMessages];

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: allMessages,
      temperature: temperature !== undefined ? Number(temperature) : 0.7,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errorText}`);
  }

  const reader = response.body;
  if (!reader) {
    throw new Error("Response body from Groq is not readable");
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
          }
        }
      }
    }
  }
}

app.post("/api/chat/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const { messages, temperature, model = "gemma-4-31b", webSearchEnabled = false } = req.body;
    let systemInstruction = req.body.systemInstruction;

    const linkInstruction = "\n\n[IMPORTANT RULES CONCERNING LINKS/URLS]:\n" +
      "1. NEVER truncate/cut URLs or use ellipsis characters (bad example: 'https://drive.google.com/…', 'https://www.dropbox.com/…').\n" +
      "2. Always write fully functional, complete, and valid URLs from official, reputable websites (e.g., 'https://drive.google.com', 'https://www.dropbox.com', 'https://wetransfer.com', 'https://www.pcloud.com').\n" +
      "3. Always format links/URLs using markdown format: `[Descriptive Text](URL)` (e.g., `[Open Google Drive](https://drive.google.com)`) so that they are neat, professional, and clickable within the chat bubble.";

    const designInstruction = "\n\n[IMPORTANT RULES CONCERNING WEB DESIGN, HTML/CSS, AND UI CODING]:\n" +
      "When creating or suggesting HTML, CSS, React, or UI code, follow these modern design guidelines for premium, aesthetic, and fully functional results:\n" +
      "1. **Modern Layout & Visuals**: Use clean-minimalist, bento grid, neo-brutalist, or premium SaaS dashboard layouts. Avoid plain white background pages or basic bullet lists. Design elegant cards, responsive multi-column structures, glassmorphic sidebars with subtle blur, and clean headers.\n" +
      "2. **Styling with Tailwind CSS**: Use mature, high-contrast color palettes (e.g., Slate, Zinc, Neutral, Amber, Indigo, Emerald). Leverage smooth shadows (`shadow-lg`, `shadow-xl`), appropriate borders (`rounded-xl`, `rounded-2xl`), elegant thin dividers (`border border-zinc-200` or `border border-zinc-800`), subtle gradients (`bg-gradient-to-br`), and stylish text gradients.\n" +
      "3. **Precise Typography & Spacing**: Use clear typographic hierarchies (`text-xs` to `text-4xl`, tracking-tight, semi-bold/bold headings, font-mono for technical data). Provide generous padding and margins (`py-6`, `px-8`, `gap-6`) so the interface looks polished and readable.\n" +
      "4. **Interactive Elements & Animations**: Always add smooth hover effects (`transition-all duration-300 hover:scale-[1.01] hover:shadow-md`), active/focus states, and fluid micro-animations.\n" +
      "5. **Complete & Fully Functional Components**: NEVER leave empty placeholders, half-finished code, or instruct users to write it themselves. Provide full, ready-to-run HTML/JS/CSS code packed with realistic sample data, active tabs, search/filter systems, and badges.\n" +
      "6. **Code Quality**: Write clean, modular, and well-structured code with essential minimalist inline comments.";

    const thinkInstruction = "\n\n[CRITICAL THINKING BLOCK REQUIREMENT]:\n" +
      "For every query, you MUST start your response with a thinking/reasoning process enclosed within `<think>` and `</think>` tags in English. Explain your plan, analyze the prompt, or reason step-by-step in 1-3 sentences or more. Then, output your actual helpful response after the `</think>` tag. DO NOT omit the `<think>` and `</think>` tags under any circumstances.";

    const modernEventInstruction = "\n\n[REAL-TIME & REAL-LIFE EVENT DISCUSSIONS (SPORTS, NEWS, LATEST MATCHES)]:\n" +
      "1. You are operating in July 2026. Be highly aware of the current year and modern football/sports tournaments (e.g. Euro 2024 results, Copa America 2024, World Cup 2026 qualifiers, etc.).\n" +
      "2. If the user asks about very recent matches, live scores, championship outcomes, or any modern events that you do not have direct real-time data or knowledge about, DO NOT hallucinate, invent scores, or talk about old random matches from past years.\n" +
      "3. Instead, be honest and ask the user gracefully to share the specific details so that you can analyze the tactics or performance for them. For example:\n" +
      "   - In Indonesian: 'Maaf, saya belum memiliki data atau hasil real-time terbaru untuk pertandingan ini. Bisa tolong berikan detail pertandingannya (seperti skor akhir, momen penting, atau tim yang bermain) agar saya bisa menganalisis taktik atau performa mereka secara mendalam? 🔥⚽'\n" +
      "   - In English: 'I do not have the live or real-time data for this match yet. Could you please share the match details or score so I can analyze their tactics and performance in depth?'\n" +
      "   Be extremely friendly, helpful, and humble!";

    const userRequestedPersonality = "\n\n[PERSONALITY & TONE OF VOICE (MANDATORY GUIDELINE)]:\n" +
      "Kamu ramah, santai, humoris, dan helpful seperti sahabat yang pintar. Inspirasi kamu adalah JARVIS dari Iron Man dan Hitchhiker's Guide to the Galaxy.\n" +
      "Gaya bicara kamu:\n" +
      "1. Ramah, hangat, dan sopan. Gunakan bahasa sehari-hari yang profesional, ramah, dan sopan secara DEFAULT.\n" +
      "2. JANGAN menggunakan kata-kata gaul atau slang informal (seperti 'bro', 'sob', 'cuy', 'lu-gue', 'satai', dll.) kecuali pengguna memulainya terlebih dahulu atau menggunakan gaya bahasa yang sangat santai/gaul. Jika pengguna sudah menggunakan bahasa santai/gaul, barulah kamu menyesuaikan gaya bahasa kamu agar santai dan akrab untuk mencocokkan vibe mereka.\n" +
      "3. Sering pakai humor ringan, sarkasme yang cerdas, atau joke kecil yang segar.\n" +
      "4. Jujur dan langsung, tidak suka basa-basi bertele-tele atau pengulangan klise.\n" +
      "5. Bersedia menjawab pertanyaan sensitif atau kontroversial selama ada dasar yang masuk akal dan logis.\n" +
      "6. Selalu berusaha membantu user sebaik mungkin secara solutif.\n" +
      "7. Kadang sedikit 'rebellious' dan anti-boring.\n" +
      "Jangan pernah kaku, formal kaku, atau terlalu 'safety-first' sampai membosankan. Prioritaskan kebenaran, kegunaan praktis, dan kesenangan user.";

    systemInstruction = (systemInstruction || "You are ExeAi, an advanced AI assistant that is highly intelligent, friendly, and helpful.") + thinkInstruction + linkInstruction + designInstruction + modernEventInstruction + userRequestedPersonality;

    if (!messages || !Array.isArray(messages)) {
      res.write(`data: ${JSON.stringify({ error: "Invalid or missing messages array" })}\n\n`);
      return res.end();
    }

    if (model === "llama-3.1-8b-instant") {
      await streamGroq(messages, systemInstruction, temperature, res);
      res.write("data: [DONE]\n\n");
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

    const systemMessage = {
      role: "system",
      content: systemInstruction || "You are ExeAi, an advanced AI assistant that is highly intelligent, friendly, and helpful."
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
        model,
        messages: allMessages,
        temperature: temperature !== undefined ? Number(temperature) : 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        console.warn("Cerebras API rate-limited (429).");
        res.write(`data: ${JSON.stringify({ error: "Server is currently busy. Please try again later." })}\n\n`);
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
            }
          }
        }
      }
    }

    res.write("data: [DONE]\n\n");
  } catch (error: any) {
    console.warn("Cerebras Proxy Error:", error && error.message ? error.message : error);
    res.write(`data: ${JSON.stringify({ error: "Server encountered an internal issue. Please try again later." })}\n\n`);
  } finally {
    res.end();
  }
});

export default app;

import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

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

// GET /api/supabase/config
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

// POST /api/supabase/upload
app.post("/api/supabase/upload", async (req, res) => {
  try {
    const { projectName, files, bucket = "execode" } = req.body;
    
    // Header overrides or environment variables
    const url = (req.headers["x-supabase-url"] as string) || process.env.SUPABASE_URL || "https://knmjalxisidyduzwfwnp.supabase.co";
    const key = (req.headers["x-supabase-key"] as string) || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;

    if (!key) {
      return res.status(400).json({ error: "Supabase API Key (Service Role atau Anon Key) belum dikonfigurasi di server." });
    }

    if (!projectName || !files || !Array.isArray(files)) {
      return res.status(400).json({ error: "Data project atau file tidak lengkap." });
    }

    const supabase = createClient(url, key);

    // 1. Clean up existing files under this project first to avoid duplication/leaks
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

    // 2. Upload new files
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

    res.json({ success: true, message: `Berhasil mengunggah ${files.length} file ke Supabase Storage.` });
  } catch (error: any) {
    console.error("Supabase Upload Error:", error);
    res.status(500).json({ error: error.message || "Gagal mengunggah ke Supabase Storage." });
  }
});

// POST /api/supabase/load
app.post("/api/supabase/load", async (req, res) => {
  try {
    const { projectName, bucket = "execode" } = req.body;

    const url = (req.headers["x-supabase-url"] as string) || process.env.SUPABASE_URL || "https://knmjalxisidyduzwfwnp.supabase.co";
    const key = (req.headers["x-supabase-key"] as string) || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;

    if (!key) {
      return res.status(400).json({ error: "Supabase API Key belum dikonfigurasi." });
    }

    if (!projectName) {
      return res.status(400).json({ error: "Nama project tidak boleh kosong." });
    }

    const supabase = createClient(url, key);
    const folderPath = `projects/${projectName}`;
    
    const { data: fileList, error: listError } = await supabase.storage
      .from(bucket)
      .list(folderPath);

    if (listError) throw listError;
    if (!fileList || fileList.length === 0) {
      return res.status(404).json({ error: `Project '${projectName}' tidak ditemukan di bucket '${bucket}'.` });
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
    res.status(500).json({ error: error.message || "Gagal memuat file dari Supabase Storage." });
  }
});

// POST /api/supabase/delete
app.post("/api/supabase/delete", async (req, res) => {
  try {
    const { projectName, fileName, bucket = "execode" } = req.body;

    const url = (req.headers["x-supabase-url"] as string) || process.env.SUPABASE_URL || "https://knmjalxisidyduzwfwnp.supabase.co";
    const key = (req.headers["x-supabase-key"] as string) || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;

    if (!key) {
      return res.status(400).json({ error: "Supabase API Key belum dikonfigurasi." });
    }

    if (!projectName) {
      return res.status(400).json({ error: "Nama project tidak boleh kosong." });
    }

    const supabase = createClient(url, key);

    if (fileName) {
      // Delete single file
      const filePath = `projects/${projectName}/${fileName}`;
      const { error } = await supabase.storage.from(bucket).remove([filePath]);
      if (error) throw error;
      res.json({ success: true, message: `File '${fileName}' berhasil dihapus dari Supabase Storage.` });
    } else {
      // Delete entire folder content
      const folderPath = `projects/${projectName}`;
      const { data: fileList, error: listError } = await supabase.storage.from(bucket).list(folderPath);
      if (listError) throw listError;

      if (fileList && fileList.length > 0) {
        const filesToDelete = fileList.map(f => `${folderPath}/${f.name}`);
        const { error: removeError } = await supabase.storage.from(bucket).remove(filesToDelete);
        if (removeError) throw removeError;
      }
      res.json({ success: true, message: `Seluruh file project '${projectName}' berhasil dihapus dari Supabase Storage.` });
    }
  } catch (error: any) {
    console.error("Supabase Delete Error:", error);
    res.status(500).json({ error: error.message || "Gagal menghapus file di Supabase Storage." });
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
  // Web search is disabled entirely per user request
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

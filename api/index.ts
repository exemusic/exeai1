import express from "express";
import dotenv from "dotenv";
import path from "path";
import * as crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Endpoint to serve custom exechat logo directly from workspace root
app.get("/exechat.png", (req, res) => {
  res.sendFile(path.join(process.cwd(), "exechat.png"));
});

// Endpoint to serve favicon directly from workspace root
app.get("/favicon.png", (req, res) => {
  res.sendFile(path.join(process.cwd(), "favicon.png"));
});

// Serve favicon.ico requests with the PNG favicon to avoid index.html fallback
app.get("/favicon.ico", (req, res) => {
  res.type("image/png");
  res.sendFile(path.join(process.cwd(), "favicon.png"));
});

// Serve apple-touch-icon.png requests
app.get("/apple-touch-icon.png", (req, res) => {
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

// --- COOKIE ENCRYPTION HELPERS & ENDPOINTS ---
const COOKIE_KEY_SEED = process.env.COOKIE_ENCRYPTION_KEY || "exechat_secure_cookie_key_seed_2026";
// Hash the seed to get a proper 32-byte key for AES-256
const ENCRYPTION_KEY = crypto.createHash("sha256").update(COOKIE_KEY_SEED).digest();
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text: string): string {
  try {
    const textParts = text.split(":");
    const ivHex = textParts.shift();
    if (!ivHex) return "";
    const iv = Buffer.from(ivHex, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.warn("Failed to decrypt cookie value:", err);
    return "";
  }
}

// Set Encrypted Cookie Endpoint
app.post("/api/cookie/set", (req, res) => {
  try {
    const { name, value, maxAgeDays = 30 } = req.body;
    if (!name || value === undefined) {
      return res.status(400).json({ error: "Missing cookie name or value" });
    }
    const encryptedValue = encrypt(String(value));
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
    res.setHeader("Set-Cookie", `${name}=${encodeURIComponent(encryptedValue)}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax`);
    res.json({ success: true, message: `Cookie '${name}' set successfully.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to set cookie" });
  }
});

// Get Encrypted Cookie Endpoint
app.post("/api/cookie/get", (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Missing cookie name" });
    }
    const rawCookies = req.headers.cookie;
    const cookies: Record<string, string> = {};
    if (rawCookies) {
      rawCookies.split(";").forEach(c => {
        const parts = c.split("=");
        cookies[parts.shift()!.trim()] = decodeURIComponent(parts.join("="));
      });
    }
    const encryptedValue = cookies[name];
    if (!encryptedValue) {
      return res.json({ value: null });
    }
    const decryptedValue = decrypt(encryptedValue);
    res.json({ value: decryptedValue });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to get cookie" });
  }
});

// Clear Cookie Endpoint
app.post("/api/cookie/clear", (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Missing cookie name" });
    }
    res.setHeader("Set-Cookie", `${name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`);
    res.json({ success: true, message: `Cookie '${name}' cleared.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to clear cookie" });
  }
});

// --- SUPABASE PERMANENT DATABASE ROUTING ---
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || "https://knmjalxisidyduzwfwnp.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;
  if (!key) return null;
  return createClient(url, key);
}

// Endpoint to save complete user profile and chats
app.post("/api/db/save-all", async (req, res) => {
  try {
    const { uid, email, username, displayName, sessions, language } = req.body;
    if (!uid) {
      return res.status(400).json({ error: "Missing user uid" });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(400).json({ error: "Supabase client not configured." });
    }

    const payload = {
      uid,
      email,
      username,
      displayName,
      sessions,
      language,
      updatedAt: Date.now()
    };

    const fileContent = JSON.stringify(payload, null, 2);
    const buffer = Buffer.from(fileContent, "utf-8");
    const bucket = "execode";
    const filePath = `database/user_db_${uid}.json`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: "application/json",
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    res.json({ success: true, message: "All user permanent data successfully saved in Supabase database." });
  } catch (err: any) {
    console.error("Supabase DB Save Error:", err);
    res.status(500).json({ error: err.message || "Failed to save data to Supabase database." });
  }
});

// Endpoint to load user profile and chats
app.post("/api/db/load-all", async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ error: "Missing user uid" });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(400).json({ error: "Supabase client not configured." });
    }

    const bucket = "execode";
    const filePath = `database/user_db_${uid}.json`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (error) {
      if (error.message?.includes("Object not found") || (error as any).status === 404) {
        return res.json({ found: false });
      }
      throw error;
    }

    const textContent = await data.text();
    const parsedData = JSON.parse(textContent);

    res.json({ found: true, data: parsedData });
  } catch (err: any) {
    console.error("Supabase DB Load Error:", err);
    res.status(500).json({ error: err.message || "Failed to load data from Supabase database." });
  }
});

// Endpoint to clear user data completely from permanent database
app.post("/api/db/clear-all", async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ error: "Missing user uid" });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(400).json({ error: "Supabase client not configured." });
    }

    const bucket = "execode";
    const dbPath = `database/user_db_${uid}.json`;

    await supabase.storage.from(bucket).remove([dbPath]);

    try {
      const { data: folderContents } = await supabase.storage.from(bucket).list(`projects`);
      if (folderContents && folderContents.length > 0) {
        const filesToDelete = folderContents
          .filter(item => item.name.includes(uid) || item.name.startsWith(uid))
          .map(item => `projects/${item.name}`);
        
        if (filesToDelete.length > 0) {
          await supabase.storage.from(bucket).remove(filesToDelete);
        }
      }
    } catch (folderErr) {
      console.warn("Folder cleanup warning:", folderErr);
    }

    res.json({ success: true, message: "User permanent database completely purged." });
  } catch (err: any) {
    console.error("Supabase DB Clear Error:", err);
    res.status(500).json({ error: err.message || "Failed to clear database." });
  }
});

// Endpoint to fetch storage capacity metrics for settings
app.post("/api/db/metrics", async (req, res) => {
  try {
    const { uid } = req.body;
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.json({ connected: false, totalBytes: 0, limitBytes: 52428800 });
    }

    let totalBytes = 0;
    const bucket = "execode";

    if (uid) {
      const { data, error } = await supabase.storage.from(bucket).list("database");
      if (data) {
        const file = data.find(item => item.name === `user_db_${uid}.json`);
        if (file) {
          totalBytes += file.metadata?.size || (file as any).size || 0;
        }
      }

      const { data: projectFiles } = await supabase.storage.from(bucket).list(`projects`);
      if (projectFiles) {
        projectFiles.forEach(f => {
          if (f.name.includes(uid) || f.name.startsWith(uid)) {
            totalBytes += f.metadata?.size || (f as any).size || 0;
          }
        });
      }
    }

    res.json({
      connected: true,
      totalBytes,
      limitBytes: 52428800,
      formattedSize: (totalBytes / 1024).toFixed(2) + " KB"
    });
  } catch (err) {
    res.json({ connected: false, totalBytes: 0, limitBytes: 52428800 });
  }
});

// --- ADMIN & FEEDBACK SYSTEM ENDPOINTS ---
app.post("/api/feedback/submit", async (req, res) => {
  try {
    const { email, message, attachment } = req.body;
    if (!email || !message) {
      return res.status(400).json({ error: "Email and message are required fields." });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(400).json({ error: "Supabase client not configured." });
    }

    const bucket = "execode";
    
    // 1. SPAM PROTECTION CHECK (30-minute delay per Google account stored securely in Supabase)
    const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, "_");
    const timerPath = `feedback_timers/${sanitizedEmail}.json`;

    try {
      const { data: timerData } = await supabase.storage
        .from(bucket)
        .download(timerPath);

      if (timerData) {
        const textContent = await timerData.text();
        const parsedTimer = JSON.parse(textContent);
        if (parsedTimer && parsedTimer.lastSubmittedAt) {
          const elapsed = Date.now() - parsedTimer.lastSubmittedAt;
          const waitTimeLimit = 30 * 60 * 1000; // 30 minutes in milliseconds
          if (elapsed < waitTimeLimit) {
            const minutesLeft = Math.ceil((waitTimeLimit - elapsed) / 1000 / 60);
            return res.status(429).json({
              error: `Spam Protection: You can only send 1 feedback every 30 minutes. Please wait ${minutesLeft} minute(s) before trying again.`
            });
          }
        }
      }
    } catch (err: any) {
      // If timer file doesn't exist, it is fine to proceed
      if (!err.message?.includes("Object not found") && err.status !== 404) {
        console.warn("Feedback timer load error (non-fatal):", err);
      }
    }

    // 2. PROCESS FILE ATTACHMENT
    let attachmentUrl = null;
    let attachmentName = null;
    
    if (attachment && attachment.base64 && attachment.name) {
      // Decode Base64
      let base64Data = attachment.base64;
      if (base64Data.includes(";base64,")) {
        base64Data = base64Data.split(";base64,").pop();
      }
      const buffer = Buffer.from(base64Data, "base64");
      
      const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const safeFileName = attachment.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const attachmentPath = `feedback_attachments/${fileId}_${safeFileName}`;

      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(attachmentPath, buffer, {
          contentType: attachment.type || "application/octet-stream",
          upsert: true
        });

      if (uploadErr) {
        throw uploadErr;
      }

      // Generate public/download URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(attachmentPath);

      attachmentUrl = publicUrlData?.publicUrl || `/api/feedback/attachment?path=${encodeURIComponent(attachmentPath)}`;
      attachmentName = attachment.name;
    }

    // 3. WRITE THE FEEDBACK TO STORAGE
    const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const feedbackPayload = {
      id: feedbackId,
      email,
      message,
      attachmentUrl,
      attachmentName,
      timestamp: Date.now()
    };

    const fbBuffer = Buffer.from(JSON.stringify(feedbackPayload, null, 2), "utf-8");
    const feedbackPath = `feedback/${feedbackId}.json`;

    const { error: writeErr } = await supabase.storage
      .from(bucket)
      .upload(feedbackPath, fbBuffer, {
        contentType: "application/json",
        upsert: true
      });

    if (writeErr) {
      throw writeErr;
    }

    // 4. UPDATE SPAM TIMER
    const timerPayload = { lastSubmittedAt: Date.now() };
    const timerBuffer = Buffer.from(JSON.stringify(timerPayload, null, 2), "utf-8");
    await supabase.storage
      .from(bucket)
      .upload(timerPath, timerBuffer, {
        contentType: "application/json",
        upsert: true
      });

    res.json({ success: true, message: "Thank you! Your feedback has been sent successfully." });
  } catch (error: any) {
    console.error("Feedback submission error:", error);
    res.status(500).json({ error: error.message || "Failed to submit feedback. Please try again later." });
  }
});

// Endpoint to fetch feedback attachments
app.get("/api/feedback/attachment", async (req, res) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ error: "Missing attachment path." });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(400).json({ error: "Supabase client not configured." });
    }

    const bucket = "execode";
    const { data, error } = await supabase.storage.from(bucket).download(filePath);
    
    if (error) {
      throw error;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    res.send(buffer);
  } catch (error: any) {
    console.error("Error retrieving feedback attachment:", error);
    res.status(500).send("Error retrieving feedback attachment.");
  }
});

// List feedbacks for owner (nairicintia@gmail.com or opengsukadiaa@gmail.com)
app.post("/api/feedback/list", async (req, res) => {
  try {
    const { email } = req.body;
    const isOwner = email === "nairicintia@gmail.com" || email === "opengsukadiaa@gmail.com";
    if (!isOwner) {
      return res.status(403).json({ error: "Forbidden: You are not authorized to access this panel." });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(400).json({ error: "Supabase client not configured." });
    }

    const bucket = "execode";
    const { data: fileList, error: listError } = await supabase.storage
      .from(bucket)
      .list("feedback");

    if (listError) {
      throw listError;
    }

    const feedbacks: any[] = [];
    if (fileList && fileList.length > 0) {
      const sortedFiles = fileList
        .filter(f => f.name.endsWith(".json"))
        .sort((a, b) => b.name.localeCompare(a.name))
        .slice(0, 100);

      for (const file of sortedFiles) {
        try {
          const { data: fileData } = await supabase.storage
            .from(bucket)
            .download(`feedback/${file.name}`);

          if (fileData) {
            const textContent = await fileData.text();
            const parsed = JSON.parse(textContent);
            feedbacks.push(parsed);
          }
        } catch (readErr) {
          console.warn(`Failed to read feedback file: ${file.name}`, readErr);
        }
      }
    }

    res.json({ success: true, feedbacks: feedbacks.sort((a, b) => b.timestamp - a.timestamp) });
  } catch (error: any) {
    console.error("Feedback list load error:", error);
    res.status(500).json({ error: error.message || "Failed to load feedback list." });
  }
});

// Delete feedback (for nairicintia@gmail.com or opengsukadiaa@gmail.com)
app.post("/api/feedback/delete", async (req, res) => {
  try {
    const { email, feedbackId } = req.body;
    const isOwner = email === "nairicintia@gmail.com" || email === "opengsukadiaa@gmail.com";
    if (!isOwner) {
      return res.status(403).json({ error: "Forbidden: You are not authorized to perform this action." });
    }
    if (!feedbackId) {
      return res.status(400).json({ error: "Feedback ID is required." });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(400).json({ error: "Supabase client not configured." });
    }

    const bucket = "execode";
    const feedbackPath = `feedback/${feedbackId}.json`;

    // 1. Try to download the feedback JSON to see if there is an attachment to delete
    let attachmentPathToDelete: string | null = null;
    try {
      const { data: fileData } = await supabase.storage
        .from(bucket)
        .download(feedbackPath);

      if (fileData) {
        const textContent = await fileData.text();
        const parsed = JSON.parse(textContent);
        if (parsed && parsed.attachmentUrl) {
          // Extract feedback_attachments/ path
          const match = parsed.attachmentUrl.match(/feedback_attachments\/[^?]+/);
          if (match) {
            attachmentPathToDelete = decodeURIComponent(match[0]);
          } else if (parsed.attachmentUrl.includes("path=")) {
            // Check query param
            const parts = parsed.attachmentUrl.split("path=");
            if (parts.length > 1) {
              const decodedPath = decodeURIComponent(parts[1].split("&")[0]);
              if (decodedPath.startsWith("feedback_attachments/")) {
                attachmentPathToDelete = decodedPath;
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn(`Failed to inspect feedback attachment for delete (non-fatal): ${feedbackId}`, err);
    }

    // 2. Delete attachment if found
    if (attachmentPathToDelete) {
      try {
        await supabase.storage.from(bucket).remove([attachmentPathToDelete]);
        console.log(`Deleted feedback attachment: ${attachmentPathToDelete}`);
      } catch (attErr) {
        console.warn(`Failed to delete attachment: ${attachmentPathToDelete}`, attErr);
      }
    }

    // 3. Delete feedback JSON file
    const { error: removeErr } = await supabase.storage
      .from(bucket)
      .remove([feedbackPath]);

    if (removeErr) {
      throw removeErr;
    }

    res.json({ success: true, message: "Feedback and its attachments have been successfully deleted." });
  } catch (error: any) {
    console.error("Feedback delete error:", error);
    res.status(500).json({ error: error.message || "Failed to delete feedback." });
  }
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
  res: any,
  stripFirstThinkTag: boolean = false,
  onConnect?: (duration: number) => void
): Promise<boolean> {
  const finalConfig = { ...config };
  delete finalConfig.tools;

  const startTime = Date.now();
  try {
    const responseStream = await ai.models.generateContentStream({
      model: modelName,
      contents: contents,
      config: finalConfig
    });

    let isFirstChunk = true;
    for await (const chunk of responseStream) {
      if (isFirstChunk) {
        isFirstChunk = false;
        const duration = Date.now() - startTime;
        if (onConnect) {
          onConnect(duration);
        }
      }
      let text = chunk.text;
      if (text) {
        if (stripFirstThinkTag) {
          // Clean up the initial <think> tag if it is present in the beginning of the text
          const hasThink = text.match(/^[\s\n]*<think>[\s\n]*/i);
          if (hasThink) {
            text = text.replace(/^[\s\n]*<think>[\s\n]*/i, "");
            stripFirstThinkTag = false; // Turned off since we've stripped it
          }
        }
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
    return true;
  } catch (err: any) {
    const errString = String(err.message || JSON.stringify(err));
    console.warn(`Gemini model ${modelName} failed with error:`, errString);
    throw err;
  }
}

function parseBase64(dataUrl: string) {
  if (!dataUrl) return null;
  const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches) return null;
  return {
    mimeType: matches[1],
    data: matches[2]
  };
}

async function analyzeImageWithGemini(base64DataUrl: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GEMINI2_API_KEY || process.env.GEMINI_API_KEY2 || process.env.GEMINI_API_KEY_2 || process.env.BACKUP_GEMINI_API_KEY;
  if (!geminiKey) {
    return "[Gagal menganalisis gambar: API Key tidak terkonfigurasi]";
  }
  const parsed = parseBase64(base64DataUrl);
  if (!parsed) {
    return "[Gagal menganalisis gambar: Format Base64 tidak valid]";
  }
  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Berikan deskripsi detail tentang gambar ini untuk asisten AI teks. Jelaskan semua objek, teks, warna, tata letak, dan konteks penting yang ada di gambar secara mendalam agar asisten teks dapat memahaminya seperti melihat langsung." },
            {
              inlineData: {
                mimeType: parsed.mimeType,
                data: parsed.data
              }
            }
          ]
        }
      ]
    });
    return response.text || "[Gambar terlampir kosong atau tidak terbaca]";
  } catch (err: any) {
    console.warn("Error analyzing image with Gemini:", err);
    return `[Gagal menganalisis gambar: ${err.message || err}]`;
  }
}

async function streamGemini(
  messages: any[],
  systemInstruction: string,
  temperature: number,
  webSearchEnabled: boolean,
  res: any,
  redirectedForImage: boolean = false
) {
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

  const contents = messages.map((m: any) => {
    const parts: any[] = [{ text: m.content }];
    if (m.attachment && m.attachment.type === "image" && m.attachment.base64) {
      const parsed = parseBase64(m.attachment.base64);
      if (parsed) {
        parts.push({
          inlineData: {
            mimeType: parsed.mimeType,
            data: parsed.data
          }
        });
      }
    }
    return {
      role: m.role === "model" || m.role === "assistant" ? "model" : "user",
      parts: parts
    };
  });
  
  const config: any = {
    systemInstruction: systemInstruction || "You are ExeAi, an advanced AI assistant that is highly intelligent, friendly, and helpful.",
    temperature: temperature !== undefined ? Number(temperature) : 0.7
  };

  // Start the thinking block
  let thinkText = "<think>[Sistem ExeAI] Memulai koneksi...\n";
  if (redirectedForImage) {
    thinkText = "<think>[Sistem ExeAI] Mendeteksi file gambar terlampir.\n• Mengalihkan rute pemrosesan secara otomatis ke Gemini Vision Engine...\n";
  } else {
    thinkText = "<think>[Sistem ExeAI] Menghubungkan ke Gemini Engine...\n";
  }
  res.write(`data: ${JSON.stringify({ text: thinkText })}\n\n`);

  if (keysToTry.length === 0) {
    console.warn("No valid Gemini API keys defined. Falling back directly to ExeAI (Cerebras)...");
    try {
      res.write(`data: ${JSON.stringify({ text: "• Gagal: Google API Key tidak terkonfigurasi di server.\n• Mengalihkan rute secara dinamis ke ExeAI Engine...\n</think>\n\n*(System did not detect Google API Key, dynamically redirecting to ExeAI Engine...)*\n\n" })}\n\n`);
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
    const keyLabel = isBackup ? "Cadangan (Opsi 2)" : "Utama (Opsi 1)";
    
    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    res.write(`data: ${JSON.stringify({ text: `• Menghubungkan dengan API Key ${keyLabel}...\n` })}\n\n`);

    // Model 1: gemini-3.5-flash (with up to 2 retry attempts)
    let successModel1 = false;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const model1Start = Date.now();
      const attemptLabel = attempt > 1 ? ` (Percobaan ${attempt})` : "";
      res.write(`data: ${JSON.stringify({ text: `  - Mencoba menghubungkan ke model: gemini-3.5-flash${attemptLabel}...\n` })}\n\n`);
      try {
        await runGeminiModel(ai, "gemini-3.5-flash", contents, config, webSearchEnabled, res, true, (duration) => {
          res.write(`data: ${JSON.stringify({ text: `  - [Sukses] Terhubung ke gemini-3.5-flash dalam ${duration}ms.\n  - [Sistem] Memulai analisis visual dan pemrosesan jawaban...\n\n` })}\n\n`);
        });
        successModel1 = true;
        break;
      } catch (err1: any) {
        const duration1 = Date.now() - model1Start;
        const errStr1 = String(err1.message || JSON.stringify(err1));
        res.write(`data: ${JSON.stringify({ text: `  - [Gagal] gemini-3.5-flash${attemptLabel} (${duration1}ms): ${errStr1.substring(0, 100)}\n` })}\n\n`);
        
        const isSevereKeyError = errStr1.toLowerCase().includes("not valid") || 
                                 errStr1.toLowerCase().includes("invalid") || 
                                 errStr1.toLowerCase().includes("expired") || 
                                 errStr1.toLowerCase().includes("key_invalid") || 
                                 errStr1.toLowerCase().includes("unauthorized") || 
                                 errStr1.toLowerCase().includes("forbidden") || 
                                 errStr1.toLowerCase().includes("quota") || 
                                 errStr1.toLowerCase().includes("exhausted") || 
                                 errStr1.toLowerCase().includes("429") || 
                                 errStr1.toLowerCase().includes("limit");

        if (isSevereKeyError) {
          if (i < keysToTry.length - 1) {
            res.write(`data: ${JSON.stringify({ text: `  - [Sistem] Masalah kredensial/kuota terdeteksi pada kunci ${keyLabel}. Segera beralih ke kunci cadangan...\n` })}\n\n`);
          }
          break; // Stop attempts for this key, proceed to next key
        }

        if (attempt < 2) {
          res.write(`data: ${JSON.stringify({ text: `  - [Sistem] Terjadi kesalahan sementara (misal: beban tinggi / 503). Menunggu 800ms sebelum mencoba kembali...\n` })}\n\n`);
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
    }

    if (successModel1) return;

    // Model 2: gemini-3.1-flash-lite (with up to 2 retry attempts)
    let successModel2 = false;
    for (let attempt2 = 1; attempt2 <= 2; attempt2++) {
      const model2Start = Date.now();
      const attemptLabel2 = attempt2 > 1 ? ` (Percobaan ${attempt2})` : "";
      res.write(`data: ${JSON.stringify({ text: `  - Mencoba rute alternatif model: gemini-3.1-flash-lite${attemptLabel2}...\n` })}\n\n`);
      try {
        await runGeminiModel(ai, "gemini-3.1-flash-lite", contents, config, webSearchEnabled, res, true, (duration) => {
          res.write(`data: ${JSON.stringify({ text: `  - [Sukses] Terhubung ke gemini-3.1-flash-lite dalam ${duration}ms.\n  - [Sistem] Memulai analisis visual alternatif...\n\n` })}\n\n`);
        });
        successModel2 = true;
        break;
      } catch (err2: any) {
        const duration2 = Date.now() - model2Start;
        const errStr2 = String(err2.message || JSON.stringify(err2));
        res.write(`data: ${JSON.stringify({ text: `  - [Gagal] gemini-3.1-flash-lite${attemptLabel2} (${duration2}ms): ${errStr2.substring(0, 100)}\n` })}\n\n`);
        
        const isSevereKeyError = errStr2.toLowerCase().includes("not valid") || 
                                 errStr2.toLowerCase().includes("invalid") || 
                                 errStr2.toLowerCase().includes("expired") || 
                                 errStr2.toLowerCase().includes("key_invalid") || 
                                 errStr2.toLowerCase().includes("unauthorized") || 
                                 errStr2.toLowerCase().includes("forbidden") || 
                                 errStr2.toLowerCase().includes("quota") || 
                                 errStr2.toLowerCase().includes("exhausted") || 
                                 errStr2.toLowerCase().includes("429") || 
                                 errStr2.toLowerCase().includes("limit");

        if (isSevereKeyError) {
          if (i < keysToTry.length - 1) {
            res.write(`data: ${JSON.stringify({ text: `  - [Sistem] Masalah kredensial/kuota terdeteksi pada kunci ${keyLabel} selama rute alternatif. Beralih ke kunci cadangan...\n` })}\n\n`);
          }
          break; // Stop attempts for this key, proceed to next key
        }

        if (attempt2 < 2) {
          res.write(`data: ${JSON.stringify({ text: `  - [Sistem] Terjadi kesalahan sementara (misal: beban tinggi / 503). Menunggu 800ms sebelum mencoba kembali...\n` })}\n\n`);
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
    }

    if (successModel2) return;

    if (i < keysToTry.length - 1) {
      res.write(`data: ${JSON.stringify({ text: `  - [Sistem] Seluruh model gagal pada kunci ini. Mencoba kunci API alternatif...\n` })}\n\n`);
      continue;
    }
    
    // If everything failed on Gemini, fallback to Cerebras
    res.write(`data: ${JSON.stringify({ text: `• [Sistem] Seluruh opsi Gemini gagal atau habis kuota.\n• Mengalihkan ke ExeAI (Cerebras) sebagai fallback terakhir...\n</think>\n\n*(System detected Google API Key issues, dynamically redirecting to ExeAI Engine...)*\n\n` })}\n\n`);
    try {
      await runCerebrasModel("gemma-4-31b", messages, systemInstruction, temperature, res);
      return;
    } catch (errCerebras: any) {
      handleGeminiError(errCerebras, res);
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
  console.warn("Gemini stream error:", err);
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

    const imageLimitInstruction = "\n\n[PENTING - BATASAN KEMAMPUAN GAMBAR & EDIT FOTO]:\n" +
      "1. ExeChat saat ini HANYA merupakan AI khusus teks (text-only AI) dan masih dalam masa BETA (belum dirilis penuh secara komersial).\n" +
      "2. ExeChat/Hexky TIDAK memproduksi AI pembuat atau pengedit gambar (tidak bisa generate gambar atau edit foto).\n" +
      "3. Jika pengguna meminta untuk mengedit foto, memodifikasi gambar, menghasilkan gambar baru (generate image), atau sejenisnya, kamu harus menjelaskan batas kemampuan ini dengan sangat sopan, ramah, jujur, dan profesional.\n" +
      "4. Kamu bisa membaca/menganalisis gambar yang diunggah pengguna (menggunakan bantuan sistem analisis gambar), namun kamu tidak bisa mengedit atau memodifikasi file gambar tersebut.\n" +
      "5. Tanggal hari ini adalah Monday, July 20, 2026.";

    systemInstruction = (systemInstruction || "You are ExeAi, an advanced AI assistant that is highly intelligent, friendly, and helpful.") + thinkInstruction + linkInstruction + designInstruction + modernEventInstruction + userRequestedPersonality + imageLimitInstruction;

    if (!messages || !Array.isArray(messages)) {
      res.write(`data: ${JSON.stringify({ error: "Invalid or missing messages array" })}\n\n`);
      return res.end();
    }

    // Detect if there is any image attachment in the message history
    let hasImageAttachment = false;
    for (const m of messages) {
      if (m.attachment && m.attachment.type === "image" && m.attachment.base64) {
        hasImageAttachment = true;
        break;
      }
    }

    // Determine active model based on "automatic" or selected model
    let activeModel = model;
    if (model === "automatic") {
      if (hasImageAttachment || webSearchEnabled) {
        activeModel = "gemini-ai";
      } else {
        const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
        const searchKeywords = ["search", "cari", "berita", "news", "terbaru", "cuaca", "weather", "google", "live", "skor", "score", "match", "euro 2024", "copa america", "world cup"];
        const needsWeb = searchKeywords.some(kw => lastMsg.includes(kw));
        if (needsWeb) {
          activeModel = "gemini-ai";
        } else {
          activeModel = "gemma-4-31b";
        }
      }
      console.log(`[Automatic Model] Routed request to: ${activeModel}`);
    }

    // If an image is detected or activeModel is a Gemini model, route to Gemini
    const isGeminiModel = (activeModel === "gemini-ai" || activeModel === "gemini-3.5-flash" || webSearchEnabled || hasImageAttachment);
    if (isGeminiModel) {
      await streamGemini(messages, systemInstruction, temperature, webSearchEnabled, res, hasImageAttachment);
      res.write("data: [DONE]\n\n");
      return res.end();
    }

    if (activeModel === "llama-3.1-8b-instant") {
      await streamGroq(messages, systemInstruction, temperature, res);
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

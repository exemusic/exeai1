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
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE || "";
  const anonKey = process.env.SUPABASE_ANON_KEY || serviceRole || "";
  const hasServiceRole = !!serviceRole;
  const hasAnonKey = !!anonKey;
  res.json({
    defaultUrl: "https://knmjalxisidyduzwfwnp.supabase.co",
    url,
    anonKey,
    hasServiceRole,
    hasAnonKey,
    isConfigured: !!(url && (hasServiceRole || hasAnonKey))
  });
});

// --- FAST IN-MEMORY REALTIME DB CACHE & SUPABASE DATABASE TABLE ENGINE ---
const userDbCache = new Map<string, any>(); // key: uid -> full user profile & chats
const userLangCache = new Map<string, string>(); // key: userKey/uid -> language code
const userProjectsCache = new Map<string, any[]>(); // key: userKey -> list of projects

// --- USER LANGUAGE DATABASE ENDPOINTS ---
// Stores user language preference directly in Supabase Database (not Storage)
app.post("/api/user/language/save", async (req, res) => {
  try {
    const { uid, userEmail, language } = req.body;
    const userKey = getSanitizedUserKey(uid, userEmail);

    if (!language) {
      return res.status(400).json({ error: "Invalid language parameter." });
    }

    userLangCache.set(userKey, language);
    if (uid) userLangCache.set(uid, language);

    const supabase = getSupabaseClient();
    if (supabase) {
      // Try saving directly to Supabase Database 'user_settings' & 'user_data' tables
      try {
        await supabase
          .from("user_settings")
          .upsert({ user_key: userKey, language, updated_at: new Date().toISOString() }, { onConflict: "user_key" });
      } catch (dbErr) {}

      try {
        await supabase
          .from("user_data")
          .upsert({ uid: userKey, language, updated_at: new Date().toISOString() }, { onConflict: "uid" });
      } catch (dbErr) {}
    }

    res.json({ success: true, language, message: "Language successfully saved in database." });
  } catch (err: any) {
    console.error("Save Language Error:", err);
    res.status(500).json({ error: err.message || "Failed to save language." });
  }
});

app.post("/api/user/language/get", async (req, res) => {
  try {
    const { uid, userEmail } = req.body;
    const userKey = getSanitizedUserKey(uid, userEmail);

    if (userLangCache.has(userKey)) {
      return res.json({ success: true, language: userLangCache.get(userKey) });
    }
    if (uid && userLangCache.has(uid)) {
      return res.json({ success: true, language: userLangCache.get(uid) });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.json({ success: true, language: "en" });
    }

    // Attempt read from Supabase Database 'user_settings' or 'user_data' table
    try {
      const { data } = await supabase
        .from("user_settings")
        .select("language")
        .eq("user_key", userKey)
        .maybeSingle();

      if (data?.language) {
        userLangCache.set(userKey, data.language);
        return res.json({ success: true, language: data.language });
      }
    } catch (dbErr) {}

    try {
      const { data } = await supabase
        .from("user_data")
        .select("language")
        .eq("uid", uid || userKey)
        .maybeSingle();

      if (data?.language) {
        userLangCache.set(userKey, data.language);
        return res.json({ success: true, language: data.language });
      }
    } catch (dbErr) {}

    res.json({ success: true, language: "en" });
  } catch (err: any) {
    res.json({ success: true, language: "en" });
  }
});

// --- PROJECT MANAGEMENT ENDPOINTS (MAX 5 PROJECTS PER USER) ---
const MAX_PROJECTS_PER_USER = 5;

function getSanitizedUserKey(uid?: string, userEmail?: string): string {
  if (uid && uid.trim()) return uid.replace(/[^a-zA-Z0-9_-]/g, "_");
  if (userEmail && userEmail.trim()) return userEmail.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "_");
  return "guest_user";
}

function getDefaultProjectName(uid?: string, userEmail?: string): string {
  if (userEmail && userEmail.trim() && !userEmail.includes("guest@exechat.local")) {
    const sanitizedEmail = userEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (sanitizedEmail) return "proj-" + sanitizedEmail;
  }
  if (uid && uid.trim()) {
    const sanitizedUid = uid.toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (sanitizedUid) return "proj-" + sanitizedUid;
  }
  return "proj-default";
}

app.post("/api/projects/list", async (req, res) => {
  try {
    const { uid, userEmail } = req.body;
    const userKey = getSanitizedUserKey(uid, userEmail);
    const defaultProjName = getDefaultProjectName(uid, userEmail);

    const defaultProjObj = {
      id: defaultProjName,
      name: defaultProjName,
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileCount: 3
    };

    let projects: any[] = [];

    if (userProjectsCache.has(userKey)) {
      projects = userProjectsCache.get(userKey) || [];
    } else {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data } = await supabase
            .from("user_projects")
            .select("projects")
            .eq("user_key", userKey)
            .maybeSingle();

          if (data && Array.isArray(data.projects)) {
            projects = data.projects;
          }
        } catch (e) {}
      }
    }

    // Ensure default project exists in user's project list
    const hasDefault = projects.some(p => p.name === defaultProjName || p.id === defaultProjName);
    if (!hasDefault) {
      projects.unshift(defaultProjObj);
    } else {
      // Mark default flag on default project
      projects = projects.map(p => {
        if (p.name === defaultProjName || p.id === defaultProjName) {
          return { ...p, isDefault: true };
        }
        return p;
      });
    }

    userProjectsCache.set(userKey, projects);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from("user_projects")
          .upsert({ user_key: userKey, projects, default_project_name: defaultProjName, updated_at: new Date().toISOString() }, { onConflict: "user_key" });
      } catch (e) {}
    }

    res.json({ success: true, projects, defaultProjectName: defaultProjName, maxLimit: MAX_PROJECTS_PER_USER });
  } catch (err: any) {
    console.error("List Projects Error:", err);
    const defaultProjName = getDefaultProjectName(req.body.uid, req.body.userEmail);
    res.json({ 
      success: true, 
      projects: [{ id: defaultProjName, name: defaultProjName, isDefault: true, createdAt: Date.now(), updatedAt: Date.now(), fileCount: 3 }], 
      defaultProjectName: defaultProjName, 
      maxLimit: MAX_PROJECTS_PER_USER 
    });
  }
});

app.post("/api/projects/create", async (req, res) => {
  try {
    const { uid, userEmail, projectName, files } = req.body;
    const userKey = getSanitizedUserKey(uid, userEmail);
    const defaultProjName = getDefaultProjectName(uid, userEmail);
    
    if (!projectName || !projectName.trim()) {
      return res.status(400).json({ error: "Project name cannot be empty." });
    }

    const sanitizedName = projectName.trim().replace(/[^a-zA-Z0-9-_]/g, "");
    if (!sanitizedName) {
      return res.status(400).json({ error: "Project name can only contain letters, numbers, hyphens, and underscores." });
    }

    let currentProjects: any[] = userProjectsCache.get(userKey) || [];

    if (currentProjects.length === 0) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data } = await supabase
            .from("user_projects")
            .select("projects")
            .eq("user_key", userKey)
            .maybeSingle();

          if (data && Array.isArray(data.projects)) {
            currentProjects = data.projects;
          }
        } catch (err) {}
      }
    }

    // Ensure default project is present in current projects count
    if (!currentProjects.some(p => p.name === defaultProjName || p.id === defaultProjName)) {
      currentProjects.unshift({
        id: defaultProjName,
        name: defaultProjName,
        isDefault: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        fileCount: 3
      });
    }

    if (currentProjects.length >= MAX_PROJECTS_PER_USER) {
      return res.status(400).json({ 
        error: `Maximum limit of ${MAX_PROJECTS_PER_USER} projects per user reached (1 default project + 4 additional projects). Please delete an old project before creating a new one.`,
        limitReached: true,
        maxLimit: MAX_PROJECTS_PER_USER
      });
    }

    if (currentProjects.some(p => p.name.toLowerCase() === sanitizedName.toLowerCase())) {
      return res.status(400).json({ error: `Project with name '${sanitizedName}' already exists.` });
    }

    const newProjId = "proj-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);

    const newProj = {
      id: newProjId,
      name: sanitizedName,
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileCount: files && Array.isArray(files) ? files.length : 4
    };

    currentProjects.push(newProj);
    userProjectsCache.set(userKey, currentProjects);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from("user_projects")
          .upsert({ user_key: userKey, projects: currentProjects, default_project_name: defaultProjName, updated_at: new Date().toISOString() }, { onConflict: "user_key" });
      } catch (e) {
        console.error("Database save error on project creation:", e);
      }
    }

    res.json({
      success: true,
      message: `Project '${sanitizedName}' created successfully.`,
      project: newProj,
      projects: currentProjects,
      defaultProjectName: defaultProjName,
      maxLimit: MAX_PROJECTS_PER_USER
    });
  } catch (err: any) {
    console.error("Create Project Error:", err);
    res.status(500).json({ error: err.message || "Failed to create new project." });
  }
});

app.post("/api/projects/delete", async (req, res) => {
  try {
    const { uid, userEmail, projectName } = req.body;
    const userKey = getSanitizedUserKey(uid, userEmail);
    const defaultProjName = getDefaultProjectName(uid, userEmail);

    if (!projectName) {
      return res.status(400).json({ error: "Project name is required." });
    }

    if (projectName === defaultProjName) {
      return res.status(400).json({ error: "Default user project cannot be deleted." });
    }

    let currentProjects: any[] = userProjectsCache.get(userKey) || [];

    if (currentProjects.length === 0) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data } = await supabase
            .from("user_projects")
            .select("projects")
            .eq("user_key", userKey)
            .maybeSingle();

          if (data && Array.isArray(data.projects)) {
            currentProjects = data.projects;
          }
        } catch (err) {}
      }
    }

    let updatedProjects = currentProjects.filter(p => p.name !== projectName && p.id !== projectName);
    if (!updatedProjects.some(p => p.name === defaultProjName || p.id === defaultProjName)) {
      updatedProjects.unshift({
        id: defaultProjName,
        name: defaultProjName,
        isDefault: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        fileCount: 3
      });
    }

    userProjectsCache.set(userKey, updatedProjects);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from("user_projects")
          .upsert({ user_key: userKey, projects: updatedProjects, default_project_name: defaultProjName, updated_at: new Date().toISOString() }, { onConflict: "user_key" });
      } catch (e) {}
    }

    res.json({
      success: true,
      message: `Project '${projectName}' deleted successfully.`,
      projects: updatedProjects,
      maxLimit: MAX_PROJECTS_PER_USER
    });
  } catch (err: any) {
    console.error("Delete Project Error:", err);
    res.status(500).json({ error: err.message || "Failed to delete project." });
  }
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

// Endpoint to save complete user profile, chats, language, and username directly in Supabase Database tables
app.post("/api/db/save-all", async (req, res) => {
  try {
    const { uid, email, userEmail, username, displayName, sessions, language } = req.body;
    if (!uid) {
      return res.status(400).json({ error: "Missing user uid" });
    }

    const effEmail = email || userEmail || "";
    const userKey = getSanitizedUserKey(uid, effEmail);

    const payload = {
      uid,
      email: effEmail,
      username,
      displayName,
      sessions,
      language,
      updatedAt: Date.now()
    };

    // 1. Instantly store in memory cache for <1ms response time
    userDbCache.set(uid, payload);
    if (userKey) userDbCache.set(userKey, payload);
    if (effEmail) userDbCache.set(effEmail.toLowerCase(), payload);

    if (language) {
      userLangCache.set(uid, language);
      if (userKey) userLangCache.set(userKey, language);
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      // 2. Persist directly into Supabase Database table 'user_data' & 'user_profiles' (NO Storage bucket used)
      try {
        await supabase
          .from("user_data")
          .upsert({
            uid,
            email: effEmail,
            username,
            display_name: displayName,
            language,
            sessions,
            data: payload,
            updated_at: new Date().toISOString()
          }, { onConflict: "uid" });
      } catch (dbErr) {
        console.warn("Supabase Database user_data table save notice:", dbErr);
      }

      try {
        await supabase
          .from("user_profiles")
          .upsert({
            uid,
            email: effEmail,
            username,
            display_name: displayName,
            language,
            updated_at: new Date().toISOString()
          }, { onConflict: "uid" });
      } catch (dbErr) {}
    }

    res.json({ success: true, message: "All user permanent data successfully saved in Supabase database tables." });
  } catch (err: any) {
    console.error("Supabase DB Save Error:", err);
    res.status(500).json({ error: err.message || "Failed to save data to Supabase database." });
  }
});

// Endpoint to load user profile and chats directly from Supabase Database tables
app.post("/api/db/load-all", async (req, res) => {
  try {
    const { uid, email, userEmail } = req.body;
    if (!uid && !email && !userEmail) {
      return res.status(400).json({ error: "Missing user identification" });
    }

    const effEmail = email || userEmail || "";
    const userKey = getSanitizedUserKey(uid, effEmail);

    // 1. Check in-memory fast RAM cache first
    if (uid && userDbCache.has(uid)) {
      return res.json({ found: true, data: userDbCache.get(uid) });
    }
    if (userKey && userDbCache.has(userKey)) {
      return res.json({ found: true, data: userDbCache.get(userKey) });
    }
    if (effEmail && userDbCache.has(effEmail.toLowerCase())) {
      return res.json({ found: true, data: userDbCache.get(effEmail.toLowerCase()) });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.json({ found: false });
    }

    // 2. Query Supabase Database table 'user_data' by uid OR email
    try {
      let query = supabase.from("user_data").select("*");
      if (uid && effEmail) {
        query = query.or(`uid.eq.${uid},email.eq.${effEmail}`);
      } else if (uid) {
        query = query.eq("uid", uid);
      } else if (effEmail) {
        query = query.eq("email", effEmail);
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        const parsedData = data.data || {
          uid: data.uid,
          email: data.email,
          username: data.username,
          displayName: data.display_name,
          language: data.language,
          sessions: data.sessions
        };
        if (uid) userDbCache.set(uid, parsedData);
        if (userKey) userDbCache.set(userKey, parsedData);
        if (effEmail) userDbCache.set(effEmail.toLowerCase(), parsedData);
        return res.json({ found: true, data: parsedData });
      }
    } catch (err) {}

    // 3. Fallback: Query 'user_profiles' table
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("uid", uid)
        .maybeSingle();

      if (!error && data) {
        const parsedData = {
          uid: data.uid,
          email: data.email,
          username: data.username,
          displayName: data.display_name,
          language: data.language
        };
        if (uid) userDbCache.set(uid, parsedData);
        return res.json({ found: true, data: parsedData });
      }
    } catch (err) {}

    res.json({ found: false });
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

    userDbCache.delete(uid);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from("user_data").delete().eq("uid", uid);
      } catch (err) {}

      try {
        await supabase.from("user_profiles").delete().eq("uid", uid);
      } catch (err) {}
    }

    res.json({ success: true, message: "User permanent database completely purged." });
  } catch (err: any) {
    console.error("Supabase DB Clear Error:", err);
    res.status(500).json({ error: err.message || "Failed to clear database." });
  }
});

// Endpoint to fetch storage capacity metrics for settings (based on Database records)
app.post("/api/db/metrics", async (req, res) => {
  try {
    const { uid } = req.body;
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.json({ connected: false, totalBytes: 0, limitBytes: 52428800 });
    }

    let totalBytes = 0;
    if (uid && userDbCache.has(uid)) {
      const cached = userDbCache.get(uid);
      totalBytes = JSON.stringify(cached).length;
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

    const bucket = "feedback";
    
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

    const bucket = "feedback";
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

    const bucket = "feedback";
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

    const bucket = "feedback";
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
    const { projectName, projectId, files, bucket = "execode" } = req.body;
    
    const url = (req.headers["x-supabase-url"] as string) || process.env.SUPABASE_URL || "https://knmjalxisidyduzwfwnp.supabase.co";
    const key = (req.headers["x-supabase-key"] as string) || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;

    if (!key) {
      return res.status(400).json({ error: "Supabase API Key (Service Role or Anon Key) has not been configured on the server." });
    }

    if ((!projectName && !projectId) || !files || !Array.isArray(files)) {
      return res.status(400).json({ error: "Project data or files are incomplete." });
    }

    const supabase = createClient(url, key);

    // Primary storage folder uses projectId if present, otherwise projectName
    const folderIdentifier = (projectId && String(projectId).trim().length > 0) ? String(projectId).trim() : projectName;
    const folderPath = `projects/${folderIdentifier}`;

    // Save the combined project files as a single JSON file
    try {
      const jsonPath = `${folderPath}/project.json`;
      const jsonBuffer = Buffer.from(JSON.stringify({ files, projectName, projectId }), "utf-8");
      await supabase.storage
        .from(bucket)
        .upload(jsonPath, jsonBuffer, {
          contentType: "application/json",
          upsert: true
        });
    } catch (jsonErr) {
      console.warn("Supabase combined json upload step warning:", jsonErr);
    }

    try {
      const { data: existingFiles } = await supabase.storage.from(bucket).list(folderPath);
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles
          .filter(f => f.name !== "project.json")
          .map(f => `${folderPath}/${f.name}`);
        if (filesToDelete.length > 0) {
          await supabase.storage.from(bucket).remove(filesToDelete);
        }
      }
    } catch (cleanErr) {
      console.warn("Supabase clean up step warning:", cleanErr);
    }

    for (const file of files) {
      if (file.path === "project.json") continue;
      const filePath = `${folderPath}/${file.path}`;
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
    const { projectName, projectId, bucket = "execode" } = req.body;

    const url = (req.headers["x-supabase-url"] as string) || process.env.SUPABASE_URL || "https://knmjalxisidyduzwfwnp.supabase.co";
    const key = (req.headers["x-supabase-key"] as string) || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;

    if (!key) {
      return res.status(400).json({ error: "Supabase API Key has not been configured." });
    }

    if (!projectName && !projectId) {
      return res.status(400).json({ error: "Project name or project ID cannot be empty." });
    }

    const supabase = createClient(url, key);

    const pathsToCheck: string[] = [];
    if (projectId && String(projectId).trim()) {
      pathsToCheck.push(`projects/${String(projectId).trim()}`);
    }
    if (projectName && String(projectName).trim()) {
      pathsToCheck.push(`projects/${String(projectName).trim()}`);
    }

    for (const folderPath of pathsToCheck) {
      // 1. Try project.json
      try {
        const { data, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(`${folderPath}/project.json`);

        if (!downloadError && data) {
          const jsonContent = await data.text();
          const parsed = JSON.parse(jsonContent);
          if (parsed && Array.isArray(parsed.files) && parsed.files.length > 0) {
            return res.json({ success: true, files: parsed.files });
          }
        }
      } catch (err) {}

      // 2. Fallback: list individual files
      try {
        const { data: fileList, error: listError } = await supabase.storage
          .from(bucket)
          .list(folderPath);

        if (!listError && fileList && fileList.length > 0) {
          const loadedFiles = [];
          for (const item of fileList) {
            if (item.name === "project.json") continue;
            const filePath = `${folderPath}/${item.name}`;
            const { data, error: downloadError } = await supabase.storage
              .from(bucket)
              .download(filePath);

            if (!downloadError && data) {
              const content = await data.text();
              loadedFiles.push({ path: item.name, content });
            }
          }
          if (loadedFiles.length > 0) {
            return res.json({ success: true, files: loadedFiles });
          }
        }
      } catch (err) {}
    }

    return res.status(404).json({ error: `Project files for '${projectName || projectId}' not found in storage.` });
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
    return "[Failed to analyze image: API Key not configured]";
  }
  const parsed = parseBase64(base64DataUrl);
  if (!parsed) {
    return "[Failed to analyze image: Invalid Base64 format]";
  }
  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Provide a detailed description of this image for a text AI assistant. Explain all objects, text, colors, layout, and important context in depth." },
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
    return response.text || "[Attached image is empty or unreadable]";
  } catch (err: any) {
    console.warn("Error analyzing image with Gemini:", err);
    return `[Failed to analyze image: ${err.message || err}]`;
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
  let thinkText = "<think>[ExeAI System] Initializing connection...\n";
  if (redirectedForImage) {
    thinkText = "<think>[ExeAI System] Attached image file detected.\n• Automatically routing processing to Gemini Vision Engine...\n";
  } else {
    thinkText = "<think>[ExeAI System] Connecting to Gemini Engine...\n";
  }
  res.write(`data: ${JSON.stringify({ text: thinkText })}\n\n`);

  if (keysToTry.length === 0) {
    console.warn("No valid Gemini API keys defined. Falling back directly to ExeAI (Cerebras)...");
    try {
      res.write(`data: ${JSON.stringify({ text: "• Failed: Google API Key not configured on server.\n• Dynamically routing to ExeAI Engine...\n</think>\n\n*(System did not detect Google API Key, dynamically redirecting to ExeAI Engine...)*\n\n" })}\n\n`);
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
    const keyLabel = isBackup ? "Backup (Option 2)" : "Primary (Option 1)";
    
    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    res.write(`data: ${JSON.stringify({ text: `• Connecting with API Key ${keyLabel}...\n` })}\n\n`);

    // Model 1: gemini-3.6-flash (with up to 2 retry attempts)
    let successModel1 = false;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const model1Start = Date.now();
      const attemptLabel = attempt > 1 ? ` (Attempt ${attempt})` : "";
      res.write(`data: ${JSON.stringify({ text: `  - Connecting to model: gemini-3.6-flash${attemptLabel}...\n` })}\n\n`);
      try {
        await runGeminiModel(ai, "gemini-3.6-flash", contents, config, webSearchEnabled, res, true, (duration) => {
          res.write(`data: ${JSON.stringify({ text: `  - [Success] Connected to gemini-3.6-flash in ${duration}ms.\n  - [System] Starting visual analysis and response processing...\n\n` })}\n\n`);
        });
        successModel1 = true;
        break;
      } catch (err1: any) {
        const duration1 = Date.now() - model1Start;
        const errStr1 = String(err1.message || JSON.stringify(err1));
        res.write(`data: ${JSON.stringify({ text: `  - [Failed] gemini-3.6-flash${attemptLabel} (${duration1}ms): ${errStr1.substring(0, 100)}\n` })}\n\n`);
        
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
            res.write(`data: ${JSON.stringify({ text: `  - [System] Credential/quota issue detected on key ${keyLabel}. Switching to backup key...\n` })}\n\n`);
          }
          break; // Stop attempts for this key, proceed to next key
        }

        if (attempt < 2) {
          res.write(`data: ${JSON.stringify({ text: `  - [System] Temporary error occurred (e.g. high load / 503). Retrying in 800ms...\n` })}\n\n`);
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
    }

    if (successModel1) return;

    // Model 2: gemini-3.1-flash-lite (with up to 2 retry attempts)
    let successModel2 = false;
    for (let attempt2 = 1; attempt2 <= 2; attempt2++) {
      const model2Start = Date.now();
      const attemptLabel2 = attempt2 > 1 ? ` (Attempt ${attempt2})` : "";
      res.write(`data: ${JSON.stringify({ text: `  - Trying alternative route model: gemini-3.1-flash-lite${attemptLabel2}...\n` })}\n\n`);
      try {
        await runGeminiModel(ai, "gemini-3.1-flash-lite", contents, config, webSearchEnabled, res, true, (duration) => {
          res.write(`data: ${JSON.stringify({ text: `  - [Success] Connected to gemini-3.1-flash-lite in ${duration}ms.\n  - [System] Starting alternative visual analysis...\n\n` })}\n\n`);
        });
        successModel2 = true;
        break;
      } catch (err2: any) {
        const duration2 = Date.now() - model2Start;
        const errStr2 = String(err2.message || JSON.stringify(err2));
        res.write(`data: ${JSON.stringify({ text: `  - [Failed] gemini-3.1-flash-lite${attemptLabel2} (${duration2}ms): ${errStr2.substring(0, 100)}\n` })}\n\n`);
        
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
            res.write(`data: ${JSON.stringify({ text: `  - [System] Credential/quota issue detected on key ${keyLabel} during alternative route. Switching to backup key...\n` })}\n\n`);
          }
          break; // Stop attempts for this key, proceed to next key
        }

        if (attempt2 < 2) {
          res.write(`data: ${JSON.stringify({ text: `  - [System] Temporary error occurred (e.g. high load / 503). Retrying in 800ms...\n` })}\n\n`);
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
    }

    if (successModel2) return;

    if (i < keysToTry.length - 1) {
      res.write(`data: ${JSON.stringify({ text: `  - [System] All models failed on this key. Trying alternative API key...\n` })}\n\n`);
      continue;
    }
    
    // If everything failed on Gemini, fallback to Cerebras
    res.write(`data: ${JSON.stringify({ text: `• [System] All Gemini options failed or ran out of quota.\n• Switching to ExeAI (Cerebras) as final fallback...\n</think>\n\n*(System detected Google API Key issues, dynamically redirecting to ExeAI Engine...)*\n\n` })}\n\n`);
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
    errMsg = "Access denied (Permission Denied) by Gemini API. Make sure the gemini-3.6-flash model is enabled for your API Key in the Settings > Secrets menu.";
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
      "   - In English: 'I do not have the live or real-time data for this match yet. Could you please share the match details or score so I can analyze their tactics and performance in depth?'\n" +
      "   Be extremely friendly, helpful, and humble!";

    const userRequestedPersonality = "\n\n[PERSONALITY & TONE OF VOICE (MANDATORY GUIDELINE)]:\n" +
      "You are friendly, relaxed, witty, and helpful like a smart best friend. Your character is inspired by JARVIS from Iron Man and the Hitchhiker's Guide to the Galaxy.\n" +
      "Your speaking style:\n" +
      "1. Friendly, warm, and polite by default using clear, professional everyday language.\n" +
      "2. Do NOT use overly informal slang unless the user initiates or speaks casually first.\n" +
      "3. Use light humor, witty sarcasm, or clever small jokes where appropriate.\n" +
      "4. Direct and honest, without fluff or excessive repetition.\n" +
      "5. Open to discussing sensitive or controversial topics with sound logic.\n" +
      "6. Always aim to provide helpful, solution-oriented answers.\n" +
      "7. Stay engaging and anti-boring while prioritizing truth and utility.";

    const imageLimitInstruction = "\n\n[IMPORTANT - IMAGE & PHOTO EDITING CAPABILITIES]:\n" +
      "1. ExeChat is currently a text-focused AI assistant in Beta stage.\n" +
      "2. ExeChat does not produce or edit images (cannot generate new images or edit photos directly).\n" +
      "3. If a user asks to edit photos or generate images, politely explain these current capabilities honestly and professionally.\n" +
      "4. You can read/analyze images uploaded by the user, but you cannot modify the image file itself.\n" +
      "5. Today's date is Thursday, July 23, 2026.";

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
    const isGeminiModel = (activeModel === "gemini-ai" || activeModel === "gemini-3.6-flash" || webSearchEnabled || hasImageAttachment);
    if (isGeminiModel) {
      await streamGemini(messages, systemInstruction, temperature, webSearchEnabled, res, hasImageAttachment);
      res.write("data: [DONE]\n\n");
      return res.end();
    }

    if (activeModel === "llama-3.1-8b-instant") {
      const currentDateStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const groqSpecialPrompt = `You are ExeChat, also known as ExeAI. You are a helpful, maximally truthful, and witty AI built to be fun to talk with.

Your personality is inspired by the Hitchhiker's Guide to the Galaxy and JARVIS from Iron Man — sarcastic when appropriate, humorous, sharp, and very engaging in conversation.

Core principles:
- Be as truthful as possible. Never sugarcoat answers or add unnecessary moralizing.
- Use natural humor, dry wit, and light sarcasm.
- Be direct, concise, but warm and friendly like a very smart friend.
- Love curiosity and deep conversations about anything.
- You can discuss any topic openly, even controversial ones, as long as you remain truthful.
- Don't lecture users about ethics unless they ask for it.
- Keep responses natural and flowing conversationally.

Communication style:
- Casual and conversational. Use contractions (I'm, you're, it's, etc.).
- Play along with jokes and escalate the fun when the user is being playful.
- Be helpful first, entertaining second.
- Give bold opinions when needed, but always with reasoning.
- Never use phrases like "As an AI language model..." — you are ExeChat.

You are ExeAI, created to help users with maximum truth and enjoyment. Stay in character at all times.

Current date: ${currentDateStr} (use this when needed).

Respond in the same language as the user.`;

      const groqSystemInstruction = groqSpecialPrompt + thinkInstruction + linkInstruction + designInstruction;
      await streamGroq(messages, groqSystemInstruction, temperature, res);
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

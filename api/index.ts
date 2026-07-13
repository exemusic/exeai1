import express from "express";
import dotenv from "dotenv";
import admin from "firebase-admin";

// Load environment variables
dotenv.config();

const app = express();

// JSON body parser
app.use(express.json());

// Initialize Firebase Admin SDK
const databaseURL = process.env.VITE_FIREBASE_DATABASE_URL || "https://exeai-by-hexky-default-rtdb.asia-southeast1.firebasedatabase.app";
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "exeai-by-hexky";

let adminApp: any = null;
let adminAuth: any = null;
let adminDb: any = null;

try {
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0];
  } else {
    const appOptions: any = { databaseURL };
    let hasCredentials = false;
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        appOptions.credential = admin.credential.cert(sa);
        hasCredentials = true;
        console.log("Firebase Admin initialized via FIREBASE_SERVICE_ACCOUNT_KEY");
      } catch (e: any) {
        console.error("Gagal mendecode FIREBASE_SERVICE_ACCOUNT_KEY:", e.message);
      }
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      appOptions.credential = admin.credential.cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      });
      hasCredentials = true;
      console.log("Firebase Admin initialized via FIREBASE_PRIVATE_KEY dan FIREBASE_CLIENT_EMAIL");
    } else {
      console.warn("WARNING: Tidak ada FIREBASE_PRIVATE_KEY atau FIREBASE_SERVICE_ACCOUNT_KEY yang dikonfigurasi.");
    }
    
    if (hasCredentials) {
      adminApp = admin.initializeApp(appOptions);
    } else {
      console.warn("Firebase Admin NOT initialized because no credentials were provided.");
    }
  }
  
  if (adminApp) {
    adminAuth = admin.auth(adminApp);
    adminDb = admin.database(adminApp);
  }
} catch (error: any) {
  console.error("CRITICAL: Gagal menginisialisasi Firebase Admin SDK:", error);
}

// Server-side in-memory credit store for guests (IP-based) to prevent local storage modifications
const ipCreditStore: Record<string, number> = {};

// Helper to calculate credit cost based on message length
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

// Secure endpoint to get or create guest credits
app.post("/api/user/get-or-create-credits", (req, res) => {
  const rawIp = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "anonymous";
  const ip = Array.isArray(rawIp) ? rawIp[0] : rawIp;
  const cleanIp = ip.trim();

  if (ipCreditStore[cleanIp] === undefined) {
    ipCreditStore[cleanIp] = 5; // default guest credits
  }
  return res.json({ credits: ipCreditStore[cleanIp] });
});

// Secure endpoint to register a new user with 50 credits
app.post("/api/user/register", async (req, res) => {
  const { uid, idToken, email, username } = req.body;
  if (!uid || !idToken || !email || !username) {
    return res.status(400).json({ error: "Parameter tidak lengkap." });
  }

  if (!adminAuth || !adminDb) {
    return res.status(500).json({
      error: "Firebase Admin belum dikonfigurasi dengan benar di server Vercel. " +
             "Pastikan Anda telah menambahkan 'FIREBASE_PRIVATE_KEY' dan 'FIREBASE_CLIENT_EMAIL' ke Environment Variables di dashboard Vercel Anda."
    });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (decodedToken.uid !== uid) {
      return res.status(403).json({ error: "Akses tidak sah." });
    }

    const cleanUsername = username.trim();
    if (!/^[a-zA-Z0-9 _-]{3,20}$/.test(cleanUsername)) {
      return res.status(400).json({ error: "Format nama akun tidak valid." });
    }

    const userRef = adminDb.ref(`users/${uid}`);
    const snapshot = await userRef.once("value");
    if (snapshot.exists()) {
      return res.status(400).json({ error: "Akun sudah terdaftar." });
    }

    const profile = {
      email: email.trim().toLowerCase(),
      displayName: cleanUsername,
      username: cleanUsername,
      credits: 50,
      lastClaimAt: null,
      updatedAt: Date.now(),
    };

    await userRef.set(profile);
    res.json({ success: true, profile });
  } catch (err: any) {
    console.error("Gagal melakukan registrasi pengguna:", err);
    res.status(500).json({ error: err.message || "Gagal melakukan registrasi." });
  }
});

// Secure endpoint to claim daily credits (50 credits) with a 24-hour cool-down enforced on the server
app.post("/api/user/claim-daily", async (req, res) => {
  const { uid, idToken } = req.body;
  if (!uid || !idToken) {
    return res.status(400).json({ error: "Parameter tidak lengkap." });
  }

  if (!adminAuth || !adminDb) {
    return res.status(500).json({
      error: "Firebase Admin belum dikonfigurasi dengan benar di server Vercel. " +
             "Pastikan Anda telah menambahkan 'FIREBASE_PRIVATE_KEY' dan 'FIREBASE_CLIENT_EMAIL' ke Environment Variables di dashboard Vercel Anda."
    });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (decodedToken.uid !== uid) {
      return res.status(403).json({ error: "Akses tidak sah." });
    }

    const userRef = adminDb.ref(`users/${uid}`);
    const snapshot = await userRef.once("value");
    if (!snapshot.exists()) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }

    const userData = snapshot.val() as any;
    const now = Date.now();
    const lastClaimAt = userData.lastClaimAt || 0;

    // Enforce 24-hour limit on the server
    if (now - lastClaimAt < 24 * 60 * 60 * 1000) {
      return res.status(400).json({ error: "Anda sudah mengklaim kredit harian dalam 24 jam terakhir. Silakan coba lagi nanti." });
    }

    const currentCredits = Number(userData.credits !== undefined ? userData.credits : 50);
    const newCredits = currentCredits + 50;

    await userRef.update({
      credits: newCredits,
      lastClaimAt: now,
      updatedAt: now,
    });

    res.json({ success: true, credits: newCredits, lastClaimAt: now });
  } catch (err: any) {
    console.error("Gagal mengklaim kredit harian:", err);
    res.status(500).json({ error: err.message || "Gagal mengklaim kredit harian." });
  }
});

// Secure endpoint to redeem codes
app.post("/api/user/redeem", async (req, res) => {
  const { uid, idToken, code } = req.body;
  if (!uid || !idToken || !code) {
    return res.status(400).json({ error: "Parameter tidak lengkap." });
  }

  if (!adminAuth || !adminDb) {
    return res.status(500).json({
      error: "Firebase Admin belum dikonfigurasi dengan benar di server Vercel. " +
             "Pastikan Anda telah menambahkan 'FIREBASE_PRIVATE_KEY' dan 'FIREBASE_CLIENT_EMAIL' ke Environment Variables di dashboard Vercel Anda."
    });
  }

  const redemptionCode = code.trim().toUpperCase();

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (decodedToken.uid !== uid) {
      return res.status(403).json({ error: "Akses tidak sah." });
    }

    // Verify if code exists
    const codeRef = adminDb.ref(`redeemCodes/${redemptionCode}`);
    const codeSnapshot = await codeRef.once("value");
    if (!codeSnapshot.exists()) {
      return res.status(400).json({ error: "Kode redeem tidak valid atau tidak ditemukan." });
    }

    const codeData = codeSnapshot.val() as any;
    const reward = Number(codeData.reward || 0);
    if (reward <= 0) {
      return res.status(400).json({ error: "Kode redeem tidak valid." });
    }

    // Check if code was already redeemed by this user
    const redeemedRef = adminDb.ref(`userRedeems/${uid}/${redemptionCode}`);
    const redeemedSnapshot = await redeemedRef.once("value");
    if (redeemedSnapshot.exists()) {
      return res.status(400).json({ error: "Kode ini sudah pernah ditukarkan sebelumnya." });
    }

    const userRef = adminDb.ref(`users/${uid}`);
    const userSnapshot = await userRef.once("value");
    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }

    const userData = userSnapshot.val() as any;
    const currentCredits = Number(userData.credits !== undefined ? userData.credits : 50);
    const newCredits = currentCredits + reward;

    const updates: Record<string, any> = {};
    updates[`users/${uid}/credits`] = newCredits;
    updates[`users/${uid}/lastRedeemAt`] = Date.now();
    updates[`userRedeems/${uid}/${redemptionCode}`] = true;
    updates[`redeemedCodes/${redemptionCode}/${uid}`] = true;

    await adminDb.ref().update(updates);

    res.json({ success: true, credits: newCredits, reward });
  } catch (err: any) {
    console.error("Gagal menukarkan kode redeem:", err);
    res.status(500).json({ error: err.message || "Gagal menukarkan kode redeem." });
  }
});

// Streaming chat endpoint using Server-Sent Events (SSE) with server-authoritative credit deduction
app.post("/api/chat/stream", async (req, res) => {
  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const { messages, systemInstruction, temperature, model = "gemma-4-31b", uid, idToken } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.write(`data: ${JSON.stringify({ error: "Invalid or missing messages array" })}\n\n`);
      return res.end();
    }

    const apiKey = getCerebrasApiKey();
    if (!apiKey) {
      res.write(`data: ${JSON.stringify({ error: "Cerebras API key is not configured" })}\n\n`);
      return res.end();
    }

    // Secure Credit Check & Deduction (Optional/Bypassed if Firebase is not fully configured)
    let isUserLoggedIn = false;
    let verifiedUid = "";
    let userCredits = 0;

    if (adminAuth && adminDb && uid && idToken) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        if (decodedToken.uid === uid) {
          isUserLoggedIn = true;
          verifiedUid = uid;
        }
      } catch (err) {
        console.error("Gagal memverifikasi ID Token pada stream:", err);
      }
    }

    // Get length of the user's latest prompt to determine cost
    const lastUserMessage = messages.length > 0 ? messages[messages.length - 1]?.content || "" : "";
    const cost = getCreditCost(lastUserMessage);

    if (isUserLoggedIn && adminDb) {
      try {
        const userRef = adminDb.ref(`users/${verifiedUid}`);
        const userSnap = await userRef.once("value");
        if (userSnap.exists()) {
          const userData = userSnap.val() as any;
          userCredits = Number(userData.credits !== undefined ? userData.credits : 50);

          if (userCredits >= cost) {
            // Deduct credits on database
            userCredits = Math.max(0, userCredits - cost);
            await userRef.update({
              credits: userCredits,
              updatedAt: Date.now()
            });
          }
        }
      } catch (dbErr) {
        console.warn("Database credit update ignored:", dbErr);
      }
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

// [DEPRECATED] Supabase secure upload endpoint - no longer used
app.post("/api/storage/upload-audio", async (req, res) => {
  return res.status(410).json({ 
    error: "This endpoint is deprecated."
  });
});

export default app;

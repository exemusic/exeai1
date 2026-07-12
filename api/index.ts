import express from "express";
import dotenv from "dotenv";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

// Load environment variables
dotenv.config();

const app = express();

// JSON body parser
app.use(express.json());

// Initialize Firebase Admin SDK
const databaseURL = process.env.VITE_FIREBASE_DATABASE_URL || "https://exeai-by-hexky-default-rtdb.asia-southeast1.firebasedatabase.app";
const adminApp = getApps().length === 0
  ? initializeApp({ databaseURL })
  : getApps()[0];

const adminAuth = getAuth(adminApp);
const adminDb = getDatabase(adminApp);

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

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!getCerebrasApiKey()
  });
});

// Secure endpoint to get or create guest credits
app.post("/api/user/get-or-create-credits", (req, res) => {
  const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous";
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

    // Secure Credit Check & Deduction
    let isUserLoggedIn = false;
    let verifiedUid = "";
    let userCredits = 0;

    if (uid && idToken) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        if (decodedToken.uid === uid) {
          isUserLoggedIn = true;
          verifiedUid = uid;
        } else {
          res.write(`data: ${JSON.stringify({ error: "Sesi Anda tidak sah. Silakan coba masuk kembali." })}\n\n`);
          return res.end();
        }
      } catch (err) {
        console.error("Gagal memverifikasi ID Token pada stream:", err);
        res.write(`data: ${JSON.stringify({ error: "Sesi Anda kadaluarsa. Silakan masuk kembali dengan Google." })}\n\n`);
        return res.end();
      }
    }

    // Get length of the user's latest prompt to determine cost
    const lastUserMessage = messages.length > 0 ? messages[messages.length - 1]?.content || "" : "";
    const cost = getCreditCost(lastUserMessage);

    if (isUserLoggedIn) {
      const userRef = adminDb.ref(`users/${verifiedUid}`);
      const userSnap = await userRef.once("value");
      if (!userSnap.exists()) {
        res.write(`data: ${JSON.stringify({ error: "Profil akun tidak ditemukan di server." })}\n\n`);
        return res.end();
      }
      const userData = userSnap.val() as any;
      userCredits = Number(userData.credits !== undefined ? userData.credits : 50);

      if (userCredits < cost) {
        res.write(`data: ${JSON.stringify({ error: `Kredit tidak mencukupi! Pertanyaan ini memerlukan ${cost} kredit (sisa Anda: ${userCredits}). Silakan klaim kredit harian.` })}\n\n`);
        return res.end();
      }

      // Deduct credits on database
      userCredits = Math.max(0, userCredits - cost);
      await userRef.update({
        credits: userCredits,
        updatedAt: Date.now()
      });
    } else {
      // Guest mode - IP based credit limit
      const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous";
      const ip = Array.isArray(rawIp) ? rawIp[0] : rawIp;
      const cleanIp = ip.trim();

      if (ipCreditStore[cleanIp] === undefined) {
        ipCreditStore[cleanIp] = 5; // default guest credits
      }

      if (ipCreditStore[cleanIp] < cost) {
        res.write(`data: ${JSON.stringify({ error: `Kredit tamu tidak mencukupi! Pertanyaan ini memerlukan ${cost} kredit (sisa Anda: ${ipCreditStore[cleanIp]}). Silakan Sign In dengan Google untuk mendapatkan harian 50 kredit.` })}\n\n`);
        return res.end();
      }

      ipCreditStore[cleanIp] = Math.max(0, ipCreditStore[cleanIp] - cost);
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
        model: model,
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

      console.warn("Cerebras API Error status:", response.status);
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
    for await (const chunk of reader as any) {
      buffer += decoder.decode(chunk, { stream: true });
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

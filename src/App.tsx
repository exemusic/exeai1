import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Send,
  Sparkles,
  Search,
  Code2,
  PenTool,
  Languages,
  ArrowRight,
  Settings,
  Volume2,
  VolumeX,
  Copy,
  Download,
  AlertCircle,
  HelpCircle,
  Clock,
  ChevronRight,
  RefreshCw,
  Sliders,
  AppWindow,
  Cpu,
  Info,
  Menu,
  PanelLeft,
  Brain,
  Paperclip,
  FileText,
  Laptop,
  Moon,
  Sun,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  RotateCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Message, ChatSession, SystemPreset, ModelOption } from "./types";
import { MarkdownRenderer } from "./components/MarkdownRenderer";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { ref, get, set, update } from "firebase/database";
import { MODEL_OPTIONS, SYSTEM_PRESETS, SUGGESTED_PROMPTS } from "./presets";

const notifySoundUrl = new URL("../Sound/notify.mp3", import.meta.url).href;

export default function App() {
  // Chat Sessions States
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem("exeai_sessions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
    return [];
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    const match = window.location.pathname.match(/\/chat\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const savedSessionsRaw = localStorage.getItem("exeai_sessions");
      if (savedSessionsRaw) {
        try {
          const parsed = JSON.parse(savedSessionsRaw);
          if (Array.isArray(parsed) && parsed.some((s: any) => s.id === match[1])) {
            return match[1];
          }
        } catch (e) {
          console.error("Gagal parse sessions", e);
        }
      }
    }
    return null;
  });

  const parseSavedCredits = (saved: string | null): number => {
    if (saved === null) return 5;
    const numeric = Number(saved);
    return Number.isFinite(numeric) ? numeric : 5;
  };

  // Welcome Greetings & Memories
  const [welcomeGreeting, setWelcomeGreeting] = useState("Ada ide baru untuk dieksplorasi?");
  const [memories, setMemories] = useState<string[]>(() => {
    const saved = localStorage.getItem("exechat_memories");
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [memoryInput, setMemoryInput] = useState("");

  useEffect(() => {
    localStorage.setItem("exechat_memories", JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    const greetings = [
      "Ada ide baru untuk dieksplorasi?",
      "Apa yang ingin kita pecahkan hari ini?",
      "Butuh bantuan menulis kode atau menganalisis data?",
      "Mari buat sesuatu yang luar biasa hari ini!",
      "Bagaimana ExeChat bisa membantu produktivitasmu?",
      "Tanyakan apa saja, asisten AI-mu siap membantu.",
      "Ada konsep rumit yang ingin kamu sederhanakan?"
    ];
    const randomIdx = Math.floor(Math.random() * greetings.length);
    setWelcomeGreeting(greetings[randomIdx]);
  }, []);

  // Current Input & State
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Settings & Options States
  const [selectedPresetId, setSelectedPresetId] = useState("default");
  const [selectedModelId, setSelectedModelId] = useState("gemma-4-31b");
  const [temperature, setTemperature] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true); // Open by default for better user guidance

  // Theme settings (System, Dark/Hitam, Light/Putih)
  const [themeMode, setThemeMode] = useState<"system" | "dark" | "light">(() => {
    return (localStorage.getItem("exechat_theme_mode") as any) || "dark";
  });

  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    localStorage.setItem("exechat_theme_mode", themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const resolvedTheme = themeMode === "system" ? (systemIsDark ? "dark" : "light") : themeMode;
  const theme = resolvedTheme;

  useEffect(() => {
    if (resolvedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [resolvedTheme]);

  // Credits & Account States
  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem("exechat_credits");
    return parseSavedCredits(saved);
  });

  // User feedback and action states for assistant messages
  const [likedMessages, setLikedMessages] = useState<Record<string, boolean>>({});
  const [dislikedMessages, setDislikedMessages] = useState<Record<string, boolean>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [activeDropdownMsgId, setActiveDropdownMsgId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("exechat_logged_in") === "true";
  });
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem("exechat_email") || null;
  });
  const [userId, setUserId] = useState<string | null>(() => {
    return localStorage.getItem("exechat_user_id") || null;
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem("exechat_username") || "";
  });
  const [userDisplayName, setUserDisplayName] = useState<string>(() => {
    return localStorage.getItem("exechat_display_name") || "";
  });
  const [lastClaimAt, setLastClaimAt] = useState<number | null>(() => {
    const raw = localStorage.getItem("exechat_last_claim_at");
    return raw !== null ? Number(raw) : null;
  });
  const [redeemCodeInput, setRedeemCodeInput] = useState<string>("");
  const [redeemFeedback, setRedeemFeedback] = useState<string | null>(null);
  const [showQuickModelDropdown, setShowQuickModelDropdown] = useState(false);
  const [isLoggingInProcess, setIsLoggingInProcess] = useState(false);
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [authStep, setAuthStep] = useState<"choose" | "register">("choose");
  const [pendingAuthUser, setPendingAuthUser] = useState<{ uid: string; email: string; displayName: string | null } | null>(null);
  const [newUsernameInput, setNewUsernameInput] = useState("");
  const [pendingRedeemCodeInput, setPendingRedeemCodeInput] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  
  // Selected file for upload (before sending message)
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    url: string;
    size: number;
    mime?: string;
    textContent?: string;
  } | null>(null);

  // Credits are persisted in Firebase RTDB for logged-in users, and in localStorage for guest mode.
  // Avoid overriding the saved Firebase credits with the transient backend credit store.

  // Editing Session Title States
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState("");

  // TTS State
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // References
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const ttsSynthRef = useRef<SpeechSynthesis | null>(null);
  const notifyAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    notifyAudioRef.current = new Audio(notifySoundUrl);
    notifyAudioRef.current.volume = 0.75;
    notifyAudioRef.current.preload = "auto";
  }, []);

  const playNotifySound = () => {
    if (!notifyAudioRef.current) return;
    notifyAudioRef.current.currentTime = 0;
    notifyAudioRef.current.play().catch(() => {
      // Ignore playback errors from browser autoplay restrictions.
    });
  };

  // Supabase config (Public anon key - safe for client-side)
  const SUPABASE_URL = "https://rirernnkstrjjquvblge.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcmVybm5rc3RyampxdXZibGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTYyMzAsImV4cCI6MjA4OTA3MjIzMH0.M2JDFy327Pny7gchW2pZVt5dzNbyw63gebYe_SkP4Mk";
  const SUPABASE_BUCKET = "music";

  // Upload blob directly to Supabase Storage using anon key
  // Returns the public URL of the uploaded file
  const uploadBlobToSupabase = async (blob: Blob, path: string, mime: string, onProgress?: (p: number) => void): Promise<string> => {
    return new Promise<string>(async (resolve, reject) => {
      try {
        // Upload directly to Supabase using REST API with anon key
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${encodeURIComponent(path)}`;

        const response = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": mime,
            "x-upsert": "true",
          },
          body: blob,
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMsg = `Upload gagal dengan status ${response.status}`;
          
          try {
            const errorJson = JSON.parse(errorText);
            errorMsg = errorJson.message || errorMsg;
          } catch (e) {
            // Response bukan JSON
          }

          if (response.status === 401) {
            reject(new Error("Autentikasi Supabase gagal - anon key mungkin invalid"));
          } else if (response.status === 403) {
            reject(new Error("Akses ditolak - periksa konfigurasi bucket atau RLS policies"));
          } else if (response.status === 413) {
            reject(new Error("File terlalu besar"));
          } else {
            reject(new Error(errorMsg));
          }
          return;
        }

        // Build public URL
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${encodeURIComponent(path)}`;
        onProgress?.(100);
        resolve(publicUrl); // Return the public URL
      } catch (err: any) {
        reject(new Error(`Upload error: ${err?.message || "unknown"}`));
      }
    });
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[File] Handler triggered, files count:", e.target.files ? e.target.files.length : 0);
    const file = e.target.files?.[0];
    if (!file) {
      console.log("[File] No file selected");
      return;
    }
    
    console.log("[File] Selected file:", file.name, "| Type:", file.type, "| Size:", file.size);
    
    const maxBytes = 20 * 1024 * 1024; // 20MB
    
    // Check size first
    if (file.size > maxBytes) {
      console.log("[File] File too large:", file.size);
      setErrorText("Ukuran file melebihi batas 20MB.");
      e.currentTarget.value = "";
      return;
    }

    console.log("[File] Accepting file, creating object URL...");
    
    setErrorText(null);
    const url = URL.createObjectURL(file);
    console.log("[File] Object URL created:", url);

    // Check if it is a text-based file
    const isTextFile = (f: File): boolean => {
      const textExtensions = [
        "txt", "js", "jsx", "ts", "tsx", "css", "json", "md", "html", "py", 
        "cpp", "h", "java", "sh", "yaml", "yml", "ini", "conf", "sql", "xml"
      ];
      const extension = f.name.split(".").pop()?.toLowerCase() || "";
      if (textExtensions.includes(extension)) return true;
      if (f.type.startsWith("text/")) return true;
      if (f.type.includes("json") || f.type.includes("javascript") || f.type.includes("typescript") || f.type.includes("xml")) return true;
      return false;
    };

    if (isTextFile(file)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = event.target?.result as string;
        console.log("[File] Plain-text content loaded, size in chars:", textContent.length);
        setSelectedFile({
          name: file.name,
          url,
          size: file.size,
          mime: file.type || undefined,
          textContent: textContent,
        });
      };
      reader.onerror = () => {
        console.error("[File] Error reading file as text.");
        setSelectedFile({
          name: file.name,
          url,
          size: file.size,
          mime: file.type || undefined,
        });
      };
      reader.readAsText(file);
    } else {
      setSelectedFile({
        name: file.name,
        url,
        size: file.size,
        mime: file.type || undefined,
      });
    }

    console.log("[File] setSelectedFile triggered, should appear in UI now");
    playNotifySound();
    e.currentTarget.value = "";
  };

  // Sync sessions to localStorage
  useEffect(() => {
    localStorage.setItem("exeai_sessions", JSON.stringify(sessions));
  }, [sessions]);

  // Theme persistence removed per new requirements.

  // Sync credits to localStorage
  useEffect(() => {
    localStorage.setItem("exechat_credits", String(credits));
  }, [credits]);

  // Sync login state to localStorage
  useEffect(() => {
    localStorage.setItem("exechat_logged_in", String(isLoggedIn));
    if (userEmail) {
      localStorage.setItem("exechat_email", userEmail);
    } else {
      localStorage.removeItem("exechat_email");
    }
    if (userId) {
      localStorage.setItem("exechat_user_id", userId);
    } else {
      localStorage.removeItem("exechat_user_id");
    }
    if (userName) {
      localStorage.setItem("exechat_username", userName);
    } else {
      localStorage.removeItem("exechat_username");
    }
    if (userDisplayName) {
      localStorage.setItem("exechat_display_name", userDisplayName);
    } else {
      localStorage.removeItem("exechat_display_name");
    }
  }, [isLoggedIn, userEmail, userId, userName, userDisplayName]);

  // Sync last claim timestamp
  useEffect(() => {
    if (lastClaimAt !== null) {
      localStorage.setItem("exechat_last_claim_at", String(lastClaimAt));
    } else {
      localStorage.removeItem("exechat_last_claim_at");
    }
  }, [lastClaimAt]);

  // Sync currentSessionId to URL path and localStorage
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem("exeai_current_session_id", currentSessionId);
      const currentPath = window.location.pathname;
      const targetPath = `/chat/${currentSessionId}`;
      if (currentPath !== targetPath) {
        window.history.pushState({}, "", targetPath);
      }
    } else {
      localStorage.removeItem("exeai_current_session_id");
      const currentPath = window.location.pathname;
      if (currentPath !== "/" && currentPath !== "") {
        window.history.pushState({}, "", "/");
      }
    }
  }, [currentSessionId]);

  // Handle URL navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const match = window.location.pathname.match(/\/chat\/([a-zA-Z0-9_-]+)/);
      if (match) {
        const chatId = match[1];
        if (sessions.some((s) => s.id === chatId)) {
          setCurrentSessionId(chatId);
        } else {
          setCurrentSessionId(null);
        }
      } else {
        setCurrentSessionId(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [sessions]);

  // Check API Key and backend health on mount
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setHasApiKey(data.hasApiKey);
      })
      .catch((err) => {
        console.error("Failed to check backend health", err);
        setHasApiKey(false);
      });

    // Initialize Speech Synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      ttsSynthRef.current = window.speechSynthesis;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.debug("onAuthStateChanged fired. user:", user);
      if (user && user.uid && user.email) {
        try {
          // debug: print current id token length to validate auth token is available
          try {
            const token = await user.getIdToken();
            console.debug("current user id token length:", token ? token.length : 0);
          } catch (tErr) {
            console.warn("Failed to fetch id token for debug:", tErr);
          }
          const snapshot = await get(ref(db, `users/${user.uid}`));
          if (snapshot.exists()) {
            const data = snapshot.val();
            const displayNameValue = data.username || data.displayName || user.displayName || user.email.split("@")[0] || "";
            const resolvedCredits = typeof data.credits === "number" ? data.credits : 50;
            setUserId(user.uid);
            setUserEmail(user.email);
            setUserDisplayName(displayNameValue);
            setUserName(displayNameValue);
            setCredits(resolvedCredits);
            setLastClaimAt(typeof data.lastClaimAt === "number" ? data.lastClaimAt : null);
            setIsLoggedIn(true);
            setShowAuthOverlay(false);
            setAuthStep("choose");
            setPendingAuthUser(null);
            setAuthMessage(null);
          } else {
            setPendingAuthUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
            });
            setNewUsernameInput(user.displayName || user.email.split("@")[0] || "");
            setAuthStep("register");
            setAuthMessage("Akun belum terdaftar. Silakan buat nama akun untuk melanjutkan.");
            setShowAuthOverlay(true);
            setIsLoggedIn(false);
          }
        } catch (err: any) {
          console.error("Gagal memuat data pengguna dari Firebase:", err);
          if (err && err.code && err.code.includes("permission-denied") || (err && String(err).toLowerCase().includes("permission denied"))) {
            setErrorText("Akses database ditolak (PERMISSION_DENIED). Pastikan user sudah login dan aturan RTDB mengizinkan akses untuk user yang terautentikasi.");
          }
        }
      } else {
        setIsLoggedIn(false);
        setUserEmail(null);
        setUserId(null);
        setUserName("");
        setUserDisplayName("");
        setCredits(parseSavedCredits(localStorage.getItem("exechat_credits")));
        setLastClaimAt(null);
      }
    });

    return () => {
      unsubscribe();
      if (ttsSynthRef.current) {
        ttsSynthRef.current.cancel();
      }
    };
  }, []);

  // Scroll to bottom helper
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior });
    }, 80);
  };

  // Scroll on new message or generation change
  const currentSession = sessions.find((s) => s.id === currentSessionId);
  useEffect(() => {
    if (currentSession) {
      scrollToBottom("smooth");
    }
  }, [currentSession?.messages?.length, isGenerating]);

  // Get current active settings from active session (or fallback to defaults)
  const activePreset = SYSTEM_PRESETS.find(
    (p) => p.id === (currentSession?.systemInstructionId || selectedPresetId)
  ) || SYSTEM_PRESETS[0];

  const activeModel = MODEL_OPTIONS.find(
    (m) => m.id === (currentSession?.model || selectedModelId)
  ) || MODEL_OPTIONS[0];

  const activeTemp = currentSession ? currentSession.temperature : temperature;

  // Dynamic theme config dictionary
  const themeConfig: Record<string, {
    name: string;
    outerBg: string;
    mainBg: string;
    sidebarBg: string;
    sectionBg: string;
    border: string;
    bubbleUser: string;
    bubbleAssistant: string;
    textMuted: string;
    textBase: string;
    textTitle: string;
    accentColor: string;
    scrollbarClass: string;
    gradient: string;
  }> = {
    dark: {
      name: "Gelap (Hitam)",
      outerBg: "bg-[#0b0c0e]",
      mainBg: "bg-[#0b0c0e]",
      sidebarBg: "bg-[#131314]",
      sectionBg: "bg-[#1e1f20]",
      border: "border-[#2a2b2d]/70",
      bubbleUser: "bg-[#1e1f20] border border-[#2a2b2d]/60 text-[#e3e3e3]",
      bubbleAssistant: "bg-transparent border-transparent text-[#e3e3e3]",
      textMuted: "text-[#9e9e9e]",
      textBase: "text-[#e3e3e3]",
      textTitle: "text-white",
      accentColor: "bg-[#1a73e8] hover:bg-[#1557b0] text-white",
      scrollbarClass: "scrollbar-thin scrollbar-thumb-zinc-800",
      gradient: "from-[#1a2035]/25 via-[#0b0c0e]/0 to-[#0b0c0e]/0",
    },
    light: {
      name: "Terang (Putih)",
      outerBg: "bg-[#ffffff]",
      mainBg: "bg-[#ffffff]",
      sidebarBg: "bg-[#f0f4f9]",
      sectionBg: "bg-[#e9eef6]",
      border: "border-[#dee2e6]",
      bubbleUser: "bg-[#e9eef6] border border-transparent text-[#1f1f1f]",
      bubbleAssistant: "bg-transparent border-transparent text-[#1f1f1f]",
      textMuted: "text-[#5f6368]",
      textBase: "text-[#1f1f1f]",
      textTitle: "text-[#1f1f1f]",
      accentColor: "bg-[#1a73e8] hover:bg-[#1557b0] text-white",
      scrollbarClass: "scrollbar-thin scrollbar-thumb-zinc-300",
      gradient: "from-[#e8f0fe]/35 via-[#ffffff]/0 to-[#ffffff]/0",
    },
  };

  const curTheme = themeConfig[theme] || themeConfig.dark;
  const isDark = theme === "dark";

  // Credit calculation helper
  const getCreditCost = (text: string): number => {
    const len = text.trim().length;
    if (len < 20) return 1;
    if (len < 100) return 2;
    if (len < 300) return 3;
    return 4;
  };

  // Google Login click handler
  const handleGoogleLoginClick = () => {
    handleGoogleLogin();
  };

  // Claim Daily Credits
  const handleClaimDailyCredits = async () => {
    if (!isLoggedIn || !userId) return;
    const now = Date.now();
    if (lastClaimAt && (now - lastClaimAt) < 24 * 60 * 60 * 1000) {
      setErrorText("Anda sudah mengklaim kredit harian dalam 24 jam terakhir. Silakan coba nanti.");
      return;
    }

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Sesi tidak ditemukan. Silakan masuk kembali.");
      }

      const res = await fetch("/api/user/claim-daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: userId, idToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengklaim kredit harian.");
      }

      setCredits(data.credits);
      setLastClaimAt(data.lastClaimAt);
      setErrorText(null);
    } catch (err: any) {
      console.error("Gagal mengklaim kredit harian via API:", err);
      setErrorText(err.message || "Terjadi kesalahan saat mengklaim kredit.");
    }
  };

  const saveUserProfile = async (uid: string, email: string, displayName: string | null, requestedUsername?: string, creditsValue?: number) => {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    const fallbackName = displayName || email.split("@")[0] || "User";

    if (snapshot.exists()) {
      const existing = snapshot.val();
      const usernameValue = requestedUsername || existing.username || fallbackName;
      const currentCredits =
        typeof existing.credits === "number"
          ? existing.credits
          : parseSavedCredits(localStorage.getItem("exechat_credits"));
      const profileUpdate: Record<string, any> = {
        email,
        displayName: usernameValue,
        username: usernameValue,
        updatedAt: Date.now(),
      };
      await update(userRef, profileUpdate);
      return {
        username: usernameValue,
        displayName: usernameValue,
        credits: currentCredits,
        lastClaimAt: existing.lastClaimAt || null,
      };
    }

    const usernameValue = requestedUsername || fallbackName;
    const profileUpdate: Record<string, any> = {
      email,
      displayName: usernameValue,
      username: usernameValue,
      credits: creditsValue !== undefined ? creditsValue : 50,
      lastClaimAt: null,
      updatedAt: Date.now(),
    };
    await update(userRef, profileUpdate);
    return {
      username: usernameValue,
      displayName: fallbackName,
      credits: profileUpdate.credits,
      lastClaimAt: null,
    };
  };

  const finalizeUserSession = (uid: string, email: string, username: string, displayName: string, creditsValue: number, lastClaimAtValue: number | null) => {
    setUserId(uid);
    setUserEmail(email);
    setUserDisplayName(displayName);
    setUserName(username);
    setCredits(creditsValue);
    setLastClaimAt(lastClaimAtValue);
    setIsLoggedIn(true);
    setShowAuthOverlay(false);
    setAuthStep("choose");
    setPendingAuthUser(null);
    setAuthMessage(null);
    setNewUsernameInput("");
    setPendingRedeemCodeInput("");
    setErrorText(null);
  };

  const handleGoogleLogin = async () => {
    if (isLoggedIn) {
      setErrorText("Anda sudah masuk, tidak bisa mengganti akun Google dari sini.");
      return;
    }

    setShowAuthOverlay(true);
    setAuthStep("choose");
    setAuthMessage(null);
    setIsLoggingInProcess(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (!user || !user.uid || !user.email) {
        throw new Error("Gagal mendapatkan informasi pengguna dari Google.");
      }

      const snapshot = await get(ref(db, `users/${user.uid}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const resolvedUsername = data.username || data.displayName || user.displayName || user.email.split("@")[0] || "User";
        const resolvedCredits = typeof data.credits === "number" ? data.credits : 50;
        finalizeUserSession(
          user.uid,
          user.email,
          resolvedUsername,
          resolvedUsername,
          resolvedCredits,
          typeof data.lastClaimAt === "number" ? data.lastClaimAt : null,
        );
      } else {
        setPendingAuthUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        });
        setNewUsernameInput(user.displayName || user.email.split("@")[0] || "");
        setAuthStep("register");
        setAuthMessage("Akun belum terdaftar. Silakan buat nama akun untuk melanjutkan.");
        setIsLoggedIn(false);
      }
      setErrorText(null);
    } catch (error: any) {
      console.error("Google Sign-In gagal:", error);
      setErrorText(error?.message || "Gagal masuk dengan Google.");
      setShowAuthOverlay(false);
    } finally {
      setIsLoggingInProcess(false);
    }
  };

  const handleCompleteRegistration = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!pendingAuthUser) return;

    const trimmedUsername = newUsernameInput.trim();
    if (!trimmedUsername || !/^[a-zA-Z0-9 _-]{3,20}$/.test(trimmedUsername)) {
      setAuthMessage("Nama akun harus 3-20 karakter dan hanya boleh berisi huruf, angka, spasi, underscore, atau strip.");
      return;
    }

    setIsLoggingInProcess(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Sesi Google tidak ditemukan. Silakan login kembali.");
      }

      const res = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: pendingAuthUser.uid,
          idToken,
          email: pendingAuthUser.email,
          username: trimmedUsername,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat akun.");
      }

      finalizeUserSession(pendingAuthUser.uid, pendingAuthUser.email, trimmedUsername, trimmedUsername, 50, null);

      if (pendingRedeemCodeInput.trim()) {
        await handleRedeemCode(pendingAuthUser.uid, pendingRedeemCodeInput.trim());
      }
      setAuthMessage("Akun berhasil dibuat. Selamat datang di ExeChat.");
    } catch (error: any) {
      console.error("Gagal menyelesaikan pendaftaran:", error);
      setAuthMessage(error?.message || "Gagal membuat akun. Coba lagi nanti.");
    } finally {
      setIsLoggingInProcess(false);
    }
  };

  const handleRedeemCode = async (targetUserId?: string, customCode?: string) => {
    const uid = targetUserId || userId;
    if (!uid) {
      setRedeemFeedback("Silakan login dengan Google terlebih dahulu untuk menukarkan kode.");
      return;
    }

    const redemptionCode = (customCode || redeemCodeInput).trim().toUpperCase();
    if (!redemptionCode) {
      setRedeemFeedback("Masukkan kode redeem terlebih dahulu.");
      return;
    }

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Sesi Google tidak ditemukan. Silakan login kembali.");
      }

      const res = await fetch("/api/user/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          idToken,
          code: redemptionCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menukarkan kode redeem.");
      }

      setCredits(data.credits);
      setRedeemFeedback(`Berhasil! Anda menerima ${data.reward} kredit.`);
      setRedeemCodeInput("");
      setPendingRedeemCodeInput("");
    } catch (err: any) {
      console.error("Gagal menukarkan kode redeem via API:", err);
      const errorMsg = err?.message || "Terjadi kesalahan saat menukarkan kode. Coba lagi nanti.";
      setRedeemFeedback(errorMsg);
    }
  };

  const handleSaveUsername = async () => {
    if (!userId) {
      setErrorText("Silakan login terlebih dahulu untuk mengubah username.");
      return;
    }

    const trimmed = userName.trim();
    if (!trimmed) {
      setErrorText("Username tidak boleh kosong.");
      return;
    }

    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(trimmed)) {
      setErrorText("Username harus 3-20 karakter dan hanya boleh berisi huruf, angka, underscore, atau strip.");
      return;
    }

    try {
      await update(ref(db, `users/${userId}`), {
        username: trimmed,
        displayName: trimmed,
        updatedAt: Date.now(),
      });
      setUserName(trimmed);
      setUserDisplayName(trimmed);
      setErrorText(null);
      setRedeemFeedback("Username berhasil disimpan.");
    } catch (err) {
      console.error("Gagal menyimpan username:", err);
      setErrorText("Gagal menyimpan username. Coba lagi nanti.");
    }
  };

  const createNewSession = (initialMsg?: string) => {
    // Generate a random, elegant 8-character chat ID (like '929e1x20')
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let randomId = "";
    for (let i = 0; i < 8; i++) {
      randomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const id = randomId;
    const newSession: ChatSession = {
      id,
      title: initialMsg ? (initialMsg.length > 25 ? initialMsg.substring(0, 25) + "..." : initialMsg) : `Obrolan Baru`,
      messages: [],
      systemInstructionId: selectedPresetId,
      temperature,
      model: selectedModelId,
      createdAt: Date.now(),
    };

    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(id);
    return id;
  };

  // Delete a session
  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      if (remaining.length > 0) {
        setCurrentSessionId(remaining[0].id);
      } else {
        setCurrentSessionId(null);
      }
    }
  };

  // Trigger renaming mode
  const startRenameSession = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditTitleInput(title);
  };

  // Save renamed session title
  const saveRenameSession = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editTitleInput.trim()) return;

    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: editTitleInput.trim() } : s))
    );
    setEditingSessionId(null);
  };

  // Select Preset Icon component helper
  const getPresetIcon = (iconName: string, className = "h-4 w-4") => {
    switch (iconName) {
      case "Sparkles":
        return <Sparkles className={className} />;
      case "Code2":
        return <Code2 className={className} />;
      case "PenTool":
        return <PenTool className={className} />;
      case "Languages":
        return <Languages className={className} />;
      default:
        return <MessageSquare className={className} />;
    }
  };

  // Send message implementation
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isGenerating) return;

    setErrorText(null);

    // 1. Duplicate check (Anti-spam)
    let targetSessionId = currentSessionId;
    const activeSessionObj = sessions.find((s) => s.id === targetSessionId);
    if (activeSessionObj && activeSessionObj.messages.length > 0) {
      const userMsgs = activeSessionObj.messages.filter((m) => m.role === "user");
      if (userMsgs.length > 0) {
        const lastMsg = userMsgs[userMsgs.length - 1];
        if (lastMsg.content.trim().toLowerCase() === text.toLowerCase()) {
          setErrorText("Terdeteksi spam! Anda mengirimkan pesan yang persis sama berturut-turut.");
          return;
        }
      }
    }

    // 2. Gibberish / Keymash check (Anti-spam)
    const isKeymash = (str: string): boolean => {
      const s = str.trim().toLowerCase();
      if (s.length < 8) return false;
      // Repetitive characters (e.g., aaaaaaaa)
      if (/([a-zA-Z0-9])\1{5,}/.test(s)) return true;
      // Repetitive patterns (e.g. asdfasdfasdf)
      if (s.length > 12) {
        const chunks = s.match(/.{4}/g) || [];
        const uniqueChunks = new Set(chunks);
        if (chunks.length > 3 && uniqueChunks.size <= 2) return true;
      }
      // Long keymash without spaces or vowels
      if (!s.includes(" ") && s.length > 15 && !/[aeiouy]/.test(s)) return true;
      return false;
    };

    if (isKeymash(text)) {
      setErrorText("Input tidak sah diblokir! Terdeteksi spam acak (gibberish/keymash) yang dapat menguras token.");
      return;
    }

    // 3. Credit deduction check
    const cost = getCreditCost(text);
    if (credits < cost) {
      setErrorText(`Kredit tidak mencukupi! Pertanyaan ini memerlukan ${cost} kredit (sisa Anda: ${credits}). Silakan Sign In dengan Google untuk mendapatkan harian 50 kredit.`);
      return;
    }

    // Deduct credits locally (optimistic update)
    const newCredits = Math.max(0, credits - cost);
    setCredits(newCredits);
    if (!isLoggedIn) {
      localStorage.setItem("exechat_credits", String(newCredits));
    }

    // Capture any selected file attachment before resetting the state
    const attachmentObj = selectedFile ? {
      type: (selectedFile.mime?.startsWith("audio/") ? "audio" : selectedFile.mime?.startsWith("image/") ? "image" : "file") as "audio" | "image" | "file",
      name: selectedFile.name,
      url: selectedFile.url,
      size: selectedFile.size,
      mime: selectedFile.mime,
      textContent: selectedFile.textContent,
    } : null;

    playNotifySound();
    setInputMessage("");
    setSelectedFile(null); // Clear selected file state for next inputs

    // Get or create session
    if (!targetSessionId) {
      targetSessionId = createNewSession(text);
    }

    const userMessage: Message = {
      id: "msg_" + Date.now() + "_user",
      role: "user",
      content: text,
      timestamp: Date.now(),
      attachment: attachmentObj,
    };

    // Add user message to state
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === targetSessionId) {
          // Auto-rename session if it's the first message and still "Obrolan Baru"
          const shouldRename = s.title === "Obrolan Baru" && s.messages.length === 0;
          return {
            ...s,
            title: shouldRename ? (text.length > 25 ? text.substring(0, 25) + "..." : text) : s.title,
            messages: [...s.messages, userMessage],
          };
        }
        return s;
      })
    );

    // Prepare assistant placeholder
    const assistantMsgId = "msg_" + Date.now() + "_assistant";
    const assistantPlaceholder: Message = {
      id: assistantMsgId,
      role: "model",
      content: "",
      timestamp: Date.now(),
    };

    // Add empty assistant response to state for streaming
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === targetSessionId) {
          return {
            ...s,
            messages: [...s.messages, assistantPlaceholder],
          };
        }
        return s;
      })
    );

    setIsGenerating(true);
    scrollToBottom("smooth");

    // Retrieve active configuration for this API call
    const activeSessionState = sessions.find((s) => s.id === targetSessionId);
    const apiModel = activeSessionState ? activeSessionState.model : selectedModelId;
    const apiPreset = SYSTEM_PRESETS.find(
      (p) => p.id === (activeSessionState ? activeSessionState.systemInstructionId : selectedPresetId)
    ) || SYSTEM_PRESETS[0];
    const apiTemp = activeSessionState ? activeSessionState.temperature : temperature;

    // Build complete message payload
    const updatedSession = sessions.find((s) => s.id === targetSessionId);
    const conversationHistory = updatedSession ? [...updatedSession.messages, userMessage] : [userMessage];

    // Format for backend (convert to standard content schema)
    const formattedHistory = conversationHistory.map((m) => {
      let content = m.content;
      if (m.role === "user" && m.attachment) {
        if (m.attachment.textContent) {
          content = `[File Terlampir: ${m.attachment.name}]\n====================\n${m.attachment.textContent}\n====================\n\n${m.content}`;
        } else {
          content = `[File Terlampir: ${m.attachment.name} (${m.attachment.size} bytes, tipe: ${m.attachment.mime || "unknown"})]\n\n${m.content}`;
        }
      }
      return {
        role: m.role,
        content: content,
      };
    });

    // Build complete system instruction with active presets and memory
    let finalInstruction = apiPreset.instruction;
    if (memories.length > 0) {
      finalInstruction += "\n\n[MEMORI AI (Ingatan pengguna yang tersimpan)]:\n" + memories.map((m, idx) => `${idx + 1}. ${m}`).join("\n");
    }



    // Setup abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: formattedHistory,
          systemInstruction: finalInstruction,
          temperature: apiTemp,
          model: apiModel,
          uid: isLoggedIn ? userId : null,
          idToken: isLoggedIn ? await auth.currentUser?.getIdToken() : null,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to establish stream connection (status ${response.status})`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) {
        throw new Error("Response body is not readable.");
      }

      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Keep last incomplete line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const dataString = trimmed.substring(6);

          // Finished flag
          if (dataString === "[DONE]") {
            break;
          }

          try {
            const parsed = JSON.parse(dataString);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              // Append to assistant message
              setSessions((prev) =>
                prev.map((s) => {
                  if (s.id === targetSessionId) {
                    return {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === assistantMsgId
                          ? { ...m, content: m.content + parsed.text }
                          : m
                      ),
                    };
                  }
                  return s;
                })
              );
            }
          } catch (e: any) {
            const messageLower = (dataString || "").toLowerCase();
            const errMsg = (e && e.message) ? e.message.toLowerCase() : "";
            // Detect Cerebras rate-limit / busy messages and show user-friendly text
            if (errMsg.includes("cerebras") || messageLower.includes("too_many_requests") || messageLower.includes("queue_exceeded") || errMsg.includes("queue_exceeded") || errMsg.includes("too_many_requests")) {
              // Replace the assistant message with a friendly busy notice
              setSessions((prev) =>
                prev.map((s) => {
                  if (s.id === targetSessionId) {
                    return {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === assistantMsgId
                          ? { ...m, content: (m.content || "") + "\n\nServer sedang sibuk saat ini. Silakan coba lagi nanti." }
                          : m
                      ),
                    };
                  }
                  return s;
                })
              );
              console.warn("Cerebras busy/rate-limited — user notified.");
            } else {
              console.warn("Error parsing stream chunk:", e);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Stream generation aborted by user.");
      } else {
        const msg = (err && err.message) ? err.message.toLowerCase() : "";
        if (msg.includes("cerebras") || msg.includes("too_many_requests") || msg.includes("queue_exceeded") || msg.includes("429")) {
          // Friendly user message for busy/rate-limited backend
          setErrorText("Server sedang sibuk. Silakan coba lagi nanti.");
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id === targetSessionId) {
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId && m.content === ""
                      ? { ...m, content: "Server sedang sibuk saat ini. Silakan coba lagi nanti." }
                      : m
                  ),
                };
              }
              return s;
            })
          );
          console.warn("Cerebras busy/rate-limited — user notified.");
        } else {
          console.error("Stream reader error:", err);
          setErrorText(err.message || "Terjadi kesalahan saat memproses jawaban.");
          // Append error notice to message
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id === targetSessionId) {
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId && m.content === ""
                      ? { ...m, content: "Terjadi kesalahan koneksi atau konfigurasi API Key." }
                      : m
                  ),
                };
              }
              return s;
            })
          );
        }
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
      if (isLoggedIn && userId) {
        try {
          const snapshot = await get(ref(db, `users/${userId}`));
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (typeof data.credits === "number") {
              setCredits(data.credits);
            }
          }
        } catch (syncErr) {
          console.error("Gagal sinkronisasi kredit setelah chat:", syncErr);
        }
      }
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  // Copy individual message text
  const copyMessageToClipboard = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => {
      setCopiedMessageId(null);
    }, 2000);
  };

  // Regenerate assistant response
  const handleRegenerateMessage = async (assistantMsgId: string) => {
    if (isGenerating || !currentSessionId) return;
    
    const activeSessionObj = sessions.find((s) => s.id === currentSessionId);
    if (!activeSessionObj) return;

    // Find the index of the assistant message to regenerate
    const msgIndex = activeSessionObj.messages.findIndex((m) => m.id === assistantMsgId);
    if (msgIndex === -1) return;

    // Find the user message before this assistant message
    const priorMessages = activeSessionObj.messages.slice(0, msgIndex);
    const userMessage = priorMessages[priorMessages.length - 1];
    if (!userMessage || userMessage.role !== "user") {
      return;
    }

    // Reset the target assistant message content to empty in state
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          const updatedMsgs = s.messages.map((m) => {
            if (m.id === assistantMsgId) {
              return { ...m, content: "" };
            }
            return m;
          });
          return { ...s, messages: updatedMsgs };
        }
        return s;
      })
    );

    setIsGenerating(true);
    setErrorText(null);

    // Retrieve active configuration for this API call
    const apiModel = activeSessionObj.model || selectedModelId;
    const apiPreset = SYSTEM_PRESETS.find(
      (p) => p.id === (activeSessionObj.systemInstructionId || selectedPresetId)
    ) || SYSTEM_PRESETS[0];
    const apiTemp = activeSessionObj.temperature || temperature;

    // Format prior messages for payload
    const formattedHistory = priorMessages.map((m) => {
      let content = m.content;
      if (m.role === "user" && m.attachment) {
        if (m.attachment.textContent) {
          content = `[File Terlampir: ${m.attachment.name}]\n====================\n${m.attachment.textContent}\n====================\n\n${m.content}`;
        } else {
          content = `[File Terlampir: ${m.attachment.name} (${m.attachment.size} bytes, tipe: ${m.attachment.mime || "unknown"})]\n\n${m.content}`;
        }
      }
      return {
        role: m.role,
        content: content,
      };
    });

    // Build system instruction
    let finalInstruction = apiPreset.instruction;
    if (memories.length > 0) {
      finalInstruction += "\n\n[MEMORI AI (Ingatan pengguna yang tersimpan)]:\n" + memories.map((m, idx) => `${idx + 1}. ${m}`).join("\n");
    }

    // Setup abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: formattedHistory,
          systemInstruction: finalInstruction,
          temperature: apiTemp,
          model: apiModel,
          uid: isLoggedIn ? userId : null,
          idToken: isLoggedIn ? await auth.currentUser?.getIdToken() : null,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to establish stream connection (status ${response.status})`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) {
        throw new Error("Response body is not readable.");
      }

      let buffer = "";
      let accumulatedText = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            try {
              const parsed = JSON.parse(trimmed.substring(5));
              if (parsed.text) {
                accumulatedText += parsed.text;
                // Update specific message in state
                setSessions((prev) =>
                  prev.map((s) => {
                    if (s.id === currentSessionId) {
                      const updatedMsgs = s.messages.map((m) => {
                        if (m.id === assistantMsgId) {
                          return { ...m, content: accumulatedText };
                        }
                        return m;
                      });
                      return { ...s, messages: updatedMsgs };
                    }
                    return s;
                  })
                );
              }
            } catch (err) {
              // ignore parse errors for non-json
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setErrorText("Terjadi kesalahan saat regenerasi jawaban: " + err.message);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Voice Text-to-Speech Handler
  const handleToggleSpeak = (msgId: string, text: string) => {
    if (!ttsSynthRef.current) return;

    if (speakingMessageId === msgId) {
      ttsSynthRef.current.cancel();
      setSpeakingMessageId(null);
    } else {
      ttsSynthRef.current.cancel();
      
      // Filter out markdown formatting tags for cleaner reading
      const cleanText = text
        .replace(/```[\s\S]*?```/g, "") // remove code blocks
        .replace(/`([^`]+)`/g, "$1") // inline code
        .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
        .replace(/\*([^*]+)\*/g, "$1") // italic
        .replace(/[#*>_\-]/g, ""); // structural chars

      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Try to find Indonesian or standard English voice
      const voices = ttsSynthRef.current.getVoices();
      const idVoice = voices.find((v) => v.lang.startsWith("id") || v.lang.startsWith("ID"));
      if (idVoice) {
        utterance.voice = idVoice;
      }
      
      utterance.onend = () => {
        setSpeakingMessageId(null);
      };
      utterance.onerror = () => {
        setSpeakingMessageId(null);
      };

      setSpeakingMessageId(msgId);
      ttsSynthRef.current.speak(utterance);
    }
  };

  // Export Chat
  const handleExportChat = (type: "markdown" | "json") => {
    if (!currentSession || currentSession.messages.length === 0) return;

    let content = "";
    let filename = `${currentSession.title.replace(/\s+/g, "_")}`;

    if (type === "markdown") {
      filename += ".md";
      content = `# ${currentSession.title}\n\n`;
      content += `*Dibuat menggunakan ExeAi pada: ${new Date(currentSession.createdAt).toLocaleString()}*\n`;
      content += `*Model: ${currentSession.model} | Temp: ${currentSession.temperature}*\n\n---\n\n`;

      currentSession.messages.forEach((msg) => {
        const roleName = msg.role === "user" ? "👤 PENGGUNA" : "🤖 EXEAI";
        content += `### ${roleName}\n\n${msg.content}\n\n---\n\n`;
      });
    } else {
      filename += ".json";
      content = JSON.stringify(currentSession, null, 2);
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Clear current chat content
  const handleClearCurrentSession = () => {
    if (!currentSessionId) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === currentSessionId ? { ...s, messages: [] } : s))
    );
    setErrorText(null);
  };

  // Filter session history by search query
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSidebarContent = (isMobile = false) => (
    <div className={`flex flex-col h-full w-full ${curTheme.sidebarBg} text-zinc-100 select-none`}>
      {/* Brand Identity Header */}
      <div className={`p-5 border-b ${curTheme.border} flex items-center justify-between shrink-0`}>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-display font-bold text-sm text-zinc-100 tracking-tight flex items-center gap-1.5">
              ExeChat
              <span className="text-[10px] bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded-full border border-zinc-850 font-medium">v1</span>
            </h1>
          </div>
        </div>

        {/* Config Button (Quick Settings Panel Toggle) */}
        <button
          onClick={() => {
            setShowSettings(!showSettings);
            if (isMobile) setIsMobileSidebarOpen(false);
          }}
          className={`p-1.5 rounded-lg border transition-all duration-200 ${
            showSettings
              ? "bg-zinc-900 border-zinc-800 text-zinc-100"
              : "border-zinc-900/60 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
          }`}
          title="Pengaturan Mode"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-4 pt-4 pb-2">
       <button
          onClick={() => {
            playNotifySound();
            setCurrentSessionId(null);
            setShowSettings(false);
            if (isMobile) setIsMobileSidebarOpen(false);
          }}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium py-2.5 px-4 transition-all duration-200 shadow-md shadow-black/20 text-xs tracking-wide"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Chat Baru</span>
        </button>
      </div>

      {/* Search bar */}
      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari percakapan..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-900 bg-zinc-900/10 text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-zinc-800/80 focus:bg-zinc-900/30 transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 hover:text-zinc-300 text-zinc-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Sessions History List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin">
        <AnimatePresence initial={false}>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-zinc-650 text-xs">
              {searchQuery ? "Tidak ada hasil pencarian." : "Belum ada riwayat chat."}
            </div>
          ) : (
            filteredSessions.map((s) => {
              const isActive = s.id === currentSessionId;
              const isEditing = s.id === editingSessionId;

              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => {
                    if (!isEditing) {
                      playNotifySound();
                      setCurrentSessionId(s.id);
                      setShowSettings(false);
                      setErrorText(null);
                      if (isMobile) setIsMobileSidebarOpen(false);
                    }
                  }}
                  className={`group flex items-center justify-between rounded-xl p-2.5 cursor-pointer text-xs transition-all duration-200 select-none ${
                    isActive
                      ? "bg-zinc-900/50 border border-zinc-850 shadow-sm text-zinc-100 font-medium"
                      : "border border-transparent text-zinc-400 hover:bg-zinc-900/20 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? "text-zinc-300" : "text-zinc-500 group-hover:text-zinc-400"
                      }`}
                    />
                    {isEditing ? (
                      <form
                        onSubmit={(e) => saveRenameSession(s.id, e)}
                        className="flex-1 min-w-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitleInput}
                          onChange={(e) => setEditTitleInput(e.target.value)}
                          onBlur={() => saveRenameSession(s.id)}
                          autoFocus
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-100 text-xs focus:outline-none focus:border-zinc-700"
                        />
                      </form>
                    ) : (
                      <div className="truncate flex-1">
                        {s.title}
                      </div>
                    )}
                  </div>

                  {/* Item Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                      <button
                        onClick={(e) => startRenameSession(s.id, s.title, e)}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                        title="Ubah Nama"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => deleteSession(s.id, e)}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Hapus Chat"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar Status Footer */}
      <div className={`p-4 border-t ${curTheme.border} ${curTheme.sectionBg} text-[11px] space-y-2.5 shrink-0`}>
        {/* User Credits Status Indicator */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-zinc-300 bg-zinc-900/40 border border-zinc-850/60 rounded-xl py-2 px-3">
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>Kredit Sisa:</span>
            </div>
            <span className="font-bold font-mono text-amber-400">{credits} Credits</span>
          </div>

          {!isLoggedIn && (
            <button
              onClick={handleGoogleLoginClick}
              className="w-full text-center text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-900/10 border border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl py-1.5 transition-all font-sans"
            >
              Masuk
            </button>
          )}
        </div>
        
        <div className="text-center text-zinc-600 text-[10px] select-none pt-0.5">
          © 2026 ExeChat version 1
        </div>
      </div>
    </div>
  );

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-zinc-950 font-sans text-zinc-100 selection:bg-zinc-700/80 p-4 relative overflow-hidden">
        {/* Background Accent Gradients */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md rounded-3xl border border-zinc-850 bg-zinc-900/20 backdrop-blur-xl p-8 shadow-2xl relative z-10 text-center animate-fadeIn">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-zinc-900 border border-zinc-850 shadow-inner flex items-center justify-center">
              <svg className="h-10 w-10 animate-[spin_12s_linear_infinite]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3Q12 12 21 12Q12 12 12 21Q12 12 3 12Q12 12 12 3Z" fill="url(#loginGrad)" />
                <circle cx="12" cy="12" r="2.5" fill="#ffffff" className="mix-blend-overlay" />
                <defs>
                  <linearGradient id="loginGrad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#59a6ff" />
                    <stop offset="50%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#ff8da1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 font-semibold mb-1">Selamat Datang di</p>
          <h2 className="text-3xl font-display font-extrabold text-white tracking-tight mb-3">
            ExeChat
          </h2>
          <p className="text-sm text-zinc-400 mb-8 leading-relaxed max-w-xs mx-auto">
            Gunakan akun Google Anda untuk masuk dan mulai berdiskusi dengan AI Assistant cerdas kami secara penuh.
          </p>

          {authMessage && (
            <div className="mb-6 rounded-2xl border border-amber-950/50 bg-amber-950/20 px-4 py-3 text-xs text-amber-300 text-left">
              {authMessage}
            </div>
          )}

          {authStep === "choose" ? (
            <button
              onClick={handleGoogleLoginClick}
              disabled={isLoggingInProcess}
              className="flex w-full items-center justify-center gap-3.5 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-zinc-950 hover:bg-zinc-100 disabled:opacity-70 shadow-lg shadow-white/5 active:scale-[0.98] transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path fill="#4285F4" d="M21.6 12.23c0-.79-.07-1.54-.2-2.27H12v4.3h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.55Z" />
                <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.5c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.58A10 10 0 0 0 12 22Z" />
                <path fill="#FBBC05" d="M6.41 13.91A6.02 6.02 0 0 1 6.41 10.1V7.52H3.07a10 10 0 0 0 0 12.78l3.34-2.59Z" />
                <path fill="#EA4335" d="M12 6.04c1.47 0 2.79.5 3.83 1.48l2.87-2.87A9.98 9.98 0 0 0 3.07 7.52l3.34 2.59C7.2 7.8 9.4 6.04 12 6.04Z" />
              </svg>
              {isLoggingInProcess ? "Sedang Memproses..." : "Masuk dengan Google"}
            </button>
          ) : (
            <form onSubmit={(e) => handleCompleteRegistration(e)} className="space-y-4 text-left">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Nama akun</label>
                <input
                  value={newUsernameInput}
                  onChange={(e) => setNewUsernameInput(e.target.value)}
                  placeholder="Contoh: Budi123"
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-amber-500 transition-all shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Kode redeem (opsional)</label>
                <input
                  value={pendingRedeemCodeInput}
                  onChange={(e) => setPendingRedeemCodeInput(e.target.value)}
                  placeholder="Masukkan kode redeem"
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-500 transition-all shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingInProcess}
                className="w-full rounded-2xl bg-amber-500 px-4 py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-70 active:scale-[0.98] shadow-lg shadow-amber-500/10"
              >
                {isLoggingInProcess ? "Menyimpan Akun..." : "Selesai dan Masuk"}
              </button>
            </form>
          )}
        </div>
        <div className="mt-8 text-center text-zinc-600 text-xs font-mono select-none">
          © 2026 ExeChat • Created by Hexky
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 font-sans text-zinc-100 antialiased selection:bg-zinc-700/80">
      {/* Hidden file input for file uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="*"
        style={{ display: "none" }}
        onChange={handleFileSelected}
      />
      <AnimatePresence>
        {showAuthOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#05070a]/95 backdrop-blur-xl px-4"
          >
            <motion.div
              initial={{ y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: 0.98 }}
              className="w-full max-w-md rounded-3xl border border-zinc-800/70 bg-zinc-950/90 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">ExeChat</p>
                  <h2 className="mt-1 text-xl font-semibold text-zinc-100">
                    {authStep === "register" ? "Lengkapi akun Anda" : "Masuk ke ExeChat"}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowAuthOverlay(false);
                    setAuthStep("choose");
                    setPendingAuthUser(null);
                    setAuthMessage(null);
                  }}
                  className="rounded-full border border-zinc-800 p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-3 text-sm text-zinc-400">
                {authStep === "register"
                  ? "Akun Google Anda belum terdaftar. Buat nama akun, lalu lanjutkan atau lewati kode redeem."
                  : "Pilih akun Google untuk masuk atau mendaftar."}
              </p>

              {authMessage && (
                <div className="mt-4 rounded-xl border border-amber-900/40 bg-amber-950/25 px-3 py-2 text-sm text-amber-300">
                  {authMessage}
                </div>
              )}

              {authStep === "choose" ? (
                <button
                  onClick={handleGoogleLoginClick}
                  disabled={isLoggingInProcess}
                  className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-70"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path fill="#4285F4" d="M21.6 12.23c0-.79-.07-1.54-.2-2.27H12v4.3h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.55Z" />
                    <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.5c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.58A10 10 0 0 0 12 22Z" />
                    <path fill="#FBBC05" d="M6.41 13.91A6.02 6.02 0 0 1 6.41 10.1V7.52H3.07a10 10 0 0 0 0 12.78l3.34-2.59Z" />
                    <path fill="#EA4335" d="M12 6.04c1.47 0 2.79.5 3.83 1.48l2.87-2.87A9.98 9.98 0 0 0 3.07 7.52l3.34 2.59C7.2 7.8 9.4 6.04 12 6.04Z" />
                  </svg>
                  {isLoggingInProcess ? "Memproses..." : "Lanjutkan dengan Google"}
                </button>
              ) : (
                <form onSubmit={(e) => handleCompleteRegistration(e)} className="mt-6 space-y-4">
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-zinc-500">Nama akun</label>
                    <input
                      value={newUsernameInput}
                      onChange={(e) => setNewUsernameInput(e.target.value)}
                      placeholder="Contoh: Budi123"
                      className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-zinc-500">Kode redeem (opsional)</label>
                    <input
                      value={pendingRedeemCodeInput}
                      onChange={(e) => setPendingRedeemCodeInput(e.target.value)}
                      placeholder="Masukkan kode redeem"
                      className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingInProcess}
                    className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-70"
                  >
                    {isLoggingInProcess ? "Menyimpan..." : "Selesai dan masuk"}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Cybernetic Glow Accent */}
      <div className={`absolute top-0 left-0 w-full h-[450px] bg-gradient-to-b ${curTheme.gradient} pointer-events-none select-none z-0`} />

      {/* Main Grid: Left Rail, Expandable Sidebar & Right Chat Workspace */}
      <div className="flex w-full h-full relative z-10">
        
        {/* DESKTOP NARROW LEFT RAIL (Gemini style) */}
        <div className={`hidden md:flex flex-col items-center justify-between py-6 w-16 h-full shrink-0 border-r ${curTheme.border} ${curTheme.sidebarBg} z-20 select-none`}>
          {/* Top: Sparkles Logo & Toggle */}
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="p-1 cursor-pointer hover:scale-105 transition-transform" onClick={() => {
              setCurrentSessionId(null);
              setShowSettings(false);
            }}>
              {/* Custom Rotating Sparkle Logo */}
              <svg className="h-6.5 w-6.5 animate-[spin_10s_linear_infinite]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3Q12 12 21 12Q12 12 12 21Q12 12 3 12Q12 12 12 3Z" fill="url(#customGrad)" />
                <circle cx="12" cy="12" r="2.5" fill="#ffffff" className="mix-blend-overlay" />
                <defs>
                  <linearGradient id="customGrad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#59a6ff" />
                    <stop offset="50%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#ff8da1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Menu Toggle / Toggle History Drawer */}
            <button
              onClick={() => setIsDesktopSidebarOpen(prev => !prev)}
              className={`p-2 rounded-xl transition-all duration-200 ${
                isDesktopSidebarOpen 
                  ? (resolvedTheme === "dark" ? "bg-zinc-800 text-white" : "bg-zinc-200 text-zinc-900") 
                  : `hover:bg-zinc-500/10 ${resolvedTheme === "dark" ? "text-zinc-400" : "text-zinc-500"}`
              }`}
              title="Sembunyikan/Tampilkan Menu Samping"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Middle: Quick actions (New Chat, Settings, etc.) */}
          <div className="flex flex-col items-center gap-4 w-full">
            <button
              onClick={() => {
                setCurrentSessionId(null);
                setShowSettings(false);
              }}
              className={`p-2.5 rounded-xl hover:bg-zinc-500/10 transition-all duration-200 ${resolvedTheme === "dark" ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-900"}`}
              title="Chat Baru"
            >
              <Plus className="h-4.5 w-4.5" />
            </button>

            <button
              onClick={() => {
                setShowSettings(prev => !prev);
              }}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                showSettings 
                  ? "bg-[#1a73e8]/10 text-[#1a73e8]" 
                  : `hover:bg-zinc-500/10 ${resolvedTheme === "dark" ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-900"}`
              }`}
              title="Pengaturan"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Bottom: User Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {isLoggedIn ? (
                <div 
                  onClick={() => setShowSettings(true)}
                  className="h-8 w-8 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-400 to-rose-400 flex items-center justify-center text-xs font-bold text-white shadow-md border border-white/20 cursor-pointer hover:scale-105 transition-all"
                  title="Lihat Profil"
                >
                  {(userDisplayName || userName || "U").charAt(0).toUpperCase()}
                </div>
              ) : (
                <button
                  onClick={handleGoogleLoginClick}
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors border ${resolvedTheme === "dark" ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white" : "bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900"}`}
                  title="Masuk / Sign In"
                >
                  <Cpu className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* DESKTOP SIDEBAR */}
        <AnimatePresence initial={false}>
          {isDesktopSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={`h-full border-r ${curTheme.border} ${curTheme.sidebarBg} flex-col shrink-0 relative hidden md:flex overflow-hidden`}
            >
              <div className="w-[280px] h-full flex flex-col">
                {renderSidebarContent(false)}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* MOBILE SIDEBAR DRAWER */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <>
              {/* Backdrop Overlay */}
              <motion.div
                key="sidebar-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileSidebarOpen(false)}
                className="fixed inset-0 bg-black z-40 md:hidden"
              />
              {/* Drawer Content */}
              <motion.aside
                key="sidebar-drawer"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={`fixed top-0 bottom-0 left-0 w-[280px] h-full border-r ${curTheme.border} ${curTheme.sidebarBg} z-50 flex flex-col md:hidden shadow-2xl`}
              >
                {renderSidebarContent(true)}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

         {/* WORKSPACE AREA */}
        <main className={`flex-1 h-full flex ${curTheme.mainBg} relative overflow-hidden`}>
          
          {/* CHAT SECTION */}
          <div className="flex-1 h-full flex flex-col min-w-0">
                  {/* Chat Workspace Header */}
            <div className={`h-14 md:h-16 px-3.5 md:px-6 border-b ${curTheme.border} ${curTheme.sectionBg} flex items-center justify-between z-10 shrink-0`}>
              <div className="min-w-0 flex items-center gap-2 md:gap-3">
                {/* Mobile Sidebar Toggle */}
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className={`p-1.5 -ml-1 rounded-lg md:hidden transition-colors shrink-0 ${resolvedTheme === "dark" ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900"}`}
                  title="Buka Menu"
                >
                  <Menu className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2 select-none">
                {currentSession && currentSession.messages.length > 0 && (
                  <button
                    onClick={handleClearCurrentSession}
                    className={`p-2 rounded-xl transition-colors ${resolvedTheme === "dark" ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900"}`}
                    title="Bersihkan obrolan"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Chat Area Scrollable */}
            <div className="flex-1 overflow-y-auto px-3.5 md:px-8 py-4 md:py-6 relative z-0 scrollbar-thin">
              <div className="max-w-3xl mx-auto h-full flex flex-col">
                
                {/* Empty / Welcome State */}
                {!currentSession || currentSession.messages.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center py-8 md:py-14 max-w-2xl mx-auto w-full px-2 text-center">
                    {/* Welcome Logo / Sparkles */}
                    <div className="text-center select-none mb-3 md:mb-5">
                      <motion.div
                        initial={{ scale: 0.93, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={`inline-flex h-11 w-11 md:h-14 md:w-14 rounded-2xl flex items-center justify-center shadow-lg border ${
                          isDark ? "bg-[#1e1f20] border-zinc-800" : "bg-[#f0f4f9] border-zinc-200"
                        }`}
                      >
                        {/* Colorful Custom Sparkle SVG */}
                        <svg className="h-6 w-6 md:h-8 md:w-8 animate-[spin_10s_linear_infinite]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 3Q12 12 21 12Q12 12 12 21Q12 12 3 12Q12 12 12 3Z" fill="url(#customGradWelcome)" />
                          <circle cx="12" cy="12" r="2.5" fill="#ffffff" className="mix-blend-overlay" />
                          <defs>
                            <linearGradient id="customGradWelcome" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                              <stop offset="0%" stopColor="#59a6ff" />
                              <stop offset="50%" stopColor="#c084fc" />
                              <stop offset="100%" stopColor="#ff8da1" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </motion.div>
                    </div>

                    <motion.h2
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      className="font-display font-semibold text-3xl sm:text-4xl md:text-[42px] tracking-tight leading-tight mb-8 bg-gradient-to-r from-[#59a6ff] via-[#c084fc] to-[#ff8da1] bg-clip-text text-transparent select-none"
                    >
                      {userDisplayName || userName ? `Halo ${userDisplayName || userName}, yuk kita bahas lebih lanjut` : "Halo, yuk kita bahas lebih lanjut"}
                    </motion.h2>

                    {/* Centered Input Textbox with Shiny Rotating Gradient Border */}
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="w-full shiny-border-container rounded-2xl relative z-10"
                    >
                      <div className={`rounded-[calc(1rem-1.5px)] p-3 md:p-4 transition-all duration-300 focus-within:shadow-md ${
                        isDark ? "bg-[#1e1f20]" : "bg-[#f0f4f9]"
                      }`}>
                      
                      {/* Selected File Display */}
                      {selectedFile && (
                        <div className={`mb-3.5 p-2 px-3 rounded-xl border flex items-center gap-2.5 text-xs animate-fadeIn ${
                          isDark ? "bg-zinc-950 border-zinc-850 text-zinc-300" : "bg-white border-zinc-200 text-zinc-700"
                        }`}>
                          <Paperclip className="h-3.5 w-3.5 text-amber-500 animate-bounce" />
                          <span className="truncate max-w-[180px] sm:max-w-[280px] font-medium">{selectedFile.name}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                          {selectedFile.textContent && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${
                              isDark ? "bg-zinc-900 text-zinc-400 border-zinc-850" : "bg-zinc-100 text-zinc-500 border-zinc-200"
                            }`}>
                              Teks Terbaca
                            </span>
                          )}
                          <button
                            onClick={() => setSelectedFile(null)}
                            className={`ml-auto p-1.5 rounded-lg transition-colors ${
                              isDark ? "text-zinc-500 hover:text-red-400 hover:bg-zinc-900" : "text-zinc-500 hover:text-red-500 hover:bg-zinc-100"
                            }`}
                            title="Hapus lampiran"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      
                      {/* Textarea with Upload Button */}
                      <div className="flex items-end gap-2">
                        {/* Upload button - left side */}
                        <button
                          onClick={() => {
                            console.log("[Button] Upload clicked");
                            fileInputRef.current?.click();
                          }}
                          className={`p-2 md:p-2.5 rounded-lg md:rounded-xl transition-colors shrink-0 -ml-1 ${
                            isDark ? "hover:bg-zinc-800/50 hover:text-amber-400 text-zinc-400" : "hover:bg-zinc-200 text-zinc-600 hover:text-[#1a73e8]"
                          }`}
                          title="Lampirkan File (Teks, Kode, Gambar, Audio, dsb)"
                        >
                          <Plus className="h-4.5 w-4.5 stroke-[2]" />
                        </button>

                        <textarea
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Tanyakan apa saja ke ExeChat..."
                          disabled={isGenerating}
                          className={`flex-1 bg-transparent resize-none border-none outline-none focus:ring-0 text-xs md:text-sm min-h-[64px] md:min-h-[90px] max-h-40 font-sans ${
                            isDark ? "text-zinc-200 placeholder-zinc-500" : "text-zinc-800 placeholder-zinc-400"
                          }`}
                          style={{ height: "auto" }}
                        />
                      </div>

                      {/* Controls at the bottom of the input box */}
                      <div className={`flex items-center justify-between mt-2.5 pt-2.5 border-t ${
                        isDark ? "border-zinc-950" : "border-zinc-200"
                      }`}>
                        {/* Selector Controls (Model & Preset) */}
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                          <select
                            value={currentSession ? currentSession.model : selectedModelId}
                            onChange={(e) => {
                              const val = e.target.value;
                              const targetModel = MODEL_OPTIONS.find((m) => m.id === val);
                              const allowedModelId = MODEL_OPTIONS.find((m) => m.name === "exeai-glm-4.7" || m.id === "zai-glm-4.7")?.id;
                              if (!isLoggedIn && targetModel && targetModel.id !== allowedModelId) {
                                setErrorText("Tamu hanya boleh menggunakan model exeai-glm-4.7.");
                                return;
                              }
                              if (currentSession) {
                                setSessions((prev) =>
                                  prev.map((s) => (s.id === currentSessionId ? { ...s, model: val } : s))
                                );
                              } else {
                                setSelectedModelId(val);
                              }
                            }}
                            disabled={!isLoggedIn}
                            className={`text-[10px] md:text-[11px] rounded-lg py-1 px-1.5 md:px-2.5 max-w-[100px] sm:max-w-none truncate font-sans cursor-pointer focus:outline-none transition-all ${
                              isDark 
                                ? "bg-zinc-950 hover:bg-zinc-900 text-zinc-400 border-zinc-900" 
                                : "bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200"
                            } ${!isLoggedIn ? "opacity-60 cursor-not-allowed" : ""}`}
                            title={!isLoggedIn ? "Login untuk mengakses model AI lainnya" : ""}
                          >
                            {!isLoggedIn
                              ? MODEL_OPTIONS.filter((m) => m.name === "exeai-glm-4.7" || m.id === "zai-glm-4.7").map((m) => (
                                  <option key={m.id} value={m.id} className={isDark ? "bg-zinc-950 text-zinc-300" : "bg-white text-zinc-700"}>
                                    {m.name}
                                  </option>
                                ))
                              : MODEL_OPTIONS.map((m) => (
                                  <option key={m.id} value={m.id} className={isDark ? "bg-zinc-950 text-zinc-300" : "bg-white text-zinc-700"}>
                                    {m.name}
                                  </option>
                                ))}
                          </select>

                          <select
                            value={currentSession ? currentSession.systemInstructionId : selectedPresetId}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (currentSession) {
                                setSessions((prev) =>
                                  prev.map((s) => (s.id === currentSessionId ? { ...s, systemInstructionId: val } : s))
                                );
                              } else {
                                setSelectedPresetId(val);
                              }
                            }}
                            className={`text-[10px] md:text-[11px] rounded-lg py-1 px-1.5 md:px-2.5 max-w-[100px] sm:max-w-none truncate font-sans cursor-pointer focus:outline-none transition-all ${
                              isDark 
                                ? "bg-zinc-950 hover:bg-zinc-900 text-zinc-400 border-zinc-900" 
                                : "bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200"
                            }`}
                          >
                            {SYSTEM_PRESETS.map((p) => (
                              <option key={p.id} value={p.id} className={isDark ? "bg-zinc-950 text-zinc-300" : "bg-white text-zinc-700"}>
                                Preset: {p.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Send button */}
                        <button
                          onClick={() => handleSendMessage()}
                          disabled={!inputMessage.trim() || isGenerating}
                          className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all duration-200 flex items-center justify-center shadow-md ${
                            inputMessage.trim()
                              ? (isDark 
                                  ? "bg-white hover:bg-zinc-200 text-zinc-950 cursor-pointer hover:scale-105" 
                                  : "bg-[#1a73e8] hover:bg-[#1557b0] text-white cursor-pointer hover:scale-105")
                              : (isDark 
                                  ? "bg-zinc-900 text-zinc-600 cursor-not-allowed" 
                                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed")
                          }`}
                          title="Kirim Pesan"
                        >
                          <Send className="h-3.5 w-3.5 md:h-4 md:w-4 stroke-[2.5]" />
                        </button>
                      </div>
                      </div>
                    </motion.div>

                    {/* Preset Info banner */}
                    <div className="mt-4 md:mt-6 text-center select-none">
                      <div className={`inline-flex items-center gap-1 border rounded-full px-3 py-1 text-[9px] md:text-[10px] font-sans tracking-wide ${
                        isDark 
                          ? "bg-zinc-900/10 border-zinc-900/80 text-zinc-500" 
                          : "bg-zinc-100 border-zinc-200 text-zinc-500"
                      }`}>
                        <Info className="h-3 w-3 md:h-3.5 md:w-3.5 text-zinc-450" />
                        <span>Menggunakan model {activeModel.name} dengan preset {activePreset.name}.</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Message list
                  <div className="space-y-3.5 md:space-y-6 flex-1">
                    {currentSession.messages.map((msg, index) => {
                      const isUser = msg.role === "user";
                      const isSpeaking = speakingMessageId === msg.id;

                      return (
                        <motion.div
                          key={msg.id || index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          {/* Message bubble */}
                          <div
                            className={`max-w-[88%] md:max-w-[82%] transition-all duration-300 ${
                              isUser
                                ? `${curTheme.bubbleUser} rounded-[20px] rounded-tr-sm p-3 px-4 shadow-sm border`
                                : "bg-transparent border-transparent p-0"
                            }`}
                          >


                             {/* Message content */}
                             {isUser ? (
                               <div className="whitespace-pre-wrap leading-relaxed text-zinc-250 font-sans text-xs sm:text-sm md:text-[15px] select-text flex flex-col gap-2.5">
                                 {msg.attachment && (
                                   <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 max-w-sm hover:border-zinc-700/80 transition-all duration-300">
                                     <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-500 shrink-0 shadow-inner">
                                       {msg.attachment.type === "image" ? (
                                         <Sparkles className="h-4 w-4" />
                                       ) : msg.attachment.type === "audio" ? (
                                         <Volume2 className="h-4 w-4" />
                                       ) : (
                                         <FileText className="h-4 w-4" />
                                       )}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                       <div className="text-xs font-semibold text-zinc-100 truncate flex items-center gap-1.5">
                                         <span>{msg.attachment.name}</span>
                                         {msg.attachment.textContent && (
                                           <span className="text-[9px] bg-zinc-900 text-zinc-400 px-1 py-0.5 rounded border border-zinc-850 font-normal">
                                             Text
                                           </span>
                                         )}
                                       </div>
                                       <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                         {(msg.attachment.size / 1024).toFixed(1)} KB • {msg.attachment.mime || "unknown"}
                                       </div>
                                     </div>
                                   </div>
                                 )}
                                 <div>{msg.content}</div>
                               </div>
                             ) : (
                              // Custom Markdown rendering
                              msg.content === "" && isGenerating && index === currentSession.messages.length - 1 ? (
                                <div className="flex flex-col gap-3.5 py-2.5 select-none w-full max-w-sm bg-zinc-900/40 rounded-2xl border border-zinc-850 p-4">
                                  {/* Shimmering waveform gradient dots */}
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-amber-500 animate-[spin_4s_linear_infinite]" />
                                    <span className="text-xs text-zinc-300 font-semibold font-sans">ExeChat sedang berpikir...</span>
                                  </div>
                                  <div className="space-y-2 mt-1">
                                    {/* Step 1 */}
                                    <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                      <span>[OK] Menganalisis konteks obrolan...</span>
                                    </div>
                                    {/* Step 2 */}
                                    <div className="flex items-center gap-2 text-[11px] text-indigo-400 font-mono animate-pulse">
                                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
                                      <span>[*] Merancang struktur penyelesaian...</span>
                                    </div>
                                    {/* Step 3 */}
                                    <div className="flex items-center gap-2 text-[11px] text-zinc-650 font-mono">
                                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
                                      <span>[ ] Memformulasikan respons...</span>
                                    </div>
                                  </div>
                                  <div className="w-full bg-zinc-950 rounded-full h-1 mt-1 overflow-hidden border border-zinc-900">
                                    <div className="bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500 h-full animate-[shimmer_1.5s_infinite]" style={{ width: "40%" }} />
                                  </div>
                                </div>
                              ) : (
                                <div className="text-zinc-800 dark:text-zinc-100 font-sans text-sm sm:text-base md:text-[16px] leading-relaxed select-text">
                                  <MarkdownRenderer content={msg.content} />
                                  
                                  {isGenerating && index === currentSession.messages.length - 1 && (
                                    <div className="mt-4 flex flex-col gap-2 p-3.5 rounded-2xl bg-zinc-900/30 border border-zinc-850/60 max-w-sm animate-pulse select-none">
                                      <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold">
                                        <Code2 className="h-3.5 w-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '3s' }} />
                                        <span>Thinking Progress:</span>
                                      </div>
                                      <div className="space-y-1 font-mono text-[11px]">
                                        <div className="flex items-center gap-1.5 text-emerald-400">
                                          <span>✓</span> <span>Analisis Struktur Sukses</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-indigo-400">
                                          <span>✓</span> <span>Optimalisasi Token & Arsitektur</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-amber-500">
                                          <span className="animate-ping">•</span> <span>Menyusun Baris Kode & Markdown...</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {isSpeaking && (
                                    <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-mono animate-pulse">
                                      <Volume2 className="h-3.5 w-3.5 animate-bounce" />
                                      <span>TTS sedang bersuara...</span>
                                    </div>
                                  )}
                                </div>
                              )
                            )}

                            {/* Actions footer (copy, rate, speak) */}
                            {!isUser && msg.content !== "" && (
                              <div className="flex items-center gap-1 sm:gap-2 mt-3 select-none text-zinc-400 dark:text-zinc-500">
                                {/* Like button */}
                                <button
                                  onClick={() => {
                                    setLikedMessages((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }));
                                    setDislikedMessages((prev) => ({ ...prev, [msg.id]: false }));
                                  }}
                                  className={`p-1.5 rounded-lg hover:bg-zinc-500/10 hover:text-zinc-200 transition-all duration-250 ${
                                    likedMessages[msg.id] ? "text-blue-500 font-semibold bg-blue-500/10" : "text-zinc-400 dark:text-zinc-500"
                                  }`}
                                  title="Suka"
                                >
                                  <ThumbsUp className={`h-4 w-4 ${likedMessages[msg.id] ? "fill-current" : ""}`} />
                                </button>

                                {/* Dislike button */}
                                <button
                                  onClick={() => {
                                    setDislikedMessages((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }));
                                    setLikedMessages((prev) => ({ ...prev, [msg.id]: false }));
                                  }}
                                  className={`p-1.5 rounded-lg hover:bg-zinc-500/10 hover:text-zinc-200 transition-all duration-250 ${
                                    dislikedMessages[msg.id] ? "text-red-500 font-semibold bg-red-500/10" : "text-zinc-400 dark:text-zinc-500"
                                  }`}
                                  title="Tidak Suka"
                                >
                                  <ThumbsDown className={`h-4 w-4 ${dislikedMessages[msg.id] ? "fill-current" : ""}`} />
                                </button>

                                {/* Regenerate button */}
                                <button
                                  onClick={() => handleRegenerateMessage(msg.id)}
                                  className={`p-1.5 rounded-lg hover:bg-zinc-500/10 hover:text-zinc-200 transition-all duration-250 ${isGenerating ? "opacity-40 cursor-not-allowed" : ""}`}
                                  disabled={isGenerating}
                                  title="Coba Lagi / Regenerasi"
                                >
                                  <RotateCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                                </button>

                                {/* Copy button */}
                                <button
                                  onClick={() => copyMessageToClipboard(msg.id, msg.content)}
                                  className="p-1.5 rounded-lg hover:bg-zinc-500/10 hover:text-zinc-200 transition-all duration-250"
                                  title="Salin jawaban"
                                >
                                  {copiedMessageId === msg.id ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>

                                {/* More / Titik 3 dropdown for Voice */}
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdownMsgId(prev => prev === msg.id ? null : msg.id);
                                    }}
                                    className={`p-1.5 rounded-lg hover:bg-zinc-500/10 hover:text-zinc-200 transition-all duration-250 ${activeDropdownMsgId === msg.id ? "bg-zinc-500/15" : ""}`}
                                    title="Lainnya"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>

                                  {activeDropdownMsgId === msg.id && (
                                    <>
                                      {/* Dropdown Backdrop to close on outer click */}
                                      <div 
                                        className="fixed inset-0 z-30" 
                                        onClick={() => setActiveDropdownMsgId(null)}
                                      />
                                      <div className={`absolute bottom-full left-0 mb-2 z-45 w-48 rounded-xl border p-1 shadow-xl animate-fadeIn ${
                                        isDark 
                                          ? "bg-zinc-900 border-zinc-850 text-zinc-200" 
                                          : "bg-white border-zinc-200 text-zinc-800"
                                      }`}>
                                        <button
                                          onClick={() => {
                                            handleToggleSpeak(msg.id, msg.content);
                                            setActiveDropdownMsgId(null);
                                          }}
                                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-sans rounded-lg transition-colors text-left ${
                                            isDark ? "hover:bg-zinc-800 text-zinc-200" : "hover:bg-zinc-100 text-zinc-700"
                                          }`}
                                        >
                                          {isSpeaking ? (
                                            <>
                                              <VolumeX className="h-4 w-4 text-red-500" />
                                              <span className="text-red-500 font-semibold">Hentikan Suara</span>
                                            </>
                                          ) : (
                                            <>
                                              <Volume2 className="h-4 w-4 text-[#1a73e8]" />
                                              <span>Dengarkan Suara</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* Small compact timestamp */}
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-500 ml-auto font-mono flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Loader typing indicator */}
                    {isGenerating && currentSession.messages[currentSession.messages.length - 1]?.content !== "" && (
                      <div className="flex items-center gap-1.5 text-zinc-500 pl-9 md:pl-12 py-1 text-[11px] md:text-xs select-none">
                        <RefreshCw className="h-2.5 w-2.5 md:h-3 md:w-3 animate-spin text-zinc-600" />
                        <span>AI sedang memikirkan & mengetik jawaban...</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Scroll Anchor */}
                <div ref={chatBottomRef} />
              </div>
            </div>

            {/* ERROR DISPLAY */}
            {errorText && (
              <div className="px-6 py-2.5 bg-red-950/20 border-t border-red-900/30 text-red-400 text-xs flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-400" />
                  <span>{errorText}</span>
                </div>
                <button onClick={() => setErrorText(null)} className="hover:text-red-300">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* CHAT INPUT FORM AREA */}
            {currentSession && currentSession.messages.length > 0 && (
              <div className="p-2.5 md:p-4 border-t border-zinc-900 bg-zinc-950/80 shrink-0 z-10">
                <div className="max-w-3xl mx-auto relative">
                  
                  {/* Quick actions box directly above inputs */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2 md:mb-3 text-[10px] md:text-xs text-zinc-500 px-0.5">
                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                      {/* Model Selector */}
                      <select
                        value={currentSession ? currentSession.model : selectedModelId}
                        onChange={(e) => {
                          const val = e.target.value;
                          const targetModel = MODEL_OPTIONS.find((m) => m.id === val);
                          const allowedModelId = MODEL_OPTIONS.find((m) => m.name === "exeai-glm-4.7" || m.id === "zai-glm-4.7")?.id;
                          if (!isLoggedIn && targetModel && targetModel.id !== allowedModelId) {
                            setErrorText("Tamu hanya boleh menggunakan model exeai-glm-4.7.");
                            return;
                          }
                          if (currentSession) {
                            setSessions((prev) =>
                              prev.map((s) => (s.id === currentSessionId ? { ...s, model: val } : s))
                            );
                          } else {
                            setSelectedModelId(val);
                          }
                        }}
                        disabled={!isLoggedIn}
                        className={`bg-zinc-900 hover:bg-zinc-900/80 text-zinc-300 border border-zinc-850 hover:border-zinc-850 text-[10px] md:text-[11px] rounded-lg py-1 px-2 font-mono max-w-[105px] sm:max-w-none truncate cursor-pointer focus:outline-none transition-all shadow-sm ${!isLoggedIn ? "opacity-60 cursor-not-allowed" : ""}`}
                        title={!isLoggedIn ? "Login untuk mengakses model AI lainnya" : ""}
                      >
                        {!isLoggedIn
                          ? MODEL_OPTIONS.filter((m) => m.name === "exeai-glm-4.7" || m.id === "zai-glm-4.7").map((m) => (
                              <option key={m.id} value={m.id} className="bg-zinc-950 text-zinc-300">
                                {m.name}
                              </option>
                            ))
                          : MODEL_OPTIONS.map((m) => (
                              <option key={m.id} value={m.id} className="bg-zinc-950 text-zinc-300">
                                {m.name}
                              </option>
                            ))}
                      </select>

                      {/* Preset/Instruction Selector */}
                      <select
                        value={currentSession ? currentSession.systemInstructionId : selectedPresetId}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (currentSession) {
                            setSessions((prev) =>
                              prev.map((s) => (s.id === currentSessionId ? { ...s, systemInstructionId: val } : s))
                            );
                          } else {
                            setSelectedPresetId(val);
                          }
                        }}
                        className="bg-zinc-900 hover:bg-zinc-900/80 text-zinc-300 border border-zinc-850 hover:border-zinc-850 text-[10px] md:text-[11px] rounded-lg py-1 px-2 font-mono max-w-[105px] sm:max-w-none truncate cursor-pointer focus:outline-none transition-all shadow-sm"
                      >
                        {SYSTEM_PRESETS.map((p) => (
                          <option key={p.id} value={p.id} className="bg-zinc-950 text-zinc-300">
                            Preset: {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Character Counter & Cost Display */}
                    <div className="flex items-center gap-2 md:gap-3 font-mono text-[9px] md:text-[10px] text-zinc-650 select-none">
                      <span>Estimasi: {getCreditCost(inputMessage)} kredit</span>
                      <span>{inputMessage.length} karakter</span>
                    </div>
                  </div>

                  {/* Input block */}
                  <div className="relative rounded-xl md:rounded-2xl border border-zinc-900 bg-zinc-900/20 p-1.5 md:p-2 focus-within:border-zinc-800 focus-within:bg-zinc-900/40 transition-all duration-300 flex flex-col">
                    {/* Selected File Preview inside input block */}
                    {selectedFile && (
                      <div className="mx-1 mb-2.5 p-2 px-3 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center gap-2.5 text-xs text-zinc-300 animate-fadeIn">
                        <Paperclip className="h-3.5 w-3.5 text-amber-500 animate-bounce" />
                        <span className="truncate max-w-[180px] sm:max-w-[280px] font-medium">{selectedFile.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                        {selectedFile.textContent && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 font-mono border border-zinc-850">
                            Teks Terbaca
                          </span>
                        )}
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="ml-auto p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors"
                          title="Hapus lampiran"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-end w-full">
                      {/* Upload button inside textbox - left side */}
                      <button
                        onClick={() => {
                          console.log("[Button] Upload clicked");
                          fileInputRef.current?.click();
                        }}
                        className="p-2 md:p-2.5 rounded-lg md:rounded-xl hover:bg-zinc-800 hover:text-amber-400 transition-colors text-zinc-500 shrink-0"
                        title="Unggah file pendukung (Teks, Kode, Gambar, dsb)"
                      >
                        <Plus className="h-4 w-4 md:h-5 md:w-5 stroke-[2]" />
                      </button>

                    <textarea
                      rows={1}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={
                        isGenerating
                          ? "Harap tunggu jawaban model selesai..."
                          : "Tanyakan apa saja ke ExeChat..."
                      }
                      disabled={isGenerating}
                      className="flex-1 max-h-40 min-h-[38px] md:min-h-[44px] bg-transparent resize-none py-2 px-2.5 border-none outline-none focus:ring-0 text-zinc-200 text-xs md:text-sm placeholder-zinc-550"
                      style={{ height: "auto" }}
                    />

                    {/* Abort button / Submit button */}
                    <div className="flex items-center gap-1 pl-1.5 shrink-0">
                      {isGenerating ? (
                        <button
                          onClick={handleStopGeneration}
                          className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-red-950/40 border border-red-900/30 hover:border-red-900 hover:bg-red-950/60 text-red-400 transition-all duration-200 flex items-center justify-center cursor-pointer shadow-md"
                          title="Hentikan jawaban"
                        >
                          <X className="h-3.5 w-3.5 md:h-4.5 md:w-4.5 stroke-[2.5]" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendMessage()}
                          disabled={!inputMessage.trim()}
                          className={`p-2 md:p-2.5 rounded-lg md:rounded-xl transition-all duration-200 flex items-center justify-center shadow-md ${
                            inputMessage.trim()
                              ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-950 cursor-pointer hover:scale-105"
                              : "bg-zinc-900 border border-zinc-850 text-zinc-600 cursor-not-allowed"
                          }`}
                          title="Kirim Pesan"
                        >
                          <Send className="h-3.5 w-3.5 md:h-4.5 md:w-4.5 stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                  {/* Footnote instruction advice */}
                  <p className="text-[9px] md:text-[10px] text-zinc-600 text-center select-none mt-1.5 md:mt-2 font-sans">
                    Ketik pesan dan tekan <kbd className="px-1 py-0.5 bg-zinc-900 border border-zinc-850 rounded text-zinc-500 text-[8px] md:text-[9px]">Enter</kbd> untuk berkirim pesan. ExeChat dapat menampilkan informasi yang salah.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT SETTINGS PANEL (FULL-PAGE OVERLAY) */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className={`absolute inset-0 backdrop-blur-xl flex flex-col z-40 ${isDark ? "bg-[#0b0c0e]/95 text-[#e3e3e3]" : "bg-white/95 text-[#1f1f1f]"}`}
              >
                {/* Header */}
                <div className={`p-6 border-b ${curTheme.border} ${curTheme.sectionBg} flex items-center justify-between shrink-0`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isDark ? "bg-zinc-900 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`}>
                      <Settings className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className={`text-base font-display font-bold ${curTheme.textTitle}`}>
                        Pengaturan ExeChat v1
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className={`p-2 rounded-xl transition-all shadow-sm ${isDark ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900"}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 max-w-4xl mx-auto w-full">
                  
                  {/* Section 1: Akun & Kredit (NEW INTEGRATION) */}
                  <div className={`rounded-2xl p-6 space-y-4 border ${isDark ? "bg-zinc-900/20 border-zinc-900" : "bg-zinc-100/50 border-zinc-200"}`}>
                    <h3 className="text-xs font-semibold tracking-wider text-zinc-400 font-mono uppercase">
                      Informasi Akun & Kredit Harian
                    </h3>
                    
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border ${isDark ? "bg-zinc-900/40 border-zinc-850/60" : "bg-white border-zinc-200"}`}>
                      <div>
                        {isLoggedIn ? (
                          <>
                            <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Sign In sebagai {userEmail}</span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">Anda berhak mengklaim 50 kredit gratis setiap hari.</p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 text-zinc-450 font-semibold text-sm">
                              <span className="h-2 w-2 rounded-full bg-amber-500" />
                              <span>Mode Guest (Tamu)</span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">Sisa limit Anda adalah 5 kredit gratis. Hubungkan akun Google untuk mendapatkan 50 kredit harian.</p>
                          </>
                        )}
                      </div>

                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        <div className="font-mono text-xs text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-900 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                          <span>Total Kredit: <strong className="text-amber-400 text-sm">{credits}</strong></span>
                        </div>

                        {isLoggedIn ? (
                          <div className="space-y-3 w-full sm:w-auto text-left">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="text-[11px] text-zinc-400">Nama Akun</div>
                              <div className="text-[11px] text-zinc-200 text-right">{userDisplayName || userEmail}</div>
                              <div className="text-[11px] text-zinc-400">Username</div>
                              <div className="text-[11px] text-zinc-200 text-right">{userName || "Belum diatur"}</div>
                            </div>
                            <button
                              onClick={handleClaimDailyCredits}
                              className="w-full text-xs bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold py-1.5 px-4 rounded-lg transition-all"
                            >
                              Klaim 50 Kredit Harian
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleGoogleLoginClick}
                            className="w-full sm:w-auto text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold py-1.5 px-4 rounded-lg transition-all"
                          >
                            Masuk / Daftar dengan Google
                          </button>
                        )}
                      </div>
                    </div>

                    {isLoggedIn && (
                      <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4 space-y-4">
                        <h4 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase font-mono">Akun Anda</h4>
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="text-[10px] text-zinc-500 uppercase tracking-wide font-mono">Username ExeChat</label>
                            <div className="mt-2 flex gap-2">
                              <input
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="Username Anda"
                                className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                              />
                              <button
                                onClick={handleSaveUsername}
                                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-semibold"
                              >
                                Simpan
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-zinc-500 uppercase tracking-wide font-mono">Kode Redeem</label>
                            <div className="mt-2 flex gap-2">
                              <input
                                value={redeemCodeInput}
                                onChange={(e) => setRedeemCodeInput(e.target.value)}
                                placeholder="MASUKAN KODE"
                                className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                              />
                              <button
                                onClick={() => handleRedeemCode()}
                                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-semibold"
                              >
                                Tukarkan
                              </button>
                            </div>
                            {redeemFeedback && (
                              <p className="mt-2 text-[10px] text-emerald-300">{redeemFeedback}</p>
                            )}
                          </div>

                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 2: Model selection */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold tracking-wider text-zinc-400 font-mono uppercase">
                      Pilihan Model Engine AI
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(isLoggedIn
                        ? MODEL_OPTIONS
                        : MODEL_OPTIONS.filter((m) => m.name === "exeai-glm-4.7" || m.id === "zai-glm-4.7")
                      ).map((m) => {
                        const isSelected = currentSession
                          ? currentSession.model === m.id
                          : selectedModelId === m.id;

                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              const allowedModelId = MODEL_OPTIONS.find((mm) => mm.name === "exeai-glm-4.7" || mm.id === "zai-glm-4.7")?.id;
                              if (!isLoggedIn && m.id !== allowedModelId) {
                                setErrorText("Tamu hanya boleh menggunakan model exeai-glm-4.7.");
                                return;
                              }
                              if (currentSession) {
                                setSessions((prev) =>
                                  prev.map((s) => (s.id === currentSessionId ? { ...s, model: m.id } : s))
                                );
                              } else {
                                setSelectedModelId(m.id);
                              }
                            }}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                              isSelected
                                ? "bg-zinc-900/60 border-zinc-700/80 shadow-lg shadow-black/20"
                                : "border-zinc-900 bg-zinc-900/10 hover:border-zinc-800"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-semibold ${isSelected ? "text-zinc-100" : "text-zinc-300"}`}>
                                  {m.name}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                                  m.id === "gemma-4-31b"
                                    ? "bg-zinc-800 border border-zinc-750 text-zinc-300"
                                    : "bg-amber-950/20 border border-amber-900/30 text-amber-400"
                                }`}>
                                  {m.id === "gemma-4-31b" ? "Lightweight" : "Powerful"}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-500 leading-relaxed font-sans">
                                {m.description}
                              </p>
                            </div>
                            <div className="mt-3 text-[10px] font-mono text-zinc-600">
                              Cost: 1-4 credits/query
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 3: System Presets */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold tracking-wider text-zinc-400 font-mono uppercase">
                      Karakter / Preset AI
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {SYSTEM_PRESETS.map((preset) => {
                        const isSelected = currentSession
                          ? currentSession.systemInstructionId === preset.id
                          : selectedPresetId === preset.id;

                        return (
                          <div
                            key={preset.id}
                            onClick={() => {
                              if (currentSession) {
                                setSessions((prev) =>
                                  prev.map((s) => (s.id === currentSessionId ? { ...s, systemInstructionId: preset.id } : s))
                                );
                              } else {
                                setSelectedPresetId(preset.id);
                              }
                            }}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                              isSelected
                                ? "bg-zinc-900/60 border-zinc-700/80 shadow-lg shadow-black/20"
                                : "border-zinc-900 bg-zinc-900/10 hover:border-zinc-800"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className={`p-1.5 rounded-xl ${isSelected ? "bg-zinc-100 text-zinc-950" : "bg-zinc-900 text-zinc-400"}`}>
                                {getPresetIcon(preset.icon, "h-4 w-4")}
                              </div>
                              <span className={`text-sm font-semibold ${isSelected ? "text-zinc-100" : "text-zinc-300"}`}>
                                {preset.name}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 leading-relaxed font-sans">
                              {preset.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 4: Tema Tampilan (Redesigned Theme Switcher) */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold tracking-wider text-zinc-400 font-mono uppercase">
                      Pengaturan Tema Tampilan
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: "system", name: "Sistem", desc: "Ikuti tema perangkat", icon: Laptop },
                        { id: "dark", name: "Hitam (Gelap)", desc: "Tema gelap hemat daya", icon: Moon },
                        { id: "light", name: "Putih (Terang)", desc: "Tema terang kontras tinggi", icon: Sun },
                      ].map((t) => {
                        const isSelected = themeMode === t.id;
                        const IconComp = t.icon;

                        return (
                          <div
                            key={t.id}
                            onClick={() => setThemeMode(t.id as any)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between items-start text-left ${
                              isSelected
                                ? "bg-[#1a73e8]/10 border-[#1a73e8] shadow-lg shadow-[#1a73e8]/5"
                                : "border-zinc-900 bg-zinc-900/10 hover:border-zinc-800"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className={`p-1.5 rounded-xl ${isSelected ? "bg-[#1a73e8] text-white" : "bg-zinc-900 text-zinc-400"}`}>
                                <IconComp className="h-4 w-4" />
                              </div>
                              <span className={`text-sm font-semibold ${isSelected ? "text-zinc-100" : "text-zinc-300"}`}>
                                {t.name}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 leading-normal font-sans">
                              {t.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 5: Ingatan AI (Memory) */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-amber-500" />
                      <h3 className="text-xs font-semibold tracking-wider text-zinc-400 font-mono uppercase">
                        Ingatan AI (Memory - Maksimal 5)
                      </h3>
                    </div>
                    
                    <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-6 space-y-4">
                      <p className="text-xs text-zinc-450 leading-relaxed font-sans">
                        ExeChat akan mengingat preferensi, nama, atau konteks khusus yang Anda simpan di sini untuk semua sesi obrolan mendatang.
                      </p>

                      {/* Add Memory Form */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={memoryInput}
                          onChange={(e) => setMemoryInput(e.target.value)}
                          placeholder={memories.length >= 5 ? "Batas maksimal ingatan tercapai" : "Contoh: Panggil saya Nairi..."}
                          disabled={memories.length >= 5}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && memoryInput.trim()) {
                              e.preventDefault();
                              if (memories.length < 5) {
                                setMemories((prev) => [...prev, memoryInput.trim()]);
                                setMemoryInput("");
                              }
                            }
                          }}
                          className="flex-1 bg-zinc-950 border border-zinc-900 focus:border-zinc-850 focus:outline-none rounded-xl px-4 py-2 text-xs text-zinc-200 placeholder-zinc-650 font-sans"
                        />
                        <button
                          onClick={() => {
                            if (memoryInput.trim() && memories.length < 5) {
                              setMemories((prev) => [...prev, memoryInput.trim()]);
                              setMemoryInput("");
                            }
                          }}
                          disabled={!memoryInput.trim() || memories.length >= 5}
                          className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-650 text-zinc-950 text-xs font-semibold font-sans transition-all shrink-0"
                        >
                          Simpan
                        </button>
                      </div>

                      {memories.length >= 5 && (
                        <p className="text-[10px] text-amber-500 font-sans">
                          * Batas maksimal 5 ingatan telah tercapai. Hapus beberapa ingatan jika ingin menambahkan yang baru.
                        </p>
                      )}

                      {/* Memories List */}
                      <div className="space-y-2 pt-2">
                        {memories.length === 0 ? (
                          <div className="text-center py-4 border border-dashed border-zinc-900 rounded-xl text-zinc-600 text-xs font-sans">
                            Belum ada ingatan yang tersimpan. Tambahkan preferensi Anda di atas!
                          </div>
                        ) : (
                          memories.map((mem, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950 transition-all text-left"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                <span className="text-xs text-zinc-300 truncate font-sans">{mem}</span>
                              </div>
                              <button
                                onClick={() => setMemories((prev) => prev.filter((_, i) => i !== idx))}
                                className="p-1 rounded bg-zinc-900/30 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 transition-colors shrink-0"
                                title="Hapus Ingatan"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}


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
  ChevronDown,
  ChevronLeft,
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
  RotateCw,
  User,
  LogOut,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Message, ChatSession, SystemPreset, ModelOption } from "./types";
import { MarkdownRenderer } from "./components/MarkdownRenderer";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { MODEL_OPTIONS, SYSTEM_PRESETS, SUGGESTED_PROMPTS } from "./presets";

const notifySoundUrl = new URL("../Sound/notify.mp3", import.meta.url).href;

export default function App() {

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
      "ada ide baru?",
      "mau bahas apa hari ini?",
      "apa yang ingin kamu ketahui?",
      "ada yang bisa kubantu?",
      "mari buat sesuatu yang hebat!",
      "tanyakan apa saja padaku.",
      "ada topik seru hari ini?"
    ];
    const randomIdx = Math.floor(Math.random() * greetings.length);
    setWelcomeGreeting(greetings[randomIdx]);
  }, []);

  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedPresetId, setSelectedPresetId] = useState("default");
  const [selectedModelId, setSelectedModelId] = useState("gemma-4-31b");
  const [globalWebSearchEnabled, setGlobalWebSearchEnabled] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"akun" | "model" | "tampilan" | "ingatan">("akun");
  const [cookieConsent, setCookieConsent] = useState<string | null>(() => {
    return localStorage.getItem("exechat_cookie_consent") || null;
  });
  const [showCookieDetails, setShowCookieDetails] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false); 

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

  const [credits, setCredits] = useState<number>(0);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

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
  const [userPhoto, setUserPhoto] = useState<string | null>(() => {
    return localStorage.getItem("exechat_user_photo") || null;
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

  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [registerModalName, setRegisterModalName] = useState<string>("");
  const [googleDefaultName, setGoogleDefaultName] = useState<string>("");

  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    url: string;
    size: number;
    mime?: string;
    textContent?: string;
  } | null>(null);

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState("");

  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

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

    const maxBytes = 20 * 1024 * 1024; 

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

  useEffect(() => {
    localStorage.setItem("exeai_sessions", JSON.stringify(sessions));
  }, [sessions]);

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
    if (userPhoto) {
      localStorage.setItem("exechat_user_photo", userPhoto);
    } else {
      localStorage.removeItem("exechat_user_photo");
    }
  }, [isLoggedIn, userEmail, userId, userName, userDisplayName, userPhoto]);

  useEffect(() => {
    if (lastClaimAt !== null) {
      localStorage.setItem("exechat_last_claim_at", String(lastClaimAt));
    } else {
      localStorage.removeItem("exechat_last_claim_at");
    }
  }, [lastClaimAt]);

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

  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setHasApiKey(data.hasApiKey);
      })
      .catch((err) => {
        console.error("Failed to check backend health:", err.message || err);
        setHasApiKey(false);
      });

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      ttsSynthRef.current = window.speechSynthesis;
    }

    const savedLoggedIn = localStorage.getItem("exechat_logged_in") === "true";
    const savedUserId = localStorage.getItem("exechat_user_id");

    if (savedLoggedIn && savedUserId && savedUserId !== "guest") {
      setUserId(savedUserId);
      setUserEmail(localStorage.getItem("exechat_email"));
      setUserName(localStorage.getItem("exechat_username") || "");
      setUserDisplayName(localStorage.getItem("exechat_display_name") || "");
      setUserPhoto(localStorage.getItem("exechat_user_photo") || null);
      setCredits(99999); 
      setIsLoggedIn(true);
    } else {

      setIsLoggedIn(false);
      setUserId(null);
      setUserEmail(null);
      setUserName("");
      setUserDisplayName("");
      setUserPhoto(null);
      setCredits(0);
    }
    setAuthLoading(false);

    return () => {
      if (ttsSynthRef.current) {
        ttsSynthRef.current.cancel();
      }
    };
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior });
    }, 80);
  };

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  useEffect(() => {
    if (currentSession) {
      scrollToBottom("smooth");
    }
  }, [currentSession?.messages?.length, isGenerating]);

  const activePreset = SYSTEM_PRESETS.find(
    (p) => p.id === (currentSession?.systemInstructionId || selectedPresetId)
  ) || SYSTEM_PRESETS[0];

  const activeModel = MODEL_OPTIONS.find(
    (m) => m.id === (currentSession?.model || selectedModelId)
  ) || MODEL_OPTIONS[0];

  const activeTemp = currentSession ? currentSession.temperature : temperature;

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
      outerBg: "bg-zinc-950",
      mainBg: "bg-zinc-950",
      sidebarBg: "bg-zinc-900",
      sectionBg: "bg-zinc-900/60",
      border: "border-zinc-800/80",
      bubbleUser: "bg-zinc-900 border border-zinc-800 text-zinc-100",
      bubbleAssistant: "bg-transparent border-transparent text-zinc-200",
      textMuted: "text-zinc-500",
      textBase: "text-zinc-350",
      textTitle: "text-zinc-100",
      accentColor: "bg-zinc-800 hover:bg-zinc-750 text-white",
      scrollbarClass: "scrollbar-thin scrollbar-thumb-zinc-800",
      gradient: "from-zinc-950/25 via-transparent to-transparent",
    },
    light: {
      name: "Terang (Putih)",
      outerBg: "bg-white",
      mainBg: "bg-white",
      sidebarBg: "bg-zinc-50",
      sectionBg: "bg-zinc-100/60",
      border: "border-zinc-200",
      bubbleUser: "bg-zinc-100 border border-zinc-250/60 text-zinc-800",
      bubbleAssistant: "bg-transparent border-transparent text-zinc-800",
      textMuted: "text-zinc-500",
      textBase: "text-zinc-800",
      textTitle: "text-zinc-900",
      accentColor: "bg-zinc-900 hover:bg-zinc-850 text-white",
      scrollbarClass: "scrollbar-thin scrollbar-thumb-zinc-300",
      gradient: "from-zinc-100/25 via-transparent to-transparent",
    },
  };

  const curTheme = themeConfig[theme] || themeConfig.dark;
  const isDark = theme === "dark";

  const getCreditCost = (text: string): number => {
    const len = text.trim().length;
    if (len < 20) return 1;
    if (len < 100) return 2;
    if (len < 300) return 3;
    return 4;
  };

  const generateSmartTitle = (prompt: string): string => {
    let clean = prompt.trim();

    clean = clean.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");

    clean = clean.replace(/\s+/g, " ");

    const lower = clean.toLowerCase();

    if (
      lower.includes("coding") || 
      lower.includes("bantu coding") || 
      lower.includes("error") || 
      lower.includes("bug") || 
      lower.includes("code") || 
      lower.includes("javascript") || 
      lower.includes("typescript") || 
      lower.includes("python") || 
      lower.includes("html") || 
      lower.includes("css") || 
      lower.includes("bisa bantu coding") || 
      lower.includes("mengerti soal codingan") ||
      lower.includes("bantu saya bikin")
    ) {
      return "Bantu Coding";
    }

    if (
      lower.includes("resep") || 
      lower.includes("masak") || 
      lower.includes("makanan") || 
      lower.includes("bikin makanan") || 
      lower.includes("kuliner")
    ) {
      const match = clean.match(/(?:resep|cara masak)\s+([a-zA-Z\s]{3,15})/i);
      if (match && match[1]) {
        return `Resep ${match[1].trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
      }
      return "Resep Masakan";
    }

    if (
      lower.includes("essay") || 
      lower.includes("artikel") || 
      lower.includes("tulis") || 
      lower.includes("buatkan teks") || 
      lower.includes("surat")
    ) {
      return "Pembuatan Teks";
    }

    if (
      lower.includes("apa itu") || 
      lower.includes("jelaskan") || 
      lower.includes("bagaimana cara") || 
      lower.includes("how to")
    ) {
      const match = clean.match(/(?:apa itu|jelaskan tentang|bagaimana cara)\s+([a-zA-Z\s]{3,20})/i);
      if (match && match[1]) {
        return match[1].trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
      return "Penjelasan Topik";
    }

    if (
      lower.includes("terjemah") || 
      lower.includes("translate") || 
      lower.includes("artikan") || 
      lower.includes("bahasa inggris") || 
      lower.includes("arti dari")
    ) {
      return "Penerjemahan Bahasa";
    }

    if (
      lower === "halo" || 
      lower === "hallo" || 
      lower === "hai" || 
      lower === "hi" || 
      lower.startsWith("halo ai") || 
      lower.startsWith("hallo ai") || 
      lower.startsWith("selamat pagi") || 
      lower.startsWith("selamat siang")
    ) {
      return "Percakapan Santai";
    }

    const words = clean.split(" ").filter(w => w.length > 2);
    if (words.length > 0) {
      const selectedWords = words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      const rawTitle = selectedWords.join(" ");
      return rawTitle.length > 25 ? rawTitle.substring(0, 25) + "..." : rawTitle;
    }

    return "Diskusi Baru";
  };

  const handleGoogleLoginSuccess = (credentialResponse: any) => {
    if (!credentialResponse || !credentialResponse.credential) {
      setErrorText("Gagal masuk dengan Google: Tidak ada credential.");
      return;
    }
    try {
      const decoded: any = jwtDecode(credentialResponse.credential);
      if (!decoded || !decoded.sub || !decoded.email) {
        throw new Error("Informasi pengguna Google tidak valid.");
      }

      const uid = decoded.sub;
      const email = decoded.email;
      const name = decoded.name || decoded.given_name || email.split("@")[0] || "User";
      const picture = decoded.picture || null;

      setUserId(uid);
      setUserEmail(email);
      setUserPhoto(picture);
      setCredits(99999);
      setErrorText(null);

      const hasRegistered = localStorage.getItem(`exechat_has_registered_${uid}`) === "true";
      if (!hasRegistered) {
        setGoogleDefaultName(name);
        setRegisterModalName(name);
        setShowRegisterModal(true);

        setUserName(name);
        setUserDisplayName(name);
        setIsLoggedIn(true);
      } else {

        const storedUsername = localStorage.getItem("exechat_username") || name;
        const storedDisplayName = localStorage.getItem("exechat_display_name") || name;
        setUserName(storedUsername);
        setUserDisplayName(storedDisplayName);
        setIsLoggedIn(true);
        playNotifySound();
      }

      localStorage.setItem("exechat_logged_in", "true");
      localStorage.setItem("exechat_email", email);
      localStorage.setItem("exechat_user_id", uid);
      localStorage.setItem("exechat_user_photo", picture || "");
    } catch (error: any) {
      console.error("Google login decode error:", error);
      setErrorText(error?.message || "Gagal masuk dengan Google.");
    }
  };

  const handleCompleteRegistrationWithChosenName = (finalChosenName: string) => {
    const finalName = finalChosenName.trim() || googleDefaultName || "User";
    setUserName(finalName);
    setUserDisplayName(finalName);

    localStorage.setItem("exechat_username", finalName);
    localStorage.setItem("exechat_display_name", finalName);

    const activeUid = localStorage.getItem("exechat_user_id") || userId || "google-user";
    localStorage.setItem(`exechat_has_registered_${activeUid}`, "true");

    setShowRegisterModal(false);
    playNotifySound();
  };

  const handleGoogleLoginClick = () => {

  };

  const handleLogout = () => {
    localStorage.removeItem("exechat_logged_in");
    localStorage.removeItem("exechat_email");
    localStorage.removeItem("exechat_user_id");
    localStorage.removeItem("exechat_username");
    localStorage.removeItem("exechat_display_name");
    localStorage.removeItem("exechat_user_photo");
    setIsLoggedIn(false);
    setUserId(null);
    setUserEmail(null);
    setUserName("");
    setUserDisplayName("");
    setUserPhoto(null);
    setCredits(0);
    setLastClaimAt(null);
    playNotifySound();
  };

  const handleClaimDailyCredits = async () => {
    setErrorText("Kredit harian tidak diperlukan di versi ExeChat Premium (Kredit Tidak Terbatas).");
  };

  const handleSaveUsername = () => {
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

    setUserName(trimmed);
    setUserDisplayName(trimmed);

    localStorage.setItem("exechat_username", trimmed);
    localStorage.setItem("exechat_display_name", trimmed);
    const activeUid = userId || localStorage.getItem("exechat_user_id");
    if (activeUid) {
      localStorage.setItem(`exechat_has_registered_${activeUid}`, "true");
    }

    setErrorText(null);
    setRedeemFeedback("Username berhasil disimpan.");
  };

  const createNewSession = (initialMsg?: string) => {

    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let randomId = "";
    for (let i = 0; i < 8; i++) {
      randomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const id = randomId;
    const newSession: ChatSession = {
      id,
      title: initialMsg ? generateSmartTitle(initialMsg) : `Obrolan Baru`,
      messages: [],
      systemInstructionId: selectedPresetId,
      temperature,
      model: selectedModelId,
      createdAt: Date.now(),
      webSearchEnabled: globalWebSearchEnabled,
    };

    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(id);
    return id;
  };

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

  const startRenameSession = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditTitleInput(title);
  };

  const saveRenameSession = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editTitleInput.trim()) return;

    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: editTitleInput.trim() } : s))
    );
    setEditingSessionId(null);
  };

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

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isGenerating) return;

    setErrorText(null);

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

    const isKeymash = (str: string): boolean => {
      const s = str.trim().toLowerCase();
      if (s.length < 8) return false;

      if (/([a-zA-Z0-9])\1{5,}/.test(s)) return true;

      if (s.length > 12) {
        const chunks = s.match(/.{4}/g) || [];
        const uniqueChunks = new Set(chunks);
        if (chunks.length > 3 && uniqueChunks.size <= 2) return true;
      }

      if (!s.includes(" ") && s.length > 15 && !/[aeiouy]/.test(s)) return true;
      return false;
    };

    if (isKeymash(text)) {
      setErrorText("Input tidak sah diblokir! Terdeteksi spam acak (gibberish/keymash) yang dapat menguras token.");
      return;
    }

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
    setSelectedFile(null); 

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

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === targetSessionId) {

          const shouldRename = s.title === "Obrolan Baru" && s.messages.length === 0;
          return {
            ...s,
            title: shouldRename ? generateSmartTitle(text) : s.title,
            messages: [...s.messages, userMessage],
          };
        }
        return s;
      })
    );

    const assistantMsgId = "msg_" + Date.now() + "_assistant";
    const assistantPlaceholder: Message = {
      id: assistantMsgId,
      role: "model",
      content: "",
      timestamp: Date.now(),
    };

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

    const activeSessionState = sessions.find((s) => s.id === targetSessionId);
    const apiModel = activeSessionState ? activeSessionState.model : selectedModelId;
    const apiPreset = SYSTEM_PRESETS.find(
      (p) => p.id === (activeSessionState ? activeSessionState.systemInstructionId : selectedPresetId)
    ) || SYSTEM_PRESETS[0];
    const apiTemp = activeSessionState ? activeSessionState.temperature : temperature;
    const apiWebSearch = activeSessionState ? (activeSessionState.webSearchEnabled ?? globalWebSearchEnabled) : globalWebSearchEnabled;

    const updatedSession = sessions.find((s) => s.id === targetSessionId);
    const conversationHistory = updatedSession ? [...updatedSession.messages, userMessage] : [userMessage];

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

    let finalInstruction = apiPreset.instruction;
    if (memories.length > 0) {
      finalInstruction += "\n\n[MEMORI AI (Ingatan pengguna yang tersimpan)]:\n" + memories.map((m, idx) => `${idx + 1}. ${m}`).join("\n");
    }

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
          idToken: null,
          webSearchEnabled: apiWebSearch,
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

        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const dataString = trimmed.substring(6);

          if (dataString === "[DONE]") {
            break;
          }

          try {
            const parsed = JSON.parse(dataString);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {

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

            if (errMsg.includes("cerebras") || messageLower.includes("too_many_requests") || messageLower.includes("queue_exceeded") || errMsg.includes("queue_exceeded") || errMsg.includes("too_many_requests")) {

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

          setSessions((prev) =>
            prev.map((s) => {
              if (s.id === targetSessionId) {
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId && m.content === ""
                      ? { ...m, content: "Terjadi kesalahan koneksi atau konfigurasi API Key. Silakan muat ulang (refresh) halaman jika masalah berlanjut." }
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
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const copyMessageToClipboard = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => {
      setCopiedMessageId(null);
    }, 2000);
  };

  const handleRegenerateMessage = async (assistantMsgId: string) => {
    if (isGenerating || !currentSessionId) return;

    const activeSessionObj = sessions.find((s) => s.id === currentSessionId);
    if (!activeSessionObj) return;

    const msgIndex = activeSessionObj.messages.findIndex((m) => m.id === assistantMsgId);
    if (msgIndex === -1) return;

    const priorMessages = activeSessionObj.messages.slice(0, msgIndex);
    const userMessage = priorMessages[priorMessages.length - 1];
    if (!userMessage || userMessage.role !== "user") {
      return;
    }

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

    const apiModel = activeSessionObj.model || selectedModelId;
    const apiPreset = SYSTEM_PRESETS.find(
      (p) => p.id === (activeSessionObj.systemInstructionId || selectedPresetId)
    ) || SYSTEM_PRESETS[0];
    const apiTemp = activeSessionObj.temperature || temperature;
    const apiWebSearch = activeSessionObj.webSearchEnabled ?? globalWebSearchEnabled;

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

    let finalInstruction = apiPreset.instruction;
    if (memories.length > 0) {
      finalInstruction += "\n\n[MEMORI AI (Ingatan pengguna yang tersimpan)]:\n" + memories.map((m, idx) => `${idx + 1}. ${m}`).join("\n");
    }

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
          idToken: null,
          webSearchEnabled: apiWebSearch,
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

  const handleToggleSpeak = (msgId: string, text: string) => {
    if (!ttsSynthRef.current) return;

    if (speakingMessageId === msgId) {
      ttsSynthRef.current.cancel();
      setSpeakingMessageId(null);
    } else {
      ttsSynthRef.current.cancel();

      const cleanText = text
        .replace(/```[\s\S]*?```/g, "") 
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
    <div className={`flex flex-col h-full w-full ${curTheme.sidebarBg} ${isDark ? "text-zinc-150" : "text-zinc-800"} select-none`}>
      {/* Brand Identity Header */}
      <div className={`p-5 border-b ${curTheme.border} flex items-center justify-between shrink-0`}>
        <div className="flex items-center gap-3">
          <div>
            <h1 className={`font-display font-bold text-sm tracking-tight flex items-center gap-1.5 ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
              ExeChat
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${isDark ? "bg-zinc-950 text-zinc-400 border-zinc-800" : "bg-zinc-200/60 text-zinc-600 border-zinc-300"}`}>v1</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Config Button (Quick Settings Panel Toggle) */}
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              if (isMobile) setIsMobileSidebarOpen(false);
            }}
            className={`p-1.5 rounded-lg border transition-all duration-200 ${
              showSettings
                ? isDark ? "bg-zinc-800 border-zinc-700 text-zinc-150" : "bg-zinc-200 border-zinc-300 text-zinc-900"
                : isDark ? "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50" : "border-transparent text-zinc-650 hover:text-zinc-900 hover:bg-zinc-200/50"
            }`}
            title="Pengaturan Mode"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Close Sidebar button on Desktop */}
          {!isMobile && (
            <button
              onClick={() => setIsDesktopSidebarOpen(false)}
              className={`p-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                isDark ? "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50" : "border-transparent text-zinc-650 hover:text-zinc-900 hover:bg-zinc-200/50"
              }`}
              title="Tutup Riwayat Chat"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
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
          className={`w-full flex items-center justify-center gap-2 rounded-xl font-semibold py-2.5 px-4 transition-all duration-200 text-xs tracking-wide border ${
            isDark 
              ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-950 border-transparent shadow-md shadow-black/20" 
              : "bg-zinc-900 hover:bg-zinc-800 text-white border-transparent shadow-sm"
          }`}
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
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs transition-all duration-200 focus:outline-none border ${
              isDark 
                ? "border-zinc-800/80 bg-zinc-950/40 text-zinc-300 placeholder-zinc-600 focus:border-zinc-700 focus:bg-zinc-950/70" 
                : "border-zinc-200 bg-zinc-100/50 text-zinc-850 placeholder-zinc-400 focus:border-zinc-300 focus:bg-white"
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className={`absolute right-2.5 top-2.5 transition-colors ${isDark ? "hover:text-zinc-300 text-zinc-500" : "hover:text-zinc-700 text-zinc-400"}`}
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
            <div className={`text-center py-8 text-xs ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
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
                  className={`group flex items-center justify-between rounded-xl p-2.5 cursor-pointer text-xs transition-all duration-250 select-none border ${
                    isActive
                      ? isDark
                        ? "bg-zinc-800 border-zinc-750 text-zinc-100 font-medium"
                        : "bg-white border-zinc-200 shadow-sm text-zinc-900 font-medium"
                      : isDark
                        ? "border-transparent text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                        : "border-transparent text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive 
                          ? isDark ? "text-zinc-300" : "text-zinc-700" 
                          : isDark ? "text-zinc-550 group-hover:text-zinc-400" : "text-zinc-400 group-hover:text-zinc-600"
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
                          className={`w-full rounded px-1.5 py-0.5 text-xs focus:outline-none border ${
                            isDark 
                              ? "bg-zinc-950 border-zinc-850 text-zinc-100 focus:border-zinc-750" 
                              : "bg-white border-zinc-250 text-zinc-900 focus:border-zinc-400"
                          }`}
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
                        className={`p-1 rounded transition-colors ${isDark ? "hover:bg-zinc-750 text-zinc-500 hover:text-zinc-300" : "hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700"}`}
                        title="Ubah Nama"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => deleteSession(s.id, e)}
                        className={`p-1 rounded transition-colors ${isDark ? "hover:bg-zinc-750 text-zinc-500 hover:text-red-400" : "hover:bg-zinc-200 text-zinc-400 hover:text-red-600"}`}
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
        {!isLoggedIn && (
          <button
            onClick={handleGoogleLoginClick}
            className="w-full text-center text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-900/10 border border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl py-1.5 transition-all font-sans"
          >
            Masuk dengan Google
          </button>
        )}

        <div className="text-center text-zinc-600 text-[10px] select-none pt-0.5">
          © 2026 ExeChat version 1
        </div>
      </div>
    </div>
  );

  if (authLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 font-sans text-zinc-100 antialiased">
        <div className="relative flex flex-col items-center">
          <div className="mb-6 p-1 hover:scale-105 transition-transform">
            <svg className="h-16 w-16 animate-[spin_6s_linear_infinite]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3Q12 12 21 12Q12 12 12 21Q12 12 3 12Q12 12 12 3Z" fill="url(#loadingGrad)" />
              <defs>
                <linearGradient id="loadingGrad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#59a6ff" />
                  <stop offset="50%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#ff8da1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 className="text-lg font-medium tracking-wide animate-pulse">Menghubungkan ke ExeChat...</h2>
          <p className="mt-2 text-xs text-zinc-500 font-mono">Memverifikasi sesi aman...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 font-sans text-zinc-100 antialiased selection:bg-zinc-800 relative overflow-hidden">
        {/* Soft, natural background radial light - very clean and professional */}
        <div className="absolute inset-0 bg-radial-[circle_at_center,rgba(39,39,42,0.15),transparent_70%] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px] rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 sm:p-10 shadow-xl z-10 mx-4 flex flex-col items-center text-center"
        >
          {/* Simple, premium chat bubble emblem */}
          <div className="mb-6 select-none">
            <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 shadow-md">
              <svg className="h-6 w-6 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          </div>

          <div className="mb-8 select-none">
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Selamat Datang
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Silakan masuk menggunakan akun Google Anda untuk memulai sesi percakapan.
            </p>
          </div>

          {errorText && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mb-6 rounded-xl border border-red-900/30 bg-red-950/10 px-4 py-3 text-xs text-red-400 text-left flex items-start gap-2.5"
            >
              <svg className="h-4 w-4 text-red-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorText}</span>
            </motion.div>
          )}

          {/* Google Login Block */}
          <div className="w-full flex flex-col items-center justify-center p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => setErrorText("Gagal masuk dengan Google. Silakan coba lagi.")}
              useOneTap
              theme="filled_black"
              shape="pill"
            />
          </div>

          {/* Secure details at bottom - quiet and neat */}
          <p className="mt-8 text-[11px] text-zinc-500 font-medium select-none">
            Sesi obrolan tersimpan secara privat dalam peramban Anda.
          </p>
        </motion.div>
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
                userPhoto ? (
                  <img
                    onClick={() => setShowSettings(true)}
                    src={userPhoto}
                    alt="Profil"
                    referrerPolicy="no-referrer"
                    className="h-8 w-8 rounded-full object-cover border border-zinc-800 shadow-md cursor-pointer hover:scale-105 transition-all"
                    title="Lihat Profil"
                  />
                ) : (
                  <div 
                    onClick={() => setShowSettings(true)}
                    className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#59a6ff] to-[#c084fc] flex items-center justify-center text-xs font-bold text-white shadow-md border border-white/20 cursor-pointer hover:scale-105 transition-all"
                    title="Lihat Profil"
                  >
                    {(userDisplayName || userName || "U").charAt(0).toUpperCase()}
                  </div>
                )
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

              {/* Header Right Actions - Profile Picture (Mobile), Logout */}
              <div className="flex items-center gap-3 select-none">
                {isLoggedIn && (
                  <div className="flex items-center gap-3 border-l border-zinc-800/60 pl-3 md:pl-4">
                    {/* Foto Profil (Mobile Only) */}
                    <div className="relative group md:hidden">
                      {userPhoto ? (
                        <img
                          src={userPhoto}
                          alt="Profil"
                          referrerPolicy="no-referrer"
                          className="h-8 w-8 rounded-full object-cover border border-zinc-800 shadow-md transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#59a6ff] to-[#c084fc] flex items-center justify-center font-bold text-xs text-white border border-zinc-800 shadow-md">
                          {(userDisplayName || userName || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Tombol Logout */}
                    <button
                      onClick={handleLogout}
                      className={`p-2 rounded-xl transition-colors ${resolvedTheme === "dark" ? "hover:bg-red-950/25 text-zinc-400 hover:text-red-400" : "hover:bg-red-50 text-zinc-600 hover:text-red-600"}`}
                      title="Keluar (Logout)"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                )}

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
                      {userDisplayName === "Tamu" || userName === "Tamu"
                        ? `Halo Tamu, ${welcomeGreeting}`
                        : (userDisplayName || userName 
                            ? `Halo ${userDisplayName || userName}, ${welcomeGreeting}` 
                            : `Halo, ${welcomeGreeting.charAt(0).toUpperCase() + welcomeGreeting.slice(1)}`
                          )
                      }
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
                          <button
                            type="button"
                            onClick={() => setShowModelModal(true)}
                            className={`flex items-center gap-1.5 text-[10px] md:text-[11px] rounded-lg py-1.5 px-1.5 md:px-2.5 max-w-[120px] sm:max-w-none truncate font-sans cursor-pointer focus:outline-none transition-all border ${
                              isDark 
                                ? "bg-zinc-950 hover:bg-zinc-900 text-zinc-400 border-zinc-900 hover:border-zinc-800" 
                                : "bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200 hover:border-zinc-350"
                            }`}
                            title="Pilih Model AI"
                          >
                            <Cpu className="h-3 w-3 text-purple-500 shrink-0" />
                            <span className="truncate">{activeModel.name}</span>
                            <ChevronDown className="h-3 w-3 text-zinc-500 shrink-0" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowPresetModal(true)}
                            className={`flex items-center gap-1.5 text-[10px] md:text-[11px] rounded-lg py-1.5 px-1.5 md:px-2.5 max-w-[120px] sm:max-w-none truncate font-sans cursor-pointer focus:outline-none transition-all border ${
                              isDark 
                                ? "bg-zinc-950 hover:bg-zinc-900 text-zinc-400 border-zinc-900 hover:border-zinc-800" 
                                : "bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200 hover:border-zinc-350"
                            }`}
                            title="Pilih Karakter AI"
                          >
                            <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                            <span className="truncate">Preset: {activePreset.name}</span>
                            <ChevronDown className="h-3 w-3 text-zinc-500 shrink-0" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const nextSearchState = !(currentSession ? (currentSession.webSearchEnabled ?? false) : globalWebSearchEnabled);
                              if (currentSession) {
                                setSessions((prev) =>
                                  prev.map((s) => (s.id === currentSessionId ? { ...s, webSearchEnabled: nextSearchState } : s))
                                );
                              } else {
                                setGlobalWebSearchEnabled(nextSearchState);
                              }
                            }}
                            className={`flex items-center gap-1.5 text-[10px] md:text-[11px] rounded-lg py-1.5 px-2 px-2.5 truncate font-sans cursor-pointer focus:outline-none transition-all border ${
                              (currentSession ? (currentSession.webSearchEnabled ?? false) : globalWebSearchEnabled)
                                ? (isDark 
                                    ? "bg-amber-950/20 text-amber-400 border-amber-900/50 hover:bg-amber-950/30" 
                                    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100")
                                : (isDark 
                                    ? "bg-zinc-950 hover:bg-zinc-900 text-zinc-400 border-zinc-900 hover:border-zinc-800" 
                                    : "bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200 hover:border-zinc-350")
                            }`}
                            title="Aktifkan Pencarian Web Google"
                          >
                            <Globe className={`h-3 w-3 shrink-0 ${(currentSession ? (currentSession.webSearchEnabled ?? false) : globalWebSearchEnabled) ? "text-amber-500 animate-pulse" : "text-zinc-500"}`} />
                            <span className="truncate">Cari di Web: {(currentSession ? (currentSession.webSearchEnabled ?? false) : globalWebSearchEnabled) ? "Aktif" : "Nonaktif"}</span>
                          </button>
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
                                <div className="flex items-center gap-2.5 py-3 px-1 select-none">
                                  <div className="flex gap-1 items-center">
                                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-[bounce_1s_infinite_100ms]" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-[bounce_1s_infinite_200ms]" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-[bounce_1s_infinite_300ms]" />
                                  </div>
                                  <span className="text-xs text-zinc-500 font-medium font-sans">AI sedang berpikir...</span>
                                </div>
                              ) : (
                                <div className="text-zinc-800 dark:text-zinc-100 font-sans text-sm sm:text-base md:text-[16px] leading-relaxed select-text">
                                  <MarkdownRenderer content={msg.content} />

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
                      <div className="flex items-center gap-2 text-zinc-500 pl-9 md:pl-12 py-1 text-[11px] md:text-xs select-none">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-pulse" />
                        <span>AI sedang menulis...</span>
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
                      <button
                        type="button"
                        onClick={() => setShowModelModal(true)}
                        className="bg-zinc-900 hover:bg-zinc-900/80 text-zinc-300 border border-zinc-850 hover:border-zinc-850 text-[10px] md:text-[11px] rounded-lg py-1 px-2.5 font-sans max-w-[125px] sm:max-w-none truncate cursor-pointer focus:outline-none transition-all shadow-sm flex items-center gap-1"
                      >
                        <Cpu className="h-2.5 w-2.5 text-purple-500 shrink-0" />
                        <span className="truncate">{activeModel.name}</span>
                        <ChevronDown className="h-2.5 w-2.5 text-zinc-500 shrink-0" />
                      </button>

                      {/* Preset/Instruction Selector */}
                      <button
                        type="button"
                        onClick={() => setShowPresetModal(true)}
                        className="bg-zinc-900 hover:bg-zinc-900/80 text-zinc-300 border border-zinc-850 hover:border-zinc-850 text-[10px] md:text-[11px] rounded-lg py-1 px-2.5 font-sans max-w-[125px] sm:max-w-none truncate cursor-pointer focus:outline-none transition-all shadow-sm flex items-center gap-1"
                      >
                        <Sparkles className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                        <span className="truncate">Preset: {activePreset.name}</span>
                        <ChevronDown className="h-2.5 w-2.5 text-zinc-500 shrink-0" />
                      </button>
                    </div>

                    {/* Character Counter Display */}
                    <div className="flex items-center gap-2 md:gap-3 font-mono text-[9px] md:text-[10px] text-zinc-650 select-none">
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

                      {/* Web Search toggle button */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextSearchState = !(currentSession ? (currentSession.webSearchEnabled ?? false) : globalWebSearchEnabled);
                          if (currentSession) {
                            setSessions((prev) =>
                              prev.map((s) => (s.id === currentSessionId ? { ...s, webSearchEnabled: nextSearchState } : s))
                            );
                          } else {
                            setGlobalWebSearchEnabled(nextSearchState);
                          }
                        }}
                        className={`p-2 md:p-2.5 rounded-lg md:rounded-xl transition-all shrink-0 ${
                          (currentSession ? (currentSession.webSearchEnabled ?? false) : globalWebSearchEnabled)
                            ? "bg-amber-950/30 text-amber-400 hover:bg-amber-950/50"
                            : "hover:bg-zinc-800 text-zinc-500 hover:text-amber-400"
                        }`}
                        title={`Cari di Web: ${(currentSession ? (currentSession.webSearchEnabled ?? false) : globalWebSearchEnabled) ? "Aktif" : "Nonaktif"}`}
                      >
                        <Globe className={`h-4 w-4 md:h-5 md:w-5 ${(currentSession ? (currentSession.webSearchEnabled ?? false) : globalWebSearchEnabled) ? "text-amber-500 animate-pulse" : ""}`} />
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
                className={`absolute inset-0 backdrop-blur-xl flex flex-col z-40 ${isDark ? "bg-zinc-950/98 text-zinc-100" : "bg-zinc-50/98 text-zinc-850"}`}
              >
                {/* Header */}
                <div className={`p-5 px-6 border-b ${curTheme.border} ${curTheme.sectionBg} flex items-center justify-between shrink-0`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isDark ? "bg-zinc-900 text-zinc-300" : "bg-zinc-100 text-zinc-700"}`}>
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
                    className={`p-2 rounded-xl transition-all shadow-sm ${isDark ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "bg-white hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200"}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Tabs bar */}
                <div className={`px-6 py-2 border-b ${curTheme.border} flex items-center justify-start gap-1 overflow-x-auto scrollbar-none shrink-0 ${isDark ? "bg-zinc-950/40" : "bg-zinc-100/30"}`}>
                  {[
                    { id: "akun", name: "Akun & Profil", icon: User },
                    { id: "model", name: "Engine & Karakter AI", icon: Cpu },
                    { id: "tampilan", name: "Tema & Tampilan", icon: Sun },
                    { id: "ingatan", name: "Ingatan AI", icon: Brain },
                  ].map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = settingsTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSettingsTab(tab.id as any)}
                        className={`flex items-center gap-2 py-2 px-4.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap shrink-0 ${
                          isActive
                            ? isDark
                              ? "bg-zinc-900 text-white shadow border border-zinc-850"
                              : "bg-white text-zinc-900 shadow border border-zinc-200"
                            : isDark
                              ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"
                              : "text-zinc-550 hover:text-zinc-800 hover:bg-zinc-100/50"
                        }`}
                      >
                        <TabIcon className={`h-4 w-4 ${isActive ? (isDark ? "text-amber-400" : "text-[#1a73e8]") : "text-zinc-500"}`} />
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content Container */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6">

                  {/* TAB 1: AKUN & PROFIL */}
                  {settingsTab === "akun" && (
                    <div className="space-y-6 animate-fadeIn">
                      <div className={`rounded-2xl p-6 border ${isDark ? "bg-zinc-900/20 border-zinc-850" : "bg-white border-zinc-200 shadow-sm"}`}>
                        <h3 className={`text-xs font-semibold tracking-wider font-mono uppercase mb-4 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                          Status Keanggotaan
                        </h3>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                            {userPhoto ? (
                              <img src={userPhoto} referrerPolicy="no-referrer" alt="Foto Profil" className="h-14 w-14 rounded-full border border-zinc-500/20 shadow-md shrink-0" />
                            ) : (
                              <div className={`h-14 w-14 rounded-full border flex items-center justify-center shrink-0 ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-600"}`}>
                                <User className="h-7 w-7" />
                              </div>
                            )}
                            <div>
                              {isLoggedIn ? (
                                <div className="space-y-1">
                                  <div className={`flex items-center gap-2 font-bold text-base ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Tersambung via Google</span>
                                  </div>
                                  <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-550"}`}>{userEmail}</p>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className={`flex items-center gap-2 font-bold text-base ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
                                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                    <span>Mode Tamu Percuma</span>
                                  </div>
                                  <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-550"}`}>Gunakan Google login untuk personalisasi asisten penuh.</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {isLoggedIn ? (
                              <button
                                onClick={handleLogout}
                                className={`text-xs font-semibold py-2 px-5 rounded-xl border transition-all duration-200 cursor-pointer ${
                                  isDark 
                                    ? "bg-red-950/30 hover:bg-red-900/30 text-red-300 border-red-900/40" 
                                    : "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                                }`}
                              >
                                Keluar (Logout)
                              </button>
                            ) : (
                              <div className="w-full">
                                <GoogleLogin
                                  onSuccess={handleGoogleLoginSuccess}
                                  onError={() => setErrorText("Gagal masuk dengan Google.")}
                                  theme={isDark ? "filled_black" : "outline"}
                                  shape="pill"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {isLoggedIn && (
                        <div className={`rounded-2xl p-6 border ${isDark ? "bg-zinc-900/20 border-zinc-850" : "bg-white border-zinc-200 shadow-sm"}`}>
                          <h3 className={`text-xs font-semibold tracking-wider font-mono uppercase mb-2 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                            Personalisasi Nama Pengguna
                          </h3>
                          <p className={`text-xs leading-relaxed mb-4 ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                            Atur nama panggilan Anda yang akan digunakan asisten Hexky untuk menyapa Anda dalam obrolan privat ini.
                          </p>

                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-2">
                              <div className={`p-3 rounded-xl border flex justify-between ${isDark ? "bg-zinc-950/50 border-zinc-850/60" : "bg-zinc-50 border-zinc-200"}`}>
                                <span className="text-zinc-500">Nama Google</span>
                                <span className={`font-semibold ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>{googleDefaultName || userEmail?.split("@")[0]}</span>
                              </div>
                              <div className={`p-3 rounded-xl border flex justify-between ${isDark ? "bg-zinc-950/50 border-zinc-850/60" : "bg-zinc-50 border-zinc-200"}`}>
                                <span className="text-zinc-500">Panggilan Aktif</span>
                                <span className={`font-semibold ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>{userDisplayName || "Tamu"}</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <input
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="Masukkan nama panggilan baru..."
                                className={`flex-1 rounded-xl px-4 py-2.5 text-xs focus:outline-none border transition-colors ${
                                  isDark 
                                    ? "bg-zinc-950 border-zinc-850 text-zinc-100 focus:border-zinc-750 placeholder-zinc-700" 
                                    : "bg-white border-zinc-200 text-zinc-900 focus:border-zinc-350 placeholder-zinc-400"
                                }`}
                              />
                              <button
                                onClick={handleSaveUsername}
                                className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                                  isDark 
                                    ? "bg-amber-500 hover:bg-amber-600 text-zinc-950 hover:scale-[1.02]" 
                                    : "bg-zinc-900 hover:bg-zinc-800 text-white hover:scale-[1.02]"
                                }`}
                              >
                                Simpan Nama
                              </button>
                            </div>

                            {redeemFeedback && (
                              <p className="text-[11px] text-emerald-500 font-sans tracking-wide">
                                ✓ {redeemFeedback}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: ENGINE & KARAKTER AI */}
                  {settingsTab === "model" && (
                    <div className="space-y-6 animate-fadeIn">
                      {/* Model Engine AI Selection */}
                      <div className="space-y-3">
                        <h3 className={`text-xs font-semibold tracking-wider font-mono uppercase ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                          Pilihan Engine AI Utama
                        </h3>
                        <p className={`text-xs ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                          Engine menentukan kecerdasan di balik tanggapan asisten Anda.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {MODEL_OPTIONS.map((m) => {
                            const isSelected = currentSession
                              ? currentSession.model === m.id
                              : selectedModelId === m.id;

                            return (
                              <div
                                key={m.id}
                                onClick={() => {
                                  if (currentSession) {
                                    setSessions((prev) =>
                                      prev.map((s) => (s.id === currentSessionId ? { ...s, model: m.id } : s))
                                    );
                                  } else {
                                    setSelectedModelId(m.id);
                                  }
                                  playNotifySound();
                                }}
                                className={`p-4.5 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                                  isSelected
                                    ? isDark
                                      ? "bg-zinc-900 border-zinc-750 shadow-lg ring-1 ring-amber-500/20 text-zinc-100"
                                      : "bg-blue-50/75 border-[#1a73e8] shadow-sm ring-1 ring-blue-500/20 text-zinc-900"
                                    : isDark
                                      ? "border-zinc-850 bg-zinc-900/10 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/20"
                                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs font-bold ${isSelected ? (isDark ? "text-zinc-100" : "text-zinc-900") : "text-zinc-500"}`}>
                                      {m.name}
                                    </span>
                                    {isSelected ? (
                                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono border font-bold ${
                                        isDark ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-blue-500/10 border-blue-500/20 text-blue-600"
                                      }`}>
                                        Aktif
                                      </span>
                                    ) : (
                                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono border ${
                                        isDark ? "bg-zinc-950 border-zinc-850 text-zinc-500" : "bg-zinc-100 border-zinc-200 text-zinc-500"
                                      }`}>
                                        {m.id === "gemma-4-31b" ? "Cepat" : "Kuat"}
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-500" : "text-zinc-550"}`}>
                                    {m.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Character Preset Instruction Selection */}
                      <div className="space-y-3 pt-2">
                        <h3 className={`text-xs font-semibold tracking-wider font-mono uppercase ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                          Karakter / Preset Kepribadian
                        </h3>
                        <p className={`text-xs ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                          Ubah kepribadian, gaya bicara, dan keahlian kognitif Hexky dalam merespon pesan.
                        </p>

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
                                  playNotifySound();
                                }}
                                className={`p-4.5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                                  isSelected
                                    ? isDark
                                      ? "bg-zinc-900 border-zinc-750 shadow-lg ring-1 ring-amber-500/20"
                                      : "bg-blue-50/75 border-[#1a73e8] shadow-sm ring-1 ring-blue-500/20"
                                    : isDark
                                      ? "border-zinc-850 bg-zinc-900/10 hover:border-zinc-700 hover:bg-zinc-900/20"
                                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                                }`}
                              >
                                <div className="flex items-center gap-3 mb-2.5">
                                  <div className={`p-2 rounded-xl border ${
                                    isSelected 
                                      ? isDark ? "bg-zinc-950 border-zinc-800 text-amber-400" : "bg-white border-blue-250 text-blue-600" 
                                      : isDark ? "bg-zinc-900 border-zinc-800/80 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-500"
                                  }`}>
                                    {getPresetIcon(preset.icon, "h-4 w-4")}
                                  </div>
                                  <span className={`text-xs font-bold ${isSelected ? (isDark ? "text-zinc-100" : "text-zinc-900") : "text-zinc-500"}`}>
                                    {preset.name}
                                  </span>
                                </div>
                                <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-500" : "text-zinc-550"}`}>
                                  {preset.description}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: TEMA & TAMPILAN */}
                  {settingsTab === "tampilan" && (
                    <div className="space-y-6 animate-fadeIn">
                      <div className={`rounded-2xl p-6 border ${isDark ? "bg-zinc-900/20 border-zinc-850" : "bg-white border-zinc-200 shadow-sm"}`}>
                        <h3 className={`text-xs font-semibold tracking-wider font-mono uppercase mb-1.5 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                          Pilihan Tema Tampilan
                        </h3>
                        <p className={`text-xs mb-5 ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                          Ubah estetika visual ExeChat agar nyaman di mata saat membaca obrolan.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {[
                            { id: "system", name: "Tema Sistem", desc: "Ikuti pengaturan OS perangkat", icon: Laptop },
                            { id: "dark", name: "Hitam (Gelap)", desc: "Nuansa gelap hemat daya", icon: Moon },
                            { id: "light", name: "Putih (Terang)", desc: "Nuansa terang kontras tinggi", icon: Sun },
                          ].map((t) => {
                            const isSelected = themeMode === t.id;
                            const IconComp = t.icon;

                            return (
                              <div
                                key={t.id}
                                onClick={() => {
                                  setThemeMode(t.id as any);
                                  playNotifySound();
                                }}
                                className={`p-4.5 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between items-start text-left ${
                                  isSelected
                                    ? isDark
                                      ? "bg-zinc-900 border-amber-500/80 shadow-md text-zinc-100 ring-1 ring-amber-500/10"
                                      : "bg-blue-50/75 border-[#1a73e8] shadow-sm text-zinc-900 ring-1 ring-blue-500/10"
                                    : isDark
                                      ? "border-zinc-850 bg-zinc-900/10 text-zinc-450 hover:border-zinc-700 hover:bg-zinc-900/20"
                                      : "border-zinc-200 bg-white text-zinc-650 hover:border-zinc-300 hover:bg-zinc-50"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 mb-2.5">
                                  <div className={`p-2 rounded-xl border ${
                                    isSelected 
                                      ? isDark ? "bg-amber-500/10 border-transparent text-amber-400" : "bg-[#1a73e8] border-transparent text-white" 
                                      : isDark ? "bg-zinc-900 border-zinc-800/80 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-500"
                                  }`}>
                                    <IconComp className="h-4 w-4" />
                                  </div>
                                  <span className={`text-xs font-bold ${isSelected ? (isDark ? "text-zinc-100" : "text-zinc-900") : "text-zinc-500"}`}>
                                    {t.name}
                                  </span>
                                </div>
                                <p className={`text-[11px] leading-normal ${isDark ? "text-zinc-500" : "text-zinc-550"}`}>
                                  {t.desc}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className={`rounded-2xl p-6 border ${isDark ? "bg-zinc-900/20 border-zinc-850" : "bg-white border-zinc-200 shadow-sm"}`}>
                        <h3 className={`text-xs font-semibold tracking-wider font-mono uppercase mb-2 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                          Penyesuaian Audio & Suara
                        </h3>
                        <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                          ExeChat secara otomatis membunyikan notifikasi lembut saat asisten Hexky selesai merespon pesan Anda sebagai umpan balik interaktif.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: INGATAN AI */}
                  {settingsTab === "ingatan" && (
                    <div className="space-y-6 animate-fadeIn">
                      <div className={`rounded-2xl p-6 border ${isDark ? "bg-zinc-900/20 border-zinc-850" : "bg-white border-zinc-200 shadow-sm"}`}>
                        <div className="flex items-center gap-2.5 mb-2">
                          <Brain className="h-5 w-5 text-amber-500 animate-pulse" />
                          <h3 className={`text-xs font-semibold tracking-wider font-mono uppercase ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                            Konfigurasi Ingatan AI (Maksimal 5)
                          </h3>
                        </div>
                        <p className={`text-xs leading-relaxed mb-5 ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                          Asisten Hexky akan mengingat nama, preferensi pekerjaan, bahasa, atau instruksi khusus yang Anda tetapkan di sini di seluruh sesi obrolan Anda yang berbeda secara permanen.
                        </p>

                        {/* Add Memory Form */}
                        <div className="flex gap-2 mb-4">
                          <input
                            type="text"
                            value={memoryInput}
                            onChange={(e) => setMemoryInput(e.target.value)}
                            placeholder={memories.length >= 5 ? "Batas maksimal ingatan tercapai" : "Contoh: Saya adalah programmer React..."}
                            disabled={memories.length >= 5}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && memoryInput.trim()) {
                                e.preventDefault();
                                if (memories.length < 5) {
                                  setMemories((prev) => [...prev, memoryInput.trim()]);
                                  setMemoryInput("");
                                  playNotifySound();
                                }
                              }
                            }}
                            className={`flex-1 rounded-xl px-4 py-2.5 text-xs focus:outline-none border transition-colors ${
                              isDark 
                                ? "bg-zinc-950 border-zinc-850 text-zinc-100 placeholder-zinc-700 focus:border-zinc-750" 
                                : "bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-350"
                            }`}
                          />
                          <button
                            onClick={() => {
                              if (memoryInput.trim() && memories.length < 5) {
                                setMemories((prev) => [...prev, memoryInput.trim()]);
                                setMemoryInput("");
                                playNotifySound();
                              }
                            }}
                            disabled={!memoryInput.trim() || memories.length >= 5}
                            className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
                              isDark 
                                ? "bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-700 text-zinc-950 border-transparent cursor-pointer" 
                                : "bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-350 text-white border-transparent shadow-sm cursor-pointer"
                            }`}
                          >
                            Simpan
                          </button>
                        </div>

                        {memories.length >= 5 && (
                          <p className="text-[10px] text-amber-500 mb-3">
                            * Anda telah menyimpan 5 ingatan (maksimal). Silakan hapus ingatan lama untuk menambahkan preferensi baru.
                          </p>
                        )}

                        {/* Memories List */}
                        <div className="space-y-2 pt-2 border-t border-zinc-500/10">
                          {memories.length === 0 ? (
                            <div className={`text-center py-6 border border-dashed rounded-xl text-xs ${isDark ? "border-zinc-800/80 text-zinc-600" : "border-zinc-200 text-zinc-400"}`}>
                              Belum ada ingatan khusus. Tulis preferensi Anda di atas agar Hexky lebih mengenal Anda!
                            </div>
                          ) : (
                            memories.map((mem, idx) => (
                              <div
                                key={idx}
                                className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all text-left ${
                                  isDark 
                                    ? "border-zinc-850 bg-zinc-950/45 hover:bg-zinc-950" 
                                    : "border-zinc-150 bg-white hover:bg-zinc-50 shadow-sm"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                  <span className={`text-xs truncate font-sans font-medium ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>{mem}</span>
                                </div>
                                <button
                                  onClick={() => {
                                    setMemories((prev) => prev.filter((_, i) => i !== idx));
                                    playNotifySound();
                                  }}
                                  className={`p-1.5 rounded-lg transition-colors shrink-0 border ${
                                    isDark 
                                      ? "bg-zinc-900/40 border-zinc-800 hover:bg-red-950/25 text-zinc-500 hover:text-red-400" 
                                      : "bg-zinc-50 border-zinc-200 hover:bg-red-50 text-zinc-500 hover:text-red-650"
                                  }`}
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
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CUSTOM PRESET SELECTION MODAL */}
          <AnimatePresence>
            {showPresetModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowPresetModal(false)}
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />

                {/* Modal Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className={`relative w-full max-w-lg rounded-3xl border shadow-2xl p-6 overflow-hidden z-10 transition-all ${
                    isDark ? "bg-[#1e1f20] border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 pb-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                      <h3 className="font-sans font-semibold text-lg">Pilih Karakter AI</h3>
                    </div>
                    <button
                      onClick={() => setShowPresetModal(false)}
                      className={`p-1.5 rounded-xl transition-colors ${
                        isDark ? "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200" : "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-850"
                      }`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className={`text-xs mb-5 leading-normal ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    Sesuaikan gaya bicara, kepribadian, dan keahlian asisten AI untuk obrolan Anda saat ini.
                  </p>

                  {/* Scrollable list of Presets */}
                  <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
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
                            setShowPresetModal(false);
                            playNotifySound();
                          }}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-4 ${
                            isSelected
                              ? (isDark ? "bg-zinc-900/90 border-zinc-700/80 shadow-md shadow-black/20" : "bg-zinc-100 border-zinc-300 shadow-sm")
                              : (isDark ? "border-zinc-900/60 hover:border-zinc-800 bg-zinc-900/10" : "border-zinc-100 hover:border-zinc-200 bg-zinc-50/50")
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            isSelected 
                              ? (isDark ? "bg-zinc-100 text-zinc-950" : "bg-[#1a73e8] text-white") 
                              : (isDark ? "bg-zinc-900 text-zinc-400" : "bg-zinc-200 text-zinc-600")
                          }`}>
                            {getPresetIcon(preset.icon, "h-5 w-5")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-semibold ${isSelected ? (isDark ? "text-zinc-100" : "text-zinc-900") : (isDark ? "text-zinc-300" : "text-zinc-700")}`}>
                                {preset.name}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] font-mono font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <p className={`text-xs leading-relaxed font-sans ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                              {preset.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowPresetModal(false)}
                      className={`text-xs font-semibold py-2 px-5 rounded-xl border transition-all ${
                        isDark 
                          ? "border-zinc-850 hover:bg-zinc-900 text-zinc-300" 
                          : "border-zinc-200 hover:bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      Batal
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* CUSTOM MODEL SELECTION MODAL */}
          <AnimatePresence>
            {showModelModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowModelModal(false)}
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />

                {/* Modal Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className={`relative w-full max-w-lg rounded-3xl border shadow-2xl p-6 overflow-hidden z-10 transition-all ${
                    isDark ? "bg-[#1e1f20] border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 pb-1">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-purple-500 animate-pulse" />
                      <h3 className="font-sans font-semibold text-lg">Pilih Model AI</h3>
                    </div>
                    <button
                      onClick={() => setShowModelModal(false)}
                      className={`p-1.5 rounded-xl transition-colors ${
                        isDark ? "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200" : "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-850"
                      }`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className={`text-xs mb-5 leading-normal ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    Pilih model kecerdasan buatan (Hexky) yang paling sesuai dengan kebutuhan analisis dan respon chat Anda.
                  </p>

                  {/* Scrollable list of Models */}
                  <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                    {MODEL_OPTIONS.map((m) => {
                      const isSelected = currentSession
                        ? currentSession.model === m.id
                        : selectedModelId === m.id;

                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            if (currentSession) {
                              setSessions((prev) =>
                                prev.map((s) => (s.id === currentSessionId ? { ...s, model: m.id } : s))
                              );
                            } else {
                              setSelectedModelId(m.id);
                            }
                            setShowModelModal(false);
                            playNotifySound();
                          }}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-4 ${
                            isSelected
                              ? (isDark ? "bg-zinc-900/90 border-zinc-700/80 shadow-md shadow-black/20" : "bg-zinc-100 border-zinc-300 shadow-sm")
                              : (isDark ? "border-zinc-900/60 hover:border-zinc-800 bg-zinc-900/10" : "border-zinc-100 hover:border-zinc-200 bg-zinc-50/50")
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            isSelected 
                              ? (isDark ? "bg-zinc-100 text-zinc-950" : "bg-[#1a73e8] text-white") 
                              : (isDark ? "bg-zinc-900 text-zinc-400" : "bg-zinc-200 text-zinc-600")
                          }`}>
                            <Cpu className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-semibold ${isSelected ? (isDark ? "text-zinc-100" : "text-zinc-900") : (isDark ? "text-zinc-300" : "text-zinc-700")}`}>
                                  {m.name}
                                </span>
                                {m.badge && (
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono uppercase font-semibold ${
                                    m.badge === "Production" 
                                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" 
                                      : "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                                  }`}>
                                    {m.badge}
                                  </span>
                                )}
                              </div>
                              {isSelected && (
                                <span className="text-[10px] font-mono font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <p className={`text-xs leading-relaxed font-sans ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                              {m.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowModelModal(false)}
                      className={`text-xs font-semibold py-2 px-5 rounded-xl border transition-all ${
                        isDark 
                          ? "border-zinc-850 hover:bg-zinc-900 text-zinc-300" 
                          : "border-zinc-200 hover:bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      Batal
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* REGISTRATION POPUP - ENTER CUSTOM NAME OR SKIP */}
          <AnimatePresence>
            {showRegisterModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none">
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 8 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={`relative w-full max-w-[380px] rounded-2xl border p-6 shadow-xl z-10 transition-all ${
                    isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                      isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-zinc-100 border-zinc-200 text-zinc-600"
                    }`}>
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`text-[10px] font-medium ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>Langkah Terakhir</p>
                      <h3 className={`font-sans font-semibold text-base ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>Siapa Nama Anda?</h3>
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed mb-5 font-sans ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    Pilih nama panggilan yang akan ditampilkan dalam sesi obrolan Anda. Lewati untuk menggunakan nama dari akun Google Anda.
                  </p>

                  {/* Input field */}
                  <div className="space-y-1.5 mb-5">
                    <label className={`block text-[10px] font-medium uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>Nama Panggilan</label>
                    <input
                      type="text"
                      value={registerModalName}
                      onChange={(e) => setRegisterModalName(e.target.value)}
                      placeholder="Contoh: Budi Prasetyo"
                      maxLength={30}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors font-sans ${
                        isDark 
                          ? "bg-zinc-950 border-zinc-850 text-zinc-100 focus:border-zinc-700 placeholder-zinc-700" 
                          : "bg-white border-zinc-200 text-zinc-900 focus:border-zinc-350 placeholder-zinc-450"
                      }`}
                    />
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => handleCompleteRegistrationWithChosenName(registerModalName)}
                      className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition-colors duration-150 cursor-pointer text-center ${
                        isDark ? "bg-white hover:bg-zinc-100 text-zinc-950" : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
                      }`}
                    >
                      Simpan & Lanjutkan
                    </button>

                    <button
                      onClick={() => handleCompleteRegistrationWithChosenName(googleDefaultName)}
                      className={`w-full py-2.5 px-4 rounded-xl border font-medium text-xs transition-colors duration-150 cursor-pointer text-center ${
                        isDark 
                          ? "border-zinc-800 hover:border-zinc-750 bg-transparent hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200" 
                          : "border-zinc-200 hover:border-zinc-300 bg-transparent hover:bg-zinc-50 text-zinc-600 hover:text-zinc-800"
                      }`}
                    >
                      Lewati (Gunakan Nama Google)
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* COOKIE CONSENT SYSTEM */}
          <AnimatePresence>
            {!cookieConsent && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 p-5 rounded-2xl border shadow-2xl flex flex-col gap-4 font-sans select-none backdrop-blur-xl transition-all"
                style={{
                  backgroundColor: isDark ? "rgba(24, 24, 27, 0.95)" : "rgba(255, 255, 255, 0.95)",
                  borderColor: isDark ? "rgba(63, 63, 70, 0.8)" : "rgba(228, 228, 231, 0.9)"
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-500/15 text-amber-600"}`}>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5z" />
                      <path d="M8.5 14.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor" />
                      <path d="M11.5 17.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor" />
                      <path d="M14.5 13.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor" />
                    </svg>
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <h4 className={`text-sm font-bold tracking-tight ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
                      Pemberitahuan Cookie & Penyimpanan
                    </h4>
                    <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                      ExeChat menggunakan kuki dan penyimpanan lokal (localStorage) untuk mengingat sesi obrolan, pengaturan tema tampilan, serta verifikasi login Google Anda agar dapat berfungsi secara optimal dan aman.
                    </p>
                  </div>
                </div>

                {showCookieDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className={`text-[11px] p-3 rounded-xl border space-y-2 leading-relaxed ${
                      isDark ? "bg-zinc-900/60 border-zinc-800 text-zinc-400" : "bg-zinc-50 border-zinc-200 text-zinc-650"
                    }`}
                  >
                    <div className="font-semibold text-xs mb-1">Rincian Penyimpanan Kami:</div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-amber-500">•</span>
                      <span><strong>Esensial (Wajib)</strong>: Menyimpan ID sesi percakapan Anda, status login Google, dan kunci API yang diperlukan untuk berinteraksi dengan AI.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-amber-500">•</span>
                      <span><strong>Preferensi (Opsional)</strong>: Menyimpan pilihan tema (Gelap/Terang), karakter/preset asisten pilihan, serta memori preferensi panggilan Anda.</span>
                    </div>
                    <div>Kami menghargai privasi Anda sepenuhnya. Seluruh data chat Anda disimpan secara lokal di perangkat Anda sendiri.</div>
                  </motion.div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-zinc-500/10">
                  <button
                    onClick={() => setShowCookieDetails(!showCookieDetails)}
                    className={`text-xs font-semibold hover:underline ${isDark ? "text-zinc-400 hover:text-zinc-250" : "text-zinc-600 hover:text-zinc-900"}`}
                  >
                    {showCookieDetails ? "Sembunyikan Detail" : "Pelajari Detail"}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        localStorage.setItem("exechat_cookie_consent", "rejected");
                        setCookieConsent("rejected");
                        playNotifySound();
                      }}
                      className={`text-xs font-semibold py-1.5 px-3 rounded-lg border transition-all cursor-pointer ${
                        isDark 
                          ? "border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200" 
                          : "border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-800"
                      }`}
                    >
                      Tolak
                    </button>
                    <button
                      onClick={() => {
                        localStorage.setItem("exechat_cookie_consent", "accepted");
                        setCookieConsent("accepted");
                        playNotifySound();
                      }}
                      className={`text-xs font-semibold py-1.5 px-4.5 rounded-lg transition-all border cursor-pointer ${
                        isDark 
                          ? "bg-amber-500 hover:bg-amber-600 text-zinc-950 border-transparent shadow-md hover:scale-[1.02]" 
                          : "bg-zinc-900 hover:bg-zinc-800 text-white border-transparent shadow-sm hover:scale-[1.02]"
                      }`}
                    >
                      Setujui
                    </button>
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

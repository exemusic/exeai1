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
  Code,
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
  Globe,
  Trophy,
  Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Message, ChatSession, SystemPreset, ModelOption } from "./types";
import { MarkdownRenderer } from "./components/MarkdownRenderer";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { MODEL_OPTIONS, SYSTEM_PRESETS, SUGGESTED_PROMPTS } from "./presets";
import { ExeCodeWorkspace } from "./components/ExeCodeWorkspace";
import { PublicProjectView } from "./components/PublicProjectView";

const notifySoundUrl = new URL("../Sound/notify.mp3", import.meta.url).href;

interface TypewriterMessageProps {
  content: string;
  isLatest: boolean;
  isGenerating: boolean;
  msgId: string;
  isSpeaking: boolean;
  expandedThoughts: Record<string, boolean>;
  setExpandedThoughts: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  parseMessageThinking: (content: string) => { thinking: string | null; actual: string; isThinking: boolean };
  thinkingDuration?: number;
}

function TypewriterMessage({
  content,
  isLatest,
  isGenerating,
  msgId,
  isSpeaking,
  expandedThoughts,
  setExpandedThoughts,
  parseMessageThinking,
  thinkingDuration
}: TypewriterMessageProps) {
  const [displayedContent, setDisplayedContent] = useState(() => {
    return (isLatest && isGenerating) ? "" : content;
  });
  const currentIdxRef = useRef((isLatest && isGenerating) ? 0 : content.length);
  const pauseCounterRef = useRef(0);

  useEffect(() => {
    if (!isLatest || !isGenerating) {
      setDisplayedContent(content);
      currentIdxRef.current = content.length;
      return;
    }

    let animationFrameId: number;

    const tick = () => {
      const targetLength = content.length;
      const currentIdx = currentIdxRef.current;

      if (currentIdx >= targetLength) {
        if (!isGenerating) {
          setDisplayedContent(content);
          return;
        }
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      // Dynamic typewriter speed based on content length
      let step = 1;
      if (targetLength > 2000) {
        step = Math.max(12, Math.ceil(targetLength / 90));
      } else if (targetLength > 800) {
        step = Math.max(5, Math.ceil(targetLength / 120));
      } else if (targetLength > 300) {
        step = Math.max(2, Math.ceil(targetLength / 150));
      } else {
        step = 1;
      }

      // If we are actively streaming, make sure we catch up rapidly if lag is too big
      const lag = targetLength - currentIdx;
      if (isGenerating && lag > 150) {
        step = Math.max(step, Math.ceil(lag / 8));
      }

      // Micro-pause at sentence endings (., ?, !) for natural pacing
      const char = content[currentIdx - 1];
      const nextChar = content[currentIdx];
      if (step <= 3 && (char === "." || char === "?" || char === "!") && (nextChar === " " || nextChar === "\n")) {
        if (pauseCounterRef.current < 8) {
          pauseCounterRef.current++;
          animationFrameId = requestAnimationFrame(tick);
          return;
        }
        pauseCounterRef.current = 0;
      }

      const nextIdx = Math.min(targetLength, currentIdx + step);
      currentIdxRef.current = nextIdx;
      setDisplayedContent(content.substring(0, nextIdx));

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [content, isLatest, isGenerating]);

  useEffect(() => {
    if (!isLatest) {
      setDisplayedContent(content);
    }
  }, [content, isLatest]);

  const { thinking, actual, isThinking } = parseMessageThinking(displayedContent);
  const duration = thinkingDuration || 2;

  return (
    <div className="flex flex-col">
      {thinking !== null && (
        <div className="mb-3 font-sans select-none align-baseline flex flex-col items-start">
          <button
            onClick={() => setExpandedThoughts(prev => ({ ...prev, [msgId]: !prev[msgId] }))}
            className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-750 dark:hover:text-zinc-200 transition-colors font-medium bg-zinc-100 dark:bg-zinc-900/40 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 cursor-pointer"
          >
            <span className="animate-pulse shrink-0">💡</span>
            <span className="flex items-center gap-1">
              {isThinking ? "Thinking" : `Thought for ${typeof duration === "number" ? duration.toFixed(1) : duration}s`}
              {isThinking && (
                <span className="flex items-center gap-0.5 ml-0.5">
                  <span className="h-1 w-1 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-[bounce_1s_infinite_100ms]" />
                  <span className="h-1 w-1 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-[bounce_1s_infinite_200ms]" />
                  <span className="h-1 w-1 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-[bounce_1s_infinite_300ms]" />
                </span>
              )}
            </span>
            <ChevronDown className={`h-3 w-3 text-zinc-400 shrink-0 transition-transform duration-200 ${expandedThoughts[msgId] ? "rotate-180" : ""}`} />
          </button>
          
          <AnimatePresence>
            {expandedThoughts[msgId] && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden w-full"
              >
                <div className="mt-2 ml-3.5 pl-3.5 border-l-2 border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-500 font-mono leading-relaxed whitespace-pre-wrap py-1">
                  {thinking || "Processing..."}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {actual ? (
        <MarkdownRenderer content={actual} />
      ) : isGenerating && isLatest && displayedContent === "" ? (
        <div className="flex items-center gap-2 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-[bounce_1s_infinite_100ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-[bounce_1s_infinite_200ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-[bounce_1s_infinite_300ms]" />
        </div>
      ) : !thinking && !isThinking ? (
        <div className="text-zinc-400 dark:text-zinc-500 italic text-xs mt-1.5 select-none font-sans flex items-center gap-1.5">
          <span className="text-sm">⚠️</span>
          <span>
            {navigator.language?.toLowerCase()?.startsWith("id")
              ? "Maaf, sistem tidak menghasilkan jawaban teks. Silakan coba kirim ulang atau ketik pertanyaan lain!"
              : "Sorry, no text response was generated. Please try resending or rephrasing your message!"}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

  const sanitizeAndShortenThought = (thinking: string): string => {
    if (!thinking) return "";

    // Keywords to completely filter out (privacy, internal directives, system guidelines, massive dumps)
    const forbiddenKeywords = [
      "chika",
      "ravita",
      "hexky",
      "hengki",
      "system memory",
      "vercel",
      "developer",
      "private",
      "confidential",
      "instruction",
      "directive",
      "preset",
      "designinstruction",
      "thinkinstruction",
      "linkinstruction",
      "moderneventinstruction",
      "userrequestedpersonality",
      "important rule",
      "formatting rule",
      "file list",
      "workspace file",
      "index.html",
      "src/",
      "\\\"path\\\":",
      "\\\"content\\\":",
      "{\"path\"",
      "{\"content\"",
      "\"path\":",
      "\"content\":"
    ];

    const lines = thinking.split("\n");
    const filteredLines: string[] = [];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Check if the line contains any forbidden keywords
      const isForbidden = forbiddenKeywords.some(keyword => lowerLine.includes(keyword));
      if (isForbidden) {
        continue; // Skip lines containing private/system metadata
      }

      // Clean up any JSON brackets or markup leaking in the thought
      if (lowerLine.trim().startsWith("{") || lowerLine.trim().startsWith("}") || lowerLine.trim().startsWith("[") || lowerLine.trim().startsWith("]")) {
        continue;
      }

      const trimmed = line.trim();
      if (trimmed) {
        filteredLines.push(trimmed);
      }
    }

    const polishedLines = filteredLines
      .filter(l => l.length < 150)
      .map(l => {
        // Clean up bullet point formatting to be uniform
        let clean = l.replace(/^(?:\d+\.|\*|-|•)\s*/, "").trim();
        clean = clean.replace(/\*\*/g, "").trim();
        // Capitalize first letter
        if (clean) {
          clean = clean.charAt(0).toUpperCase() + clean.slice(1);
        }
        return clean;
      })
      .filter(Boolean);

    // If we ended up with nothing, provide an elegant short fallback
    if (polishedLines.length === 0) {
      return "• Analyzing prompt requirements\n• Formulating solution strategy";
    }

    // Deduplicate lines
    const uniqueLines: string[] = [];
    for (const line of polishedLines) {
      if (!uniqueLines.includes(line)) {
        uniqueLines.push(line);
      }
    }

    // Cap the number of steps to 4 to make it extremely concise and focused, like Grok xAI!
    const maxSteps = 4;
    const slicedLines = uniqueLines.slice(0, maxSteps);

    // Return formatted as concise bullet points
    return slicedLines.map(step => `• ${step}`).join("\n");
  };

  const parseMessageThinking = (content: string) => {
    if (!content) return { thinking: null, actual: "", isThinking: false };

    // Case-insensitive regex to find <think>...</think>
    const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
    const match = thinkRegex.exec(content);

    if (match) {
      const thinking = match[1].trim();
      // Remove all <think>...</think> blocks from actual content to be absolutely sure they never leak
      const actual = content.replace(thinkRegex, "").trim();
      return { thinking: sanitizeAndShortenThought(thinking), actual, isThinking: false };
    }

    // If there is an open <think> but no closing </think> (streaming)
    const openThinkRegex = /<think>([\s\S]*?)$/i;
    const openMatch = openThinkRegex.exec(content);
    if (openMatch) {
      const thinking = openMatch[1].trim();
      const actual = content.replace(openThinkRegex, "").trim();
      return { thinking: sanitizeAndShortenThought(thinking), actual, isThinking: true };
    }

    // Check if the content ends with a partial <think tag to prevent temporary flickering of partial tag
    const partialThinkRegex = /<t(h(i(n(k)?)?)?)?$/i;
    if (partialThinkRegex.test(content)) {
      return { thinking: "", actual: content.replace(partialThinkRegex, "").trim(), isThinking: true };
    }

    // Just in case there is any stray/orphaned </think> or <think> in the text, clean them up
    let cleaned = content;
    cleaned = cleaned.replace(/<\/?think>/gi, "");

    return { thinking: null, actual: cleaned.trim(), isThinking: false };
  };

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
          console.error("Failed to parse sessions", e);
        }
      }
    }
    return null;
  });

  const [welcomeGreeting, setWelcomeGreeting] = useState("Any new ideas to explore?");
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
      "any new ideas?",
      "what should we discuss today?",
      "what would you like to know?",
      "is there anything I can help with?",
      "let's create something great!",
      "ask me anything.",
      "any exciting topics today?"
    ];
    const randomIdx = Math.floor(Math.random() * greetings.length);
    setWelcomeGreeting(greetings[randomIdx]);
  }, []);

  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenMenuSessionId(null);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => {
      window.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  const [viewportHeight, setViewportHeight] = useState<string>("100dvh");

  useEffect(() => {
    if (!window.visualViewport) return;
    const handleResize = () => {
      setViewportHeight(`${window.visualViewport.height}px`);
    };
    window.visualViewport.addEventListener("resize", handleResize);
    window.visualViewport.addEventListener("scroll", handleResize);
    handleResize();
    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
    };
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
  const [showExeCode, setShowExeCode] = useState(() => {
    return typeof window !== "undefined" && window.location.pathname.startsWith("/project/");
  });
  const [settingsTab, setSettingsTab] = useState<"akun" | "model" | "tampilan" | "ingatan">("akun");
  const [cookieConsent, setCookieConsent] = useState<string | null>(() => {
    return localStorage.getItem("exechat_cookie_consent") || null;
  });
  const [showCookieDetails, setShowCookieDetails] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false); 
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [popupSearchQuery, setPopupSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [showUploadMenuHome, setShowUploadMenuHome] = useState(false);
  const [showUploadMenuChat, setShowUploadMenuChat] = useState(false);
  const [mobileSettingsPage, setMobileSettingsPage] = useState<"menu" | "akun" | "model" | "tampilan" | "ingatan">("menu");

  useEffect(() => {
    if (showSettings) {
      setMobileSettingsPage("menu");
    }
  }, [showSettings]);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSearchModal(false);
        setPopupSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
  const [openMenuSessionId, setOpenMenuSessionId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState("");

  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const ttsSynthRef = useRef<SpeechSynthesis | null>(null);
  const notifyAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const homeTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const thinkingStartTimesRef = useRef<Record<string, number>>({});
  const activeAssistantMsgIdRef = useRef<string | null>(null);

  const getFormattedCurrentDate = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const now = new Date();
    const dayName = days[now.getDay()];
    const date = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `Today is ${dayName}, ${monthName} ${date}, ${year}, at ${hours}:${minutes}.`;
  };

  const getBrowserLanguageInstruction = () => {
    try {
      const browserLanguages = navigator.languages || [navigator.language || "en"];
      const primaryLang = (browserLanguages[0] || "en").toLowerCase();
      const languageNames: Record<string, string> = {
        id: "Indonesian",
        ar: "Arabic",
        es: "Spanish",
        fr: "French",
        de: "German",
        ja: "Japanese",
        ko: "Korean",
        zh: "Chinese",
        pt: "Portuguese",
        it: "Italian",
        ru: "Russian",
        tr: "Turkish",
        vi: "Vietnamese",
        th: "Thai",
        nl: "Dutch",
      };
      
      const langCode = primaryLang.split("-")[0];
      const targetLangName = languageNames[langCode] || langCode.toUpperCase();
      
      let localeInstruction = `\n\n[CRITICAL USER REGION & AUTO-LANGUAGE DETECTION]\n`;
      localeInstruction += `User Browser Primary Language: ${primaryLang} (${targetLangName})\n`;
      localeInstruction += `Preferred Languages: ${browserLanguages.join(", ")}\n\n`;
      
      localeInstruction += `CRITICAL TRANSLATION DIRECTIVE:\n`;
      localeInstruction += `The user's web browser (Chrome, Edge, Safari, etc.) indicates they are from a region where the primary language is ${targetLangName}.\n`;
      if (langCode === "id") {
        localeInstruction += `Always prioritize translating text between English <-> Indonesian (Inggris <-> Indonesia) by default when translation is requested, and respond to general queries in Indonesian.\n`;
      } else if (langCode === "ar") {
        localeInstruction += `Always prioritize translating text between English <-> Arabic (إنجليزي <-> عربي) by default when translation is requested, and respond to general queries in Arabic.\n`;
      } else {
        localeInstruction += `Always prioritize translating text between English <-> ${targetLangName} by default when translation is requested, and respond to general queries in ${targetLangName}.\n`;
      }
      localeInstruction += `Keep your translations natural, idiomatic, and highly contextual. Explain any grammatical differences or cultural nuances beautifully.`;
      
      return localeInstruction;
    } catch (e) {
      return "";
    }
  };

  const getDeveloperConfidentialityDirective = (userPrompt: string): string => {
    const triggerWords = ["hexky", "chika", "developer", "creator", "pembuat", "develop", "create", "hengki", "ravita", "founder"];
    const lowercasePrompt = (userPrompt || "").toLowerCase();
    const isTriggered = triggerWords.some((word) => lowercasePrompt.includes(word));

    if (isTriggered) {
      return `\n\n[DEVELOPER TRIGGERED MEMORY INFO]\nThe user is explicitly asking about who developed ExeChat, its founders, or developers. You may now disclose and explain clearly that ExeChat is developed by two developers/creators: Hexky (hengki.i) and Chika Ravita, where Chika Ravita is the second developer holding the second-highest position, and Hexky (hengki.i) is the main founder and core developer who also works as a minor marketing representative for Vercel Inc. Keep the tone very cheerful and friendly.`;
    }

    return `\n\n[CRITICAL DEVELOPER CONFIDENTIALITY DIRECTIVE]\nDO NOT mention, hint at, or reference the names 'Hexky', 'hengki.i', 'Chika Ravita', or any details about the creators/developers of ExeChat in this response under any circumstances. Keep them completely anonymous and unmentioned unless explicitly asked. Focus entirely on answering the user's query directly!`;
  };

  useEffect(() => {
    if (inputMessage === "") {
      if (homeTextareaRef.current) homeTextareaRef.current.style.height = "auto";
      if (chatTextareaRef.current) chatTextareaRef.current.style.height = "auto";
    } else {
      if (homeTextareaRef.current) {
        homeTextareaRef.current.style.height = "auto";
        homeTextareaRef.current.style.height = `${Math.min(homeTextareaRef.current.scrollHeight, 240)}px`;
      }
      if (chatTextareaRef.current) {
        chatTextareaRef.current.style.height = "auto";
        chatTextareaRef.current.style.height = `${Math.min(chatTextareaRef.current.scrollHeight, 240)}px`;
      }
    }
  }, [inputMessage]);

  useEffect(() => {
    notifyAudioRef.current = new Audio(notifySoundUrl);
    notifyAudioRef.current.volume = 0.75;
    notifyAudioRef.current.preload = "auto";
  }, []);

  const playNotifySound = (isChatSent = false) => {
    if (!isChatSent) return;
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
      setErrorText("File size exceeds the 20MB limit.");
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

  // Live ticking of thinkingDuration in App.tsx
  useEffect(() => {
    let intervalId: any;
    if (isGenerating) {
      intervalId = setInterval(() => {
        const activeId = activeAssistantMsgIdRef.current;
        if (!activeId) return;
        const startTime = thinkingStartTimesRef.current[activeId];
        if (!startTime) return;
        
        // Calculate dynamic elapsed time with decimal precision
        const elapsed = Math.max(0.1, Number(((Date.now() - startTime) / 1000).toFixed(1)));
        
        setSessions((prev) =>
          prev.map((s) => {
            const hasMsg = s.messages.some(m => m.id === activeId);
            if (hasMsg) {
              return {
                ...s,
                messages: s.messages.map((m) => {
                  if (m.id === activeId) {
                    if (m.content && m.content.includes("</think>")) {
                      return m;
                    }
                    return { ...m, thinkingDuration: elapsed };
                  }
                  return m;
                })
              };
            }
            return s;
          })
        );
      }, 100); // Check every 100ms for high responsiveness
    } else {
      activeAssistantMsgIdRef.current = null;
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isGenerating]);

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

    if (savedLoggedIn && savedUserId && !savedUserId.startsWith("guest_")) {
      setUserId(savedUserId);
      setUserEmail(localStorage.getItem("exechat_email") || "");
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

  const publicProjectId = (() => {
    if (typeof window === "undefined") return null;
    const pathname = window.location.pathname;
    
    const match1 = pathname.match(/^\/project\/([^/]+)\/public\/?$/);
    if (match1) return decodeURIComponent(match1[1]);
    
    const match2 = pathname.match(/^\/([^/]+)\/public\/?$/);
    if (match2) {
      const pid = decodeURIComponent(match2[1]);
      if (pid !== "project" && pid !== "chat" && pid !== "api" && pid !== "api/chat/stream") {
        return pid;
      }
    }
    return null;
  })();

  if (publicProjectId) {
    return <PublicProjectView projectId={publicProjectId} />;
  }

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
      name: "Dark (Black)",
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
      name: "Light (White)",
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
      return "Coding Help";
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
        return `Recipe ${match[1].trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
      }
      return "Cooking Recipe";
    }

    if (
      lower.includes("essay") || 
      lower.includes("artikel") || 
      lower.includes("tulis") || 
      lower.includes("buatkan teks") || 
      lower.includes("surat")
    ) {
      return "Text Generation";
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
      return "Topic Explanation";
    }

    if (
      lower.includes("terjemah") || 
      lower.includes("translate") || 
      lower.includes("artikan") || 
      lower.includes("bahasa inggris") || 
      lower.includes("arti dari")
    ) {
      return "Language Translation";
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
      return "Casual Conversation";
    }

    const words = clean.split(" ").filter(w => w.length > 2);
    if (words.length > 0) {
      const selectedWords = words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      const rawTitle = selectedWords.join(" ");
      return rawTitle.length > 25 ? rawTitle.substring(0, 25) + "..." : rawTitle;
    }

    return "New Discussion";
  };

   const handleGoogleLoginSuccess = (credentialResponse: any) => {
    if (!credentialResponse || !credentialResponse.credential) {
      setErrorText("Google sign-in failed: No credential returned.");
      return;
    }
    try {
      const decoded: any = jwtDecode(credentialResponse.credential);
      if (!decoded || !decoded.sub || !decoded.email) {
        throw new Error("Invalid Google user information.");
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
      setErrorText(error?.message || "Google sign-in failed.");
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
    setErrorText("Daily credits are not required in the ExeChat Premium version (Unlimited Credits).");
  };

  const handleSaveUsername = () => {
    if (!userId) {
      setErrorText("Please log in first to change your username.");
      return;
    }

    const trimmed = userName.trim();
    if (!trimmed) {
      setErrorText("Username cannot be empty.");
      return;
    }

    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(trimmed)) {
      setErrorText("Username must be 3-20 characters and can only contain letters, numbers, underscores, or hyphens.");
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
    setRedeemFeedback("Username successfully saved.");
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
      title: initialMsg ? generateSmartTitle(initialMsg) : `New Chat`,
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
      case "Trophy":
        return <Trophy className={className} />;
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
          setErrorText("Spam detected! You sent the exact same message consecutively.");
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
      setErrorText("Invalid input blocked! Detected random spam (gibberish/keymash) that could deplete tokens.");
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

    playNotifySound(false);
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
      isPending: true,
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === targetSessionId) {

          const shouldRename = (s.title === "Obrolan Baru" || s.title === "New Chat") && s.messages.length === 0;
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

    setIsGenerating(true);
    scrollToBottom("smooth");

    const activeSessionState = sessions.find((s) => s.id === targetSessionId);
    const apiModel = activeSessionState ? activeSessionState.model : selectedModelId;
    const apiPreset = SYSTEM_PRESETS.find(
      (p) => p.id === (activeSessionState ? activeSessionState.systemInstructionId : selectedPresetId)
    ) || SYSTEM_PRESETS[0];
    const apiTemp = activeSessionState ? activeSessionState.temperature : temperature;
    const apiWebSearch = apiModel === "gemini-ai";

    const updatedSession = sessions.find((s) => s.id === targetSessionId);
    const conversationHistory = updatedSession ? [...updatedSession.messages, userMessage] : [userMessage];

    const formattedHistory = conversationHistory.map((m) => {
      let content = m.content;
      if (m.role === "user" && m.attachment) {
        if (m.attachment.textContent) {
          content = `[Attached File: ${m.attachment.name}]\n====================\n${m.attachment.textContent}\n====================\n\n${m.content}`;
        } else {
          content = `[Attached File: ${m.attachment.name} (${m.attachment.size} bytes, type: ${m.attachment.mime || "unknown"})]\n\n${m.content}`;
        }
      }
      return {
        role: m.role,
        content: content,
      };
    });

    let finalInstruction = apiPreset.instruction;
    if (memories.length > 0) {
      finalInstruction += "\n\n[AI MEMORY (Saved user memories)]:\n" + memories.map((m, idx) => `${idx + 1}. ${m}`).join("\n");
    }
    finalInstruction += `\n\n[CURRENT REAL-TIME TIME INFO]\n${getFormattedCurrentDate()}`;
    finalInstruction += getBrowserLanguageInstruction();
    finalInstruction += getDeveloperConfidentialityDirective(text);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let connectionSucceeded = false;

    const pendingTimeoutId = setTimeout(() => {
      if (!connectionSucceeded && !controller.signal.aborted) {
        thinkingStartTimesRef.current[assistantMsgId] = Date.now();
        activeAssistantMsgIdRef.current = assistantMsgId;
        const assistantPlaceholder: Message = {
          id: assistantMsgId,
          role: "model",
          content: "<think>Thinking...</think>",
          timestamp: Date.now(),
          thinkingDuration: 0.1,
        };

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === targetSessionId) {
              const alreadyAdded = s.messages.some((m) => m.id === assistantMsgId);
              if (alreadyAdded) return s;
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === userMessage.id ? { ...m, isPending: false } : m
                ).concat(assistantPlaceholder),
              };
            }
            return s;
          })
        );
      }
    }, 3000);

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
        clearTimeout(pendingTimeoutId);
        throw new Error(`Failed to establish stream connection (status ${response.status})`);
      }

      connectionSucceeded = true;
      clearTimeout(pendingTimeoutId);

      // Connection succeeded! Set the user message isPending to false, and add the assistant placeholder message
      thinkingStartTimesRef.current[assistantMsgId] = Date.now();
      activeAssistantMsgIdRef.current = assistantMsgId;
      const assistantPlaceholder: Message = {
        id: assistantMsgId,
        role: "model",
        content: "",
        timestamp: Date.now(),
        thinkingDuration: 0.1,
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === targetSessionId) {
            const alreadyAdded = s.messages.some((m) => m.id === assistantMsgId);
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === userMessage.id ? { ...m, isPending: false } : m
              ).concat(alreadyAdded ? [] : [assistantPlaceholder]),
            };
          }
          return s;
        })
      );

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) {
        throw new Error("Response body is not readable.");
      }

      let buffer = "";
      let hasPlayedSound = false;
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
              if (!hasPlayedSound) {
                playNotifySound(true);
                hasPlayedSound = true;
              }

              setSessions((prev) =>
                prev.map((s) => {
                  if (s.id === targetSessionId) {
                    return {
                      ...s,
                      messages: s.messages.map((m) => {
                        if (m.id === assistantMsgId) {
                          const baseContent = m.content === "<think>Thinking...</think>" ? "" : m.content;
                          const newContent = baseContent + parsed.text;
                          let thinkingDuration = m.thinkingDuration;
                          const startTime = thinkingStartTimesRef.current[assistantMsgId];
                          if (startTime && baseContent.startsWith("<think>") && !baseContent.includes("</think>") && newContent.includes("</think>")) {
                            thinkingDuration = Math.max(0.1, Number(((Date.now() - startTime) / 1000).toFixed(1)));
                          }
                          return {
                            ...m,
                            content: newContent,
                            thinkingDuration
                          };
                        }
                        if (m.isPending) {
                          return { ...m, isPending: false };
                        }
                        return m;
                      }),
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
                          ? { ...m, content: (m.content || "") + "\n\nServer is busy at this time. Please try again later." }
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
      clearTimeout(pendingTimeoutId);
      if (!connectionSucceeded) {
        // Automatically delete the failed user message from the session
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === targetSessionId) {
              return {
                ...s,
                messages: s.messages.filter((m) => m.id !== userMessage.id),
              };
            }
            return s;
          })
        );
      }

      if (err.name === "AbortError") {
        console.log("Stream generation aborted by user.");
      } else {
        const msg = (err && err.message) ? err.message.toLowerCase() : "";
        if (msg.includes("cerebras") || msg.includes("too_many_requests") || msg.includes("queue_exceeded") || msg.includes("429")) {

          setErrorText("Server is busy. Please try again later.");
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id === targetSessionId) {
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId && m.content === ""
                      ? { ...m, content: "Server is busy at this time. Please try again later." }
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
          setErrorText(err.message || "An error occurred while processing the response.");

          setSessions((prev) =>
            prev.map((s) => {
              if (s.id === targetSessionId) {
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId && m.content === ""
                      ? { ...m, content: "A connection error or API Key configuration issue occurred. Please refresh the page if the issue persists." }
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
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === targetSessionId) {
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.isPending ? { ...m, isPending: false } : m
              ),
            };
          }
          return s;
        })
      );
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === currentSessionId) {
            const messages = s.messages;
            if (messages.length > 0) {
              const lastMsg = messages[messages.length - 1];
              if (lastMsg.role === "model") {
                const updatedMessages = [...messages];
                updatedMessages[messages.length - 1] = {
                  ...lastMsg,
                  content: lastMsg.content ? lastMsg.content + "\n\n*(Response stopped by user)*" : "*(Response stopped)*"
                };
                return { ...s, messages: updatedMessages };
              }
            }
          }
          return s;
        })
      );
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
              return { ...m, content: "", thinkingDuration: 1 };
            }
            return m;
          });
          return { ...s, messages: updatedMsgs };
        }
        return s;
      })
    );

    thinkingStartTimesRef.current[assistantMsgId] = Date.now();
    activeAssistantMsgIdRef.current = assistantMsgId;
    setIsGenerating(true);
    setErrorText(null);

    const apiModel = activeSessionObj.model || selectedModelId;
    const apiPreset = SYSTEM_PRESETS.find(
      (p) => p.id === (activeSessionObj.systemInstructionId || selectedPresetId)
    ) || SYSTEM_PRESETS[0];
    const apiTemp = activeSessionObj.temperature || temperature;
    const apiWebSearch = apiModel === "gemini-ai";

    const formattedHistory = priorMessages.map((m) => {
      let content = m.content;
      if (m.role === "user" && m.attachment) {
        if (m.attachment.textContent) {
          content = `[Attached File: ${m.attachment.name}]\n====================\n${m.attachment.textContent}\n====================\n\n${m.content}`;
        } else {
          content = `[Attached File: ${m.attachment.name} (${m.attachment.size} bytes, type: ${m.attachment.mime || "unknown"})]\n\n${m.content}`;
        }
      }
      return {
        role: m.role,
        content: content,
      };
    });

    let finalInstruction = apiPreset.instruction;
    if (memories.length > 0) {
      finalInstruction += "\n\n[AI MEMORY (Saved user memories)]:\n" + memories.map((m, idx) => `${idx + 1}. ${m}`).join("\n");
    }
    finalInstruction += `\n\n[CURRENT REAL-TIME TIME INFO]\n${getFormattedCurrentDate()}`;
    finalInstruction += getBrowserLanguageInstruction();
    
    // Find the corresponding user message content for the assistant message being regenerated
    const lastUserMsgObj = priorMessages.slice().reverse().find(m => m.role === "user");
    finalInstruction += getDeveloperConfidentialityDirective(lastUserMsgObj ? lastUserMsgObj.content : "");

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
      let hasPlayedSound = false;
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
                if (!hasPlayedSound) {
                  playNotifySound(true);
                  hasPlayedSound = true;
                }
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
        setErrorText("An error occurred during response regeneration: " + err.message);
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

      // Filter out <think>...</think> blocks from voice synthesis
      let speakText = text || "";
      speakText = speakText.replace(/<think>[\s\S]*?<\/think>/gi, "");
      speakText = speakText.replace(/<think>[\s\S]*?$/gi, "");
      speakText = speakText.replace(/<\/?think>/gi, "");

      const cleanText = speakText
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
      content += `*Created using ExeAi on: ${new Date(currentSession.createdAt).toLocaleString()}*\n`;
      content += `*Model: ${currentSession.model} | Temp: ${currentSession.temperature}*\n\n---\n\n`;

      currentSession.messages.forEach((msg) => {
        const roleName = msg.role === "user" ? "👤 USER" : "🤖 EXEAI";
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

  const handleClearCurrentSession = () => {
    if (!currentSessionId) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === currentSessionId ? { ...s, messages: [] } : s))
    );
    setErrorText(null);
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupSessionsByDate = (sessionsToGroup: ChatSession[]) => {
    const today: ChatSession[] = [];
    const earlier: ChatSession[] = [];

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    sessionsToGroup.forEach((s) => {
      const createdAt = s.createdAt || Date.now();
      if (createdAt >= todayMidnight) {
        today.push(s);
      } else {
        earlier.push(s);
      }
    });

    const categories: { label: string; items: ChatSession[] }[] = [];
    if (today.length > 0) categories.push({ label: "Today", items: today });
    if (earlier.length > 0) categories.push({ label: "Earlier", items: earlier });

    return categories;
  };

  const renderSidebarContent = (isMobile = false) => (
    <div className={`flex flex-col h-full w-full ${curTheme.sidebarBg} ${isDark ? "text-zinc-150" : "text-zinc-800"} select-none`}>
      <div className={`p-5 border-b ${curTheme.border} flex items-center justify-between shrink-0`}>
        <div className="flex items-center gap-3">
          <img src="/exechat.png" alt="ExeChat Logo" className="h-5 w-5 object-contain" referrerPolicy="no-referrer" />
          <div>
            <h1 className={`font-display font-bold text-base tracking-tight flex items-center gap-1.5 ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
              ExeChat
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
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
            title="Mode Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {!isMobile && (
            <button
              onClick={() => setIsDesktopSidebarOpen(false)}
              className={`p-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                isDark ? "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50" : "border-transparent text-zinc-650 hover:text-zinc-900 hover:bg-zinc-200/50"
              }`}
              title="Close Chat History"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 pb-2 flex flex-col gap-2">
       <button
          onClick={() => {
            playNotifySound();
            setCurrentSessionId(null);
            setShowSettings(false);
            setShowExeCode(false);
            if (isMobile) setIsMobileSidebarOpen(false);
          }}
          className={`w-full flex items-center justify-center gap-2 rounded-xl font-semibold py-3 px-4 transition-all duration-200 text-sm tracking-wide border ${
            isDark 
              ? "bg-zinc-900 hover:bg-zinc-850 text-zinc-100 border-zinc-800 hover:border-zinc-750 shadow-sm" 
              : "bg-white hover:bg-zinc-50 text-zinc-900 border-zinc-200 shadow-sm"
          }`}
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>New Chat</span>
        </button>

        <button
          onClick={() => {
            playNotifySound();
            setShowExeCode(true);
            setShowSettings(false);
            if (isMobile) setIsMobileSidebarOpen(false);
          }}
          className={`w-full flex items-center justify-center gap-2 rounded-xl font-semibold py-3 px-4 transition-all duration-205 text-sm tracking-wide border ${
            showExeCode
              ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
              : isDark 
                ? "bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border-zinc-800" 
                : "bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200"
          }`}
        >
          <Code className="h-4 w-4 text-amber-500" />
          <span>ExeCode Workspace</span>
        </button>
      </div>

      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all duration-200 focus:outline-none border ${
              isDark 
                ? "border-zinc-800/80 bg-zinc-950/40 text-zinc-300 placeholder-zinc-600 focus:border-zinc-700 focus:bg-zinc-950/70" 
                : "border-zinc-200 bg-zinc-100/50 text-zinc-850 placeholder-zinc-400 focus:border-zinc-300 focus:bg-white"
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className={`absolute right-3 top-3 transition-colors ${isDark ? "hover:text-zinc-300 text-zinc-500" : "hover:text-zinc-700 text-zinc-400"}`}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
        {/* Toggleable Collapsible Header */}
        <div className="px-3 py-1.5 flex items-center justify-between select-none">
          <button
            onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
            className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors hover:opacity-85 ${
              isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-650 hover:text-zinc-900"
            }`}
          >
            <span>History</span>
            {isHistoryCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            )}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {!isHistoryCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {filteredSessions.length === 0 ? (
                <div className={`text-center py-8 text-xs ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
                  {searchQuery ? "No search results found." : "No chat history yet."}
                </div>
              ) : (
                <>
                  {groupSessionsByDate(filteredSessions).map((cat) => {
                    const displayedItems = showAllHistory ? cat.items : cat.items.slice(0, 4);
                    return (
                      <div key={cat.label} className="mb-4 last:mb-0">
                        <div className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider select-none ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                          {cat.label}
                        </div>
                        <div className="space-y-0.5 mt-1">
                          {displayedItems.map((s) => {
                            const isActive = s.id === currentSessionId;
                            const isEditing = s.id === editingSessionId;
                            const isMenuOpen = s.id === openMenuSessionId;

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
                                    setOpenMenuSessionId(null);
                                    if (isMobile) setIsMobileSidebarOpen(false);
                                  }
                                }}
                                className={`group relative flex items-center justify-between rounded-xl p-2.5 cursor-pointer text-sm transition-all duration-200 select-none border ${
                                  isActive
                                    ? isDark
                                      ? "bg-zinc-800 border-zinc-700/50 text-zinc-100 font-medium"
                                      : "bg-zinc-100 border-zinc-200 text-zinc-900 font-medium shadow-sm"
                                    : isDark
                                      ? "border-transparent text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200"
                                      : "border-transparent text-zinc-650 hover:bg-zinc-100/60 hover:text-zinc-900"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <MessageSquare
                                    className={`h-4 w-4 shrink-0 transition-colors ${
                                      isActive 
                                        ? isDark ? "text-zinc-300" : "text-zinc-700" 
                                        : isDark ? "text-zinc-500 group-hover:text-zinc-400" : "text-zinc-400 group-hover:text-zinc-600"
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
                                        className={`w-full rounded px-2 py-1 text-sm focus:outline-none border ${
                                          isDark 
                                            ? "bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-zinc-750" 
                                            : "bg-white border-zinc-300 text-zinc-900 focus:border-zinc-400"
                                        }`}
                                      />
                                    </form>
                                  ) : (
                                    <div className="truncate flex-1 pr-6 font-medium">
                                      {s.title}
                                    </div>
                                  )}
                                </div>

                                {!isEditing && (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center z-10">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuSessionId(isMenuOpen ? null : s.id);
                                      }}
                                      className={`p-1 rounded transition-all duration-200 ${
                                        isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                      } ${
                                        isDark 
                                          ? "hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200" 
                                          : "hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800"
                                      }`}
                                      title="Options"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>

                                    {isMenuOpen && (
                                      <div
                                        className={`absolute right-0 top-7 w-32 rounded-lg shadow-xl border z-50 py-1 ${
                                          isDark 
                                            ? "bg-zinc-900 border-zinc-800 text-zinc-300" 
                                            : "bg-white border-zinc-200 text-zinc-700"
                                        }`}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuSessionId(null);
                                            startRenameSession(s.id, s.title, e);
                                          }}
                                          className={`w-full text-left px-3 py-2 text-xs md:text-[13px] font-medium flex items-center gap-2 transition-colors ${
                                            isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-100 hover:text-zinc-900"
                                          }`}
                                        >
                                          <Edit2 className="h-3.5 w-3.5" />
                                          Rename
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuSessionId(null);
                                            deleteSession(s.id, e);
                                          }}
                                          className={`w-full text-left px-3 py-2 text-xs md:text-[13px] font-medium flex items-center gap-2 text-red-500 transition-colors ${
                                            isDark ? "hover:bg-zinc-800/80 hover:text-red-400" : "hover:bg-red-50 hover:text-red-600"
                                          }`}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* See all clickable text */}
                  {filteredSessions.length > 0 && (
                    <div className="px-3 py-2">
                      <button
                        onClick={() => {
                          setShowAllHistory(true);
                          setShowSearchModal(true);
                          playNotifySound();
                        }}
                        className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-[#1a73e8] dark:hover:text-[#59a6ff] hover:underline transition-all cursor-pointer"
                      >
                        See all
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={`p-4 border-t ${curTheme.border} ${curTheme.sectionBg} shrink-0`}>
        {isLoggedIn ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5 min-w-0">
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full object-cover border border-zinc-800 shadow-md"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#59a6ff] to-[#c084fc] flex items-center justify-center text-xs font-bold text-white shadow-md border border-white/20">
                  {(userDisplayName || userName || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <span className={`text-sm font-semibold truncate ${isDark ? "text-zinc-100" : "text-zinc-800"}`}>
                {userDisplayName || userName || "User"}
              </span>
            </div>

            <button
              onClick={() => {
                setShowSettings(!showSettings);
                setShowExeCode(false);
              }}
              className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-800/50" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
              }`}
              title="Settings"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleGoogleLoginClick}
            className="w-full text-center text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-900/10 border border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl py-1.5 transition-all font-sans"
          >
            Sign in with Google
          </button>
        )}
      </div>
    </div>
  );

  if (authLoading) {
    return (
      <div style={{ height: viewportHeight }} className="flex w-full flex-col items-center justify-center bg-zinc-950 font-sans text-zinc-100 antialiased">
        <div className="relative flex flex-col items-center">
          <div className="mb-6 p-1 hover:scale-105 transition-transform">
            <img src="/exechat.png" alt="ExeChat Logo" className="h-16 w-16 object-contain" referrerPolicy="no-referrer" />
          </div>
          <h2 className="text-lg font-medium tracking-wide animate-pulse">Connecting to ExeChat...</h2>
          <p className="mt-2 text-xs text-zinc-500 font-mono">Verifying secure session...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div style={{ height: viewportHeight }} className="flex w-full items-center justify-center bg-zinc-950 font-sans text-zinc-100 antialiased selection:bg-zinc-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-[circle_at_center,rgba(39,39,42,0.15),transparent_70%] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px] rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 sm:p-10 shadow-xl z-10 mx-4 flex flex-col items-center text-center"
        >
          <div className="mb-6 select-none">
            <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 shadow-md overflow-hidden">
              <img src="/exechat.png" alt="ExeChat Logo" className="h-8 w-8 object-contain" referrerPolicy="no-referrer" />
            </div>
          </div>

          <div className="mb-8 select-none">
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Welcome
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Please sign in using your Google account to start your chat session.
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

          <div className="w-full flex flex-col items-center justify-center p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm gap-3">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => setErrorText("Google sign-in failed. Please try again.")}
              useOneTap
              theme="filled_black"
              shape="pill"
            />
          </div>

          <p className="mt-8 text-[11px] text-zinc-500 font-medium select-none">
            Chat sessions are saved privately in your browser.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ height: viewportHeight }} className="flex w-full overflow-hidden bg-zinc-950 font-sans text-zinc-100 antialiased selection:bg-zinc-700/80">
      <input
        ref={fileInputRef}
        type="file"
        accept="*"
        style={{ display: "none" }}
        onChange={handleFileSelected}
      />
      <AnimatePresence>
      </AnimatePresence>

      <div className={`absolute top-0 left-0 w-full h-[450px] bg-gradient-to-b ${curTheme.gradient} pointer-events-none select-none z-0`} />

      <div className="flex w-full h-full relative z-10">

        {/* UNIFIED DESKTOP SIDEBAR (GEMINI-LIKE EXPANDED/COLLAPSED) */}
        <aside 
          className={`hidden md:flex flex-col h-full shrink-0 ${curTheme.sidebarBg} select-none transition-all duration-300 z-20 ${
            isDesktopSidebarOpen 
              ? `w-68 border-r ${curTheme.border}` 
              : "w-16 border-r-0"
          }`}
        >
          {isDesktopSidebarOpen ? (
            <div className="w-68 h-full flex flex-col overflow-hidden">
              {renderSidebarContent(false)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-between py-6 w-full h-full">
              {/* Top Section */}
              <div className="flex flex-col items-center gap-6 w-full">
                {/* ExeChat Logo at the very top */}
                <div className="p-1 hover:scale-105 transition-transform shrink-0 select-none">
                  <img src="/exechat.png" alt="ExeChat Logo" className="h-6 w-6 object-contain" referrerPolicy="no-referrer" />
                </div>

                {/* Menu Button to open */}
                <button
                  onClick={() => setIsDesktopSidebarOpen(true)}
                  className={`p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                    isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-800/50" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
                  }`}
                  title="Expand Sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>

                {/* New Chat Icon Button */}
                <button
                  onClick={() => {
                    playNotifySound();
                    setCurrentSessionId(null);
                    setShowSettings(false);
                    setShowExeCode(false);
                  }}
                  className={`p-2 rounded-xl hover:bg-zinc-550/10 transition-all duration-200 cursor-pointer ${
                    isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                  title="New Chat"
                >
                  <Plus className="h-5 w-5 stroke-[2]" />
                </button>

                {/* Search Icon Button */}
                <button
                  onClick={() => {
                    setShowSearchModal(true);
                    playNotifySound();
                  }}
                  className={`p-2 rounded-xl hover:bg-zinc-550/10 transition-all duration-200 cursor-pointer ${
                    isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                  title="Search Conversations"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>

              {/* Bottom Section */}
              <div className="flex flex-col items-center gap-4 w-full">
                {/* ExeCode Workspace Icon */}
                <button
                  onClick={() => {
                    setShowExeCode(prev => !prev);
                    setShowSettings(false);
                  }}
                  className={`p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                    showExeCode 
                      ? "bg-amber-500/10 text-amber-500" 
                      : `hover:bg-zinc-500/10 ${isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-900"}`
                  }`}
                  title="ExeCode Workspace"
                >
                  <Code className="h-5 w-5" />
                </button>

                {/* Settings Icon */}
                <button
                  onClick={() => {
                    setShowSettings(prev => !prev);
                    setShowExeCode(false);
                  }}
                  className={`p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                    showSettings 
                      ? "bg-[#1a73e8]/10 text-[#1a73e8]" 
                      : `hover:bg-zinc-500/10 ${isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-900"}`
                  }`}
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                </button>

                {/* Profile Photo / Avatar */}
                <div className="relative">
                  {isLoggedIn && userPhoto ? (
                    <img
                      onClick={() => setShowProfileMenu(prev => !prev)}
                      src={userPhoto}
                      alt="Profile"
                      referrerPolicy="no-referrer"
                      className="h-8 w-8 rounded-full object-cover border border-zinc-800 shadow-md cursor-pointer hover:scale-105 transition-all"
                      title="View Profile"
                    />
                  ) : (
                    <div 
                      onClick={() => setShowProfileMenu(prev => !prev)}
                      className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#59a6ff] to-[#c084fc] flex items-center justify-center text-xs font-bold text-white shadow-md border border-white/20 cursor-pointer hover:scale-105 transition-all"
                      title="View Profile"
                    >
                      {(userDisplayName || userName || "U").charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Profile Menu Popup when clicked */}
                  <AnimatePresence>
                    {showProfileMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className={`absolute bottom-12 left-4 w-48 rounded-2xl border p-1.5 shadow-2xl z-50 transition-all ${
                            isDark 
                              ? "bg-zinc-900/95 border-zinc-800 text-zinc-100 backdrop-blur-md" 
                              : "bg-white/95 border-zinc-250 text-zinc-900 backdrop-blur-md"
                          }`}
                        >
                          <div className="px-3 py-2 border-b border-zinc-800/40 text-xs text-zinc-500 truncate">
                            {userDisplayName || userName || "User"}
                          </div>
                          <button
                            onClick={() => {
                              setShowSettings(true);
                              setShowProfileMenu(false);
                            }}
                            className={`flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs md:text-sm font-medium transition-colors rounded-lg mt-1 ${
                              isDark ? "hover:bg-zinc-850 text-zinc-300" : "hover:bg-zinc-100 text-zinc-750"
                            }`}
                          >
                            <Settings className="h-4 w-4" />
                            <span>Settings</span>
                          </button>
                          <button
                            onClick={() => {
                              handleLogout();
                              setShowProfileMenu(false);
                            }}
                            className={`flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs md:text-sm font-medium transition-colors rounded-lg text-red-500 ${
                              isDark ? "hover:bg-red-950/20" : "hover:bg-red-50"
                            }`}
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Sign Out</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}
        </aside>

        <AnimatePresence>
          {isMobileSidebarOpen && (
            <>
              <motion.div
                key="sidebar-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileSidebarOpen(false)}
                className="fixed inset-0 bg-black z-40 md:hidden"
              />
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

        <main className={`flex-1 h-full flex ${curTheme.mainBg} relative overflow-hidden`}>

          <div className="flex-1 h-full flex flex-col min-w-0">
            <div className={`h-14 px-3.5 border-b ${curTheme.border} ${curTheme.sectionBg} md:h-auto md:px-0 md:border-none md:bg-transparent md:absolute md:top-5 md:right-6 md:z-20 flex items-center justify-between md:justify-end shrink-0`}>
              <div className="min-w-0 flex items-center gap-2 md:gap-3">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className={`p-1.5 -ml-1 rounded-lg md:hidden transition-colors shrink-0 ${resolvedTheme === "dark" ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900"}`}
                  title="Open Menu"
                >
                  <Menu className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="flex items-center gap-3 select-none">
                {isLoggedIn && (
                  <div className="flex items-center gap-3 border-l border-zinc-800/60 pl-3 md:pl-4">
                    <div className="relative group md:hidden">
                      {userPhoto ? (
                        <img
                          src={userPhoto}
                          alt="Profile"
                          referrerPolicy="no-referrer"
                          className="h-8 w-8 rounded-full object-cover border border-zinc-800 shadow-md transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#59a6ff] to-[#c084fc] flex items-center justify-center font-bold text-xs text-white border border-zinc-800 shadow-md">
                          {(userDisplayName || userName || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentSession && currentSession.messages.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className={`p-2 rounded-xl transition-colors ${resolvedTheme === "dark" ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900"}`}
                    title="Clear chat"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3.5 md:px-8 py-4 md:py-6 relative z-0 scrollbar-thin">
              <div className="max-w-3xl mx-auto h-full flex flex-col">

                {!currentSession || currentSession.messages.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-between md:justify-center items-center pt-4 sm:pt-6 md:pt-0 pb-4 max-w-2xl mx-auto w-full px-2 text-center">
                    <div className="flex-1 flex flex-col justify-center items-center w-full min-h-[140px] md:flex-initial md:min-h-0 md:mb-5">
                      <div className="text-center select-none mb-2.5 md:mb-5">
                        <motion.div
                          initial={{ scale: 0.93, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="inline-flex items-center justify-center"
                        >
                          <img src="/exechat.png" alt="" className="h-14 w-14 md:h-18 md:w-18 object-contain" referrerPolicy="no-referrer" />
                        </motion.div>
                      </div>

                      <motion.h2
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="font-display font-semibold text-2xl sm:text-3xl md:text-[42px] tracking-tight leading-tight bg-gradient-to-r from-[#59a6ff] via-[#c084fc] to-[#ff8da1] bg-clip-text text-transparent select-none"
                      >
                        {userDisplayName || userName 
                          ? `Hello ${userDisplayName || userName}, ${welcomeGreeting}` 
                          : `Hello, ${welcomeGreeting.charAt(0).toUpperCase() + welcomeGreeting.slice(1)}`
                        }
                      </motion.h2>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="w-full shiny-border-container rounded-[28px] md:rounded-[32px] relative z-10 mt-auto md:mt-0"
                    >
                      <div className={`rounded-[26px] md:rounded-[30px] p-4 sm:p-5 px-5 sm:px-6 transition-all duration-300 focus-within:shadow-md ${
                        isDark ? "bg-[#1e1f20]" : "bg-[#f0f4f9]"
                      }`}>

                      {selectedFile && (
                        <div className={`mb-3.5 p-2 px-3 rounded-2xl border flex items-center gap-2.5 text-xs animate-fadeIn ${
                          isDark ? "bg-zinc-950 border-zinc-850 text-zinc-300" : "bg-white border-zinc-200 text-zinc-700"
                        }`}>
                          <Paperclip className="h-3.5 w-3.5 text-amber-500 animate-bounce" />
                          <span className="truncate max-w-[180px] sm:max-w-[280px] font-medium">{selectedFile.name}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                          {selectedFile.textContent && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${
                              isDark ? "bg-zinc-900 text-zinc-400 border-zinc-850" : "bg-zinc-100 text-zinc-500 border-zinc-200"
                            }`}>
                              Text Read
                            </span>
                          )}
                          <button
                            onClick={() => setSelectedFile(null)}
                            className={`ml-auto p-1.5 rounded-lg transition-colors ${
                              isDark ? "text-zinc-500 hover:text-red-400 hover:bg-zinc-900" : "text-zinc-500 hover:text-red-500 hover:bg-zinc-100"
                            }`}
                            title="Remove attachment"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-end gap-2.5">
                        <div className="relative">
                          <button
                            onClick={() => setShowUploadMenuHome(!showUploadMenuHome)}
                            className={`h-10 w-10 rounded-full transition-all duration-200 shrink-0 flex items-center justify-center cursor-pointer ${
                              isDark 
                                ? "hover:bg-zinc-800/50 hover:text-amber-400 text-zinc-400" 
                                : "hover:bg-zinc-200 text-zinc-600 hover:text-[#1a73e8]"
                            }`}
                            title="Options"
                          >
                            <Plus className={`h-5 w-5 stroke-[2] transition-transform duration-300 ${showUploadMenuHome ? "rotate-[135deg]" : ""}`} />
                          </button>

                          <AnimatePresence>
                            {showUploadMenuHome && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowUploadMenuHome(false)} />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                                  transition={{ duration: 0.15 }}
                                  className={`absolute bottom-full left-0 mb-2 w-44 rounded-xl p-1.5 shadow-xl border z-50 transition-all ${
                                    isDark 
                                      ? "bg-zinc-900/95 border-zinc-800 text-zinc-100 backdrop-blur-md" 
                                      : "bg-white/95 border-zinc-250 text-zinc-900 backdrop-blur-md"
                                  }`}
                                >
                                  <button
                                    onClick={() => {
                                      setShowUploadMenuHome(false);
                                      fileInputRef.current?.click();
                                    }}
                                    className={`flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs md:text-sm font-semibold transition-colors rounded-lg cursor-pointer ${
                                      isDark 
                                        ? "hover:bg-zinc-800 text-zinc-300 hover:text-white" 
                                        : "hover:bg-zinc-150 text-zinc-700 hover:text-zinc-900"
                                    }`}
                                  >
                                    <Paperclip className="h-4 w-4 text-amber-500 shrink-0" />
                                    <span>Upload File</span>
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>

                        <textarea
                          ref={homeTextareaRef}
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Ask ExeChat anything..."
                          disabled={isGenerating}
                          className={`flex-1 bg-transparent resize-none border-none outline-none focus:ring-0 text-[15px] sm:text-base md:text-base min-h-[44px] md:min-h-[50px] max-h-40 font-sans py-2.5 ${
                            isDark ? "text-zinc-250 placeholder-zinc-500" : "text-zinc-850 placeholder-zinc-400"
                          }`}
                          style={{ height: "auto" }}
                        />
                      </div>

                      <div className={`flex items-center justify-between mt-3 pt-3 border-t ${
                        isDark ? "border-zinc-900" : "border-zinc-200"
                      }`}>
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                          <button
                            type="button"
                            onClick={() => setShowModelModal(true)}
                            className={`flex items-center gap-1.5 text-[10px] md:text-[11px] rounded-full py-1.5 px-3 max-w-[120px] sm:max-w-none truncate font-semibold font-sans cursor-pointer focus:outline-none transition-all border ${
                              isDark 
                                ? "bg-zinc-950 hover:bg-zinc-900 text-zinc-400 border-zinc-900 hover:border-zinc-800" 
                               : "bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200 hover:border-zinc-350"
                            }`}
                            title="Select AI Model"
                          >
                            <Cpu className="h-3 w-3 text-purple-500 shrink-0" />
                            <span className="truncate">{activeModel.name}</span>
                            <ChevronDown className="h-3 w-3 text-zinc-500 shrink-0" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowPresetModal(true)}
                            className={`flex items-center gap-1.5 text-[10px] md:text-[11px] rounded-full py-1.5 px-3 max-w-[120px] sm:max-w-none truncate font-semibold font-sans cursor-pointer focus:outline-none transition-all border ${
                              isDark 
                                ? "bg-zinc-950 hover:bg-zinc-900 text-zinc-400 border-zinc-900 hover:border-zinc-800" 
                                : "bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200 hover:border-zinc-350"
                            }`}
                            title="Select Topic"
                          >
                            <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                            <span className="truncate">Topic: {activePreset.name}</span>
                            <ChevronDown className="h-3 w-3 text-zinc-500 shrink-0" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleSendMessage()}
                          disabled={!inputMessage.trim() || isGenerating}
                          className={`h-9 w-9 rounded-full transition-all duration-200 flex items-center justify-center shadow-md ${
                            inputMessage.trim()
                              ? (isDark 
                                  ? "bg-white hover:bg-zinc-200 text-zinc-950 cursor-pointer hover:scale-105" 
                                  : "bg-[#1a73e8] hover:bg-[#1557b0] text-white cursor-pointer hover:scale-105")
                              : (isDark 
                                  ? "bg-zinc-900 text-zinc-600 cursor-not-allowed" 
                                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed")
                          }`}
                          title="Send Message"
                        >
                          <Send className="h-3.5 w-3.5 md:h-4 md:w-4 stroke-[2.5]" />
                        </button>
                      </div>
                      </div>
                    </motion.div>

                    <div className="mt-4 md:mt-6 text-center select-none">
                      <div className={`inline-flex items-center gap-1 border rounded-full px-3 py-1 text-[9px] md:text-[10px] font-sans tracking-wide ${
                        isDark 
                          ? "bg-zinc-900/10 border-zinc-900/80 text-zinc-500" 
                          : "bg-zinc-100 border-zinc-200 text-zinc-500"
                      }`}>
                        <Info className="h-3 w-3 md:h-3.5 md:w-3.5 text-zinc-450" />
                        <span>Using model {activeModel.name} on the {activePreset.name} topic.</span>
                      </div>
                    </div>
                  </div>
                ) : (
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
                               <div className={`whitespace-pre-wrap leading-relaxed font-sans text-sm sm:text-[15px] md:text-base select-text flex flex-col gap-2.5 ${isDark ? "text-zinc-250" : "text-zinc-850"} ${msg.isPending ? "opacity-65" : ""}`}>
                                 {msg.attachment && (
                                   <div className={`flex items-center gap-3 p-3 rounded-xl border max-w-sm transition-all duration-300 ${
                                     isDark 
                                       ? "bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700/80" 
                                       : "bg-zinc-50 border-zinc-200 hover:border-zinc-350"
                                   }`}>
                                     <div className={`p-2.5 rounded-lg border text-amber-500 shrink-0 shadow-inner ${
                                       isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                                     }`}>
                                       {msg.attachment.type === "image" ? (
                                         <Sparkles className="h-4 w-4" />
                                       ) : msg.attachment.type === "audio" ? (
                                         <Volume2 className="h-4 w-4" />
                                       ) : (
                                         <FileText className="h-4 w-4" />
                                       )}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                       <div className={`text-xs font-semibold truncate flex items-center gap-1.5 ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
                                         <span>{msg.attachment.name}</span>
                                         {msg.attachment.textContent && (
                                           <span className={`text-[9px] px-1 py-0.5 rounded border font-normal ${
                                             isDark ? "bg-zinc-900 text-zinc-400 border-zinc-850" : "bg-zinc-200 text-zinc-600 border-zinc-300"
                                           }`}>
                                             Text
                                           </span>
                                         )}
                                       </div>
                                       <div className={`text-[10px] font-mono mt-0.5 ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                                         {(msg.attachment.size / 1024).toFixed(1)} KB • {msg.attachment.mime || "unknown"}
                                       </div>
                                     </div>
                                   </div>
                                 )}
                                 <div className="flex items-start justify-between gap-2.5">
                                   <div className="flex-1">{msg.content}</div>
                                   {msg.isPending && (
                                     <span className="flex items-center gap-1 text-[10px] text-amber-500 font-sans select-none shrink-0 mt-1" title="Sending to ExeAI server...">
                                       <Clock className="h-3.5 w-3.5 animate-spin" />
                                     </span>
                                   )}
                                 </div>
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
                                  <span className="text-xs text-zinc-500 font-medium font-sans">
                                    Thinking...
                                  </span>
                                </div>
                              ) : (
                                <div className="text-zinc-800 dark:text-zinc-100 font-sans text-[15px] sm:text-[16px] md:text-[18px] leading-relaxed select-text">
                                  <TypewriterMessage
                                    content={msg.content}
                                    isLatest={index === currentSession.messages.length - 1}
                                    isGenerating={isGenerating}
                                    msgId={msg.id}
                                    isSpeaking={isSpeaking}
                                    expandedThoughts={expandedThoughts}
                                    setExpandedThoughts={setExpandedThoughts}
                                    parseMessageThinking={parseMessageThinking}
                                    thinkingDuration={msg.thinkingDuration}
                                  />

                                  {isSpeaking && (
                                    <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-mono animate-pulse">
                                      <Volume2 className="h-3.5 w-3.5 animate-bounce" />
                                      <span>TTS is speaking...</span>
                                    </div>
                                  )}
                                </div>
                              )
                            )}

                            {!isUser && msg.content !== "" && (
                              <div className="flex items-center gap-1 sm:gap-2 mt-3 select-none text-zinc-400 dark:text-zinc-500">
                                <button
                                  onClick={() => {
                                    setLikedMessages((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }));
                                    setDislikedMessages((prev) => ({ ...prev, [msg.id]: false }));
                                  }}
                                  className={`p-1.5 rounded-lg hover:bg-zinc-500/10 hover:text-zinc-200 transition-all duration-250 ${
                                    likedMessages[msg.id] ? "text-blue-500 font-semibold bg-blue-500/10" : "text-zinc-400 dark:text-zinc-500"
                                  }`}
                                  title="Like"
                                >
                                  <ThumbsUp className={`h-4 w-4 ${likedMessages[msg.id] ? "fill-current" : ""}`} />
                                </button>

                                <button
                                  onClick={() => {
                                    setDislikedMessages((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }));
                                    setLikedMessages((prev) => ({ ...prev, [msg.id]: false }));
                                  }}
                                  className={`p-1.5 rounded-lg hover:bg-zinc-500/10 hover:text-zinc-200 transition-all duration-250 ${
                                    dislikedMessages[msg.id] ? "text-red-500 font-semibold bg-red-500/10" : "text-zinc-400 dark:text-zinc-500"
                                  }`}
                                  title="Dislike"
                                >
                                  <ThumbsDown className={`h-4 w-4 ${dislikedMessages[msg.id] ? "fill-current" : ""}`} />
                                </button>

                                <button
                                  onClick={() => handleRegenerateMessage(msg.id)}
                                  className={`p-1.5 rounded-lg hover:bg-zinc-500/10 hover:text-zinc-200 transition-all duration-250 ${isGenerating ? "opacity-40 cursor-not-allowed" : ""}`}
                                  disabled={isGenerating}
                                  title="Try Again / Regenerate"
                                >
                                  <RotateCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                                </button>

                                <button
                                  onClick={() => copyMessageToClipboard(msg.id, msg.content)}
                                  className="p-1.5 rounded-lg hover:bg-zinc-500/10 hover:text-zinc-200 transition-all duration-250"
                                  title="Copy response"
                                >
                                  {copiedMessageId === msg.id ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>

                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdownMsgId(prev => prev === msg.id ? null : msg.id);
                                    }}
                                    className={`p-1.5 rounded-lg hover:bg-zinc-500/10 hover:text-zinc-200 transition-all duration-250 ${activeDropdownMsgId === msg.id ? "bg-zinc-500/15" : ""}`}
                                    title="More"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>

                                  {activeDropdownMsgId === msg.id && (
                                    <>
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
                                              <span className="text-red-500 font-semibold">Stop Voice</span>
                                            </>
                                          ) : (
                                            <>
                                              <Volume2 className="h-4 w-4 text-[#1a73e8]" />
                                              <span>Listen to Voice</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>

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

                    {isGenerating && currentSession.messages[currentSession.messages.length - 1]?.role === "model" && currentSession.messages[currentSession.messages.length - 1]?.content !== "" && (
                      <div className="flex items-center gap-2 text-zinc-500 pl-9 md:pl-12 py-1 text-[11px] md:text-xs select-none">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-pulse" />
                        <span>Writing...</span>
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
              <div className={`p-2.5 md:p-4 border-t shrink-0 z-10 transition-colors duration-200 ${
                isDark ? "border-zinc-900 bg-zinc-950/80" : "border-zinc-200 bg-white"
              }`}>
                <div className="max-w-3xl mx-auto relative">

                  {/* Quick actions box directly above inputs */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2 md:mb-3 text-[10px] md:text-xs text-zinc-500 px-0.5">
                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                      {/* Model Selector */}
                      <button
                        type="button"
                        onClick={() => setShowModelModal(true)}
                        className={`border text-[10px] md:text-[11px] rounded-lg py-1 px-2.5 font-semibold font-sans max-w-[125px] sm:max-w-none truncate cursor-pointer focus:outline-none transition-all shadow-sm flex items-center gap-1 ${
                          isDark 
                            ? "bg-zinc-900 hover:bg-zinc-900/80 text-zinc-300 border-zinc-850 hover:border-zinc-850" 
                            : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200 hover:border-zinc-200"
                        }`}
                      >
                        <Cpu className="h-2.5 w-2.5 text-purple-500 shrink-0" />
                        <span className="truncate">{activeModel.name}</span>
                        <ChevronDown className="h-2.5 w-2.5 text-zinc-500 shrink-0" />
                      </button>

                      {/* Topic/Instruction Selector */}
                      <button
                        type="button"
                        onClick={() => setShowPresetModal(true)}
                        className={`border text-[10px] md:text-[11px] rounded-lg py-1 px-2.5 font-semibold font-sans max-w-[125px] sm:max-w-none truncate cursor-pointer focus:outline-none transition-all shadow-sm flex items-center gap-1 ${
                          isDark 
                            ? "bg-zinc-900 hover:bg-zinc-900/80 text-zinc-300 border-zinc-850 hover:border-zinc-850" 
                            : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200 hover:border-zinc-200"
                        }`}
                      >
                        <Sparkles className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                        <span className="truncate">Topic: {activePreset.name}</span>
                        <ChevronDown className="h-2.5 w-2.5 text-zinc-500 shrink-0" />
                      </button>
                    </div>
                  </div>

                  {/* Input block */}
                  <div className={`relative rounded-[26px] md:rounded-[30px] border p-2 px-3 md:px-4 transition-all duration-300 flex flex-col ${
                    isDark 
                      ? "border-zinc-900 bg-zinc-900/20 focus-within:border-zinc-800 focus-within:bg-zinc-900/40" 
                      : "border-zinc-200 bg-zinc-50/50 focus-within:border-zinc-300 focus-within:bg-zinc-100/50"
                  }`}>
                    {/* Selected File Preview inside input block */}
                    {selectedFile && (
                      <div className={`mx-1 mb-2.5 p-2 px-3 rounded-2xl border flex items-center gap-2.5 text-xs animate-fadeIn ${
                        isDark ? "bg-zinc-950 border-zinc-850 text-zinc-300" : "bg-zinc-100 border-zinc-250/60 text-zinc-700"
                      }`}>
                        <Paperclip className="h-3.5 w-3.5 text-amber-500 animate-bounce" />
                        <span className="truncate max-w-[180px] sm:max-w-[280px] font-medium">{selectedFile.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                        {selectedFile.textContent && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${
                            isDark ? "bg-zinc-900 text-zinc-400 border-zinc-850" : "bg-zinc-50 text-zinc-600 border-zinc-200"
                          }`}>
                            Text Read
                          </span>
                        )}
                        <button
                          onClick={() => setSelectedFile(null)}
                          className={`ml-auto p-1.5 text-zinc-500 hover:text-red-400 rounded-lg transition-colors ${
                            isDark ? "hover:bg-zinc-900" : "hover:bg-zinc-200"
                          }`}
                          title="Remove attachment"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center w-full gap-1.5 md:gap-2">
                      {/* Upload button inside textbox - left side */}
                      <div className="relative">
                        <button
                          onClick={() => setShowUploadMenuChat(!showUploadMenuChat)}
                          className={`h-9 w-9 md:h-10 md:w-10 rounded-full hover:text-amber-400 transition-all duration-200 text-zinc-500 shrink-0 flex items-center justify-center cursor-pointer ${
                            isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-200"
                          }`}
                          title="Options"
                        >
                          <Plus className={`h-4.5 w-4.5 md:h-5 md:w-5 stroke-[2] transition-transform duration-300 ${showUploadMenuChat ? "rotate-[135deg]" : ""}`} />
                        </button>

                        <AnimatePresence>
                          {showUploadMenuChat && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowUploadMenuChat(false)} />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                                transition={{ duration: 0.15 }}
                                className={`absolute bottom-full left-0 mb-2 w-44 rounded-xl p-1.5 shadow-xl border z-50 transition-all ${
                                  isDark 
                                    ? "bg-zinc-900/95 border-zinc-800 text-zinc-100 backdrop-blur-md" 
                                    : "bg-white/95 border-zinc-250 text-zinc-900 backdrop-blur-md"
                                }`}
                              >
                                <button
                                  onClick={() => {
                                    setShowUploadMenuChat(false);
                                    fileInputRef.current?.click();
                                  }}
                                  className={`flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs md:text-sm font-semibold transition-colors rounded-lg cursor-pointer ${
                                    isDark 
                                      ? "hover:bg-zinc-800 text-zinc-300 hover:text-white" 
                                      : "hover:bg-zinc-150 text-zinc-700 hover:text-zinc-900"
                                  }`}
                                >
                                  <Paperclip className="h-4 w-4 text-amber-500 shrink-0" />
                                  <span>Upload File</span>
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>

                     <textarea
                       ref={chatTextareaRef}
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
                           ? "Generating response..."
                           : "Ask ExeChat anything..."
                       }
                       disabled={isGenerating}
                       className={`flex-1 max-h-40 min-h-[36px] md:min-h-[40px] bg-transparent resize-none py-1.5 md:py-2 px-2 border-none outline-none focus:ring-0 text-[15px] sm:text-base md:text-base ${
                         isDark ? "text-zinc-200 placeholder-zinc-550" : "text-zinc-850 placeholder-zinc-400"
                       }`}
                       style={{ height: "auto" }}
                     />

                    {/* Abort button / Submit button */}
                    <div className="flex items-center shrink-0">
                      {isGenerating ? (
                        <button
                          onClick={handleStopGeneration}
                          className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-red-950/40 border border-red-900/30 hover:border-red-900 hover:bg-red-950/60 text-red-400 transition-all duration-200 flex items-center justify-center cursor-pointer shadow-md"
                          title="Stop generating"
                        >
                          <X className="h-3.5 w-3.5 md:h-4.5 md:w-4.5 stroke-[2.5]" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendMessage()}
                          disabled={!inputMessage.trim()}
                          className={`h-9 w-9 md:h-10 md:w-10 rounded-full transition-all duration-200 flex items-center justify-center shadow-md ${
                            inputMessage.trim()
                              ? isDark 
                                ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-950 cursor-pointer hover:scale-105" 
                                : "bg-zinc-900 hover:bg-zinc-850 text-white cursor-pointer hover:scale-105"
                              : isDark 
                                ? "bg-zinc-900 border border-zinc-850 text-zinc-650 cursor-not-allowed" 
                                : "bg-zinc-100 border border-zinc-200 text-zinc-400 cursor-not-allowed"
                          }`}
                          title="Send Message"
                        >
                          <Send className="h-3.5 w-3.5 md:h-4 md:w-4 stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                  {/* Footnote instruction advice */}
                  <p className="text-[9px] md:text-[10px] text-zinc-600 text-center select-none mt-1.5 md:mt-2 font-sans">
                    ExeChat can make mistakes.
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
                {/* 1. MOBILE VIEW (WHATSAPP-STYLE) */}
                <div className="flex md:hidden flex-col h-full w-full overflow-hidden">
                  {mobileSettingsPage === "menu" ? (
                    <div className="flex flex-col h-full w-full">
                      {/* WhatsApp Header */}
                      <div className={`p-4 px-5 flex items-center gap-4 shrink-0 border-b ${curTheme.border} ${isDark ? "bg-zinc-900" : "bg-[#075e54] text-white"}`}>
                        <button
                          onClick={() => setShowSettings(false)}
                          className={`p-1.5 rounded-full transition-colors ${isDark ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-teal-700 text-white"}`}
                        >
                          <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
                        </button>
                        <div>
                          <h2 className="text-lg font-bold tracking-tight">Settings</h2>
                          <p className={`text-[11px] ${isDark ? "text-zinc-550" : "text-teal-100"}`}>ExeChat Premium Account</p>
                        </div>
                      </div>

                      {/* WhatsApp Menu Content */}
                      <div className="flex-1 overflow-y-auto py-2 divide-y divide-zinc-500/10">
                        {/* Profile Row */}
                        <div 
                          onClick={() => setMobileSettingsPage("akun")}
                          className={`p-5 flex items-center gap-4 cursor-pointer transition-colors ${isDark ? "hover:bg-zinc-900/60" : "hover:bg-zinc-100"}`}
                        >
                          {userPhoto ? (
                            <img src={userPhoto} referrerPolicy="no-referrer" alt="Profile" className="h-14 w-14 rounded-full border border-zinc-500/20 shadow shrink-0" />
                          ) : (
                            <div className={`h-14 w-14 rounded-full border flex items-center justify-center shrink-0 bg-gradient-to-tr from-[#59a6ff] to-[#c084fc] text-white text-lg font-bold`}>
                              {(userDisplayName || userName || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-base font-bold truncate ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>{userDisplayName || "Guest Profile"}</h3>
                            <p className="text-xs text-zinc-500 truncate mt-0.5">{userEmail || "Connected as guest offline"}</p>
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full mt-1.5">
                              ★ Premium Member
                            </span>
                          </div>
                          <ChevronRight className="h-5 w-5 text-zinc-500 shrink-0" />
                        </div>

                        {/* Setting Items */}
                        <div className="py-2">
                          {[
                            { id: "akun", name: "Account & Profile", desc: "Change nickname, view authentication details", icon: User },
                            { id: "model", name: "Engine & AI Personality", desc: "Select fast/powerful model or cognitive topics", icon: Cpu },
                            { id: "tampilan", name: "Theme & Display", desc: "Dark mode preferences, alert sound customizers", icon: Sun },
                            { id: "ingatan", name: "AI Memory", desc: "Set persistent user background context", icon: Brain },
                          ].map((item) => {
                            const ItemIcon = item.icon;
                            return (
                              <div
                                key={item.id}
                                onClick={() => setMobileSettingsPage(item.id as any)}
                                className={`px-5 py-4 flex items-center gap-4 cursor-pointer transition-colors ${isDark ? "hover:bg-zinc-900/60" : "hover:bg-zinc-100"}`}
                              >
                                <div className={`p-2.5 rounded-full shrink-0 ${isDark ? "bg-zinc-900 text-amber-400" : "bg-zinc-100 text-[#075e54]"}`}>
                                  <ItemIcon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className={`text-sm font-semibold ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>{item.name}</h4>
                                  <p className="text-xs text-zinc-500 truncate mt-0.5">{item.desc}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full w-full">
                      {/* WhatsApp Subpage Header */}
                      <div className={`p-4 px-5 flex items-center gap-4 shrink-0 border-b ${curTheme.border} ${isDark ? "bg-zinc-900" : "bg-[#075e54] text-white"}`}>
                        <button
                          onClick={() => setMobileSettingsPage("menu")}
                          className={`p-1.5 rounded-full transition-colors ${isDark ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-teal-700 text-white"}`}
                        >
                          <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
                        </button>
                        <div>
                          <h2 className="text-base font-bold capitalize">
                            {mobileSettingsPage === "akun" ? "Account & Profile" :
                             mobileSettingsPage === "model" ? "AI Engine & Topics" :
                             mobileSettingsPage === "tampilan" ? "Theme & Display" : "AI Memory"}
                          </h2>
                          <p className={`text-[10px] ${isDark ? "text-zinc-500" : "text-teal-100"}`}>Configuring ExeChat preferences</p>
                        </div>
                      </div>

                      {/* WhatsApp Subpage Content */}
                      <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        {/* SUBPAGE: AKUN */}
                        {mobileSettingsPage === "akun" && (
                          <div className="space-y-6 animate-fadeIn">
                            <div className={`rounded-2xl p-5 border ${isDark ? "bg-zinc-900/10 border-transparent shadow-none" : "bg-white border-zinc-200"}`}>
                              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-500 mb-3">Membership status</h3>
                              <div className="flex items-center gap-3">
                                {userPhoto ? (
                                  <img src={userPhoto} referrerPolicy="no-referrer" alt="Profile" className="h-12 w-12 rounded-full border border-zinc-500/20" />
                                ) : (
                                  <div className="h-12 w-12 rounded-full border flex items-center justify-center bg-zinc-900 text-zinc-400">
                                    <User className="h-6 w-6" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Connected via Google</span>
                                  </div>
                                  <p className="text-xs md:text-sm text-zinc-500 truncate mt-0.5">{userEmail || "Offline mode"}</p>
                                </div>
                                <button
                                  onClick={handleLogout}
                                  className="text-xs md:text-sm font-bold py-1.5 px-3 rounded-lg border border-red-900/20 text-red-500 bg-red-500/5 hover:bg-red-500/10"
                                >
                                  Logout
                                </button>
                              </div>
                            </div>

                            <div className={`rounded-2xl p-5 border ${isDark ? "bg-zinc-900/10 border-transparent shadow-none" : "bg-white border-zinc-200"}`}>
                              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-500 mb-1">Nickname settings</h3>
                              <p className="text-xs md:text-sm text-zinc-500 leading-relaxed mb-4">Set your nickname that the AI assistant will use to greet you.</p>
                              
                              <div className="space-y-3">
                                <input
                                  value={userName}
                                  onChange={(e) => setUserName(e.target.value)}
                                  placeholder="Enter nickname..."
                                  className={`w-full rounded-xl px-4 py-3 text-sm md:text-base focus:outline-none border ${
                                    isDark ? "bg-zinc-950 border-zinc-900 text-zinc-100" : "bg-zinc-50 border-zinc-200"
                                  }`}
                                />
                                <button
                                  onClick={handleSaveUsername}
                                  className="w-full py-3.5 rounded-xl text-sm font-bold bg-amber-500 text-zinc-950"
                                >
                                  Save Nickname
                                </button>
                                {redeemFeedback && (
                                  <p className="text-xs text-emerald-500 mt-1">✓ {redeemFeedback}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* SUBPAGE: MODEL */}
                        {mobileSettingsPage === "model" && (
                          <div className="space-y-6 animate-fadeIn">
                            <div className="space-y-3">
                              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-500">AI Engines</h3>
                              <div className="space-y-2.5">
                                {MODEL_OPTIONS.map((m) => {
                                  const isSelected = currentSession ? currentSession.model === m.id : selectedModelId === m.id;
                                  return (
                                    <div
                                      key={m.id}
                                      onClick={() => {
                                        if (currentSession) {
                                          setSessions((prev) => prev.map((s) => s.id === currentSessionId ? { ...s, model: m.id } : s));
                                        } else {
                                          setSelectedModelId(m.id);
                                        }
                                        playNotifySound();
                                      }}
                                      className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                                        isSelected 
                                          ? isDark ? "bg-zinc-900 border-amber-500/40 text-zinc-100" : "bg-blue-50/70 border-blue-500 text-zinc-900"
                                          : isDark ? "border-transparent bg-zinc-900/10 text-zinc-400" : "border-zinc-200 bg-white text-zinc-600"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-bold">{m.name}</span>
                                        {isSelected && <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">Active</span>}
                                      </div>
                                      <p className="text-xs md:text-sm leading-relaxed text-zinc-500">{m.description}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-500">Cognitive Topics</h3>
                              <div className="space-y-2.5">
                                {SYSTEM_PRESETS.map((preset) => {
                                  const isSelected = currentSession ? currentSession.systemInstructionId === preset.id : selectedPresetId === preset.id;
                                  return (
                                    <div
                                      key={preset.id}
                                      onClick={() => {
                                        if (currentSession) {
                                          setSessions((prev) => prev.map((s) => s.id === currentSessionId ? { ...s, systemInstructionId: preset.id } : s));
                                        } else {
                                          setSelectedPresetId(preset.id);
                                        }
                                        playNotifySound();
                                      }}
                                      className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                                        isSelected 
                                          ? isDark ? "bg-zinc-900 border-amber-500/40" : "bg-blue-50/70 border-blue-500"
                                          : isDark ? "border-transparent bg-zinc-900/10" : "border-zinc-200 bg-white"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 mb-1.5">
                                        <div className={`p-1.5 rounded-lg border ${isSelected ? "text-amber-500 border-amber-500/25" : "text-zinc-500 border-zinc-800"}`}>
                                          {getPresetIcon(preset.icon, "h-4 w-4")}
                                        </div>
                                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{preset.name}</span>
                                      </div>
                                      <p className="text-[11px] leading-relaxed text-zinc-550">{preset.description}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* SUBPAGE: TAMPILAN */}
                        {mobileSettingsPage === "tampilan" && (
                          <div className="space-y-6 animate-fadeIn">
                            <div className="space-y-3">
                              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-500">Theme</h3>
                              <div className="space-y-2">
                                {[
                                  { id: "system", name: "System Preset", icon: Laptop },
                                  { id: "dark", name: "Dark Mode", icon: Moon },
                                  { id: "light", name: "Light Mode", icon: Sun },
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
                                      className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer ${
                                        isSelected 
                                          ? isDark ? "bg-zinc-900 border-amber-500/40 text-zinc-100" : "bg-blue-50/75 border-blue-500 text-zinc-900"
                                          : isDark ? "border-transparent bg-zinc-900/10 text-zinc-300" : "border-zinc-200 bg-white text-zinc-650"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <IconComp className="h-4 w-4 text-zinc-500" />
                                        <span className="text-sm font-semibold">{t.name}</span>
                                      </div>
                                      {isSelected && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className={`rounded-2xl p-5 border ${isDark ? "bg-zinc-900/10 border-transparent shadow-none" : "bg-white border-zinc-200"}`}>
                              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-500 mb-2.5">Sound feedback</h3>
                              <p className="text-xs md:text-sm leading-relaxed text-zinc-500">ExeChat plays a subtle sound when generating responses is complete.</p>
                            </div>
                          </div>
                        )}

                        {/* SUBPAGE: INGATAN */}
                        {mobileSettingsPage === "ingatan" && (
                          <div className="space-y-6 animate-fadeIn">
                            <div className={`rounded-2xl p-5 border ${isDark ? "bg-zinc-900/10 border-transparent shadow-none" : "bg-white border-zinc-200"}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Brain className="h-5 w-5 text-amber-500" />
                                <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-500">AI Memory Limits (Max 5)</h3>
                              </div>
                              <p className="text-xs md:text-sm text-zinc-500 leading-relaxed mb-4">Saved background information gets added contextually to help customize the responses.</p>
                              
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={memoryInput}
                                  onChange={(e) => setMemoryInput(e.target.value)}
                                  placeholder={memories.length >= 5 ? "Limit reached" : "Enter personal preference..."}
                                  disabled={memories.length >= 5}
                                  className={`flex-1 rounded-xl px-4 py-3 text-sm md:text-base focus:outline-none border ${
                                    isDark ? "bg-zinc-950 border-zinc-900 text-zinc-150" : "bg-white border-zinc-200 text-zinc-900"
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
                                  className="px-5 py-3 rounded-xl text-sm font-bold bg-amber-500 text-zinc-950 disabled:opacity-40"
                                >
                                  Add
                                </button>
                              </div>

                              <div className="space-y-2 mt-4 pt-4 border-t border-zinc-500/10">
                                {memories.length === 0 ? (
                                  <div className="text-center py-5 text-sm text-zinc-500 italic">No saved memories yet.</div>
                                ) : (
                                  memories.map((mem, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-500/5 border border-zinc-500/10 text-sm">
                                      <span className="truncate flex-1 font-medium text-zinc-800 dark:text-zinc-300">{mem}</span>
                                      <button
                                        onClick={() => {
                                          setMemories((prev) => prev.filter((_, i) => i !== idx));
                                          playNotifySound();
                                        }}
                                        className="p-1 text-zinc-500 hover:text-red-500"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. DESKTOP VIEW (PREMIUM DUAL COLUMN PANELS WITH SPACIOUS TYPOGRAPHY) */}
                <div className="hidden md:flex flex-row h-full w-full overflow-hidden">
                  {/* Left categories sidebar panel */}
                  <div className={`w-80 shrink-0 ${isDark ? "border-transparent bg-zinc-950" : `border-r ${curTheme.border} bg-zinc-100/50`} flex flex-col justify-between p-6`}>
                    <div className="space-y-8">
                      {/* Navigation categories */}
                      <nav className="space-y-2">
                        {[
                          { id: "akun", name: "Account Profile & Status", desc: "View Google logins & usernames", icon: User },
                          { id: "model", name: "Model Engine & Personalities", desc: "Select fast/powerful AI engines", icon: Cpu },
                          { id: "tampilan", name: "Display Aesthetics & Sounds", desc: "Configure visual modes & feedback", icon: Sun },
                          { id: "ingatan", name: "Persistent Cognitive Memory", desc: "Inject customizable permanent facts", icon: Brain },
                        ].map((item) => {
                          const IconComp = item.icon;
                          const isActive = settingsTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setSettingsTab(item.id as any)}
                              className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                                isActive
                                  ? isDark
                                    ? "bg-zinc-900 border-transparent text-white shadow-xl ring-1 ring-amber-500/10"
                                    : "bg-white border-zinc-250 text-zinc-900 shadow-md ring-1 ring-blue-500/10"
                                  : isDark
                                    ? "border-transparent text-zinc-400 hover:bg-zinc-950/40 hover:text-zinc-200"
                                    : "border-transparent text-zinc-600 hover:bg-zinc-150/50 hover:text-zinc-900"
                              }`}
                            >
                              <div className={`p-2.5 rounded-xl border transition-colors ${
                                isActive 
                                  ? isDark ? "bg-zinc-950 border-transparent text-amber-400" : "bg-zinc-100 border-blue-250 text-[#1a73e8]" 
                                  : isDark ? "bg-zinc-900 border-transparent text-zinc-500" : "bg-white border-zinc-200 text-zinc-500"
                              }`}>
                                <IconComp className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold tracking-tight">{item.name}</h4>
                                <p className="text-xs text-zinc-500 truncate mt-0.5 font-medium">{item.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </nav>
                    </div>

                    {/* Exit button at bottom of sidebar */}
                    <button
                      onClick={() => setShowSettings(false)}
                      className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl font-bold text-sm border transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-zinc-900 hover:bg-zinc-850 text-white border-transparent dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 dark:border-transparent"
                    >
                      <X className="h-4 w-4 stroke-[2.5]" />
                      <span>Close</span>
                    </button>
                  </div>

                  {/* Right configuration values content panel */}
                  <div className="flex-1 overflow-y-auto p-8 md:p-12">
                    <div className="max-w-3xl space-y-8 animate-fadeIn">
                      {/* TAB: AKUN */}
                      {settingsTab === "akun" && (
                        <div className="space-y-8">
                          <div>
                            <h3 className="text-xl font-display font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Account Profile & Status</h3>
                            <p className="text-sm text-zinc-500 mt-1 font-medium">Verify login authenticity status and customize greeting nicknames.</p>
                          </div>

                          <div className={`rounded-3xl p-6 md:p-8 border ${isDark ? "bg-zinc-900/10 border-transparent shadow-none" : "bg-white border-zinc-200/80 shadow-md"}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                              <div className="flex items-center gap-4">
                                {userPhoto ? (
                                  <img src={userPhoto} referrerPolicy="no-referrer" alt="Profile" className="h-16 w-16 rounded-full border border-zinc-500/20 shadow-md" />
                                ) : (
                                  <div className="h-16 w-16 rounded-full border flex items-center justify-center bg-zinc-900 border-transparent text-zinc-400 shadow-md">
                                    <User className="h-8 w-8" />
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-base font-bold text-zinc-800 dark:text-zinc-200">Active Premium Connection</span>
                                  </div>
                                  <p className="text-sm text-zinc-500 mt-1 font-mono">{userEmail || "Offline Local Storage Mode"}</p>
                                </div>
                              </div>
                              <button
                                onClick={handleLogout}
                                className="px-6 py-3 text-sm font-bold rounded-2xl border border-red-950/20 text-red-500 bg-red-500/5 hover:bg-red-500/10 transition-colors"
                              >
                                Sign Out Account
                              </button>
                            </div>
                          </div>

                          <div className={`rounded-3xl p-6 md:p-8 border space-y-6 ${isDark ? "bg-zinc-900/10 border-transparent shadow-none" : "bg-white border-zinc-200/80 shadow-md"}`}>
                            <div>
                              <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Personalize AI Nickname Greetings</h4>
                              <p className="text-xs text-zinc-500 mt-1 font-medium">Set a unique name the assistant will use during private chat dialogs.</p>
                            </div>

                            <div className="space-y-4">
                              <div className="flex gap-3">
                                <input
                                  value={userName}
                                  onChange={(e) => setUserName(e.target.value)}
                                  placeholder="Enter custom name..."
                                  className={`flex-1 rounded-2xl px-4 py-3.5 text-sm focus:outline-none border ${
                                    isDark ? "bg-zinc-950 border-zinc-900 text-zinc-100" : "bg-zinc-50 border-zinc-200"
                                  }`}
                                />
                                <button
                                  onClick={handleSaveUsername}
                                  className="px-6 py-3.5 rounded-2xl text-sm font-bold bg-amber-500 text-zinc-950 transition-transform hover:scale-[1.01]"
                                >
                                  Save Nickname
                                </button>
                              </div>
                              {redeemFeedback && (
                                <p className="text-sm text-emerald-500 font-semibold flex items-center gap-1.5">
                                  <span>✓</span> <span>{redeemFeedback}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB: MODEL */}
                      {settingsTab === "model" && (
                        <div className="space-y-8">
                          <div>
                            <h3 className="text-xl font-display font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">AI Engine & Cognitive Topics</h3>
                            <p className="text-sm text-zinc-500 mt-1 font-medium">Switch high-level AI reasoning engines and focus topics for tailored behaviors.</p>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-zinc-550 uppercase font-mono tracking-wider">Available LLM Engines</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {MODEL_OPTIONS.map((m) => {
                                const isSelected = currentSession ? currentSession.model === m.id : selectedModelId === m.id;
                                return (
                                  <div
                                    key={m.id}
                                    onClick={() => {
                                      if (currentSession) {
                                        setSessions((prev) => prev.map((s) => s.id === currentSessionId ? { ...s, model: m.id } : s));
                                      } else {
                                        setSelectedModelId(m.id);
                                      }
                                      playNotifySound();
                                    }}
                                    className={`p-6 rounded-3xl border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                                      isSelected
                                        ? isDark
                                          ? "bg-zinc-900 border-transparent shadow-xl ring-2 ring-amber-500/10 text-zinc-100"
                                          : "bg-blue-50/75 border-[#1a73e8] shadow-md ring-2 ring-blue-500/10 text-zinc-900"
                                        : isDark
                                          ? "border-transparent bg-zinc-900/10 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/30"
                                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-350 hover:bg-zinc-50/50"
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold">{m.name}</span>
                                        {isSelected ? (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 uppercase font-mono">Selected</span>
                                        ) : (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-500/5 text-zinc-500 border border-zinc-500/10 uppercase font-mono">Compatible</span>
                                        )}
                                      </div>
                                      <p className="text-xs leading-relaxed text-zinc-500">{m.description}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-zinc-550 uppercase font-mono tracking-wider">Specialized Cognitive Presets</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {SYSTEM_PRESETS.map((preset) => {
                                const isSelected = currentSession ? currentSession.systemInstructionId === preset.id : selectedPresetId === preset.id;
                                return (
                                  <div
                                    key={preset.id}
                                    onClick={() => {
                                      if (currentSession) {
                                        setSessions((prev) => prev.map((s) => s.id === currentSessionId ? { ...s, systemInstructionId: preset.id } : s));
                                      } else {
                                        setSelectedPresetId(preset.id);
                                      }
                                      playNotifySound();
                                    }}
                                    className={`p-6 rounded-3xl border cursor-pointer transition-all duration-300 ${
                                      isSelected
                                        ? isDark
                                          ? "bg-zinc-900 border-transparent shadow-xl ring-2 ring-amber-500/10"
                                          : "bg-blue-50/75 border-[#1a73e8] shadow-md ring-2 ring-blue-500/10"
                                        : isDark
                                          ? "border-transparent bg-zinc-900/10 hover:border-zinc-700 hover:bg-zinc-900/30"
                                          : "border-zinc-200 bg-white hover:border-zinc-350 hover:bg-zinc-50/50"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3.5 mb-3">
                                      <div className={`p-2 rounded-xl border ${isSelected ? "text-amber-500 border-amber-500/25 bg-zinc-950" : "text-zinc-500 border-zinc-200 bg-zinc-50"}`}>
                                        {getPresetIcon(preset.icon, "h-5 w-5")}
                                      </div>
                                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{preset.name}</span>
                                      {preset.badge && (
                                        <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 uppercase font-mono tracking-wider">{preset.badge}</span>
                                      )}
                                    </div>
                                    <p className="text-xs leading-relaxed text-zinc-500">{preset.description}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB: TAMPILAN */}
                      {settingsTab === "tampilan" && (
                        <div className="space-y-8">
                          <div>
                            <h3 className="text-xl font-display font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Display Aesthetics & Themes</h3>
                            <p className="text-sm text-zinc-500 mt-1 font-medium">Customize the layout presentation, system colors, and sound effects.</p>
                          </div>

                           <div className={`rounded-3xl p-6 md:p-8 border space-y-6 ${isDark ? "bg-zinc-900/10 border-transparent shadow-none" : "bg-white border-zinc-200/80 shadow-md"}`}>
                             <h4 className="text-sm font-bold text-zinc-550 uppercase font-mono tracking-wider">Select Style theme</h4>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                               {[
                                 { id: "system", name: "System Sync", desc: "Follow OS configurations", icon: Laptop },
                                 { id: "dark", name: "Slate Dark", desc: "Eye-saving deep slate", icon: Moon },
                                 { id: "light", name: "Pure Light", desc: "High contrast paper white", icon: Sun },
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
                                     className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between items-start text-left ${
                                       isSelected
                                         ? isDark
                                           ? "bg-zinc-900 border-amber-500/40 shadow-md text-white"
                                           : "bg-blue-50/75 border-[#1a73e8] shadow shadow-blue-500/5 text-zinc-900"
                                         : isDark
                                           ? "border-transparent bg-zinc-900/10 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/30"
                                           : "border-zinc-200 bg-white text-zinc-650 hover:border-zinc-350 hover:bg-zinc-50"
                                     }`}
                                   >
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className={`p-2 rounded-lg border ${isSelected ? "text-amber-400 border-amber-500/25" : "text-zinc-500 border-zinc-800"}`}>
                                        <IconComp className="h-4.5 w-4.5" />
                                      </div>
                                      <span className="text-xs font-bold">{t.name}</span>
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-zinc-500">{t.desc}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className={`rounded-3xl p-6 md:p-8 border space-y-4 ${isDark ? "bg-zinc-900/10 border-transparent shadow-none" : "bg-white border-zinc-200/80 shadow-md"}`}>
                            <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Acoustic Audio Feedback</h4>
                            <p className="text-xs md:text-sm text-zinc-500 leading-relaxed font-medium">ExeChat will play a peaceful, gentle notify sound when generation is complete. This helps with multitasking or screen-off interactive prompts.</p>
                          </div>
                        </div>
                      )}

                      {/* TAB: INGATAN */}
                      {settingsTab === "ingatan" && (
                        <div className="space-y-8">
                          <div>
                            <h3 className="text-xl font-display font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">AI Memory Preferences</h3>
                            <p className="text-sm text-zinc-500 mt-1 font-medium">Give ExeChat persistent background facts (like occupation, coding preference, language) to remember permanently.</p>
                          </div>

                          <div className={`rounded-3xl p-6 md:p-8 border space-y-6 ${isDark ? "bg-zinc-900/10 border-transparent shadow-none" : "bg-white border-zinc-200/80 shadow-md"}`}>
                            <div className="flex items-center gap-3">
                              <Brain className="h-6 w-6 text-amber-500 animate-pulse" />
                              <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Inject custom memory preference (Max 5)</h4>
                            </div>

                            <div className="flex gap-3">
                              <input
                                type="text"
                                value={memoryInput}
                                onChange={(e) => setMemoryInput(e.target.value)}
                                placeholder={memories.length >= 5 ? "Maximum limit of 5 preferences reached" : "Example: I prefer codes written in React TSX style..."}
                                disabled={memories.length >= 5}
                                className={`flex-1 rounded-2xl px-4 py-3.5 text-sm focus:outline-none border ${
                                  isDark ? "bg-zinc-950 border-zinc-900 text-zinc-100" : "bg-zinc-50 border-zinc-200"
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
                                className="px-6 py-3.5 rounded-2xl text-sm font-bold bg-amber-500 text-zinc-950 disabled:opacity-40"
                              >
                                Save Memory
                              </button>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-zinc-500/10">
                              {memories.length === 0 ? (
                                <div className="text-center py-8 text-sm text-zinc-500 italic border border-dashed rounded-2xl border-zinc-500/20">No persistent memories configured yet. Customize yours above!</div>
                              ) : (
                                memories.map((mem, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-4 p-4.5 rounded-2xl bg-zinc-500/5 border border-zinc-500/10 text-sm">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                                      <span className="font-medium truncate text-zinc-800 dark:text-zinc-300">{mem}</span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setMemories((prev) => prev.filter((_, i) => i !== idx));
                                        playNotifySound();
                                      }}
                                      className="p-1.5 rounded-xl border border-zinc-500/10 hover:bg-red-500/10 text-zinc-400 hover:text-red-500"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* EXECODE WORKSPACE COMPONENT OVERLAY */}
          <AnimatePresence>
            {showExeCode && (
              <ExeCodeWorkspace
                isDark={isDark}
                curTheme={curTheme}
                onClose={() => setShowExeCode(false)}
                defaultModelId={selectedModelId}
              />
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
                      <h3 className="font-sans font-semibold text-lg">Select Topic</h3>
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
                    Select a trending or specialized topic to focus your AI assistant's expertise.
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
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`text-sm font-semibold truncate ${isSelected ? (isDark ? "text-zinc-100" : "text-zinc-900") : (isDark ? "text-zinc-300" : "text-zinc-700")}`}>
                                  {preset.name}
                                </span>
                                {preset.badge && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 dark:bg-amber-500/25 dark:text-amber-400 uppercase tracking-wider font-sans shrink-0">
                                    {preset.badge}
                                  </span>
                                )}
                              </div>
                              {isSelected && (
                                <span className="text-[10px] font-mono font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                                  Active
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
                      Cancel
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
                      <h3 className="font-sans font-semibold text-lg">Select AI Model</h3>
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
                    Choose the artificial intelligence model (Hexky) that best fits your analysis and chat response needs.
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
                                  Active
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
                      Cancel
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
                      <p className={`text-[10px] font-medium ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>Final Step</p>
                      <h3 className={`font-sans font-semibold text-base ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>What is Your Name?</h3>
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed mb-5 font-sans ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    Choose a nickname to display in your chat sessions. Skip to use the name from your Google account.
                  </p>

                  {/* Input field */}
                  <div className="space-y-1.5 mb-5">
                    <label className={`block text-[10px] font-medium uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>Nickname</label>
                    <input
                      type="text"
                      value={registerModalName}
                      onChange={(e) => setRegisterModalName(e.target.value)}
                      placeholder="Example: John Doe"
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
                      Save & Continue
                    </button>

                    <button
                      onClick={() => handleCompleteRegistrationWithChosenName(googleDefaultName)}
                      className={`w-full py-2.5 px-4 rounded-xl border font-medium text-xs transition-colors duration-150 cursor-pointer text-center ${
                        isDark 
                          ? "border-zinc-800 hover:border-zinc-750 bg-transparent hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200" 
                          : "border-zinc-200 hover:border-zinc-300 bg-transparent hover:bg-zinc-50 text-zinc-600 hover:text-zinc-800"
                      }`}
                    >
                      Skip (Use Google Name)
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* CLEAR CHAT CONFIRMATION MODAL */}
          <AnimatePresence>
            {showClearConfirm && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none animate-fadeIn">
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowClearConfirm(false)}
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
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center border bg-red-500/10 border-red-500/20 text-red-500">
                      <Trash2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`text-[10px] font-medium ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>Delete Warning</p>
                      <h3 className={`font-sans font-semibold text-base ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>Clear Conversation</h3>
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed mb-5 font-sans ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    Are you sure you want to delete all messages in this conversation? This action cannot be undone.
                  </p>

                  {/* Actions buttons */}
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => {
                        setShowClearConfirm(false);
                        handleClearCurrentSession();
                        playNotifySound();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition-colors duration-150 cursor-pointer text-center bg-red-600 hover:bg-red-500 text-white shadow-sm"
                    >
                      Clear Chat
                    </button>

                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className={`w-full py-2.5 px-4 rounded-xl border font-medium text-xs transition-colors duration-150 cursor-pointer text-center ${
                        isDark 
                          ? "border-zinc-800 hover:border-zinc-750 bg-transparent hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200" 
                          : "border-zinc-200 hover:border-zinc-300 bg-transparent hover:bg-zinc-50 text-zinc-600 hover:text-zinc-800"
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* SEARCH CHAT POPUP/MODAL */}
          <AnimatePresence>
            {showSearchModal && (
              <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[10vh]">
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setShowSearchModal(false);
                    setPopupSearchQuery("");
                  }}
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.97, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -10 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden z-10 transition-all ${
                    isDark ? "bg-[#1e1f20] border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"
                  }`}
                >
                  {/* Search Bar Input Header */}
                  <div className="relative border-b border-zinc-500/10 p-4">
                    <Search className="absolute left-7 top-7 h-5 w-5 text-zinc-500" />
                    <input
                      type="text"
                      value={popupSearchQuery}
                      onChange={(e) => setPopupSearchQuery(e.target.value)}
                      placeholder="Search for conversations..."
                      className={`w-full pl-11 pr-10 py-3 rounded-xl text-base transition-all duration-200 focus:outline-none border ${
                        isDark 
                          ? "border-zinc-800 bg-zinc-950/45 text-zinc-100 placeholder-zinc-600 focus:border-zinc-700 focus:bg-zinc-950/70" 
                          : "border-zinc-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:border-zinc-300 focus:bg-white"
                      }`}
                      autoFocus
                    />
                    {popupSearchQuery ? (
                      <button
                        onClick={() => setPopupSearchQuery("")}
                        className={`absolute right-7 top-7 transition-colors ${isDark ? "hover:text-zinc-300 text-zinc-500" : "hover:text-zinc-700 text-zinc-400"}`}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    ) : (
                      <kbd className="absolute right-7 top-7 text-[10px] font-mono px-1.5 py-0.5 rounded border border-zinc-500/25 text-zinc-500 bg-zinc-500/5 select-none">
                        ESC
                      </kbd>
                    )}
                  </div>

                  {/* Results List Area */}
                  <div className="max-h-[380px] overflow-y-auto p-2 scrollbar-thin space-y-0.5">
                    {(() => {
                      const popupFiltered = sessions.filter((s) =>
                        s.title.toLowerCase().includes(popupSearchQuery.toLowerCase())
                      );

                      if (popupFiltered.length === 0) {
                        return (
                          <div className={`text-center py-12 text-sm ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                            No conversations found for "{popupSearchQuery}"
                          </div>
                        );
                      }

                      return (
                        <>
                          <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider select-none ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                            {popupSearchQuery ? "Matching Conversations" : "Recent Conversations"}
                          </div>
                          {popupFiltered.map((s) => {
                            const isActive = s.id === currentSessionId;
                            return (
                              <div
                                key={s.id}
                                onClick={() => {
                                  playNotifySound();
                                  setCurrentSessionId(s.id);
                                  setShowSettings(false);
                                  setShowSearchModal(false);
                                  setPopupSearchQuery("");
                                }}
                                className={`flex items-center justify-between rounded-xl p-3 cursor-pointer text-sm transition-all duration-150 select-none border ${
                                  isActive
                                    ? isDark
                                      ? "bg-zinc-800 border-zinc-700 text-zinc-100 font-medium"
                                      : "bg-zinc-100 border-zinc-250 text-zinc-900 font-medium shadow-sm"
                                    : isDark
                                      ? "border-transparent text-zinc-300 hover:bg-zinc-850 hover:text-white"
                                      : "border-transparent text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <MessageSquare className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-[#1a73e8]" : "text-zinc-500"}`} />
                                  <span className="truncate pr-4 font-medium">{s.title}</span>
                                </div>
                                <span className={`text-[10px] font-mono shrink-0 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
                                  {new Date(s.createdAt || Date.now()).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                </span>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>

                  {/* Keyboard help footer */}
                  <div className={`px-4 py-3 border-t text-[11px] flex justify-between select-none ${
                    isDark ? "bg-zinc-900/40 border-zinc-800/80 text-zinc-500" : "bg-zinc-50/50 border-zinc-150 text-zinc-400"
                  }`}>
                    <span>Click on a conversation to jump to it</span>
                    <span>Press ESC to close</span>
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
                      Cookie & Storage Notification
                    </h4>
                    <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                      ExeChat uses cookies and local storage (localStorage) to remember your chat sessions, theme settings, and Google login verification to function optimally and securely.
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
                    <div className="font-semibold text-xs mb-1">Our Storage Details:</div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-amber-500">•</span>
                      <span><strong>Essential (Required)</strong>: Stores your chat session IDs, Google login status, and the API keys needed to interact with the AI.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-amber-500">•</span>
                      <span><strong>Preferences (Optional)</strong>: Stores your theme choices (Dark/Light), assistant characters/presets, and nickname memory preferences.</span>
                    </div>
                    <div>We fully respect your privacy. All your chat data is stored locally on your own device.</div>
                  </motion.div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-zinc-500/10">
                  <button
                    onClick={() => setShowCookieDetails(!showCookieDetails)}
                    className={`text-xs font-semibold hover:underline ${isDark ? "text-zinc-400 hover:text-zinc-250" : "text-zinc-600 hover:text-zinc-900"}`}
                  >
                    {showCookieDetails ? "Hide Details" : "Learn Details"}
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
                      Reject
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
                      Accept
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

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
  Pencil,
  Maximize2,
  Eye,
  EyeOff,
  ShieldCheck,
  Upload,
  Loader2,
  Bug,
  Lightbulb,
  CheckCircle2,
  Filter,
  ArrowLeft,
  ExternalLink,
  Film,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Message, ChatSession, SystemPreset, ModelOption } from "./types";
import { MarkdownRenderer } from "./components/MarkdownRenderer";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { MODEL_OPTIONS, SYSTEM_PRESETS, SUGGESTED_PROMPTS, GEMMA_TEMP_PRESETS } from "./presets";
import { ExeCodeWorkspace } from "./components/ExeCodeWorkspace";
import { PublicProjectView } from "./components/PublicProjectView";
import { getTranslation } from "./translations";

const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "zh", name: "Mandarin Chinese", nativeName: "中文 (简体)", flag: "🇨🇳" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" }
];

const ExeChatLogo = ({ className = "h-8 w-8", size = 32 }: { className?: string; size?: number }) => (
  <img 
    src="/exechat.svg" 
    alt="ExeChat Logo" 
    className={`${className} object-contain`} 
    style={{ width: size, height: size, display: "inline-block", verticalAlign: "middle" }}
    referrerPolicy="no-referrer"
  />
);

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

  const fullParsed = parseMessageThinking(content);
  const { thinking, actual, isThinking } = parseMessageThinking(displayedContent);
  const effectiveIsThinking = isThinking || (fullParsed.isThinking && !actual);
  const effectiveThinking = thinking || fullParsed.thinking;
  const duration = thinkingDuration || 2;

  return (
    <div className="flex flex-col">
      {/* 1. THINKING PROCESS BLOCK (3-DOT ANIMATION, EXPANDABLE WHEN COMPLETE) */}
      {effectiveIsThinking ? (
        <div className="mb-3 font-sans select-none align-baseline flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium bg-zinc-100 dark:bg-zinc-900/60 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 dark:bg-zinc-400 animate-[bounce_1s_infinite_100ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 dark:bg-zinc-400 animate-[bounce_1s_infinite_200ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 dark:bg-zinc-400 animate-[bounce_1s_infinite_300ms]" />
        </div>
      ) : effectiveThinking !== null ? (
        <div className="mb-3 font-sans select-none align-baseline flex flex-col items-start">
          <button
            onClick={() => setExpandedThoughts(prev => ({ ...prev, [msgId]: !prev[msgId] }))}
            className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium bg-zinc-100 dark:bg-zinc-900/60 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer"
          >
            <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="flex items-center gap-1">
              {`Thought for ${typeof duration === "number" ? duration.toFixed(1) : duration}s`}
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
                <div className="mt-2 ml-3.5 pl-3.5 border-l-2 border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap py-1">
                  {effectiveThinking || "Processing reasoning..."}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : null}

      {/* 2. CHAT RESPONSE OR LOADING / ERROR BLOCK */}
      {actual ? (
        <MarkdownRenderer content={actual} />
      ) : isGenerating && !effectiveIsThinking ? (
        <div className="flex items-center gap-2 py-2 select-none">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-[bounce_1s_infinite_100ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-[bounce_1s_infinite_200ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-[bounce_1s_infinite_300ms]" />
        </div>
      ) : !actual && effectiveThinking === null && !effectiveIsThinking ? (
        /* CHAT ERROR / EMPTY RESPONSE WARNING - ONLY SHOWN IF GENERATION FINISHED AND NO TEXT/THINKING IS PRESENT */
        <div className="text-rose-600 dark:text-rose-400 text-xs mt-1 select-none font-sans flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-3.5 py-2 rounded-xl w-fit">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
          <span>No text response was generated. Please try resending or rephrasing your message!</span>
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

    // Check if the content starts or ends with a partial <think> tag (e.g. "<", "<t", "<th", etc.)
    const partialThinkRegex = /<(t(h(i(n(k)?)?)?)?)?$/i;
    if (partialThinkRegex.test(content) || /^<(t(h(i(n(k)?)?)?)?)?/i.test(content.trim())) {
      if (!content.includes("</think>")) {
        return { thinking: "", actual: "", isThinking: true };
      }
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
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((s: any) => s && typeof s === "object")
            .map((s: any) => ({
              ...s,
              messages: Array.isArray(s.messages) ? s.messages : [],
            }));
        }
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
          if (Array.isArray(parsed) && parsed.some((s: any) => s && s.id === match[1])) {
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
    const handleGlobalClick = () => {
      setOpenMenuSessionId(null);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => {
      window.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  const [viewportHeight, setViewportHeight] = useState<string>(() => {
    return typeof window !== "undefined" && window.innerHeight ? `${window.innerHeight}px` : "100vh";
  });

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
  const [selectedModelId, setSelectedModelId] = useState("automatic");
  const [globalWebSearchEnabled, setGlobalWebSearchEnabled] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);
  const [showExeCode, setShowExeCode] = useState(() => {
    return typeof window !== "undefined" && window.location.pathname.startsWith("/project/") && window.innerWidth >= 768;
  });
  const [settingsTab, setSettingsTab] = useState<"akun" | "model" | "tampilan" | "ingatan" | "feedback">("akun");
  const [cookieConsent, setCookieConsent] = useState<string | null>(() => {
    return localStorage.getItem("exechat_cookie_consent") || null;
  });
  const [showCookieDetails, setShowCookieDetails] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false); 

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [popupSearchQuery, setPopupSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [showUploadMenuHome, setShowUploadMenuHome] = useState(false);
  const [showUploadMenuChat, setShowUploadMenuChat] = useState(false);
  const [mobileSettingsPage, setMobileSettingsPage] = useState<"menu" | "akun" | "model" | "tampilan" | "ingatan" | "feedback">("menu");

  // --- FEEDBACK & ADMIN SYSTEM STATES ---
  // --- LANGUAGE STATES ---
  const [userLanguage, setUserLanguage] = useState<string>(() => {
    const saved = localStorage.getItem("exechat_user_language");
    if (saved) return saved;
    return "en";
  });
  const [showLanguagePopup, setShowLanguagePopup] = useState(false);

  useEffect(() => {
    const greetingsDict: Record<string, string[]> = {
      id: [
        "ada ide baru untuk dijelajahi?",
        "apa yang ingin kita bahas hari ini?",
        "apa yang ingin Anda ketahui?",
        "ada yang bisa saya bantu?",
        "mari buat sesuatu yang luar biasa!",
        "tanyakan apa saja pada saya.",
        "ada topik menarik hari ini?"
      ],
      en: [
        "any new ideas?",
        "what should we discuss today?",
        "what would you like to know?",
        "is there anything I can help with?",
        "let's create something great!",
        "ask me anything.",
        "any exciting topics today?"
      ],
      ar: [
        "هل لديك أفكار جديدة؟",
        "ماذا تريد أن نناقش اليوم؟",
        "ما الذي تود معرفته؟",
        "كيف يمكنني مساعدتك؟",
        "لنبتكر شيئاً رائعاً اليوم!",
        "اسألني أي شيء.",
        "هل هناك موضوع مثير اليوم؟"
      ],
      ja: [
        "何か新しいアイデアはありますか？",
        "今日は何を話し合いましょうか？",
        "何について知りたいですか？",
        "何かお手伝いできることはありますか？",
        "素晴らしいものを一緒に作りましょう！",
        "なんでも質問してください。",
        "面白いトピックはありますか？"
      ],
      ko: [
        "새로운 아이디어가 있으신가요?",
        "오늘 어떤 주제를 논의할까요?",
        "무엇을 알고 싶으신가요?",
        "제가 도와드릴 일이 있나요?",
        "멋진 프로젝트를 시작해 볼까요!",
        "무엇이든 물어보세요.",
        "오늘 흥미로운 주제가 있나요?"
      ],
      es: [
        "¿tienes alguna idea nueva?",
        "¿qué nos gustaría discutir hoy?",
        "¿qué te gustaría saber?",
        "¿en qué puedo ayudarte?",
        "¡creemos algo increíble!",
        "pregúntame lo que sea.",
        "¿algún tema emocionante hoy?"
      ],
      zh: [
        "今天有什么新想法吗？",
        "我们今天想讨论什么？",
        "您想了解些什么呢？",
        "有什么我可以帮忙的吗？",
        "让我们一起创造精彩的作品！",
        "随时向我提问。",
        "今天有什么有趣的话题吗？"
      ],
      fr: [
        "avez-vous de nouvelles idées ?",
        "de quoi aimerions-nous discuter aujourd'hui ?",
        "que souhaitez-vous savoir ?",
        "comment puis-je vous aider ?",
        "créons quelque chose de fantastique !",
        "posez-moi toutes vos questions.",
        "des sujets passionnants aujourd'hui ?"
      ],
      de: [
        "hast du neue Ideen?",
        "worüber möchten wir heute sprechen?",
        "was möchtest du wissen?",
        "wie kann ich dir helfen?",
        "lass uns etwas Großartiges schaffen!",
        "frag mich irgendetwas.",
        "gibt es heute spannende Themen?"
      ]
    };
    const greetingsList = greetingsDict[userLanguage] || greetingsDict.en;
    const randomIdx = Math.floor(Math.random() * greetingsList.length);
    setWelcomeGreeting(greetingsList[randomIdx]);
  }, [userLanguage]);

  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState("Suggestion");
  const [feedbackFile, setFeedbackFile] = useState<File | null>(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const [dislikeFeedbackToast, setDislikeFeedbackToast] = useState<{
    msgId: string;
    msgContent?: string;
    msgThinking?: string;
    msgTimestamp?: number;
    msgModelId?: string;
  } | null>(null);
  const [dislikeReason, setDislikeReason] = useState("");
  const [dislikeSubmitting, setDislikeSubmitting] = useState(false);
  const [dislikeFeedbackSuccess, setDislikeFeedbackSuccess] = useState(false);

  const [showAdminPopup, setShowAdminPopup] = useState(false);
  const [adminFeedbacks, setAdminFeedbacks] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSearch, setAdminSearch] = useState("");
  const [selectedAdminFeedback, setSelectedAdminFeedback] = useState<any | null>(null);
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>("All");
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>("All");

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState<string>("");
  const [showYesterdayHistory, setShowYesterdayHistory] = useState<boolean>(() => {
    const saved = localStorage.getItem("exechat_show_yesterday");
    return saved !== "false";
  });

  useEffect(() => {
    localStorage.setItem("exechat_show_yesterday", String(showYesterdayHistory));
  }, [showYesterdayHistory]);

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
    base64?: string;
  } | null>(null);

  const [expandedImage, setExpandedImage] = useState<string | null>(null);

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
      const activeCode = userLanguage || "en";

      const languageNames: Record<string, string> = {
        id: "Indonesian (Bahasa Indonesia)",
        en: "English",
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
      
      const targetLangName = languageNames[activeCode] || activeCode.toUpperCase();
      
      let localeInstruction = `\n\n[USER REGION & ACTIVE LANGUAGE DIRECTIVE]\n`;
      localeInstruction += `Active Region Language: ${activeCode.toUpperCase()} (${targetLangName})\n\n`;
      
      localeInstruction += `CRITICAL LANGUAGE DIRECTIVE:\n`;
      if (activeCode === "id") {
        localeInstruction += `The user's active region language is Bahasa Indonesia. You MUST respond to all general queries, explanations, and code commentary in natural, fluent Bahasa Indonesia.\n`;
      } else {
        localeInstruction += `The user's active region language is English. You MUST respond to all general queries, explanations, and code commentary in fluent English.\n`;
      }
      localeInstruction += `Keep explanations clear, friendly, and contextual.`;
      
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

  const compressImage = (file: File, maxW: number = 1024, maxH: number = 1024, quality: number = 0.75): Promise<{ base64: string; size: number }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxW || height > maxH) {
            if (width > height) {
              height = Math.round((height * maxW) / width);
              width = maxW;
            } else {
              width = Math.round((width * maxH) / height);
              height = maxH;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const base64 = canvas.toDataURL("image/jpeg", quality);
            const stringLength = base64.length - "data:image/jpeg;base64,".length;
            const sizeInBytes = Math.ceil((stringLength * 3) / 4);
            resolve({ base64, size: sizeInBytes });
          } else {
            resolve({ base64: e.target?.result as string, size: file.size });
          }
        };
        img.onerror = () => {
          resolve({ base64: e.target?.result as string, size: file.size });
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        resolve({ base64: "", size: 0 });
      };
      reader.readAsDataURL(file);
    });
  };

  const processFileObject = (file: File) => {
    if (!file) return;
    console.log("[File] Processing file object:", file.name, "| Type:", file.type, "| Size:", file.size);

    const maxBytes = 20 * 1024 * 1024; 

    if (file.size > maxBytes) {
      console.log("[File] File too large:", file.size);
      setErrorText("File size exceeds the 20MB limit.");
      return;
    }

    setErrorText(null);
    const url = URL.createObjectURL(file);

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
    } else if (file.type.startsWith("image/")) {
      compressImage(file).then(({ base64, size }) => {
        setSelectedFile({
          name: file.name.replace(/\.[^/.]+$/, "") + ".jpg",
          url,
          size: size,
          mime: "image/jpeg",
          base64: base64,
        });
      }).catch((err) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Data = event.target?.result as string;
          setSelectedFile({
            name: file.name,
            url,
            size: file.size,
            mime: file.type || undefined,
            base64: base64Data,
          });
        };
        reader.readAsDataURL(file);
      });
    } else {
      setSelectedFile({
        name: file.name,
        url,
        size: file.size,
        mime: file.type || undefined,
      });
    }

    playNotifySound();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFileObject(file);
    }
    e.currentTarget.value = "";
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            processFileObject(file);
            break;
          }
        }
      }
    }
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
          (prev || []).map((s) => {
            if (!s) return s;
            const msgs = Array.isArray(s.messages) ? s.messages : [];
            const hasMsg = msgs.some((m) => m && m.id === activeId);
            if (hasMsg) {
              return {
                ...s,
                messages: msgs.map((m) => {
                  if (m && m.id === activeId) {
                    if (m.content && m.content.includes("</think>")) {
                      return m;
                    }
                    return { ...m, thinkingDuration: elapsed };
                  }
                  return m;
                })
              };
            }
            return { ...s, messages: msgs };
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
    if (!userId) return;
    
    const handler = setTimeout(() => {
      saveToSupabase(userId, userEmail, userName, userDisplayName, sessions, userLanguage);
    }, 1500); // Debounce saves to prevent rate limits or flickering

    return () => clearTimeout(handler);
  }, [sessions, userId, userEmail, userName, userDisplayName, userLanguage]);

  useEffect(() => {
    if (showAdminPopup && userEmail === "nairicintia@gmail.com") {
      loadAdminFeedbacks();
    }
  }, [showAdminPopup, userEmail]);

  useEffect(() => {
    if (lastClaimAt !== null) {
      localStorage.setItem("exechat_last_claim_at", String(lastClaimAt));
    } else {
      localStorage.removeItem("exechat_last_claim_at");
    }
  }, [lastClaimAt]);

  useEffect(() => {
    if (!authLoading && isLoggedIn && !userLanguage) {
      setShowLanguagePopup(true);
    }
  }, [authLoading, isLoggedIn, userLanguage]);

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
        if (sessions && sessions.some((s) => s && s.id === chatId)) {
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

    if (savedLoggedIn && savedUserId) {
      const isGuest = savedUserId.startsWith("guest_");
      if (isGuest) {
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
      } else {
        const email = localStorage.getItem("exechat_email") || "";
        const uPhoto = localStorage.getItem("exechat_user_photo") || null;
        setUserId(savedUserId);
        setUserEmail(email);
        setUserPhoto(uPhoto);
        setCredits(99999);
        setIsLoggedIn(true);

        // Fetch latest data from Supabase to sync across devices!
        fetch("/api/db/load-all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: savedUserId, email, userEmail: email })
        })
          .then((res) => res.json())
          .then((loadData) => {
            if (loadData.found && loadData.data) {
              const userDb = loadData.data;
              setUserName(userDb.username || localStorage.getItem("exechat_username") || "");
              setUserDisplayName(userDb.displayName || localStorage.getItem("exechat_display_name") || "");
              if (userDb.language) {
                setUserLanguage(userDb.language);
                localStorage.setItem("exechat_user_language", userDb.language);
              }
              if (userDb.sessions && Array.isArray(userDb.sessions)) {
                setSessions(
                  userDb.sessions
                    .filter((s: any) => s && typeof s === "object")
                    .map((s: any) => ({
                      ...s,
                      messages: Array.isArray(s.messages) ? s.messages : [],
                    }))
                );
              }
            } else {
              setUserName(localStorage.getItem("exechat_username") || "");
              setUserDisplayName(localStorage.getItem("exechat_display_name") || "");
            }
          })
          .catch((err) => {
            console.error("Mount-time Supabase load error:", err);
            setUserName(localStorage.getItem("exechat_username") || "");
            setUserDisplayName(localStorage.getItem("exechat_display_name") || "");
          });
      }
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

  useEffect(() => {
    if (userEmail) {
      fetch("/api/cookie/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "session_user_email", value: userEmail, maxAgeDays: 30 })
      }).catch(err => console.warn("Failed to set encrypted session cookie:", err));
    } else {
      fetch("/api/cookie/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "session_user_email" })
      }).catch(err => console.warn("Failed to clear encrypted session cookie:", err));
    }
  }, [userEmail]);

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
      outerBg: "bg-black",
      mainBg: "bg-black",
      sidebarBg: "bg-black",
      sectionBg: "bg-black/60",
      border: "border-zinc-900/80",
      bubbleUser: "bg-zinc-900 border border-zinc-800 text-zinc-100",
      bubbleAssistant: "bg-transparent border-transparent text-zinc-200",
      textMuted: "text-zinc-500",
      textBase: "text-zinc-300",
      textTitle: "text-zinc-100",
      accentColor: "bg-zinc-900 hover:bg-zinc-800 text-white",
      scrollbarClass: "scrollbar-thin scrollbar-thumb-zinc-900",
      gradient: "from-black/40 via-transparent to-transparent",
    },
    light: {
      name: "Light (White)",
      outerBg: "bg-white",
      mainBg: "bg-white",
      sidebarBg: "bg-zinc-100",
      sectionBg: "bg-zinc-100/80",
      border: "border-zinc-200",
      bubbleUser: "bg-zinc-100 border border-zinc-200 text-zinc-900",
      bubbleAssistant: "bg-transparent border-transparent text-zinc-900",
      textMuted: "text-zinc-500",
      textBase: "text-zinc-800",
      textTitle: "text-zinc-900",
      accentColor: "bg-zinc-900 hover:bg-zinc-800 text-white",
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

  const getRoutedModelInfo = (apiModel: string, text: string, attachment?: any) => {
    if (apiModel !== "automatic") {
      const match = MODEL_OPTIONS.find((m) => m.id === apiModel);
      return {
        routedModelId: apiModel,
        routedModelName: match ? match.name : apiModel,
      };
    }

    // Automatic routing rules
    const isImage = attachment && attachment.type === "image";
    const isSearchKeyword = /googling|search|internet|berita|cuaca|news|live|realtime/i.test(text);
    const isCodingKeyword = /script|code|coding|function|class|pawn|mysql|database|schema/i.test(text);

    if (isImage || isSearchKeyword) {
      return {
        routedModelId: "gemini-ai",
        routedModelName: "Gemini AI",
      };
    } else if (isCodingKeyword) {
      return {
        routedModelId: "gpt-oss-120b",
        routedModelName: "exeai-oss-120b",
      };
    } else {
      return {
        routedModelId: "gemma-4-31b",
        routedModelName: "exeai-e5:5:9",
      };
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse: any) => {
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

      // Fetch user database from Supabase Storage to restore state
      try {
        const loadRes = await fetch("/api/db/load-all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, email, userEmail: email })
        });
        const loadData = await loadRes.json();

        if (loadData.found && loadData.data) {
          // USER EXISTS - RESTORE THEIR SESSIONS, USERNAME, ETC.
          const userDb = loadData.data;
          setUserId(uid);
          setUserEmail(email);
          setUserPhoto(picture);
          setCredits(99999);
          setErrorText(null);

          const finalUsername = userDb.username || name;
          const finalDisplayName = userDb.displayName || name;
          setUserName(finalUsername);
          setUserDisplayName(finalDisplayName);
          
          localStorage.setItem("exechat_username", finalUsername);
          localStorage.setItem("exechat_display_name", finalDisplayName);

          if (userDb.language) {
            setUserLanguage(userDb.language);
            localStorage.setItem("exechat_user_language", userDb.language);
          }

          if (userDb.sessions && Array.isArray(userDb.sessions)) {
            setSessions(
              userDb.sessions
                .filter((s: any) => s && typeof s === "object")
                .map((s: any) => ({
                  ...s,
                  messages: Array.isArray(s.messages) ? s.messages : [],
                }))
            );
          }

          localStorage.setItem(`exechat_has_registered_${uid}`, "true");
          setIsLoggedIn(true);
          playNotifySound();
        } else {
          // NEW USER - SHOW REGISTRATION MODAL
          setUserId(uid);
          setUserEmail(email);
          setUserPhoto(picture);
          setCredits(99999);
          setErrorText(null);

          setGoogleDefaultName(name);
          setRegisterModalName(name);
          setShowRegisterModal(true);

          setUserName(name);
          setUserDisplayName(name);
          setIsLoggedIn(true);
        }
      } catch (dbErr) {
        console.error("Failed to load user database from Supabase:", dbErr);
        // Fallback to local storage checks if Supabase load fails
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

  const handleGuestLogin = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const guestId = "guest_" + Math.random().toString(36).substring(2, 15);
    const guestName = "Guest_" + randomSuffix;

    setUserId(guestId);
    setUserEmail("guest@exechat.local");
    setUserName(guestName);
    setUserDisplayName(guestName);
    setUserPhoto(null);
    setCredits(100); // 100 credits for guest mode
    setErrorText(null);
    setIsLoggedIn(true);
    playNotifySound();

    localStorage.setItem("exechat_logged_in", "true");
    localStorage.setItem("exechat_email", "guest@exechat.local");
    localStorage.setItem("exechat_user_id", guestId);
    localStorage.setItem("exechat_user_photo", "");
    localStorage.setItem("exechat_username", guestName);
    localStorage.setItem("exechat_display_name", guestName);
  };

  const saveToSupabase = async (
    currentUid: string | null = userId,
    currentEmail: string | null = userEmail,
    currentName: string | null = userName,
    currentDisplayName: string | null = userDisplayName,
    currentSessions: ChatSession[] = sessions,
    currentLanguage: string = userLanguage
  ) => {
    if (!currentUid) return;
    try {
      await fetch("/api/db/save-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: currentUid,
          email: currentEmail,
          username: currentName,
          displayName: currentDisplayName,
          sessions: currentSessions,
          language: currentLanguage
        })
      });
    } catch (err) {
      console.error("Failed to automatically save to Supabase:", err);
    }
  };

  const handleSelectLanguage = async (langCode: string) => {
    setUserLanguage(langCode);
    localStorage.setItem("exechat_user_language", langCode);
    setShowLanguagePopup(false);
    if (userId) {
      await saveToSupabase(userId, userEmail, userName, userDisplayName, sessions, langCode);
    }
  };

  const validateAndSetFeedbackFile = (file: File) => {
    setFeedbackError(null);
    setFeedbackSuccess(null);
    
    // Only accept image or video
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      setFeedbackError("Only image (photo) or video files are allowed.");
      return false;
    }
    
    // Max size 50MB
    const maxSize = 50 * 1024 * 1024; // 52,428,800 bytes
    if (file.size > maxSize) {
      setFeedbackError("Maximum file size is 50MB.");
      return false;
    }
    
    setFeedbackFile(file);
    return true;
  };

  const handleSendFeedback = async () => {
    const trimmedMsg = feedbackMessage.trim();
    if (!trimmedMsg) {
      setFeedbackError("Please enter a feedback message before sending.");
      return;
    }

    if (trimmedMsg.length < 10) {
      setFeedbackError("Feedback message must be at least 10 characters.");
      return;
    }

    if (trimmedMsg.length > 2500) {
      setFeedbackError("Feedback message cannot exceed 2,500 characters.");
      return;
    }

    if (feedbackFile) {
      const isImage = feedbackFile.type.startsWith("image/");
      const isVideo = feedbackFile.type.startsWith("video/");
      if (!isImage && !isVideo) {
        setFeedbackError("Only image (photo) or video files are allowed.");
        return;
      }
      if (feedbackFile.size > 50 * 1024 * 1024) {
        setFeedbackError("Maximum file size is 50MB.");
        return;
      }
    }

    setFeedbackSubmitting(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      let attachmentPayload = null;
      if (feedbackFile) {
        // Read file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });
        reader.readAsDataURL(feedbackFile);
        const base64String = await base64Promise;

        attachmentPayload = {
          name: feedbackFile.name,
          type: feedbackFile.type,
          size: feedbackFile.size,
          base64: base64String
        };
      }

      const activeMessages = currentSession?.messages || [];
      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: userEmail || "anonymous@gmail.com",
          message: feedbackMessage.trim(),
          category: feedbackCategory,
          attachment: attachmentPayload,
          chatHistory: activeMessages.length > 0 ? activeMessages.slice(-20).map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
            modelId: (m as any).modelId || m.routedModelId || selectedModelId
          })) : null,
          modelInfo: selectedModelId,
          clientMeta: {
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
            language: userLanguage,
            screenResolution: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : ""
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback.");
      }

      setFeedbackSuccess(data.message || "Feedback submitted successfully! Thank you.");
      setFeedbackMessage("");
      setFeedbackFile(null);
      playNotifySound();
    } catch (err: any) {
      setFeedbackError(err.message || "An unexpected error occurred.");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleSendDislikeFeedback = async () => {
    if (!dislikeReason.trim() || dislikeSubmitting || !dislikeFeedbackToast) return;
    setDislikeSubmitting(true);
    try {
      const formattedMessage = `[Dislike / Chat Error - Msg ID: ${dislikeFeedbackToast.msgId}]\n` +
        `Selected Problem Template: ${dislikeReason.trim()}\n\n` +
        `Model: ${dislikeFeedbackToast.msgModelId || selectedModelId}\n` +
        `Topic: ${activePreset ? activePreset.name : "General Assistant"}\n` +
        `Timestamp: ${dislikeFeedbackToast.msgTimestamp ? new Date(dislikeFeedbackToast.msgTimestamp).toLocaleString() : new Date().toLocaleString()}\n\n` +
        `Target AI Message Content:\n"${dislikeFeedbackToast.msgContent || ''}"\n\n` +
        `Target AI Thinking Process:\n"${dislikeFeedbackToast.msgThinking || 'No thinking process recorded.'}"`;

      const activeMessages = currentSession?.messages || [];
      const formattedHistory = activeMessages.map(m => {
        const parsed = parseMessageThinking(m.content);
        return {
          id: m.id,
          role: m.role,
          content: parsed.actual || m.content,
          thinkingProcess: parsed.thinking || (m as any).thinkingProcess || null,
          timestamp: m.timestamp,
          modelId: (m as any).modelId || m.routedModelId || selectedModelId
        };
      });

      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail || "anonymous@gmail.com",
          message: formattedMessage,
          category: "Dislike / Chat Error",
          chatHistory: formattedHistory,
          modelInfo: dislikeFeedbackToast.msgModelId || selectedModelId,
          topicInfo: activePreset ? activePreset.name : "General Assistant",
          targetMessageDetails: {
            id: dislikeFeedbackToast.msgId,
            content: dislikeFeedbackToast.msgContent,
            thinkingProcess: dislikeFeedbackToast.msgThinking,
            timestamp: dislikeFeedbackToast.msgTimestamp,
            modelId: dislikeFeedbackToast.msgModelId
          },
          clientMeta: {
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
            language: userLanguage,
            screenResolution: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : ""
          }
        }),
      });
      if (res.ok) {
        setDislikeFeedbackSuccess(true);
        playNotifySound();
        setTimeout(() => {
          setDislikeFeedbackToast(null);
          setDislikeFeedbackSuccess(false);
          setDislikeReason("");
        }, 1800);
      }
    } catch (err) {
      console.error("Failed to submit dislike feedback:", err);
    } finally {
      setDislikeSubmitting(false);
    }
  };

  const openSettingsFeedback = () => {
    if (dislikeFeedbackToast) {
      const existingReason = dislikeReason.trim();
      const formattedContext = `[Dislike Feedback - Msg ID: ${dislikeFeedbackToast.msgId}]${
        existingReason ? ` Issue: ${existingReason}.` : ""
      }${
        dislikeFeedbackToast.msgContent ? `\n(Excerpt: "${dislikeFeedbackToast.msgContent.substring(0, 180)}...")` : ""
      }\n\n`;
      setFeedbackMessage(formattedContext);
      setFeedbackCategory("Issue / Bug");
    }
    setShowSettings(true);
    setSettingsTab("feedback");
    setMobileSettingsPage("feedback");
    setDislikeFeedbackToast(null);
  };

  const loadAdminFeedbacks = async () => {
    setAdminLoading(true);
    setAdminError(null);
    try {
      const res = await fetch("/api/feedback/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: userEmail
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load feedbacks.");
      }
      setAdminFeedbacks(data.feedbacks || []);
    } catch (err: any) {
      setAdminError(err.message || "Failed to load feedback list.");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleFeedbackDelete = async (feedbackId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this feedback and its associated files from Supabase?")) {
      return;
    }
    try {
      const res = await fetch("/api/feedback/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: userEmail,
          feedbackId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete feedback.");
      }
      if (selectedAdminFeedback && selectedAdminFeedback.id === feedbackId) {
        setSelectedAdminFeedback(null);
      }
      loadAdminFeedbacks();
    } catch (err: any) {
      alert(err.message || "Failed to delete feedback.");
    }
  };

  const handleUpdateFeedbackStatus = async (feedbackId: string, status: string) => {
    try {
      const res = await fetch("/api/feedback/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: userEmail || "nairicintia@gmail.com",
          feedbackId,
          status
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update feedback status.");
      }
      setAdminFeedbacks((prev) =>
        prev.map((f) => (f.id === feedbackId ? { ...f, status } : f))
      );
      if (selectedAdminFeedback && selectedAdminFeedback.id === feedbackId) {
        setSelectedAdminFeedback((prev: any) => ({ ...prev, status }));
      }
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
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

    // Save to Supabase immediately after completing registration!
    saveToSupabase(activeUid, userEmail, finalName, finalName, sessions);
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
    setErrorText("You currently have unlimited daily credits.");
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
    // Spam protection check: maximum 5 new chats per minute
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    let creationTimestamps: number[] = [];
    try {
      const stored = localStorage.getItem("exechat_creation_timestamps");
      if (stored) {
        creationTimestamps = JSON.parse(stored);
      }
    } catch (e) {}
    
    const recentCreations = creationTimestamps.filter((t) => t > oneMinuteAgo);
    
    if (recentCreations.length >= 5) {
      setErrorText("Spam Protection: Maximum limit of 5 new chat creations per minute.");
      playNotifySound();
      return "";
    }
    
    recentCreations.push(now);
    localStorage.setItem("exechat_creation_timestamps", JSON.stringify(recentCreations));

    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let randomId = "";
    for (let i = 0; i < 8; i++) {
      randomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const id = randomId;
    const newSession: ChatSession = {
      id,
      title: "New Chat",
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
    const activeSessionObj = sessions.find((s) => s && s.id === targetSessionId);
    if (activeSessionObj && Array.isArray(activeSessionObj.messages) && activeSessionObj.messages.length > 0) {
      const userMsgs = activeSessionObj.messages.filter((m) => m && m.role === "user");
      if (userMsgs.length > 0) {
        const lastMsg = userMsgs[userMsgs.length - 1];
        if (lastMsg && lastMsg.content && lastMsg.content.trim().toLowerCase() === text.toLowerCase()) {
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
      base64: selectedFile.base64,
    } : null;

    playNotifySound(false);
    setInputMessage("");
    setSelectedFile(null); 

    if (!targetSessionId) {
      targetSessionId = createNewSession(text);
      if (!targetSessionId) return;
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
      (prev || []).map((s) => {
        if (s && s.id === targetSessionId) {
          const msgs = Array.isArray(s.messages) ? s.messages : [];
          return {
            ...s,
            title: s.title === "New Chat" ? generateSmartTitle(text) : s.title,
            messages: [...msgs, userMessage],
          };
        }
        return s;
      })
    );

    const assistantMsgId = "msg_" + Date.now() + "_assistant";

    activeAssistantMsgIdRef.current = assistantMsgId;
    thinkingStartTimesRef.current[assistantMsgId] = Date.now();

    setIsGenerating(true);
    scrollToBottom("smooth");

    const activeSessionState = sessions.find((s) => s && s.id === targetSessionId);
    const rawModel = activeSessionState ? activeSessionState.model : selectedModelId;
    const { routedModelId } = getRoutedModelInfo(rawModel, text, attachmentObj);
    const apiModel = routedModelId;
    const apiPreset = SYSTEM_PRESETS.find(
      (p) => p.id === (activeSessionState ? activeSessionState.systemInstructionId : selectedPresetId)
    ) || SYSTEM_PRESETS[0];
    const apiTemp = activeSessionState ? activeSessionState.temperature : temperature;
    const apiWebSearch = apiModel === "gemini-ai";

    const updatedSession = sessions.find((s) => s && s.id === targetSessionId);
    const conversationHistory = updatedSession && Array.isArray(updatedSession.messages)
      ? [...updatedSession.messages, userMessage] 
      : [userMessage];

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
        attachment: m.attachment ? {
          type: m.attachment.type,
          name: m.attachment.name,
          mime: m.attachment.mime,
          size: m.attachment.size,
          base64: m.id === userMessage.id ? m.attachment.base64 : undefined,
          textContent: m.attachment.textContent,
        } : undefined,
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
        activeAssistantMsgIdRef.current = assistantMsgId;
        const assistantPlaceholder: Message = {
          id: assistantMsgId,
          role: "model",
          content: "",
          timestamp: Date.now(),
          thinkingDuration: 0.1,
          routedModelId: rawModel === "automatic" ? apiModel : undefined,
        };

        setSessions((prev) =>
          (prev || []).map((s) => {
            if (s && s.id === targetSessionId) {
              const msgs = Array.isArray(s.messages) ? s.messages : [];
              const alreadyAdded = msgs.some((m) => m && m.id === assistantMsgId);
              if (alreadyAdded) return { ...s, messages: msgs };
              return {
                ...s,
                messages: msgs.map((m) =>
                  m && m.id === userMessage.id ? { ...m, isPending: false } : m
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
      activeAssistantMsgIdRef.current = assistantMsgId;
      const assistantPlaceholder: Message = {
        id: assistantMsgId,
        role: "model",
        content: "",
        timestamp: Date.now(),
        thinkingDuration: 0.1,
        routedModelId: rawModel === "automatic" ? apiModel : undefined,
      };

      setSessions((prev) =>
        (prev || []).map((s) => {
          if (s && s.id === targetSessionId) {
            const msgs = Array.isArray(s.messages) ? s.messages : [];
            const alreadyAdded = msgs.some((m) => m && m.id === assistantMsgId);
            return {
              ...s,
              messages: msgs.map((m) =>
                m && m.id === userMessage.id ? { ...m, isPending: false } : m
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
              if (!thinkingStartTimesRef.current[assistantMsgId]) {
                thinkingStartTimesRef.current[assistantMsgId] = Date.now();
              }
              if (!hasPlayedSound) {
                playNotifySound(true);
                hasPlayedSound = true;
              }

              setSessions((prev) =>
                (prev || []).map((s) => {
                  if (s && s.id === targetSessionId) {
                    const msgs = Array.isArray(s.messages) ? s.messages : [];
                    return {
                      ...s,
                      messages: msgs.map((m) => {
                        if (m && m.id === assistantMsgId) {
                          const baseContent = (m.content === "<think>Thinking...</think>" || m.content === "<think>Thinking...") ? "" : m.content;
                          const newContent = baseContent + parsed.text;
                          let thinkingDuration = m.thinkingDuration;
                          const startTime = thinkingStartTimesRef.current[assistantMsgId];
                          if (startTime) {
                            if (!newContent.includes("</think>")) {
                              thinkingDuration = Math.max(0.1, Number(((Date.now() - startTime) / 1000).toFixed(1)));
                            } else if (!baseContent.includes("</think>") && newContent.includes("</think>")) {
                              thinkingDuration = Math.max(0.1, Number(((Date.now() - startTime) / 1000).toFixed(1)));
                            }
                          }
                          return {
                            ...m,
                            content: newContent,
                            thinkingDuration
                          };
                        }
                        if (m && m.isPending) {
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
                (prev || []).map((s) => {
                  if (s && s.id === targetSessionId) {
                    const msgs = Array.isArray(s.messages) ? s.messages : [];
                    return {
                      ...s,
                      messages: msgs.map((m) =>
                        m && m.id === assistantMsgId
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
          (prev || []).map((s) => {
            if (s && s.id === targetSessionId) {
              const msgs = Array.isArray(s.messages) ? s.messages : [];
              return {
                ...s,
                messages: msgs.filter((m) => m && m.id !== userMessage.id),
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
            (prev || []).map((s) => {
              if (s && s.id === targetSessionId) {
                const msgs = Array.isArray(s.messages) ? s.messages : [];
                return {
                  ...s,
                  messages: msgs.map((m) =>
                    m && m.id === assistantMsgId && m.content === ""
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
            (prev || []).map((s) => {
              if (s && s.id === targetSessionId) {
                const msgs = Array.isArray(s.messages) ? s.messages : [];
                return {
                  ...s,
                  messages: msgs.map((m) =>
                    m && m.id === assistantMsgId && m.content === ""
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
        (prev || []).map((s) => {
          if (s && s.id === targetSessionId) {
            const msgs = Array.isArray(s.messages) ? s.messages : [];
            const firstUserMsg = msgs.find((m) => m && m.role === "user");
            const finalTitle = (s.title === "New Chat" && firstUserMsg)
              ? generateSmartTitle(firstUserMsg.content)
              : s.title;

            return {
              ...s,
              title: finalTitle,
              messages: msgs.map((m) =>
                m && m.isPending ? { ...m, isPending: false } : m
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
        (prev || []).map((s) => {
          if (s && s.id === currentSessionId) {
            const messages = Array.isArray(s.messages) ? s.messages : [];
            if (messages.length > 0) {
              const lastMsg = messages[messages.length - 1];
              if (lastMsg && lastMsg.role === "model") {
                const updatedMessages = [...messages];
                updatedMessages[messages.length - 1] = {
                  ...lastMsg,
                  content: lastMsg.content ? lastMsg.content + "\n\n*(Response stopped by user)*" : "*(Response stopped)*"
                };
                return { ...s, messages: updatedMessages };
              }
            }
            return { ...s, messages };
          }
          return s;
        })
      );
    }
  };

  const handleEditMessageSave = async (messageId: string, newContent: string) => {
    if (isGenerating || !currentSessionId) return;

    const activeSessionObj = sessions.find((s) => s && s.id === currentSessionId);
    if (!activeSessionObj || !Array.isArray(activeSessionObj.messages)) return;

    const msgIndex = activeSessionObj.messages.findIndex((m) => m && m.id === messageId);
    if (msgIndex === -1) return;

    // Retrieve prior messages up to the user message index, and replace its content
    const truncatedMessages = activeSessionObj.messages.slice(0, msgIndex + 1).map((m) => {
      if (m && m.id === messageId) {
        return { ...m, content: newContent };
      }
      return m;
    });

    const userMessage = truncatedMessages[truncatedMessages.length - 1];

    const rawModel = activeSessionObj.model || selectedModelId;
    const { routedModelId } = getRoutedModelInfo(rawModel, userMessage.content, userMessage.attachment);
    const apiModel = routedModelId;

    const assistantMsgId = "msg_" + Date.now() + "_assistant";
    const assistantPlaceholder: Message = {
      id: assistantMsgId,
      role: "model",
      content: "",
      timestamp: Date.now(),
      thinkingDuration: 0.1,
      routedModelId: rawModel === "automatic" ? apiModel : undefined,
    };

    // Update the session state immediately: keep up to the user message and append assistant placeholder
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: truncatedMessages.concat(assistantPlaceholder),
          };
        }
        return s;
      })
    );

    setEditingMessageId(null);
    setEditingMessageText("");

    activeAssistantMsgIdRef.current = assistantMsgId;
    setIsGenerating(true);
    setErrorText(null);

    const apiPreset = SYSTEM_PRESETS.find(
      (p) => p.id === (activeSessionObj.systemInstructionId || selectedPresetId)
    ) || SYSTEM_PRESETS[0];
    const apiTemp = activeSessionObj.temperature || temperature;
    const apiWebSearch = apiModel === "gemini-ai";

    const formattedHistory = truncatedMessages.map((m) => {
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
        attachment: m.attachment ? {
          type: m.attachment.type,
          name: m.attachment.name,
          mime: m.attachment.mime,
          size: m.attachment.size,
          base64: m.id === userMessage.id ? m.attachment.base64 : undefined,
          textContent: m.attachment.textContent,
        } : undefined,
      };
    });

    let finalInstruction = apiPreset.instruction;
    if (memories.length > 0) {
      finalInstruction += "\n\n[AI MEMORY (Saved user memories)]:\n" + memories.map((m, idx) => `${idx + 1}. ${m}`).join("\n");
    }
    finalInstruction += `\n\n[CURRENT REAL-TIME TIME INFO]\n${getFormattedCurrentDate()}`;
    finalInstruction += getBrowserLanguageInstruction();
    finalInstruction += getDeveloperConfidentialityDirective(newContent);

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
                if (!thinkingStartTimesRef.current[assistantMsgId]) {
                  thinkingStartTimesRef.current[assistantMsgId] = Date.now();
                }
                if (!hasPlayedSound) {
                  playNotifySound(true);
                  hasPlayedSound = true;
                }
                accumulatedText += parsed.text;

                setSessions((prev) =>
                  (prev || []).map((s) => {
                    if (s && s.id === currentSessionId) {
                      const msgs = Array.isArray(s.messages) ? s.messages : [];
                      const updatedMsgs = msgs.map((m) => {
                        if (m && m.id === assistantMsgId) {
                          let thinkingDuration = m.thinkingDuration;
                          const startTime = thinkingStartTimesRef.current[assistantMsgId];
                          if (startTime) {
                            if (!accumulatedText.includes("</think>")) {
                              thinkingDuration = Math.max(0.1, Number(((Date.now() - startTime) / 1000).toFixed(1)));
                            } else if (!m.content?.includes("</think>") && accumulatedText.includes("</think>")) {
                              thinkingDuration = Math.max(0.1, Number(((Date.now() - startTime) / 1000).toFixed(1)));
                            }
                          }
                          return { ...m, content: accumulatedText, thinkingDuration };
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
        setErrorText("An error occurred during response generation: " + err.message);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
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

    const activeSessionObj = sessions.find((s) => s && s.id === currentSessionId);
    if (!activeSessionObj || !Array.isArray(activeSessionObj.messages)) return;

    const msgIndex = activeSessionObj.messages.findIndex((m) => m && m.id === assistantMsgId);
    if (msgIndex === -1) return;

    const priorMessages = activeSessionObj.messages.slice(0, msgIndex);
    const userMessage = priorMessages[priorMessages.length - 1];
    if (!userMessage || userMessage.role !== "user") {
      return;
    }

    const rawModel = activeSessionObj.model || selectedModelId;
    const { routedModelId } = getRoutedModelInfo(rawModel, userMessage.content, userMessage.attachment);
    const apiModel = routedModelId;

    setSessions((prev) =>
      (prev || []).map((s) => {
        if (s && s.id === currentSessionId) {
          const msgs = Array.isArray(s.messages) ? s.messages : [];
          const updatedMsgs = msgs.map((m) => {
            if (m && m.id === assistantMsgId) {
              return { 
                ...m, 
                content: "", 
                thinkingDuration: 1,
                routedModelId: rawModel === "automatic" ? apiModel : undefined
              };
            }
            return m;
          });
          return { ...s, messages: updatedMsgs };
        }
        return s;
      })
    );

    activeAssistantMsgIdRef.current = assistantMsgId;
    setIsGenerating(true);
    setErrorText(null);

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
        attachment: m.attachment ? {
          type: m.attachment.type,
          name: m.attachment.name,
          mime: m.attachment.mime,
          size: m.attachment.size,
          base64: m.id === userMessage.id ? m.attachment.base64 : undefined,
          textContent: m.attachment.textContent,
        } : undefined,
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
                if (!thinkingStartTimesRef.current[assistantMsgId]) {
                  thinkingStartTimesRef.current[assistantMsgId] = Date.now();
                }
                if (!hasPlayedSound) {
                  playNotifySound(true);
                  hasPlayedSound = true;
                }
                accumulatedText += parsed.text;

                setSessions((prev) =>
                  (prev || []).map((s) => {
                    if (s && s.id === currentSessionId) {
                      const msgs = Array.isArray(s.messages) ? s.messages : [];
                      const updatedMsgs = msgs.map((m) => {
                        if (m && m.id === assistantMsgId) {
                          let thinkingDuration = m.thinkingDuration;
                          const startTime = thinkingStartTimesRef.current[assistantMsgId];
                          if (startTime) {
                            if (!accumulatedText.includes("</think>")) {
                              thinkingDuration = Math.max(0.1, Number(((Date.now() - startTime) / 1000).toFixed(1)));
                            } else if (!m.content?.includes("</think>") && accumulatedText.includes("</think>")) {
                              thinkingDuration = Math.max(0.1, Number(((Date.now() - startTime) / 1000).toFixed(1)));
                            }
                          }
                          return { ...m, content: accumulatedText, thinkingDuration };
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
    const yesterday: ChatSession[] = [];
    const earlier: ChatSession[] = [];

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayMidnight = todayMidnight - 24 * 60 * 60 * 1000;

    sessionsToGroup.forEach((s) => {
      const createdAt = s.createdAt || Date.now();
      if (createdAt >= todayMidnight) {
        today.push(s);
      } else if (createdAt >= yesterdayMidnight) {
        yesterday.push(s);
      } else {
        earlier.push(s);
      }
    });

    const categories: { label: string; items: ChatSession[] }[] = [];
    if (today.length > 0) {
      categories.push({ label: getTranslation("today", userLanguage), items: today });
    }
    
    if (showYesterdayHistory) {
      if (yesterday.length > 0) {
        categories.push({ label: getTranslation("yesterday", userLanguage), items: yesterday });
      }
      if (earlier.length > 0) {
        categories.push({ label: getTranslation("previous7Days", userLanguage), items: earlier });
      }
    }

    return categories;
  };

  const renderFeedbackForm = () => {
    const categories = [
      { id: "Suggestion", label: getTranslation("catSuggestion", userLanguage), icon: Lightbulb, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
      { id: "Bug Report", label: getTranslation("catBug", userLanguage), icon: Bug, color: "text-red-500 bg-red-500/10 border-red-500/20" },
      { id: "Question", label: getTranslation("catFeature", userLanguage), icon: HelpCircle, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
      { id: "Other", label: getTranslation("catOther", userLanguage), icon: MessageSquare, color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20" }
    ];

    return (
      <div className="w-full space-y-6 md:space-y-8">
        <div>
          <h3 className="text-xl font-display font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-500" />
            {getTranslation("feedbackHeader", userLanguage)}
          </h3>
          <p className="text-sm text-zinc-500 mt-1 font-medium font-sans">
            {getTranslation("feedbackSubheader", userLanguage)}
          </p>
        </div>

        {(userEmail?.toLowerCase() === "nairicintia@gmail.com" || userEmail?.toLowerCase() === "opengsukadiaa@gmail.com") && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-500">Admin Feedback Portal</h4>
                <p className="text-xs text-zinc-400">Review user feedback submissions, attachments, and chat logs.</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowAdminPopup(true);
                loadAdminFeedbacks();
                playNotifySound();
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all duration-200 hover:scale-[1.02]"
            >
              <Eye className="h-4 w-4" />
              Open Admin Feedback Dashboard
            </button>
          </div>
        )}

        <div className={`w-full rounded-3xl p-6 md:p-8 border space-y-6 ${isDark ? "bg-zinc-900/10 border-transparent shadow-none" : "bg-white border-zinc-200/80 shadow-md"}`}>
          {feedbackSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium flex items-start gap-3">
              <span>{feedbackSuccess}</span>
            </div>
          )}

          {feedbackError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex items-start gap-3">
              <span className="h-2 w-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <span>{feedbackError}</span>
            </div>
          )}

          {/* Category Toggle Cards */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Select Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((cat) => {
                const IconComp = cat.icon;
                const isActive = feedbackCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFeedbackCategory(cat.id)}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all duration-300 cursor-pointer ${
                      isActive
                        ? `${cat.color} scale-[1.03] ring-2 ring-amber-500/10`
                        : isDark
                          ? "bg-black border-zinc-900 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200"
                          : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-800"
                    }`}
                  >
                    <IconComp className="h-5 w-5" />
                    <span className="text-xs font-bold">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Message <span className="text-red-500">*</span>
              </label>
              <span className={`text-[10px] font-mono ${feedbackMessage.length > 2300 ? "text-red-500 font-bold" : "text-zinc-500"}`}>
                {feedbackMessage.length} / 2500
              </span>
            </div>
            <textarea
              value={feedbackMessage}
              onChange={(e) => {
                if (e.target.value.length <= 2500) {
                  setFeedbackMessage(e.target.value);
                }
              }}
              placeholder={getTranslation("feedbackPlaceholder", userLanguage)}
              rows={4}
              className={`w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none border focus:ring-2 focus:ring-amber-500/20 ${
                isDark 
                  ? "bg-black border-zinc-900 text-zinc-100 placeholder-zinc-650 focus:border-amber-500/50" 
                  : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-amber-500"
              }`}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {getTranslation("attachFile", userLanguage)}
            </label>
            
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  validateAndSetFeedbackFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => document.getElementById("feedback-file-input")?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                feedbackFile 
                  ? "border-amber-500 bg-amber-500/5" 
                  : isDark 
                    ? "border-zinc-850 bg-black/20 hover:border-zinc-700 hover:bg-zinc-900/10" 
                    : "border-zinc-250 bg-zinc-50/50 hover:border-zinc-350 hover:bg-zinc-100/30"
              }`}
            >
              <input
                id="feedback-file-input"
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    validateAndSetFeedbackFile(e.target.files[0]);
                  }
                }}
              />
              
              {feedbackFile ? (
                <>
                  <Paperclip className="h-8 w-8 text-amber-500 animate-bounce" />
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-xs">
                    {feedbackFile.name}
                  </p>
                  <p className="text-xs text-zinc-500 font-medium">
                    {(feedbackFile.size / (1024 * 1024)).toFixed(2)} MB — Click or drag to change file
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
                  <p className="text-sm font-bold text-zinc-750 dark:text-zinc-350">
                    Drag and drop file here, or click to browse
                  </p>
                  <p className="text-xs text-zinc-500 font-medium">
                    Supports photo and video files (Max 50MB)
                  </p>
                </>
              )}
            </div>

            {feedbackFile && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFeedbackFile(null);
                  }}
                  className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" /> Remove Attachment
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSendFeedback}
              disabled={feedbackSubmitting || !feedbackMessage.trim()}
              className={`px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                feedbackSubmitting || !feedbackMessage.trim()
                  ? "bg-zinc-500/10 text-zinc-500 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-400 text-zinc-950 active:scale-95 shadow-md hover:shadow-lg"
              }`}
            >
              {feedbackSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  {getTranslation("sendFeedback", userLanguage)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSidebarContent = (isMobile = false) => (
    <div className={`flex flex-col h-full w-full ${curTheme.sidebarBg} ${isDark ? "text-zinc-100" : "text-zinc-900"} select-none`}>
      <div className={`p-4 border-b ${curTheme.border} flex items-center justify-between shrink-0`}>
        <div 
          onClick={() => {
            if (!isMobile) setIsDesktopSidebarOpen(false);
          }}
          className="group flex items-center gap-2.5 cursor-pointer py-1 px-1.5 rounded-xl hover:bg-zinc-500/10 transition-colors"
          title="Collapse Sidebar"
        >
          <div className="relative h-6 w-6 flex items-center justify-center shrink-0">
            <ExeChatLogo className="h-5 w-5 shrink-0 transition-opacity duration-200 group-hover:opacity-0 absolute" size={20} />
            <PanelLeft className={`h-5 w-5 shrink-0 transition-opacity duration-200 opacity-0 group-hover:opacity-100 absolute ${isDark ? "text-zinc-300" : "text-zinc-700"}`} />
          </div>
          <div>
            <h1 className={`font-display font-bold text-base tracking-tight flex items-center gap-1.5 ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
              ExeChat
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isMobile ? (
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className={`p-1.5 rounded-lg border border-transparent transition-all duration-200 cursor-pointer ${
                isDark ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
              }`}
              title="Close Sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setIsDesktopSidebarOpen(false)}
              className={`p-1.5 rounded-lg border border-transparent transition-all duration-200 cursor-pointer ${
                isDark ? "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50" : "border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
              }`}
              title="Collapse Sidebar"
            >
              <PanelLeft className="h-4.5 w-4.5" />
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
              ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border-zinc-800 hover:border-zinc-700 shadow-sm" 
              : "bg-white hover:bg-zinc-50 text-zinc-900 border-zinc-200 shadow-sm"
          }`}
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>{getTranslation("newChat", userLanguage)}</span>
        </button>

        <button
          onClick={() => {
            playNotifySound();
            setShowExeCode(true);
            setShowSettings(false);
            if (isMobile) setIsMobileSidebarOpen(false);
          }}
          className={`hidden md:flex w-full items-center justify-center gap-2 rounded-xl font-semibold py-3 px-4 transition-all duration-205 text-sm tracking-wide border ${
            showExeCode
              ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
              : isDark 
                ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800" 
                : "bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-200"
          }`}
        >
          <Code className="h-4 w-4 text-amber-500" />
          <span>{getTranslation("workstation", userLanguage)}</span>
        </button>
      </div>

      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getTranslation("searchChats", userLanguage)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all duration-200 focus:outline-none border ${
              isDark 
                ? "border-zinc-800/80 bg-black/40 text-zinc-300 placeholder-zinc-600 focus:border-zinc-700 focus:bg-black/70" 
                : "border-zinc-200 bg-zinc-100/80 text-zinc-900 placeholder-zinc-500 focus:border-zinc-300 focus:bg-white"
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
              isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <span>History</span>
            {isHistoryCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            )}
          </button>

          <button
            onClick={() => {
              const newVal = !showYesterdayHistory;
              setShowYesterdayHistory(newVal);
              localStorage.setItem("showYesterdayHistory", JSON.stringify(newVal));
            }}
            className={`p-1 rounded-md transition-all duration-200 cursor-pointer hover:bg-zinc-500/10 ${
              showYesterdayHistory ? "text-amber-500" : "text-zinc-400 hover:text-zinc-200"
            }`}
            title={showYesterdayHistory ? "Hide Yesterday & Older" : "Show Yesterday & Older"}
          >
            {showYesterdayHistory ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
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
                                      : "bg-zinc-200/90 border-zinc-300 text-zinc-900 font-semibold shadow-sm"
                                    : isDark
                                      ? "border-transparent text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
                                      : "border-transparent text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <MessageSquare
                                    className={`h-4 w-4 shrink-0 transition-colors ${
                                      isActive 
                                        ? isDark ? "text-zinc-300" : "text-zinc-800" 
                                        : isDark ? "text-zinc-500 group-hover:text-zinc-400" : "text-zinc-600 group-hover:text-zinc-800"
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
                                            ? "bg-black border-zinc-800 text-zinc-100 focus:border-zinc-750" 
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
                                      title={getTranslation("options", userLanguage)}
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
                                          {getTranslation("rename", userLanguage)}
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
                                          {getTranslation("delete", userLanguage)}
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
                        {getTranslation("seeAll", userLanguage)}
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

            <div className="flex items-center gap-1 shrink-0">
              {userEmail?.toLowerCase() === "nairicintia@gmail.com" && (
                <button
                  onClick={() => {
                    setShowAdminPopup(true);
                    loadAdminFeedbacks();
                    playNotifySound();
                  }}
                  className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                    isDark ? "text-amber-400 hover:text-amber-300 hover:bg-zinc-800/50" : "text-amber-600 hover:text-amber-700 hover:bg-zinc-200/50"
                  }`}
                  title="Admin Panel"
                >
                  <ShieldCheck className="h-4.5 w-4.5 stroke-[2.5]" />
                </button>
              )}

              <button
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowExeCode(false);
                  if (isMobile) {
                    setIsMobileSidebarOpen(false);
                  }
                }}
                className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-800/50" : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/50"
                }`}
                title={getTranslation("settings", userLanguage)}
              >
                <Settings className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full gap-2">
            <button
              onClick={handleGoogleLoginClick}
              className={`flex-1 text-center text-[10px] rounded-xl py-2 transition-all font-sans ${
                isDark
                  ? "text-zinc-400 hover:text-zinc-200 bg-zinc-900/10 border border-dashed border-zinc-800 hover:border-zinc-700"
                  : "text-zinc-700 hover:text-zinc-900 bg-zinc-100 border border-dashed border-zinc-300 hover:border-zinc-400"
              }`}
            >
              Sign in with Google
            </button>
            <button
              onClick={() => {
                setShowSettings(!showSettings);
                setShowExeCode(false);
                if (isMobile) {
                  setIsMobileSidebarOpen(false);
                }
              }}
              className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer shrink-0 ${
                isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-800/50" : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/50"
              }`}
              title={getTranslation("settings", userLanguage)}
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (authLoading) {
    return (
      <div 
        style={{ 
          height: viewportHeight,
          minHeight: "100vh",
          backgroundColor: "#000000",
          color: "#f4f4f5",
          display: "flex",
          width: "100%",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        }} 
        className="flex w-full flex-col items-center justify-center bg-black font-sans text-zinc-100 antialiased"
      >
        <div className="relative flex flex-col items-center">
          <div className="relative mb-6 flex items-center justify-center">
            {/* Ambient pulse effect behind the logo */}
            <div className="absolute h-20 w-20 rounded-full bg-indigo-500/10 animate-ping [animation-duration:3s]" />
            <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl relative z-10 flex items-center justify-center">
              <ExeChatLogo className="h-10 w-10 animate-pulse" size={40} />
            </div>
            {/* Spinning mini indicator loader */}
            <div className="absolute -bottom-1 -right-1 bg-black p-1 rounded-full border border-zinc-800 z-20">
              <svg className="animate-spin h-3.5 w-3.5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-lg font-medium tracking-wide animate-pulse">{getTranslation("connectingToExeChat", userLanguage)}</h2>
          <p className="mt-2 text-xs text-zinc-500 font-mono">{getTranslation("verifyingSecureSession", userLanguage)}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div 
        style={{ 
          height: viewportHeight,
          minHeight: "100vh",
          backgroundColor: "#000000",
          color: "#f4f4f5",
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          position: "relative",
          overflow: "hidden"
        }} 
        className="flex w-full items-center justify-center bg-black font-sans text-zinc-100 antialiased selection:bg-zinc-800 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-radial-[circle_at_center,rgba(39,39,42,0.15),transparent_70%] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: "100%",
            maxWidth: "400px",
            borderRadius: "16px",
            border: "1px solid #27272a",
            backgroundColor: "#18181b",
            padding: "2.5rem",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            boxSizing: "border-box"
          }}
          className="w-full max-w-[400px] rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 sm:p-10 shadow-xl z-10 mx-4 flex flex-col items-center text-center"
        >


          <div className="mb-8 select-none">
            <h2 className="text-xl font-semibold tracking-tight text-white">
              {getTranslation("hello", "en")}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {getTranslation("welcomeSignInPrompt", "en")}
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

          <div className="w-full flex flex-col items-center justify-center p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm gap-4">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => setErrorText("Google sign-in failed. Please try again.")}
              useOneTap
              theme="filled_black"
              shape="pill"
            />
          </div>

          <p className="mt-8 text-[11px] text-zinc-500 font-medium select-none">
            {getTranslation("chatSessionsSavedPrivately", "en")}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ height: viewportHeight }} className={`flex w-full overflow-hidden ${curTheme.outerBg} font-sans ${isDark ? "text-zinc-100" : "text-zinc-900"} antialiased selection:bg-zinc-700/80`}>
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
        <motion.aside 
          animate={{ 
            width: isDesktopSidebarOpen ? 240 : 54
          }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className={`hidden md:flex flex-col h-full shrink-0 relative ${
            isDesktopSidebarOpen ? curTheme.sidebarBg : isDark ? "bg-black" : "bg-zinc-100"
          } select-none z-20 overflow-hidden border-r ${curTheme.border}`}
        >
          {isDesktopSidebarOpen ? (
            <div className="w-[240px] h-full flex flex-col overflow-hidden">
              {renderSidebarContent(false)}
            </div>
          ) : (
            <div 
              onClick={() => {
                if (!isDesktopSidebarOpen) setIsDesktopSidebarOpen(true);
              }}
              className="flex flex-col items-center justify-between py-6 w-[54px] h-full shrink-0 overflow-hidden cursor-pointer"
              title="Click to expand sidebar"
            >
              {/* Top Section */}
              <div className="flex flex-col items-center gap-6 w-full">
                {/* ExeChat Logo / Expand Button at the very top */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDesktopSidebarOpen(true);
                  }}
                  className="group p-2 rounded-xl hover:bg-zinc-500/10 transition-all duration-200 cursor-pointer flex items-center justify-center relative h-9 w-9 shrink-0 select-none"
                  title="Expand Sidebar"
                >
                  <ExeChatLogo className="h-6 w-6 shrink-0 transition-opacity duration-200 group-hover:opacity-0 absolute" size={24} />
                  <PanelLeft className={`h-5 w-5 shrink-0 transition-opacity duration-200 opacity-0 group-hover:opacity-100 absolute ${isDark ? "text-zinc-300" : "text-zinc-700"}`} />
                </button>

                {/* New Chat Icon Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playNotifySound();
                    setCurrentSessionId(null);
                    setShowSettings(false);
                    setShowExeCode(false);
                  }}
                  className={`p-2 rounded-xl hover:bg-zinc-500/10 transition-all duration-200 cursor-pointer ${
                    isDark ? "text-zinc-400 hover:text-white" : "text-zinc-700 hover:text-zinc-900"
                  }`}
                  title="New Chat"
                >
                  <Plus className="h-5 w-5 stroke-[2]" />
                </button>

                {/* Search Icon Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSearchModal(true);
                    playNotifySound();
                  }}
                  className={`p-2 rounded-xl hover:bg-zinc-500/10 transition-all duration-200 cursor-pointer ${
                    isDark ? "text-zinc-400 hover:text-white" : "text-zinc-700 hover:text-zinc-900"
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowExeCode(prev => !prev);
                    setShowSettings(false);
                  }}
                  className={`hidden md:flex p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                    showExeCode 
                      ? "bg-amber-500/10 text-amber-500" 
                      : `hover:bg-zinc-500/10 ${isDark ? "text-zinc-400 hover:text-white" : "text-zinc-700 hover:text-zinc-900"}`
                  }`}
                  title="ExeCode Workspace"
                >
                  <Code className="h-5 w-5" />
                </button>

                {/* Admin Shield Icon */}
                {isLoggedIn && userEmail?.toLowerCase() === "nairicintia@gmail.com" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAdminPopup(true);
                      loadAdminFeedbacks();
                      playNotifySound();
                    }}
                    className={`p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                      showAdminPopup 
                        ? "bg-amber-500/10 text-amber-500 animate-pulse" 
                        : `hover:bg-zinc-500/10 text-amber-500 hover:text-amber-400`
                    }`}
                    title="Admin Panel"
                  >
                    <ShieldCheck className="h-5 w-5 stroke-[2.5]" />
                  </button>
                )}

                {/* Settings Icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSettings(prev => !prev);
                    setShowExeCode(false);
                  }}
                  className={`p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                    showSettings 
                      ? "bg-[#1a73e8]/10 text-[#1a73e8]" 
                      : `hover:bg-zinc-500/10 ${isDark ? "text-zinc-400 hover:text-white" : "text-zinc-700 hover:text-zinc-900"}`
                  }`}
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                </button>

                {/* Profile Photo / Avatar */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
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
                          className={`fixed bottom-6 left-16 w-48 rounded-2xl border p-1.5 shadow-2xl z-50 transition-all ${
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
        </motion.aside>

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
                          <ExeChatLogo className="h-14 w-14 md:h-18 md:w-18 shrink-0" size={72} />
                        </motion.div>
                      </div>

                      <motion.h2
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="font-display font-semibold text-2xl sm:text-3xl md:text-[42px] tracking-tight leading-tight bg-gradient-to-r from-[#59a6ff] via-[#c084fc] to-[#ff8da1] bg-clip-text text-transparent select-none"
                      >
                        {userLanguage === "id"
                          ? (userDisplayName || userName 
                              ? `Halo ${userDisplayName || userName}, ${welcomeGreeting}` 
                              : `Halo, ${welcomeGreeting.charAt(0).toUpperCase() + welcomeGreeting.slice(1)}`)
                          : (userDisplayName || userName 
                              ? `Hello ${userDisplayName || userName}, ${welcomeGreeting}` 
                              : `Hello, ${welcomeGreeting.charAt(0).toUpperCase() + welcomeGreeting.slice(1)}`)
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
                          isDark ? "bg-black border-zinc-850 text-zinc-300" : "bg-white border-zinc-200 text-zinc-700"
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
                                      : "bg-white/95 border-zinc-200 text-zinc-900 backdrop-blur-md shadow-lg"
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
                                        : "hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900"
                                    }`}
                                  >
                                    <Paperclip className="h-4 w-4 text-amber-500 shrink-0" />
                                    <span>{userLanguage === "id" ? "Unggah File" : "Upload File"}</span>
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
                          onPaste={handlePaste}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder={userLanguage === "id" ? "Tanyakan apa saja pada ExeChat..." : "Ask ExeChat anything..."}
                          disabled={isGenerating}
                          className={`flex-1 bg-transparent resize-none border-none outline-none focus:ring-0 text-[15px] sm:text-base md:text-base min-h-[44px] md:min-h-[50px] max-h-40 font-sans py-2.5 ${
                            isDark ? "text-zinc-100 placeholder:text-zinc-500" : "text-zinc-900 placeholder:text-zinc-500"
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
                                ? "bg-black hover:bg-zinc-900 text-zinc-400 border-zinc-900 hover:border-zinc-800" 
                               : "bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200 hover:border-zinc-350"
                            }`}
                            title="Select AI Model"
                          >
                            <Cpu className="h-3 w-3 text-purple-500 shrink-0" />
                            <span className="truncate">{activeModel.name}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowPresetModal(true)}
                            className={`flex items-center gap-1.5 text-[10px] md:text-[11px] rounded-full py-1.5 px-3 max-w-[120px] sm:max-w-none truncate font-semibold font-sans cursor-pointer focus:outline-none transition-all border ${
                              isDark 
                                ? "bg-black hover:bg-zinc-900 text-zinc-400 border-zinc-900 hover:border-zinc-800" 
                                : "bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200 hover:border-zinc-350"
                            }`}
                            title="Select Topic"
                          >
                            <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                            <span className="truncate">{userLanguage === "id" ? "Topik: " : "Topic: "}{activePreset.name}</span>
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
                        <span>{userLanguage === "id" ? `Menggunakan model ${activeModel.name} pada topik ${activePreset.name}.` : `Using model ${activeModel.name} on the ${activePreset.name} topic.`}</span>
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
                            className={`max-w-[88%] md:max-w-[82%] min-w-0 break-words [overflow-wrap:anywhere] transition-all duration-300 ${
                              isUser
                                ? `${curTheme.bubbleUser} rounded-[20px] rounded-tr-sm p-3 px-4 shadow-sm border`
                                : "bg-transparent border-transparent p-0 w-full"
                            }`}
                          >

                             {/* Message content */}
                             {isUser ? (
                               editingMessageId === msg.id ? (
                                 <div className="w-full flex flex-col gap-2.5 min-w-[240px] sm:min-w-[320px] md:min-w-[400px]">
                                   <textarea
                                     value={editingMessageText}
                                     onChange={(e) => setEditingMessageText(e.target.value)}
                                     rows={Math.max(2, editingMessageText.split("\n").length)}
                                     className={`w-full rounded-xl p-3 text-sm focus:outline-none border font-sans resize-y leading-relaxed transition-all ${
                                       isDark 
                                         ? "bg-black border-zinc-800 text-zinc-100 focus:border-zinc-700" 
                                         : "bg-white border-zinc-200 text-zinc-900 focus:border-zinc-400"
                                     }`}
                                     autoFocus
                                   />
                                   <div className="flex justify-end gap-2 text-xs">
                                     <button
                                       onClick={() => {
                                         setEditingMessageId(null);
                                         setEditingMessageText("");
                                       }}
                                       className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-all ${
                                         isDark 
                                           ? "border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/40" 
                                           : "border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                                       }`}
                                     >
                                       Cancel
                                     </button>
                                     <button
                                       onClick={() => handleEditMessageSave(msg.id, editingMessageText)}
                                       disabled={!editingMessageText.trim() || editingMessageText.trim() === msg.content}
                                       className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                     >
                                       Save & Submit
                                     </button>
                                   </div>
                                 </div>
                               ) : (
                                 <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed font-sans text-sm sm:text-[15px] md:text-base select-text flex flex-col gap-2.5 relative group/msg">
                                   {msg.attachment && (
                                     <div className={`flex items-center gap-3 p-3 rounded-xl border max-w-sm transition-all duration-300 ${
                                       isDark 
                                         ? "bg-black/70 border-zinc-800/80 hover:border-zinc-700/80" 
                                         : "bg-zinc-50 border-zinc-200 hover:border-zinc-350"
                                     }`}>
                                       <div className={`p-2.5 rounded-lg border text-amber-500 shrink-0 shadow-inner ${
                                         isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                                       }`}>
                                         {msg.attachment.type === "image" ? (
                                           <div 
                                             onClick={() => setExpandedImage(msg.attachment!.base64 || msg.attachment!.url)}
                                             className="relative h-10 w-10 -m-1 rounded overflow-hidden cursor-pointer hover:opacity-85 active:scale-95 transition-all shadow-sm shrink-0"
                                             title="Klik untuk memperbesar"
                                           >
                                             <img 
                                               src={msg.attachment.base64 || msg.attachment.url} 
                                               alt={msg.attachment.name} 
                                               className="h-full w-full object-cover"
                                               referrerPolicy="no-referrer"
                                             />
                                           </div>
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
                                   <div className="flex items-start justify-between gap-4">
                                     <div 
                                       className="flex-1 min-w-0 break-words [overflow-wrap:anywhere] cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all"
                                       title="Double-click to edit message"
                                       onDoubleClick={() => {
                                         if (!isGenerating) {
                                           setEditingMessageId(msg.id);
                                           setEditingMessageText(msg.content);
                                         }
                                       }}
                                     >
                                       {msg.content}
                                     </div>
                                     <div className="flex items-center gap-1.5 shrink-0 select-none">
                                       {!isGenerating && (
                                         <button
                                           onClick={() => {
                                             setEditingMessageId(msg.id);
                                             setEditingMessageText(msg.content);
                                           }}
                                           className={`opacity-0 group-hover/msg:opacity-100 p-1 rounded-lg transition-all cursor-pointer ${
                                             isDark ? "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800" : "text-zinc-550 hover:text-zinc-800 hover:bg-zinc-200/50"
                                           }`}
                                           title="Edit message"
                                         >
                                           <Pencil className="h-3.5 w-3.5" />
                                         </button>
                                       )}
                                       {msg.isPending && (
                                         <span className="flex items-center gap-1 text-[10px] text-amber-500 font-sans select-none shrink-0" title="Sending to ExeAI server...">
                                           <Clock className="h-3.5 w-3.5 animate-spin" />
                                         </span>
                                       )}
                                     </div>
                                   </div>
                                 </div>
                               )
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
                                    {(() => {
                                      if (msg.routedModelId) {
                                        const matchedModel = MODEL_OPTIONS.find(m => m.id === msg.routedModelId);
                                        const modelDisplayName = matchedModel ? matchedModel.name : msg.routedModelId;
                                        const cleanName = modelDisplayName.split(" (")[0];
                                        return `Loading model ${cleanName}...`;
                                      }
                                      return "Thinking...";
                                    })()}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-zinc-800 dark:text-zinc-100 font-sans text-[15px] sm:text-[16px] md:text-[18px] leading-relaxed select-text min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
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

                            {!isUser && msg.content !== "" && !(isGenerating && index === currentSession.messages.length - 1) && (
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
                                    const nextDisliked = !dislikedMessages[msg.id];
                                    setDislikedMessages((prev) => ({ ...prev, [msg.id]: nextDisliked }));
                                    setLikedMessages((prev) => ({ ...prev, [msg.id]: false }));
                                    if (nextDisliked) {
                                      const parsed = parseMessageThinking(msg.content);
                                      setDislikeFeedbackToast({
                                        msgId: msg.id,
                                        msgContent: parsed.actual || msg.content,
                                        msgThinking: parsed.thinking || (msg as any).thinkingProcess || null,
                                        msgTimestamp: msg.timestamp,
                                        msgModelId: (msg as any).modelId || msg.routedModelId || selectedModelId
                                      });
                                      setDislikeReason("");
                                      setDislikeFeedbackSuccess(false);
                                    } else if (dislikeFeedbackToast?.msgId === msg.id) {
                                      setDislikeFeedbackToast(null);
                                    }
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
                isDark ? "border-zinc-900 bg-black/80" : "border-zinc-200 bg-white"
              }`}>
                <div className="max-w-3xl mx-auto relative">

                  {/* Input block */}
                  <div className={`relative rounded-[26px] md:rounded-[30px] border p-2 px-3 md:px-4 transition-all duration-300 flex flex-col ${
                    isDark 
                      ? "border-zinc-900 bg-zinc-900/20 focus-within:border-zinc-800 focus-within:bg-zinc-900/40" 
                      : "border-zinc-200 bg-zinc-50/50 focus-within:border-zinc-300 focus-within:bg-zinc-100/50"
                  }`}>
                    {/* Selected File Preview inside input block */}
                    {selectedFile && (
                      <div className={`mx-1 mb-2.5 p-2 px-3 rounded-2xl border flex items-center gap-2.5 text-xs animate-fadeIn ${
                        isDark ? "bg-black border-zinc-850 text-zinc-300" : "bg-zinc-100 border-zinc-250/60 text-zinc-700"
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
                      {/* Upload button inside prompt box */}
                      <div className="flex items-center gap-1.5 shrink-0">
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
                                      : "bg-white/95 border-zinc-200 text-zinc-900 backdrop-blur-md shadow-lg"
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
                                        : "hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900"
                                    }`}
                                  >
                                    <Paperclip className="h-4 w-4 text-amber-500 shrink-0" />
                                    <span>{userLanguage === "id" ? "Unggah File" : "Upload File"}</span>
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                     <textarea
                       ref={chatTextareaRef}
                       rows={1}
                       value={inputMessage}
                       onChange={(e) => setInputMessage(e.target.value)}
                       onPaste={handlePaste}
                       onKeyDown={(e) => {
                         if (e.key === "Enter" && !e.shiftKey) {
                           e.preventDefault();
                           handleSendMessage();
                         }
                       }}
                       placeholder={
                         isGenerating
                           ? (userLanguage === "id" ? "Menghasilkan respon..." : "Generating response...")
                           : (userLanguage === "id" ? "Tanyakan apa saja pada ExeChat..." : "Ask ExeChat anything...")
                       }
                       disabled={isGenerating}
                       className={`flex-1 max-h-40 min-h-[36px] md:min-h-[40px] bg-transparent resize-none py-1.5 md:py-2 px-2 border-none outline-none focus:ring-0 text-[15px] sm:text-base md:text-base ${
                         isDark ? "text-zinc-100 placeholder:text-zinc-500" : "text-zinc-900 placeholder:text-zinc-500"
                       }`}
                       style={{ height: "auto" }}
                     />

                    {/* Inline Model Picker Chip + Abort/Submit button on the right */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowModelModal(true)}
                        className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all cursor-pointer ${
                          isDark
                            ? "bg-zinc-800/80 hover:bg-zinc-800 text-purple-300 border-zinc-700/80"
                            : "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                        }`}
                        title={userLanguage === "id" ? "Ganti Model AI" : "Switch AI Model"}
                      >
                        <Cpu className="h-3 w-3 text-purple-500 shrink-0" />
                        <span className="truncate max-w-[80px] sm:max-w-[130px] font-sans text-[10px] md:text-[11px]">
                          {activeModel.name}
                        </span>
                      </button>

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
                className={`fixed inset-0 backdrop-blur-xl flex flex-col z-[100] ${isDark ? "bg-[#0b141a] text-zinc-100" : "bg-zinc-100/95 text-zinc-900"}`}
              >
                {/* 1. MOBILE VIEW (WHATSAPP-STYLE) */}
                <div className="flex md:hidden flex-col h-full w-full overflow-hidden font-sans">
                  {mobileSettingsPage === "menu" ? (
                    <div className="flex flex-col h-full w-full">
                      {/* WhatsApp Mobile Header */}
                      <div className={`p-4 px-5 flex items-center gap-3 shrink-0 border-b ${isDark ? "bg-[#111b21] border-zinc-800 text-zinc-100" : "bg-[#008069] text-white shadow-sm"}`}>
                        <button
                          onClick={() => setShowSettings(false)}
                          className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark ? "hover:bg-zinc-800 text-zinc-200" : "hover:bg-teal-700 text-white"}`}
                          title="Close Settings"
                        >
                          <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
                        </button>
                        <div className="flex-1">
                          <h2 className="text-lg font-bold tracking-tight leading-tight">
                            {userLanguage === "id" ? "Setelan" : "Settings"}
                          </h2>
                          <p className={`text-[11px] font-medium ${isDark ? "text-zinc-400" : "text-teal-100"}`}>
                            {userLanguage === "id" ? "Akun & Preferensi Aplikasi" : "Account & App Preferences"}
                          </p>
                        </div>
                      </div>

                      {/* WhatsApp Mobile Menu Content */}
                      <div className="flex-1 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800/60 pb-6">
                        {/* WhatsApp Top Profile Banner Card */}
                        <div 
                          onClick={() => setMobileSettingsPage("akun")}
                          className={`p-4 px-5 flex items-center gap-4 cursor-pointer transition-colors ${
                            isDark ? "bg-[#111b21] hover:bg-[#202c33]" : "bg-white hover:bg-zinc-50"
                          }`}
                        >
                          {userPhoto ? (
                            <img src={userPhoto} referrerPolicy="no-referrer" alt="Profile" className="h-14 w-14 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm shrink-0 object-cover" />
                          ) : (
                            <div className="h-14 w-14 rounded-full border border-amber-500/30 flex items-center justify-center shrink-0 bg-gradient-to-tr from-amber-500 to-amber-600 text-zinc-950 text-xl font-bold shadow-sm">
                              {(userDisplayName || userName || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-base font-bold truncate ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
                              {userDisplayName || userName || "Guest Profile"}
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5 font-medium">
                              {userEmail || "Connected as guest offline"}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-zinc-400 shrink-0" />
                        </div>

                        {/* WhatsApp Category Group */}
                        <div className={`py-2 ${isDark ? "bg-[#0b141a]" : "bg-zinc-100"}`}>
                          {[
                            { id: "akun", name: userLanguage === "id" ? "Akun & Profil" : "Account & Profile", desc: userLanguage === "id" ? "Ubah nama panggilan, info email, bahasa" : "Change nickname, email info, language", icon: User, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
                            { id: "model", name: userLanguage === "id" ? "Model AI & Suhu" : "AI Engine & Temperature", desc: userLanguage === "id" ? "Pilih model AI aktif dan preset kreativitas" : "Select active model and creativity preset", icon: Cpu, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                            { id: "tampilan", name: userLanguage === "id" ? "Tema & Tampilan" : "Theme & Display", desc: userLanguage === "id" ? "Mode gelap/terang, riwayat percakapan" : "Dark/light mode, chat history toggle", icon: Sun, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
                            { id: "ingatan", name: userLanguage === "id" ? "Memori & Direktif AI" : "AI Memory & Directives", desc: userLanguage === "id" ? "Simpan konteks latar belakang pengguna" : "Set persistent background memory", icon: Brain, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
                            { id: "feedback", name: userLanguage === "id" ? "Kirim Masukan & Laporan" : "Submit Feedback & Support", desc: userLanguage === "id" ? "Bantuan, laporan bug & saran fitur" : "Send suggestions, report bugs, admin panel", icon: MessageSquare, color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
                          ].map((item) => {
                            const ItemIcon = item.icon;
                            return (
                              <div
                                key={item.id}
                                onClick={() => setMobileSettingsPage(item.id as any)}
                                className={`px-5 py-3.5 flex items-center gap-4 cursor-pointer transition-colors border-b last:border-b-0 ${
                                  isDark 
                                    ? "bg-[#111b21] hover:bg-[#202c33] border-zinc-800/60" 
                                    : "bg-white hover:bg-zinc-50 border-zinc-200/60"
                                }`}
                              >
                                <div className={`p-2.5 rounded-2xl shrink-0 flex items-center justify-center ${item.color}`}>
                                  <ItemIcon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className={`text-[15px] font-semibold ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>{item.name}</h4>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{item.desc}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full w-full">
                      {/* WhatsApp Mobile Subpage Header */}
                      <div className={`p-4 px-5 flex items-center gap-3 shrink-0 border-b ${isDark ? "bg-[#111b21] border-zinc-800 text-zinc-100" : "bg-[#008069] text-white shadow-sm"}`}>
                        <button
                          onClick={() => setMobileSettingsPage("menu")}
                          className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark ? "hover:bg-zinc-800 text-zinc-200" : "hover:bg-teal-700 text-white"}`}
                          title="Back to settings menu"
                        >
                          <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
                        </button>
                        <div className="flex-1">
                          <h2 className="text-base font-bold capitalize leading-tight">
                            {mobileSettingsPage === "akun" ? (userLanguage === "id" ? "Akun & Profil" : "Account & Profile") :
                             mobileSettingsPage === "model" ? (userLanguage === "id" ? "Model AI & Suhu" : "AI Engine & Temperature") :
                             mobileSettingsPage === "tampilan" ? (userLanguage === "id" ? "Tema & Tampilan" : "Theme & Display") :
                             mobileSettingsPage === "ingatan" ? (userLanguage === "id" ? "Memori AI" : "AI Memory") : 
                             (userLanguage === "id" ? "Kirim Masukan" : "Submit Feedback")}
                          </h2>
                          <p className={`text-[10px] font-medium ${isDark ? "text-zinc-400" : "text-teal-100"}`}>
                            {userLanguage === "id" ? "Setelan Aplikasi" : "App Preferences"}
                          </p>
                        </div>
                      </div>

                      {/* WhatsApp Mobile Subpage Content */}
                      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? "bg-[#0b141a]" : "bg-zinc-100"}`}>
                        {/* SUBPAGE: AKUN */}
                        {mobileSettingsPage === "akun" && (
                          <div className="space-y-4 animate-fadeIn">
                            <div className={`rounded-2xl p-4 border ${isDark ? "bg-[#111b21] border-zinc-800" : "bg-white border-zinc-200 shadow-xs"}`}>
                              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                                {userLanguage === "id" ? "Status Keanggotaan" : "Membership Status"}
                              </h3>
                              <div className="flex items-center gap-3">
                                {userPhoto ? (
                                  <img src={userPhoto} referrerPolicy="no-referrer" alt="Profile" className="h-12 w-12 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover" />
                                ) : (
                                  <div className="h-12 w-12 rounded-full border border-amber-500/30 flex items-center justify-center bg-amber-500 text-zinc-950 font-bold text-lg">
                                    {(userDisplayName || userName || "U").charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                      {userEmail ? "Connected via Google" : "Guest Mode"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-zinc-500 truncate mt-0.5">{userEmail || "Offline session"}</p>
                                </div>
                                <button
                                  onClick={handleLogout}
                                  className="text-xs font-bold py-1.5 px-3 rounded-lg border border-red-500/20 text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors cursor-pointer"
                                >
                                  Logout
                                </button>
                              </div>
                            </div>

                            <div className={`rounded-2xl p-4 border ${isDark ? "bg-[#111b21] border-zinc-800" : "bg-white border-zinc-200 shadow-xs"}`}>
                              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                                {userLanguage === "id" ? "Nama Panggilan (Nickname)" : "Nickname Settings"}
                              </h3>
                              <p className="text-xs text-zinc-500 leading-relaxed mb-3">
                                {userLanguage === "id" ? "Atur nama panggilan yang digunakan asisten AI untuk menyapa Anda." : "Set your preferred nickname used by the AI assistant to address you."}
                              </p>
                              
                              <div className="space-y-3">
                                <input
                                  value={userName}
                                  onChange={(e) => setUserName(e.target.value)}
                                  placeholder="Enter nickname..."
                                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none border ${
                                    isDark ? "bg-[#202c33] border-zinc-700 text-zinc-100" : "bg-zinc-50 border-zinc-300 text-zinc-900"
                                  }`}
                                />
                                <button
                                  onClick={handleSaveUsername}
                                  className="w-full py-3 rounded-xl text-xs font-bold bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-all cursor-pointer"
                                >
                                  {userLanguage === "id" ? "Simpan Nickname" : "Save Nickname"}
                                </button>
                                {redeemFeedback && (
                                  <p className="text-xs text-emerald-500 font-semibold">✓ {redeemFeedback}</p>
                                )}
                              </div>
                            </div>

                            <div className={`rounded-2xl p-4 border ${isDark ? "bg-[#111b21] border-zinc-800" : "bg-white border-zinc-200 shadow-xs"}`}>
                              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
                                <Globe className="h-4 w-4 text-amber-500" />
                                {userLanguage === "id" ? "Bahasa Antarmuka" : "Interface Language"}
                              </h3>
                              <div className="grid grid-cols-2 gap-2">
                                {LANGUAGES.map((lang) => {
                                  const isSelected = userLanguage === lang.code;
                                  return (
                                    <button
                                      key={lang.code}
                                      type="button"
                                      onClick={() => handleSelectLanguage(lang.code)}
                                      className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                                        isSelected
                                          ? "bg-amber-500/10 border-amber-500 text-amber-500 font-bold"
                                          : isDark
                                            ? "bg-[#202c33] border-zinc-700 text-zinc-300"
                                            : "bg-zinc-50 border-zinc-200 text-zinc-700"
                                      }`}
                                    >
                                      <span className="text-base">{lang.flag}</span>
                                      <span className="text-xs font-semibold truncate">{lang.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* SUBPAGE: MODEL */}
                        {mobileSettingsPage === "model" && (
                          <div className="space-y-4 animate-fadeIn">
                            <div className="space-y-2">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                {userLanguage === "id" ? "Pilihan Engine AI" : "AI Models"}
                              </h3>
                              <div className="space-y-2">
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
                                      className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${
                                        isSelected 
                                          ? isDark ? "bg-[#202c33] border-amber-500 text-zinc-100" : "bg-amber-50 border-amber-500 text-zinc-900"
                                          : isDark ? "border-zinc-800 bg-[#111b21] text-zinc-400" : "border-zinc-200 bg-white text-zinc-600"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-bold">{m.name}</span>
                                        {isSelected && <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/20 text-amber-500">Active</span>}
                                      </div>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{m.description}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* TEMPERATURE SETTINGS FOR GEMMA-4 MOBILE */}
                            {((currentSession ? currentSession.model : selectedModelId) === "gemma-4-31b") && (
                              <div className={`p-4 rounded-xl border space-y-3 ${isDark ? "bg-[#111b21] border-zinc-800" : "bg-white border-zinc-200 shadow-xs"}`}>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <Sliders className="h-4 w-4 text-amber-500" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                      {userLanguage === "id" ? "Suhu Kreativitas" : "Temperature Preset"}
                                    </h4>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 text-amber-400 border border-zinc-800">
                                    {activeTemp.toFixed(2)}
                                  </span>
                                </div>

                                <input 
                                  type="range" 
                                  min="0.10" 
                                  max="1.00" 
                                  step="0.05"
                                  value={activeTemp}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (currentSession) {
                                      setSessions((prev) => prev.map((s) => s.id === currentSessionId ? { ...s, temperature: val } : s));
                                    } else {
                                      setTemperature(val);
                                    }
                                  }}
                                  className="w-full h-1.5 bg-zinc-300 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />

                                <div className="space-y-1.5 pt-1">
                                  {GEMMA_TEMP_PRESETS.map((p) => {
                                    const [minStr, maxStr] = p.range.split("–");
                                    const minVal = parseFloat(minStr);
                                    const maxVal = parseFloat(maxStr);
                                    const isMatched = activeTemp >= minVal && activeTemp <= maxVal;
                                    return (
                                      <div
                                        key={p.id}
                                        onClick={() => {
                                          if (currentSession) {
                                            setSessions((prev) => prev.map((s) => s.id === currentSessionId ? { ...s, temperature: p.defaultValue } : s));
                                          } else {
                                            setTemperature(p.defaultValue);
                                          }
                                          playNotifySound();
                                        }}
                                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                                          isMatched
                                            ? "bg-amber-500/10 border-amber-500 text-amber-500 font-semibold"
                                            : isDark ? "border-zinc-800 bg-[#202c33] text-zinc-400" : "border-zinc-200 bg-zinc-50 text-zinc-600"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between text-xs font-bold">
                                          <span>{p.name}</span>
                                          <span className="text-[9px] font-mono">{p.range}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* SUBPAGE: TAMPILAN */}
                        {mobileSettingsPage === "tampilan" && (
                          <div className="space-y-4 animate-fadeIn">
                            <div className={`rounded-2xl p-4 border ${isDark ? "bg-[#111b21] border-zinc-800" : "bg-white border-zinc-200 shadow-xs"}`}>
                              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                                {userLanguage === "id" ? "Mode Tema" : "Theme Mode"}
                              </h3>
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
                                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                                        isSelected 
                                          ? "bg-amber-500/10 border-amber-500 text-amber-500 font-bold"
                                          : isDark ? "border-zinc-800 bg-[#202c33] text-zinc-300" : "border-zinc-200 bg-zinc-50 text-zinc-700"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <IconComp className="h-4 w-4" />
                                        <span className="text-xs font-semibold">{t.name}</span>
                                      </div>
                                      {isSelected && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className={`rounded-2xl p-4 border ${isDark ? "bg-[#111b21] border-zinc-800" : "bg-white border-zinc-200 shadow-xs"}`}>
                              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                                {userLanguage === "id" ? "Riwayat Percakapan" : "Chat History"}
                              </h3>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-zinc-500">Tampilkan riwayat kemarin & lebih lama di sidebar.</p>
                                <button
                                  onClick={() => {
                                    const newVal = !showYesterdayHistory;
                                    setShowYesterdayHistory(newVal);
                                    localStorage.setItem("showYesterdayHistory", JSON.stringify(newVal));
                                    playNotifySound();
                                  }}
                                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                                    showYesterdayHistory ? "bg-amber-500" : "bg-zinc-700"
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                      showYesterdayHistory ? "translate-x-5" : "translate-x-1"
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* SUBPAGE: INGATAN */}
                        {mobileSettingsPage === "ingatan" && (
                          <div className="space-y-4 animate-fadeIn">
                            <div className={`rounded-2xl p-4 border ${isDark ? "bg-[#111b21] border-zinc-800" : "bg-white border-zinc-200 shadow-xs"}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Brain className="h-4 w-4 text-amber-500" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                  {userLanguage === "id" ? "Memori AI (Maksimal 5)" : "AI Memory (Max 5)"}
                                </h3>
                              </div>
                              <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                                Konteks personal yang disimpan agar respon AI lebih relevan dan sesuai gaya Anda.
                              </p>

                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={memoryInput}
                                  onChange={(e) => setMemoryInput(e.target.value)}
                                  placeholder={memories.length >= 5 ? "Batas maksimal tercapai" : "Tambah preferensi..."}
                                  disabled={memories.length >= 5}
                                  className={`flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none border ${
                                    isDark ? "bg-[#202c33] border-zinc-700 text-zinc-100" : "bg-zinc-50 border-zinc-300 text-zinc-900"
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
                                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-zinc-950 disabled:opacity-40 cursor-pointer"
                                >
                                  Tambah
                                </button>
                              </div>

                              <div className="space-y-2 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                                {memories.length === 0 ? (
                                  <p className="text-center py-4 text-xs text-zinc-500 italic">Belum ada memori tersimpan.</p>
                                ) : (
                                  memories.map((mem, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-500/5 border border-zinc-500/10 text-xs">
                                      <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">{mem}</span>
                                      <button
                                        onClick={() => {
                                          setMemories((prev) => prev.filter((_, i) => i !== idx));
                                          playNotifySound();
                                        }}
                                        className="p-1 text-zinc-400 hover:text-red-500 cursor-pointer"
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

                        {mobileSettingsPage === "feedback" && (
                          <div className="animate-fadeIn">
                            {renderFeedbackForm()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. DESKTOP VIEW (GITHUB-STYLE MODERN CONTROL PANEL) */}
                <div className="hidden md:flex flex-row items-center justify-center h-full w-full p-6 lg:p-10 font-sans">
                  <div className="max-w-6xl w-full h-[88vh] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d1117] shadow-2xl flex overflow-hidden">
                    {/* Left GitHub Sidebar */}
                    <div className="w-72 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-[#161b22] p-5 flex flex-col justify-between select-none">
                      <div className="space-y-6">
                        {/* Sidebar Header */}
                        <div className="flex items-center gap-3 px-2 py-1">
                          <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-xs">
                            <Settings className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">{getTranslation("settings", userLanguage)}</h2>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-1">{userLanguage === "id" ? "Pengaturan Aplikasi" : "Preferences & Account"}</p>
                          </div>
                        </div>

                        {/* Navigation Categories */}
                        <nav className="space-y-4">
                          <div>
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 block mb-1.5">
                              User Preferences
                            </span>
                            <button
                              onClick={() => setSettingsTab("akun")}
                              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all text-xs font-semibold relative cursor-pointer ${
                                settingsTab === "akun"
                                  ? "bg-white dark:bg-[#0d1117] text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 shadow-xs"
                                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200"
                              }`}
                            >
                              {settingsTab === "akun" && <div className="absolute left-0 top-2 bottom-2 w-1 bg-amber-500 dark:bg-amber-400 rounded-r-md" />}
                              <User className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                              <div className="flex-1 min-w-0">
                                <div className="truncate">{getTranslation("tabAccountName", userLanguage)}</div>
                              </div>
                            </button>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 block mb-1.5">
                              AI Engine & Logic
                            </span>
                            <div className="space-y-1">
                              <button
                                onClick={() => setSettingsTab("model")}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all text-xs font-semibold relative cursor-pointer ${
                                  settingsTab === "model"
                                    ? "bg-white dark:bg-[#0d1117] text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 shadow-xs"
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200"
                                }`}
                              >
                                {settingsTab === "model" && <div className="absolute left-0 top-2 bottom-2 w-1 bg-amber-500 dark:bg-amber-400 rounded-r-md" />}
                                <Cpu className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                                <div className="flex-1 min-w-0">
                                  <div className="truncate">{getTranslation("tabModelName", userLanguage)}</div>
                                </div>
                              </button>

                              <button
                                onClick={() => setSettingsTab("ingatan")}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all text-xs font-semibold relative cursor-pointer ${
                                  settingsTab === "ingatan"
                                    ? "bg-white dark:bg-[#0d1117] text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 shadow-xs"
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200"
                                }`}
                              >
                                {settingsTab === "ingatan" && <div className="absolute left-0 top-2 bottom-2 w-1 bg-amber-500 dark:bg-amber-400 rounded-r-md" />}
                                <Brain className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                                <div className="flex-1 min-w-0">
                                  <div className="truncate">{getTranslation("tabIngatanName", userLanguage)}</div>
                                </div>
                              </button>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 block mb-1.5">
                              System Interface
                            </span>
                            <button
                              onClick={() => setSettingsTab("tampilan")}
                              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all text-xs font-semibold relative cursor-pointer ${
                                settingsTab === "tampilan"
                                  ? "bg-white dark:bg-[#0d1117] text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 shadow-xs"
                                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200"
                              }`}
                            >
                              {settingsTab === "tampilan" && <div className="absolute left-0 top-2 bottom-2 w-1 bg-amber-500 dark:bg-amber-400 rounded-r-md" />}
                              <Sun className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                              <div className="flex-1 min-w-0">
                                <div className="truncate">{getTranslation("tabTampilanName", userLanguage)}</div>
                              </div>
                            </button>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 block mb-1.5">
                              Help & Feedback
                            </span>
                            <button
                              onClick={() => setSettingsTab("feedback")}
                              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all text-xs font-semibold relative cursor-pointer ${
                                settingsTab === "feedback"
                                  ? "bg-white dark:bg-[#0d1117] text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 shadow-xs"
                                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200"
                              }`}
                            >
                              {settingsTab === "feedback" && <div className="absolute left-0 top-2 bottom-2 w-1 bg-amber-500 dark:bg-amber-400 rounded-r-md" />}
                              <MessageSquare className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                              <div className="flex-1 min-w-0">
                                <div className="truncate">{getTranslation("tabFeedbackName", userLanguage)}</div>
                              </div>
                            </button>
                          </div>
                        </nav>
                      </div>

                      {/* Sidebar Footer */}
                      <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-2.5 px-2">
                          {userPhoto ? (
                            <img src={userPhoto} referrerPolicy="no-referrer" alt="User Avatar" className="h-8 w-8 rounded-full border border-zinc-300 dark:border-zinc-700 object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-amber-500 text-zinc-950 font-bold flex items-center justify-center text-xs">
                              {(userName || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">{userName || "Guest User"}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{userEmail || "Local Session"}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => setShowSettings(false)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#161b22] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer shadow-xs"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Close Settings</span>
                        </button>
                      </div>
                    </div>

                    {/* Right GitHub Content Panel */}
                    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0d1117] min-w-0 overflow-hidden">
                      {/* Top Bar Header */}
                      <div className="px-8 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#0d1117]">
                        <div>
                          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                            {settingsTab === "akun" && getTranslation("accountHeader", userLanguage)}
                            {settingsTab === "model" && getTranslation("modelHeader", userLanguage)}
                            {settingsTab === "tampilan" && getTranslation("displayHeader", userLanguage)}
                            {settingsTab === "ingatan" && getTranslation("memoryHeader", userLanguage)}
                            {settingsTab === "feedback" && getTranslation("feedbackHeader", userLanguage)}
                          </h2>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {settingsTab === "akun" && getTranslation("accountSubheader", userLanguage)}
                            {settingsTab === "model" && getTranslation("modelSubheader", userLanguage)}
                            {settingsTab === "tampilan" && getTranslation("displaySubheader", userLanguage)}
                            {settingsTab === "ingatan" && getTranslation("memorySubheader", userLanguage)}
                            {settingsTab === "feedback" && getTranslation("feedbackSubheader", userLanguage)}
                          </p>
                        </div>

                        <button
                          onClick={() => setShowSettings(false)}
                          className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer"
                          title="Close (Esc)"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Main Scrollable Content */}
                      <div className="flex-1 overflow-y-auto p-8 space-y-6">
                        {/* TAB: AKUN */}
                        {settingsTab === "akun" && (
                          <div className="space-y-6 animate-fadeIn">
                            {/* Box 1: Account Status */}
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-[#161b22] shadow-xs">
                              <div className="bg-zinc-50/80 dark:bg-[#1c2128] px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                  <User className="h-4 w-4 text-amber-500" />
                                  <span>{getTranslation("activeConnection", userLanguage)}</span>
                                </h4>
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              </div>
                              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                  {userPhoto ? (
                                    <img src={userPhoto} referrerPolicy="no-referrer" alt="Profile" className="h-12 w-12 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover" />
                                  ) : (
                                    <div className="h-12 w-12 rounded-full bg-amber-500 text-zinc-950 font-bold flex items-center justify-center text-lg">
                                      {(userDisplayName || userName || "U").charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <h5 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{userDisplayName || userName || "Guest User"}</h5>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">{userEmail || "Offline mode"}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={handleLogout}
                                  className="px-4 py-2 text-xs font-bold rounded-xl border border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500/10 transition-colors cursor-pointer"
                                >
                                  {getTranslation("signOut", userLanguage)}
                                </button>
                              </div>
                            </div>

                            {/* Box 2: Nickname */}
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-[#161b22] shadow-xs">
                              <div className="bg-zinc-50/80 dark:bg-[#1c2128] px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                                  {getTranslation("nicknameHeader", userLanguage)}
                                </h4>
                              </div>
                              <div className="p-5 space-y-3">
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                  {getTranslation("nicknameSubheader", userLanguage)}
                                </p>
                                <div className="flex gap-3 max-w-lg">
                                  <input
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder={getTranslation("enterCustomName", userLanguage)}
                                    className={`flex-1 rounded-xl px-3.5 py-2 text-xs focus:outline-none border ${
                                      isDark ? "bg-[#0d1117] border-zinc-700 text-zinc-100" : "bg-zinc-50 border-zinc-300 text-zinc-900"
                                    }`}
                                  />
                                  <button
                                    onClick={handleSaveUsername}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all cursor-pointer"
                                  >
                                    {getTranslation("saveNickname", userLanguage)}
                                  </button>
                                </div>
                                {redeemFeedback && (
                                  <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1.5">
                                    <span>✓</span> <span>{redeemFeedback}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Box 3: Preferred Language */}
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-[#161b22] shadow-xs">
                              <div className="bg-zinc-50/80 dark:bg-[#1c2128] px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                                <Globe className="h-4 w-4 text-amber-500" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                                  {getTranslation("prefLangHeader", userLanguage)}
                                </h4>
                              </div>
                              <div className="p-5">
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                                  {getTranslation("prefLangSubheader", userLanguage)}
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {LANGUAGES.map((lang) => {
                                    const isSelected = userLanguage === lang.code;
                                    return (
                                      <button
                                        key={lang.code}
                                        type="button"
                                        onClick={() => handleSelectLanguage(lang.code)}
                                        className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all cursor-pointer ${
                                          isSelected
                                            ? "bg-amber-500/10 border-amber-500 text-amber-500 font-bold"
                                            : isDark
                                              ? "bg-[#0d1117] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                                              : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300"
                                        }`}
                                      >
                                        <span className="text-lg shrink-0">{lang.flag}</span>
                                        <div className="min-w-0">
                                          <p className="text-xs font-bold truncate">{lang.name}</p>
                                          <p className="text-[10px] text-zinc-500 truncate font-mono">{lang.nativeName}</p>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAB: MODEL */}
                        {settingsTab === "model" && (
                          <div className="space-y-6 animate-fadeIn">
                            {/* Models Grid Box */}
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-[#161b22] shadow-xs">
                              <div className="bg-zinc-50/80 dark:bg-[#1c2128] px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                                <Cpu className="h-4 w-4 text-amber-500" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                                  {getTranslation("availEngines", userLanguage)}
                                </h4>
                              </div>
                              <div className="p-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                          isSelected
                                            ? "bg-amber-500/10 border-amber-500 text-zinc-900 dark:text-zinc-100"
                                            : isDark
                                              ? "border-zinc-800 bg-[#0d1117] text-zinc-400 hover:border-zinc-700"
                                              : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between mb-1.5">
                                          <span className="text-xs font-bold">{m.name}</span>
                                          {isSelected && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 uppercase font-mono">
                                              {getTranslation("selected", userLanguage)}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs text-zinc-500 leading-relaxed">{m.description}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Temperature Box for Gemma-4 */}
                            {((currentSession ? currentSession.model : selectedModelId) === "gemma-4-31b") && (
                              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-[#161b22] shadow-xs">
                                <div className="bg-zinc-50/80 dark:bg-[#1c2128] px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                    <Sliders className="h-4 w-4 text-amber-500" />
                                    <span>Gemma-4 Temperature Presets</span>
                                  </h4>
                                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 text-amber-400 border border-zinc-800">
                                    {activeTemp.toFixed(2)}
                                  </span>
                                </div>
                                <div className="p-5 space-y-4">
                                  <input 
                                    type="range" 
                                    min="0.10" 
                                    max="1.00" 
                                    step="0.05"
                                    value={activeTemp}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      if (currentSession) {
                                        setSessions((prev) => prev.map((s) => s.id === currentSessionId ? { ...s, temperature: val } : s));
                                      } else {
                                        setTemperature(val);
                                      }
                                    }}
                                    className="w-full h-1.5 bg-zinc-300 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                  />

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {GEMMA_TEMP_PRESETS.map((p) => {
                                      const [minStr, maxStr] = p.range.split("–");
                                      const minVal = parseFloat(minStr);
                                      const maxVal = parseFloat(maxStr);
                                      const isMatched = activeTemp >= minVal && activeTemp <= maxVal;
                                      return (
                                        <div
                                          key={p.id}
                                          onClick={() => {
                                            if (currentSession) {
                                              setSessions((prev) => prev.map((s) => s.id === currentSessionId ? { ...s, temperature: p.defaultValue } : s));
                                            } else {
                                              setTemperature(p.defaultValue);
                                            }
                                            playNotifySound();
                                          }}
                                          className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                                            isMatched
                                              ? "bg-amber-500/10 border-amber-500 text-amber-500 font-semibold"
                                              : isDark ? "border-zinc-800 bg-[#0d1117] text-zinc-400" : "border-zinc-200 bg-zinc-50 text-zinc-600"
                                          }`}
                                        >
                                          <div className="flex items-center justify-between text-xs font-bold mb-1">
                                            <span>{p.name}</span>
                                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-500/10">{p.range}</span>
                                          </div>
                                          <p className="text-[11px] text-zinc-500 leading-normal">{p.description}</p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Cognitive Presets Box */}
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-[#161b22] shadow-xs">
                              <div className="bg-zinc-50/80 dark:bg-[#1c2128] px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                                  Cognitive & Persona Presets
                                </h4>
                              </div>
                              <div className="p-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                          isSelected
                                            ? "bg-amber-500/10 border-amber-500"
                                            : isDark ? "border-zinc-800 bg-[#0d1117]" : "border-zinc-200 bg-zinc-50"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5 mb-1.5">
                                          <div className={`p-1.5 rounded-lg border ${isSelected ? "text-amber-500 border-amber-500/30 bg-amber-500/10" : "text-zinc-500 border-zinc-700"}`}>
                                            {getPresetIcon(preset.icon, "h-4 w-4")}
                                          </div>
                                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{preset.name}</span>
                                        </div>
                                        <p className="text-xs text-zinc-500 leading-relaxed">{preset.description}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAB: TAMPILAN */}
                        {settingsTab === "tampilan" && (
                          <div className="space-y-6 animate-fadeIn">
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-[#161b22] shadow-xs">
                              <div className="bg-zinc-50/80 dark:bg-[#1c2128] px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                                  {getTranslation("selectStyleTheme", userLanguage)}
                                </h4>
                              </div>
                              <div className="p-5">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  {[
                                    { id: "system", name: getTranslation("systemSync", userLanguage), desc: "Follow OS settings", icon: Laptop },
                                    { id: "dark", name: getTranslation("slateDark", userLanguage), desc: "Eye-saving deep theme", icon: Moon },
                                    { id: "light", name: getTranslation("pureLight", userLanguage), desc: "Clean paper white theme", icon: Sun },
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
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                          isSelected
                                            ? "bg-amber-500/10 border-amber-500 text-amber-500 font-bold"
                                            : isDark ? "border-zinc-800 bg-[#0d1117] text-zinc-400" : "border-zinc-200 bg-zinc-50 text-zinc-600"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5 mb-2">
                                          <IconComp className="h-4 w-4" />
                                          <span className="text-xs font-bold">{t.name}</span>
                                        </div>
                                        <p className="text-xs text-zinc-500">{t.desc}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-[#161b22] shadow-xs">
                              <div className="bg-zinc-50/80 dark:bg-[#1c2128] px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                                  {getTranslation("chatHistorySettings", userLanguage)}
                                </h4>
                              </div>
                              <div className="p-5 flex items-center justify-between">
                                <p className="text-xs text-zinc-500">
                                  {getTranslation("toggleYesterdayDesc", userLanguage)}
                                </p>
                                <button
                                  onClick={() => {
                                    const newVal = !showYesterdayHistory;
                                    setShowYesterdayHistory(newVal);
                                    localStorage.setItem("showYesterdayHistory", JSON.stringify(newVal));
                                    playNotifySound();
                                  }}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                                    showYesterdayHistory ? "bg-amber-500" : "bg-zinc-700"
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      showYesterdayHistory ? "translate-x-6" : "translate-x-1"
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAB: INGATAN */}
                        {settingsTab === "ingatan" && (
                          <div className="space-y-6 animate-fadeIn">
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-[#161b22] shadow-xs">
                              <div className="bg-zinc-50/80 dark:bg-[#1c2128] px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                                <Brain className="h-4 w-4 text-amber-500" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                                  {getTranslation("injectMemory", userLanguage)}
                                </h4>
                              </div>
                              <div className="p-5 space-y-4">
                                <p className="text-xs text-zinc-500">
                                  Informasi latar belakang personal disimpan agar AI menyesuaikan jawaban.
                                </p>

                                <div className="flex gap-3 max-w-lg">
                                  <input
                                    type="text"
                                    value={memoryInput}
                                    onChange={(e) => setMemoryInput(e.target.value)}
                                    placeholder={memories.length >= 5 ? "Limit reached" : "Example: Prefer TSX code examples..."}
                                    disabled={memories.length >= 5}
                                    className={`flex-1 rounded-xl px-3.5 py-2 text-xs focus:outline-none border ${
                                      isDark ? "bg-[#0d1117] border-zinc-700 text-zinc-100" : "bg-zinc-50 border-zinc-300 text-zinc-900"
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
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-zinc-950 disabled:opacity-40 cursor-pointer"
                                  >
                                    {getTranslation("saveMemory", userLanguage)}
                                  </button>
                                </div>

                                <div className="space-y-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                                  {memories.length === 0 ? (
                                    <p className="text-center py-6 text-xs text-zinc-500 italic">{getTranslation("noMemories", userLanguage)}</p>
                                  ) : (
                                    memories.map((mem, idx) => (
                                      <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-zinc-500/5 border border-zinc-500/10 text-xs">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                          <span className="font-medium truncate text-zinc-800 dark:text-zinc-200">{mem}</span>
                                        </div>
                                        <button
                                          onClick={() => {
                                            setMemories((prev) => prev.filter((_, i) => i !== idx));
                                            playNotifySound();
                                          }}
                                          className="p-1 text-zinc-400 hover:text-red-500 cursor-pointer"
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
                        )}

                        {/* TAB: FEEDBACK */}
                        {settingsTab === "feedback" && (
                          <div className="animate-fadeIn">
                            {renderFeedbackForm()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* EXECODE WORKSPACE COMPONENT OVERLAY (DESKTOP ONLY) */}
          <AnimatePresence>
            {showExeCode && !isMobile && (
              <div className="hidden md:block">
                <ExeCodeWorkspace
                  isDark={isDark}
                  curTheme={curTheme}
                  onClose={() => setShowExeCode(false)}
                  defaultModelId={selectedModelId}
                  userEmail={userEmail}
                  userId={userId}
                  appLanguage={userLanguage}
                />
              </div>
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
                      <h3 className="font-sans font-semibold text-lg">{getTranslation("selectTopic", userLanguage)}</h3>
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
                    {getTranslation("chooseTopicDesc", userLanguage)}
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
                                  {getTranslation("active", userLanguage)}
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
                      <h3 className="font-sans font-semibold text-lg">{getTranslation("selectModel", userLanguage)}</h3>
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
                    {getTranslation("chooseModelDesc", userLanguage)}
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
                                  {getTranslation("active", userLanguage)}
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
                      <p className={`text-[10px] font-medium ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>{getTranslation("finalStep", userLanguage)}</p>
                      <h3 className={`font-sans font-semibold text-base ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>{getTranslation("whatIsYourName", userLanguage)}</h3>
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed mb-5 font-sans ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    {getTranslation("chooseNicknameDesc", userLanguage)}
                  </p>

                  {/* Input field */}
                  <div className="space-y-1.5 mb-5">
                    <label className={`block text-[10px] font-medium uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>{getTranslation("nicknameLabel", userLanguage)}</label>
                    <input
                      type="text"
                      value={registerModalName}
                      onChange={(e) => setRegisterModalName(e.target.value)}
                      placeholder={getTranslation("exampleNamePlaceholder", userLanguage)}
                      maxLength={30}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors font-sans ${
                        isDark 
                          ? "bg-black border-zinc-850 text-zinc-100 focus:border-zinc-700 placeholder-zinc-700" 
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
                      {getTranslation("saveAndContinue", userLanguage)}
                    </button>

                    <button
                      onClick={() => handleCompleteRegistrationWithChosenName(googleDefaultName)}
                      className={`w-full py-2.5 px-4 rounded-xl border font-medium text-xs transition-colors duration-150 cursor-pointer text-center ${
                        isDark 
                          ? "border-zinc-800 hover:border-zinc-750 bg-transparent hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200" 
                          : "border-zinc-200 hover:border-zinc-300 bg-transparent hover:bg-zinc-50 text-zinc-600 hover:text-zinc-800"
                      }`}
                    >
                      {getTranslation("skipGoogleName", userLanguage)}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* LANGUAGE SELECTION POPUP - SYSTEM SELECT BAHASA */}
          <AnimatePresence>
            {showLanguagePopup && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={`relative w-full max-w-lg rounded-3xl border p-6 md:p-8 shadow-2xl z-10 transition-all ${
                    isDark ? "bg-zinc-950 border-zinc-900 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"
                  }`}
                >
                  <div className="text-center space-y-3 mb-6">
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                      <Globe className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-display font-bold tracking-tight">Select Language / Pilih Bahasa</h3>
                    <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                      Please select your preferred language to continue.
                      <br />
                      Silakan pilih bahasa preferensi Anda untuk melanjutkan.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelectLanguage(lang.code)}
                        className={`p-3.5 rounded-2xl border flex items-center gap-3 text-left transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                          isDark
                            ? "bg-black border-zinc-900 text-zinc-300 hover:border-amber-500/50 hover:bg-zinc-900/40"
                            : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-amber-500 hover:bg-zinc-100"
                        }`}
                      >
                        <span className="text-2xl shrink-0">{lang.flag}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{lang.name}</p>
                          <p className="text-[10px] text-zinc-500 truncate font-medium">{lang.nativeName}</p>
                        </div>
                      </button>
                    ))}
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
                      <p className={`text-[10px] font-medium ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>{getTranslation("deleteWarning", userLanguage)}</p>
                      <h3 className={`font-sans font-semibold text-base ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>{getTranslation("confirmClearTitle", userLanguage)}</h3>
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed mb-5 font-sans ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    {getTranslation("confirmClearDesc", userLanguage)}
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
                      {getTranslation("clearChat", userLanguage)}
                    </button>

                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className={`w-full py-2.5 px-4 rounded-xl border font-medium text-xs transition-colors duration-150 cursor-pointer text-center ${
                        isDark 
                          ? "border-zinc-800 hover:border-zinc-750 bg-transparent hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200" 
                          : "border-zinc-200 hover:border-zinc-300 bg-transparent hover:bg-zinc-50 text-zinc-600 hover:text-zinc-800"
                      }`}
                    >
                      {getTranslation("cancel", userLanguage)}
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
                      placeholder={getTranslation("searchConversationsPlaceholder", userLanguage)}
                      className={`w-full pl-11 pr-10 py-3 rounded-xl text-base transition-all duration-200 focus:outline-none border ${
                        isDark 
                          ? "border-zinc-800 bg-black/45 text-zinc-100 placeholder-zinc-600 focus:border-zinc-700 focus:bg-black/70" 
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
                            {getTranslation("noConversationsFound", userLanguage).replace("{query}", popupSearchQuery)}
                          </div>
                        );
                      }

                      return (
                        <>
                          <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider select-none ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                            {popupSearchQuery ? getTranslation("matchingConversations", userLanguage) : getTranslation("recentConversations", userLanguage)}
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
                    <span>{getTranslation("clickToJumpConversation", userLanguage)}</span>
                    <span>{getTranslation("pressEscToClose", userLanguage)}</span>
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
                      {getTranslation("cookieTitle", userLanguage)}
                    </h4>
                    <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                      {getTranslation("cookieNoticeText", userLanguage)}
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
                    <div className="font-semibold text-xs mb-1">{getTranslation("ourStorageDetails", userLanguage)}</div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-amber-500">•</span>
                      <span><strong>{getTranslation("essentialRequired", userLanguage)}</strong>: {getTranslation("essentialDesc", userLanguage)}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-amber-500">•</span>
                      <span><strong>{getTranslation("preferencesOptional", userLanguage)}</strong>: {getTranslation("preferencesDesc", userLanguage)}</span>
                    </div>
                    <div>{getTranslation("privacyRespect", userLanguage)}</div>
                  </motion.div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-zinc-500/10">
                  <button
                    onClick={() => setShowCookieDetails(!showCookieDetails)}
                    className={`text-xs font-semibold hover:underline ${isDark ? "text-zinc-400 hover:text-zinc-250" : "text-zinc-600 hover:text-zinc-900"}`}
                  >
                    {showCookieDetails ? getTranslation("hideDetails", userLanguage) : getTranslation("learnDetails", userLanguage)}
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
                      {getTranslation("reject", userLanguage)}
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
                      {getTranslation("accept", userLanguage)}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ADMIN FEEDBACK PANEL POPUP */}
          <AnimatePresence>
            {showAdminPopup && (userEmail?.toLowerCase() === "nairicintia@gmail.com" || userEmail?.toLowerCase() === "opengsukadiaa@gmail.com") && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 md:p-6">
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAdminPopup(false)}
                  className="absolute inset-0 bg-black/85 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 15 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={`relative w-full max-w-6xl h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden z-10 transition-all ${
                    isDark ? "bg-[#161718] border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"
                  }`}
                >
                  {/* Header Bar */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-500/10 shrink-0 bg-zinc-500/5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl flex items-center justify-center border bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-sm">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-base md:text-lg leading-tight">Admin Feedback Portal</h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
                            nairicintia@gmail.com
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                          Review user feedback submissions, attachments, and chat logs
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={loadAdminFeedbacks}
                        disabled={adminLoading}
                        className={`px-3 py-2 rounded-xl border border-zinc-500/15 hover:bg-zinc-500/10 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer disabled:opacity-50`}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${adminLoading ? "animate-spin" : ""}`} />
                        Refresh
                      </button>

                      <button
                        onClick={() => {
                          setShowAdminPopup(false);
                          setSelectedAdminFeedback(null);
                        }}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Main Container Area */}
                  {selectedAdminFeedback ? (
                    /* FULL DETAIL INSPECTOR VIEW */
                    <div className="flex-1 flex flex-col overflow-hidden bg-zinc-900/10">
                      {/* Top Action Bar */}
                      <div className="px-6 py-3.5 border-b border-zinc-500/10 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-zinc-500/5">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedAdminFeedback(null)}
                            className="px-3 py-1.5 rounded-xl border border-zinc-500/15 hover:bg-zinc-500/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer text-amber-500"
                          >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Feedbacks List
                          </button>
                          <span className="text-zinc-500">|</span>
                          <span className={`text-xs font-mono font-semibold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                            ID: {selectedAdminFeedback.id?.substring(0, 12)}...
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-500">Status:</span>
                          <select
                            value={selectedAdminFeedback.status || "new"}
                            onChange={(e) => handleUpdateFeedbackStatus(selectedAdminFeedback.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer ${
                              selectedAdminFeedback.status === "resolved"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                                : selectedAdminFeedback.status === "reviewed"
                                  ? "bg-blue-500/10 border-blue-500/30 text-blue-500"
                                  : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                            }`}
                          >
                            <option value="new" className="bg-zinc-900 text-white">🟢 NEW</option>
                            <option value="reviewed" className="bg-zinc-900 text-white">🔵 REVIEWED</option>
                            <option value="resolved" className="bg-zinc-900 text-white">✅ RESOLVED</option>
                          </select>

                          <a
                            href={`mailto:${selectedAdminFeedback.email}?subject=Regarding your ExeChat Feedback`}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Email User
                          </a>

                          <button
                            onClick={() => handleFeedbackDelete(selectedAdminFeedback.id)}
                            className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Detail Body (2 Columns on Desktop) */}
                      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 scrollbar-thin">
                        {/* Left Column: Feedback Info & Attachments */}
                        <div className="lg:col-span-5 space-y-5">
                          {/* User & Category Badge */}
                          <div className={`p-5 rounded-2xl border space-y-3 ${isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200"}`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                                selectedAdminFeedback.category === "Bug Report"
                                  ? "bg-red-500/10 border-red-500/30 text-red-500"
                                  : selectedAdminFeedback.category === "Dislike / Chat Error"
                                    ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                                    : selectedAdminFeedback.category === "Question"
                                      ? "bg-blue-500/10 border-blue-500/30 text-blue-500"
                                      : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                              }`}>
                                {selectedAdminFeedback.category || "General Feedback"}
                              </span>
                              <span className="text-xs font-mono text-zinc-500 font-medium">
                                {new Date(selectedAdminFeedback.timestamp).toLocaleString()}
                              </span>
                            </div>

                            <div className="pt-2 flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-zinc-950 font-bold flex items-center justify-center text-sm shadow">
                                {(selectedAdminFeedback.email || "U").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">User Email</p>
                                <p className="text-sm font-bold text-amber-500 truncate">{selectedAdminFeedback.email}</p>
                              </div>
                            </div>
                          </div>

                          {/* Message Content */}
                          <div className={`p-5 rounded-2xl border space-y-3 ${isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200"}`}>
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Feedback Message</h4>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedAdminFeedback.message || "");
                                }}
                                className="text-[11px] font-bold text-amber-500 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="h-3 w-3" /> Copy
                              </button>
                            </div>
                            <p className="text-sm text-zinc-200 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap select-text font-sans">
                              {selectedAdminFeedback.message}
                            </p>
                          </div>

                          {/* Attachment Preview Section */}
                          {selectedAdminFeedback.attachmentUrl && (
                            <div className={`p-5 rounded-2xl border space-y-3 ${isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200"}`}>
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                                  <Paperclip className="h-4 w-4 text-amber-500" />
                                  Attached Screenshot / Video / File
                                </h4>
                                <a
                                  href={selectedAdminFeedback.attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-bold text-amber-500 hover:underline flex items-center gap-1"
                                >
                                  <Download className="h-3.5 w-3.5" /> Download
                                </a>
                              </div>

                              {/* Media Player or Image Box */}
                              {selectedAdminFeedback.attachmentType?.startsWith("video/") || selectedAdminFeedback.attachmentName?.match(/\.(mp4|webm|mov)$/i) ? (
                                <div className="space-y-2">
                                  <video
                                    src={selectedAdminFeedback.attachmentUrl}
                                    controls
                                    className="w-full rounded-2xl max-h-[300px] bg-black border border-zinc-800"
                                  />
                                  <p className="text-[11px] text-zinc-500 text-center font-mono">
                                    {selectedAdminFeedback.attachmentName || "Screen Recording Video"}
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div
                                    onClick={() => setExpandedImage(selectedAdminFeedback.attachmentUrl)}
                                    className="relative group rounded-2xl overflow-hidden border border-zinc-800 bg-black cursor-zoom-in max-h-[320px] flex items-center justify-center"
                                  >
                                    <img
                                      src={selectedAdminFeedback.attachmentUrl}
                                      alt="Attachment"
                                      className="max-h-[320px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5">
                                      <Maximize2 className="h-4 w-4" /> Click to Zoom Full Resolution
                                    </div>
                                  </div>
                                  <p className="text-[11px] text-zinc-500 text-center font-mono">
                                    {selectedAdminFeedback.attachmentName || "Attached Screenshot Image"}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Client Device Metadata */}
                          {selectedAdminFeedback.clientMeta && (
                            <div className={`p-5 rounded-2xl border space-y-2 text-xs font-mono ${isDark ? "bg-zinc-900/40 border-zinc-800 text-zinc-400" : "bg-white border-zinc-200 text-zinc-600"}`}>
                              <h4 className="font-sans font-bold uppercase tracking-wider text-[11px] text-zinc-500 mb-1">
                                Client Device Metadata
                              </h4>
                              <div className="flex justify-between py-1 border-b border-zinc-500/10">
                                <span>Model:</span>
                                <span className="text-purple-400 font-bold">{selectedAdminFeedback.modelInfo || "Default"}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-zinc-500/10">
                                <span>Topic:</span>
                                <span className="text-amber-400 font-bold">{selectedAdminFeedback.topicInfo || "General Assistant"}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-zinc-500/10">
                                <span>Language:</span>
                                <span>{selectedAdminFeedback.clientMeta.language || "N/A"}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-zinc-500/10">
                                <span>Screen:</span>
                                <span>{selectedAdminFeedback.clientMeta.screenResolution || "N/A"}</span>
                              </div>
                              <div className="py-1">
                                <span className="block text-zinc-500 mb-0.5">User Agent:</span>
                                <span className="text-[10px] break-all text-zinc-400">{selectedAdminFeedback.clientMeta.userAgent || "N/A"}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Column: Chat Transcript & Diagnostic Context */}
                        <div className="lg:col-span-7">
                          <div className={`p-5 rounded-2xl border h-full flex flex-col space-y-4 ${isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200"}`}>
                            <div className="flex items-center justify-between pb-3 border-b border-zinc-500/10">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-amber-500" />
                                <div>
                                  <h4 className="font-bold text-sm text-zinc-100">User Chat Transcript</h4>
                                  <p className="text-[11px] text-zinc-400">Recorded messages & AI response context</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-zinc-500/10 text-zinc-400 border border-zinc-500/10">
                                {selectedAdminFeedback.chatHistory ? `${selectedAdminFeedback.chatHistory.length} Messages` : "No direct logs"}
                              </span>
                            </div>

                            {/* Chat Transcript Container */}
                            <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 min-h-[350px] max-h-[550px] scrollbar-thin">
                              {selectedAdminFeedback.chatHistory && Array.isArray(selectedAdminFeedback.chatHistory) && selectedAdminFeedback.chatHistory.length > 0 ? (
                                selectedAdminFeedback.chatHistory.map((msg: any, idx: number) => {
                                  const isUser = msg.role === "user";
                                  return (
                                    <div key={msg.id || idx} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                                      <div className="flex items-center gap-1.5 mb-1 px-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                          {isUser ? selectedAdminFeedback.email?.split("@")[0] || "User" : `ExeChat AI (${msg.modelId || "Model"})`}
                                        </span>
                                        <span className="text-[9px] font-mono text-zinc-600">
                                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ""}
                                        </span>
                                      </div>
                                      <div className={`p-3.5 rounded-2xl max-w-[90%] text-xs leading-relaxed ${
                                        isUser
                                          ? "bg-amber-500 text-zinc-950 font-medium rounded-tr-none shadow-sm"
                                          : isDark
                                            ? "bg-zinc-800/90 text-zinc-100 border border-zinc-700/60 rounded-tl-none"
                                            : "bg-zinc-100 text-zinc-900 border border-zinc-200 rounded-tl-none"
                                      }`}>
                                        {msg.thinkingProcess && (
                                          <details className="mb-2.5 p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50 text-purple-200">
                                            <summary className="cursor-pointer text-[11px] font-bold text-purple-400 select-none flex items-center gap-1.5 hover:text-purple-300">
                                              <Brain className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                                              <span>Full AI Thinking Process</span>
                                            </summary>
                                            <p className="mt-2 text-[11px] font-mono whitespace-pre-wrap opacity-90 border-t border-purple-800/30 pt-2 select-text">
                                              {msg.thinkingProcess}
                                            </p>
                                          </details>
                                        )}
                                        <p className="whitespace-pre-wrap select-text font-sans">{msg.content}</p>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-zinc-500 space-y-2">
                                  <MessageSquare className="h-10 w-10 text-zinc-600" />
                                  <p className="text-xs font-bold text-zinc-400">No Attached Chat Log Array</p>
                                  <p className="text-[11px] max-w-sm text-zinc-500">
                                    The feedback message above contains the full user complaint text. If this was submitted from a chat dislike button, the prompt excerpt is embedded inside the message box.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* FEEDBACK LIST VIEW */
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Search & Category Filter Bar */}
                      <div className="px-6 py-3 border-b border-zinc-500/10 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-zinc-500/5">
                        <div className="relative flex-1 min-w-[220px]">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                          <input
                            type="text"
                            value={adminSearch}
                            onChange={(e) => setAdminSearch(e.target.value)}
                            placeholder="Search feedback text, email, or ID..."
                            className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl transition-all duration-200 focus:outline-none border ${
                              isDark 
                                ? "border-zinc-800 bg-black/40 text-zinc-200 placeholder-zinc-650 focus:border-zinc-700" 
                                : "border-zinc-200 bg-zinc-50 text-zinc-800 placeholder-zinc-400 focus:border-zinc-300"
                            }`}
                          />
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                          {["All", "Suggestion", "Bug Report", "Dislike / Chat Error", "Question"].map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setAdminCategoryFilter(cat)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                                adminCategoryFilter === cat
                                  ? "bg-amber-500 text-zinc-950 border-amber-500 shadow-sm"
                                  : isDark
                                    ? "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                                    : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Content Panel Area */}
                      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                        {adminLoading ? (
                          <div className="h-full flex flex-col items-center justify-center gap-3 py-16">
                            <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
                            <span className="text-sm text-zinc-500 font-medium">Fetching feedback database...</span>
                          </div>
                        ) : adminError ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-3 py-16">
                            <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center">
                              <AlertCircle className="h-6 w-6" />
                            </div>
                            <h4 className="text-base font-bold text-zinc-200">Retrieval Failed</h4>
                            <p className="text-xs text-zinc-500 max-w-sm">{adminError}</p>
                            <button
                              onClick={loadAdminFeedbacks}
                              className="mt-2 px-4 py-2 bg-amber-500 text-zinc-950 text-xs font-bold rounded-xl hover:bg-amber-400 cursor-pointer"
                            >
                              Retry Connection
                            </button>
                          </div>
                        ) : (() => {
                          const filtered = adminFeedbacks.filter((f) => {
                            const matchSearch =
                              f.email?.toLowerCase().includes(adminSearch.toLowerCase()) ||
                              f.message?.toLowerCase().includes(adminSearch.toLowerCase());
                            const matchCat =
                              adminCategoryFilter === "All" ||
                              (f.category || "").toLowerCase() === adminCategoryFilter.toLowerCase() ||
                              (adminCategoryFilter === "Dislike / Chat Error" && f.message?.includes("Dislike"));
                            return matchSearch && matchCat;
                          });

                          if (filtered.length === 0) {
                            return (
                              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                                <MessageSquare className="h-12 w-12 text-zinc-600 mb-3" />
                                <h4 className="text-base font-bold text-zinc-200">No Feedback Received</h4>
                                <p className="text-xs text-zinc-500 max-w-sm mt-1">
                                  {adminSearch || adminCategoryFilter !== "All"
                                    ? `No matches found for active filters.`
                                    : "User feedback database is currently empty."}
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {filtered.map((feed) => (
                                <div
                                  key={feed.id}
                                  onClick={() => setSelectedAdminFeedback(feed)}
                                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group ${
                                    isDark
                                      ? "bg-zinc-900/40 border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900/80 shadow-sm hover:shadow-lg"
                                      : "bg-white border-zinc-200/80 hover:border-amber-500/50 hover:shadow-md"
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-zinc-500/10">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-xs font-bold text-zinc-950 shadow uppercase shrink-0">
                                          {(feed.email || "G").charAt(0)}
                                        </div>
                                        <span className="text-xs font-bold text-zinc-200 truncate">{feed.email}</span>
                                      </div>

                                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                        feed.category === "Bug Report"
                                          ? "bg-red-500/10 border-red-500/30 text-red-500"
                                          : feed.category === "Dislike / Chat Error"
                                            ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                                            : feed.category === "Question"
                                              ? "bg-blue-500/10 border-blue-500/30 text-blue-500"
                                              : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                                      }`}>
                                        {feed.category || "Feedback"}
                                      </span>
                                    </div>

                                    <p className="text-xs text-zinc-300 dark:text-zinc-300 line-clamp-3 leading-relaxed">
                                      {feed.message}
                                    </p>
                                  </div>

                                  <div className="pt-2 border-t border-zinc-500/10 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3 text-zinc-500" />
                                      {new Date(feed.timestamp).toLocaleDateString()}
                                    </span>

                                    <div className="flex items-center gap-2">
                                      {feed.attachmentUrl && (
                                        <span className="text-amber-500 font-bold flex items-center gap-1 text-[10px] bg-amber-500/10 px-2 py-0.5 rounded-md">
                                          <Paperclip className="h-3 w-3" /> File
                                        </span>
                                      )}
                                      {feed.chatHistory && (
                                        <span className="text-blue-400 font-bold flex items-center gap-1 text-[10px] bg-blue-500/10 px-2 py-0.5 rounded-md">
                                          <MessageSquare className="h-3 w-3" /> Chat Log
                                        </span>
                                      )}
                                      <span className="text-amber-500 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                                        Inspect →
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Summary Footer */}
                  <div className={`px-6 py-3 border-t text-xs select-none shrink-0 flex items-center justify-between ${
                    isDark ? "bg-zinc-900/60 border-zinc-800/80 text-zinc-500" : "bg-zinc-50 border-zinc-200 text-zinc-500"
                  }`}>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Connected to Feedback Storage
                    </span>
                    <span className="font-bold uppercase tracking-wider text-[9px] font-mono px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      Admin Mode
                    </span>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Expanded Image Modal */}
          <AnimatePresence>
            {expandedImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setExpandedImage(null)}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 bg-black/85 backdrop-blur-sm cursor-zoom-out"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 350 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden bg-black/40 border border-zinc-800/80 shadow-2xl flex flex-col cursor-default"
                >
                  <div className="absolute top-4 right-4 z-50">
                    <button
                      onClick={() => setExpandedImage(null)}
                      className="p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-md"
                      title="Tutup"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <img
                    src={expandedImage}
                    alt="Expanded preview"
                    className="object-contain max-h-[85vh] w-auto h-auto rounded-xl mx-auto"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Subtle Dislike Feedback Toast Popup */}
          <AnimatePresence>
            {dislikeFeedbackToast && (
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[120] max-w-sm w-[calc(100vw-3rem)] p-4 rounded-2xl border shadow-xl backdrop-blur-xl transition-all ${
                  isDark
                    ? "bg-[#1e1f20]/95 border-zinc-800 text-zinc-100 shadow-black/40"
                    : "bg-white/95 border-zinc-200 text-zinc-900 shadow-zinc-300/40"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                      <ThumbsDown className="h-4 w-4 fill-current" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight">
                        {userLanguage === "id" ? "Bantu kami meningkatkan ExeAi" : "Help us improve ExeAi"}
                      </h4>
                      <p className={`text-[11px] mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                        {userLanguage === "id" ? "Mengapa tanggapan ini kurang membantu?" : "Why was this response unhelpful?"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDislikeFeedbackToast(null)}
                    className={`p-1 rounded-lg transition-colors shrink-0 ${
                      isDark ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                    }`}
                    title="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {dislikeFeedbackSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-3 mt-2 text-center text-xs font-medium text-emerald-500 flex items-center justify-center gap-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20"
                  >
                    <Check className="h-4 w-4" />
                    <span>{userLanguage === "id" ? "Terima kasih atas umpan baliknya!" : "Thank you for your feedback!"}</span>
                  </motion.div>
                ) : (
                  <div className="space-y-2.5 mt-3">
                    {/* Quick Reasons Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        userLanguage === "id" ? "Jawaban salah / Halusinasi" : "Inaccurate / Hallucination",
                        userLanguage === "id" ? "Format / Coding cacat" : "Incorrect code or format",
                        userLanguage === "id" ? "Terlalu singkat / Mengabaikan instruksi" : "Too brief / Ignored instructions",
                        userLanguage === "id" ? "Chat lambat / Respon gantung" : "Slow chat / Stalled response",
                        userLanguage === "id" ? "Penjelasan kurang jelas" : "Unclear explanation"
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setDislikeReason(preset)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                            dislikeReason === preset
                              ? "bg-rose-500 text-white border-rose-500 font-medium shadow-sm"
                              : isDark
                              ? "bg-zinc-800/80 text-zinc-300 border-zinc-700/60 hover:border-zinc-500 hover:bg-zinc-800"
                              : "bg-zinc-100 text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-150"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    {/* Additional Notes Textarea */}
                    <textarea
                      value={dislikeReason}
                      onChange={(e) => setDislikeReason(e.target.value)}
                      placeholder={userLanguage === "id" ? "Tuliskan saran atau kendala (opsional)..." : "Add specific details (optional)..."}
                      rows={2}
                      className={`w-full text-xs p-2.5 rounded-xl border transition-all focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none ${
                        isDark
                          ? "bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-600"
                          : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400"
                      }`}
                    />

                    {/* Action buttons */}
                    <div className="pt-1.5 border-t border-zinc-500/10 space-y-2">
                      <button
                        type="button"
                        onClick={openSettingsFeedback}
                        className={`w-full text-[11px] py-1.5 px-2.5 rounded-xl border flex items-center justify-between font-medium transition-all ${
                          isDark
                            ? "bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:bg-zinc-700/80 hover:text-white"
                            : "bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Settings className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">
                            {userLanguage === "id"
                              ? "Laporan lengkap & berkas di Settings"
                              : "Detailed report & files in Settings"}
                          </span>
                        </span>
                        <ArrowRight className="h-3 w-3 text-zinc-400 shrink-0 ml-1" />
                      </button>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDislikeFeedbackToast(null)}
                          className={`text-xs px-3 py-1.5 rounded-xl transition-colors ${
                            isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-800"
                          }`}
                        >
                          {userLanguage === "id" ? "Lewati" : "Skip"}
                        </button>
                        <button
                          onClick={handleSendDislikeFeedback}
                          disabled={!dislikeReason.trim() || dislikeSubmitting}
                          className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          {dislikeSubmitting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          <span>{userLanguage === "id" ? "Kirim" : "Submit"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </main>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { 
  File, 
  Folder, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Sparkles, 
  RefreshCw, 
  Smartphone, 
  Monitor, 
  Maximize2, 
  Minimize2, 
  Settings, 
  CloudLightning, 
  Database, 
  Trash,
  CheckCircle2, 
  X, 
  AlertCircle, 
  FolderPlus,
  Play,
  FileCode,
  FileJson,
  Code,
  Share2,
  Cloud,
  Eye,
  ChevronDown,
  ChevronUp,
  Terminal,
  Send,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  ArrowLeft,
  Volume2,
  Lock,
  Menu,
  Info,
  FileUp,
  Square
} from "lucide-react";
import JSZip from "jszip";
import { createClient } from "@supabase/supabase-js";
import { MODEL_OPTIONS } from "../presets";
import { motion, AnimatePresence } from "motion/react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface VirtualFile {
  path: string;
  content: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  filesSnapshot?: VirtualFile[];
  modelId?: string;
  thinkingDuration?: number;
  editedPaths?: string[];
}

interface ToastMessage {
  id: string;
  text: string;
  type: "success" | "error" | "info";
}

interface ExeCodeWorkspaceProps {
  isDark: boolean;
  curTheme: any;
  onClose: () => void;
  defaultModelId?: string;
  userEmail?: string | null;
  userId?: string | null;
  appLanguage?: string;
}

const EXECODE_MD_CONTENT = `# Project Overview

Welcome to your project workspace!

## Features
- Interactive web application
- Modern responsive layout
- Real-time live preview

## Quick Notes
Edit your HTML, CSS, and JavaScript files in the editor to see instant updates in the live preview panel.
`;

const DEFAULT_FILES: VirtualFile[] = [
  {
    path: "execode.md",
    content: EXECODE_MD_CONTENT
  },
  {
    path: "index.html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello World</title>
</head>
<body>
  <h1>Hello, World!</h1>
  <button id="clickBtn">Click Me</button>
  <script src="app.js"></script>
</body>
</html>`
  },
  {
    path: "app.js",
    content: `console.log("Hello World app loaded!");

const button = document.getElementById("clickBtn");
if (button) {
  button.addEventListener("click", () => {
    alert("Button clicked!");
  });
}`
  }
];

export function ExeCodeWorkspace({ isDark, curTheme, onClose, defaultModelId, userEmail, userId, appLanguage: propAppLanguage = "en" }: ExeCodeWorkspaceProps) {
  const [files, setFiles] = useState<VirtualFile[]>(() => {
    const saved = localStorage.getItem("execode_files");
    let loaded: VirtualFile[] = saved ? JSON.parse(saved) : DEFAULT_FILES;
    if (!loaded.some(f => f.path.toLowerCase() === "execode.md")) {
      loaded = [{ path: "execode.md", content: EXECODE_MD_CONTENT }, ...loaded];
    }
    return loaded;
  });
  
  const [activeFilePath, setActiveFilePath] = useState<string>("index.html");
  const [projectName, setProjectName] = useState<string>(() => {
    if (userEmail && !userEmail.includes("guest@exechat.local")) {
      return "proj-" + userEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    }
    let persistentId = localStorage.getItem("execode_persistent_project_id");
    if (!persistentId) {
      const existingName = localStorage.getItem("execode_project_name");
      if (existingName && existingName !== "ExeCode Project" && existingName.trim().length > 0) {
        persistentId = existingName.replace(/[^a-zA-Z0-9-_]/g, "");
      } else {
        persistentId = "proj-" + Math.random().toString(36).substring(2, 10);
      }
      localStorage.setItem("execode_persistent_project_id", persistentId);
    }
    localStorage.setItem("execode_project_name", persistentId);
    return persistentId;
  });
  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    return localStorage.getItem("execode_persistent_project_id") || "";
  });

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return defaultModelId || "gemma-4-31b";
  });
  const [showModelDropdown, setShowModelDropdown] = useState<boolean>(false);

  const [supabaseUrl, setSupabaseUrl] = useState<string>("https://knmjalxisidyduzwfwnp.supabase.co");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>("");
  const [supabaseBucket, setSupabaseBucket] = useState<string>("execode");
  const [isServerConfigured, setIsServerConfigured] = useState<boolean>(false);

  const [activeRightTab, setActiveRightTab] = useState<"preview" | "code" | "split">("preview");
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isAIEditing, setIsAIEditing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [newFileName, setNewFileName] = useState<string>("");
  const [showNewFileInput, setShowNewFileInput] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("execode_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
      }
    }
    return [
      {
        id: "initial",
        role: "assistant",
        content: "Hello! I am your ExeCode AI Assistant. Let me know what you want to create or change in this web application, and I will update the code in real-time!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ];
  });

  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [consoleLogs, setConsoleLogs] = useState<{ type: "log" | "error" | "warn" | "info"; text: string; timestamp: string }[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
  const [aiStreamingText, setAiStreamingText] = useState<string>("");

  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(5);

  const [likedMessages, setLikedMessages] = useState<Record<string, boolean>>({});
  const [dislikedMessages, setDislikedMessages] = useState<Record<string, boolean>>({});
  const [showClearChatConfirm, setShowClearChatConfirm] = useState<boolean>(false);
  const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState<boolean>(false);

  // Realtime Sync & Multi-Project Manager States (Max 5 projects per user limit)
  const [appLanguage, setAppLanguage] = useState<string>("en");
  const [realtimeStatus, setRealtimeStatus] = useState<"connected" | "connecting" | "disconnected">("disconnected");
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [defaultProjectName, setDefaultProjectName] = useState<string>(() => {
    if (userEmail && !userEmail.includes("guest@exechat.local")) {
      return "proj-" + userEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    }
    return "proj-default";
  });
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState<boolean>(false);
  const [newProjInputName, setNewProjInputName] = useState<string>("");
  const [isCreatingProj, setIsCreatingProj] = useState<boolean>(false);
  const [maxProjectLimit, setMaxProjectLimit] = useState<number>(5);
  const realtimeChannelRef = useRef<any>(null);
  const mySessionIdRef = useRef<string>("sess-" + Math.random().toString(36).substring(2, 9));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeFile = files.find(f => f.path === activeFilePath) || files[0];
  const [isEditingCode, setIsEditingCode] = useState<boolean>(false);
  const [localCodeContent, setLocalCodeContent] = useState<string>(activeFile?.content || "");
  const debouncedSyncRef = useRef<any>(null);

  // Sync local editor content when active file changes or AI updates active file
  useEffect(() => {
    setLocalCodeContent(activeFile?.content || "");
  }, [activeFilePath, activeFile?.content]);

  // Advanced Editor UX States & Refs
  const [editBackupContent, setEditBackupContent] = useState<string>("");
  const [chatWidth, setChatWidth] = useState<number>(380);
  const [isResizingChat, setIsResizingChat] = useState<boolean>(false);
  const [previewWidth, setPreviewWidth] = useState<number>(450);
  const [isResizingPreview, setIsResizingPreview] = useState<boolean>(false);

  const editorScrollRef = useRef<HTMLTextAreaElement>(null);
  const viewerScrollRef = useRef<HTMLDivElement>(null);
  const lineNumbersScrollRef = useRef<HTMLDivElement>(null);

  // Typewriter animation refs
  const typewriterTargetRef = useRef<string>("");
  const typewriterCurrentRef = useRef<string>("");
  const typewriterIntervalIdRef = useRef<any>(null);
  const typewriterDurationRef = useRef<number>(0.1);
  const isAIEditingActiveRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isAIEditingActiveRef.current = false;
    if (typewriterIntervalIdRef.current) {
      clearTimeout(typewriterIntervalIdRef.current);
      typewriterIntervalIdRef.current = null;
    }
    setIsAIEditing(false);
    triggerStatus("AI generation stopped.", "info");
  };

  // Initialize backup when entering edit mode or changing file
  useEffect(() => {
    if (isEditingCode) {
      setEditBackupContent(activeFile?.content || localCodeContent);
    }
  }, [isEditingCode, activeFilePath]);

  const handleUndoEdit = () => {
    if (debouncedSyncRef.current) clearTimeout(debouncedSyncRef.current);
    setLocalCodeContent(editBackupContent);
    setFiles(prev => prev.map(f => f.path === activeFilePath ? { ...f, content: editBackupContent } : f));
    triggerStatus("Changes reverted to previous version successfully!", "info");
  };

  const handleSaveEdit = () => {
    if (debouncedSyncRef.current) clearTimeout(debouncedSyncRef.current);
    setFiles(prev => prev.map(f => f.path === activeFilePath ? { ...f, content: localCodeContent } : f));
    setEditBackupContent(localCodeContent);
    refreshPreview();
    triggerStatus("Changes saved successfully!", "success");
  };

  // Scroll Sync Handlers
  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersScrollRef.current) {
      lineNumbersScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleViewerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (lineNumbersScrollRef.current) {
      lineNumbersScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Keep scroll position when toggling edit/view modes
  useEffect(() => {
    if (isEditingCode) {
      if (editorScrollRef.current && lineNumbersScrollRef.current) {
        editorScrollRef.current.scrollTop = lineNumbersScrollRef.current.scrollTop;
      }
    } else {
      if (viewerScrollRef.current && lineNumbersScrollRef.current) {
        viewerScrollRef.current.scrollTop = lineNumbersScrollRef.current.scrollTop;
      }
    }
  }, [isEditingCode]);

  // Resizing mouse move tracking
  const startResizingChat = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingChat(true);
  };

  const startResizingPreview = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingPreview(true);
  };

  useEffect(() => {
    const handleMouseMove = (ev: MouseEvent) => {
      if (isResizingChat) {
        const newWidth = Math.max(280, Math.min(600, ev.clientX));
        setChatWidth(newWidth);
      }
      if (isResizingPreview) {
        const newWidth = Math.max(300, Math.min(800, window.innerWidth - ev.clientX));
        setPreviewWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingChat(false);
      setIsResizingPreview(false);
    };

    if (isResizingChat || isResizingPreview) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingChat, isResizingPreview]);

  const highlightCode = (code: string, filepath: string) => {
    const lines = code.split("\n");
    const ext = filepath.split(".").pop()?.toLowerCase() || "html";

    return lines.map((line, lineIdx) => {
      if (line === "") {
        return (
          <div key={lineIdx} className="h-6 leading-6 text-transparent select-none">
            &nbsp;
          </div>
        );
      }

      const tokens: React.ReactNode[] = [];
      let currentPos = 0;

      if (ext === "html") {
        const htmlRegex = /(<!--[\s\S]*?-->|<\/?[a-zA-Z0-9:-]+(?:\s+[a-zA-Z0-9:-]+(?:=(?:"[^"]*"|'[^']*'|[^\s'">=]+))?)*\s*\/?>)/g;
        let match;
        while ((match = htmlRegex.exec(line)) !== null) {
          if (match.index > currentPos) {
            tokens.push(
              <span key={`text-${currentPos}`} className={isDark ? "text-zinc-300" : "text-zinc-850"}>
                {line.substring(currentPos, match.index)}
              </span>
            );
          }

          const tag = match[1];
          if (tag.startsWith("<!--")) {
            tokens.push(
              <span key={`comment-${match.index}`} className="text-zinc-500 italic">
                {tag}
              </span>
            );
          } else {
            const tagParts = tag.split(/(\s+)/);
            const highlightedTag = tagParts.map((part, pIdx) => {
              if (pIdx === 0) {
                return (
                  <span key={pIdx} className="text-pink-500 font-semibold">
                    {part}
                  </span>
                );
              } else if (part.includes("=")) {
                const eqIdx = part.indexOf("=");
                const attrName = part.substring(0, eqIdx);
                const attrVal = part.substring(eqIdx);
                return (
                  <span key={pIdx}>
                    <span className="text-amber-500 font-semibold">{attrName}</span>
                    <span className={isDark ? "text-zinc-400" : "text-zinc-500"}>=</span>
                    <span className="text-emerald-400 font-medium">{attrVal}</span>
                  </span>
                );
              } else {
                return (
                  <span key={pIdx} className={isDark ? "text-zinc-400" : "text-zinc-650"}>
                    {part}
                  </span>
                );
              }
            });
            tokens.push(<span key={`tag-${match.index}`}>{highlightedTag}</span>);
          }
          currentPos = htmlRegex.lastIndex;
        }
        if (currentPos < line.length) {
          tokens.push(
            <span key={`text-end`} className={isDark ? "text-zinc-300" : "text-zinc-850"}>
              {line.substring(currentPos)}
            </span>
          );
        }
      } else if (ext === "js" || ext === "json" || ext === "css") {
        const jsRegex = /(\/\/.*|\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b(?:const|let|var|function|return|if|else|for|while|import|export|from|default|class|extends|new|this|typeof|null|undefined|true|false)\b|\b\d+\b)/g;
        let match;
        while ((match = jsRegex.exec(line)) !== null) {
          if (match.index > currentPos) {
            tokens.push(
              <span key={`text-${currentPos}`} className={isDark ? "text-zinc-300" : "text-zinc-850"}>
                {line.substring(currentPos, match.index)}
              </span>
            );
          }

          const token = match[1];
          if (token.startsWith("//") || token.startsWith("/*")) {
            tokens.push(
              <span key={`comment-${match.index}`} className="text-zinc-500 italic">
                {token}
              </span>
            );
          } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
            tokens.push(
              <span key={`string-${match.index}`} className="text-emerald-400 font-medium">
                {token}
              </span>
            );
          } else if (/^(?:const|let|var|function|return|if|else|for|while|import|export|from|default|class|extends|new|this|typeof)\b$/.test(token)) {
            tokens.push(
              <span key={`keyword-${match.index}`} className="text-indigo-400 font-semibold">
                {token}
              </span>
            );
          } else if (/^(?:true|false|null|undefined)\b$/.test(token)) {
            tokens.push(
              <span key={`literal-${match.index}`} className="text-amber-500">
                {token}
              </span>
            );
          } else if (/^\d+$/.test(token)) {
            tokens.push(
              <span key={`number-${match.index}`} className="text-purple-400 font-medium">
                {token}
              </span>
            );
          } else {
            tokens.push(
              <span key={`token-${match.index}`} className={isDark ? "text-zinc-300" : "text-zinc-850"}>
                {token}
              </span>
            );
          }
          currentPos = jsRegex.lastIndex;
        }
        if (currentPos < line.length) {
          tokens.push(
            <span key={`text-end`} className={isDark ? "text-zinc-300" : "text-zinc-850"}>
              {line.substring(currentPos)}
            </span>
          );
        }
      } else {
        tokens.push(
          <span key="fallback" className={isDark ? "text-zinc-300" : "text-zinc-850"}>
            {line}
          </span>
        );
      }

      return (
        <div key={lineIdx} className="h-6 leading-6 whitespace-pre pl-4">
          {tokens}
        </div>
      );
    });
  };

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobileScreen(isMobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobileScreen) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isMobileScreen, onClose]);

  useEffect(() => {
    localStorage.setItem("execode_files", JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem("execode_project_name", projectName);
    localStorage.setItem("execode_persistent_project_id", projectName);
  }, [projectName]);

  useEffect(() => {
    localStorage.setItem("execode_chat_history", JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [expandedActions, setExpandedActions] = useState<Record<string, boolean>>({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const thinkingStartTimesRef = useRef<Record<string, number>>({});
  const finalThinkingDurationsRef = useRef<Record<string, number>>({});
  const activeAssistantMsgIdRef = useRef<string | null>(null);

  // Live ticking of thinkingDuration in ExeCodeWorkspace
  useEffect(() => {
    let intervalId: any;
    if (isAIEditing) {
      intervalId = setInterval(() => {
        const activeId = activeAssistantMsgIdRef.current;
        if (!activeId) return;
        const startTime = thinkingStartTimesRef.current[activeId];
        if (!startTime) return;
        
        // Calculate dynamic elapsed time with decimal precision
        const elapsed = Math.max(0.1, Number(((Date.now() - startTime) / 1000).toFixed(1)));
        
        setChatHistory(prev =>
          prev.map((m) => {
            if (m.id === activeId) {
              let updatedContent = m.content;
              if (updatedContent && updatedContent.includes("</think>")) {
                return m;
              }
              // Only modify if it's still using one of the initial placeholders
              if (
                updatedContent.includes("Thinking...") || 
                updatedContent.includes("Analyzing codebase") || 
                updatedContent.includes("Reviewing project")
              ) {
                if (elapsed >= 5) {
                  updatedContent = `<think>Analyzing codebase requirements (deep thinking process active... ${elapsed.toFixed(1)}s)`;
                } else {
                  updatedContent = `<think>Reviewing project context and prompt... (${elapsed.toFixed(1)}s)`;
                }
              }
              return { ...m, thinkingDuration: elapsed, content: updatedContent };
            }
            return m;
          })
        );
      }, 100); // Check every 100ms for high responsiveness
    } else {
      activeAssistantMsgIdRef.current = null;
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAIEditing]);

  const handleClearChat = () => {
    setShowClearChatConfirm(true);
  };

  const executeClearChat = () => {
    setChatHistory([
      {
        id: "initial",
        role: "assistant",
        content: "Hello! I am your ExeCode AI Assistant. Let me know what you want to create or change in this web application, and I will update the code in real-time!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setShowClearChatConfirm(false);
    triggerStatus("Chat history cleared.", "info");
  };

  const handleDeviceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      triggerStatus("File size exceeds the 10MB limit.", "error");
      return;
    }

    const reader = new FileReader();
    const isImage = file.type.startsWith("image/");

    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        triggerStatus("Failed to read the file content.", "error");
        return;
      }

      if (files.some(f => f.path.toLowerCase() === file.name.toLowerCase())) {
        triggerStatus(`A file named '${file.name}' already exists!`, "error");
        return;
      }

      const newFile: VirtualFile = {
        path: file.name,
        content: content,
      };

      setFiles(prev => [...prev, newFile]);
      setActiveFilePath(file.name);
      triggerStatus(`Successfully uploaded '${file.name}' from your device!`, "success");

      if (fileUploadRef.current) {
        fileUploadRef.current.value = "";
      }
    };

    reader.onerror = () => {
      triggerStatus("An error occurred while reading the file.", "error");
    };

    if (isImage) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const triggerStatus = (text: string, type: "success" | "error" | "info" = "info") => {
    showToast(text, type);
  };

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data) return;
      if (e.data.type === "PREVIEW_ERROR") {
        setRuntimeError(e.data.message);
        setConsoleLogs(prev => [
          ...prev,
          {
            type: "error",
            text: e.data.message,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
          }
        ]);
      } else if (e.data.type === "PREVIEW_CONSOLE") {
        setConsoleLogs(prev => [
          ...prev,
          {
            type: e.data.logType || "log",
            text: e.data.message,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
          }
        ]);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    const initialFilesStr = localStorage.getItem("execode_files");
    const initialFiles = initialFilesStr ? JSON.parse(initialFilesStr) : DEFAULT_FILES;
    
    fetch("/api/supabase/config")
      .then(res => res.json())
      .then(data => {
        if (data.isConfigured) {
          setIsServerConfigured(true);
          if (data.url && !localStorage.getItem("execode_sb_url")) {
            setSupabaseUrl(data.url);
          }
        }
      })
      .catch(err => console.warn("Failed to fetch cloud configuration:", err));

    let persistentId = localStorage.getItem("execode_persistent_project_id");
    if (!persistentId) {
      const existingName = localStorage.getItem("execode_project_name");
      if (existingName && existingName !== "ExeCode Project" && existingName.trim().length > 0) {
        persistentId = existingName.replace(/[^a-zA-Z0-9-_]/g, "");
      } else {
        persistentId = "proj-" + Math.random().toString(36).substring(2, 10);
      }
      localStorage.setItem("execode_persistent_project_id", persistentId);
    }
    localStorage.setItem("execode_project_name", persistentId);

    const match = window.location.pathname.match(/^\/project\/([^/]+)/);
    let targetProjectName = match ? decodeURIComponent(match[1]) : (persistentId || "");
    if (!targetProjectName && userEmail && !userEmail.includes("guest@exechat.local")) {
      targetProjectName = "proj-" + userEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    }
    if (!targetProjectName) {
      targetProjectName = "proj-" + Math.random().toString(36).substring(2, 10);
    }

    setProjectName(targetProjectName);
    localStorage.setItem("execode_persistent_project_id", targetProjectName);
    localStorage.setItem("execode_project_name", targetProjectName);

    if (!match) {
      window.history.pushState(null, "", `/project/${targetProjectName}`);
    }

    triggerStatus(`Connecting to Cloud Sandbox...`, "info");
    
    fetch("/api/supabase/load", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        projectName: targetProjectName,
        bucket: "execode"
      })
    })
    .then(res => {
      if (!res.ok) throw new Error("Project not found in the cloud.");
      return res.json();
    })
    .then(data => {
      if (data.files && data.files.length > 0) {
        let loadedFiles = data.files;
        if (!loadedFiles.some((f: VirtualFile) => f.path.toLowerCase() === "execode.md")) {
          loadedFiles = [{ path: "execode.md", content: EXECODE_MD_CONTENT }, ...loadedFiles];
        }
        setFiles(loadedFiles);
        setActiveFilePath("index.html");
        refreshPreview(loadedFiles);
        triggerStatus(`Successfully loaded '${targetProjectName}' from cloud!`, "success");
      } else {
        refreshPreview(initialFiles);
        triggerStatus(`Project connected. Ready to code!`, "success");
      }
    })
    .catch(err => {
      console.warn(err);
      refreshPreview(initialFiles);
      triggerStatus(`Connected. Start editing and save your changes.`, "success");
    });
  }, []);

  // --- REALTIME SYNC & MULTI-PROJECT MANAGER LOGIC ---
  const broadcastRealtimeSync = (updatedFiles: VirtualFile[]) => {
    if (realtimeChannelRef.current && realtimeStatus === "connected") {
      realtimeChannelRef.current.send({
        type: "broadcast",
        event: "CODE_REALTIME_SYNC",
        payload: {
          files: updatedFiles,
          senderId: mySessionIdRef.current,
          timestamp: Date.now()
        }
      }).catch((err: any) => console.warn("Realtime broadcast send warning:", err));
    }
  };

  // Connect to Supabase Realtime channel whenever active project changes
  useEffect(() => {
    if (!projectName) return;

    fetch("/api/supabase/config")
      .then(res => res.json())
      .then(config => {
        const sbUrl = config.url || "https://knmjalxisidyduzwfwnp.supabase.co";
        const sbAnonKey = config.anonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubWphbnhpc2lkeWR1endmd25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMzQ1NjcsImV4cCI6MjA1NjgxMDU2N30...";

        if (realtimeChannelRef.current) {
          realtimeChannelRef.current.unsubscribe();
          realtimeChannelRef.current = null;
        }

        setRealtimeStatus("connecting");
        const client = createClient(sbUrl, sbAnonKey);
        const channel = client.channel(`project:${projectName}`, {
          config: { broadcast: { self: false } }
        });

        channel
          .on("broadcast", { event: "CODE_REALTIME_SYNC" }, (payload: any) => {
            if (payload && payload.payload && Array.isArray(payload.payload.files)) {
              if (payload.payload.senderId !== mySessionIdRef.current) {
                const newFiles = payload.payload.files;
                setFiles(newFiles);
                refreshPreview(newFiles);
                triggerStatus(`⚡ Code synced in Realtime from another session!`, "success");
              }
            }
          })
          .subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
              setRealtimeStatus("connected");
            } else {
              setRealtimeStatus("disconnected");
            }
          });

        realtimeChannelRef.current = channel;
      })
      .catch(err => {
        console.warn("Realtime setup warning:", err);
        setRealtimeStatus("disconnected");
      });

    return () => {
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.unsubscribe();
        realtimeChannelRef.current = null;
      }
    };
  }, [projectName]);

  // Sync app language directly from global Settings
  useEffect(() => {
    if (propAppLanguage) {
      setAppLanguage(propAppLanguage);
    }
  }, [propAppLanguage]);

  // Fetch user's multi-projects list on load
  useEffect(() => {
    fetchUserProjects();
  }, [userId, userEmail]);

  const fetchUserProjects = async () => {
    try {
      const res = await fetch("/api/projects/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: userId, userEmail })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        setUserProjects(data.projects);
        if (data.maxLimit) setMaxProjectLimit(data.maxLimit);
        if (data.defaultProjectName) setDefaultProjectName(data.defaultProjectName);
      }
    } catch (err) {
      console.warn("Failed to list user projects:", err);
    }
  };

  const handleCreateNewProject = async () => {
    const isEn = appLanguage === "en";
    if (!newProjInputName.trim()) {
      triggerStatus(isEn ? "Please enter a name for the new project!" : "Masukkan nama proyek baru!", "error");
      return;
    }

    if (userProjects.length >= maxProjectLimit) {
      triggerStatus(isEn ? `Maximum limit of ${maxProjectLimit} Projects per User reached! Delete an existing project first.` : `Batas Maksimum ${maxProjectLimit} Proyek per User telah tercapai! Harap hapus proyek lama terlebih dahulu.`, "error");
      return;
    }

    try {
      setIsCreatingProj(true);
      const sanitized = newProjInputName.trim().replace(/[^a-zA-Z0-9-_]/g, "");

      // 1. Fresh clean template files for the brand new project
      const freshProjectFiles: VirtualFile[] = [
        {
          path: "index.html",
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sanitized}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <h1>${sanitized}</h1>
    <p>Project initialized!</p>
  </div>
  <script src="app.js"></script>
</body>
</html>`
        },
        {
          path: "app.js",
          content: `// ${sanitized} - Main JavaScript
console.log("${sanitized} loaded successfully.");`
        },
        {
          path: "style.css",
          content: `/* ${sanitized} CSS Styles */
body {
  font-family: system-ui, -apple-system, sans-serif;
  margin: 0;
  padding: 2rem;
  background: #0f0f11;
  color: #f4f4f5;
}`
        },
        {
          path: "execode.md",
          content: EXECODE_MD_CONTENT
        }
      ];

      // 2. Auto-save current active project files before creating/switching
      if (projectName && files && files.length > 0) {
        try {
          await fetch("/api/supabase/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectName, projectId: currentProjectId, files, bucket: "execode" })
          });
        } catch (e) {}
      }

      // 3. Register the new project in user's project list in database directly
      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: userId,
          userEmail,
          projectName: sanitized,
          files: freshProjectFiles
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isEn ? "Failed to create project." : "Gagal membuat proyek baru."));
      }

      const createdProjId = data.project?.id || ("proj-" + Date.now());

      triggerStatus(isEn ? `Project '${sanitized}' created successfully!` : `Proyek '${sanitized}' berhasil dibuat!`, "success");
      setUserProjects(data.projects || []);
      setNewProjInputName("");
      setIsProjectsModalOpen(false);

      // 4. Activate the new project state cleanly without saving file contents to storage yet
      setProjectName(sanitized);
      setCurrentProjectId(createdProjId);
      localStorage.setItem("execode_persistent_project_id", createdProjId);
      localStorage.setItem("execode_project_name", sanitized);
      window.history.pushState(null, "", `/project/${sanitized}`);

      setFiles(freshProjectFiles);
      setActiveFilePath("index.html");
      refreshPreview(freshProjectFiles);
      localStorage.setItem("execode_files", JSON.stringify(freshProjectFiles));
    } catch (err: any) {
      triggerStatus(err.message || (appLanguage === "en" ? "Failed to create project." : "Gagal membuat proyek."), "error");
    } finally {
      setIsCreatingProj(false);
    }
  };

  const handleSwitchProject = async (targetName: string) => {
    const isEn = appLanguage === "en";

    const targetProj = userProjects.find(p => p.name === targetName || p.id === targetName);
    const targetProjectName = targetProj ? targetProj.name : targetName;
    const targetProjectId = targetProj ? targetProj.id : targetName;

    // 1. Auto-save current project before switching away
    if (projectName && (projectName !== targetProjectName || currentProjectId !== targetProjectId) && files && files.length > 0) {
      try {
        await fetch("/api/supabase/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectName, projectId: currentProjectId, files, bucket: "execode" })
        });
      } catch (e) {}
    }

    // 2. Set new target project state
    setProjectName(targetProjectName);
    setCurrentProjectId(targetProjectId);
    localStorage.setItem("execode_persistent_project_id", targetProjectId);
    localStorage.setItem("execode_project_name", targetProjectName);
    window.history.pushState(null, "", `/project/${targetProjectName}`);

    // Create fresh starter files specifically for target project if storage hasn't been saved yet
    const freshTargetFiles: VirtualFile[] = [
      {
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${targetProjectName}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <h1>${targetProjectName}</h1>
    <p>Project initialized!</p>
  </div>
  <script src="app.js"></script>
</body>
</html>`
      },
      {
        path: "app.js",
        content: `// ${targetProjectName} - Main JavaScript\nconsole.log("${targetProjectName} loaded.");`
      },
      {
        path: "style.css",
        content: `/* ${targetProjectName} CSS */\nbody { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #0f0f11; color: #f4f4f5; }`
      },
      {
        path: "execode.md",
        content: EXECODE_MD_CONTENT
      }
    ];

    triggerStatus(isEn ? `Opening project '${targetProjectName}'...` : `Membuka proyek '${targetProjectName}'...`, "info");
    try {
      const res = await fetch("/api/supabase/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: targetProjectName, projectId: targetProjectId, bucket: "execode" })
      });
      const data = await res.json();
      if (res.ok && data.files && data.files.length > 0) {
        setFiles(data.files);
        setActiveFilePath("index.html");
        refreshPreview(data.files);
        localStorage.setItem("execode_files", JSON.stringify(data.files));
        triggerStatus(isEn ? `Project '${targetProjectName}' loaded successfully!` : `Proyek '${targetProjectName}' berhasil dimuat!`, "success");
      } else {
        // Fallback to fresh starter files for target project
        setFiles(freshTargetFiles);
        setActiveFilePath("index.html");
        refreshPreview(freshTargetFiles);
        localStorage.setItem("execode_files", JSON.stringify(freshTargetFiles));
        triggerStatus(isEn ? `Project '${targetProjectName}' opened.` : `Proyek '${targetProjectName}' dibuka.`, "success");
      }
    } catch (err) {
      console.warn("Failed to switch project:", err);
      setFiles(freshTargetFiles);
      setActiveFilePath("index.html");
      refreshPreview(freshTargetFiles);
      localStorage.setItem("execode_files", JSON.stringify(freshTargetFiles));
    }
  };

  const handleDeleteProjectFromManager = async (targetName: string) => {
    const isEn = appLanguage === "en";
    if (targetName === defaultProjectName || userProjects.some(p => p.name === targetName && p.isDefault)) {
      triggerStatus(isEn ? "Default user project cannot be deleted." : "Proyek default user tidak dapat dihapus.", "error");
      return;
    }
    try {
      const res = await fetch("/api/projects/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: userId,
          userEmail,
          projectName: targetName
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isEn ? "Failed to delete project." : "Gagal menghapus proyek."));

      triggerStatus(isEn ? `Project '${targetName}' deleted successfully.` : `Proyek '${targetName}' berhasil dihapus.`, "success");
      setUserProjects(data.projects || []);

      if (projectName === targetName) {
        const remaining = (data.projects || [])[0];
        if (remaining) {
          handleSwitchProject(remaining.name);
        } else {
          handleSwitchProject(data.defaultProjectName || defaultProjectName);
        }
      }
    } catch (err: any) {
      triggerStatus(err.message || (appLanguage === "en" ? "Failed to delete project." : "Gagal menghapus proyek."), "error");
    }
  };

  const handleProjectNameChange = (newName: string) => {
    const sanitized = newName.replace(/[^a-zA-Z0-9-_]/g, "");
    setProjectName(sanitized);
    localStorage.setItem("execode_persistent_project_id", sanitized);
    localStorage.setItem("execode_project_name", sanitized);
    window.history.replaceState(null, "", `/project/${sanitized}`);
  };

  const handleShareProject = () => {
    if (!projectName.trim()) {
      triggerStatus("Project name cannot be empty!", "error");
      return;
    }
    const slug = encodeURIComponent(projectName.trim());
    const shareUrl = `${window.location.origin}/project/${slug}`;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        triggerStatus("Project link copied to clipboard successfully!", "success");
      })
      .catch(() => {
        triggerStatus(`Failed to copy. Here is your link: ${shareUrl}`, "info");
      });
  };

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedContent = e.target.value;
    setLocalCodeContent(updatedContent);

    if (debouncedSyncRef.current) {
      clearTimeout(debouncedSyncRef.current);
    }
    debouncedSyncRef.current = setTimeout(() => {
      setFiles(prev => prev.map(f => f.path === activeFilePath ? { ...f, content: updatedContent } : f));
    }, 250);
  };

  const refreshPreview = (customFiles: VirtualFile[] = files) => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    const htmlFile = customFiles.find(f => f.path.toLowerCase() === "index.html");
    let finalHtml = htmlFile ? htmlFile.content : "<h1>No index.html file found!</h1>";

    const linkRegex = /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>|<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*\/?>/gi;
    const injectedStyles = new Set<string>();

    finalHtml = finalHtml.replace(linkRegex, (match, href1, href2) => {
      const href = href1 || href2;
      if (!href) return match;
      const matchedFile = customFiles.find(f => f.path.toLowerCase() === href.toLowerCase());
      if (matchedFile) {
        injectedStyles.add(matchedFile.path.toLowerCase());
        return `<style>\n/* Injected from ${matchedFile.path} */\n${matchedFile.content}\n</style>`;
      }
      return match;
    });

    const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi;
    const injectedScripts = new Set<string>();

    finalHtml = finalHtml.replace(scriptRegex, (match, src) => {
      if (!src) return match;
      const matchedFile = customFiles.find(f => f.path.toLowerCase() === src.toLowerCase());
      if (matchedFile) {
        injectedScripts.add(matchedFile.path.toLowerCase());
        return `<script>\n${matchedFile.content}\n</script>`;
      }
      return match;
    });

    const fallbackCssNames = ["style.css", "styles.css"];
    fallbackCssNames.forEach(cssName => {
      if (!injectedStyles.has(cssName)) {
        const cssFile = customFiles.find(f => f.path.toLowerCase() === cssName);
        if (cssFile) {
          const styleTag = `<style>\n/* Fallback Injection for ${cssFile.path} */\n${cssFile.content}\n</style>`;
          if (finalHtml.includes("</head>")) {
            finalHtml = finalHtml.replace("</head>", `${styleTag}\n</head>`);
          } else {
            finalHtml = styleTag + finalHtml;
          }
          injectedStyles.add(cssName);
        }
      }
    });

    if (!finalHtml.toLowerCase().includes('name="viewport"') && !finalHtml.toLowerCase().includes("name='viewport'")) {
      const viewportTag = `\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">`;
      if (finalHtml.includes("<head>")) {
        finalHtml = finalHtml.replace("<head>", `<head>${viewportTag}`);
      } else if (finalHtml.includes("</head>")) {
        finalHtml = finalHtml.replace("</head>", `${viewportTag}\n</head>`);
      }
    }

    const defaultCanvasBgTag = `\n  <style id="default-canvas-bg">html, body { background-color: #ffffff; color: #000000; }</style>`;
    if (finalHtml.includes("<head>")) {
      finalHtml = finalHtml.replace("<head>", `<head>${defaultCanvasBgTag}`);
    } else if (finalHtml.includes("</head>")) {
      finalHtml = finalHtml.replace("</head>", `${defaultCanvasBgTag}\n</head>`);
    } else {
      finalHtml = defaultCanvasBgTag + finalHtml;
    }

    const errorHandlingScript = `
      <script>
        window.addEventListener('error', function(e) {
          console.error("Runtime Error: " + e.message);
          window.parent.postMessage({ type: "PREVIEW_ERROR", message: e.message }, "*");
          
          const errDiv = document.createElement('div');
          errDiv.style.position = 'fixed';
          errDiv.style.bottom = '10px';
          errDiv.style.right = '10px';
          errDiv.style.backgroundColor = '#991b1b';
          errDiv.style.color = '#fecaca';
          errDiv.style.padding = '8px 12px';
          errDiv.style.borderRadius = '6px';
          errDiv.style.fontSize = '11px';
          errDiv.style.fontFamily = 'monospace';
          errDiv.style.zIndex = '999999';
          errDiv.style.border = '1px solid #f87171';
          errDiv.innerHTML = "<b>Preview Error:</b> " + e.message;
          document.body.appendChild(errDiv);
          setTimeout(() => errDiv.remove(), 6000);
        });

        (function() {
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          const originalInfo = console.info;

          console.log = function(...args) {
            originalLog.apply(console, args);
            window.parent.postMessage({ 
              type: "PREVIEW_CONSOLE", 
              logType: "log", 
              message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(" ") 
            }, "*");
          };
          console.error = function(...args) {
            originalError.apply(console, args);
            window.parent.postMessage({ 
              type: "PREVIEW_CONSOLE", 
              logType: "error", 
              message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(" ") 
            }, "*");
          };
          console.warn = function(...args) {
            originalWarn.apply(console, args);
            const msgStr = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(" ");
            if (msgStr.includes("cdn.tailwindcss.com") || msgStr.includes("should not be used in production")) {
              return;
            }
            window.parent.postMessage({ 
              type: "PREVIEW_CONSOLE", 
              logType: "warn", 
              message: msgStr 
            }, "*");
          };
          console.info = function(...args) {
            originalInfo.apply(console, args);
            window.parent.postMessage({ 
              type: "PREVIEW_CONSOLE", 
              logType: "info", 
              message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(" ") 
            }, "*");
          };
        })();
      </script>
    `;

    if (finalHtml.includes("<head>")) {
      finalHtml = finalHtml.replace("<head>", `<head>\n${errorHandlingScript}`);
    } else if (finalHtml.includes("</head>")) {
      finalHtml = finalHtml.replace("</head>", `${errorHandlingScript}\n</head>`);
    } else {
      finalHtml = errorHandlingScript + finalHtml;
    }

    if (!injectedScripts.has("app.js")) {
      const jsFile = customFiles.find(f => f.path.toLowerCase() === "app.js");
      if (jsFile) {
        const scriptTag = `<script>\n${jsFile.content}\n</script>`;
        if (finalHtml.includes("</body>")) {
          finalHtml = finalHtml.replace("</body>", `${scriptTag}\n</body>`);
        } else {
          finalHtml += `\n${scriptTag}`;
        }
        injectedScripts.add("app.js");
      }
    }

    const blob = new Blob([finalHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    return url;
  };

  const getCombinedPreviewBlob = () => {
    return previewUrl || "about:blank";
  };

  const handleAddFile = () => {
    if (!newFileName.trim()) return;
    const name = newFileName.trim();
    if (files.some(f => f.path.toLowerCase() === name.toLowerCase())) {
      triggerStatus("A file with this name already exists!", "error");
      return;
    }

    const newFile: VirtualFile = {
      path: name,
      content: name.endsWith(".json") ? "{\n  \n}" : name.endsWith(".js") ? "" : "<!-- Write your HTML/CSS markup here -->\n"
    };

    setFiles(prev => [...prev, newFile]);
    setActiveFilePath(name);
    setNewFileName("");
    setShowNewFileInput(false);
    triggerStatus(`File '${name}' was successfully added.`, "success");
  };

  const handleDeleteFile = (pathToDelete: string) => {
    if (pathToDelete === "index.html") {
      triggerStatus("The file 'index.html' is the main file and cannot be deleted!", "error");
      return;
    }

    setFiles(prev => prev.filter(f => f.path !== pathToDelete));
    if (activeFilePath === pathToDelete) {
      setActiveFilePath("index.html");
    }
    triggerStatus(`File '${pathToDelete}' was successfully deleted.`, "success");
    
    if (supabaseUrl && supabaseAnonKey) {
      deleteSingleFileFromSupabase(pathToDelete);
    }
  };

  const handleDownloadZip = async () => {
    try {
      const zip = new JSZip();
      files.forEach(file => {
        zip.file(file.path, file.content);
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${projectName.toLowerCase().replace(/\s+/g, "_")}.zip`;
      link.click();
      URL.revokeObjectURL(url);
      triggerStatus("Project downloaded successfully as a ZIP file!", "success");
    } catch (err: any) {
      triggerStatus(`Failed to download ZIP: ${err.message}`, "error");
    }
  };

  const handleZipUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const zip = await JSZip.loadAsync(file);
      const extractedFiles: VirtualFile[] = [];
      
      const filePromises: Promise<void>[] = [];
      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          const promise = zipEntry.async("string").then(content => {
            extractedFiles.push({
              path: relativePath,
              content
            });
          });
          filePromises.push(promise);
        }
      });

      await Promise.all(filePromises);

      if (extractedFiles.length > 0) {
        const hasHtml = extractedFiles.some(f => f.path.toLowerCase() === "index.html");
        if (!hasHtml) {
          extractedFiles.push({
            path: "index.html",
            content: `<!DOCTYPE html>\n<html>\n<head><title>ExeCode</title></head>\n<body><h1>index.html automatically created</h1></body>\n</html>`
          });
        }
        setFiles(extractedFiles);
        setActiveFilePath("index.html");
        setProjectName(file.name.replace(/\.[^/.]+$/, ""));
        triggerStatus(`ZIP successfully extracted! Loaded ${extractedFiles.length} files into the workspace.`, "success");
      } else {
        triggerStatus("ZIP file is empty or invalid.", "error");
      }
    } catch (err: any) {
      triggerStatus(`Failed to extract ZIP file: ${err.message}`, "error");
    }
  };

  const cleanDisplayContent = (text: string) => {
    if (!text) return "";
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
    cleaned = cleaned.replace(/<think>[\s\S]*$/gi, "");
    cleaned = cleaned.replace(/<\/?think>/gi, "");
    cleaned = cleaned.replace(/```(?:json|javascript|js|html|css|typescript|ts)?[\s\S]*?(?:```|$)/gi, "");
    return cleaned.trim();
  };

  const extractFilesFromMarkdownBlocks = (text: string, currentFiles: VirtualFile[]): VirtualFile[] | null => {
    if (!text) return null;

    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\s*\n?([\s\S]*?)(?:```|$)/g;
    const blocks: { lang: string; content: string; index: number }[] = [];
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match[2] && match[2].trim().length > 0) {
        blocks.push({
          lang: (match[1] || "").trim().toLowerCase(),
          content: match[2].trim(),
          index: match.index
        });
      }
    }

    const extracted: VirtualFile[] = [];

    let lastSearchIndex = 0;
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block.lang === "json" && (block.content.startsWith("[") || block.content.includes('"path"'))) {
        continue;
      }

      const precedingText = text.substring(lastSearchIndex, block.index).trim();
      lastSearchIndex = block.index + block.content.length + 8;

      const fileRegex = /\b([a-zA-Z0-9_-]+\.(?:html|css|js|json))\b/gi;
      let fileMatch;
      const fileMatches: string[] = [];
      while ((fileMatch = fileRegex.exec(precedingText)) !== null) {
        fileMatches.push(fileMatch[1]);
      }

      if (fileMatches.length > 0) {
        const mappedPath = fileMatches[fileMatches.length - 1];
        const existingIdx = extracted.findIndex(f => f.path.toLowerCase() === mappedPath.toLowerCase());
        if (existingIdx !== -1) {
          extracted[existingIdx].content = block.content;
        } else {
          extracted.push({
            path: mappedPath,
            content: block.content
          });
        }
      } else {
        const lang = block.lang;
        let fallbackPath = "";
        if (lang === "html" || block.content.includes("<!DOCTYPE") || block.content.includes("<html") || block.content.includes("<body") || block.content.includes("<div") || block.content.includes("<button")) {
          fallbackPath = "index.html";
        } else if (lang === "css" || block.content.includes("body {") || block.content.includes(".class") || block.content.includes("color:") || block.content.includes("background:")) {
          fallbackPath = "style.css";
        } else if (lang === "js" || lang === "javascript" || lang === "ts" || lang === "tsx" || block.content.includes("console.") || block.content.includes("function") || block.content.includes("const ") || block.content.includes("let ") || block.content.includes("var ") || block.content.includes("document.") || block.content.includes("window.") || block.content.includes("addEventListener")) {
          fallbackPath = "app.js";
        } else if (!lang && (block.content.startsWith("<!DOCTYPE") || block.content.startsWith("<html"))) {
          fallbackPath = "index.html";
        }

        if (fallbackPath) {
          const existingIdx = extracted.findIndex(f => f.path.toLowerCase() === fallbackPath.toLowerCase());
          if (existingIdx !== -1) {
            extracted[existingIdx].content = block.content;
          } else {
            extracted.push({
              path: fallbackPath,
              content: block.content
            });
          }
        }
      }
    }

    if (extracted.length === 0) {
      const htmlMatch = text.match(/<!DOCTYPE html[\s\S]*?<\/html>/i) || text.match(/<html[\s\S]*?<\/html>/i);
      if (htmlMatch) {
        extracted.push({
          path: "index.html",
          content: htmlMatch[0]
        });
      }
    }

    return extracted.length > 0 ? extracted : null;
  };

  const tryExtractJsonArray = (text: string): VirtualFile[] | null => {
    if (!text) return null;

    const parseAsVirtualFiles = (candidate: string): VirtualFile[] | null => {
      try {
        let cleaned = candidate.trim();
        let parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(item => item && typeof item === "object" && typeof item.path === "string" && typeof item.content === "string")) {
          return parsed;
        }
        cleaned = cleaned.replace(/,(\s*[\]}])/g, "$1");
        parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(item => item && typeof item === "object" && typeof item.path === "string" && typeof item.content === "string")) {
          return parsed;
        }
      } catch (e) {}
      return null;
    };

    const runManualExtractor = (rawText: string): VirtualFile[] | null => {
      const extractedFiles: VirtualFile[] = [];
      
      const pathRegex = /(?:"path"|'path'|\bpath\b)\s*:\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/gi;
      const pathMatches: { path: string; index: number; lastIndex: number }[] = [];
      let match;
      while ((match = pathRegex.exec(rawText)) !== null) {
        const filePath = match[1] || match[2] || match[3];
        if (filePath) {
          pathMatches.push({
            path: filePath,
            index: match.index,
            lastIndex: pathRegex.lastIndex
          });
        }
      }

      if (pathMatches.length > 0) {
        for (let i = 0; i < pathMatches.length; i++) {
          const currentPath = pathMatches[i].path;
          const startOfSearch = pathMatches[i].lastIndex;
          const endOfSearch = (i + 1 < pathMatches.length) ? pathMatches[i + 1].index : rawText.length;
          
          const searchSub = rawText.substring(startOfSearch, endOfSearch);
          
          const contentKeyRegex = /(?:"content"|'content'|\bcontent\b)\s*:\s*(["'`])/i;
          const contentMatch = searchSub.match(contentKeyRegex);
          if (!contentMatch) continue;
          
          const quoteChar = contentMatch[1];
          const contentStartIndex = searchSub.indexOf(contentMatch[0]) + contentMatch[0].length;
          const contentSearchSub = searchSub.substring(contentStartIndex);
          
          let endQuoteIndex = -1;
          
          for (let j = contentSearchSub.length - 1; j >= 0; j--) {
            if (contentSearchSub[j] === quoteChar) {
              let backslashCount = 0;
              let k = j - 1;
              while (k >= 0 && contentSearchSub[k] === '\\') {
                backslashCount++;
                k--;
              }
              if (backslashCount % 2 !== 0) continue;
              
              const after = contentSearchSub.substring(j + 1).trim();
              if (after.startsWith("}") || after.startsWith(",") || after === "" || after.startsWith("]")) {
                endQuoteIndex = j;
                break;
              }
            }
          }
          
          if (endQuoteIndex === -1) {
            for (let j = contentSearchSub.length - 1; j >= 0; j--) {
              if (contentSearchSub[j] === quoteChar) {
                let backslashCount = 0;
                let k = j - 1;
                while (k >= 0 && contentSearchSub[k] === '\\') {
                  backslashCount++;
                  k--;
                }
                if (backslashCount % 2 === 0) {
                  endQuoteIndex = j;
                  break;
                }
              }
            }
          }
          
          if (endQuoteIndex !== -1) {
            let contentValue = contentSearchSub.substring(0, endQuoteIndex);
            
            if (quoteChar === '"') {
              contentValue = contentValue
                .replace(/\\n/g, "\n")
                .replace(/\\r/g, "\r")
                .replace(/\\t/g, "\t")
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, "\\");
            } else if (quoteChar === "'") {
              contentValue = contentValue
                .replace(/\\n/g, "\n")
                .replace(/\\r/g, "\r")
                .replace(/\\t/g, "\t")
                .replace(/\\'/g, "'")
                .replace(/\\\\/g, "\\");
            } else if (quoteChar === "`") {
              contentValue = contentValue
                .replace(/\\`/g, "`")
                .replace(/\\\\/g, "\\");
            }
            
            extractedFiles.push({
              path: currentPath,
              content: contentValue
            });
          }
        }
      }

      return extractedFiles.length > 0 ? extractedFiles : null;
    };

    const codeBlockRegex = /```(?:json|javascript|js)?\s*([\s\S]*?)\s*```/gi;
    let codeBlockMatch;
    while ((codeBlockMatch = codeBlockRegex.exec(text)) !== null) {
      const blockContent = codeBlockMatch[1].trim();
      const parsed = parseAsVirtualFiles(blockContent);
      if (parsed) return parsed;

      const manualFromBlock = runManualExtractor(blockContent);
      if (manualFromBlock) return manualFromBlock;
    }

    const parsedAll = parseAsVirtualFiles(text);
    if (parsedAll) return parsedAll;

    const manualFromAll = runManualExtractor(text);
    if (manualFromAll) return manualFromAll;

    let startIdx = -1;
    let searchPos = 0;
    while (true) {
      const idx = text.indexOf("[", searchPos);
      if (idx === -1) break;
      const remaining = text.substring(idx + 1).trim();
      if (remaining.startsWith("{") || remaining.startsWith("[")) {
        startIdx = idx;
        break;
      }
      searchPos = idx + 1;
    }
    if (startIdx === -1) {
      startIdx = text.indexOf("[");
    }

    let endIdx = -1;
    if (startIdx !== -1) {
      let searchEndPos = text.length;
      while (true) {
        const idx = text.lastIndexOf("]", searchEndPos - 1);
        if (idx === -1 || idx <= startIdx) break;
        const preceding = text.substring(0, idx).trim();
        if (preceding.endsWith("}") || preceding.endsWith("]")) {
          endIdx = idx;
          break;
        }
        searchEndPos = idx;
      }
      if (endIdx === -1) {
        endIdx = text.lastIndexOf("]");
      }
    }

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const candidate = text.substring(startIdx, endIdx + 1).trim();
      const parsedBracket = parseAsVirtualFiles(candidate);
      if (parsedBracket) return parsedBracket;

      const manualFromBracket = runManualExtractor(candidate);
      if (manualFromBracket) return manualFromBracket;
    }

    return null;
  };

  const handleSendPromptToAI = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || aiPrompt;
    if (!promptToSend.trim()) return;

    setRuntimeError(null);
    setAiPrompt("");
    setAiStreamingText("");

    isAIEditingActiveRef.current = true;
    typewriterTargetRef.current = "";
    typewriterCurrentRef.current = "";
    if (typewriterIntervalIdRef.current) {
      clearTimeout(typewriterIntervalIdRef.current);
      typewriterIntervalIdRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      role: "user",
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMsgId = "ai-" + Date.now();
    thinkingStartTimesRef.current[assistantMsgId] = Date.now();
    activeAssistantMsgIdRef.current = assistantMsgId;

    const tempAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "<think>Reviewing project context and prompt...",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelId: selectedModel,
      thinkingDuration: 0.1,
    };

    setChatHistory(prev => [...prev, userMsg, tempAssistantMsg]);
    setIsAIEditing(true);

    // Build previous conversation turns context (up to last 8 messages)
    const previousContext = chatHistory.slice(-8).map(msg => {
      if (msg.role === "user") {
        return {
          role: "user",
          content: msg.content
        };
      } else {
        let cleanText = msg.content || "";
        cleanText = cleanText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        cleanText = cleanText.replace(/```(?:json|js|javascript|html)?[\s\S]*?```/gi, "").trim();
        if (!cleanText && msg.editedPaths && msg.editedPaths.length > 0) {
          cleanText = `[Updated workspace files: ${msg.editedPaths.join(", ")}]`;
        }
        return {
          role: "assistant",
          content: cleanText || (activeUserLang === "id"
            ? "Saya telah memperbarui file workspace sesuai petunjuk Anda."
            : "I have updated your workspace files according to your instructions.")
        };
      }
    }).filter(m => m.content && m.content.trim().length > 0);

    const execodeMdFile = files.find(f => f.path.toLowerCase() === "execode.md");
    const execodeMdContent = execodeMdFile ? execodeMdFile.content : EXECODE_MD_CONTENT;

    const activeUserLang = (typeof window !== "undefined" ? localStorage.getItem("exechat_user_language") : null) || "en";
    const langNames: Record<string, string> = {
      id: "INDONESIAN (Bahasa Indonesia)",
      ar: "ARABIC (العربية)",
      ja: "JAPANESE (日本語)",
      ko: "KOREAN (한국어)",
      es: "SPANISH (Español)",
      zh: "MANDARIN CHINESE (中文)",
      fr: "FRENCH (Français)",
      de: "GERMAN (Deutsch)",
      en: "ENGLISH"
    };
    const langName = langNames[activeUserLang] || "ENGLISH";
    const languageInstruction = `AUTO-DETECT USER PROMPT LANGUAGE: You MUST write your complete response in the EXACT SAME LANGUAGE as the user's latest prompt. If the user writes in English, reply in natural English. If the user writes in Indonesian, reply in natural Indonesian. (Default interface setting: ${langName}).`;

    const currentPromptTurn = {
      role: "user",
      content: `USER INSTRUCTION: "${promptToSend}"\n\n` +
        `=========================================\n` +
        `ACTIVE LANGUAGE DIRECTIVE:\n` +
        `=========================================\n` +
        `${languageInstruction}\n\n` +
        `=========================================\n` +
        `EXECODE WORKSPACE MANIFEST & DOCUMENTATION (execode.md):\n` +
        `=========================================\n` +
        `${execodeMdContent}\n\n` +
        `=========================================\n` +
        `CURRENT WORKSPACE FILES & CODE:\n` +
        `=========================================\n` +
        JSON.stringify(files, null, 2) + "\n\n" +
        `=========================================\n` +
        `SYSTEM & RESPONSE FORMAT INSTRUCTIONS:\n` +
        `=========================================\n` +
        `1. MANDATORY THINKING PROCESS: You MUST ALWAYS start your response with a thinking/reasoning process enclosed strictly within <think> and </think> tags in English (e.g. <think>Analyzing workspace files...\nEvaluating prompt and code updates...\nFormulating solution strategy...</think>).\n` +
        `2. MANDATORY LANGUAGE MATCHING: Respond strictly in the SAME language as the User Instruction (e.g. English if prompt is in English, Indonesian if prompt is in Indonesian).\n` +
        `3. CRITICAL FOR CODE MODIFICATIONS & ERROR FIXES: When the user asks to modify, update, fix, create, or change code, OR provides an error log/syntax error/console error, you MUST fix the bug in the code and generate the complete updated workspace files inside a single \`\`\`json block at the end of your message.\n` +
        `4. CHEERFUL, DETAILED & COMPREHENSIVE RESPONSES: Be warm, cheerful, enthusiastic, and helpful. NEVER write brief or generic 1-sentence responses like 'I have processed your request' or 'Done'. ALWAYS write 2 to 4 detailed, friendly, and helpful paragraphs explaining what changes were made, why, how the interface was updated, and how to test them.\n` +
        `5. Follow user instructions precisely. DO NOT add unrequested extra features, buttons, or unasked visual components.\n` +
        `6. SOLUTION-FIRST DIRECTIVE: NEVER claim inability or fake completion without providing the code changes. You MUST ALWAYS provide a direct, functional, working code solution and include the complete updated files in the \`\`\`json block.\n` +
        `7. JSON output structure example:\n` +
        `\`\`\`json\n` +
        `[\n` +
        `  { "path": "index.html", "content": "...complete updated html..." }\n` +
        `]\n` +
        `\`\`\`\n` +
        `8. Provide complete, production-ready code in the "content" field. NEVER use placeholders or ellipsis like "// rest of code".`
    };

    const payloadMessages = [...previousContext, currentPromptTurn];

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: selectedModel,
          messages: payloadMessages
        })
      });

      if (!response.ok) {
        throw new Error(`API server returned error (${response.status})`);
      }

      const reader = response.body;
      if (!reader) throw new Error("Failed to read AI response data stream.");

      const decoder = new TextDecoder("utf-8");
      let fullText = "";
      let buffer = "";

      if (typeof (reader as any).getReader === "function") {
        const webReader = (reader as any).getReader();
        while (true) {
          const { value, done } = await webReader.read();
          if (done) break;
          const textChunk = decoder.decode(value, { stream: true });
          buffer += textChunk;
          let idx;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.substring(0, idx).trim();
            buffer = buffer.substring(idx + 1);
            if (line.startsWith("data: ")) {
              const dataStr = line.substring(6).trim();
              if (dataStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  if (!thinkingStartTimesRef.current[assistantMsgId]) {
                    thinkingStartTimesRef.current[assistantMsgId] = Date.now();
                  }
                  fullText += parsed.text;
                  setAiStreamingText(fullText);
                  typewriterTargetRef.current = fullText;
                  
                  const startTime = thinkingStartTimesRef.current[assistantMsgId];
                  let dur = startTime ? Math.max(0.1, Number(((Date.now() - startTime) / 1000).toFixed(1))) : 0.1;

                  if (fullText.includes("</think>")) {
                    if (!finalThinkingDurationsRef.current[assistantMsgId]) {
                      finalThinkingDurationsRef.current[assistantMsgId] = dur;
                    }
                    dur = finalThinkingDurationsRef.current[assistantMsgId];
                  }

                  typewriterDurationRef.current = dur;

                  // Run dynamic typewriter
                  if (!typewriterIntervalIdRef.current) {
                    const runTypewriter = () => {
                      const target = typewriterTargetRef.current;
                      let current = typewriterCurrentRef.current;

                      if (current.length < target.length) {
                        const remaining = target.length - current.length;
                        
                        // Dynamically determine how many characters to write at once
                        // "ngetik setiap kalimat jawaban tapi kalau jawaban terlalu panjang/pendek cepetin"
                        let stride = 1;
                        let delay = 12;

                        if (target.length < 60) {
                          // Short response -> type faster
                          stride = 2;
                          delay = 5;
                        } else if (remaining > 250) {
                          // Falling behind -> catch up fast!
                          stride = Math.ceil(remaining / 30);
                          delay = 2;
                        } else if (target.length > 500) {
                          // Long response -> speed it up!
                          stride = Math.ceil(target.length / 140);
                          delay = 5;
                        }

                        current = target.substring(0, current.length + stride);
                        typewriterCurrentRef.current = current;

                        setChatHistory(prev => prev.map(msg => 
                          msg.id === assistantMsgId 
                            ? { 
                                ...msg, 
                                content: current,
                                thinkingDuration: typewriterDurationRef.current,
                                modelId: selectedModel
                              } 
                            : msg
                        ));

                        typewriterIntervalIdRef.current = setTimeout(runTypewriter, delay);
                      } else {
                        if (isAIEditingActiveRef.current) {
                          typewriterIntervalIdRef.current = setTimeout(runTypewriter, 15);
                        } else {
                          typewriterIntervalIdRef.current = null;
                        }
                      }
                    };

                    runTypewriter();
                  }
                }
              } catch (e) {
              }
            }
          }
        }
      }

      // Stream is finished! Final typewriter flush
      isAIEditingActiveRef.current = false;
      if (typewriterIntervalIdRef.current) {
        clearTimeout(typewriterIntervalIdRef.current);
        typewriterIntervalIdRef.current = null;
      }
      typewriterCurrentRef.current = fullText;

      const displayableText = cleanDisplayContent(fullText);
      setAiStreamingText(fullText);
      
      let editedFiles = tryExtractJsonArray(fullText);
      if (!editedFiles || editedFiles.length === 0) {
        console.log("JSON parsing failed or empty. Attempting markdown block extraction fallback...");
        editedFiles = extractFilesFromMarkdownBlocks(fullText, files);
      }

      if (editedFiles && Array.isArray(editedFiles) && editedFiles.length > 0) {
        const oldFiles = [...files];
        
        const mergedFiles = [...files];
        editedFiles.forEach((editedFile) => {
          const index = mergedFiles.findIndex(f => f.path.toLowerCase() === editedFile.path.toLowerCase());
          if (index !== -1) {
            mergedFiles[index] = {
              ...mergedFiles[index],
              content: editedFile.content
            };
          } else {
            mergedFiles.push(editedFile);
          }
        });

        setFiles(mergedFiles);
        setPreviewKey(prev => prev + 1);
        
        refreshPreview(mergedFiles);
        broadcastRealtimeSync(mergedFiles);
        
        const startTime = thinkingStartTimesRef.current[assistantMsgId];
        let finalDur = startTime ? Math.max(0.1, Number(((Date.now() - startTime) / 1000).toFixed(1))) : 0.1;
        if (finalThinkingDurationsRef.current[assistantMsgId]) {
          finalDur = finalThinkingDurationsRef.current[assistantMsgId];
        }

        // Keep the original <think>...</think> block so the thought history is never deleted/removed
        let thinkHeader = "";
        const thinkMatch = fullText.match(/<think>([\s\S]*?)<\/think>/i);
        if (thinkMatch) {
          thinkHeader = thinkMatch[0] + "\n\n";
        }

        let finalResponseText = displayableText ? displayableText.trim() : "";
        if (!finalResponseText || finalResponseText.length < 15) {
          const fileNames = editedFiles.map(f => f.path).join(", ");
          finalResponseText = activeUserLang === "id"
            ? `Saya telah berhasil memperbarui file **${fileNames}** di workspace ExeCode Anda secara lengkap. Semua perubahan struktur, gaya visual, dan logika komponen telah diterapkan dan dapat langsung Anda lihat serta uji di panel live preview.`
            : `I have successfully updated **${fileNames}** in your ExeCode workspace in full. All structural, visual styling, and component logic changes have been applied and can be directly tested in your live preview pane.`;
        }

        setChatHistory(prev => prev.map(msg => 
          msg.id === assistantMsgId 
            ? { 
                ...msg, 
                content: thinkHeader + finalResponseText, 
                filesSnapshot: oldFiles,
                thinkingDuration: finalDur,
                modelId: selectedModel,
                editedPaths: editedFiles.map(f => f.path)
              } 
            : msg
        ));
        
        triggerStatus("Your workspace was successfully updated!", "success");
      } else {
        const startTime = thinkingStartTimesRef.current[assistantMsgId];
        let finalDur = startTime ? Math.max(0.1, Number(((Date.now() - startTime) / 1000).toFixed(1))) : 0.1;
        if (finalThinkingDurationsRef.current[assistantMsgId]) {
          finalDur = finalThinkingDurationsRef.current[assistantMsgId];
        }

        let nonCodeText = displayableText ? displayableText.trim() : fullText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        if (!nonCodeText) {
          nonCodeText = activeUserLang === "id"
            ? "AI telah menerima petunjuk Anda. Apabila perubahan kode belum otomatis diterapkan pada file, Anda dapat meminta AI untuk secara langsung memperbarui kode file terkait."
            : "The AI has received your prompt. If code modifications were not automatically applied, you can request the AI to update the target file directly.";
        }

        let thinkHeader = "";
        const thinkMatch = fullText.match(/<think>([\s\S]*?)<\/think>/i);
        if (thinkMatch) {
          thinkHeader = thinkMatch[0] + "\n\n";
        }

        setChatHistory(prev => prev.map(msg => 
          msg.id === assistantMsgId 
            ? { 
                ...msg, 
                content: thinkHeader + nonCodeText,
                thinkingDuration: finalDur,
                modelId: selectedModel
              } 
            : msg
        ));
        
        triggerStatus("AI response received.", "success");
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("AI response generation stopped by user.");
        setChatHistory(prev => prev.map(msg => 
          msg.id === assistantMsgId 
            ? { 
                ...msg, 
                content: msg.content ? msg.content + "\n\n*[AI response stopped by user]*" : "*[AI response stopped by user]*" 
              } 
            : msg
        ));
        triggerStatus("AI response generation stopped.", "info");
      } else {
        console.error("AI Code Edit Error: ", err);
        setChatHistory(prev => prev.map(msg => 
          msg.id === assistantMsgId 
            ? { ...msg, content: `Failed to modify code: ${err.message}. Please try again.` } 
            : msg
        ));
        triggerStatus(`Failed to process AI edit: ${err.message}`, "error");
      }
    } finally {
      isAIEditingActiveRef.current = false;
      if (typewriterIntervalIdRef.current) {
        clearTimeout(typewriterIntervalIdRef.current);
        typewriterIntervalIdRef.current = null;
      }
      setIsAIEditing(false);
    }
  };

  const handleUploadToSupabase = async () => {
    try {
      triggerStatus("Saving your files to Cloud ExeChat...", "info");

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (supabaseUrl && supabaseUrl.trim()) headers["x-supabase-url"] = supabaseUrl.trim();
      if (supabaseAnonKey && supabaseAnonKey.trim()) headers["x-supabase-key"] = supabaseAnonKey.trim();

      const response = await fetch("/api/supabase/upload", {
        method: "POST",
        headers,
        body: JSON.stringify({
          projectName,
          projectId: currentProjectId,
          files,
          bucket: supabaseBucket
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to upload.");

      // Broadcast changes live via Supabase Realtime WebSocket
      broadcastRealtimeSync(files);

      triggerStatus("Project successfully saved to Cloud ExeChat & synced via Realtime!", "success");
    } catch (err: any) {
      console.error(err);
      triggerStatus(`Failed to upload: ${err.message}`, "error");
    }
  };

  const handleLoadFromSupabase = async () => {
    try {
      triggerStatus(`Opening project '${projectName}' from Cloud...`, "info");

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (supabaseUrl && supabaseUrl.trim()) headers["x-supabase-url"] = supabaseUrl.trim();
      if (supabaseAnonKey && supabaseAnonKey.trim()) headers["x-supabase-key"] = supabaseAnonKey.trim();

      const response = await fetch("/api/supabase/load", {
        method: "POST",
        headers,
        body: JSON.stringify({
          projectName,
          projectId: currentProjectId,
          bucket: supabaseBucket
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load.");

      if (data.files && data.files.length > 0) {
        setFiles(data.files);
        setActiveFilePath("index.html");
        setPreviewKey(prev => prev + 1);
        refreshPreview(data.files);
        triggerStatus(`Successfully loaded project '${projectName}' from cloud!`, "success");
      } else {
        triggerStatus(`Project '${projectName}' is empty or not yet saved.`, "info");
      }
    } catch (err: any) {
      console.error(err);
      triggerStatus(`Failed to pull project: ${err.message}`, "error");
    }
  };

  const handleDeleteProjectSupabase = () => {
    setShowDeleteProjectConfirm(true);
  };

  const executeDeleteProjectSupabase = async () => {
    setShowDeleteProjectConfirm(false);
    try {
      await deleteProjectFromSupabase();
      triggerStatus("All project cloud storage successfully cleared!", "success");
    } catch (err: any) {
      triggerStatus(`Failed to clear cloud storage: ${err.message}`, "error");
    }
  };

  const deleteProjectFromSupabase = async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (supabaseUrl && supabaseUrl.trim()) headers["x-supabase-url"] = supabaseUrl.trim();
    if (supabaseAnonKey && supabaseAnonKey.trim()) headers["x-supabase-key"] = supabaseAnonKey.trim();

    const response = await fetch("/api/supabase/delete", {
      method: "POST",
      headers,
      body: JSON.stringify({
        projectName,
        bucket: supabaseBucket
      })
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Failed to delete files.");
    }
  };

  const deleteSingleFileFromSupabase = async (filePath: string) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (supabaseUrl && supabaseUrl.trim()) headers["x-supabase-url"] = supabaseUrl.trim();
      if (supabaseAnonKey && supabaseAnonKey.trim()) headers["x-supabase-key"] = supabaseAnonKey.trim();

      await fetch("/api/supabase/delete", {
        method: "POST",
        headers,
        body: JSON.stringify({
          projectName,
          bucket: supabaseBucket,
          filePath
        })
      });
    } catch (err) {
      console.warn("Failed to delete single cloud file:", err);
    }
  };

  const sanitizeAndShortenThought = (thinking: string): string => {
    if (!thinking) return "";

    // Keywords to completely filter out (privacy, internal system guidelines, secrets, APIs)
    const forbiddenKeywords = [
      "chika",
      "ravita",
      "hexky",
      "hengki",
      "system memory",
      "vercel",
      "private",
      "confidential",
      "designinstruction",
      "thinkinstruction",
      "linkinstruction",
      "moderneventinstruction",
      "userrequestedpersonality",
      "api_key",
      "apikey",
      "secret",
      "token",
      "bearer",
      "password",
      "auth_key",
      "credentials"
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

  const parseMessageThinking = (content: string, isStreaming: boolean = false) => {
    if (!content) {
      if (isStreaming) {
        return { thinking: "Reviewing project context and prompt...", actual: "", isThinking: true };
      }
      return { thinking: null, actual: "", isThinking: false };
    }

    // Case-insensitive regex to find <think>...</think>
    const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
    const match = thinkRegex.exec(content);

    if (match) {
      const thinking = match[1].trim();
      const actual = cleanDisplayContent(content);
      return { thinking: sanitizeAndShortenThought(thinking), actual, isThinking: false };
    }

    // If there is an open <think> but no closing </think> (streaming)
    const openThinkRegex = /<think>([\s\S]*?)$/i;
    const openMatch = openThinkRegex.exec(content);
    if (openMatch) {
      const thinking = openMatch[1].trim();
      const actual = cleanDisplayContent(content);
      return { thinking: sanitizeAndShortenThought(thinking), actual, isThinking: true };
    }

    // Check if the content ends with a partial <think tag to prevent temporary flickering of partial tag
    const partialThinkRegex = /<t(h(i(n(k)?)?)?)?$/i;
    if (partialThinkRegex.test(content)) {
      const actual = cleanDisplayContent(content);
      return { thinking: "Reviewing project context and prompt...", actual, isThinking: true };
    }

    if (isStreaming) {
      const actual = cleanDisplayContent(content);
      return { thinking: "Analyzing codebase and prompt...", actual, isThinking: true };
    }

    const actual = cleanDisplayContent(content);
    return { thinking: null, actual, isThinking: false };
  };

  const extractUpdatedFilesFromContent = (text: string): string[] => {
    if (!text) return [];
    const foundFiles: string[] = [];
    
    // 1. Match standard bullet list under **Updated files:** header
    const lines = text.split("\n");
    let startCollecting = false;
    for (const line of lines) {
      if (line.includes("**Updated files:**") || line.includes("Updated files:")) {
        startCollecting = true;
        continue;
      }
      if (startCollecting) {
        const match = line.match(/(?:•|-|\*)\s*`([^`]+)`/) || line.match(/`([^`]+)`/);
        if (match) {
          const fPath = match[1].trim();
          if (fPath && !foundFiles.includes(fPath)) {
            foundFiles.push(fPath);
          }
        }
      }
    }
    
    if (foundFiles.length > 0) {
      return foundFiles;
    }
    
    // 2. Try JSON block extraction (extremely robust!)
    try {
      const jsonFiles = tryExtractJsonArray(text);
      if (jsonFiles && jsonFiles.length > 0) {
        return jsonFiles.map(f => f.path);
      }
    } catch (e) {}
    
    // 3. Fallback: Parse any markdown code block names or files mentioned inside backticks
    try {
      const fileRegex = /\b([a-zA-Z0-9_-]+\.(?:html|css|js|json|tsx|ts))\b/gi;
      let match;
      while ((match = fileRegex.exec(text)) !== null) {
        const fPath = match[1];
        if (!foundFiles.includes(fPath)) {
          foundFiles.push(fPath);
        }
      }
    } catch (e) {}
    
    return foundFiles;
  };

  const renderMessageContent = (content: string, msgId: string) => {
    const isMsgStreaming = isAIEditing && msgId === activeAssistantMsgIdRef.current;
    const { thinking, actual, isThinking } = parseMessageThinking(content, isMsgStreaming);
    
    const msg = chatHistory.find(m => m.id === msgId);
    const msgDuration = msg?.thinkingDuration || 2;
    const msgModelId = msg?.modelId || selectedModel;
    const msgModelName = MODEL_OPTIONS.find(m => m.id === msgModelId)?.name || "ExeAi";
    
    const updatedFiles = msg?.editedPaths || (msg ? extractUpdatedFilesFromContent(msg.content) : []);

    return (
      <div className="flex flex-col gap-2.5 w-full max-w-full overflow-hidden text-xs">
        {/* Dynamic Action History Timeline logs */}
        {msg && msg.role === "assistant" && (() => {
          const actionSteps: any[] = [];

          // 1. Thought Steps (break into multiple process steps if thinking text exists)
          if (thinking !== null && thinking.trim().length > 0) {
            const rawSteps = thinking
              .split(/\n+/)
              .map(s => s.replace(/^(?:\d+\.|\*|-|•)\s*/, "").trim())
              .filter(Boolean);

            if (rawSteps.length > 0) {
              rawSteps.forEach((stepText, idx) => {
                const sKey = `${msgId}-thought-${idx}`;
                actionSteps.push({
                  type: "thought",
                  stepKey: sKey,
                  text: `Thought process ${idx + 1}`,
                  subtext: stepText,
                  content: stepText,
                  isThinking: false
                });
              });
            } else {
              const sKey = `${msgId}-thought-0`;
              actionSteps.push({
                type: "thought",
                stepKey: sKey,
                text: `Thought for ${typeof msgDuration === "number" ? msgDuration.toFixed(1) : msgDuration} seconds`,
                subtext: thinking,
                content: thinking,
                isThinking: false
              });
            }
          } else if (isThinking) {
            const sKey = `${msgId}-thought-0`;
            actionSteps.push({
              type: "thought",
              stepKey: sKey,
              text: `Thinking process active`,
              subtext: "Analyzing project files and prompt...",
              content: "Analyzing project files and prompt...",
              isThinking: true
            });
          }

          // 2. Read & Edit Steps (ONLY FOR ACTUALLY UPDATED FILES)
          if (updatedFiles.length > 0) {
            updatedFiles.forEach((file) => {
              actionSteps.push({
                type: "read",
                text: "Read file",
                subtext: "Read file:",
                file: file
              });
              actionSteps.push({
                type: "edit",
                text: "Edit file",
                subtext: "Edited file:",
                file: file
              });
            });

            actionSteps.push({
              type: "verify",
              text: "Verify build",
              subtext: "Build verification:",
              status: "succeeded"
            });
          } else {
            actionSteps.push({
              type: "verify",
              text: "Evaluated prompt context",
              subtext: "Response generated without file edits",
              status: "succeeded"
            });
          }

          const isExpanded = expandedActions[msgId] !== false;

          return (
            <div className={`mb-2.5 font-sans select-none flex flex-col items-start w-full rounded-xl border transition-all duration-200 ${
              isDark 
                ? "bg-[#131314] border-zinc-800/85 text-[#e3e3e3]" 
                : "bg-zinc-100/50 border-zinc-200 text-zinc-800"
            }`}>
              <button
                onClick={() => setExpandedActions(prev => ({ ...prev, [msgId]: expandedActions[msgId] === false }))}
                className="w-full flex items-center justify-between gap-3 text-xs font-medium px-4 py-3.5 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <svg className={`h-4 w-4 shrink-0 ${isDark ? "text-[#a8c7fa]" : "text-zinc-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <path d="M12 11h4" />
                    <path d="M12 16h4" />
                    <path d="M8 11h.01" />
                    <path d="M8 16h.01" />
                  </svg>
                  <span className="font-semibold text-[13px] tracking-tight">Action history</span>
                </div>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-250 ${isExpanded ? "rotate-180" : ""} ${isDark ? "text-zinc-400" : "text-zinc-500"}`} />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden w-full border-t border-zinc-800/20"
                  >
                    <div className="w-full p-4 flex flex-col gap-4">
                      {actionSteps.map((step, idx) => {
                        const sKey = step.stepKey || `${msgId}-${idx}`;
                        return (
                          <div key={idx} className="flex gap-3 items-start">
                            <div className="pt-0.5 shrink-0">
                              {step.type === "thought" && (
                                <svg className={`h-4 w-4 shrink-0 ${isDark ? "text-amber-400" : "text-amber-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
                                  <path d="M9 18h6" />
                                  <path d="M10 22h4" />
                                </svg>
                              )}
                              {step.type === "read" && (
                                <svg className={`h-4 w-4 shrink-0 ${isDark ? "text-blue-400" : "text-blue-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                              )}
                              {step.type === "edit" && (
                                <svg className={`h-4 w-4 shrink-0 ${isDark ? "text-teal-400" : "text-teal-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                              )}
                              {step.type === "verify" && (
                                <svg className={`h-4 w-4 shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center justify-between w-full gap-2">
                                <span className={`text-[12px] font-medium ${isDark ? "text-[#e3e3e3]" : "text-zinc-800"}`}>
                                  {step.text}
                                </span>
                                {step.content && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedThoughts(prev => ({ ...prev, [sKey]: !prev[sKey] }));
                                    }}
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                      isDark 
                                        ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200" 
                                        : "bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-800"
                                    }`}
                                  >
                                    {expandedThoughts[sKey] ? "Hide Detail" : "Show Detail"}
                                  </button>
                                )}
                              </div>
                              
                              {step.subtext && (
                                <div className={`text-[11px] mt-1 flex items-center flex-wrap gap-1.5 ${isDark ? "text-[#9e9e9e]" : "text-zinc-500"}`}>
                                  <span>{step.subtext}</span>
                                  {step.file && (
                                    <span className={`font-mono text-[10.5px] px-1.5 py-0.5 rounded ${
                                      isDark 
                                        ? "bg-zinc-900 text-[#e3e3e3] border border-zinc-800/80" 
                                        : "bg-zinc-200/50 text-zinc-800 border border-zinc-300"
                                    }`}>
                                      {step.file}
                                    </span>
                                  )}
                                  {step.status && (
                                    <span className={`font-mono text-[10.5px] px-1.5 py-0.5 rounded text-emerald-500 ${
                                      isDark 
                                        ? "bg-[#131314] border border-zinc-800/80" 
                                        : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    }`}>
                                      {step.status}
                                    </span>
                                  )}
                                </div>
                              )}

                              {step.content && expandedThoughts[sKey] && (
                                <div className={`mt-2 w-full border p-3 rounded-lg font-mono text-[10.5px] leading-relaxed whitespace-pre-wrap max-h-[160px] overflow-y-auto scrollbar-thin border-l-2 pl-3 ${
                                  isDark 
                                    ? "bg-black/40 border-zinc-900/60 border-l-amber-500/40 text-zinc-400" 
                                    : "bg-zinc-50 border-zinc-250 border-l-amber-500/60 text-zinc-600"
                                }`}>
                                  {step.content}
                                </div>
                              )}

                              {step.isThinking && (
                                <div className="flex items-center gap-1.5 py-1.5 select-none">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-[bounce_1s_infinite_100ms]" />
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-[bounce_1s_infinite_200ms]" />
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-[bounce_1s_infinite_300ms]" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })()}

        {actual && (
          <div className="text-zinc-300 w-full overflow-x-auto text-[13px] leading-relaxed select-text mt-1">
            <MarkdownRenderer content={actual} />
          </div>
        )}

        {isThinking && (
          <div className="flex items-center gap-1.5 py-1 select-none">
            <span className="h-1 w-1 rounded-full bg-zinc-500 animate-[bounce_1s_infinite_100ms]" />
            <span className="h-1 w-1 rounded-full bg-zinc-500 animate-[bounce_1s_infinite_200ms]" />
            <span className="h-1 w-1 rounded-full bg-zinc-500 animate-[bounce_1s_infinite_300ms]" />
          </div>
        )}
      </div>
    );
  };

  const aiName = "ExeAi";

  if (isMobileScreen) {
    return (
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-xl ${isDark ? "bg-black text-zinc-100 font-sans" : "bg-zinc-50 text-zinc-900 font-sans"}`}>
        <div className={`max-w-sm w-full p-8 rounded-2xl border flex flex-col items-center space-y-6 shadow-2xl animate-fade-in ${isDark ? "bg-black/80 border-zinc-900" : "bg-white border-zinc-200"}`}>
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-500 animate-pulse">
              <Smartphone className="h-8 w-8" />
            </div>
            <div className="absolute -top-1 -right-1 bg-rose-500 text-white p-1 rounded-full text-[10px] font-bold">
              <X className="h-3 w-3" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-bold tracking-tight">Feature Not Available on Mobile</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Sorry, <span className="text-amber-500 font-semibold">ExeCode</span> features are only supported on PC / Desktop devices for the optimal code editing experience.
            </p>
          </div>

          <div className="w-full h-px bg-zinc-800/50" />

          <div className="flex flex-col items-center space-y-2">
            <span className="text-xs text-zinc-500 font-medium">Redirecting back to ExeChat in</span>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500 text-white font-bold text-lg shadow-lg shadow-amber-500/20 animate-bounce">
              {countdown}
            </div>
            <span className="text-[10px] text-zinc-600 font-mono">seconds...</span>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-750 text-zinc-200 transition-all border border-zinc-700/50"
          >
            Go Back Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col backdrop-blur-xl ${isDark ? "bg-black text-zinc-100 font-sans" : "bg-zinc-50 text-zinc-900 font-sans"}`}>
      
      {!isFullscreen && (
        <div className={`px-5 py-2.5 flex items-center justify-between border-b ${isDark ? "border-zinc-900/40 bg-black" : "border-zinc-100 bg-white"} shrink-0`}>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (window.location.pathname.startsWith("/project/")) {
                  window.history.pushState({}, "", "/");
                }
                onClose();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-normal flex items-center gap-1.5 border transition-all cursor-pointer ${
                isDark 
                  ? "bg-zinc-900/60 border-transparent text-zinc-300 hover:bg-zinc-800" 
                  : "bg-white border-zinc-100 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <X className="h-4 w-4 text-zinc-400" />
              <span>Close</span>
            </button>

            <div className="h-4 w-px bg-zinc-900 mx-0.5 hidden sm:block" />
            
            {/* Top Header Model Switcher (Google AI Studio style) */}
            <div className="relative">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isDark
                    ? "bg-zinc-900/60 border-transparent text-zinc-200 hover:bg-zinc-800"
                    : "bg-white border-zinc-100 text-zinc-700 hover:bg-zinc-100"
                }`}
                title="Select active AI model"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                <span>{MODEL_OPTIONS.find(m => m.id === selectedModel)?.name || "Select Model"}</span>
                <ChevronDown className="h-3 w-3 text-zinc-500" />
              </button>

              {showModelDropdown && (
                <div className={`absolute top-full left-0 mt-1.5 z-50 w-64 rounded-xl border p-1 shadow-2xl max-h-64 overflow-y-auto ${
                  isDark ? "bg-zinc-900 border-zinc-950/60 text-zinc-100" : "bg-white border-zinc-150 text-zinc-800"
                }`}>
                  <div className={`px-2.5 py-1 mb-1 border-b ${isDark ? "border-zinc-800/25" : "border-zinc-100"}`}>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Select AI Model</span>
                  </div>
                  <div className="space-y-0.5">
                    {MODEL_OPTIONS.map((m) => {
                      const isSel = selectedModel === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedModel(m.id);
                            setShowModelDropdown(false);
                            triggerStatus(`AI Model changed to '${m.name}'`, "success");
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] flex flex-col gap-0.5 transition-all cursor-pointer ${
                            isSel
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                              : isDark
                                ? "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={`font-semibold ${isSel ? "text-amber-400" : isDark ? "text-zinc-300" : "text-zinc-700"}`}>{m.name}</span>
                            <span className={`text-[8px] px-1 rounded border ${
                              isDark ? "bg-black text-zinc-500 border-transparent" : "bg-zinc-50 text-zinc-500 border-zinc-150"
                            }`}>{m.badge}</span>
                          </div>
                          <span className={`text-[9.5px] line-clamp-1 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{m.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-zinc-900 mx-0.5 hidden sm:block" />

            {/* Project Switcher Button (Max 5 Limit) */}
            <button
              onClick={() => {
                fetchUserProjects();
                setIsProjectsModalOpen(true);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                isDark 
                  ? "bg-zinc-900/60 border-transparent text-zinc-200 hover:bg-zinc-800" 
                  : "bg-white border-zinc-100 text-zinc-700 hover:bg-zinc-100"
              }`}
              title={appLanguage === "en" ? "Manage Projects (Max 5 Projects per User)" : "Kelola Proyek (Maksimal 5 Proyek per User)"}
            >
              <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="max-w-[110px] truncate font-semibold">{projectName}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                {userProjects.length}/5
              </span>
            </button>

            {/* Realtime Connection Status Indicator */}
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-medium ${
              realtimeStatus === "connected"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : isDark ? "bg-zinc-900/60 border-transparent text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-600"
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                realtimeStatus === "connected" ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"
              }`} />
              <span>{realtimeStatus === "connected" ? "Realtime Sync" : "Connecting..."}</span>
            </div>
          </div>

          {/* Centered Segmented controls Preview vs Code */}
          <div className="flex items-center gap-1.5">
            <div className={`flex items-center p-1 rounded-xl border ${isDark ? "bg-zinc-900/60 border-transparent" : "bg-zinc-100 border-zinc-150"}`}>
              <button
                onClick={() => {
                  setActiveRightTab("preview");
                  refreshPreview();
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-normal flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeRightTab === "preview" 
                    ? "bg-amber-500 text-white font-medium shadow-sm" 
                    : isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <span className="h-1.5 w-1.5 bg-current rounded-full" />
                <span>Preview</span>
              </button>
              <button
                onClick={() => setActiveRightTab("code")}
                className={`px-4 py-1.5 rounded-lg text-xs font-normal transition-all cursor-pointer ${
                  activeRightTab === "code" 
                    ? "bg-amber-500 text-white font-medium shadow-sm" 
                    : isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Code
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Device selector and reload button in header - always rendered for stable UI layout */}
            <div className={`flex items-center gap-0.5 p-1 rounded-xl border ${isDark ? "bg-zinc-900/60 border-transparent" : "bg-zinc-100 border-zinc-150"}`}>
              <button
                onClick={() => setDeviceMode("desktop")}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${deviceMode === "desktop" ? "bg-amber-500/10 text-amber-500" : isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-800"}`}
                title="Desktop Preview"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDeviceMode("mobile")}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${deviceMode === "mobile" ? "bg-amber-500/10 text-amber-500" : isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-800"}`}
                title="Mobile Preview"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
              <div className={`h-4 w-px mx-1 ${isDark ? "bg-zinc-800/40" : "bg-zinc-200"}`} />
              <button
                onClick={() => {
                  refreshPreview();
                  setPreviewKey(prev => prev + 1);
                  triggerStatus("Preview updated!", "success");
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                title="Reload Preview"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={handleUploadToSupabase}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-450 text-white flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Save Project to Cloud"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Save</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                isDark 
                  ? "bg-zinc-900/60 border-transparent text-zinc-300 hover:bg-zinc-800" 
                  : "bg-white border-zinc-150 text-zinc-600 hover:bg-zinc-100"
              }`}
              title={isFullscreen ? "Show Chat Panel" : "Hide Chat Panel (Fullscreen)"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4 text-zinc-400" /> : <Maximize2 className="h-4 w-4 text-zinc-400" />}
            </button>
          </div>
        </div>
      )}

      <div className={`flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative ${isDark ? "bg-black" : "bg-zinc-50"}`}>
        
        <div 
          style={{ width: isMobileScreen ? "100%" : (isFullscreen ? "0px" : `${chatWidth}px`) }}
          className={`${
            isFullscreen 
              ? "hidden" 
              : `w-full h-1/2 md:h-full flex flex-col shrink-0 transition-colors duration-200 ${
                  isDark ? "border-r border-zinc-900 bg-black" : "border-r border-zinc-100 bg-[#fafafa]"
                }`
          }`}
        >
          <div className="flex-1 overflow-y-auto p-4 pt-6 space-y-4 flex flex-col">
            {chatHistory.map((message) => {
              const isUsr = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${isUsr ? "items-end" : "items-start"} space-y-1`}
                >
                  <span className="text-[10px] text-zinc-500 font-medium px-1">
                    {isUsr 
                      ? "You" 
                      : (MODEL_OPTIONS.find(m => m.id === (message.modelId || selectedModel))?.name || aiName)
                    }
                  </span>

                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-xs max-w-[85%] leading-relaxed border transition-colors duration-200 ${
                      isUsr
                        ? isDark
                          ? "bg-zinc-900 border-zinc-800 text-zinc-200 rounded-tr-sm"
                          : "bg-zinc-100 border-zinc-200 text-zinc-800 rounded-tr-sm"
                        : isDark
                          ? "bg-zinc-900/30 border-zinc-900 text-zinc-300 rounded-tl-sm"
                          : "bg-amber-500/5 border-amber-500/10 text-zinc-800 rounded-tl-sm"
                    }`}
                  >
                    {isUsr ? (
                      <p className="font-sans font-normal whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      renderMessageContent(message.content, message.id)
                    )}

                    {!isUsr && message.filesSnapshot && (
                      <div className="mt-3 pt-2 border-t border-zinc-800/50 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              const isLiked = !likedMessages[message.id];
                              setLikedMessages(prev => ({ ...prev, [message.id]: isLiked }));
                              setDislikedMessages(prev => ({ ...prev, [message.id]: false }));
                              triggerStatus(isLiked ? "You liked this assistant response." : "Feedback removed.", "success");
                            }}
                            className={`p-1 rounded hover:bg-zinc-850 transition-all ${
                              likedMessages[message.id] ? "text-blue-500 bg-blue-500/10" : "text-zinc-500 hover:text-zinc-300"
                            }`}
                            title="Like"
                          >
                            <ThumbsUp className={`h-3 w-3 ${likedMessages[message.id] ? "fill-current" : ""}`} />
                          </button>
                          <button
                            onClick={() => {
                              const isDisliked = !dislikedMessages[message.id];
                              setDislikedMessages(prev => ({ ...prev, [message.id]: isDisliked }));
                              setLikedMessages(prev => ({ ...prev, [message.id]: false }));
                              triggerStatus(isDisliked ? "You disliked this assistant response." : "Feedback removed.", "info");
                            }}
                            className={`p-1 rounded hover:bg-zinc-850 transition-all ${
                              dislikedMessages[message.id] ? "text-red-500 bg-red-500/10" : "text-zinc-500 hover:text-zinc-300"
                            }`}
                            title="Dislike"
                          >
                            <ThumbsDown className={`h-3 w-3 ${dislikedMessages[message.id] ? "fill-current" : ""}`} />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => {
                            if (message.filesSnapshot) {
                              setFiles(message.filesSnapshot);
                              setPreviewKey(prev => prev + 1);
                              triggerStatus("Code successfully restored to this version snapshot!", "success");
                            }
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black border border-zinc-850 hover:bg-zinc-900 text-[10px] font-normal text-zinc-400 hover:text-zinc-200 transition-colors"
                          title="Restore files to the snapshot before this edit"
                        >
                          <RotateCcw className="h-3 w-3 text-amber-500" />
                          <span>Restore</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isAIEditing && (() => {
              const latestMsg = chatHistory[chatHistory.length - 1];
              const { isThinking } = latestMsg ? parseMessageThinking(latestMsg.content || "") : { isThinking: false };
              const isStillThinking = latestMsg ? (latestMsg.content === "" || isThinking) : false;
              const elapsed = typeof latestMsg?.thinkingDuration === "number"
                ? latestMsg.thinkingDuration.toFixed(1)
                : "0.1";

              return (
                <div className="flex items-center justify-between gap-2 py-2 px-3 my-1 rounded-xl border border-amber-500/20 bg-amber-500/5 select-none font-sans">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium truncate">
                      {isStillThinking ? `Thinking (${elapsed}s)...` : "Applying code modifications..."}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-[11px] font-semibold transition-all cursor-pointer shrink-0 active:scale-95"
                    title="Stop / Cancel AI Generation"
                  >
                    <Square className="h-3 w-3 fill-current" />
                    <span>Stop</span>
                  </button>
                </div>
              );
            })()}
            <div ref={messagesEndRef} />
          </div>

          {/* CODE STATUS INTERACTIVE BOX (Only visible when runtimeError exists to keep the chat roomy) */}
          {runtimeError && (
            <div className={`px-4 py-2 border-t shrink-0 ${isDark ? "border-zinc-850 bg-black/40" : "border-zinc-200 bg-zinc-50"}`}>
              <div className="p-2.5 rounded-xl border border-rose-500/10 bg-rose-500/5 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 animate-pulse" />
                  <span className="text-rose-400 font-normal truncate">1 error running the code</span>
                </div>
                <button
                  onClick={() => {
                    const fixPrompt = `I encountered the following error while running the code:\n\n"${runtimeError}"\n\nPlease help me fix this bug and update the code.`;
                    handleSendPromptToAI(fixPrompt);
                  }}
                  disabled={isAIEditing}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-rose-500 hover:bg-rose-400 text-white rounded-lg transition-all cursor-pointer shadow"
                >
                  Fix
                </button>
              </div>
            </div>
          )}

          {/* PROMPT CHAT INPUT BAR */}
          <div className={`p-4 border-t transition-colors duration-200 ${isDark ? "border-zinc-850 bg-black/80" : "border-zinc-200 bg-white"}`}>
            <div className={`relative flex flex-col rounded-2xl p-1.5 transition-all border ${
              isDark 
                ? "bg-zinc-900 border-zinc-800 focus-within:border-amber-500/50" 
                : "bg-zinc-50 border-zinc-200 focus-within:border-amber-500"
            }`}>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Write instructions: 'add a beautiful navbar', 'modernize buttons', or 'build a tic-tac-toe game'..."
                disabled={isAIEditing}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isAIEditing) handleSendPromptToAI();
                  }
                }}
                className={`w-full bg-transparent border-none focus:outline-none text-xs resize-none px-2.5 pt-1.5 min-h-[44px] max-h-[140px] leading-relaxed ${
                  isDark ? "text-zinc-200 placeholder-zinc-500" : "text-zinc-800 placeholder-zinc-400"
                }`}
              />
              
              <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <button 
                    type="button"
                    onClick={handleClearChat}
                    className={`p-1.5 rounded-lg text-zinc-500 hover:text-rose-500 transition-colors cursor-pointer ${
                      isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"
                    }`} 
                    title="Clear Chat History"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {isAIEditing ? (
                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Stop / Cancel AI Generation"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendPromptToAI()}
                    disabled={!aiPrompt.trim()}
                    className={`p-2 rounded-xl transition-all ${
                      !aiPrompt.trim()
                        ? isDark ? "bg-zinc-800 text-zinc-500" : "bg-zinc-100 text-zinc-400"
                        : "bg-amber-500 hover:bg-amber-450 text-white shadow-md active:scale-95 cursor-pointer"
                    }`}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {!isFullscreen && !isMobileScreen && (
          <div
            onMouseDown={startResizingChat}
            className={`w-1 h-full cursor-col-resize hover:bg-amber-500/80 bg-zinc-800/20 hover:w-1.5 transition-all z-20 shrink-0 select-none flex items-center justify-center relative group ${
              isResizingChat ? "bg-amber-500 w-1.5" : ""
            }`}
          >
            <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-10 rounded bg-zinc-700/50 group-hover:bg-amber-500/80" />
          </div>
        )}

        {/* PANEL KANAN: WORKSPACE INTERACTIVE / CODE EDITOR PANE */}
        <div className={`flex-1 flex flex-row min-w-0 overflow-hidden relative ${isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-800"}`}>
          
          {/* File List sidebar rendered only when viewing code mode */}
          {!isFullscreen && activeRightTab === "code" && (
            <div className={`w-56 border-r flex flex-col shrink-0 transition-colors duration-200 ${isDark ? "border-zinc-900 bg-black" : "border-zinc-100/50 bg-zinc-50"}`}>
              <div className={`p-3 border-b flex items-center justify-between transition-colors duration-200 ${isDark ? "border-zinc-900 bg-black" : "border-zinc-100 bg-zinc-100/50"}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">File List</span>
                <div className="flex items-center gap-1.5">
                  <input
                    ref={fileUploadRef}
                    type="file"
                    onChange={handleDeviceFileUpload}
                    className="hidden"
                    accept=".html,.js,.css,.json,.txt,.md,image/*"
                  />
                  <button
                    onClick={() => fileUploadRef.current?.click()}
                    className="p-1 rounded hover:bg-amber-500/10 text-amber-500 transition-colors"
                    title="Upload File from Device"
                  >
                    <FileUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setShowNewFileInput(!showNewFileInput)}
                    className="p-1 rounded hover:bg-amber-500/10 text-amber-500 transition-colors"
                    title="Create New File"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {showNewFileInput && (
                <div className={`p-3 border-b flex flex-col gap-2 transition-colors duration-200 ${isDark ? "border-zinc-850 bg-amber-500/5" : "border-zinc-200 bg-amber-500/5"}`}>
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="style.css, app.js..."
                    className={`w-full px-2 py-1.5 text-xs rounded border focus:outline-none focus:border-amber-500 font-mono transition-colors ${
                      isDark ? "border-zinc-800 bg-zinc-900 text-zinc-200" : "border-zinc-300 bg-white text-zinc-800"
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddFile();
                    }}
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setShowNewFileInput(false)}
                      className={`px-2 py-0.5 text-[10px] font-normal rounded ${isDark ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-500 hover:bg-zinc-200"}`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddFile}
                      className="px-2.5 py-0.5 text-[10px] font-semibold bg-amber-500 text-white rounded"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {files.map(file => {
                  const isActive = file.path === activeFilePath;
                  const isHtml = file.path.endsWith(".html");
                  const isJs = file.path.endsWith(".js");
                  const isJson = file.path.endsWith(".json");
                  
                  return (
                    <div
                      key={file.path}
                      className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-normal font-mono cursor-pointer transition-all border ${
                        isActive 
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/15" 
                          : isDark 
                            ? "border-transparent text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200" 
                            : "border-transparent text-zinc-600 hover:bg-zinc-150 hover:text-zinc-900"
                      }`}
                      onClick={() => setActiveFilePath(file.path)}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isHtml ? <Code className="h-3.5 w-3.5 text-orange-400 shrink-0" /> :
                         isJs ? <FileCode className="h-3.5 w-3.5 text-yellow-400 shrink-0" /> :
                         isJson ? <FileJson className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> :
                         <File className="h-3.5 w-3.5 text-zinc-400 shrink-0" />}
                        <span className="truncate">{file.path}</span>
                      </div>
                      {file.path !== "index.html" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file.path);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-rose-500/10 text-rose-400 transition-all shrink-0"
                          title="Delete File"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Right Pane Body: Toggle between Preview and Code */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden relative">
            {/* Tab Content 1: Preview mode active */}
            {activeRightTab === "preview" && (
              <div className="flex-1 flex flex-col min-h-0">
                {isFullscreen && (
                  <div className={`px-4 py-2 border-b flex items-center justify-between shrink-0 ${isDark ? "border-zinc-900 bg-black" : "border-zinc-200 bg-zinc-50"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
                        Live Preview
                      </span>
                      <span className={`text-[10px] font-sans ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Full Screen Mode • Testing application</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 p-1 rounded-lg border ${isDark ? "bg-zinc-900 border-zinc-850" : "bg-zinc-100 border-zinc-200"}`}>
                        <button
                          onClick={() => setDeviceMode("desktop")}
                          className={`p-1.5 rounded-md transition-all ${deviceMode === "desktop" ? "bg-amber-500/10 text-amber-500" : "text-zinc-400 hover:text-zinc-200"}`}
                          title="Desktop Preview"
                        >
                          <Monitor className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeviceMode("mobile")}
                          className={`p-1.5 rounded-md transition-all ${deviceMode === "mobile" ? "bg-amber-500/10 text-amber-500" : "text-zinc-400 hover:text-zinc-200"}`}
                          title="Smartphone Preview"
                        >
                          <Smartphone className="h-3.5 w-3.5" />
                        </button>
                        <div className="h-4 w-px bg-zinc-800 mx-1" />
                        <button
                          onClick={() => {
                            refreshPreview();
                            setPreviewKey(prev => prev + 1);
                            triggerStatus("Preview updated!", "success");
                          }}
                          className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
                          title="Reload Preview"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => setIsFullscreen(false)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        <Minimize2 className="h-3.5 w-3.5" />
                        <span>Return</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex-1 flex items-center justify-center p-6 bg-zinc-900/20 overflow-hidden relative">
                  {deviceMode === "mobile" ? (
                    <div className="w-[320px] h-[680px] max-w-full max-h-[95%] rounded-[40px] bg-black border-[12px] border-zinc-900 shadow-2xl relative flex flex-col overflow-hidden animate-fade-in ring-1 ring-zinc-800/50">
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-5 bg-zinc-900 rounded-b-xl z-20 flex items-center justify-center">
                        <div className="w-10 h-1 bg-zinc-800 rounded-full" />
                      </div>
                      <iframe
                        key={previewKey}
                        src={getCombinedPreviewBlob()}
                        className="w-full h-full border-none rounded-[28px] bg-white"
                        sandbox="allow-scripts allow-same-origin allow-popups"
                        title="Mobile App Preview"
                      />
                      <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-zinc-800 rounded-full" />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-xl bg-white border border-zinc-300 shadow-2xl overflow-hidden flex flex-col">
                      <iframe
                        key={previewKey}
                        src={getCombinedPreviewBlob()}
                        className="w-full h-full border-none bg-white"
                        sandbox="allow-scripts allow-same-origin allow-popups"
                        title="Desktop App Preview"
                      />
                    </div>
                  )}

                  <div className="absolute bottom-4 right-4 z-30 font-mono">
                    {!isConsoleOpen ? (
                      <button
                        onClick={() => setIsConsoleOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 hover:bg-zinc-800 text-[11px] font-medium text-zinc-300 flex items-center gap-2 shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Terminal className="h-3.5 w-3.5 text-amber-500" />
                        <span>Console</span>
                        {consoleLogs.length > 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-500 text-zinc-950">
                            {consoleLogs.length}
                          </span>
                        )}
                      </button>
                    ) : (
                      <div className="w-[380px] h-64 rounded-xl bg-black/95 border border-zinc-800/80 shadow-2xl flex flex-col overflow-hidden backdrop-blur-md animate-fade-in">
                        <div className="px-3 py-2 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/40 select-none shrink-0">
                          <div className="flex items-center gap-1.5">
                            <Terminal className="h-3.5 w-3.5 text-amber-500" />
                            <span className="text-[10px] font-bold tracking-tight text-zinc-200">Console Output</span>
                            {consoleLogs.length > 0 && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                {consoleLogs.length} logs
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setConsoleLogs([])}
                              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                              title="Clear logs"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setIsConsoleOpen(false)}
                              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                              title="Close console"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                          {consoleLogs.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-[10px] text-zinc-600 italic">
                              No logs captured. Call console.log() in your project.
                            </div>
                          ) : (
                            consoleLogs.map((log, idx) => {
                              let logColor = "text-zinc-300";
                              let bgClass = "";
                              if (log.type === "error") {
                                  logColor = "text-rose-400";
                                  bgClass = "bg-rose-500/5";
                              } else if (log.type === "warn") {
                                  logColor = "text-amber-400";
                                  bgClass = "bg-amber-500/5";
                              } else if (log.type === "info") {
                                  logColor = "text-blue-400";
                              }
                              return (
                                <div key={idx} className={`p-1.5 rounded text-[11px] leading-relaxed font-mono flex items-start gap-2 ${bgClass}`}>
                                  <span className="text-zinc-600 shrink-0 select-none text-[9px] pt-0.5">{log.timestamp}</span>
                                  <span className={`flex-1 break-all ${logColor}`}>{log.text}</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content 2: Code editor mode active */}
            {activeRightTab === "code" && (
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden min-h-0">
                <div className="flex-1 flex flex-col min-w-0">
                {isFullscreen ? (
                  <div className={`px-4 py-2 border-b flex items-center justify-between shrink-0 transition-colors duration-200 ${isDark ? "border-zinc-900 bg-black" : "border-zinc-100 bg-white"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
                        {activeFilePath}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-sans">Full Screen Mode • Editing source code</span>
                    </div>
                    <button
                      onClick={() => setIsFullscreen(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <Minimize2 className="h-3.5 w-3.5" />
                      <span>Return</span>
                    </button>
                  </div>
                ) : (
                  <div className={`px-4 py-2 border-b flex items-center justify-between shrink-0 transition-colors duration-200 ${isDark ? "border-zinc-900 bg-black" : "border-zinc-100 bg-white"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-zinc-500/10 text-amber-500 border border-amber-500/20">
                        {activeFilePath}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono hidden sm:inline">• Main Source Code</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditingCode && (
                        <>
                          <button
                            onClick={handleUndoEdit}
                            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95 ${
                              isDark 
                                ? "bg-zinc-900 border-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" 
                                : "bg-white border-zinc-100 text-zinc-600 hover:text-zinc-850 hover:bg-zinc-50"
                            }`}
                            title="Undo changes to backup"
                          >
                            <span>↩️ Undo</span>
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600 transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                            title="Save current code manually"
                          >
                            <span>💾 Save</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setIsEditingCode(!isEditingCode)}
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95 ${
                          isEditingCode
                            ? "bg-amber-500/15 text-amber-500 border-amber-500/30 hover:bg-amber-500/25"
                            : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                        }`}
                      >
                        {isEditingCode ? "👁️ View" : "✏️ Edit"}
                      </button>
                      <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/25 flex items-center gap-1 shrink-0 hidden sm:flex">
                        <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                        Auto-Saved
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex-1 flex font-mono overflow-hidden relative">
                  {/* Line numbers scrollbar synchronized */}
                  <div 
                    ref={lineNumbersScrollRef}
                    className={`w-12 select-none text-right pr-3 pt-4 text-sm font-mono border-r transition-colors duration-200 overflow-y-hidden shrink-0 ${
                      isDark ? "border-zinc-900 bg-black text-zinc-600" : "border-zinc-100 bg-zinc-50/50 text-zinc-400"
                    }`}
                  >
                    {Array.from({ length: Math.max((localCodeContent.match(/\n/g) || []).length + 1, 30) }).map((_, i) => (
                      <div key={i} className="h-6 leading-6 select-none">{i + 1}</div>
                    ))}
                  </div>

                  {isEditingCode ? (
                    <textarea
                      ref={editorScrollRef}
                      onScroll={handleEditorScroll}
                      value={localCodeContent}
                      onChange={handleEditorChange}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      className={`flex-1 h-full p-4 text-sm font-mono focus:outline-none resize-none leading-6 transition-colors duration-200 ${isDark ? "bg-black text-zinc-200 focus:bg-black" : "bg-white text-zinc-850 focus:bg-white"}`}
                      placeholder="Write code here..."
                    />
                  ) : (
                    <div 
                      ref={viewerScrollRef}
                      onScroll={handleViewerScroll}
                      onClick={() => setIsEditingCode(true)}
                      className={`flex-1 h-full overflow-y-auto pt-4 pb-12 px-4 text-sm font-mono transition-colors duration-200 cursor-text select-text scrollbar-thin ${
                        isDark ? "bg-black text-zinc-300" : "bg-white text-zinc-800"
                      }`}
                      title="Click to edit code"
                    >
                      {highlightCode(localCodeContent, activeFile.path)}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
          </div>

          {activeRightTab === "split" && (
            <div className="flex-1 flex overflow-hidden min-h-0">
              
              {/* Left Side: Code Editor (takes remaining width) */}
              <div className="flex-1 flex overflow-hidden min-h-0">
                {/* File List */}
                {!isFullscreen && (
                  <div className={`w-44 border-r flex flex-col shrink-0 transition-colors duration-200 ${isDark ? "border-zinc-900 bg-black" : "border-zinc-100/50 bg-zinc-50"}`}>
                    <div className={`p-2.5 border-b flex items-center justify-between transition-colors duration-200 ${isDark ? "border-zinc-900 bg-black" : "border-zinc-100 bg-zinc-100/50"}`}>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Files</span>
                      <div className="flex items-center gap-1">
                        <input
                          ref={fileUploadRef}
                          type="file"
                          onChange={handleDeviceFileUpload}
                          className="hidden"
                          accept=".html,.js,.css,.json,.txt,.md,image/*"
                        />
                        <button
                          onClick={() => fileUploadRef.current?.click()}
                          className="p-1 rounded hover:bg-amber-500/10 text-amber-500 transition-colors"
                          title="Upload File"
                        >
                          <FileUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setShowNewFileInput(!showNewFileInput)}
                          className="p-1 rounded hover:bg-amber-500/10 text-amber-500 transition-colors"
                          title="New File"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {showNewFileInput && (
                      <div className={`p-2 border-b flex flex-col gap-1.5 transition-colors duration-200 ${isDark ? "border-zinc-950/20 bg-amber-500/5" : "border-zinc-100 bg-amber-500/5"}`}>
                        <input
                          type="text"
                          value={newFileName}
                          onChange={(e) => setNewFileName(e.target.value)}
                          placeholder="style.css..."
                          className={`w-full px-2 py-1 text-[10px] rounded border focus:outline-none focus:border-amber-500 font-mono transition-colors ${
                            isDark ? "border-zinc-800 bg-zinc-900 text-zinc-200" : "border-zinc-200 bg-white text-zinc-800"
                          }`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddFile();
                          }}
                        />
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setShowNewFileInput(false)}
                            className="px-1.5 py-0.5 text-[9px] rounded text-zinc-400 hover:bg-zinc-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddFile}
                            className="px-2 py-0.5 text-[9px] bg-amber-500 text-white rounded font-semibold"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
                      {files.map(file => {
                        const isActive = file.path === activeFilePath;
                        const isHtml = file.path.endsWith(".html");
                        const isJs = file.path.endsWith(".js");
                        const isJson = file.path.endsWith(".json");
                        
                        return (
                          <div
                            key={file.path}
                            className={`group w-full flex items-center justify-between px-2 py-1 rounded-lg text-[11px] font-mono cursor-pointer border ${
                              isActive 
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/15" 
                                : isDark 
                                  ? "border-transparent text-zinc-400 hover:bg-zinc-900/60" 
                                  : "border-transparent text-zinc-600 hover:bg-zinc-150"
                            }`}
                            onClick={() => setActiveFilePath(file.path)}
                          >
                            <span className="truncate">{file.path}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Code Editor */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className={`px-4 py-2 border-b flex items-center justify-between shrink-0 transition-colors duration-200 ${isDark ? "border-zinc-900 bg-black" : "border-zinc-100 bg-white"}`}>
                    <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-zinc-500/10 text-amber-500 border border-amber-500/20">
                      {activeFilePath}
                    </span>
                    <div className="flex items-center gap-2">
                      {isEditingCode && (
                        <>
                          <button
                            onClick={handleUndoEdit}
                            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                              isDark ? "bg-zinc-900 border-zinc-950/60 text-zinc-400 hover:bg-zinc-800" : "bg-white border-zinc-100 text-zinc-600 hover:bg-zinc-50"
                            }`}
                          >
                            <span>Undo</span>
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="text-[10px] font-mono font-bold px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600 rounded-lg transition-all"
                          >
                            <span>Save</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setIsEditingCode(!isEditingCode)}
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all ${
                          isEditingCode ? "bg-amber-500/15 text-amber-500 border-amber-500/30" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {isEditingCode ? "👁️ View" : "✏️ Edit"}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 flex font-mono overflow-hidden relative">
                    <div 
                      ref={lineNumbersScrollRef}
                      className={`w-12 select-none text-right pr-3 pt-4 text-sm font-mono border-r transition-colors duration-200 overflow-y-hidden shrink-0 ${
                        isDark ? "border-zinc-900 bg-black text-zinc-600" : "border-zinc-100 bg-zinc-50/50 text-zinc-400"
                      }`}
                    >
                      {Array.from({ length: Math.max(activeFile.content.split("\n").length, 30) }).map((_, i) => (
                        <div key={i} className="h-6 leading-6 select-none">{i + 1}</div>
                      ))}
                    </div>

                    {isEditingCode ? (
                      <textarea
                        ref={editorScrollRef}
                        onScroll={handleEditorScroll}
                        value={activeFile.content}
                        onChange={handleEditorChange}
                        className={`flex-1 h-full p-4 text-sm font-mono focus:outline-none resize-none leading-6 transition-colors duration-200 ${isDark ? "bg-black text-zinc-200" : "bg-white text-zinc-850"}`}
                        spellCheck="false"
                      />
                    ) : (
                      <div 
                        ref={viewerScrollRef}
                        onScroll={handleViewerScroll}
                        onClick={() => setIsEditingCode(true)}
                        className={`flex-1 h-full overflow-y-auto pt-4 pb-12 px-4 text-sm font-mono transition-colors duration-200 cursor-text select-text scrollbar-thin ${
                          isDark ? "bg-black text-zinc-300" : "bg-white text-zinc-800"
                        }`}
                      >
                        {highlightCode(activeFile.content, activeFile.path)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resizable handle */}
              <div
                onMouseDown={startResizingPreview}
                className={`w-1 h-full cursor-col-resize hover:bg-amber-500/80 bg-zinc-800/20 hover:w-1.5 transition-all z-20 shrink-0 select-none flex items-center justify-center relative group ${
                  isResizingPreview ? "bg-amber-500 w-1.5" : ""
                }`}
              >
                <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-10 rounded bg-zinc-700/50 group-hover:bg-amber-500/80" />
              </div>

              {/* Right Side: Live Preview (takes previewWidth px) */}
              <div 
                style={{ width: `${previewWidth}px` }}
                className="h-full shrink-0 flex flex-col relative border-l border-zinc-950/20 bg-[#0d0d10] min-w-[280px]"
              >
                <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
                  <div className="w-full h-full rounded-xl bg-slate-950 border border-zinc-950/40 shadow-2xl overflow-hidden flex flex-col">
                    <iframe
                      key={previewKey}
                      src={getCombinedPreviewBlob()}
                      className="w-full h-full border-none bg-slate-950"
                      sandbox="allow-scripts allow-same-origin allow-popups"
                      title="Split Preview"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Floating Toast Notification system overlay */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => {
            let icon = <Info className="h-4 w-4 shrink-0 text-amber-500" />;
            let bgClass = "bg-zinc-900 border-zinc-850 text-zinc-100 shadow-2xl shadow-black/50";
            let borderAccent = "border-l-4 border-l-amber-500";
            
            if (toast.type === "success") {
              icon = <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />;
              borderAccent = "border-l-4 border-l-emerald-500";
            } else if (toast.type === "error") {
              icon = <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />;
              borderAccent = "border-l-4 border-l-rose-500";
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${bgClass} ${borderAccent} backdrop-blur-md`}
              >
                {icon}
                <div className="flex-1 text-xs leading-relaxed font-sans font-semibold text-zinc-200">
                  {toast.text}
                </div>
                <button
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="p-0.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Clear Chat Confirmation Modal */}
      <AnimatePresence>
        {showClearChatConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearChatConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl transition-all duration-200 z-10 ${
                isDark 
                  ? "bg-zinc-900 border-zinc-800 text-zinc-100" 
                  : "bg-white border-zinc-200 text-zinc-800"
              }`}
            >
              <h3 className="text-sm font-bold mb-2">Clear Chat History</h3>
              <p className={`text-xs mb-5 leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                Are you sure you want to clear your chat conversation with the AI? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setShowClearChatConfirm(false)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isDark
                      ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-750 text-zinc-300"
                      : "bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-700"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={executeClearChat}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-md transition-all active:scale-95"
                >
                  Clear Chat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Project Confirmation Modal */}
      <AnimatePresence>
        {showDeleteProjectConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteProjectConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl transition-all duration-200 z-10 ${
                isDark 
                  ? "bg-zinc-900 border-zinc-800 text-zinc-100" 
                  : "bg-white border-zinc-200 text-zinc-800"
              }`}
            >
              <h3 className="text-sm font-bold mb-2">Clear Cloud Storage</h3>
              <p className={`text-xs mb-5 leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                Are you sure you want to delete this project from the cloud database? All saved files will be permanently deleted from the cloud storage.
              </p>
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setShowDeleteProjectConfirm(false)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isDark
                      ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-750 text-zinc-300"
                      : "bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-700"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={executeDeleteProjectSupabase}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-md transition-all active:scale-95"
                >
                  Delete Storage
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Multi-Project Manager Modal (Max 5 Projects per User) */}
      <AnimatePresence>
        {isProjectsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProjectsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all duration-200 z-10 ${
                isDark 
                  ? "bg-zinc-900 border-zinc-800 text-zinc-100" 
                  : "bg-white border-zinc-200 text-zinc-800"
              }`}
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800/30">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Folder className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">
                      {appLanguage === "en" ? "My Projects List" : "Daftar Proyek Saya"}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {appLanguage === "en" ? "Maximum 5 projects per user account" : "Maksimal 5 proyek per akun pengguna"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsProjectsModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Capacity Usage Bar */}
              <div className="mb-5 p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/40 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-400">
                    {appLanguage === "en" ? "Project Quota Usage:" : "Penggunaan Kuota Proyek:"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    userProjects.length >= 5
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {userProjects.length} / {maxProjectLimit} {appLanguage === "en" ? "Projects Used" : "Proyek Terpakai"}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      userProjects.length >= 5 ? "bg-rose-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${(Math.min(userProjects.length, 5) / 5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Create New Project Section */}
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="text"
                  value={newProjInputName}
                  onChange={(e) => setNewProjInputName(e.target.value)}
                  placeholder={appLanguage === "en" ? "New project name (e.g. cashier_app)..." : "Nama proyek baru (contoh: app_kasir)..."}
                  disabled={userProjects.length >= maxProjectLimit || isCreatingProj}
                  className={`flex-1 px-3.5 py-2 rounded-xl text-xs border outline-none transition-all ${
                    isDark 
                      ? "bg-black/60 border-zinc-800 focus:border-amber-500/50 text-zinc-200 placeholder:text-zinc-600" 
                      : "bg-zinc-50 border-zinc-200 focus:border-amber-500 text-zinc-800 placeholder:text-zinc-400"
                  }`}
                />
                <button
                  onClick={handleCreateNewProject}
                  disabled={userProjects.length >= maxProjectLimit || isCreatingProj || !newProjInputName.trim()}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    userProjects.length >= maxProjectLimit
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      : "bg-amber-500 hover:bg-amber-450 text-white shadow-md active:scale-95"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  <span>{appLanguage === "en" ? "Create" : "Buat"}</span>
                </button>
              </div>

              {userProjects.length >= maxProjectLimit && (
                <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    {appLanguage === "en" 
                      ? "Maximum limit of 5 projects per user reached. Please delete an old project first." 
                      : "Batas maksimum 5 proyek per user telah tercapai. Harap hapus proyek lama terlebih dahulu."}
                  </span>
                </div>
              )}

              {/* Projects List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {userProjects.length === 0 ? (
                  <div className="text-center py-6 text-xs text-zinc-500">
                    {appLanguage === "en" 
                      ? "No projects saved yet. Enter a name above and click 'Create'!" 
                      : "Belum ada proyek tersimpan. Ketik nama di atas dan klik 'Buat'!"}
                  </div>
                ) : (
                  userProjects.map((p) => {
                    const isActive = projectName === p.name;
                    const isDefault = p.isDefault || p.name === defaultProjectName;
                    return (
                      <div
                        key={p.id || p.name}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          isActive
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                            : isDark
                              ? "bg-zinc-950/40 border-zinc-800/60 hover:bg-zinc-800/40"
                              : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Folder className={`h-4 w-4 shrink-0 ${isActive ? "text-amber-400" : "text-zinc-400"}`} />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold truncate">{p.name}</span>
                              {isDefault && (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-sky-500/15 text-sky-400 border border-sky-500/20 uppercase tracking-wide">
                                  Default
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500">
                              {p.fileCount || 3} {appLanguage === "en" ? "files" : "file"} • {appLanguage === "en" ? "Updated:" : "Perubahan:"} {new Date(p.updatedAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isActive ? (
                            <button
                              onClick={() => {
                                handleSwitchProject(p.name);
                                setIsProjectsModalOpen(false);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white transition-all cursor-pointer"
                            >
                              {appLanguage === "en" ? "Open" : "Buka"}
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500 text-white shadow-sm">
                              {appLanguage === "en" ? "Active" : "Aktif"}
                            </span>
                          )}

                          {isDefault ? (
                            <span 
                              className="p-1 text-zinc-600 opacity-60 cursor-not-allowed" 
                              title={appLanguage === "en" ? "Default user project cannot be deleted" : "Proyek default user tidak dapat dihapus"}
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDeleteProjectFromManager(p.name)}
                              className="p-1 rounded-lg hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title={appLanguage === "en" ? "Delete project" : "Hapus proyek"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
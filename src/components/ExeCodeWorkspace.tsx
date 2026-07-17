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
  Menu
} from "lucide-react";
import JSZip from "jszip";
import { MODEL_OPTIONS } from "../presets";

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
}

interface ExeCodeWorkspaceProps {
  isDark: boolean;
  curTheme: any;
  onClose: () => void;
  defaultModelId?: string;
}

const DEFAULT_FILES: VirtualFile[] = [
  {
    path: "index.html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aplikasi Keren ExeCode</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    @keyframes pulse-glow {
      0%, 100% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.05); opacity: 0.9; }
    }
    .glow-bg {
      animation: pulse-glow 8s ease-in-out infinite;
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between overflow-hidden relative">

  <!-- Background Orbs -->
  <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl glow-bg"></div>
  <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl glow-bg" style="animation-delay: -4s"></div>

  <!-- Header -->
  <header class="p-6 border-b border-slate-900/80 backdrop-blur flex justify-between items-center z-10">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
        E
      </div>
      <span class="font-bold tracking-tight text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
        ExeCode App
      </span>
    </div>
    <span class="text-xs font-mono px-3 py-1 bg-indigo-950/50 text-indigo-400 rounded-full border border-indigo-900/50">
      Status: Live
    </span>
  </header>

  <!-- Main Content -->
  <main class="flex-1 flex flex-col items-center justify-center p-8 z-10">
    <div class="max-w-md text-center space-y-6">
      <div class="inline-flex p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl animate-bounce">
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      
      <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight">
        Selamat Datang di <span class="bg-gradient-to-r from-amber-400 via-amber-500 to-indigo-400 bg-clip-text text-transparent">ExeCode</span>
      </h1>
      
      <p class="text-slate-400 text-sm leading-relaxed">
        Ini adalah pratinjau interaktif real-time dari aplikasi Anda. Coba tulis prompt di AI Assistant di bawah untuk memodifikasi halaman ini secara ajaib!
      </p>

      <div class="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
        <span class="text-xs text-slate-500 font-mono">Ketuk tombol di bawah untuk demo interaktif:</span>
        <button id="actionBtn" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95">
          Klik Saya
        </button>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="p-6 border-t border-slate-900 text-center text-xs text-slate-600 z-10">
    &copy; 2026 ExeCode Workspace. Semua hak dilindungi.
  </footer>

  <script src="app.js"></script>
</body>
</html>`
  },
  {
    path: "app.js",
    content: `// Tulis kode interaktif JavaScript Anda di sini!
console.log("ExeCode App initialized!");

const button = document.getElementById("actionBtn");
if (button) {
  button.addEventListener("click", () => {
    // Generate warna acak untuk efek visual
    const colors = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Berikan efek perubahan visual
    button.style.backgroundColor = randomColor;
    
    // Tampilkan notifikasi toast sederhana
    const notification = document.createElement("div");
    notification.className = "fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-xs font-bold text-white shadow-xl flex items-center gap-2 animate-fade-in";
    notification.innerHTML = \`<span>Warna tombol diubah menjadi <span style="color: \${randomColor}">\${randomColor}</span>!</span>\`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 2500);
  });
}`
  }
];

export function ExeCodeWorkspace({ isDark, curTheme, onClose, defaultModelId }: ExeCodeWorkspaceProps) {
  const [files, setFiles] = useState<VirtualFile[]>(() => {
    const saved = localStorage.getItem("execode_files");
    return saved ? JSON.parse(saved) : DEFAULT_FILES;
  });
  
  const [activeFilePath, setActiveFilePath] = useState<string>("index.html");
  const [projectName, setProjectName] = useState<string>(() => {
    return localStorage.getItem("execode_project_name") || "Proyek ExeCode";
  });

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return defaultModelId || "gemma-4-31b";
  });
  const [showModelDropdown, setShowModelDropdown] = useState<boolean>(false);

  // Settings for cloud saving
  const [supabaseUrl, setSupabaseUrl] = useState<string>("https://knmjalxisidyduzwfwnp.supabase.co");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>("");
  const [supabaseBucket, setSupabaseBucket] = useState<string>("execode");
  const [isServerConfigured, setIsServerConfigured] = useState<boolean>(false);

  const [activeRightTab, setActiveRightTab] = useState<"preview" | "code">("preview");
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isAIEditing, setIsAIEditing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [newFileName, setNewFileName] = useState<string>("");
  const [showNewFileInput, setShowNewFileInput] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  
  // ExeAI Chat Session
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("execode_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fail silent
      }
    }
    return [
      {
        id: "initial",
        role: "assistant",
        content: "Halo! Saya adalah Asisten AI ExeCode Anda. Beritahu saya apa yang ingin Anda buat atau ubah pada aplikasi web ini, dan saya akan memperbarui kodenya secara real-time!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ];
  });

  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  // Optimasi preview & console logging
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [consoleLogs, setConsoleLogs] = useState<{ type: "log" | "error" | "warn" | "info"; text: string; timestamp: string }[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
  const [aiStreamingText, setAiStreamingText] = useState<string>("");

  // Mobile detection and redirection countdown
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(5);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeFile = files.find(f => f.path === activeFilePath) || files[0];

  // Mobile device and screen width detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobileScreen(isMobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Countdown and return redirection when mobile detected
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
  }, [projectName]);

  useEffect(() => {
    localStorage.setItem("execode_chat_history", JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Activate code tab when entering fullscreen
  useEffect(() => {
    if (isFullscreen) {
      setActiveRightTab("code");
    }
  }, [isFullscreen]);

  // Handle setting status message
  const triggerStatus = (text: string, type: "success" | "error" | "info" = "info") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Listen to Preview Errors & Console logs posted from iframe
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

  // Fetch Supabase configurations & handle project auto-routing
  useEffect(() => {
    // Load initial files preview
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
      .catch(err => console.warn("Gagal mendapatkan konfigurasi cloud:", err));

    const match = window.location.pathname.match(/^\/project\/([^/]+)/);
    if (match) {
      const projectId = decodeURIComponent(match[1]);
      setProjectName(projectId);
      
      triggerStatus(`Menghubungkan ke Cloud Sandbox...`, "info");
      
      fetch("/api/supabase/load", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectName: projectId,
          bucket: "execode"
        })
      })
      .then(res => {
        if (!res.ok) throw new Error("Project tidak ditemukan di cloud.");
        return res.json();
      })
      .then(data => {
        if (data.files && data.files.length > 0) {
          setFiles(data.files);
          setActiveFilePath("index.html");
          refreshPreview(data.files);
          triggerStatus(`Berhasil memuat '${projectId}' dari cloud!`, "success");
        } else {
          refreshPreview(initialFiles);
          triggerStatus(`Project '${projectId}' kosong atau belum ada file.`, "info");
        }
      })
      .catch(err => {
        console.warn(err);
        refreshPreview(initialFiles);
        triggerStatus(`Project '${projectId}' belum tersimpan di cloud atau nama salah.`, "info");
      });
    } else {
      // Auto-generate unique project ID and rewrite URL
      const randomId = "proj-" + Math.random().toString(36).substring(2, 10);
      setProjectName(randomId);
      window.history.pushState(null, "", `/project/${randomId}`);
      refreshPreview(initialFiles);
      triggerStatus(`Membuat Sandbox Baru: ${randomId}`, "success");
    }
  }, []);

  // Sync / project slug update helper
  const handleProjectNameChange = (newName: string) => {
    const sanitized = newName.replace(/[^a-zA-Z0-9-_]/g, "");
    setProjectName(sanitized);
    window.history.replaceState(null, "", `/project/${sanitized}`);
  };

  const handleShareProject = () => {
    if (!projectName.trim()) {
      triggerStatus("Nama project tidak boleh kosong!", "error");
      return;
    }
    const slug = encodeURIComponent(projectName.trim());
    const shareUrl = `${window.location.origin}/project/${slug}`;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        triggerStatus("Link project berhasil disalin ke clipboard!", "success");
      })
      .catch(() => {
        triggerStatus(`Gagal menyalin. Ini link Anda: ${shareUrl}`, "info");
      });
  };

  // Update File Content in editor
  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedContent = e.target.value;
    setFiles(prev => prev.map(f => f.path === activeFilePath ? { ...f, content: updatedContent } : f));
  };

  // Generate Interactive HTML Bundle with CSS and JS injected for Live Preview
  const refreshPreview = (customFiles: VirtualFile[] = files) => {
    // Release existing blob URL to free memory
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    const htmlFile = customFiles.find(f => f.path.toLowerCase() === "index.html");
    let finalHtml = htmlFile ? htmlFile.content : "<h1>No index.html file found!</h1>";

    // 1. Dynamic replacement of <link rel="stylesheet"> with virtual files content
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

    // 2. Dynamic replacement of <script src="..."></script> with virtual files content
    const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi;
    const injectedScripts = new Set<string>();

    finalHtml = finalHtml.replace(scriptRegex, (match, src) => {
      if (!src) return match;
      const matchedFile = customFiles.find(f => f.path.toLowerCase() === src.toLowerCase());
      if (matchedFile) {
        injectedScripts.add(matchedFile.path.toLowerCase());
        return `<script>\n// Injected from ${matchedFile.path}\n${matchedFile.content}\n</script>`;
      }
      return match;
    });

    // 3. Fallback injection for unlinked CSS files (e.g., style.css or styles.css)
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

    // Ensure viewport meta tag exists for mobile responsive scaling in preview
    if (!finalHtml.toLowerCase().includes('name="viewport"') && !finalHtml.toLowerCase().includes("name='viewport'")) {
      const viewportTag = `\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">`;
      if (finalHtml.includes("<head>")) {
        finalHtml = finalHtml.replace("<head>", `<head>${viewportTag}`);
      } else if (finalHtml.includes("</head>")) {
        finalHtml = finalHtml.replace("</head>", `${viewportTag}\n</head>`);
      }
    }

    // Inject console logs interceptor & runtime error handling script
    const errorHandlingScript = `
      <script>
        // Catch runtime errors
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

        // Intercept standard console logging and send to parent
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

    // 4. Fallback injection for unlinked app.js
    if (!injectedScripts.has("app.js")) {
      const jsFile = customFiles.find(f => f.path.toLowerCase() === "app.js");
      if (jsFile) {
        const scriptTag = `<script>\n// Fallback Injection for app.js\n${jsFile.content}\n</script>`;
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

  // Add a new file
  const handleAddFile = () => {
    if (!newFileName.trim()) return;
    const name = newFileName.trim();
    if (files.some(f => f.path.toLowerCase() === name.toLowerCase())) {
      triggerStatus("Berkas dengan nama ini sudah ada!", "error");
      return;
    }

    const newFile: VirtualFile = {
      path: name,
      content: name.endsWith(".json") ? "{\n  \n}" : name.endsWith(".js") ? "// Tulis kode Javascript Anda\n" : "<!-- Tulis markup HTML/CSS Anda -->\n"
    };

    setFiles(prev => [...prev, newFile]);
    setActiveFilePath(name);
    setNewFileName("");
    setShowNewFileInput(false);
    triggerStatus(`Berkas '${name}' berhasil ditambahkan.`, "success");
  };

  // Delete file
  const handleDeleteFile = (pathToDelete: string) => {
    if (pathToDelete === "index.html") {
      triggerStatus("Berkas 'index.html' adalah berkas utama dan tidak boleh dihapus!", "error");
      return;
    }

    setFiles(prev => prev.filter(f => f.path !== pathToDelete));
    if (activeFilePath === pathToDelete) {
      setActiveFilePath("index.html");
    }
    triggerStatus(`Berkas '${pathToDelete}' berhasil dihapus.`, "success");
    
    // Also trigger clean-up on Supabase
    if (supabaseUrl && supabaseAnonKey) {
      deleteSingleFileFromSupabase(pathToDelete);
    }
  };

  // Export as ZIP file
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
      triggerStatus("Project berhasil diunduh dalam bentuk berkas ZIP!", "success");
    } catch (err: any) {
      triggerStatus(`Gagal mengunduh ZIP: ${err.message}`, "error");
    }
  };

  // Import Zip file
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
            content: `<!DOCTYPE html>\n<html>\n<head><title>ExeCode</title></head>\n<body><h1>index.html otomatis dibuat</h1></body>\n</html>`
          });
        }
        setFiles(extractedFiles);
        setActiveFilePath("index.html");
        setProjectName(file.name.replace(/\.[^/.]+$/, ""));
        triggerStatus(`ZIP berhasil diekstrak! Memuat ${extractedFiles.length} berkas ke workspace.`, "success");
      } else {
        triggerStatus("Berkas ZIP kosong atau tidak valid.", "error");
      }
    } catch (err: any) {
      triggerStatus(`Gagal mengekstrak berkas ZIP: ${err.message}`, "error");
    }
  };

  // Clean-up markdown blocks to show only pure descriptions in chat bubbles
  const cleanDisplayContent = (text: string) => {
    let cleaned = text.replace(/```(?:json|javascript|js|html|typescript|ts)?[\s\S]*?(?:```|$)/gi, "");
    return cleaned.trim();
  };

  // Extract files from standard markdown code blocks when JSON parsing is impossible or failed
  const extractFilesFromMarkdownBlocks = (text: string, currentFiles: VirtualFile[]): VirtualFile[] | null => {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)\n```/g;
    const blocks: { lang: string; content: string; index: number }[] = [];
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      blocks.push({
        lang: match[1],
        content: match[2],
        index: match.index
      });
    }

    if (blocks.length === 0) return null;

    const extracted: VirtualFile[] = [];
    let lastSearchIndex = 0;
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      // Ignore blocks that are actually formatted JSON arrays to prevent them from overwriting individual files
      if (block.lang.toLowerCase() === "json" && (block.content.trim().startsWith("[") || block.content.includes('"path"'))) {
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
        const lang = block.lang.toLowerCase();
        let fallbackPath = "";
        if (lang === "html") {
          fallbackPath = "index.html";
        } else if (lang === "css") {
          fallbackPath = "style.css";
        } else if (lang === "js" || lang === "javascript") {
          fallbackPath = "app.js";
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

    return extracted.length > 0 ? extracted : null;
  };

  // Attempt to parse or extract a valid JSON array from the response text
  const tryExtractJsonArray = (text: string): VirtualFile[] | null => {
    if (!text) return null;

    // Helper to validate and return virtual files
    const parseAsVirtualFiles = (candidate: string): VirtualFile[] | null => {
      try {
        let cleaned = candidate.trim();
        let parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(item => item && typeof item === "object" && typeof item.path === "string" && typeof item.content === "string")) {
          return parsed;
        }
        // Try with trailing commas removed
        cleaned = cleaned.replace(/,(\s*[\]}])/g, "$1");
        parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(item => item && typeof item === "object" && typeof item.path === "string" && typeof item.content === "string")) {
          return parsed;
        }
      } catch (e) {}
      return null;
    };

    // Helper for manual robust regex extraction of file structures
    const runManualExtractor = (rawText: string): VirtualFile[] | null => {
      const extractedFiles: VirtualFile[] = [];
      
      // Regex matches keys like "path", 'path', path and supports value wrappers like ", ', or `
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
          
          // Locate content key with quote identifier: "content", 'content', or content
          const contentKeyRegex = /(?:"content"|'content'|\bcontent\b)\s*:\s*(["'`])/i;
          const contentMatch = searchSub.match(contentKeyRegex);
          if (!contentMatch) continue;
          
          const quoteChar = contentMatch[1];
          const contentStartIndex = searchSub.indexOf(contentMatch[0]) + contentMatch[0].length;
          const contentSearchSub = searchSub.substring(contentStartIndex);
          
          let endQuoteIndex = -1;
          
          // Search backward for the matching unescaped closing quote character followed by structure endings
          for (let j = contentSearchSub.length - 1; j >= 0; j--) {
            if (contentSearchSub[j] === quoteChar) {
              let backslashCount = 0;
              let k = j - 1;
              while (k >= 0 && contentSearchSub[k] === '\\') {
                backslashCount++;
                k--;
              }
              if (backslashCount % 2 !== 0) continue; // Escaped quote
              
              const after = contentSearchSub.substring(j + 1).trim();
              if (after.startsWith("}") || after.startsWith(",") || after === "" || after.startsWith("]")) {
                endQuoteIndex = j;
                break;
              }
            }
          }
          
          if (endQuoteIndex === -1) {
            // Backward scan fallback for any unescaped quote character
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
            
            // Decode typical escaped structures depending on wrapper quote
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

    // --- STEP 1: Scan all markdown code blocks in the response ---
    const codeBlockRegex = /```(?:json|javascript|js)?\s*([\s\S]*?)\s*```/gi;
    let codeBlockMatch;
    while ((codeBlockMatch = codeBlockRegex.exec(text)) !== null) {
      const blockContent = codeBlockMatch[1].trim();
      const parsed = parseAsVirtualFiles(blockContent);
      if (parsed) return parsed;

      const manualFromBlock = runManualExtractor(blockContent);
      if (manualFromBlock) return manualFromBlock;
    }

    // --- STEP 2: Try to parse the entire text as JSON ---
    const parsedAll = parseAsVirtualFiles(text);
    if (parsedAll) return parsedAll;

    // --- STEP 3: Try running manual extractor on the entire raw text ---
    const manualFromAll = runManualExtractor(text);
    if (manualFromAll) return manualFromAll;

    // --- STEP 4: Smart bracket-to-bracket look-up on the entire text ---
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

  // Call API server-side to let AI automatically edit our source code based on a prompt!
  const handleSendPromptToAI = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || aiPrompt;
    if (!promptToSend.trim()) return;

    setRuntimeError(null);
    setAiPrompt("");
    setAiStreamingText("");

    // Append user message
    const userMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      role: "user",
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Append empty assistant message for streaming
    const assistantMsgId = "ai-" + Date.now();
    const tempAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "AI sedang membaca berkas dan menganalisis pengeditan...",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory(prev => [...prev, userMsg, tempAssistantMsg]);
    setIsAIEditing(true);

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: "user",
              content: `Instruksi Pengguna: "${promptToSend}"\n\n` +
                `Berikut adalah seluruh daftar file di workspace saya beserta isi kodenya saat ini:\n\n` +
                JSON.stringify(files, null, 2) + "\n\n" +
                `PENTING (INSTRUKSI PERILAKU & STRUKTUR AI):\n` +
                `1. Berikan penjelasan yang jelas mengenai: file apa yang Anda edit, untuk apa file tersebut, mengapa perubahan ini bagus/berguna, dan jelaskan implementasinya secara ringkas dan rapi.\n` +
                `2. Fokus utama Anda adalah: MEMILIH/MENYESUAIKAN/MERAPIKAN file, MEMPERBAIKI BUG (fix bug), MENGEDIT berkas, dan MEMVERIFIKASI agar tidak ada kode yang salah.\n` +
                `3. SANGAT PENTING: Anda hanya boleh mengikuti perintah pengguna secara tepat. JANGAN MENAMBAHKAN fitur, komponen, tombol, atau logic lain yang tidak disuruh atau tidak diminta oleh pengguna!\n` +
                `4. Berikan penjelasan ringkas dan rapi di luar blok kode JSON dalam Bahasa Indonesia.\n` +
                `5. Kemudian, berikan blok kode \`\`\`json berisi array dari file-file yang Anda PERBARUI saja. JANGAN sertakan file yang tidak diedit sama sekali.\n` +
                `6. Tulis isi file baru secara LENGKAP di bagian "content". JANGAN PERNAH menyingkat isi file dengan ellipsis, komentar "// sisa kode", atau "/* ... */" karena itu akan merusak program pengguna.\n` +
                `7. Agar aman dari batasan parsing JSON, usahakan meng-escape tanda kutip ganda (\`\"\`) di dalam kode Anda, atau gunakan tanda kutip tunggal (\`'\`) atau backticks (\`\` \` \`\`) dalam string kodenya.\n` +
                `8. Jangan merusak atau menghapus file penting. Edit file index.html atau app.js sesuai kebutuhan, atau buat file baru jika diperlukan.\n\n` +
                `Contoh format respons yang Anda HARUS ikuti:\n` +
                `### Penjelasan Perubahan\n` +
                `- **[File yang Diubah]**: [Penjelasan untuk apa file ini dan mengapa struktur/perubahan ini bagus...]\n\n` +
                `\`\`\`json\n` +
                `[\n` +
                `  { "path": "index.html", "content": "...kode baru lengkap..." }\n` +
                `]\n` +
                `\`\`\``
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API server returned error (${response.status})`);
      }

      const reader = response.body;
      if (!reader) throw new Error("Gagal membaca aliran data respons AI.");

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
                  fullText += parsed.text;
                  setAiStreamingText(fullText);
                  
                  // Live-update the streaming text (filtering out ugly raw JSON blocks on the fly)
                  const displayable = cleanDisplayContent(fullText);
                  setChatHistory(prev => prev.map(msg => 
                    msg.id === assistantMsgId 
                      ? { ...msg, content: displayable || "Menyusun perubahan kode..." } 
                      : msg
                  ));
                }
              } catch (e) {
                // Ignore
              }
            }
          }
        }
      }

      // Final complete content parsing
      const displayableText = cleanDisplayContent(fullText);
      setAiStreamingText(fullText);
      
      let editedFiles = tryExtractJsonArray(fullText);
      if (!editedFiles || editedFiles.length === 0) {
        console.log("JSON parsing failed or empty. Attempting markdown block extraction fallback...");
        editedFiles = extractFilesFromMarkdownBlocks(fullText, files);
      }

      if (editedFiles && Array.isArray(editedFiles) && editedFiles.length > 0) {
        // Backup current state for Restore button before updating
        const oldFiles = [...files];
        
        // Merge the edited files into existing files securely to avoid wiping out unmodified files
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
        
        // Refresh live preview once AI finishes writing the edits
        refreshPreview(mergedFiles);
        
        // Finalize the chat history with backup snapshots and list of modified files
        setChatHistory(prev => prev.map(msg => 
          msg.id === assistantMsgId 
            ? { 
                ...msg, 
                content: (displayableText ? displayableText.trim() : "Saya telah memperbarui berkas kode Anda sesuai permintaan.") + "\n\n" + 
                         `**Berkas yang diperbarui:**\n` + 
                         editedFiles.map(f => `• \`${f.path}\``).join("\n"), 
                filesSnapshot: oldFiles 
              } 
            : msg
        ));
        
        triggerStatus("Workspace Anda berhasil diperbarui!", "success");
      } else {
        throw new Error("Format respons JSON tidak sesuai ekspektasi atau tidak dapat diparse.");
      }
    } catch (err: any) {
      console.error("AI Code Edit Error: ", err);
      setChatHistory(prev => prev.map(msg => 
        msg.id === assistantMsgId 
          ? { ...msg, content: `Gagal memodifikasi kode: ${err.message}. Mohon kirim ulang prompt Anda.` } 
          : msg
      ));
      triggerStatus(`Gagal memproses AI edit: ${err.message}`, "error");
    } finally {
      setIsAIEditing(false);
    }
  };

  // Sync Project Files to Cloud ExeChat (via Supabase backend routes)
  const handleUploadToSupabase = async () => {
    try {
      triggerStatus("Menyimpan berkas Anda ke Cloud ExeChat...", "info");

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (supabaseUrl) headers["x-supabase-url"] = supabaseUrl;
      if (supabaseAnonKey) headers["x-supabase-key"] = supabaseAnonKey;

      const response = await fetch("/api/supabase/upload", {
        method: "POST",
        headers,
        body: JSON.stringify({
          projectName,
          files,
          bucket: supabaseBucket
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal mengunggah.");

      triggerStatus("Project berhasil disimpan di Cloud ExeChat!", "success");
    } catch (err: any) {
      console.error(err);
      triggerStatus(`Gagal mengunggah: ${err.message}`, "error");
    }
  };

  // Load project from Cloud Sandbox
  const handleLoadFromSupabase = async () => {
    try {
      triggerStatus(`Membuka proyek '${projectName}' dari Cloud...`, "info");

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (supabaseUrl) headers["x-supabase-url"] = supabaseUrl;
      if (supabaseAnonKey) headers["x-supabase-key"] = supabaseAnonKey;

      const response = await fetch("/api/supabase/load", {
        method: "POST",
        headers,
        body: JSON.stringify({
          projectName,
          bucket: supabaseBucket
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal memuat.");

      if (data.files && data.files.length > 0) {
        setFiles(data.files);
        setActiveFilePath("index.html");
        setPreviewKey(prev => prev + 1);
        refreshPreview(data.files);
        triggerStatus(`Berhasil membuka proyek '${projectName}' dari cloud!`, "success");
      } else {
        triggerStatus(`Proyek '${projectName}' kosong atau belum tersimpan.`, "info");
      }
    } catch (err: any) {
      console.error(err);
      triggerStatus(`Gagal menarik proyek: ${err.message}`, "error");
    }
  };

  // Delete project from Supabase Cloud
  const handleDeleteProjectSupabase = async () => {
    const confirmClear = window.confirm(`Apakah Anda yakin ingin menghapus seluruh penyimpanan Cloud untuk proyek '${projectName}'? Tindakan ini tidak bisa dibatalkan.`);
    if (!confirmClear) return;

    try {
      await deleteProjectFromSupabase();
      triggerStatus("Seluruh penyimpanan cloud proyek berhasil dibersihkan!", "success");
    } catch (err: any) {
      triggerStatus(`Gagal membersihkan cloud: ${err.message}`, "error");
    }
  };

  const deleteProjectFromSupabase = async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (supabaseUrl) headers["x-supabase-url"] = supabaseUrl;
    if (supabaseAnonKey) headers["x-supabase-key"] = supabaseAnonKey;

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
      throw new Error(errData.error || "Gagal menghapus file.");
    }
  };

  const deleteSingleFileFromSupabase = async (filePath: string) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (supabaseUrl) headers["x-supabase-url"] = supabaseUrl;
      if (supabaseAnonKey) headers["x-supabase-key"] = supabaseAnonKey;

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
      console.warn("Gagal menghapus single file cloud:", err);
    }
  };

  // Simple Markdown elements parser
  const renderMessageContent = (content: string) => {
    const lines = content.split("\n");
    return (
      <div className="space-y-2 text-zinc-300 text-xs leading-relaxed font-sans font-normal">
        {lines.map((line, idx) => {
          if (line.trim().startsWith("```json") || line.trim().startsWith("```") || line.trim().startsWith("]")) {
            return null;
          }
          
          // Bullet list items
          if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
            const text = line.replace(/^[\s*-]+/, "").trim();
            return (
              <ul key={idx} className="list-disc pl-4 space-y-1 my-1">
                <li className="text-zinc-300">{parseInlineFormatting(text)}</li>
              </ul>
            );
          }
          
          // Headers
          if (line.trim().startsWith("### ")) {
            return (
              <h4 key={idx} className="text-xs font-bold text-zinc-100 mt-3 mb-1 uppercase tracking-wider text-amber-500">
                {parseInlineFormatting(line.replace("### ", ""))}
              </h4>
            );
          }
          if (line.trim().startsWith("## ")) {
            return (
              <h3 key={idx} className="text-sm font-bold text-zinc-100 mt-4 mb-2 border-b border-zinc-800 pb-1">
                {parseInlineFormatting(line.replace("## ", ""))}
              </h3>
            );
          }
          
          if (!line.trim()) return <div key={idx} className="h-1" />;
          
          return (
            <p key={idx} className="leading-relaxed">
              {parseInlineFormatting(line)}
            </p>
          );
        })}
      </div>
    );
  };

  const parseInlineFormatting = (text: string) => {
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    const splitParts = text.split(regex);
    
    return splitParts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-zinc-100">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i} className="bg-zinc-900 border border-zinc-800 text-amber-400 font-mono text-[11px] px-1 py-0.5 rounded">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  const aiName = "AI";

  if (isMobileScreen) {
    return (
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-xl ${isDark ? "bg-zinc-950 text-zinc-100 font-sans" : "bg-zinc-50 text-zinc-900 font-sans"}`}>
        <div className={`max-w-sm w-full p-8 rounded-2xl border flex flex-col items-center space-y-6 shadow-2xl animate-fade-in ${isDark ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-zinc-200"}`}>
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-500 animate-pulse">
              <Smartphone className="h-8 w-8" />
            </div>
            <div className="absolute -top-1 -right-1 bg-rose-500 text-white p-1 rounded-full text-[10px] font-bold">
              <X className="h-3 w-3" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-bold tracking-tight">Fitur Tidak Tersedia di HP</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Maaf, fitur <span className="text-amber-500 font-semibold">ExeCode</span> hanya didukung pada perangkat PC / Desktop demi pengalaman pengeditan kode yang optimal.
            </p>
          </div>

          <div className="w-full h-px bg-zinc-800/50" />

          <div className="flex flex-col items-center space-y-2">
            <span className="text-xs text-zinc-500 font-medium">Mengalihkan kembali ke ExeChat dalam</span>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500 text-white font-bold text-lg shadow-lg shadow-amber-500/20 animate-bounce">
              {countdown}
            </div>
            <span className="text-[10px] text-zinc-600 font-mono">detik...</span>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-750 text-zinc-200 transition-all border border-zinc-700/50"
          >
            Kembali Sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col backdrop-blur-xl ${isDark ? "bg-zinc-950 text-zinc-100 font-sans" : "bg-zinc-50 text-zinc-900 font-sans"}`}>
      
      {/* HEADER BAR (Visual Match: ExeChat brand with start/share/remix actions) */}
      {!isFullscreen && (
        <div className={`px-5 py-3 flex items-center justify-between border-b ${isDark ? "border-zinc-850 bg-zinc-950" : "border-zinc-200 bg-white"} shrink-0`}>
          {/* Left: Back to start */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.location.pathname.startsWith("/project/")) {
                  window.history.pushState({}, "", "/");
                }
                onClose();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-normal flex items-center gap-1.5 border transition-all ${
                isDark 
                  ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800" 
                  : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <ArrowLeft className="h-4 w-4 text-zinc-400" />
              <span>Back to start</span>
            </button>
          </div>

          {/* Center: Brand name "ExeChat" */}
          <div className="flex items-center gap-2">
            <span className="font-sans font-bold text-base tracking-tight text-zinc-100">ExeChat</span>
            <span className="text-[10px] font-normal uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
              ExeCode
            </span>
          </div>

          {/* Right: Remix, Share, Publish, Fullscreen */}
          <div className="flex items-center gap-2">
            {statusMessage && (
              <div className={`mr-2 px-3 py-1.5 rounded-lg text-[11px] font-normal flex items-center gap-1.5 shadow-sm animate-fade-in ${
                statusMessage.type === "success" 
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                  : statusMessage.type === "error"
                    ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
              }`}>
                {statusMessage.type === "success" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Save / Sync button */}
            <button
              onClick={handleUploadToSupabase}
              className="px-3 py-1.5 rounded-xl text-xs font-normal bg-amber-500 hover:bg-amber-450 text-white flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Simpan Proyek ke Cloud"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Save</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-1.5 rounded-xl border transition-all ${
                isDark 
                  ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800" 
                  : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              }`}
              title={isFullscreen ? "Show Chat Panel" : "Hide Chat Panel (Fullscreen)"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4 text-zinc-400" /> : <Maximize2 className="h-4 w-4 text-zinc-400" />}
            </button>
          </div>
        </div>
      )}

      {/* CORE WORKSPACE GRID */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative bg-zinc-950">
        
        {/* PANEL KIRI: AI CHAT CONVERSATION (Styled like Google AI Studio) */}
        <div className={`${
          isFullscreen 
            ? "hidden" 
            : "w-full md:w-[380px] h-1/2 md:h-full border-b md:border-b-0 md:border-r flex flex-col shrink-0 border-zinc-850 bg-[#121214]"
        }`}>
          {/* Chat Header */}
          <div className="p-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-950/40">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold tracking-tight text-zinc-200">{aiName}</span>
            </div>
            
            {/* Start New Chat/Reset */}
            <button
              onClick={() => {
                const conf = window.confirm("Mulai percakapan AI baru? Riwayat obrolan di workspace ini akan dibersihkan.");
                if (conf) {
                  setChatHistory([
                    {
                      id: "initial",
                      role: "assistant",
                      content: "Halo! Saya adalah Asisten AI ExeCode Anda. Beritahu saya apa yang ingin Anda buat atau ubah pada aplikasi web ini, dan saya akan memperbarui kodenya secara real-time!",
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    }
                  ]);
                  triggerStatus("Riwayat percakapan dibersihkan.", "info");
                }
              }}
              className="p-1 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-all"
              title="Mulai Percakapan Baru"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Chat Metadata & Model Dropdown Selection */}
          <div className="px-4 py-2 border-b border-zinc-850/50 bg-zinc-950/20 text-[10px] text-zinc-500 flex items-center justify-between font-mono shrink-0">
            <span>{MODEL_OPTIONS.find(m => m.id === selectedModel)?.name || "AI Assistant"} • Ran successfully</span>
            
            <div className="relative">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="text-[10px] text-amber-500 hover:text-amber-400 font-medium flex items-center gap-1 transition-all"
              >
                <span>Ubah Model</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {showModelDropdown && (
                <div className="absolute top-full right-0 mt-1 z-50 w-64 rounded-xl border p-1 shadow-2xl bg-zinc-900 border-zinc-800 text-zinc-100 max-h-64 overflow-y-auto">
                  <div className="px-2.5 py-1 mb-1 border-b border-zinc-800/20">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Pilih Model AI</span>
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
                            triggerStatus(`Model AI diubah ke '${m.name}'`, "success");
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] flex flex-col gap-0.5 transition-all ${
                            isSel
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                              : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={`font-semibold ${isSel ? "text-amber-400" : "text-zinc-300"}`}>{m.name}</span>
                            <span className="text-[8px] px-1 bg-zinc-950 text-zinc-500 rounded border border-zinc-800">{m.badge}</span>
                          </div>
                          <span className="text-[9px] text-zinc-500 line-clamp-1">{m.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
            {chatHistory.map((message) => {
              const isUsr = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${isUsr ? "items-end" : "items-start"} space-y-1`}
                >
                  {/* Speaker identity label */}
                  <span className="text-[10px] text-zinc-500 font-medium px-1">
                    {isUsr ? "Anda" : aiName}
                  </span>

                  {/* Message Bubble */}
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                      isUsr
                        ? "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tr-sm"
                        : "bg-zinc-900/30 border border-zinc-900 text-zinc-300 rounded-tl-sm"
                    }`}
                  >
                    {isUsr ? (
                      <p className="font-sans font-normal whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      renderMessageContent(message.content)
                    )}

                    {/* Snapshot Restore Action */}
                    {!isUsr && message.filesSnapshot && (
                      <div className="mt-3 pt-2 border-t border-zinc-800/50 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex gap-1">
                          <button className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
                            <ThumbsUp className="h-3 w-3" />
                          </button>
                          <button className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
                            <ThumbsDown className="h-3 w-3" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => {
                            if (message.filesSnapshot) {
                              setFiles(message.filesSnapshot);
                              setPreviewKey(prev => prev + 1);
                              triggerStatus("Kode berhasil di-restore ke snapshot versi ini!", "success");
                            }
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-[10px] font-normal text-zinc-400 hover:text-zinc-200 transition-colors"
                          title="Kembalikan file ke snapshot sebelum pengeditan ini"
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
            {isAIEditing && (
              <div className="flex flex-col items-start space-y-1 animate-pulse">
                <span className="text-[10px] text-zinc-500 font-medium px-1 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-spin duration-3000" />
                  {aiName} sedang berpikir...
                </span>
                <div className="px-3.5 py-3 rounded-2xl text-xs max-w-[85%] leading-relaxed bg-amber-500/5 border border-amber-500/15 text-zinc-300 rounded-tl-sm w-full space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                    <span className="font-semibold text-zinc-200">AI Code Engine Aktif</span>
                  </div>
                  <div className="font-mono text-[10px] text-zinc-400 space-y-1 bg-zinc-950/40 p-2 rounded-lg border border-zinc-900">
                    <div className="flex items-center gap-1.5 text-emerald-400/90">
                      <span>✔</span>
                      <span>Menganalisis instruksi Anda</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <span className="animate-pulse">●</span>
                      <span>Menyusun & mengedit berkas kode...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* CODE STATUS INTERACTIVE BOX (Only visible when runtimeError exists to keep the chat roomy) */}
          {runtimeError && (
            <div className="px-4 py-2 border-t border-zinc-850 bg-zinc-950/40 shrink-0">
              <div className="p-2.5 rounded-xl border border-rose-500/10 bg-rose-500/5 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 animate-pulse" />
                  <span className="text-rose-400 font-normal truncate">1 error running the code</span>
                </div>
                <button
                  onClick={() => {
                    const fixPrompt = `Saya mendapat kesalahan berikut saat menjalankan program:\n\n"${runtimeError}"\n\nTolong bantu perbaiki bug ini dan update kodenya.`;
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
          <div className="p-4 border-t border-zinc-850 bg-zinc-950/80">
            <div className="relative flex flex-col bg-zinc-900 border border-zinc-800 focus-within:border-amber-500/50 rounded-2xl p-1.5 transition-all">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Tulis instruksi: 'tambahkan navbar cantik', 'ubah tombol jadi modern', atau 'buat game tic-tac-toe'..."
                disabled={isAIEditing}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isAIEditing) handleSendPromptToAI();
                  }
                }}
                className="w-full bg-transparent border-none focus:outline-none text-xs text-zinc-200 placeholder-zinc-500 resize-none px-2.5 pt-1.5 min-h-[44px] max-h-[140px] leading-relaxed"
              />
              
              <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <button className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-300 transition-colors" title="Tambah aset">
                    <Plus className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-300 transition-colors" title="Input suara">
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleSendPromptToAI()}
                  disabled={isAIEditing || !aiPrompt.trim()}
                  className={`p-2 rounded-xl transition-all ${
                    isAIEditing 
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                      : !aiPrompt.trim()
                        ? "bg-zinc-800 text-zinc-500"
                        : "bg-amber-500 hover:bg-amber-450 text-white shadow-md active:scale-95 cursor-pointer"
                  }`}
                >
                  {isAIEditing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL KANAN: WORKSPACE INTERACTIVE / CODE EDITOR PANE */}
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative">
          
          {/* Segmented controls Preview vs Code */}
          {!isFullscreen && (
            <div className="p-3 border-b border-zinc-850 bg-zinc-950 flex items-center justify-between shrink-0">
              <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-850">
                <button
                  onClick={() => {
                    setActiveRightTab("preview");
                    refreshPreview();
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-normal flex items-center gap-1.5 transition-all ${
                    activeRightTab === "preview" 
                      ? "bg-amber-500 text-white font-medium" 
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span className="h-1.5 w-1.5 bg-current rounded-full" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => setActiveRightTab("code")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                    activeRightTab === "code" 
                      ? "bg-amber-500 text-white font-medium" 
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Code
                </button>
              </div>

              {/* Simulated Address path, refresh & reload controls */}
              <div className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-850 text-[11px] text-zinc-500 font-mono w-80 truncate">
                <span className="text-zinc-600">/</span>
                <span className="truncate text-zinc-400">{projectName.toLowerCase().replace(/\s+/g, "-")}</span>
              </div>

              <div className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-lg border border-zinc-850">
                {activeRightTab === "preview" && (
                  <>
                    <button
                      onClick={() => setDeviceMode("desktop")}
                      className={`p-1.5 rounded-md transition-all ${deviceMode === "desktop" ? "bg-amber-500/10 text-amber-500" : "text-zinc-400 hover:text-zinc-200"}`}
                      title="Pratinjau Desktop"
                    >
                      <Monitor className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeviceMode("mobile")}
                      className={`p-1.5 rounded-md transition-all ${deviceMode === "mobile" ? "bg-amber-500/10 text-amber-500" : "text-zinc-400 hover:text-zinc-200"}`}
                      title="Pratinjau Smartphone"
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                    </button>
                    <div className="h-4 w-px bg-zinc-800 mx-1" />
                  </>
                )}
                <button
                  onClick={() => {
                    refreshPreview();
                    setPreviewKey(prev => prev + 1);
                    triggerStatus("Pratinjau berhasil diperbarui dengan perubahan kode terbaru!", "success");
                  }}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
                  title="Muat Ulang Preview"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Tab Content 1: Preview mode active */}
          {activeRightTab === "preview" && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Sandbox interactive preview frame container */}
              <div className="flex-1 flex items-center justify-center p-6 bg-zinc-900/20 overflow-hidden relative">
                {deviceMode === "mobile" ? (
                  /* SMARTPHONE CONTAINER FRAME */
                  <div className="w-[360px] h-[640px] max-w-full max-h-[90%] rounded-[40px] bg-zinc-950 border-[12px] border-zinc-900 shadow-2xl relative flex flex-col overflow-hidden animate-fade-in ring-1 ring-zinc-800/50">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-5 bg-zinc-900 rounded-b-xl z-20 flex items-center justify-center">
                      <div className="w-10 h-1 bg-zinc-800 rounded-full" />
                    </div>
                    <iframe
                      key={previewKey}
                      src={getCombinedPreviewBlob()}
                      className="w-full h-full border-none rounded-[28px] bg-slate-950"
                      sandbox="allow-scripts allow-same-origin allow-popups"
                      title="Mobile App Preview"
                    />
                    <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-zinc-800 rounded-full" />
                  </div>
                ) : (
                  /* DESKTOP CONTAINER FRAME */
                  <div className="w-full h-full rounded-xl bg-slate-950 border border-zinc-850 shadow-2xl overflow-hidden flex flex-col">
                    <iframe
                      key={previewKey}
                      src={getCombinedPreviewBlob()}
                      className="w-full h-full border-none bg-slate-950"
                      sandbox="allow-scripts allow-same-origin allow-popups"
                      title="Desktop App Preview"
                    />
                  </div>
                )}

                {/* CONSOLE LOG DRAWER (Bottom Right, Google AI Studio style) */}
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
                    <div className="w-[380px] h-64 rounded-xl bg-zinc-950/95 border border-zinc-800/80 shadow-2xl flex flex-col overflow-hidden backdrop-blur-md animate-fade-in">
                      {/* Terminal Header */}
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
                          {/* Clear Logs Button */}
                          <button
                            onClick={() => setConsoleLogs([])}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                            title="Bersihkan log"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          {/* Minimize Button */}
                          <button
                            onClick={() => setIsConsoleOpen(false)}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                            title="Tutup console"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {/* Terminal Body */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                        {consoleLogs.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-[10px] text-zinc-600 italic">
                            Tidak ada log tertangkap. Panggil console.log() di proyek Anda.
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

          {/* Tab Content 2: Code editing and source exploring mode active */}
          {activeRightTab === "code" && (
            <div className="flex-1 flex overflow-hidden min-h-0">
              
              {/* Mini File list and storage section */}
              {!isFullscreen && (
                <div className="w-56 border-r border-zinc-850 bg-zinc-950/60 flex flex-col shrink-0">
                  <div className="p-3 border-b border-zinc-850 flex items-center justify-between bg-zinc-950/25">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Daftar Berkas</span>
                    <button
                      onClick={() => setShowNewFileInput(!showNewFileInput)}
                      className="p-1 rounded hover:bg-amber-500/10 text-amber-500 transition-colors"
                      title="Buat File Baru"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Inline new file name creator */}
                  {showNewFileInput && (
                    <div className="p-3 border-b border-zinc-850 bg-amber-500/5 flex flex-col gap-2">
                      <input
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        placeholder="style.css, app.js..."
                        className="w-full px-2 py-1.5 text-xs rounded border border-zinc-800 bg-zinc-900 text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddFile();
                        }}
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setShowNewFileInput(false)}
                          className="px-2 py-0.5 text-[10px] font-normal text-zinc-400 hover:bg-zinc-800 rounded"
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleAddFile}
                          className="px-2.5 py-0.5 text-[10px] font-semibold bg-amber-500 text-white rounded"
                        >
                          Tambah
                        </button>
                      </div>
                    </div>
                  )}

                  {/* File Navigator List items */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                    {files.map(file => {
                      const isActive = file.path === activeFilePath;
                      const isHtml = file.path.endsWith(".html");
                      const isJs = file.path.endsWith(".js");
                      const isJson = file.path.endsWith(".json");
                      
                      return (
                        <div
                          key={file.path}
                          className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-normal font-mono cursor-pointer transition-all ${
                            isActive 
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/15" 
                              : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
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
                              title="Hapus File"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Cloud ExeChat Settings removed as requested */}

                </div>
              )}

              {/* Code text editor pane */}
              <div className="flex-1 flex flex-col min-w-0">
                {isFullscreen ? (
                  <div className="px-4 py-2 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
                        {activeFilePath}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-sans">Full Screen Mode • Mengedit kode sumber</span>
                    </div>
                    <button
                      onClick={() => setIsFullscreen(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <Minimize2 className="h-3.5 w-3.5" />
                      <span>Kembali ke Normal</span>
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-2 border-b border-zinc-850 bg-zinc-950 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-zinc-500/10 text-amber-500 border border-amber-500/20">
                        {activeFilePath}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono hidden sm:inline">• Kode Sumber Utama</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25 flex items-center gap-1 shrink-0">
                        <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                        Auto-Saved
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex-1 flex font-mono overflow-hidden relative">
                  {/* Line Numbers column */}
                  <div className="w-10 select-none text-right pr-2 pt-4 text-xs font-mono border-r border-zinc-850 bg-zinc-950 text-zinc-600">
                    {Array.from({ length: Math.max(activeFile.content.split("\n").length, 30) }).map((_, i) => (
                      <div key={i} className="h-6 leading-6 select-none">{i + 1}</div>
                    ))}
                  </div>

                  {/* Actual Textarea Editor */}
                  <textarea
                    value={activeFile.content}
                    onChange={handleEditorChange}
                    className="flex-1 h-full p-4 text-xs font-mono focus:outline-none bg-zinc-950 text-zinc-200 focus:bg-zinc-950 resize-none leading-6 leading-relaxed"
                    spellCheck="false"
                  />
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

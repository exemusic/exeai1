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
  Code
} from "lucide-react";
import JSZip from "jszip";

interface VirtualFile {
  path: string;
  content: string;
}

interface ExeCodeWorkspaceProps {
  isDark: boolean;
  curTheme: any;
  onClose: () => void;
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

export function ExeCodeWorkspace({ isDark, curTheme, onClose }: ExeCodeWorkspaceProps) {
  const [files, setFiles] = useState<VirtualFile[]>(() => {
    const saved = localStorage.getItem("execode_files");
    return saved ? JSON.parse(saved) : DEFAULT_FILES;
  });
  
  const [activeFilePath, setActiveFilePath] = useState<string>("index.html");
  const [projectName, setProjectName] = useState<string>(() => {
    return localStorage.getItem("execode_project_name") || "Proyek ExeCode";
  });

  // Settings for Supabase
  const [supabaseUrl, setSupabaseUrl] = useState<string>(() => {
    return localStorage.getItem("execode_sb_url") || "https://knmjalxisidyduzwfwnp.supabase.co";
  });
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(() => {
    return localStorage.getItem("execode_sb_key") || "";
  });
  const [supabaseBucket, setSupabaseBucket] = useState<string>(() => {
    return localStorage.getItem("execode_sb_bucket") || "execode";
  });
  const [isServerConfigured, setIsServerConfigured] = useState<boolean>(false);

  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isAIEditing, setIsAIEditing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [newFileName, setNewFileName] = useState<string>("");
  const [showNewFileInput, setShowNewFileInput] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeFile = files.find(f => f.path === activeFilePath) || files[0];

  useEffect(() => {
    localStorage.setItem("execode_files", JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem("execode_project_name", projectName);
  }, [projectName]);

  // Check Supabase configurations on server side
  useEffect(() => {
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
      .catch(err => console.warn("Gagal mendapatkan konfigurasi Supabase server:", err));
  }, []);

  // Handle setting status message
  const triggerStatus = (text: string, type: "success" | "error" | "info" = "info") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Update File Content in editor
  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedContent = e.target.value;
    setFiles(prev => prev.map(f => f.path === activeFilePath ? { ...f, content: updatedContent } : f));
  };

  // Generate Interactive HTML Bundle with CSS and JS injected for Live Preview
  const getCombinedPreviewBlob = () => {
    const htmlFile = files.find(f => f.path.toLowerCase() === "index.html");
    const jsFile = files.find(f => f.path.toLowerCase() === "app.js");
    const cssFile = files.find(f => f.path.toLowerCase() === "style.css");

    let finalHtml = htmlFile ? htmlFile.content : "<h1>No index.html file found!</h1>";

    // Inject styles if style.css exists and is not referenced
    if (cssFile) {
      const styleTag = `<style>\n${cssFile.content}\n</style>`;
      if (finalHtml.includes("</head>")) {
        finalHtml = finalHtml.replace("</head>", `${styleTag}\n</head>`);
      } else {
        finalHtml = styleTag + finalHtml;
      }
    }

    // Inject custom app.js wrapper to prevent standard window blocking APIs and wire error catching
    const errorHandlingScript = `
      <script>
        window.addEventListener('error', function(e) {
          console.error("Runtime Error: " + e.message + " at " + e.filename + ":" + e.lineno);
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
      </script>
    `;

    if (finalHtml.includes("</head>")) {
      finalHtml = finalHtml.replace("</head>", `${errorHandlingScript}\n</head>`);
    } else {
      finalHtml = errorHandlingScript + finalHtml;
    }

    if (jsFile) {
      const scriptTag = `<script>\n${jsFile.content}\n</script>`;
      if (finalHtml.includes("</body>")) {
        // Replace current reference or append to end
        if (finalHtml.includes('<script src="app.js"></script>')) {
          finalHtml = finalHtml.replace('<script src="app.js"></script>', scriptTag);
        } else {
          finalHtml = finalHtml.replace("</body>", `${scriptTag}\n</body>`);
        }
      } else {
        finalHtml += `\n${scriptTag}`;
      }
    }

    const blob = new Blob([finalHtml], { type: "text/html" });
    return URL.createObjectURL(blob);
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
    
    // Also trigger clean-up on Supabase if keys exist
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
        // Ensure index.html exists
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

  // Call API server-side to let Gemini automatically edit our source code based on a prompt!
  const handleSendPromptToAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsAIEditing(true);
    triggerStatus("AI sedang menganalisis workspace dan memproses pengeditan kode...", "info");

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-ai",
          messages: [
            {
              role: "user",
              content: `Instruksi Pengguna: "${aiPrompt}"\n\n` +
                `Berikut adalah seluruh daftar file di workspace saya beserta isi kodenya saat ini:\n\n` +
                JSON.stringify(files, null, 2) + "\n\n" +
                `Tolong edit berkas-berkas di atas sesuai instruksi saya. Anda harus merespons kembali dengan format JSON valid berisi array dari seluruh file lengkap yang telah Anda perbarui. Contoh format respons:\n` +
                `[\n` +
                `  { "path": "index.html", "content": "...kode baru..." },\n` +
                `  { "path": "app.js", "content": "...kode baru..." }\n` +
                `]\n\n` +
                `Aturan penting:\n` +
                `1. Berikan HANYA format JSON valid di dalam blok kode \`\`\`json. Jangan ada penjelasan teks lain sebelum atau sesudahnya agar aplikasi saya dapat menguraikannya langsung.\n` +
                `2. Jangan hapus file penting, edit file index.html atau app.js sesuai kebutuhan, atau buat file baru jika diperlukan.\n` +
                `3. Tautan/Link yang Anda buat harus rapi, valid, lengkap (jangan menyingkat dengan ellipsis).`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API server returned error (${response.status})`);
      }

      // Stream parsing or simple reading
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
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
      }

      // Try to extract JSON from response markdown block
      let jsonStr = fullText.trim();
      const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = jsonStr.match(jsonBlockRegex);
      if (match && match[1]) {
        jsonStr = match[1];
      } else {
        // Strip markdown backticks if any
        jsonStr = jsonStr.replace(/^```json/, "").replace(/```$/, "");
      }

      const editedFiles = JSON.parse(jsonStr.trim());
      if (Array.isArray(editedFiles) && editedFiles.length > 0) {
        setFiles(editedFiles);
        setAiPrompt("");
        setPreviewKey(prev => prev + 1);
        triggerStatus("Workspace Anda berhasil diperbarui oleh ExeAI secara real-time!", "success");
      } else {
        throw new Error("Format respons JSON tidak sesuai ekspektasi.");
      }
    } catch (err: any) {
      console.error("AI Code Edit Error: ", err);
      triggerStatus(`AI gagal memodifikasi kode: ${err.message}. Silakan coba instruksi yang lebih detail.`, "error");
    } finally {
      setIsAIEditing(false);
    }
  };

  // Sync Project Files to Supabase Storage
  const handleUploadToSupabase = async () => {
    try {
      triggerStatus("Menyiapkan berkas untuk diunggah ke Supabase Storage...", "info");

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

      // Save credentials in local storage for convenience
      localStorage.setItem("execode_sb_url", supabaseUrl);
      localStorage.setItem("execode_sb_key", supabaseAnonKey);
      localStorage.setItem("execode_sb_bucket", supabaseBucket);

      triggerStatus("Project berhasil diunggah dan disinkronkan ke Supabase Storage!", "success");
    } catch (err: any) {
      console.error(err);
      triggerStatus(`Gagal unggah ke Supabase: ${err.message}`, "error");
    }
  };

  // Load project from Supabase Storage
  const handleLoadFromSupabase = async () => {
    try {
      triggerStatus(`Mencari file proyek '${projectName}' di Supabase...`, "info");

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
        triggerStatus(`Berhasil memuat ${data.files.length} berkas dari Supabase!`, "success");
      }
    } catch (err: any) {
      console.error(err);
      triggerStatus(`Gagal memuat: ${err.message}`, "error");
    }
  };

  // Helper: Delete single file from Supabase
  const deleteSingleFileFromSupabase = async (fileName: string) => {
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
          fileName,
          bucket: supabaseBucket
        })
      });
      console.log(`Single file ${fileName} deleted on Supabase storage.`);
    } catch (e) {
      // Quiet fail if not configured
    }
  };

  // Helper: Delete whole project files from Supabase (prevent storage leaks)
  const deleteProjectFromSupabase = async () => {
    try {
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
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal menghapus.");
    } catch (err) {
      console.warn("Supabase cleaning skipped or failed:", err);
    }
  };

  // Button to wipe project from Supabase
  const handleDeleteProjectSupabase = async () => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus seluruh file proyek '${projectName}' dari Supabase Storage? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      await deleteProjectFromSupabase();
      triggerStatus("Seluruh file proyek berhasil dibersihkan dari Supabase Storage sehingga kapasitas tidak menumpuk!", "success");
    } catch (err: any) {
      triggerStatus(`Gagal menghapus file di Supabase: ${err.message}`, "error");
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col backdrop-blur-xl ${isDark ? "bg-zinc-950/98 text-zinc-100" : "bg-zinc-50/98 text-zinc-900"}`}>
      
      {/* HEADER BAR */}
      <div className={`px-6 py-4 flex items-center justify-between border-b ${isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white"} shrink-0`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 rounded-xl text-white shadow-md">
            <Code className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className={`font-display font-bold text-base focus:outline-none focus:border-b border-dashed focus:border-amber-500 ${isDark ? "text-zinc-100 bg-transparent" : "text-zinc-850 bg-transparent"}`}
                placeholder="Nama Project"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Workspace
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Edit, Deploy & Pratinjau Real-Time Anda</p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2">
          {/* Status Message Overlay toast */}
          {statusMessage && (
            <div className={`mr-4 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-md animate-fade-in ${
              statusMessage.type === "success" 
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                : statusMessage.type === "error"
                  ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                  : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
            }`}>
              {statusMessage.type === "success" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <button
            onClick={() => setShowConfigModal(true)}
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isDark 
                ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800" 
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100"
            }`}
            title="Konfigurasi Supabase Storage"
          >
            <Settings className="h-4 w-4 text-amber-500" />
            <span>Setup Supabase</span>
          </button>

          <button
            onClick={handleDownloadZip}
            className="p-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 shadow-md transition-all duration-200"
            title="Download Project ZIP"
          >
            <Download className="h-4 w-4" />
            <span>Unduh ZIP</span>
          </button>

          <button
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.click();
            }}
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isDark 
                ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800" 
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100"
            }`}
            title="Unggah Kode ZIP"
          >
            <Upload className="h-4 w-4 text-indigo-400" />
            <span>Unggah ZIP</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleZipUploadChange} 
            accept=".zip" 
            className="hidden" 
          />

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-2.5 rounded-xl border transition-all ${
              isDark 
                ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800" 
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100"
            }`}
            title="Fullscreen Toggle"
          >
            {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
            title="Tutup Workspace"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* CORE WORKSPACE GRID */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* PANEL KIRI: FILE TREE EXPLORER & CLOUD STORAGE SYNC */}
        <div className={`w-64 border-r flex flex-col shrink-0 ${isDark ? "border-zinc-850 bg-zinc-950" : "border-zinc-200 bg-zinc-100/40"}`}>
          <div className="p-4 border-b border-zinc-850 flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-zinc-500">Berkas Project</span>
            <button
              onClick={() => setShowNewFileInput(!showNewFileInput)}
              className="p-1 rounded hover:bg-amber-500/10 text-amber-500 transition-colors"
              title="Buat File Baru"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* New file inline input */}
          {showNewFileInput && (
            <div className="p-3 border-b border-zinc-800/50 bg-amber-500/5 flex flex-col gap-2">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="namafile.html, app.js..."
                className={`w-full px-2.5 py-1.5 text-xs rounded border focus:outline-none ${
                  isDark ? "bg-zinc-900 border-zinc-800 text-zinc-200 focus:border-amber-500" : "bg-white border-zinc-200 text-zinc-800 focus:border-amber-500"
                }`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddFile();
                }}
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setShowNewFileInput(false)}
                  className="px-2 py-1 text-[10px] font-semibold rounded text-zinc-400 hover:bg-zinc-850"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddFile}
                  className="px-2.5 py-1 text-[10px] font-bold rounded bg-amber-500 text-white"
                >
                  Tambah
                </button>
              </div>
            </div>
          )}

          {/* LIST FILES */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
            {files.map(file => {
              const isActive = file.path === activeFilePath;
              const isHtml = file.path.endsWith(".html");
              const isJs = file.path.endsWith(".js");
              const isJson = file.path.endsWith(".json");
              
              return (
                <div
                  key={file.path}
                  className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    isActive 
                      ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                      : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
                  }`}
                  onClick={() => setActiveFilePath(file.path)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isHtml ? <Code className="h-4 w-4 text-orange-400 shrink-0" /> :
                     isJs ? <FileCode className="h-4 w-4 text-yellow-400 shrink-0" /> :
                     isJson ? <FileJson className="h-4 w-4 text-emerald-400 shrink-0" /> :
                     <File className="h-4 w-4 text-zinc-400 shrink-0" />}
                    <span className="truncate">{file.path}</span>
                  </div>
                  {file.path !== "index.html" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.path);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/10 text-rose-400 transition-all shrink-0"
                      title="Hapus File"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* SUPABASE DEPLOY/SYNC COMPONENT */}
          <div className={`p-4 border-t shrink-0 ${isDark ? "border-zinc-850 bg-zinc-950/40" : "border-zinc-200 bg-zinc-100/30"}`}>
            <div className="flex items-center gap-1.5 mb-3">
              <Database className="h-4 w-4 text-amber-500 animate-pulse" />
              <span className="text-xs font-bold text-zinc-400">Supabase Cloud Sync</span>
            </div>

            {supabaseUrl && supabaseAnonKey ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleUploadToSupabase}
                    className="flex-1 py-2 px-3 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1 shadow transition-all"
                    title="Simpan file saat ini ke Supabase Storage"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Cloud</span>
                  </button>

                  <button
                    onClick={handleLoadFromSupabase}
                    className="flex-1 py-2 px-3 rounded-lg text-[11px] font-bold bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center gap-1 shadow transition-all"
                    title="Tarik file dari Supabase Storage"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </button>
                </div>

                <button
                  onClick={handleDeleteProjectSupabase}
                  className="w-full py-1.5 px-3 rounded-lg text-[10px] font-medium border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 flex items-center justify-center gap-1 transition-all"
                  title="Hapus berkas project dari bucket Supabase agar tidak numpuk"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Bersihkan Storage</span>
                </button>
              </div>
            ) : (
              <div className="text-center p-3 rounded-xl border border-dashed border-zinc-850 bg-zinc-950/20">
                <p className="text-[10px] text-zinc-500 leading-normal mb-2.5">Simpan project di awan, cegah data hilang.</p>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="w-full py-1.5 px-3 rounded-lg text-[10px] font-bold bg-amber-500 text-white hover:bg-amber-450 transition-all flex items-center justify-center gap-1"
                >
                  <CloudLightning className="h-3.5 w-3.5" />
                  <span>Koneksikan Supabase</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PANEL TENGAH: CODE EDITOR WORKSPACE */}
        <div className={`flex-1 flex flex-col min-w-0 ${isDark ? "bg-zinc-950" : "bg-white"}`}>
          {/* Editor Header showing filename */}
          <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${isDark ? "border-zinc-850 bg-zinc-950" : "border-zinc-200 bg-zinc-50"}`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold font-mono px-2 py-1 rounded bg-zinc-500/10 text-amber-500`}>
                {activeFilePath}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">• Kode Sumber Utama</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1 shrink-0">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                Auto-Saved
              </span>
            </div>
          </div>

          {/* TextArea styled code editor */}
          <div className="flex-1 flex relative font-mono overflow-hidden">
            {/* Mock Line numbers */}
            <div className={`w-12 select-none text-right pr-3 pt-4 text-xs font-mono border-r select-none ${
              isDark ? "bg-zinc-950 border-zinc-850 text-zinc-600" : "bg-zinc-50 border-zinc-200 text-zinc-400"
            }`}>
              {Array.from({ length: Math.max(activeFile.content.split("\n").length, 30) }).map((_, i) => (
                <div key={i} className="h-6 leading-6">{i + 1}</div>
              ))}
            </div>

            {/* Editor Textarea */}
            <textarea
              value={activeFile.content}
              onChange={handleEditorChange}
              className={`flex-1 h-full p-4 text-xs font-mono focus:outline-none resize-none leading-6 leading-relaxed ${
                isDark ? "bg-zinc-950 text-zinc-200 focus:bg-zinc-950" : "bg-white text-zinc-800"
              }`}
              spellCheck="false"
            />
          </div>

          {/* AI ASSISTANT CONSOLE BOTTOM BAR (Cursor/AI Studio style) */}
          <div className={`p-4 border-t ${isDark ? "border-zinc-850 bg-zinc-950/90" : "border-zinc-200 bg-zinc-50/80"}`}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                <span className="text-xs font-bold tracking-tight text-amber-500">ExeCode AI Assistant (Gemini)</span>
                <span className="text-[10px] text-zinc-500">• Tulis prompt instruksi untuk mengedit atau membuat halaman secara otomatis</span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ketik instruksi: 'tambahkan navbar cantik', 'ubah tema tombol jadi modern', atau 'buat game tic-tac-toe'..."
                  disabled={isAIEditing}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isAIEditing) handleSendPromptToAI();
                  }}
                  className={`w-full pl-4 pr-32 py-3 rounded-xl text-xs transition-all focus:outline-none focus:ring-1 focus:ring-amber-500/50 border ${
                    isDark 
                      ? "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:bg-zinc-950" 
                      : "bg-white border-zinc-200 text-zinc-850 placeholder-zinc-400 focus:bg-white focus:border-amber-500"
                  }`}
                />
                
                <button
                  onClick={handleSendPromptToAI}
                  disabled={isAIEditing || !aiPrompt.trim()}
                  className={`absolute right-2 top-2 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isAIEditing 
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                      : !aiPrompt.trim()
                        ? "bg-zinc-700/50 text-zinc-400"
                        : "bg-amber-500 hover:bg-amber-450 text-white shadow-md cursor-pointer active:scale-95"
                  }`}
                >
                  {isAIEditing ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Editing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Edit Kode</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL KANAN: INTERACTIVE LIVE PREVIEW */}
        <div className={`w-96 border-l flex flex-col shrink-0 ${isDark ? "border-zinc-850 bg-zinc-950" : "border-zinc-200 bg-zinc-100/20"}`}>
          <div className="p-4 border-b border-zinc-850 flex items-center justify-between shrink-0 bg-zinc-950">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Live Preview</span>
            </div>
            
            {/* Device frame selector */}
            <div className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-lg border border-zinc-800/80">
              <button
                onClick={() => setDeviceMode("desktop")}
                className={`p-1.5 rounded-md transition-all ${deviceMode === "desktop" ? "bg-amber-500 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                title="Pratinjau Desktop"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDeviceMode("mobile")}
                className={`p-1.5 rounded-md transition-all ${deviceMode === "mobile" ? "bg-amber-500 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                title="Pratinjau Smartphone"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
              <div className="h-4 w-px bg-zinc-800 mx-1" />
              <button
                onClick={() => setPreviewKey(prev => prev + 1)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Muat Ulang Preview"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Simulated Browser Bar with Address */}
          <div className="px-4 py-2 flex items-center gap-2 bg-zinc-900/40 border-b border-zinc-900 shrink-0">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="flex-1 bg-zinc-900/80 rounded-md border border-zinc-800 px-3 py-1 text-[10px] text-zinc-500 font-mono flex items-center justify-between overflow-hidden">
              <span className="truncate">https://execode.local/{projectName.toLowerCase().replace(/\s+/g, "-")}/preview</span>
              <RefreshCw 
                className="h-3 w-3 shrink-0 text-zinc-600 hover:text-zinc-400 cursor-pointer transition-colors" 
                onClick={() => setPreviewKey(prev => prev + 1)}
              />
            </div>
          </div>

          {/* Interactive Frame Box */}
          <div className="flex-1 flex items-center justify-center p-6 bg-zinc-900/20 overflow-hidden relative">
            {deviceMode === "mobile" ? (
              /* SMARTPHONE FRAME */
              <div className="w-[280px] h-[540px] rounded-[36px] bg-zinc-950 border-[10px] border-zinc-900 shadow-2xl relative flex flex-col overflow-hidden animate-fade-in ring-1 ring-zinc-800/50">
                {/* Speaker Grill / Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-6 bg-zinc-900 rounded-b-2xl z-20 flex items-center justify-center">
                  <div className="w-12 h-1 bg-zinc-800 rounded-full" />
                </div>
                {/* Simulated Iframe container */}
                <iframe
                  key={previewKey}
                  src={getCombinedPreviewBlob()}
                  className="w-full h-full border-none rounded-[24px] bg-slate-950"
                  sandbox="allow-scripts"
                  title="Mobile App Preview"
                />
                {/* Bottom line home bar */}
                <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-zinc-800 rounded-full" />
              </div>
            ) : (
              /* DESKTOP BOX FRAME */
              <div className="w-full h-full rounded-xl bg-slate-950 border border-zinc-850 shadow-2xl overflow-hidden flex flex-col">
                <iframe
                  key={previewKey}
                  src={getCombinedPreviewBlob()}
                  className="w-full h-full border-none bg-slate-950"
                  sandbox="allow-scripts"
                  title="Desktop App Preview"
                />
              </div>
            )}
          </div>
        </div>

      </div>

      {/* SETUP / CONFIG MODAL (Supabase Credentials Drawer) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-fade-in ${
            isDark ? "bg-zinc-900 border-zinc-850 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-amber-500 animate-bounce" />
                <h3 className="font-display font-bold text-base">Konfigurasi Supabase Storage</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className={`p-1.5 rounded-lg hover:bg-zinc-500/10 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl border border-amber-500/15 bg-amber-500/5 text-amber-500 leading-normal mb-3">
                <p className="font-semibold mb-1">Panduan Pengaturan Bucket Supabase:</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                  <li>Buat akun gratis di <strong className="underline">https://supabase.com</strong>.</li>
                  <li>Buat sebuah proyek baru lalu masuk ke tab <strong>Storage</strong>.</li>
                  <li>Buat bucket baru bernama <strong>execode</strong> (atau nama kustom Anda).</li>
                  <li>Pastikan bucket diatur sebagai <strong>Public</strong> agar file dapat diunggah dengan aman.</li>
                  <li>Salin <strong>URL Proyek</strong> dan <strong>Anon Public Key</strong> Anda dari halaman <em>Project Settings &gt; API</em> lalu masukkan ke kolom di bawah.</li>
                </ol>
              </div>

              <div>
                <label className="block font-bold text-zinc-400 mb-1.5 uppercase tracking-wider text-[10px]">SUPABASE PROJECT URL</label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzabcdefg.supabase.co"
                  className={`w-full px-3 py-2 rounded-xl focus:outline-none border text-xs ${
                    isDark ? "bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-amber-500" : "bg-zinc-100 border-zinc-200 text-zinc-800 focus:border-amber-500"
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-400 mb-1.5 uppercase tracking-wider text-[10px]">SUPABASE ANON KEY / SERVICE ACCOUNT</label>
                <input
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImNh..."
                  className={`w-full px-3 py-2 rounded-xl focus:outline-none border text-xs ${
                    isDark ? "bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-amber-500" : "bg-zinc-100 border-zinc-200 text-zinc-800 focus:border-amber-500"
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-400 mb-1.5 uppercase tracking-wider text-[10px]">STORAGE BUCKET NAME</label>
                <input
                  type="text"
                  value={supabaseBucket}
                  onChange={(e) => setSupabaseBucket(e.target.value)}
                  placeholder="execode"
                  className={`w-full px-3 py-2 rounded-xl focus:outline-none border text-xs ${
                    isDark ? "bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-amber-500" : "bg-zinc-100 border-zinc-200 text-zinc-800 focus:border-amber-500"
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    // Quick clear
                    setSupabaseUrl("");
                    setSupabaseAnonKey("");
                    setSupabaseBucket("execode");
                    localStorage.removeItem("execode_sb_url");
                    localStorage.removeItem("execode_sb_key");
                    localStorage.removeItem("execode_sb_bucket");
                    triggerStatus("Koneksi Supabase berhasil diputuskan.", "info");
                  }}
                  className="px-4 py-2 rounded-xl font-semibold border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  Disconnect API
                </button>
                <button
                  onClick={() => {
                    if (!supabaseUrl || !supabaseAnonKey || !supabaseBucket) {
                      triggerStatus("Mohon lengkapi semua bidang isian!", "error");
                      return;
                    }
                    localStorage.setItem("execode_sb_url", supabaseUrl);
                    localStorage.setItem("execode_sb_key", supabaseAnonKey);
                    localStorage.setItem("execode_sb_bucket", supabaseBucket);
                    setShowConfigModal(false);
                    triggerStatus("Kredensial Supabase berhasil disimpan secara lokal dan aman!", "success");
                  }}
                  className="px-4 py-2 rounded-xl font-bold bg-amber-500 text-white hover:bg-amber-450 transition-colors shadow-md"
                >
                  Simpan Konfigurasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";

interface VirtualFile {
  path: string;
  content: string;
}

interface PublicProjectViewProps {
  projectId: string;
}

export function PublicProjectView({ projectId }: PublicProjectViewProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    setError(null);

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
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Proyek tidak ditemukan di cloud.");
        }
        return res.json();
      })
      .then((data) => {
        if (data.files && data.files.length > 0) {
          const customFiles: VirtualFile[] = data.files;
          
          const htmlFile = customFiles.find(f => f.path.toLowerCase() === "index.html");
          const jsFile = customFiles.find(f => f.path.toLowerCase() === "app.js");
          const cssFile = customFiles.find(f => f.path.toLowerCase() === "style.css");

          let finalHtml = htmlFile ? htmlFile.content : "<h1>No index.html file found!</h1>";

          // Inject styles if style.css exists
          if (cssFile) {
            const styleTag = `<style>\n${cssFile.content}\n</style>`;
            if (finalHtml.includes("</head>")) {
              finalHtml = finalHtml.replace("</head>", `${styleTag}\n</head>`);
            } else {
              finalHtml = styleTag + finalHtml;
            }
          }

          // Inject js if app.js exists
          if (jsFile) {
            const scriptTag = `<script>\n${jsFile.content}\n</script>`;
            if (finalHtml.includes("</body>")) {
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
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        } else {
          throw new Error("Proyek kosong atau tidak memiliki file.");
        }
      })
      .catch((err: any) => {
        console.error("Public load error:", err);
        setError(err.message || "Gagal memuat proyek publik.");
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 font-sans">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
          <p className="text-sm font-mono text-zinc-400">Memuat proyek publik '{projectId}'...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 font-sans p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="inline-flex p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full">
            <AlertCircle className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">Proyek Tidak Ditemukan</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Proyek dengan ID <code className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-amber-400">{projectId}</code> tidak ditemukan atau belum dipublikasikan ke cloud.
            </p>
          </div>
          <p className="text-xs text-zinc-500">
            Pastikan ID proyek benar atau minta pemilik untuk melakukan "Publish" terlebih dahulu di ExeCode Workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden z-50">
      <iframe
        src={previewUrl}
        className="w-full h-full border-none m-0 p-0"
        title={`Public Preview of ${projectId}`}
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
}

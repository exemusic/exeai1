import app from "./api/index";
import express from "express";
import path from "path";

async function startServer() {
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  // Determine production robustly (bundled or explicit NODE_ENV)
  const isProduction = process.env.NODE_ENV === "production" || 
    (typeof __filename !== "undefined" ? !__filename.endsWith(".ts") : !import.meta.url.endsWith(".ts"));

  // Vite integration
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For Express v4 / SPA routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ExeAi Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});


import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Mock AI Pipeline Endpoint
  app.post("/api/generate-pcb", async (req, res) => {
    const { prompt, parameters } = req.body;
    console.log("Generating PCB for:", prompt);
    
    // In a real app, we'd call Gemini here if processing takes a long time or needs secrets
    // but the system instruction says call Gemini from frontend ALWAYS.
    // However, the user asked for a "Backend: FastAPI (Python)" and "AI Pipeline"
    // I will handle the orchestration here if needed, but I'll follow the "Call Gemini from frontend" rule for the actual AI generation logic.
    // I'll provide a mock structured response for the Gerber/ZIP structure if requested.
    
    res.json({
      jobId: Math.random().toString(36).substring(7),
      message: "Pipeline started"
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

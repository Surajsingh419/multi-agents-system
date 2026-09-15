import express from "express";
import cors from "cors";
import { streamResearchPipeline, runResearchPipeline } from "./graph/workflow.js";
import "./config.js";

const app = express();

app.use(cors());
app.use(express.json());

const rateLimitMap = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60000;
  const maxRequests = 5;

  const requests = rateLimitMap.get(ip) || [];
  const recent = requests.filter((t) => now - t < windowMs);

  if (recent.length >= maxRequests) {
    return res.status(429).json({
      error: "Too many requests. Please wait a minute before trying again.",
    });
  }

  recent.push(now);
  rateLimitMap.set(ip, recent);
  next();
}

app.post("/api/research", rateLimit, async (req, res) => {
  const { query } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Query is required" });
  }

  console.log(`\n📨 New research request: "${query}"`);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const heartbeat = setInterval(() => {
    if (!res.writableEnded && !res.destroyed) {
      res.write(": keepalive\n\n");
    }
  }, 4000);

  res.on("close", () => {
    if (!res.writableEnded) {
      console.log("📴 Client closed connection early");
    }
  });

  try {
    await streamResearchPipeline(query, (event) => {
      if (res.writableEnded || res.destroyed) return;

      const data = JSON.stringify(event);
      res.write(`data: ${data}\n\n`);
      if (typeof res.flush === "function") {
        res.flush();
      }
    });
  } catch (error) {
    console.error("Research pipeline error:", error);
    if (!res.writableEnded && !res.destroyed) {
      res.write(
        `data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`
      );
    }
  } finally {
    clearInterval(heartbeat);
    if (!res.writableEnded && !res.destroyed) {
      res.end();
    }
  }
});

app.post("/api/research/sync", rateLimit, async (req, res) => {
  const { query } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const result = await runResearchPipeline(query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export { app };

export async function startServer() {
  const PORT = process.env.PORT || 3001;

  const path = await import("path");
  const { fileURLToPath } = await import("url");
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const clientBuildPath = path.join(__dirname, "..", "client", "dist");

  app.use(express.static(clientBuildPath));

  app.get("/{*splat}", (req, res) => {
    const indexPath = path.join(clientBuildPath, "index.html");
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(200).send(`
          <h1>🤖 Multi-Agent Research System</h1>
          <p>API is running on port ${PORT}.</p>
          <p>Build the React frontend: <code>cd client && npm run build</code></p>
          <p>Or run dev mode: <code>cd client && npm run dev</code></p>
        `);
      }
    });
  });

  app.listen(PORT, () => {
    console.log("\n" + "═".repeat(60));
    console.log("  🤖 Multi-Agent Research System — API Server");
    console.log(`  🌐 http://localhost:${PORT}`);
    console.log(`  📡 SSE endpoint: POST /api/research`);
    console.log("═".repeat(60) + "\n");
  });
}

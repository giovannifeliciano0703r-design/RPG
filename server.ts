import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import crypto from "node:crypto";
import { FixedWindowRateLimiter } from "./src/utils/rateLimiter";

dotenv.config();

const app = express();
const PORT = 3000;
const apiLimiter = new FixedWindowRateLimiter(120, 60_000);

app.disable("x-powered-by");
app.use(express.json({ limit: "256kb" }));
app.use((req, res, next) => {
  const requestId = req.get("x-request-id")?.slice(0, 80) || crypto.randomUUID();
  const startedAt = performance.now();
  res.setHeader("X-Request-Id", requestId);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    );
  }
  res.once("finish", () => {
    console.log(JSON.stringify({
      level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
      event: "http.request",
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(performance.now() - startedAt),
    }));
  });
  next();
});

app.use("/api", (req, res, next) => {
  const result = apiLimiter.consume(req.ip || "unknown");
  res.setHeader("RateLimit-Limit", "120");
  res.setHeader("RateLimit-Remaining", String(result.remaining));
  res.setHeader("RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
  if (!result.allowed) {
    res.setHeader("Retry-After", String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))));
    res.status(429).json({ error: "Muitas requisições. Aguarde um instante e tente novamente." });
    return;
  }
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const origin = req.get("origin");
  const host = req.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        res.status(403).json({ error: "Origem da requisição não permitida." });
        return;
      }
    } catch {
      res.status(403).json({ error: "Origem da requisição inválida." });
      return;
    }
  }
  next();
});

app.get("/api/health", async (_req, res) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  let database: "ok" | "unconfigured" | "unreachable" = supabaseUrl && supabaseKey ? "unreachable" : "unconfigured";
  if (supabaseUrl && supabaseKey) {
    try {
      const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/health`, {
        headers: { apikey: supabaseKey }, signal: AbortSignal.timeout(2_500),
      });
      database = response.ok ? "ok" : "unreachable";
    } catch { database = "unreachable"; }
  }
  const healthy = database === "ok" || (process.env.NODE_ENV !== "production" && database === "unconfigured");
  if (!healthy) console.error(JSON.stringify({ level: "error", event: "health.degraded", database }));
  res.setHeader("Cache-Control", "no-store");
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    database,
    uptimeSeconds: Math.floor(process.uptime()),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || "local",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/client-errors", (req, res) => {
  const errorId = typeof req.body?.errorId === "string" ? req.body.errorId.slice(0, 80) : "unknown";
  const errorName = typeof req.body?.errorName === "string" ? req.body.errorName.slice(0, 80) : "Error";
  const allowedEvents = new Set(["client.render_failed", "client.unhandled_error", "client.unhandled_rejection"]);
  const event = typeof req.body?.event === "string" && allowedEvents.has(req.body.event) ? req.body.event : "client.unknown_error";
  const route = typeof req.body?.route === "string" ? req.body.route.replace(/[^\w\s./:-]/g, "").slice(0, 240) : "";
  const componentStack = typeof req.body?.componentStack === "string"
    ? req.body.componentStack.replace(/[^\w\s()./\\:-]/g, "").slice(0, 1_500)
    : "";
  console.error(JSON.stringify({ level: "error", event, errorId, errorName, route, componentStack }));
  res.status(202).json({ accepted: true, errorId });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mestre Arcano Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error(JSON.stringify({ level: "fatal", event: "server.start_failed", message: error instanceof Error ? error.message : "unknown" }));
  process.exitCode = 1;
});

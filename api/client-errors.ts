import { FixedWindowRateLimiter } from "../src/utils/rateLimiter";

const limiter = new FixedWindowRateLimiter(20, 60_000);

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return true;
  try { return new URL(origin).host === host; } catch { return false; }
}

export default {
  async fetch(request: Request) {
    if (request.method !== "POST") return Response.json({ error: "Método não permitido." }, { status: 405, headers: { Allow: "POST" } });
    if (!sameOrigin(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rate = limiter.consume(clientIp);
    if (!rate.allowed) return Response.json({ error: "Muitos registros em pouco tempo." }, { status: 429, headers: { "Retry-After": "60" } });

    const raw = await request.text();
    if (raw.length > 4_096) return Response.json({ error: "Registro excede o limite permitido." }, { status: 413 });
    let body: Record<string, unknown>;
    try { body = JSON.parse(raw) as Record<string, unknown>; }
    catch { return Response.json({ error: "Registro inválido." }, { status: 400 }); }

    const errorId = typeof body.errorId === "string" ? body.errorId.slice(0, 80) : "unknown";
    const errorName = typeof body.errorName === "string" ? body.errorName.slice(0, 80) : "Error";
    const allowedEvents = new Set(["client.render_failed", "client.unhandled_error", "client.unhandled_rejection"]);
    const event = typeof body.event === "string" && allowedEvents.has(body.event) ? body.event : "client.unknown_error";
    const route = typeof body.route === "string" ? body.route.replace(/[^\w\s./:-]/g, "").slice(0, 240) : "";
    const componentStack = typeof body.componentStack === "string"
      ? body.componentStack.replace(/[^\w\s()./\\:-]/g, "").slice(0, 1_500)
      : "";
    console.error(JSON.stringify({ level: "error", event, errorId, errorName, route, componentStack }));
    return Response.json({ accepted: true, errorId }, { status: 202, headers: { "Cache-Control": "no-store" } });
  },
};

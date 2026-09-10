export default {
  async fetch() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    let database: "ok" | "unconfigured" | "unreachable" = supabaseUrl && supabaseKey ? "unreachable" : "unconfigured";

    if (supabaseUrl && supabaseKey) {
      try {
        const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/health`, {
          headers: { apikey: supabaseKey },
          signal: AbortSignal.timeout(2_500),
        });
        database = response.ok ? "ok" : "unreachable";
      } catch {
        database = "unreachable";
      }
    }

    const healthy = database === "ok";
    if (!healthy) console.error(JSON.stringify({ level: "error", event: "health.degraded", database }));
    return Response.json({
      status: healthy ? "ok" : "degraded",
      database,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || "unknown",
      timestamp: new Date().toISOString(),
    }, {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    });
  },
};

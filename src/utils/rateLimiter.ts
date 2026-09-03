export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number };

type Entry = { count: number; resetAt: number };

export class FixedWindowRateLimiter {
  private readonly entries = new Map<string, Entry>();

  constructor(private readonly limit: number, private readonly windowMs: number) {}

  consume(key: string, now = Date.now()): RateLimitResult {
    const current = this.entries.get(key);
    const entry = !current || current.resetAt <= now ? { count: 0, resetAt: now + this.windowMs } : current;
    entry.count += 1;
    this.entries.set(key, entry);
    if (this.entries.size > 10_000) this.prune(now);
    return { allowed: entry.count <= this.limit, remaining: Math.max(0, this.limit - entry.count), resetAt: entry.resetAt };
  }

  prune(now = Date.now()) {
    for (const [key, entry] of this.entries) if (entry.resetAt <= now) this.entries.delete(key);
  }
}

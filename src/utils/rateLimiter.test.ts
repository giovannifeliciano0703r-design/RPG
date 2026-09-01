import { describe, expect, it } from "vitest";
import { FixedWindowRateLimiter } from "./rateLimiter";

describe("FixedWindowRateLimiter", () => {
  it("blocks requests above the limit without negative remaining counts", () => {
    const limiter = new FixedWindowRateLimiter(2, 1_000);
    expect(limiter.consume("client", 100).allowed).toBe(true);
    expect(limiter.consume("client", 101)).toMatchObject({ allowed: true, remaining: 0 });
    expect(limiter.consume("client", 102)).toMatchObject({ allowed: false, remaining: 0 });
  });

  it("opens a fresh window after expiry and isolates clients", () => {
    const limiter = new FixedWindowRateLimiter(1, 100);
    expect(limiter.consume("a", 0).allowed).toBe(true);
    expect(limiter.consume("a", 50).allowed).toBe(false);
    expect(limiter.consume("b", 50).allowed).toBe(true);
    expect(limiter.consume("a", 100).allowed).toBe(true);
  });
});

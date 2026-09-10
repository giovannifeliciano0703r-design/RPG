import { describe, expect, it } from "vitest";
import { getSyncRetryDelay } from "./syncRetry";

describe("account sync retry delay", () => {
  it("keeps the initial debounce and increases delay after failures", () => {
    expect([0, 1, 2, 3].map(getSyncRetryDelay)).toEqual([900, 1800, 3600, 7200]);
  });

  it("caps repeated failures and tolerates invalid counters", () => {
    expect(getSyncRetryDelay(1000)).toBe(30_000);
    expect(getSyncRetryDelay(Infinity)).toBe(30_000);
    expect(getSyncRetryDelay(-1)).toBe(900);
  });
});

import { describe, expect, it, vi } from "vitest";
import { settleInScope } from "./scopedAsync";

describe("settleInScope", () => {
  it("applies the result while the requesting account remains current", async () => {
    const apply = vi.fn();
    await settleInScope(async () => "account-data", () => true, apply, vi.fn());
    expect(apply).toHaveBeenCalledWith("account-data");
  });

  it("ignores a response after switching accounts", async () => {
    let current = true;
    const apply = vi.fn();
    await settleInScope(async () => { current = false; return "old-account"; }, () => current, apply, vi.fn());
    expect(apply).not.toHaveBeenCalled();
  });

  it("catches recovery failures without an unhandled rejection", async () => {
    const error = new Error("network unavailable");
    const report = vi.fn();
    await settleInScope(async () => { throw error; }, () => true, vi.fn(), report);
    expect(report).toHaveBeenCalledWith(error);
  });

  it("ignores stale failures and never starts expired work", async () => {
    let current = true;
    const report = vi.fn();
    await settleInScope(async () => { current = false; throw new Error("old failure"); }, () => current, vi.fn(), report);
    const operation = vi.fn();
    await settleInScope(operation, () => false, vi.fn(), report);
    expect(report).not.toHaveBeenCalled();
    expect(operation).not.toHaveBeenCalled();
  });
});

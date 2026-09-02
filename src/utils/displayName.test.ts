import { describe, expect, it } from "vitest";
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  getDisplayNameError,
  normalizeDisplayName,
} from "./displayName";

describe("displayName", () => {
  it("normalizes surrounding and repeated whitespace", () => {
    expect(normalizeDisplayName("  Mestre   Arcano  ")).toBe("Mestre Arcano");
  });

  it("enforces the database length boundaries", () => {
    expect(getDisplayNameError("x".repeat(DISPLAY_NAME_MIN_LENGTH - 1))).toContain(String(DISPLAY_NAME_MIN_LENGTH));
    expect(getDisplayNameError("x".repeat(DISPLAY_NAME_MAX_LENGTH + 1))).toContain(String(DISPLAY_NAME_MAX_LENGTH));
    expect(getDisplayNameError("Ur".padEnd(DISPLAY_NAME_MAX_LENGTH, "i"))).toBeNull();
  });
});

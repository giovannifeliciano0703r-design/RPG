import { describe, expect, it } from "vitest";
import { DEFAULT_RPG_SYSTEM, isRpgSystem, normalizeRpgSystem } from "./rpgSystems";

describe("RPG system domain", () => {
  it("normalizes canonical and legacy values case-insensitively", () => {
    expect(normalizeRpgSystem("  d&d 5E ")).toBe("Dungeons & Dragons (D&D)");
    expect(normalizeRpgSystem("tormenta20")).toBe("Tormenta20 (T20)");
    expect(normalizeRpgSystem("PATHFINDER 2E")).toBe("Pathfinder");
  });

  it("uses one safe default for invalid values", () => {
    expect(normalizeRpgSystem("sistema inventado")).toBe(DEFAULT_RPG_SYSTEM);
    expect(isRpgSystem(DEFAULT_RPG_SYSTEM)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { getCandidateModels } from "./aiConfig";

describe("getCandidateModels", () => {
  it("uses current stable defaults", () => {
    expect(getCandidateModels()).toEqual(["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"]);
  });

  it("rejects unknown identifiers and removes duplicates", () => {
    expect(getCandidateModels("attacker-model, gemini-3.6-flash, gemini-3.6-flash")).toEqual(["gemini-3.6-flash"]);
  });
});

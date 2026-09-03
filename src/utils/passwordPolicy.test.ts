import { describe, expect, it } from "vitest";
import { getPasswordPolicyError, isPasswordPolicySatisfied, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./passwordPolicy";

describe("passwordPolicy", () => {
  it("accepts long passphrases without arbitrary composition rules", () => {
    expect(isPasswordPolicySatisfied("quatro palavras bem seguras")).toBe(true);
  });

  it("enforces the documented length boundaries", () => {
    expect(getPasswordPolicyError("x".repeat(PASSWORD_MIN_LENGTH - 1))).toContain(String(PASSWORD_MIN_LENGTH));
    expect(getPasswordPolicyError("x".repeat(PASSWORD_MAX_LENGTH + 1))).toContain(String(PASSWORD_MAX_LENGTH));
  });
});

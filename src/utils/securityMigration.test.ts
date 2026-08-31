import { describe, expect, it } from "vitest";
import { sanitizeLocalProfile } from "./securityMigration";

describe("sanitizeLocalProfile", () => {
  it("removes credentials and client-side privileges", () => {
    const sanitized = sanitizeLocalProfile({
      password: "plaintext",
      authorization: { source: "server" },
      isAdmin: true,
      role: "Administrador (ADM)",
      favoriteSystem: "D&D 5e",
    });
    expect(sanitized).not.toHaveProperty("password");
    expect(sanitized).not.toHaveProperty("authorization");
    expect(sanitized.isAdmin).toBe(false);
    expect(sanitized.role).toBe("Mestre da Mesa");
    expect(sanitized.favoriteSystem).toBe("Dungeons & Dragons (D&D)");
  });
});

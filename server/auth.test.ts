import { afterEach, describe, expect, it } from "vitest";
import { createAdminSessionToken, verifyAdminSessionToken } from "./auth";
import { hashPassword, verifyPassword } from "./authz";

const originalAdminIds = process.env.ADMIN_USER_IDS;

afterEach(() => {
  process.env.ADMIN_USER_IDS = originalAdminIds;
});

describe("password helpers", () => {
  it("hashes with a random salt and verifies safely", () => {
    const first = hashPassword("correct horse battery staple");
    const second = hashPassword("correct horse battery staple");
    expect(first).not.toBe(second);
    expect(verifyPassword("correct horse battery staple", first)).toBe(true);
    expect(verifyPassword("wrong", first)).toBe(false);
    expect(verifyPassword("anything", "scrypt:bad:not-hex")).toBe(false);
  });
});

describe("admin session tokens", () => {
  it("accepts allowlisted, signed, non-expired sessions and rejects tampering", () => {
    process.env.ADMIN_USER_IDS = "admin-1";
    const now = Date.now();
    const session = {
      userId: "admin-1",
      email: "admin@example.test",
      name: "Admin",
      permissions: ["knowledge:manage"] as ["knowledge:manage"],
      issuedAt: now,
      expiresAt: now + 60_000,
    };
    const secret = "a".repeat(32);
    const token = createAdminSessionToken(session, secret);
    expect(verifyAdminSessionToken(token, secret, now)).toEqual(session);
    expect(verifyAdminSessionToken(`${token}tampered`, secret, now)).toBeNull();
    expect(verifyAdminSessionToken(token, secret, now + 60_001)).toBeNull();
  });
});

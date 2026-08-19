import crypto from "node:crypto";

/** Server-only admin authorization. Never trust an email prefix or a client-provided role. */
export function isServerAdmin(userId: string | undefined): boolean {
  if (!userId) return false;
  const allowlist = (process.env.ADMIN_USER_IDS || "").split(",").map((id) => id.trim()).filter(Boolean);
  return allowlist.includes(userId);
}

/** Password helper for a future real authentication backend. Never store plaintext passwords. */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, expected] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

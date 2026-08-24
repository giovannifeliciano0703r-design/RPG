import crypto from "node:crypto";
import type { Request, Response } from "express";
import { isServerAdmin, verifyPassword } from "./authz";

const COOKIE_NAME = "mestre_arcano_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

interface AdminSession {
  userId: string;
  email: string;
  name: string;
  permissions: ["knowledge:manage"];
  issuedAt: number;
  expiresAt: number;
}

function getSessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(encodedPayload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createAdminSessionToken(session: AdminSession, secret: string): string {
  const payload = encode(JSON.stringify(session));
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyAdminSessionToken(token: string, secret: string, now = Date.now()): AdminSession | null {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra || !safeEqual(signature, sign(payload, secret))) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<AdminSession>;
    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= now ||
      !isServerAdmin(parsed.userId) ||
      parsed.permissions?.[0] !== "knowledge:manage"
    ) {
      return null;
    }
    return parsed as AdminSession;
  } catch {
    return null;
  }
}

function readCookie(req: Request, name: string): string | null {
  const cookies = req.headers.cookie?.split(";") ?? [];
  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}

export function readAdminSession(req: Request): AdminSession | null {
  const secret = getSessionSecret();
  const token = readCookie(req, COOKIE_NAME);
  return secret && token ? verifyAdminSessionToken(token, secret) : null;
}

export function publicAdminProfile(session: AdminSession) {
  return {
    id: session.userId,
    name: session.name,
    email: session.email,
    role: "Administrador (ADM)" as const,
    avatar: "master",
    favoriteSystem: "Dungeons & Dragons (D&D)" as const,
    createdAt: session.issuedAt,
    isAdmin: true,
    authorization: {
      source: "server" as const,
      permissions: session.permissions,
    },
  };
}

export function authenticateConfiguredAdmin(email: unknown, password: unknown): AdminSession | null {
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const configuredHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  const userId = process.env.ADMIN_USER_ID?.trim();
  if (!configuredEmail || !configuredHash || !userId || !getSessionSecret()) return null;
  if (typeof email !== "string" || typeof password !== "string" || password.length > 256) return null;
  if (email.trim().toLowerCase() !== configuredEmail || !isServerAdmin(userId)) return null;
  if (!verifyPassword(password, configuredHash)) return null;

  const issuedAt = Date.now();
  return {
    userId,
    email: configuredEmail,
    name: process.env.ADMIN_DISPLAY_NAME?.trim() || "Administrador Arcano",
    permissions: ["knowledge:manage"],
    issuedAt,
    expiresAt: issuedAt + SESSION_TTL_SECONDS * 1000,
  };
}

export function setAdminSessionCookie(res: Response, session: AdminSession, persistent = true): boolean {
  const secret = getSessionSecret();
  if (!secret) return false;
  const token = createAdminSessionToken(session, secret);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const maxAge = persistent ? `; Max-Age=${SESSION_TTL_SECONDS}` : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Strict${maxAge}${secure}`,
  );
  return true;
}

export function clearAdminSessionCookie(res: Response): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0${secure}`);
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_EMAIL?.trim() &&
      process.env.ADMIN_PASSWORD_HASH?.trim() &&
      process.env.ADMIN_USER_ID?.trim() &&
      getSessionSecret(),
  );
}

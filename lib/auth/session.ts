import { createHmac, timingSafeEqual } from "node:crypto";
import type { SessionUser } from "@/lib/types";

// Lightweight, dependency-free "sign in as a seeded demo user" session. This is NOT a
// production authentication system - there is no password, MFA, or identity provider.
// It exists to make role checks and tenant scoping demonstrable end-to-end. See README
// "Security limits and current blockers" for what a real deployment still needs
// (Supabase Auth / SSO, password or passkey login, MFA, session revocation).
export const SESSION_COOKIE_NAME = "amsp_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

interface SessionPayload extends SessionUser {
  exp: number; // unix seconds
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is not set (or too short). Set a long random string in .env.local - see .env.example.",
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionCookieValue(user: SessionUser): string {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

/** Returns null for any missing, malformed, tampered, or expired cookie value. */
export function verifySessionCookieValue(value: string | undefined | null): SessionUser | null {
  if (!value) return null;

  const separatorIndex = value.lastIndexOf(".");
  if (separatorIndex <= 0) return null;

  const encodedPayload = value.slice(0, separatorIndex);
  const signature = value.slice(separatorIndex + 1);
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  const providedBuf = Buffer.from(signature, "utf8");
  const expectedBuf = Buffer.from(expectedSignature, "utf8");
  if (providedBuf.length !== expectedBuf.length || !timingSafeEqual(providedBuf, expectedBuf)) {
    return null;
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  const { exp: expiresAt, ...user } = payload;
  void expiresAt;
  return user;
}

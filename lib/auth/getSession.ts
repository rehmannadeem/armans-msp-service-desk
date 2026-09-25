import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionCookieValue } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/types";

export class UnauthenticatedError extends Error {
  constructor(message = "You must be signed in to do that.") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE_NAME)?.value ?? null;
  return verifySessionCookieValue(raw);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new UnauthenticatedError();
  }
  return session;
}

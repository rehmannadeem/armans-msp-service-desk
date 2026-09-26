import { cookies } from "next/headers";
import { getLiveConfig } from "@/lib/live/env";
import type { LiveUser } from "@/lib/live/types";

export const LIVE_ACCESS_COOKIE = "amsp_live_access";

function apiHeaders(token: string): HeadersInit {
  const { supabaseAnonKey } = getLiveConfig();
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function getLiveToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(LIVE_ACCESS_COOKIE)?.value ?? null;
}

export async function getLiveUser(): Promise<{ token: string; user: LiveUser } | null> {
  const token = await getLiveToken();
  if (!token) return null;
  const { supabaseUrl } = getLiveConfig();
  const res = await fetch(
    `${supabaseUrl}/rest/v1/users?select=id,organization_id,email,full_name,role`,
    { headers: apiHeaders(token), cache: "no-store" },
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as LiveUser[];
  const user = rows[0];
  return user ? { token, user } : null;
}

export async function requireLiveUser(): Promise<{ token: string; user: LiveUser }> {
  const session = await getLiveUser();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}

export function userApiHeaders(token: string, extra: HeadersInit = {}): HeadersInit {
  return { ...apiHeaders(token), ...extra };
}

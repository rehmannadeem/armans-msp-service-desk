import { getLiveConfig } from "@/lib/live/env";
import { userApiHeaders } from "@/lib/live/auth";

export async function supabaseRest<T>(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { supabaseUrl } = getLiveConfig();
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: userApiHeaders(token, init.headers ?? {}),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SUPABASE_${res.status}: ${body}`);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function insertRows<T>(
  token: string,
  table: string,
  body: Record<string, unknown> | Record<string, unknown>[],
): Promise<T[]> {
  return supabaseRest<T[]>(token, table, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
}

export async function patchRows<T>(
  token: string,
  tableAndFilter: string,
  body: Record<string, unknown>,
): Promise<T[]> {
  return supabaseRest<T[]>(token, tableAndFilter, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
}

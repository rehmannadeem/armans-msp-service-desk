import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service role key. This key must never reach
// the browser bundle and must never be logged. Only import this module from Route
// Handlers or Server Components (never from a "use client" file) - the runtime guard
// below throws immediately if it is ever evaluated in a browser bundle.
if (typeof window !== "undefined") {
  throw new Error("lib/supabase/admin.ts must never be imported into client-side code.");
}
//
// V1 demo-auth limitation (see README "Security limits"): because the app has its own
// lightweight "sign in as" cookie (lib/auth/session.ts) instead of Supabase Auth, every
// query is issued with this privileged client and RLS is bypassed for it by design.
// Tenant isolation for V1 is therefore enforced in the application/query layer
// (lib/domain/*.ts, always filtered by organization_id) and is covered by
// tests/tenantIsolation.test.ts. The SQL migrations still define full RLS policies
// (supabase/migrations/0002_rls_policies.sql) as the production-ready design for once
// Supabase Auth issues per-user JWTs carrying organization_id/role claims.
let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local " +
        "(see .env.example) before using any database-backed route.",
    );
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

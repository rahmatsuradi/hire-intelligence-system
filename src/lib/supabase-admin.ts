/* ═══════════════════════════════════════════════════════════════════════════
   Supabase ADMIN client — uses the service-role key to bypass RLS.

   ⚠️  SERVER ONLY. NEVER import this from a client component.
   The service-role key must stay secret; it is read from a non-public env var
   (SUPABASE_SERVICE_ROLE_KEY) so it is never bundled into client JS.

   Needed because production RLS is tightened to authenticated-only: the public
   apply flow (reading open roles, writing candidates) has no user session, so
   the anon/publishable key would be rejected (0 rows on read, 401 on write).
═══════════════════════════════════════════════════════════════════════════ */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isSupabaseAdminConfigured = Boolean(url && serviceKey);

export const supabaseAdmin: SupabaseClient | null = isSupabaseAdminConfigured
  ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

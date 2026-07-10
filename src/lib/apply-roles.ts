/* ═══════════════════════════════════════════════════════════════════════════
   Server-side reads of open roles for the PUBLIC apply flow.

   SERVER ONLY — imports the service-role admin client. Production RLS is
   authenticated-only, so the anon key can't read job_reqs; these reads run on
   the server with the service-role key. A role is "open" when status='active'
   (the app's live/published status — there is no separate 'open' value).
═══════════════════════════════════════════════════════════════════════════ */

import { supabaseAdmin } from "@/lib/supabase-admin";

export interface PublicRole {
  id: string;
  title: string;
  department: string;
  level: string;
  description: string;
  requirements: string;
  location: string;
}

function mapRole(r: Record<string, unknown>): PublicRole {
  return {
    id: r.id as string,
    title: (r.title as string) ?? "",
    department: (r.department as string) ?? "",
    level: (r.level as string) ?? "",
    description: (r.description as string) ?? "",
    requirements: (r.requirements as string) ?? "",
    location: (r.location as string) ?? "",
  };
}

/** All publicly-open roles (status='active'), newest first. */
export async function getOpenRoles(): Promise<PublicRole[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("job_reqs")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[apply-roles] getOpenRoles failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapRole);
}

/** A single open role by id, or null if not found / not open. */
export async function getOpenRole(id: string): Promise<PublicRole | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("job_reqs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[apply-roles] getOpenRole failed:", error.message);
    return null;
  }
  if (!data || (data as Record<string, unknown>).status !== "active") return null;
  return mapRole(data as Record<string, unknown>);
}

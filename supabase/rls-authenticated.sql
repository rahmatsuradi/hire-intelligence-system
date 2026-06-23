-- ═══════════════════════════════════════════════════════════════════════════
--  Hire Intelligence — Tighten RLS to authenticated users only
--  Run this AFTER login is confirmed working in production.
--  Replaces the permissive anon policies: now only logged-in (authenticated)
--  users can read/write. Anonymous access via the publishable key is blocked.
-- ═══════════════════════════════════════════════════════════════════════════

-- Remove the old permissive anon policies
drop policy if exists "anon all candidates" on public.candidates;
drop policy if exists "anon all job_reqs"   on public.job_reqs;
drop policy if exists "anon all activities" on public.activities;

-- Allow access only to authenticated (logged-in) users
create policy "auth all candidates" on public.candidates for all to authenticated using (true) with check (true);
create policy "auth all job_reqs"   on public.job_reqs   for all to authenticated using (true) with check (true);
create policy "auth all activities" on public.activities for all to authenticated using (true) with check (true);

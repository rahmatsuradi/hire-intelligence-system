-- ═══════════════════════════════════════════════════════════════════════════
--  People Intelligence — Pay module RLS (authenticated users only)
--  Mirrors supabase/rls-authenticated.sql's pattern for the Hire tables.
--
--  Discovered: pi_* tables came back from `create table` with RLS already
--  enabled but ZERO policies (some project-wide default/trigger enabled it
--  silently) -- service-role saw all 12 seed rows, the anon/authenticated
--  client saw 0 rows with no error (the classic default-deny signature).
--  Without a policy, even a LOGGED-IN user gets nothing. This adds the same
--  "authenticated, full access, no per-row scoping" policy Hire already uses
--  (single-tenant demo -- no per-tenant_id scoping needed yet, matches the
--  existing simplicity level rather than over-engineering ahead of it).
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.pi_employees        enable row level security;
alter table public.pi_compensation     enable row level security;
alter table public.pi_statutory_config enable row level security;
alter table public.pi_payroll_runs     enable row level security;
alter table public.pi_payroll_lines    enable row level security;
alter table public.pi_payslips         enable row level security;

drop policy if exists "auth all pi_employees"        on public.pi_employees;
drop policy if exists "auth all pi_compensation"      on public.pi_compensation;
drop policy if exists "auth all pi_statutory_config"  on public.pi_statutory_config;
drop policy if exists "auth all pi_payroll_runs"      on public.pi_payroll_runs;
drop policy if exists "auth all pi_payroll_lines"     on public.pi_payroll_lines;
drop policy if exists "auth all pi_payslips"          on public.pi_payslips;

create policy "auth all pi_employees"        on public.pi_employees        for all to authenticated using (true) with check (true);
create policy "auth all pi_compensation"     on public.pi_compensation     for all to authenticated using (true) with check (true);
create policy "auth all pi_statutory_config" on public.pi_statutory_config for all to authenticated using (true) with check (true);
create policy "auth all pi_payroll_runs"     on public.pi_payroll_runs     for all to authenticated using (true) with check (true);
create policy "auth all pi_payroll_lines"    on public.pi_payroll_lines    for all to authenticated using (true) with check (true);
create policy "auth all pi_payslips"         on public.pi_payslips         for all to authenticated using (true) with check (true);

-- ═══════════════════════════════════════════════════════════════════════════
--  Hire Intelligence — Supabase schema
--  Run this once in your Supabase project: SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Candidates ───
create table if not exists public.candidates (
  id                text primary key,
  name              text not null,
  email             text default '',
  phone             text default '',
  stage             text not null default 'applied',
  job_req_id        text default '',
  department        text default '',
  position          text not null,
  source            text default 'Manual',
  notes             text default '',
  cv_analysis       jsonb,
  interview_results jsonb default '[]'::jsonb,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─── Job Requisitions ───
create table if not exists public.job_reqs (
  id             text primary key,
  title          text not null,
  department     text default '',
  level          text default '',
  status         text not null default 'draft',
  description    text default '',
  requirements   text default '',
  salary_min     bigint default 0,
  salary_max     bigint default 0,
  currency       text default 'IDR',
  location       text default '',
  target_date    text default '',
  headcount      int default 1,
  hiring_manager text default '',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ─── Activity Feed ───
create table if not exists public.activities (
  id        text primary key,
  action    text not null,
  target    text default '',
  "user"    text default 'You',
  "time"    timestamptz default now(),
  "type"    text not null
);

-- Helpful index for sorting the activity feed
create index if not exists activities_time_idx on public.activities ("time" desc);

-- ═══════════════════════════════════════════════════════════════════════════
--  Row Level Security (RLS)
--  TEMPORARY: permissive policies so the public anon key can read/write.
--  This is fine for a single-user demo. We will tighten these when we add login.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.candidates enable row level security;
alter table public.job_reqs   enable row level security;
alter table public.activities enable row level security;

drop policy if exists "anon all candidates" on public.candidates;
drop policy if exists "anon all job_reqs"   on public.job_reqs;
drop policy if exists "anon all activities" on public.activities;

create policy "anon all candidates" on public.candidates for all using (true) with check (true);
create policy "anon all job_reqs"   on public.job_reqs   for all using (true) with check (true);
create policy "anon all activities" on public.activities for all using (true) with check (true);

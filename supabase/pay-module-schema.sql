-- ============================================================
-- People Intelligence — Modul PAY (skema ADITIF)
-- Aman dijalankan di database yang sudah ada (di samping schema.sql).
-- HANYA membuat tabel BARU. TIDAK meng-ALTER / DROP apa pun.
-- Semua tabel diberi awalan `pi_` → nol tabrakan dengan tabel yang ada.
-- `if not exists` → aman dijalankan ulang.
-- Cara pakai: buka Supabase SQL Editor → jalankan file ini → lalu pay-module-seed.sql
-- ============================================================

create extension if not exists pgcrypto;

-- ── Employee master (dipakai semua modul) ────────────────────
create table if not exists pi_employees (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null,                    -- bintang utara multi-tenant
  full_name       text not null,
  nik             text,                             -- simpan ter-masking/enkripsi di lapisan app
  npwp            text,
  ptkp_status     text not null,                    -- 'TK/0','TK/1',...,'K/3'
  join_date       date not null,
  employment_type text not null default 'PKWTT',    -- 'PKWT' | 'PKWTT'
  risk_class      text not null default 'II',       -- kelas JKK: 'I'..'V'
  department      text,
  bank_account    text,
  status          text not null default 'active',   -- 'active' | 'inactive'
  created_at      timestamptz not null default now()
);

-- ── Jembatan Hire -> Pay (aditif) ────────────────────────────
-- Kandidat yang di-hire bisa di-onboard jadi karyawan lewat /pay/onboarding.
-- NULLABLE: karyawan lama (sudah bekerja sebelum modul Hire dipakai) tidak punya
-- kandidat asal. UNIQUE: satu kandidat tidak bisa di-onboard dua kali.
-- ON DELETE SET NULL: kandidat dihapus dari modul Hire != karyawan berhenti kerja,
-- jadi record karyawan HARUS selamat, hanya kehilangan tautan balik ke rekrutmen.
alter table pi_employees add column if not exists hired_candidate_id text
  references public.candidates(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pi_employees_hired_candidate_id_key'
  ) then
    alter table pi_employees add constraint pi_employees_hired_candidate_id_key unique (hired_candidate_id);
  end if;
end $$;

-- ── Profil kompensasi (versioned) ────────────────────────────
-- unique(employee_id, effective_date): satu profil kompensasi per karyawan per
-- tanggal efektif -> re-run seed/insert tidak pernah menggandakan baris.
create table if not exists pi_compensation (
  id                    uuid primary key default gen_random_uuid(),
  employee_id           uuid not null references pi_employees(id) on delete cascade,
  upah_pokok            numeric(14,2) not null,
  tunjangan_tetap       jsonb not null default '[]',   -- [{ "name":..., "amount":... }]
  tunjangan_tidak_tetap jsonb not null default '[]',
  effective_date        date not null,
  created_at            timestamptz not null default now(),
  unique (employee_id, effective_date)
);

-- ── Konfigurasi statutori (TARIF sebagai DATA, versioned) ────
-- Tidak ada satu pun tarif di-hardcode di kode aplikasi.
create table if not exists pi_statutory_config (
  id             uuid primary key default gen_random_uuid(),
  effective_date date not null,
  ptkp           jsonb not null,   -- { base, married, dependent, max_dependents }  (PMK 101/PMK.010/2016)
  ter_tables     jsonb not null,   -- { A:[{upTo,rate}], B:[...], C:[...] }  (PP 58/2023, TER bulanan Jan-Nov)
  bpjs_rates     jsonb not null,   -- { jht, jp, jkk(byClass), jkm, kesehatan }
  progressive    jsonb not null,   -- [{upTo, rate}]  Pasal 17 / UU HPP (rekonsiliasi Desember)
  biaya_jabatan  jsonb,            -- { rate, monthly_cap, annual_cap }  (PMK 250/PMK.03/2008 -- TIDAK diatur PP 58/2023)
  overtime       jsonb,            -- { hourly_divisor, weekday, restday_6day_week, restday_5day_week }  (PP 35/2021 Pasal 31-32)
  umk            numeric(14,2),
  created_at     timestamptz not null default now()
);

-- ── Proses gaji (satu per periode) ───────────────────────────
create table if not exists pi_payroll_runs (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null,
  period     text not null,                    -- 'YYYY-MM'
  status     text not null default 'draft',    -- 'draft' | 'finalized'
  run_date   timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, period)
);

-- ── Baris hasil per karyawan per run ─────────────────────────
-- unique(run_id, employee_id): satu baris per karyawan per run -> re-run payroll untuk
-- run yang sama tidak pernah menggandakan baris (pelajaran dari duplikasi pi_compensation).
create table if not exists pi_payroll_lines (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid not null references pi_payroll_runs(id) on delete cascade,
  employee_id   uuid not null references pi_employees(id),
  gross         numeric(14,2) not null default 0,
  components    jsonb not null default '{}',    -- rincian perhitungan
  bpjs_employee numeric(14,2) not null default 0,
  bpjs_employer numeric(14,2) not null default 0,
  taxable_base  numeric(14,2) not null default 0,
  pph21         numeric(14,2) not null default 0,
  other_deductions jsonb not null default '[]', -- [{name,amount}] kasbon/denda/dll -- non-statutori, dikurangi dari net SETELAH engine (bukan bagian computeRunPayroll murni)
  net           numeric(14,2) not null default 0,
  created_at    timestamptz not null default now(),
  unique (run_id, employee_id)
);

-- ── Slip gaji ────────────────────────────────────────────────
create table if not exists pi_payslips (
  id         uuid primary key default gen_random_uuid(),
  line_id    uuid not null references pi_payroll_lines(id) on delete cascade,
  pdf_ref    text,
  created_at timestamptz not null default now()
);

-- ── Index bantu ──────────────────────────────────────────────
create index if not exists idx_pi_comp_emp   on pi_compensation(employee_id);
create index if not exists idx_pi_lines_run  on pi_payroll_lines(run_id);
create index if not exists idx_pi_emp_tenant on pi_employees(tenant_id);

-- CATATAN RLS: `create table` di project ini mengaktifkan RLS otomatis (mekanisme
-- proyek, bukan pernah di-set eksplisit di sini) TANPA policy apa pun -- artinya
-- pengguna authenticated pun awalnya dapat 0 baris (default-deny), bukan cuma anon.
-- Sudah diperbaiki: jalankan supabase/pay-module-rls.sql (pola identik dengan
-- rls-authenticated.sql milik Hire -- authenticated=akses penuh, anon=ditolak,
-- belum di-scope per tenant_id/auth.uid() karena Hire sendiri belum melakukannya).

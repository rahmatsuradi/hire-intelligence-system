# CLAUDE.md — People Intelligence

> Konteks persisten untuk Claude Code.
> Repo ini berevolusi dari "Hire Intelligence" menjadi platform **People Intelligence**. Modul rekrutmen (Hire) tetap utuh; modul **Pay** (payroll/PPh21/BPJS) ditambahkan secara aditif dan sudah berjalan end-to-end.

---

## 1. Aturan emas — jangan ganggu yang lama

Fitur Hire yang sudah berfungsi & bisa dites tidak boleh rusak:

- Route: `src/app/cv-analyzer/`, `src/app/interview/`, `src/app/candidates/`, `src/app/roles/`, `src/app/analytics/`, `src/app/report/`, `src/app/apply/`, `src/app/api/analyze-cv/`, `src/app/api/apply/`, `src/app/integrations/`, `src/app/settings/`, `src/app/login/`.
- Lib: `src/lib/cv-analyzer-ai.ts`, `cv-groq.ts`, `competency-framework.ts`, `store.ts`, `supabase*.ts`, `use-auth.ts`, `apply-roles.ts`, `email-templates.ts`.
- Pengembangan modul baru dikerjakan di branch terpisah; `main` = versi yang sudah teruji jalan. Merge hanya setelah modul baru berfungsi & Hire tetap OK.
- Penambahan bersifat **aditif**: file/route/tabel baru. Untuk DB, **tidak ada `ALTER`/`DROP`** pada tabel lama milik modul lain.

## 2. Tentang proyek

Dibangun oleh seorang praktisi HR (pengelola HR tunggal di perusahaan garmen keluarga, 70+ karyawan) sebagai portofolio sekaligus alat kerja pribadi untuk payroll dan kepatuhan statutori Indonesia.

## 3. Status modul Pay

Selesai dan terverifikasi end-to-end (bukan sekadar kode yang "terlihat jalan"):

- Skema + seed + RLS diterapkan ke database (`supabase/pay-module-*.sql`).
- Engine murni di `src/lib/payroll/`: `computeGross`, `computeBPJS`, `computePPh21_TER`, `computePPh21_Annual`, `computeTHR`, `computeOvertime`, `runPayroll`, `buildPayslip` — semua fungsi murni (input → output, tanpa efek samping), diuji dengan kasus ber-kunci-jawaban.
- 94 unit test lulus. Setiap tarif/formula (TER, biaya jabatan, tabel lembur PP 35/2021, THR, BPJS) diverifikasi dari sumber resmi/berlapis sebelum dipakai — sitasi lengkap ada di komentar `supabase/pay-module-seed.sql`.
- UI: `/pay/payroll` (hitung → simpan → slip, dengan input lembur/THR/potongan lain, plus rekonsiliasi Desember), `/pay/employees`, `/pay/laporan` (rekap lintas periode + ekspor CSV BPJS).
- Tarif statutori bersifat **versioned per `effective_date`** (`pickStatutoryConfigForPeriod`) — perubahan tarif pemerintah = tambah baris data baru, bukan ubah kode. Dibuktikan nyata saat plafon JP BPJS naik per Maret 2026.

## 4. Modul Pay — arsitektur

**Tabel** (semua ber-awalan `pi_`, di `supabase/pay-module-schema.sql`):
`pi_employees` (master, dipakai semua modul) · `pi_compensation` · `pi_statutory_config` (tarif = DATA, versioned) · `pi_payroll_runs` · `pi_payroll_lines` · `pi_payslips`.

**Pipeline:** `gross` → komponen upah (UU Ketenagakerjaan) → BPJS (potongan karyawan + beban perusahaan) → PPh 21 (TER bulanan Jan–Nov / rekonsiliasi tahunan Des) → `net` → slip.

**Engine** — fungsi TypeScript murni di `src/lib/payroll/`, semua tarif dibaca dari `pi_statutory_config`, tidak ada angka statutori di-hardcode di kode.

## 5. Cara apply skema + seed

Ikuti pola `schema.sql` yang sudah ada (bukan folder migrations): Supabase SQL Editor → jalankan `pay-module-schema.sql` → lalu `pay-module-seed.sql` → lalu `pay-module-rls.sql`.

- Aman dijalankan ulang: awalan `pi_` + `create table if not exists` + tanpa `ALTER`/`DROP` pada tabel lama.
- RLS pada tabel `pi_*` sudah aktif, dibatasi ke role `authenticated` (pola sama dengan `rls-authenticated.sql` milik Hire).

## 6. Kerahasiaan (dijaga sejak fondasi)

- **Instance PRIVAT** (`DATA_MODE=production`): data perusahaan **asli** → Supabase project privat, lokal/internal, **tidak pernah publik / tidak pernah masuk repo**.
- **Demo PUBLIK**: data **sintetis** (`pay-module-seed.sql`, 12 karyawan fiktif, perusahaan fiktif) → inilah yang di-deploy & di-screenshot untuk portofolio.
- Portofolio memakai demo sintetis + metrik agregat/anonim. NIK/NPWP/rekening ter-masking di layer render (slip gaji), data mentah terenkripsi di produksi. Patuh UU PDP 27/2022.

## 7. Cakupan regulasi (comp & ben Indonesia)

- **Pilar 1 — Struktur Upah** (UU Ketenagakerjaan/PP 36/2021): komponen upah, UMK, THR (prorata `masa/12`, Permenaker 6/2016), lembur (1/173 × upah, tabel multiplier PP 35/2021 — menggantikan Kepmenaker 102/2004 yang sudah dicabut).
- **Pilar 2 — BPJS**: JHT 5,7% (3,7/2) · JP 3% (2/1, plafon upah disesuaikan tiap Maret) · JKK 0,24–1,74% (per kelas risiko) · JKM 0,3% · Kesehatan 5% (4/1, plafon 12jt); interaksi dgn PPh 21.
- **Pilar 3 — PPh 21 (TER, PP 58/2023)**: PTKP, kategori TER A/B/C, TER bulanan Jan–Nov, rekonsiliasi Des progresif (Pasal 17 UU HPP), biaya jabatan (PMK 250/2008, tidak diubah PP 58/2023).
- **Pilar 4 — Slip & Pelaporan**: slip gaji (selesai) · ekspor pelaporan BPJS (selesai) · formulir 1721-A1 (belum dibangun — di luar cakupan MVP).

## 8. Integrasi UI (aditif)

- Seksi nav **"Pay"** di `navItems` pada `src/components/app-shell.tsx` (di samping "Main"/"Tools") — Payroll, Employees, Laporan.
- Route di `src/app/pay/*`, tidak menyentuh route Hire.
- Tautan alami (belum dibangun): kandidat Hire yang diterima → jadi record `pi_employees` (relasi baru, aditif; bukan mengubah logika Hire).

## 9. Yang belum dikerjakan

- Formulir pelaporan pajak tahunan 1721-A1.
- Tautan otomatis kandidat Hire yang diterima → `pi_employees`.
- Arahkan instance produksi ke data perusahaan asli (baru dilakukan setelah kelas risiko JKK final dikonfirmasi ke BPJS, dan UMK diisi sesuai SK Gubernur/Permenaker tahun berjalan untuk wilayah yang relevan — nilai UMK di seed saat ini murni placeholder demo).

## 10. Verifikasi tarif — status & jadwal ulang

Semua tarif di `pi_statutory_config` sudah diverifikasi dari sumber resmi/berlapis (lihat komentar per baris di `supabase/pay-module-seed.sql` untuk sitasi lengkap per tarif). Tarif yang berubah periodik dan perlu diverifikasi ulang:

- **Plafon upah JP BPJS Ketenagakerjaan** — disesuaikan tiap Maret berdasarkan pertumbuhan PDB. Verifikasi berikutnya: Maret 2027.
- **UMK** — mengikuti SK Gubernur/Permenaker tahun berjalan, per wilayah. Belum diisi dengan nilai riil (masih placeholder demo).
- **Kelas risiko JKK** — perlu dikonfirmasi final ke BPJS Ketenagakerjaan per perusahaan sebelum dipakai ke data produksi asli.

Update tahunan/periodik = tambah baris data baru di `pi_statutory_config` dengan `effective_date` yang sesuai, **bukan** mengubah kode atau menimpa baris lama (biar perhitungan retroaktif tetap akurat).

## 11. Prinsip kerja

Aditif di atas fondasi yang sudah jalan; prototipe dulu lalu perbesar cakupan; setiap tarif/formula statutori diverifikasi dari sumber sebelum dipakai, dengan sitasi tersimpan; setiap fungsi hitung disertai unit test ber-kunci-jawaban; jangan bangun backend/arsitektur baru mendahului kebutuhan yang sudah tervalidasi.

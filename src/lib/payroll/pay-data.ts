import type { StatutoryConfig } from "./run-payroll";

// Bentuk baris DB pi_* (mirror kolom di supabase/pay-module-schema.sql).
export interface PiEmployeeRow {
  id: string;
  tenant_id: string;
  full_name: string;
  nik: string | null;
  npwp: string | null;
  ptkp_status: string;
  join_date: string;
  employment_type: string;
  risk_class: string;
  department: string | null;
  bank_account: string | null;
  status: string;
}

export interface PiCompensationRow {
  id: string;
  employee_id: string;
  upah_pokok: number | string;
  tunjangan_tetap: { name: string; amount: number }[];
  tunjangan_tidak_tetap: { name: string; amount: number }[];
  effective_date: string;
}

export interface PiStatutoryConfigRow {
  id: string;
  effective_date: string;
  ptkp: StatutoryConfig["ptkpConfig"];
  ter_tables: StatutoryConfig["terTables"];
  bpjs_rates: StatutoryConfig["bpjsRates"];
  progressive: StatutoryConfig["progressiveRates"];
  biaya_jabatan: StatutoryConfig["biayaJabatanConfig"];
  overtime: StatutoryConfig["overtimeConfig"];
}

export interface PiPayrollRunRow {
  id: string;
  tenant_id: string;
  period: string;
  status: string;
  run_date: string | null;
}

export interface PiPayrollLineComponents {
  bpjs?: {
    employee?: { jht?: number; jp?: number; kesehatan?: number };
    employer?: { jht?: number; jp?: number; jkk?: number; jkm?: number; kesehatan?: number };
  };
  bpjsWageBase?: number; // hilang pada baris tersimpan sebelum field ini ditambahkan -- tampilkan "-", jangan tebak
  overtimePay?: number;
  thrAmount?: number;
}

export interface PiPayrollLineRow {
  id: string;
  run_id: string;
  employee_id: string;
  gross: number | string;
  components: PiPayrollLineComponents | null;
  bpjs_employee: number | string;
  bpjs_employer: number | string;
  taxable_base: number | string;
  pph21: number | string;
  net: number | string;
  other_deductions: { name: string; amount: number }[] | null;
}

// Memilih config statutori yang BERLAKU untuk suatu periode payroll: baris dengan
// effective_date terbaru yang <= awal periode. `pi_statutory_config` bersifat versioned
// (CLAUDE.md §4/§10) -- tarif berubah antar-periode (mis. plafon JP naik tiap Maret), jadi
// perhitungan HARUS pakai config yang berlaku saat itu, BUKAN sekadar baris terbaru.
// Mengembalikan null bila tidak ada config yang berlaku pada/sebelum periode (data belum lengkap).
export function pickStatutoryConfigForPeriod<T extends { effective_date: string }>(
  configs: T[],
  period: string, // 'YYYY-MM'
): T | null {
  const periodStart = `${period}-01`;
  const eligible = configs
    .filter((c) => c.effective_date <= periodStart)
    .sort((a, b) => b.effective_date.localeCompare(a.effective_date)); // ISO date -> perbandingan string aman
  return eligible[0] ?? null;
}

// Memetakan baris pi_statutory_config -> bentuk StatutoryConfig yang dipakai engine.
export function toStatutoryConfig(row: PiStatutoryConfigRow): StatutoryConfig {
  return {
    bpjsRates: row.bpjs_rates,
    terTables: row.ter_tables,
    ptkpConfig: row.ptkp,
    biayaJabatanConfig: row.biaya_jabatan,
    progressiveRates: row.progressive,
    overtimeConfig: row.overtime,
  };
}

export interface DecemberAggregate {
  grossJanNov: number;
  iuranPensiunKaryawanJanNov: number;
  pph21JanNov: number;
  monthsFound: number; // periode Jan-Nov distinct yang punya data tersimpan (lengkap = 11)
}

// Menghitung akumulasi Jan-Nov per karyawan dari histori pi_payroll_runs/pi_payroll_lines
// tersimpan (via "Simpan Run" tiap bulan) -- input yang dibutuhkan computePPh21_Annual untuk
// rekonsiliasi Desember. monthsFound < 11 berarti data historis belum lengkap; JANGAN hitung
// Desember untuk karyawan itu seolah 0 di bulan yang hilang (silently wrong), tampilkan sebagai
// gap eksplisit ke pemanggil.
export function aggregateDecemberContext(
  runs: PiPayrollRunRow[],
  lines: PiPayrollLineRow[],
  year: string,
): Map<string, DecemberAggregate> {
  const janNovPeriods = new Set(
    Array.from({ length: 11 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`),
  );
  const runIdToPeriod = new Map(runs.filter((r) => janNovPeriods.has(r.period)).map((r) => [r.id, r.period]));

  const result = new Map<string, DecemberAggregate>();
  const monthsSeen = new Map<string, Set<string>>();

  for (const line of lines) {
    const period = runIdToPeriod.get(line.run_id);
    if (!period) continue; // baris dari run di luar Jan-Nov tahun ini

    const acc = result.get(line.employee_id) ?? {
      grossJanNov: 0,
      iuranPensiunKaryawanJanNov: 0,
      pph21JanNov: 0,
      monthsFound: 0,
    };
    const iuranPensiun = (line.components?.bpjs?.employee?.jht ?? 0) + (line.components?.bpjs?.employee?.jp ?? 0);

    acc.grossJanNov += Number(line.gross);
    acc.pph21JanNov += Number(line.pph21);
    acc.iuranPensiunKaryawanJanNov += iuranPensiun;

    const seen = monthsSeen.get(line.employee_id) ?? new Set<string>();
    seen.add(period);
    monthsSeen.set(line.employee_id, seen);
    acc.monthsFound = seen.size;

    result.set(line.employee_id, acc);
  }

  return result;
}

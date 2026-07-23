import { describe, expect, it } from "vitest";
import { computeGross, runPayroll } from "./run-payroll";
import type { StatutoryConfig } from "./run-payroll";
import type { BiayaJabatanConfig, BpjsRates, OvertimeConfig, ProgressiveBracket, PtkpConfig, TerTables } from "./types";

// Tabel TER lengkap identik dengan pi_statutory_config seed (lihat pph21-ter.test.ts untuk
// verifikasi sumber) -- dipakai penuh di sini (bukan versi terpotong) supaya kasus lembur/THR
// yang mengangkat gross ke bracket lebih tinggi tetap teruji akurat.
const BPJS_RATES: BpjsRates = {
  jht: { employer: 0.037, employee: 0.02 },
  jp: { employer: 0.02, employee: 0.01, wage_cap: 10_547_400 },
  jkk: { I: 0.0024, II: 0.0054, III: 0.0089, IV: 0.0127, V: 0.0174 },
  jkm: { employer: 0.003 },
  kesehatan: { employer: 0.04, employee: 0.01, wage_cap: 12_000_000 },
};

const TER_TABLES: TerTables = {
  A: [
    { upTo: 5_400_000, rate: 0 },
    { upTo: 5_650_000, rate: 0.0025 },
    { upTo: 5_950_000, rate: 0.005 },
    { upTo: 6_300_000, rate: 0.0075 },
    { upTo: 6_750_000, rate: 0.01 },
    { upTo: 7_500_000, rate: 0.0125 },
    { upTo: 8_550_000, rate: 0.015 },
    { upTo: 9_650_000, rate: 0.0175 },
    { upTo: 10_050_000, rate: 0.02 },
    { upTo: null, rate: 0.34 },
  ],
  B: [
    { upTo: 6_200_000, rate: 0 },
    { upTo: 6_500_000, rate: 0.0025 },
    { upTo: 6_850_000, rate: 0.005 },
    { upTo: 7_300_000, rate: 0.0075 },
    { upTo: 9_200_000, rate: 0.01 },
    { upTo: 10_750_000, rate: 0.015 },
    { upTo: null, rate: 0.34 },
  ],
  C: [{ upTo: null, rate: 0.34 }],
};

const PTKP: PtkpConfig = { base: 54_000_000, married: 4_500_000, dependent: 4_500_000, max_dependents: 3 };
const BIAYA_JABATAN: BiayaJabatanConfig = { rate: 0.05, monthly_cap: 500_000, annual_cap: 6_000_000 };
const PROGRESSIVE: ProgressiveBracket[] = [
  { upTo: 60_000_000, rate: 0.05 },
  { upTo: 250_000_000, rate: 0.15 },
  { upTo: 500_000_000, rate: 0.25 },
  { upTo: 5_000_000_000, rate: 0.3 },
  { upTo: null, rate: 0.35 },
];
const OVERTIME_CONFIG: OvertimeConfig = {
  hourly_divisor: 173,
  weekday: [
    { maxHour: 1, multiplier: 1.5 },
    { maxHour: null, multiplier: 2 },
  ],
  restday_6day_week: [
    { maxHour: 7, multiplier: 2 },
    { maxHour: 8, multiplier: 3 },
    { maxHour: 11, multiplier: 4 },
  ],
  restday_5day_week: [
    { maxHour: 8, multiplier: 2 },
    { maxHour: 9, multiplier: 3 },
    { maxHour: 12, multiplier: 4 },
  ],
};

const STATUTORY: StatutoryConfig = {
  bpjsRates: BPJS_RATES,
  terTables: TER_TABLES,
  ptkpConfig: PTKP,
  biayaJabatanConfig: BIAYA_JABATAN,
  progressiveRates: PROGRESSIVE,
  overtimeConfig: OVERTIME_CONFIG,
};

describe("computeGross", () => {
  it("menjumlahkan upah pokok + tunjangan tetap + tunjangan tidak tetap", () => {
    const gross = computeGross({
      upah_pokok: 4_500_000,
      tunjangan_tetap: [{ name: "Jabatan", amount: 1_000_000 }],
      tunjangan_tidak_tetap: [{ name: "Lembur", amount: 200_000 }],
    });
    expect(gross).toBe(5_700_000);
  });
});

describe("runPayroll — masa reguler (TER)", () => {
  it("Budi Santoso-like: gross 4.5jt, K/2 (kategori B, di bawah ambang TER) -> PPh21 nol", () => {
    const result = runPayroll({
      compensation: { upah_pokok: 4_500_000, tunjangan_tetap: [], tunjangan_tidak_tetap: [] },
      ptkpStatus: "K/2",
      riskClass: "II",
      period: "2026-03",
      statutoryConfig: STATUTORY,
    });

    expect(result.isDecemberReconciliation).toBe(false);
    expect(result.gross).toBe(4_500_000);
    expect(result.bpjsWageBase).toBe(4_500_000);
    expect(result.bpjs.employee.total).toBe(180_000); // 90.000 (JHT) + 45.000 (JP) + 45.000 (Kesehatan)
    expect(result.pph21).toBe(0);
    expect(result.net).toBe(4_320_000); // 4.500.000 - 180.000 - 0
  });

  it("menambahkan upah lembur ke basis PPh21 TANPA mengubah basis BPJS (bukti pemisahan)", () => {
    // Basis lembur 8.650.000, 3 jam hari kerja biasa -> Rp275.000 (verifikasi lihat overtime.test.ts)
    const result = runPayroll({
      compensation: { upah_pokok: 8_650_000, tunjangan_tetap: [], tunjangan_tidak_tetap: [] },
      ptkpStatus: "K/2", // kategori B
      riskClass: "II",
      period: "2026-03",
      statutoryConfig: STATUTORY,
      overtime: { hours: 3, dayType: "weekday" },
    });

    expect(result.overtimePay).toBe(275_000);
    expect(result.bpjsWageBase).toBe(8_650_000); // TIDAK ikut naik karena lembur
    expect(result.bpjs.employee.total).toBe(346_000); // 173.000+86.500+86.500, dari 8.650.000 SAJA
    expect(result.gross).toBe(8_925_000); // 8.650.000 + 275.000 lembur -> basis PPh21 naik
    // kategori B, gross 8.925.000 jatuh di bracket (7.300.000, 9.200.000] -> 1%
    expect(result.pph21).toBe(89_250);
    expect(result.net).toBe(8_489_750); // 8.925.000 - 346.000 - 89.250
  });

  it("menambahkan THR ke basis PPh21 TANPA mengubah basis BPJS (bukti pemisahan)", () => {
    // Upah 6jt, masa kerja 7 bulan -> THR Rp3.500.000 (verifikasi lihat thr.test.ts)
    const result = runPayroll({
      compensation: { upah_pokok: 6_000_000, tunjangan_tetap: [], tunjangan_tidak_tetap: [] },
      ptkpStatus: "TK/0", // kategori A
      riskClass: "I",
      period: "2026-04",
      statutoryConfig: STATUTORY,
      thr: { joinDate: "2025-06-01", referenceDate: "2026-01-01" },
    });

    expect(result.thrAmount).toBe(3_500_000);
    expect(result.bpjsWageBase).toBe(6_000_000); // TIDAK ikut naik karena THR
    expect(result.bpjs.employee.total).toBe(240_000); // 120.000+60.000+60.000, dari 6.000.000 SAJA
    expect(result.gross).toBe(9_500_000); // 6.000.000 + 3.500.000 THR -> basis PPh21 naik
    // kategori A, gross 9.500.000 jatuh di bracket (8.550.000, 9.650.000] -> 1,75%
    expect(result.pph21).toBe(166_250);
    expect(result.net).toBe(9_093_750); // 9.500.000 - 240.000 - 166.250
  });
});

describe("runPayroll — masa Desember (rekonsiliasi tahunan)", () => {
  // Kasus dikonstruksi & diverifikasi manual sendiri (bukan contoh eksternal) untuk menguji
  // PENGKAWATAN runPayroll -> computeBPJS + computePPh21_Annual, bukan kebenaran tarif itu
  // sendiri (sudah diuji terpisah di bpjs.test.ts/pph21-annual.test.ts).
  // Gross 10jt/bulan x 12 bulan, TK/0, tidak ada tunjangan.
  it("gross flat 10jt/bulan x 12 bulan, TK/0 -> PPh21 Desember sesuai rekonsiliasi tahunan", () => {
    const result = runPayroll({
      compensation: { upah_pokok: 10_000_000, tunjangan_tetap: [], tunjangan_tidak_tetap: [] },
      ptkpStatus: "TK/0",
      riskClass: "II",
      period: "2026-12",
      statutoryConfig: STATUTORY,
      decemberReconciliation: {
        grossJanNov: 110_000_000, // 11 x 10.000.000
        iuranPensiunKaryawanJanNov: 3_300_000, // 11 x (2%+1%) x 10.000.000 = 11 x 300.000
        pph21JanNov: 2_200_000, // 11 x TER kategori A pada gross 10jt (bracket 2%) = 11 x 200.000
      },
    });

    expect(result.gross).toBe(10_000_000);
    expect(result.bpjs.employee.total).toBe(400_000); // 200.000 (JHT) + 100.000 (JP) + 100.000 (Kesehatan)
    // annualGross=120.000.000; biayaJabatan=min(6jt,6jt)=6jt (pas di cap); iuranPensiun=3.300.000+300.000=3.600.000
    // neto=120.000.000-6.000.000-3.600.000=110.400.000; PKP=110.400.000-54.000.000=56.400.000 (bracket 5% saja)
    // PPh21 setahun=56.400.000*5%=2.820.000; Desember=2.820.000-2.200.000=620.000
    expect(result.pph21).toBe(620_000);
    expect(result.net).toBe(8_980_000); // 10.000.000 - 400.000 - 620.000
    expect(result.isDecemberReconciliation).toBe(true);
  });

  it("melempar error jika masa Desember tanpa decemberReconciliation", () => {
    expect(() =>
      runPayroll({
        compensation: { upah_pokok: 10_000_000, tunjangan_tetap: [], tunjangan_tidak_tetap: [] },
        ptkpStatus: "TK/0",
        riskClass: "II",
        period: "2026-12",
        statutoryConfig: STATUTORY,
      }),
    ).toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { computeBPJS } from "./bpjs";
import type { BpjsRates } from "./types";

// Tarif identik dengan pi_statutory_config seed (supabase/pay-module-seed.sql, id c0000000-...-001).
// Kunci jawaban di bawah dihitung manual dari tarif ini, BUKAN diverifikasi ke DJP/BPJS resmi
// (lihat CLAUDE.md §10 — verifikasi resmi dilakukan sebelum hitung sungguhan).
const RATES: BpjsRates = {
  jht: { employer: 0.037, employee: 0.02 },
  jp: { employer: 0.02, employee: 0.01, wage_cap: 10_547_400 },
  jkk: { I: 0.0024, II: 0.0054, III: 0.0089, IV: 0.0127, V: 0.0174 },
  jkm: { employer: 0.003 },
  kesehatan: { employer: 0.04, employee: 0.01, wage_cap: 12_000_000 },
};

describe("computeBPJS", () => {
  it("menghitung gaji di bawah semua plafon (Budi Santoso, 4.5jt, kelas II)", () => {
    const result = computeBPJS(4_500_000, "II", RATES);
    expect(result.employee).toEqual({ jht: 90_000, jp: 45_000, kesehatan: 45_000, total: 180_000 });
    expect(result.employer).toEqual({
      jht: 166_500,
      jp: 90_000,
      jkk: 24_300,
      jkm: 13_500,
      kesehatan: 180_000,
      total: 474_300,
    });
  });

  it("meng-cap JP dan Kesehatan saat gaji di atas plafon (Siti Rahmawati, 15jt, kelas I)", () => {
    const result = computeBPJS(15_000_000, "I", RATES);
    expect(result.employee).toEqual({ jht: 300_000, jp: 105_474, kesehatan: 120_000, total: 525_474 });
    expect(result.employer).toEqual({
      jht: 555_000,
      jp: 210_948,
      jkk: 36_000,
      jkm: 45_000,
      kesehatan: 480_000,
      total: 1_326_948,
    });
  });

  it("meng-cap JP dan Kesehatan pada gaji sangat tinggi (Hendra Gunawan, 25jt, kelas II)", () => {
    const result = computeBPJS(25_000_000, "II", RATES);
    expect(result.employee).toEqual({ jht: 500_000, jp: 105_474, kesehatan: 120_000, total: 725_474 });
    expect(result.employer.total).toBe(1_825_948);
  });

  it("tidak meng-cap saat gaji tepat sama dengan plafon JP, dan membulatkan desimal dengan benar", () => {
    const result = computeBPJS(10_547_400, "III", RATES);
    // 10_547_400 * 0.037 = 390_253.8 -> dibulatkan ke 390_254
    expect(result.employer.jht).toBe(390_254);
    // 10_547_400 * 0.0089 = 93_871.86 -> dibulatkan ke 93_872
    expect(result.employer.jkk).toBe(93_872);
    // 10_547_400 * 0.003 = 31_642.2 -> dibulatkan ke 31_642
    expect(result.employer.jkm).toBe(31_642);
    expect(result.employee.total).toBe(421_896);
    expect(result.employer.total).toBe(1_148_612);
  });

  it("mengembalikan nol untuk semua komponen saat gaji nol", () => {
    const result = computeBPJS(0, "I", RATES);
    expect(result.employee.total).toBe(0);
    expect(result.employer.total).toBe(0);
  });

  it.each([
    ["I", 9_600],
    ["II", 21_600],
    ["III", 35_600],
    ["IV", 50_800],
    ["V", 69_600],
  ] as const)("menerapkan tarif JKK sesuai kelas risiko %s pada gaji 4jt", (riskClass, expectedJkk) => {
    const result = computeBPJS(4_000_000, riskClass, RATES);
    expect(result.employer.jkk).toBe(expectedJkk);
  });

  it("melempar error untuk gaji negatif", () => {
    expect(() => computeBPJS(-1, "I", RATES)).toThrow();
  });
});

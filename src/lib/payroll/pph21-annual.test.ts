import { describe, expect, it } from "vitest";
import { computePPh21_Annual, computePTKPAnnual, computeProgressiveTax } from "./pph21-annual";
import type { BiayaJabatanConfig, ProgressiveBracket, PtkpConfig } from "./types";

// Identik dengan pi_statutory_config seed (supabase/pay-module-seed.sql).
const PTKP: PtkpConfig = { base: 54_000_000, married: 4_500_000, dependent: 4_500_000, max_dependents: 3 };
const BIAYA_JABATAN: BiayaJabatanConfig = { rate: 0.05, monthly_cap: 500_000, annual_cap: 6_000_000 };
const PROGRESSIVE: ProgressiveBracket[] = [
  { upTo: 60_000_000, rate: 0.05 },
  { upTo: 250_000_000, rate: 0.15 },
  { upTo: 500_000_000, rate: 0.25 },
  { upTo: 5_000_000_000, rate: 0.3 },
  { upTo: null, rate: 0.35 },
];

describe("computePTKPAnnual", () => {
  it.each([
    ["TK/0", 54_000_000],
    ["K/0", 58_500_000],
    ["K/1", 63_000_000],
    ["K/3", 72_000_000],
    ["TK/3", 67_500_000],
  ] as const)("%s -> %d", (status, expected) => {
    expect(computePTKPAnnual(status, PTKP)).toBe(expected);
  });
});

describe("computeProgressiveTax", () => {
  it("mengembalikan 0 untuk PKP nol atau negatif", () => {
    expect(computeProgressiveTax(0, PROGRESSIVE)).toBe(0);
    expect(computeProgressiveTax(-1_000_000, PROGRESSIVE)).toBe(0);
  });

  it("menerapkan tarif berlapis (marginal), bukan flat, lintas banyak bracket", () => {
    // 60jt*5% + 190jt*15% + 250jt*25% + 100jt*30% = 3jt + 28.5jt + 62.5jt + 30jt = 124jt
    expect(computeProgressiveTax(600_000_000, PROGRESSIVE)).toBe(124_000_000);
  });
});

describe("computePPh21_Annual", () => {
  // Kasus "Anton" (Krishand Software, https://www.krishandsoftware.com/blog/2046/perhitungan-pph-21-desember/),
  // diverifikasi independen oleh 2 agent (hasil identik: PPh21 setahun Rp6.247.200, Desember Rp640.140).
  it("kasus Anton: biaya jabatan ke-cap, PTKP K/1, PPh21 Desember positif", () => {
    const result = computePPh21_Annual(
      154_248_000, // bruto setahun
      3_600_000, // iuran pensiun karyawan (JHT 2% + JP 1% dari gaji pokok x 12)
      "K/1",
      PTKP,
      BIAYA_JABATAN,
      PROGRESSIVE,
      5_607_060, // PPh21 sudah dipotong Jan-Nov (TER kategori B)
    );

    expect(result.biayaJabatan).toBe(6_000_000); // 5% x 154.248.000 = 7.712.400 > cap 6jt -> pakai cap
    expect(result.penghasilanNetoSetahun).toBe(144_648_000);
    expect(result.ptkpSetahun).toBe(63_000_000);
    expect(result.pkp).toBe(81_648_000);
    expect(result.pph21Setahun).toBe(6_247_200);
    expect(result.pph21Desember).toBe(640_140);
  });

  it("biaya jabatan TIDAK ke-cap saat bruto rendah (5% masih di bawah plafon)", () => {
    const result = computePPh21_Annual(40_000_000, 0, "TK/0", PTKP, BIAYA_JABATAN, PROGRESSIVE, 0);
    expect(result.biayaJabatan).toBe(2_000_000); // 5% x 40jt = 2jt < cap 6jt
  });

  it("PKP nol ketika neto di bawah PTKP -> PPh21 setahun nol", () => {
    const result = computePPh21_Annual(50_000_000, 0, "K/2", PTKP, BIAYA_JABATAN, PROGRESSIVE, 0);
    expect(result.pkp).toBe(0);
    expect(result.pph21Setahun).toBe(0);
  });

  it("PPh21 Desember negatif -> kelebihan potong (dikembalikan ke karyawan, bukan disetor)", () => {
    const result = computePPh21_Annual(
      154_248_000,
      3_600_000,
      "K/1",
      PTKP,
      BIAYA_JABATAN,
      PROGRESSIVE,
      7_000_000, // dipotong Jan-Nov melebihi PPh21 setahun (6.247.200)
    );
    expect(result.pph21Desember).toBe(6_247_200 - 7_000_000);
    expect(result.pph21Desember).toBeLessThan(0);
  });

  it("PKP dibulatkan ke bawah dalam ribuan penuh", () => {
    // biayaJabatan = 5% x 118.500.500 = 5.925.025 (< cap 6jt, tidak ke-cap)
    // neto = 118.500.500 - 5.925.025 = 112.575.475; neto - PTKP(54jt) = 58.575.475 -> floor ribuan = 58.575.000
    const result = computePPh21_Annual(118_500_500, 0, "TK/0", PTKP, BIAYA_JABATAN, PROGRESSIVE, 0);
    expect(result.biayaJabatan).toBe(5_925_025);
    expect(result.pkp).toBe(58_575_000);
  });

  it("melempar error untuk input bruto atau iuran pensiun negatif", () => {
    expect(() => computePPh21_Annual(-1, 0, "TK/0", PTKP, BIAYA_JABATAN, PROGRESSIVE, 0)).toThrow();
    expect(() => computePPh21_Annual(1_000_000, -1, "TK/0", PTKP, BIAYA_JABATAN, PROGRESSIVE, 0)).toThrow();
  });
});

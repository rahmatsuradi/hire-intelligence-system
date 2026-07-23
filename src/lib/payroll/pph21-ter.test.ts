import { describe, expect, it } from "vitest";
import { computePPh21_TER, ptkpToTerCategory } from "./pph21-ter";
import type { TerTables } from "./types";

// Tabel identik dengan pi_statutory_config seed (supabase/pay-module-seed.sql,
// id c0000000-...-001). Diverifikasi 2026-07-21 dari klikpajak.id + hrdpintar.com,
// disilangkan satu sama lain (lihat catatan di seed file untuk detail koreksi kategori C).
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
    { upTo: 10_350_000, rate: 0.0225 },
    { upTo: 10_700_000, rate: 0.025 },
    { upTo: 11_050_000, rate: 0.03 },
    { upTo: 11_600_000, rate: 0.035 },
    { upTo: 12_500_000, rate: 0.04 },
    { upTo: 13_750_000, rate: 0.05 },
    { upTo: 15_100_000, rate: 0.06 },
    { upTo: 16_950_000, rate: 0.07 },
    { upTo: 19_750_000, rate: 0.08 },
    { upTo: 24_150_000, rate: 0.09 },
    { upTo: 26_450_000, rate: 0.1 },
    { upTo: 28_000_000, rate: 0.11 },
    { upTo: 30_050_000, rate: 0.12 },
    { upTo: 32_400_000, rate: 0.13 },
    { upTo: 35_400_000, rate: 0.14 },
    { upTo: 39_100_000, rate: 0.15 },
    { upTo: 43_850_000, rate: 0.16 },
    { upTo: 47_800_000, rate: 0.17 },
    { upTo: 51_400_000, rate: 0.18 },
    { upTo: 56_300_000, rate: 0.19 },
    { upTo: 62_200_000, rate: 0.2 },
    { upTo: 68_600_000, rate: 0.21 },
    { upTo: 77_500_000, rate: 0.22 },
    { upTo: 89_000_000, rate: 0.23 },
    { upTo: 103_000_000, rate: 0.24 },
    { upTo: 125_000_000, rate: 0.25 },
    { upTo: 157_000_000, rate: 0.26 },
    { upTo: 206_000_000, rate: 0.27 },
    { upTo: 337_000_000, rate: 0.28 },
    { upTo: 454_000_000, rate: 0.29 },
    { upTo: 550_000_000, rate: 0.3 },
    { upTo: 695_000_000, rate: 0.31 },
    { upTo: 910_000_000, rate: 0.32 },
    { upTo: 1_400_000_000, rate: 0.33 },
    { upTo: null, rate: 0.34 },
  ],
  B: [
    { upTo: 6_200_000, rate: 0 },
    { upTo: 6_500_000, rate: 0.0025 },
    { upTo: 6_850_000, rate: 0.005 },
    { upTo: 7_300_000, rate: 0.0075 },
    { upTo: 9_200_000, rate: 0.01 },
    { upTo: 10_750_000, rate: 0.015 },
    { upTo: 11_250_000, rate: 0.02 },
    { upTo: 11_600_000, rate: 0.025 },
    { upTo: 12_600_000, rate: 0.03 },
    { upTo: 13_600_000, rate: 0.04 },
    { upTo: 14_950_000, rate: 0.05 },
    { upTo: 16_400_000, rate: 0.06 },
    { upTo: 18_450_000, rate: 0.07 },
    { upTo: 21_850_000, rate: 0.08 },
    { upTo: 26_000_000, rate: 0.09 },
    { upTo: 27_700_000, rate: 0.1 },
    { upTo: 29_350_000, rate: 0.11 },
    { upTo: 31_450_000, rate: 0.12 },
    { upTo: 33_950_000, rate: 0.13 },
    { upTo: 37_100_000, rate: 0.14 },
    { upTo: 41_100_000, rate: 0.15 },
    { upTo: 45_800_000, rate: 0.16 },
    { upTo: 49_500_000, rate: 0.17 },
    { upTo: 53_800_000, rate: 0.18 },
    { upTo: 58_500_000, rate: 0.19 },
    { upTo: 64_000_000, rate: 0.2 },
    { upTo: 71_000_000, rate: 0.21 },
    { upTo: 80_000_000, rate: 0.22 },
    { upTo: 93_000_000, rate: 0.23 },
    { upTo: 109_000_000, rate: 0.24 },
    { upTo: 129_000_000, rate: 0.25 },
    { upTo: 163_000_000, rate: 0.26 },
    { upTo: 211_000_000, rate: 0.27 },
    { upTo: 374_000_000, rate: 0.28 },
    { upTo: 459_000_000, rate: 0.29 },
    { upTo: 555_000_000, rate: 0.3 },
    { upTo: 704_000_000, rate: 0.31 },
    { upTo: 957_000_000, rate: 0.32 },
    { upTo: 1_405_000_000, rate: 0.33 },
    { upTo: null, rate: 0.34 },
  ],
  C: [
    { upTo: 6_600_000, rate: 0 },
    { upTo: 6_950_000, rate: 0.0025 },
    { upTo: 7_350_000, rate: 0.005 },
    { upTo: 7_800_000, rate: 0.0075 },
    { upTo: 8_850_000, rate: 0.01 },
    { upTo: 9_800_000, rate: 0.0125 },
    { upTo: 10_950_000, rate: 0.015 },
    { upTo: 11_200_000, rate: 0.0175 },
    { upTo: 12_050_000, rate: 0.02 },
    { upTo: 12_950_000, rate: 0.03 },
    { upTo: 14_150_000, rate: 0.04 },
    { upTo: 15_550_000, rate: 0.05 },
    { upTo: 17_050_000, rate: 0.06 },
    { upTo: 19_500_000, rate: 0.07 },
    { upTo: 22_700_000, rate: 0.08 },
    { upTo: 26_600_000, rate: 0.09 },
    { upTo: 28_100_000, rate: 0.1 },
    { upTo: 30_100_000, rate: 0.11 },
    { upTo: 32_600_000, rate: 0.12 },
    { upTo: 35_400_000, rate: 0.13 },
    { upTo: 38_900_000, rate: 0.14 },
    { upTo: 43_000_000, rate: 0.15 },
    { upTo: 47_400_000, rate: 0.16 },
    { upTo: 51_200_000, rate: 0.17 },
    { upTo: 55_800_000, rate: 0.18 },
    { upTo: 60_400_000, rate: 0.19 },
    { upTo: 66_700_000, rate: 0.2 },
    { upTo: 74_500_000, rate: 0.21 },
    { upTo: 83_200_000, rate: 0.22 },
    { upTo: 95_600_000, rate: 0.23 },
    { upTo: 110_000_000, rate: 0.24 },
    { upTo: 134_000_000, rate: 0.25 },
    { upTo: 169_000_000, rate: 0.26 },
    { upTo: 221_000_000, rate: 0.27 },
    { upTo: 390_000_000, rate: 0.28 },
    { upTo: 463_000_000, rate: 0.29 },
    { upTo: 561_000_000, rate: 0.3 },
    { upTo: 709_000_000, rate: 0.31 },
    { upTo: 965_000_000, rate: 0.32 },
    { upTo: 1_419_000_000, rate: 0.33 },
    { upTo: null, rate: 0.34 },
  ],
};

describe("ptkpToTerCategory", () => {
  it.each([
    ["TK/0", "A"],
    ["TK/1", "A"],
    ["K/0", "A"],
    ["TK/2", "B"],
    ["TK/3", "B"],
    ["K/1", "B"],
    ["K/2", "B"],
    ["K/3", "C"],
  ] as const)("memetakan %s ke kategori %s", (status, category) => {
    expect(ptkpToTerCategory(status)).toBe(category);
  });
});

describe("computePPh21_TER", () => {
  it("mengenakan 0% di bawah ambang kategori A (bruto 5jt, TK/0)", () => {
    expect(computePPh21_TER(5_000_000, "TK/0", TER_TABLES)).toBe(0);
  });

  it("batas atas bracket bersifat inklusif (tepat 5.4jt, TK/0, masih 0%)", () => {
    expect(computePPh21_TER(5_400_000, "TK/0", TER_TABLES)).toBe(0);
  });

  it("naik ke bracket berikutnya sesaat setelah batas (5.400.001, TK/0 -> 0,25%)", () => {
    expect(computePPh21_TER(5_400_001, "TK/0", TER_TABLES)).toBe(13_500);
  });

  it("Siti Rahmawati — bruto 15jt, TK/0 (kategori A) -> bracket 6%", () => {
    expect(computePPh21_TER(15_000_000, "TK/0", TER_TABLES)).toBe(900_000);
  });

  it("Budi Santoso — bruto 4.5jt, K/2 (kategori B, di bawah ambang) -> 0", () => {
    expect(computePPh21_TER(4_500_000, "K/2", TER_TABLES)).toBe(0);
  });

  it("batas atas kategori B inklusif (tepat 6.2jt, K/2, masih 0%)", () => {
    expect(computePPh21_TER(6_200_000, "K/2", TER_TABLES)).toBe(0);
  });

  it("kategori B naik bracket sesaat setelah batas (6.200.001 -> 0,25%)", () => {
    expect(computePPh21_TER(6_200_001, "K/2", TER_TABLES)).toBe(15_500);
  });

  it("kategori C pada bruto 30jt, K/3 -> bracket 11%", () => {
    expect(computePPh21_TER(30_000_000, "K/3", TER_TABLES)).toBe(3_300_000);
  });

  it("bracket teratas tanpa batas (2 miliar, TK/0) -> 34%", () => {
    expect(computePPh21_TER(2_000_000_000, "TK/0", TER_TABLES)).toBe(680_000_000);
  });

  it("mengembalikan 0 untuk bruto nol", () => {
    expect(computePPh21_TER(0, "TK/0", TER_TABLES)).toBe(0);
  });

  it("melempar error untuk bruto negatif", () => {
    expect(() => computePPh21_TER(-1, "TK/0", TER_TABLES)).toThrow();
  });

  it("melempar error untuk status PTKP tidak dikenal", () => {
    // @ts-expect-error sengaja uji status invalid dari luar (mis. data DB yang korup)
    expect(() => computePPh21_TER(5_000_000, "X/9", TER_TABLES)).toThrow();
  });
});

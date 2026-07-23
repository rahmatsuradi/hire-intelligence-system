import { describe, expect, it } from "vitest";
import { computeOvertime } from "./overtime";
import type { OvertimeMultiplierTier } from "./types";

// Tabel PP 35/2021 Pasal 31 (MENGGANTIKAN Kepmenaker 102/2004 yang sudah dicabut --
// batas lembur harian naik 3->4 jam, tier 4x dapat tambahan 1 jam dibanding aturan lama).
const DIVISOR = 173;
const WEEKDAY: OvertimeMultiplierTier[] = [
  { maxHour: 1, multiplier: 1.5 },
  { maxHour: null, multiplier: 2 },
];
const RESTDAY_6DAY_WEEK: OvertimeMultiplierTier[] = [
  { maxHour: 7, multiplier: 2 },
  { maxHour: 8, multiplier: 3 },
  { maxHour: 11, multiplier: 4 },
];
const RESTDAY_5DAY_WEEK: OvertimeMultiplierTier[] = [
  { maxHour: 8, multiplier: 2 },
  { maxHour: 9, multiplier: 3 },
  { maxHour: 12, multiplier: 4 },
];

describe("computeOvertime", () => {
  // Kasus diverifikasi via riset (PP 35/2021) + 2 verifier independen (hasil identik).
  it("hari kerja biasa: upah 8.650.000/bulan, lembur 3 jam -> Rp275.000", () => {
    expect(computeOvertime(8_650_000, 3, WEEKDAY, DIVISOR)).toBe(275_000);
  });

  it("hari kerja biasa: 1 jam lembur -> hanya tarif 1,5x", () => {
    // upah sejam = 8.650.000/173 = 50.000; 1 jam @ 1,5x = 75.000
    expect(computeOvertime(8_650_000, 1, WEEKDAY, DIVISOR)).toBe(75_000);
  });

  it("hari kerja biasa: 4 jam lembur (jam 1 @1,5x, jam 2-4 @2x)", () => {
    // 1,5 + 2+2+2 = 7,5 x 50.000 = 375.000
    expect(computeOvertime(8_650_000, 4, WEEKDAY, DIVISOR)).toBe(375_000);
  });

  it("hari istirahat mingguan, pola 6 hari kerja: 9 jam lintas 3 tier (7@2x, 1@3x, 1@4x)", () => {
    // upah sejam = 17.300.000/173 = 100.000; (7x2 + 1x3 + 1x4) x 100.000 = 21 x 100.000 = 2.100.000
    expect(computeOvertime(17_300_000, 9, RESTDAY_6DAY_WEEK, DIVISOR)).toBe(2_100_000);
  });

  it("hari istirahat mingguan, pola 5 hari kerja: 10 jam lintas 3 tier (8@2x, 1@3x, 1@4x)", () => {
    // (8x2 + 1x3 + 1x4) x 100.000 = 23 x 100.000 = 2.300.000
    expect(computeOvertime(17_300_000, 10, RESTDAY_5DAY_WEEK, DIVISOR)).toBe(2_300_000);
  });

  it("mengembalikan 0 untuk 0 jam lembur", () => {
    expect(computeOvertime(8_650_000, 0, WEEKDAY, DIVISOR)).toBe(0);
  });

  it("melempar error untuk upah atau jam negatif", () => {
    expect(() => computeOvertime(-1, 1, WEEKDAY, DIVISOR)).toThrow();
    expect(() => computeOvertime(8_650_000, -1, WEEKDAY, DIVISOR)).toThrow();
  });
});

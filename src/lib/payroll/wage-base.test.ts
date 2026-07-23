import { describe, expect, it } from "vitest";
import { computeOvertimeWageBase, computeUpahPokokDanTunjanganTetap } from "./wage-base";
import type { Compensation } from "./run-payroll";

describe("computeUpahPokokDanTunjanganTetap", () => {
  it("menjumlahkan upah pokok + tunjangan tetap (tanpa tunjangan tidak tetap)", () => {
    const compensation: Compensation = {
      upah_pokok: 4_500_000,
      tunjangan_tetap: [{ name: "Jabatan", amount: 1_000_000 }],
      tunjangan_tidak_tetap: [{ name: "Lembur", amount: 500_000 }],
    };
    expect(computeUpahPokokDanTunjanganTetap(compensation)).toBe(5_500_000);
  });
});

describe("computeOvertimeWageBase", () => {
  it("memakai upah_pokok+tunjangan_tetap langsung saat sudah >= 75% dari total upah", () => {
    const compensation: Compensation = {
      upah_pokok: 8_000_000,
      tunjangan_tetap: [{ name: "Tetap", amount: 650_000 }],
      tunjangan_tidak_tetap: [],
    };
    // pokok+tetap = 8.650.000 = 100% dari total (tidak ada tunjangan tidak tetap) -> tidak kena floor 75%.
    expect(computeOvertimeWageBase(compensation)).toBe(8_650_000);
  });

  it("memakai floor 75% dari total upah saat pokok+tunjangan_tetap di bawah ambang", () => {
    const compensation: Compensation = {
      upah_pokok: 3_000_000,
      tunjangan_tetap: [],
      tunjangan_tidak_tetap: [{ name: "Variabel", amount: 3_000_000 }],
    };
    // pokok+tetap=3.000.000; total=6.000.000; 75% dari total=4.500.000 > 3.000.000 -> pakai 4.500.000.
    expect(computeOvertimeWageBase(compensation)).toBe(4_500_000);
  });
});

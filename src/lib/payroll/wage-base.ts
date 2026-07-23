import type { Compensation } from "./run-payroll";

function sumComponents(components: { amount: number }[]): number {
  return components.reduce((sum, c) => sum + c.amount, 0);
}

// Upah pokok + tunjangan tetap (basis umum THR & lembur, UU Ketenagakerjaan/PP 36/2021).
export function computeUpahPokokDanTunjanganTetap(compensation: Compensation): number {
  return compensation.upah_pokok + sumComponents(compensation.tunjangan_tetap);
}

// Basis upah lembur (PP 35/2021 Pasal 32 ayat 3-4): upah_pokok+tunjangan_tetap, KECUALI
// itu < 75% dari total upah (termasuk tunjangan tidak tetap) -- maka basisnya 75% dari total.
export function computeOvertimeWageBase(compensation: Compensation): number {
  const pokokDanTetap = computeUpahPokokDanTunjanganTetap(compensation);
  const totalUpah = pokokDanTetap + sumComponents(compensation.tunjangan_tidak_tetap);
  const floor75 = totalUpah * 0.75;
  return pokokDanTetap < floor75 ? floor75 : pokokDanTetap;
}

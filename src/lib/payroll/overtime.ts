import type { OvertimeMultiplierTier } from "./types";

// Upah kerja lembur (PP 35/2021 Pasal 31-32 -- MENGGANTIKAN Kepmenaker 102/2004 yang
// sudah dicabut Permenaker 23/2021). Diverifikasi via riset + 2 verifier independen
// (hasil identik: upah 8.650.000/bulan, lembur 3 jam hari kerja biasa -> Rp275.000).
// Tier bertingkat per jam (bukan flat): tiap jam dikalikan multiplier tier-nya sendiri.
export function computeOvertime(
  upahSebulan: number,
  jamLembur: number,
  tiers: OvertimeMultiplierTier[],
  hourlyDivisor: number,
): number {
  if (upahSebulan < 0 || jamLembur < 0) {
    throw new Error("upahSebulan dan jamLembur tidak boleh negatif");
  }

  const upahSejam = upahSebulan / hourlyDivisor;
  let pay = 0;
  let hoursProcessed = 0;

  for (const tier of tiers) {
    if (hoursProcessed >= jamLembur) break;
    const tierCap = tier.maxHour === null ? Infinity : tier.maxHour;
    const hoursInTier = Math.min(jamLembur, tierCap) - hoursProcessed;
    if (hoursInTier <= 0) continue;
    pay += hoursInTier * tier.multiplier * upahSejam;
    hoursProcessed += hoursInTier;
  }

  return Math.round(pay);
}

// THR Keagamaan (Permenaker No. 6 Tahun 2016 Pasal 3). Diverifikasi via riset + 2 verifier
// independen (hasil identik: Rp6jt upah, 7 bulan masa kerja -> THR Rp3.500.000).
// Basis upah = upah_pokok + tunjangan_tetap (computeUpahPokokDanTunjanganTetap di wage-base.ts).

// Masa kerja dibulatkan ke bawah dalam bulan penuh -- ini KONVENSI PRAKTISI, bukan ketentuan
// eksplisit pasal (Permenaker 6/2016 tidak menyebut aturan pembulatan).
export function computeMasaKerjaBulan(joinDate: string, referenceDate: string): number {
  const join = new Date(joinDate);
  const ref = new Date(referenceDate);
  let months = (ref.getFullYear() - join.getFullYear()) * 12 + (ref.getMonth() - join.getMonth());
  if (ref.getDate() < join.getDate()) months -= 1;
  return Math.max(0, months);
}

// >=12 bulan -> THR penuh (1x upah). >=1 bulan tapi <12 -> prorata (masaKerja/12 x upah).
// <1 bulan -> belum berhak (0).
export function computeTHR(upahDasarThr: number, masaKerjaBulan: number): number {
  if (masaKerjaBulan < 1) return 0;
  const cappedMonths = Math.min(masaKerjaBulan, 12);
  return Math.round((cappedMonths / 12) * upahDasarThr);
}

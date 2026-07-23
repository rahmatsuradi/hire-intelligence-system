import type {
  AnnualPPh21Result,
  BiayaJabatanConfig,
  ProgressiveBracket,
  PtkpConfig,
  PtkpStatus,
} from "./types";

function parsePtkpStatus(ptkpStatus: PtkpStatus): { married: boolean; dependents: number } {
  const [maritalCode, dependentsRaw] = ptkpStatus.split("/");
  return { married: maritalCode === "K", dependents: Number(dependentsRaw) };
}

export function computePTKPAnnual(ptkpStatus: PtkpStatus, ptkp: PtkpConfig): number {
  const { married, dependents } = parsePtkpStatus(ptkpStatus);
  const cappedDependents = Math.min(dependents, ptkp.max_dependents);
  return ptkp.base + (married ? ptkp.married : 0) + cappedDependents * ptkp.dependent;
}

// Pasal 17 UU HPP: tarif progresif BERLAPIS (marginal) atas PKP — beda dengan TER
// yang mengenakan satu tarif flat ke seluruh bruto bulanan.
export function computeProgressiveTax(pkp: number, brackets: ProgressiveBracket[]): number {
  if (pkp <= 0) return 0;

  let tax = 0;
  let lowerBound = 0;
  for (const bracket of brackets) {
    if (pkp <= lowerBound) break;
    const upper = bracket.upTo === null ? Infinity : bracket.upTo;
    tax += (Math.min(pkp, upper) - lowerBound) * bracket.rate;
    lowerBound = upper;
  }
  return Math.round(tax);
}

// Rekonsiliasi Masa Pajak Terakhir (Desember) untuk pegawai tetap bekerja penuh setahun.
// Sumber: PMK 250/PMK.03/2008 (biaya jabatan), PMK 101/PMK.010/2016 (PTKP), Pasal 17 UU HPP
// (tarif progresif). Biaya jabatan & PTKP TIDAK diatur PP 58/2023 -- baca dari
// pi_statutory_config.biaya_jabatan / .ptkp, terpisah dari .ter_tables.
// Diverifikasi terhadap contoh kasus "Anton" (Krishand Software) oleh 2 verifier independen
// (lihat pph21-annual.test.ts) — belum menangani prorata pegawai baru/resign di tengah tahun.
export function computePPh21_Annual(
  penghasilanBrutoSetahun: number,
  iuranPensiunKaryawanSetahun: number,
  ptkpStatus: PtkpStatus,
  ptkpConfig: PtkpConfig,
  biayaJabatanConfig: BiayaJabatanConfig,
  progressiveRates: ProgressiveBracket[],
  pph21SudahDipotongJanNov: number,
): AnnualPPh21Result {
  if (penghasilanBrutoSetahun < 0 || iuranPensiunKaryawanSetahun < 0) {
    throw new Error("penghasilanBrutoSetahun dan iuranPensiunKaryawanSetahun tidak boleh negatif");
  }

  const biayaJabatan = Math.round(
    Math.min(penghasilanBrutoSetahun * biayaJabatanConfig.rate, biayaJabatanConfig.annual_cap),
  );
  const penghasilanNetoSetahun = penghasilanBrutoSetahun - biayaJabatan - iuranPensiunKaryawanSetahun;
  const ptkpSetahun = computePTKPAnnual(ptkpStatus, ptkpConfig);
  // PKP dibulatkan ke bawah dalam ribuan penuh (praktik resmi DJP).
  const pkp = Math.max(0, Math.floor((penghasilanNetoSetahun - ptkpSetahun) / 1000) * 1000);
  const pph21Setahun = computeProgressiveTax(pkp, progressiveRates);
  const pph21Desember = pph21Setahun - pph21SudahDipotongJanNov;

  return {
    penghasilanBrutoSetahun,
    biayaJabatan,
    iuranPensiunKaryawanSetahun,
    penghasilanNetoSetahun: Math.round(penghasilanNetoSetahun),
    ptkpSetahun,
    pkp,
    pph21Setahun,
    pph21SudahDipotongJanNov,
    pph21Desember,
  };
}

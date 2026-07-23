import type { PtkpStatus, TerCategory, TerTables } from "./types";

// Pemetaan status PTKP -> kategori TER, sesuai Lampiran PP 58/2023.
const PTKP_TO_TER_CATEGORY: Record<PtkpStatus, TerCategory> = {
  "TK/0": "A",
  "TK/1": "A",
  "K/0": "A",
  "TK/2": "B",
  "TK/3": "B",
  "K/1": "B",
  "K/2": "B",
  "K/3": "C",
};

export function ptkpToTerCategory(ptkpStatus: PtkpStatus): TerCategory {
  const category = PTKP_TO_TER_CATEGORY[ptkpStatus];
  if (!category) {
    throw new Error(`Status PTKP tidak dikenal: ${ptkpStatus}`);
  }
  return category;
}

// Masa Januari–November: PPh 21 = bruto bulanan x tarif flat bracket TER yang berlaku
// (bukan progresif). Desember pakai computePPh21_Annual (rekonsiliasi Pasal 17).
export function computePPh21_TER(
  brutoBulanan: number,
  ptkpStatus: PtkpStatus,
  terTables: TerTables,
): number {
  if (brutoBulanan < 0) {
    throw new Error("brutoBulanan tidak boleh negatif");
  }

  const category = ptkpToTerCategory(ptkpStatus);
  const brackets = terTables[category];

  for (const bracket of brackets) {
    if (bracket.upTo === null || brutoBulanan <= bracket.upTo) {
      return Math.round(brutoBulanan * bracket.rate);
    }
  }

  throw new Error(`Tidak ada bracket TER yang cocok untuk kategori ${category}`);
}

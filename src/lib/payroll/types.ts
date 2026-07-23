// Bentuk data mengikuti kolom `pi_statutory_config` di supabase/pay-module-schema.sql.
// Tarif selalu dibaca dari sana — tidak ada angka di-hardcode di engine.

export type RiskClass = "I" | "II" | "III" | "IV" | "V";

export interface BpjsRates {
  jht: { employer: number; employee: number };
  jp: { employer: number; employee: number; wage_cap: number };
  jkk: Record<RiskClass, number>;
  jkm: { employer: number };
  kesehatan: { employer: number; employee: number; wage_cap: number };
}

export interface BpjsEmployeeContribution {
  jht: number;
  jp: number;
  kesehatan: number;
  total: number;
}

export interface BpjsEmployerContribution {
  jht: number;
  jp: number;
  jkk: number;
  jkm: number;
  kesehatan: number;
  total: number;
}

export interface BpjsResult {
  employee: BpjsEmployeeContribution;
  employer: BpjsEmployerContribution;
}

// TER (Tarif Efektif Rata-rata, PP 58/2023): satu tarif flat dikenakan ke seluruh
// bruto bulanan sesuai bracket tempatnya jatuh (bukan progresif/marjinal seperti Pasal 17).
export type TerCategory = "A" | "B" | "C";

export interface TerBracket {
  upTo: number | null; // null = bracket teratas, tanpa batas atas
  rate: number;
}

export type TerTables = Record<TerCategory, TerBracket[]>;

export type PtkpStatus =
  | "TK/0"
  | "TK/1"
  | "TK/2"
  | "TK/3"
  | "K/0"
  | "K/1"
  | "K/2"
  | "K/3";

export interface PtkpConfig {
  base: number;
  married: number;
  dependent: number;
  max_dependents: number;
}

// Pasal 17 UU HPP: tarif progresif BERLAPIS/marginal (bukan flat seperti TER) —
// bentuk bracket sama dengan TerBracket, dipisah namanya agar jelas beda semantik.
export type ProgressiveBracket = TerBracket;

// Biaya jabatan (PMK 250/PMK.03/2008, TIDAK diatur PP 58/2023): 5% dari bruto
// setahun, dibatasi plafon bulanan/tahunan. Dibaca dari pi_statutory_config.biaya_jabatan.
export interface BiayaJabatanConfig {
  rate: number;
  monthly_cap: number;
  annual_cap: number;
}

export interface AnnualPPh21Result {
  penghasilanBrutoSetahun: number;
  biayaJabatan: number;
  iuranPensiunKaryawanSetahun: number;
  penghasilanNetoSetahun: number;
  ptkpSetahun: number;
  pkp: number;
  pph21Setahun: number;
  pph21SudahDipotongJanNov: number;
  pph21Desember: number;
}

// Tabel multiplier lembur (PP 35/2021 Pasal 31 — MENGGANTIKAN Kepmenaker 102/2004 yang
// sudah dicabut; batas lembur harian naik 3->4 jam, tier 4x dapat tambahan 1 jam).
// tiers: array bertingkat kumulatif [{ maxHour, multiplier }, ...], maxHour=null = tier terakhir tanpa batas.
export interface OvertimeMultiplierTier {
  maxHour: number | null;
  multiplier: number;
}

export interface OvertimeConfig {
  hourly_divisor: number; // 173 (PP 35/2021 Pasal 32)
  weekday: OvertimeMultiplierTier[];
  restday_6day_week: OvertimeMultiplierTier[];
  restday_5day_week: OvertimeMultiplierTier[];
}

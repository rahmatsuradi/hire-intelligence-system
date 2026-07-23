import { computeBPJS } from "./bpjs";
import { computeOvertime } from "./overtime";
import { computePPh21_Annual } from "./pph21-annual";
import { computePPh21_TER } from "./pph21-ter";
import { computeMasaKerjaBulan, computeTHR } from "./thr";
import { computeOvertimeWageBase, computeUpahPokokDanTunjanganTetap } from "./wage-base";
import type {
  BiayaJabatanConfig,
  BpjsRates,
  BpjsResult,
  OvertimeConfig,
  ProgressiveBracket,
  PtkpConfig,
  PtkpStatus,
  RiskClass,
  TerTables,
} from "./types";

export interface CompensationComponent {
  name: string;
  amount: number;
}

export interface Compensation {
  upah_pokok: number;
  tunjangan_tetap: CompensationComponent[];
  tunjangan_tidak_tetap: CompensationComponent[];
}

export interface StatutoryConfig {
  bpjsRates: BpjsRates;
  terTables: TerTables;
  ptkpConfig: PtkpConfig;
  biayaJabatanConfig: BiayaJabatanConfig;
  progressiveRates: ProgressiveBracket[];
  overtimeConfig: OvertimeConfig;
}

// Konteks kumulatif Jan-Nov, disiapkan pemanggil dari pi_payroll_lines periode sebelumnya
// di tahun berjalan (runPayroll tetap fungsi murni -- tidak query DB sendiri).
export interface DecemberReconciliationContext {
  grossJanNov: number;
  iuranPensiunKaryawanJanNov: number;
  pph21JanNov: number;
}

export interface OvertimeInput {
  hours: number;
  dayType: "weekday" | "restday_6day_week" | "restday_5day_week";
}

// Hadir hanya pada periode THR dibayarkan (mis. sebulan sebelum lebaran/natal) --
// runPayroll tidak menebak sendiri kapan THR jatuh tempo, itu keputusan pemanggil.
export interface ThrInput {
  joinDate: string;
  referenceDate: string;
}

export interface RunPayrollInput {
  compensation: Compensation;
  ptkpStatus: PtkpStatus;
  riskClass: RiskClass;
  period: string; // 'YYYY-MM'
  statutoryConfig: StatutoryConfig;
  decemberReconciliation?: DecemberReconciliationContext;
  overtime?: OvertimeInput;
  thr?: ThrInput;
}

export interface PayrollLineResult {
  gross: number; // basis PPh21: upah_pokok + tunjangan_tetap + tunjangan_tidak_tetap + lembur + THR
  bpjsWageBase: number; // basis BPJS: upah_pokok + tunjangan_tetap SAJA (lembur/THR tidak kena BPJS)
  overtimePay: number;
  thrAmount: number;
  bpjs: BpjsResult;
  pph21: number;
  net: number;
  isDecemberReconciliation: boolean;
}

// Basis PPh21 (penghasilan bruto kena pajak): seluruh komponen upah + lembur + THR.
// BUKAN basis BPJS -- lihat computeUpahPokokDanTunjanganTetap di wage-base.ts untuk itu.
export function computeGross(compensation: Compensation): number {
  const tunjanganTetap = compensation.tunjangan_tetap.reduce((sum, t) => sum + t.amount, 0);
  const tunjanganTidakTetap = compensation.tunjangan_tidak_tetap.reduce((sum, t) => sum + t.amount, 0);
  return compensation.upah_pokok + tunjanganTetap + tunjanganTidakTetap;
}

function isDecemberPeriod(period: string): boolean {
  return /^\d{4}-12$/.test(period);
}

export function runPayroll(input: RunPayrollInput): PayrollLineResult {
  const bpjsWageBase = computeUpahPokokDanTunjanganTetap(input.compensation);
  const bpjs = computeBPJS(bpjsWageBase, input.riskClass, input.statutoryConfig.bpjsRates);

  let overtimePay = 0;
  if (input.overtime) {
    const overtimeWageBase = computeOvertimeWageBase(input.compensation);
    const tiers = input.statutoryConfig.overtimeConfig[input.overtime.dayType];
    overtimePay = computeOvertime(
      overtimeWageBase,
      input.overtime.hours,
      tiers,
      input.statutoryConfig.overtimeConfig.hourly_divisor,
    );
  }

  let thrAmount = 0;
  if (input.thr) {
    const upahDasarThr = computeUpahPokokDanTunjanganTetap(input.compensation);
    const masaKerjaBulan = computeMasaKerjaBulan(input.thr.joinDate, input.thr.referenceDate);
    thrAmount = computeTHR(upahDasarThr, masaKerjaBulan);
  }

  const gross = computeGross(input.compensation) + overtimePay + thrAmount;
  const isDecember = isDecemberPeriod(input.period);

  let pph21: number;
  if (isDecember) {
    if (!input.decemberReconciliation) {
      throw new Error("Masa Desember butuh decemberReconciliation (akumulasi gross & PPh21 Jan-Nov)");
    }
    const iuranPensiunKaryawanDesember = bpjs.employee.jht + bpjs.employee.jp;
    const annual = computePPh21_Annual(
      input.decemberReconciliation.grossJanNov + gross,
      input.decemberReconciliation.iuranPensiunKaryawanJanNov + iuranPensiunKaryawanDesember,
      input.ptkpStatus,
      input.statutoryConfig.ptkpConfig,
      input.statutoryConfig.biayaJabatanConfig,
      input.statutoryConfig.progressiveRates,
      input.decemberReconciliation.pph21JanNov,
    );
    pph21 = annual.pph21Desember;
  } else {
    pph21 = computePPh21_TER(gross, input.ptkpStatus, input.statutoryConfig.terTables);
  }

  return {
    gross,
    bpjsWageBase,
    overtimePay,
    thrAmount,
    bpjs,
    pph21,
    net: gross - bpjs.employee.total - pph21,
    isDecemberReconciliation: isDecember,
  };
}

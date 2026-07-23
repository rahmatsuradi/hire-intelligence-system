import type { BpjsRates, BpjsResult, RiskClass } from "./types";

// JHT, JKK, JKM dihitung dari upah penuh (tanpa plafon).
// JP dan Kesehatan dihitung dari upah yang di-cap pada wage_cap masing-masing.
export function computeBPJS(
  grossWage: number,
  riskClass: RiskClass,
  rates: BpjsRates,
): BpjsResult {
  if (grossWage < 0) {
    throw new Error("grossWage tidak boleh negatif");
  }

  const jpBase = Math.min(grossWage, rates.jp.wage_cap);
  const kesehatanBase = Math.min(grossWage, rates.kesehatan.wage_cap);

  const employeeJht = Math.round(grossWage * rates.jht.employee);
  const employeeJp = Math.round(jpBase * rates.jp.employee);
  const employeeKesehatan = Math.round(kesehatanBase * rates.kesehatan.employee);

  const employerJht = Math.round(grossWage * rates.jht.employer);
  const employerJp = Math.round(jpBase * rates.jp.employer);
  const employerJkk = Math.round(grossWage * rates.jkk[riskClass]);
  const employerJkm = Math.round(grossWage * rates.jkm.employer);
  const employerKesehatan = Math.round(kesehatanBase * rates.kesehatan.employer);

  return {
    employee: {
      jht: employeeJht,
      jp: employeeJp,
      kesehatan: employeeKesehatan,
      total: employeeJht + employeeJp + employeeKesehatan,
    },
    employer: {
      jht: employerJht,
      jp: employerJp,
      jkk: employerJkk,
      jkm: employerJkm,
      kesehatan: employerKesehatan,
      total: employerJht + employerJp + employerJkk + employerJkm + employerKesehatan,
    },
  };
}

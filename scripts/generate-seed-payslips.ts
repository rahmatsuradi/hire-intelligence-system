// Menghasilkan slip gaji HTML untuk karyawan seed dari data LIVE, sebagai bukti ujung-ke-ujung.
// Jalankan: node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/generate-seed-payslips.ts <outDir>
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { resolveCompanyProfile } from "../src/lib/payroll/company-profile";
import { buildPayslip } from "../src/lib/payroll/payslip";
import { renderPayslipHTML } from "../src/lib/payroll/payslip-html";
import { runPayroll } from "../src/lib/payroll/run-payroll";
import type { Compensation } from "../src/lib/payroll/run-payroll";
import { pickStatutoryConfigForPeriod, toStatutoryConfig } from "../src/lib/payroll/pay-data";
import type { PiStatutoryConfigRow } from "../src/lib/payroll/pay-data";
import type { PtkpStatus, RiskClass } from "../src/lib/payroll/types";

const PERIOD = "2026-01";
const outDir = process.argv[2] ?? "payslips-out";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("env Supabase tidak ada");
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const [{ data: employees }, { data: compensations }, { data: configs }] = await Promise.all([
    supabase.from("pi_employees").select("*").eq("status", "active").order("full_name"),
    supabase.from("pi_compensation").select("*"),
    supabase.from("pi_statutory_config").select("*").order("effective_date", { ascending: false }),
  ]);
  if (!employees?.length || !configs?.length) throw new Error("data seed belum lengkap");

  const configRow = pickStatutoryConfigForPeriod(configs as PiStatutoryConfigRow[], PERIOD);
  if (!configRow) throw new Error(`Tidak ada config statutori berlaku untuk periode ${PERIOD}`);
  const statutoryConfig = toStatutoryConfig(configRow);
  const compByEmp = new Map(compensations?.map((c) => [c.employee_id, c]));
  const company = resolveCompanyProfile();

  mkdirSync(outDir, { recursive: true });
  const index: string[] = [];

  for (const emp of employees) {
    const compRow = compByEmp.get(emp.id);
    if (!compRow) continue;
    const compensation: Compensation = {
      upah_pokok: Number(compRow.upah_pokok),
      tunjangan_tetap: compRow.tunjangan_tetap ?? [],
      tunjangan_tidak_tetap: compRow.tunjangan_tidak_tetap ?? [],
    };

    const result = runPayroll({
      compensation,
      ptkpStatus: emp.ptkp_status as PtkpStatus,
      riskClass: emp.risk_class as RiskClass,
      period: PERIOD,
      statutoryConfig,
    });

    const slip = buildPayslip(emp, compensation, result, PERIOD, company);
    const html = renderPayslipHTML(slip);
    const fileName = `${emp.full_name.replace(/\s+/g, "-").toLowerCase()}.html`;
    writeFileSync(join(outDir, fileName), html, "utf8");
    index.push(
      `<li><a href="${fileName}">${emp.full_name}</a> — ${emp.ptkp_status} — Net Rp ${result.net.toLocaleString("id-ID")}</li>`,
    );
    console.log(`  ${emp.full_name.padEnd(18)} net Rp ${result.net.toLocaleString("id-ID").padStart(12)} -> ${fileName}`);
  }

  const indexHtml = `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Slip Gaji ${PERIOD}</title>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px}li{margin:6px 0}</style></head>
<body><h1>Slip Gaji — Periode ${PERIOD}</h1><p>Data sintetis demo. ${index.length} karyawan.</p><ul>${index.join("")}</ul></body></html>`;
  writeFileSync(join(outDir, "index.html"), indexHtml, "utf8");

  console.log(`\n${index.length} slip gaji ditulis ke ${outDir}/ (buka index.html)`);
}

main().catch((err) => {
  console.error("GAGAL:", err);
  process.exit(1);
});

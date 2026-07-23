// Verifikasi jalur SUKSES rekonsiliasi Desember: isi Feb-Nov 2026 (Jan sudah ada dari
// run-seed-payroll.ts) dengan gaji flat yang sama tiap bulan, lalu UI /pay/payroll periode
// 2026-12 seharusnya menghitung PPh21 Desember untuk semua 12 karyawan (monthsFound=11).
// Jalankan: node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/backfill-jan-nov.ts
import { createClient } from "@supabase/supabase-js";
import { runPayroll } from "../src/lib/payroll/run-payroll";
import type { Compensation } from "../src/lib/payroll/run-payroll";
import { pickStatutoryConfigForPeriod, toStatutoryConfig } from "../src/lib/payroll/pay-data";
import type { PiStatutoryConfigRow } from "../src/lib/payroll/pay-data";
import type { PtkpStatus, RiskClass } from "../src/lib/payroll/types";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("env Supabase tidak ada");
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const [{ data: employees, error: empErr }, { data: compensations, error: compErr }, { data: configs, error: cfgErr }] =
    await Promise.all([
      supabase.from("pi_employees").select("*").eq("status", "active").order("full_name"),
      supabase.from("pi_compensation").select("*"),
      supabase.from("pi_statutory_config").select("*").order("effective_date", { ascending: false }),
    ]);
  if (empErr) throw empErr;
  if (compErr) throw compErr;
  if (cfgErr) throw cfgErr;
  if (!employees?.length || !configs?.length) throw new Error("data seed belum lengkap");

  const configRows = configs as PiStatutoryConfigRow[];
  const compByEmp = new Map(compensations?.map((c) => [c.employee_id, c]));

  for (let month = 2; month <= 11; month++) {
    const period = `2026-${String(month).padStart(2, "0")}`;
    const configRow = pickStatutoryConfigForPeriod(configRows, period);
    if (!configRow) throw new Error(`Tidak ada config statutori berlaku untuk periode ${period}`);
    const statutoryConfig = toStatutoryConfig(configRow); // per-periode: Feb pakai plafon lama, Mar+ pakai baru
    const { data: run, error: runErr } = await supabase
      .from("pi_payroll_runs")
      .upsert(
        { tenant_id: employees[0].tenant_id, period, status: "draft", run_date: new Date().toISOString() },
        { onConflict: "tenant_id,period" },
      )
      .select()
      .single();
    if (runErr) throw runErr;

    const lines = [];
    for (const employee of employees) {
      const compRow = compByEmp.get(employee.id);
      if (!compRow) continue;
      const comp: Compensation = {
        upah_pokok: Number(compRow.upah_pokok),
        tunjangan_tetap: compRow.tunjangan_tetap ?? [],
        tunjangan_tidak_tetap: compRow.tunjangan_tidak_tetap ?? [],
      };
      const result = runPayroll({
        compensation: comp,
        ptkpStatus: employee.ptkp_status as PtkpStatus,
        riskClass: employee.risk_class as RiskClass,
        period,
        statutoryConfig,
      });
      lines.push({
        run_id: run.id,
        employee_id: employee.id,
        gross: result.gross,
        components: { bpjs: result.bpjs, bpjsWageBase: result.bpjsWageBase, overtimePay: result.overtimePay, thrAmount: result.thrAmount },
        bpjs_employee: result.bpjs.employee.total,
        bpjs_employer: result.bpjs.employer.total,
        taxable_base: result.gross,
        pph21: result.pph21,
        other_deductions: [],
        net: result.net,
      });
    }
    const { error: linesErr } = await supabase.from("pi_payroll_lines").upsert(lines, { onConflict: "run_id,employee_id" });
    if (linesErr) throw linesErr;
    console.log(`${period}: ${lines.length} baris ditulis`);
  }

  console.log("\nSelesai. Jan-Nov 2026 sekarang lengkap (asumsi gaji flat tiap bulan, tanpa THR/lembur).");
}

main().catch((err) => {
  console.error("GAGAL:", err);
  process.exit(1);
});

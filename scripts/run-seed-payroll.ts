// Bukti payroll nyata ujung-ke-ujung terhadap 12 karyawan sintetis (CLAUDE.md §9).
// Jalankan: node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/run-seed-payroll.ts
import { createClient } from "@supabase/supabase-js";
import { runPayroll } from "../src/lib/payroll/run-payroll";
import type { Compensation, StatutoryConfig } from "../src/lib/payroll/run-payroll";
import { pickStatutoryConfigForPeriod, toStatutoryConfig } from "../src/lib/payroll/pay-data";
import type { PiStatutoryConfigRow } from "../src/lib/payroll/pay-data";
import type { PtkpStatus, RiskClass } from "../src/lib/payroll/types";

const PERIOD = "2026-01";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak ada di env");
  }
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
  if (!employees?.length) throw new Error("pi_employees kosong -- jalankan seed dulu");
  if (!configs?.length) throw new Error("pi_statutory_config kosong -- jalankan seed dulu");

  const configRow = pickStatutoryConfigForPeriod(configs as PiStatutoryConfigRow[], PERIOD);
  if (!configRow) throw new Error(`Tidak ada config statutori berlaku untuk periode ${PERIOD}`);
  const statutoryConfig: StatutoryConfig = toStatutoryConfig(configRow);
  const compensationByEmployee = new Map(compensations?.map((c) => [c.employee_id, c]));

  const { data: run, error: runErr } = await supabase
    .from("pi_payroll_runs")
    .upsert(
      { tenant_id: employees[0].tenant_id, period: PERIOD, status: "draft", run_date: new Date().toISOString() },
      { onConflict: "tenant_id,period" },
    )
    .select()
    .single();
  if (runErr) throw runErr;

  console.log(`Run ${run.id} — periode ${PERIOD}, ${employees.length} karyawan aktif\n`);
  console.log(
    "Nama".padEnd(18),
    "PTKP".padEnd(6),
    "Gross".padStart(12),
    "BPJS Kry".padStart(11),
    "PPh21".padStart(10),
    "Net".padStart(12),
  );

  const lines = [];
  for (const employee of employees) {
    const compensation = compensationByEmployee.get(employee.id);
    if (!compensation) {
      console.log(`  [SKIP] ${employee.full_name} -- tidak ada pi_compensation`);
      continue;
    }

    const comp: Compensation = {
      upah_pokok: Number(compensation.upah_pokok),
      tunjangan_tetap: compensation.tunjangan_tetap ?? [],
      tunjangan_tidak_tetap: compensation.tunjangan_tidak_tetap ?? [],
    };

    const result = runPayroll({
      compensation: comp,
      ptkpStatus: employee.ptkp_status as PtkpStatus,
      riskClass: employee.risk_class as RiskClass,
      period: PERIOD,
      statutoryConfig,
    });

    console.log(
      employee.full_name.padEnd(18),
      employee.ptkp_status.padEnd(6),
      result.gross.toLocaleString("id-ID").padStart(12),
      result.bpjs.employee.total.toLocaleString("id-ID").padStart(11),
      result.pph21.toLocaleString("id-ID").padStart(10),
      result.net.toLocaleString("id-ID").padStart(12),
    );

    lines.push({
      run_id: run.id,
      employee_id: employee.id,
      gross: result.gross,
      components: { bpjs: result.bpjs, bpjsWageBase: result.bpjsWageBase, isDecemberReconciliation: result.isDecemberReconciliation },
      bpjs_employee: result.bpjs.employee.total,
      bpjs_employer: result.bpjs.employer.total,
      taxable_base: result.gross,
      pph21: result.pph21,
      net: result.net,
    });
  }

  const { error: linesErr } = await supabase
    .from("pi_payroll_lines")
    .upsert(lines, { onConflict: "run_id,employee_id" });
  if (linesErr) throw linesErr;

  console.log(`\n${lines.length} pi_payroll_lines ditulis untuk run ${run.id}.`);
}

main().catch((err) => {
  console.error("GAGAL:", err);
  process.exit(1);
});

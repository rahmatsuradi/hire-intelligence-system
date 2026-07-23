"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, Card, Icon, SvgPath, cn } from "@/components/app-shell";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { computeGross } from "@/lib/payroll/run-payroll";
import { maskNpwp } from "@/lib/payroll/payslip-masking";
import type { PiCompensationRow, PiEmployeeRow } from "@/lib/payroll/pay-data";

function rupiah(n: number): string {
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

interface EmployeeView extends PiEmployeeRow {
  upahPokok: number;
  gross: number;
}

export default function EmployeesPage() {
  const [rows, setRows] = useState<EmployeeView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase belum dikonfigurasi.");
      return;
    }
    let cancelled = false;
    (async () => {
      const [emp, comp] = await Promise.all([
        supabase.from("pi_employees").select("*").eq("status", "active").order("full_name"),
        supabase.from("pi_compensation").select("*"),
      ]);
      if (cancelled) return;
      if (emp.error) { setError(emp.error.message); return; }
      if (comp.error) { setError(comp.error.message); return; }
      const compByEmp = new Map<string, PiCompensationRow>((comp.data ?? []).map((c) => [c.employee_id, c]));
      const view: EmployeeView[] = (emp.data ?? []).map((e: PiEmployeeRow) => {
        const c = compByEmp.get(e.id);
        const compensation = {
          upah_pokok: Number(c?.upah_pokok ?? 0),
          tunjangan_tetap: c?.tunjangan_tetap ?? [],
          tunjangan_tidak_tetap: c?.tunjangan_tidak_tetap ?? [],
        };
        return { ...e, upahPokok: compensation.upah_pokok, gross: computeGross(compensation) };
      });
      setRows(view);
    })().catch((e) => !cancelled && setError(String(e)));
    return () => { cancelled = true; };
  }, []);

  const total = useMemo(() => (rows ?? []).reduce((s, r) => s + r.gross, 0), [rows]);

  return (
    <AppShell
      activeNavId="employees"
      title="Employees"
      subtitle="Master data karyawan — dipakai modul Pay"
    >
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </Card>
      )}

      {!error && (
        <Card padding={false}>
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {rows ? `${rows.length} karyawan aktif` : "Memuat…"}
            </p>
            {rows && (
              <p className="text-sm tabular-nums text-slate-500 dark:text-slate-400">
                Total bruto/bulan: <span className="font-semibold text-slate-900 dark:text-white">{rupiah(total)}</span>
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-5 py-3 font-medium">Nama</th>
                  <th className="px-5 py-3 font-medium">Departemen</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">PTKP</th>
                  <th className="px-5 py-3 font-medium">Kelas JKK</th>
                  <th className="px-5 py-3 font-medium">NPWP</th>
                  <th className="px-5 py-3 text-right font-medium">Upah Pokok</th>
                  <th className="px-5 py-3 text-right font-medium">Bruto/bulan</th>
                </tr>
              </thead>
              <tbody>
                {(rows ?? []).map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{r.full_name}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{r.department ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                        r.employment_type === "PKWTT"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300")}>
                        {r.employment_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-600 dark:text-slate-400">{r.ptkp_status}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{r.risk_class}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{maskNpwp(r.npwp)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-600 dark:text-slate-400">{rupiah(r.upahPokok)}</td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-white">{rupiah(r.gross)}</td>
                  </tr>
                ))}
                {rows && rows.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    <Icon className="mx-auto mb-2 h-8 w-8"><SvgPath name="users" /></Icon>
                    Belum ada karyawan. Jalankan seed pi_employees.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AppShell>
  );
}

import { describe, expect, it } from "vitest";
import { aggregateDecemberContext, pickStatutoryConfigForPeriod } from "./pay-data";
import type { PiPayrollLineRow, PiPayrollRunRow } from "./pay-data";

describe("pickStatutoryConfigForPeriod", () => {
  const jan = { effective_date: "2026-01-01", label: "jan" };
  const mar = { effective_date: "2026-03-01", label: "mar" };
  const configs = [jan, mar];

  it("memilih config Januari untuk periode sebelum Maret (plafon lama)", () => {
    expect(pickStatutoryConfigForPeriod(configs, "2026-01")?.label).toBe("jan");
    expect(pickStatutoryConfigForPeriod(configs, "2026-02")?.label).toBe("jan");
  });

  it("memilih config Maret sejak periode Maret dan seterusnya (plafon baru)", () => {
    expect(pickStatutoryConfigForPeriod(configs, "2026-03")?.label).toBe("mar");
    expect(pickStatutoryConfigForPeriod(configs, "2026-11")?.label).toBe("mar");
    expect(pickStatutoryConfigForPeriod(configs, "2026-12")?.label).toBe("mar");
  });

  it("tidak terpengaruh urutan input (memilih effective_date terbaru yang <= periode)", () => {
    expect(pickStatutoryConfigForPeriod([mar, jan], "2026-02")?.label).toBe("jan");
  });

  it("mengembalikan null bila tidak ada config berlaku pada/sebelum periode", () => {
    expect(pickStatutoryConfigForPeriod(configs, "2025-12")).toBeNull();
    expect(pickStatutoryConfigForPeriod([], "2026-01")).toBeNull();
  });
});

function run(id: string, period: string): PiPayrollRunRow {
  return { id, tenant_id: "t1", period, status: "draft", run_date: null };
}

function line(
  runId: string,
  employeeId: string,
  gross: number,
  pph21: number,
  jht: number,
  jp: number,
): PiPayrollLineRow {
  return {
    id: `${runId}-${employeeId}`,
    run_id: runId,
    employee_id: employeeId,
    gross,
    components: { bpjs: { employee: { jht, jp } } },
    bpjs_employee: jht + jp,
    bpjs_employer: 0,
    taxable_base: gross,
    pph21,
    net: gross - jht - jp - pph21,
    other_deductions: [],
  };
}

describe("aggregateDecemberContext", () => {
  it("menjumlahkan gross/pph21/iuran pensiun Jan-Nov untuk karyawan dengan data lengkap (11 bulan)", () => {
    const runs: PiPayrollRunRow[] = Array.from({ length: 11 }, (_, i) =>
      run(`r${i + 1}`, `2026-${String(i + 1).padStart(2, "0")}`));
    const lines: PiPayrollLineRow[] = runs.map((r) => line(r.id, "emp-a", 10_000_000, 200_000, 200_000, 100_000));

    const result = aggregateDecemberContext(runs, lines, "2026");
    const acc = result.get("emp-a")!;
    expect(acc.monthsFound).toBe(11);
    expect(acc.grossJanNov).toBe(110_000_000); // 11 x 10jt
    expect(acc.pph21JanNov).toBe(2_200_000); // 11 x 200rb
    expect(acc.iuranPensiunKaryawanJanNov).toBe(3_300_000); // 11 x 300rb (jht 200rb + jp 100rb)
  });

  it("melaporkan monthsFound < 11 saat data historis tidak lengkap (JANGAN diam-diam anggap 0)", () => {
    const runs: PiPayrollRunRow[] = [run("r1", "2026-01"), run("r2", "2026-02"), run("r3", "2026-05")];
    const lines: PiPayrollLineRow[] = [
      line("r1", "emp-b", 5_000_000, 0, 100_000, 50_000),
      line("r2", "emp-b", 5_000_000, 0, 100_000, 50_000),
      line("r3", "emp-b", 5_000_000, 0, 100_000, 50_000),
    ];

    const result = aggregateDecemberContext(runs, lines, "2026");
    const acc = result.get("emp-b")!;
    expect(acc.monthsFound).toBe(3); // hanya 3 dari 11 bulan tercatat
    expect(acc.grossJanNov).toBe(15_000_000); // tetap jumlahkan yang ADA, tapi caller wajib cek monthsFound
  });

  it("mengabaikan baris dari run Desember (bukan Jan-Nov) dan dari tahun berbeda", () => {
    const runs: PiPayrollRunRow[] = [
      run("r-jan", "2026-01"),
      run("r-dec", "2026-12"), // Desember TIDAK termasuk akumulasi Jan-Nov
      run("r-prevyear", "2025-11"), // tahun sebelumnya, di luar cakupan
    ];
    const lines: PiPayrollLineRow[] = [
      line("r-jan", "emp-c", 5_000_000, 0, 100_000, 50_000),
      line("r-dec", "emp-c", 99_000_000, 0, 999_000, 999_000),
      line("r-prevyear", "emp-c", 88_000_000, 0, 888_000, 888_000),
    ];

    const result = aggregateDecemberContext(runs, lines, "2026");
    const acc = result.get("emp-c")!;
    expect(acc.monthsFound).toBe(1);
    expect(acc.grossJanNov).toBe(5_000_000); // hanya baris Januari 2026 yang dihitung
  });

  it("tidak menghasilkan entry untuk karyawan tanpa data sama sekali", () => {
    const result = aggregateDecemberContext([], [], "2026");
    expect(result.size).toBe(0);
  });
});

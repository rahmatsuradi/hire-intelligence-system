"use client";

import { AppShell, Icon, SvgPath, Card, cn } from "@/components/app-shell";
import {
  getCandidates,
  PIPELINE_STAGES,
  STAGE_LABELS,
  type CandidateRecord,
  type PipelineStage,
} from "@/lib/store";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const STAGE_COLORS: Record<PipelineStage, { bar: string; text: string }> = {
  applied:    { bar: "bg-slate-400",   text: "text-slate-600 dark:text-slate-400" },
  screened:   { bar: "bg-blue-500",    text: "text-blue-700 dark:text-blue-400" },
  interviewed:{ bar: "bg-violet-500",  text: "text-violet-700 dark:text-violet-400" },
  offered:    { bar: "bg-amber-500",   text: "text-amber-700 dark:text-amber-400" },
  hired:      { bar: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
  rejected:   { bar: "bg-red-400",     text: "text-red-600 dark:text-red-400" },
};

const REC_COLORS: Record<string, string> = {
  "Strong Hire": "bg-emerald-500",
  "Hire":        "bg-blue-500",
  "Review":      "bg-amber-500",
  "Reject":      "bg-red-500",
};

const REC_TEXT: Record<string, string> = {
  "Strong Hire": "text-emerald-700 dark:text-emerald-400",
  "Hire":        "text-blue-700 dark:text-blue-400",
  "Review":      "text-amber-700 dark:text-amber-400",
  "Reject":      "text-red-700 dark:text-red-400",
};

function StatCard({ label, value, sub, colorClass = "text-slate-900 dark:text-white" }: {
  label: string; value: string | number; sub?: string; colorClass?: string;
}) {
  return (
    <Card>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold tabular-nums", colorClass)}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </Card>
  );
}

function BarRow({ label, sub, count, pct, barClass }: {
  label: string; sub?: string; count: number; pct: number; barClass: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3">
      <div className="w-28 shrink-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
      <div className="flex-1">
        <div className="h-8 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
          <div
            className={cn("h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2", barClass)}
            style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
          >
            {count > 0 && pct > 15 && (
              <span className="text-xs font-bold text-white">{count}</span>
            )}
          </div>
        </div>
      </div>
      <span className="w-8 shrink-0 text-right text-sm font-bold tabular-nums text-slate-700 dark:text-slate-300">{count}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setCandidates(getCandidates());
      setLoaded(true);
    };
    refresh();
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, []);

  const stats = useMemo(() => {
    const total = candidates.length;
    const withCv = candidates.filter((c) => c.cvAnalysis);
    const hired = candidates.filter((c) => c.stage === "hired").length;
    const offered = candidates.filter((c) => c.stage === "offered" || c.stage === "hired").length;

    const avgScore = withCv.length > 0
      ? Math.round(withCv.reduce((s, c) => s + (c.cvAnalysis?.overallScore ?? 0), 0) / withCv.length)
      : 0;
    const offerAccept = offered > 0 ? Math.round((hired / offered) * 100) : 0;

    const stageCounts: Record<PipelineStage, number> = {
      applied: 0, screened: 0, interviewed: 0, offered: 0, hired: 0, rejected: 0,
    };
    for (const c of candidates) stageCounts[c.stage]++;

    // Cumulative counts (how many reached each stage or beyond)
    const cumulative: Record<PipelineStage, number> = { ...stageCounts };
    for (let i = PIPELINE_STAGES.length - 1; i >= 0; i--) {
      const stage = PIPELINE_STAGES[i];
      if (i < PIPELINE_STAGES.length - 1) {
        cumulative[stage] += cumulative[PIPELINE_STAGES[i + 1]];
      }
    }

    const conversionRates = PIPELINE_STAGES.slice(1).map((stage, i) => {
      const fromStage = PIPELINE_STAGES[i];
      const from = cumulative[fromStage];
      const to = cumulative[stage];
      return { stage, from: STAGE_LABELS[fromStage], rate: from > 0 ? Math.round((to / from) * 100) : 0 };
    });

    const maxStage = Math.max(...PIPELINE_STAGES.map((s) => cumulative[s]), 1);

    // Sources
    const sourceMap = new Map<string, number>();
    for (const c of candidates) {
      const s = c.source || "Manual";
      sourceMap.set(s, (sourceMap.get(s) ?? 0) + 1);
    }
    const sources = Array.from(sourceMap.entries())
      .map(([name, count]) => ({ name, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    // Recommendation mix
    const recMap = new Map<string, number>();
    for (const c of withCv) {
      const r = c.cvAnalysis?.recommendation ?? "Unknown";
      recMap.set(r, (recMap.get(r) ?? 0) + 1);
    }
    const recOrder = ["Strong Hire", "Hire", "Review", "Reject"];
    const recs = Array.from(recMap.entries())
      .map(([name, count]) => ({ name, count, pct: withCv.length > 0 ? Math.round((count / withCv.length) * 100) : 0 }))
      .sort((a, b) => recOrder.indexOf(a.name) - recOrder.indexOf(b.name));

    // Score histogram
    const bins = [
      { label: "<50",   min: 0,  max: 50,  count: 0, color: "bg-red-400" },
      { label: "50–59", min: 50, max: 60,  count: 0, color: "bg-amber-400" },
      { label: "60–69", min: 60, max: 70,  count: 0, color: "bg-amber-500" },
      { label: "70–79", min: 70, max: 80,  count: 0, color: "bg-blue-500" },
      { label: "80–89", min: 80, max: 90,  count: 0, color: "bg-emerald-500" },
      { label: "90+",   min: 90, max: 101, count: 0, color: "bg-emerald-600" },
    ];
    for (const c of withCv) {
      const score = c.cvAnalysis?.overallScore ?? 0;
      const bin = bins.find((b) => score >= b.min && score < b.max);
      if (bin) bin.count++;
    }
    const maxBin = Math.max(...bins.map((b) => b.count), 1);

    // Departments
    const deptMap = new Map<string, { candidates: number; hired: number; scoreSum: number; scoreCount: number }>();
    for (const c of candidates) {
      const d = c.department || "Other";
      const e = deptMap.get(d) ?? { candidates: 0, hired: 0, scoreSum: 0, scoreCount: 0 };
      e.candidates++;
      if (c.stage === "hired") e.hired++;
      if (c.cvAnalysis) { e.scoreSum += c.cvAnalysis.overallScore; e.scoreCount++; }
      deptMap.set(d, e);
    }
    const departments = Array.from(deptMap.entries())
      .map(([name, d]) => ({
        name,
        candidates: d.candidates,
        hired: d.hired,
        avgScore: d.scoreCount > 0 ? Math.round(d.scoreSum / d.scoreCount) : 0,
        hireRate: d.candidates > 0 ? Math.round((d.hired / d.candidates) * 100) : 0,
      }))
      .sort((a, b) => b.candidates - a.candidates);

    return { total, hired, avgScore, offerAccept, withCv: withCv.length, stageCounts, cumulative, maxStage, conversionRates, sources, recs, bins, maxBin, departments };
  }, [candidates]);

  if (!loaded) {
    return (
      <AppShell activeNavId="analytics" title="Analytics" subtitle="Hiring pipeline intelligence">
        <div className="flex h-64 items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (stats.total === 0) {
    return (
      <AppShell activeNavId="analytics" title="Analytics" subtitle="Hiring pipeline intelligence">
        <Card className="flex flex-col items-center justify-center border-dashed py-20 text-center">
          <Icon className="h-12 w-12 text-slate-300 dark:text-slate-600"><SvgPath name="chart" /></Icon>
          <p className="mt-4 font-medium text-slate-900 dark:text-white">No data yet</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Add candidates via the{" "}
            <Link href="/candidates" className="text-blue-600 hover:underline dark:text-blue-400">Candidates</Link> board
            {" "}or run a{" "}
            <Link href="/cv-analyzer" className="text-blue-600 hover:underline dark:text-blue-400">CV Analysis</Link>{" "}
            to start building pipeline data.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell activeNavId="analytics" title="Analytics" subtitle="Hiring pipeline intelligence">

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Candidates" value={stats.total} sub="All time" />
        <StatCard
          label="Avg CV Score" value={stats.avgScore || "—"}
          sub={`${stats.withCv} analyzed`}
          colorClass="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Hired" value={stats.hired}
          sub={`of ${stats.total} total`}
          colorClass="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Offer Accept Rate" value={`${stats.offerAccept}%`}
          sub="Offered → Hired"
          colorClass="text-violet-600 dark:text-violet-400"
        />
      </div>

      {/* Pipeline Funnel */}
      <Card padding={false} className="overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Pipeline Funnel</h2>
          <p className="mt-0.5 text-sm text-slate-500">Cumulative reach per stage · funnel narrows as candidates advance</p>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {PIPELINE_STAGES.map((stage, i) => {
            const conv = stats.conversionRates[i - 1];
            const count = stats.cumulative[stage];
            const pct = Math.round((count / stats.maxStage) * 100);
            const colors = STAGE_COLORS[stage];
            return (
              <BarRow
                key={stage}
                label={STAGE_LABELS[stage]}
                sub={conv ? `${conv.rate}% from ${conv.from}` : "Top of funnel"}
                count={count}
                pct={pct}
                barClass={colors.bar}
              />
            );
          })}
        </div>
        {stats.stageCounts.rejected > 0 && (
          <div className="border-t border-slate-100 opacity-60 dark:border-slate-800">
            <BarRow
              label="Rejected"
              count={stats.stageCounts.rejected}
              pct={Math.round((stats.stageCounts.rejected / stats.maxStage) * 100)}
              barClass="bg-red-400"
            />
          </div>
        )}
      </Card>

      {/* Source + Recommendation */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Candidate Sources</h2>
          <p className="mt-0.5 text-sm text-slate-500">Where candidates entered the pipeline</p>
          {stats.sources.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No source data available</p>
          ) : (
            <div className="mt-5 space-y-3">
              {stats.sources.map((src) => (
                <div key={src.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{src.name}</span>
                    <span className="tabular-nums text-slate-500">{src.count} · {src.pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${src.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">AI Recommendation Mix</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {stats.withCv > 0 ? `From ${stats.withCv} CV analyses` : "Run CV Analyzer to see data here"}
          </p>
          {stats.recs.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-2 py-6 text-center">
              <Icon className="h-8 w-8 text-slate-300 dark:text-slate-600"><SvgPath name="scan" /></Icon>
              <p className="text-sm text-slate-400">No analyses yet</p>
              <Link href="/cv-analyzer" className="text-xs text-blue-600 hover:underline dark:text-blue-400">Go to CV Analyzer →</Link>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {stats.recs.map((rec) => (
                <div key={rec.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className={cn("font-semibold", REC_TEXT[rec.name] ?? "text-slate-700 dark:text-slate-300")}>{rec.name}</span>
                    <span className="tabular-nums text-slate-500">{rec.count} · {rec.pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", REC_COLORS[rec.name] ?? "bg-slate-400")}
                      style={{ width: `${rec.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Score Distribution */}
      {stats.withCv > 0 && (
        <Card>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">CV Score Distribution</h2>
          <p className="mt-0.5 text-sm text-slate-500">Score spread across {stats.withCv} analyzed candidates</p>
          <div className="mt-6 flex items-end gap-3" style={{ height: "120px" }}>
            {stats.bins.map((bin) => {
              const heightPct = stats.maxBin > 0 ? (bin.count / stats.maxBin) * 100 : 0;
              return (
                <div key={bin.label} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 h-4">
                    {bin.count > 0 ? bin.count : ""}
                  </span>
                  <div className="relative w-full flex-1 overflow-hidden rounded-t-md bg-slate-100 dark:bg-slate-800">
                    <div
                      className={cn("absolute bottom-0 w-full rounded-t-md transition-all duration-700", bin.color)}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">{bin.label}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Department Table */}
      {stats.departments.length > 0 && (
        <Card padding={false} className="overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Department Breakdown</h2>
            <p className="mt-0.5 text-sm text-slate-500">Hiring activity and quality by department</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Department</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Candidates</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Hired</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Hire Rate</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats.departments.map((dept) => (
                  <tr key={dept.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{dept.name}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-600 dark:text-slate-400">{dept.candidates}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{dept.hired}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn("text-xs font-semibold tabular-nums",
                        dept.hireRate >= 30 ? "text-emerald-600 dark:text-emerald-400" :
                        dept.hireRate > 0  ? "text-blue-600 dark:text-blue-400" : "text-slate-400"
                      )}>
                        {dept.hireRate > 0 ? `${dept.hireRate}%` : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn("tabular-nums font-medium",
                        dept.avgScore >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                        dept.avgScore >= 70 ? "text-blue-600 dark:text-blue-400" :
                        dept.avgScore >  0  ? "text-amber-600 dark:text-amber-400" : "text-slate-400"
                      )}>
                        {dept.avgScore > 0 ? dept.avgScore : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

    </AppShell>
  );
}

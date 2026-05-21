"use client";

import {
  CITATIONS,
  type CompetencyPillar,
  type CompetencyReportRow,
  type CompetencyScore,
  type RubricLevel,
  SELECTION_VALIDITY,
  getPillarLabel,
} from "@/lib/competency-framework";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function scoreColor(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 75) return "bg-blue-500";
  if (score >= 65) return "bg-amber-500";
  return "bg-slate-400";
}

function scoreTextColor(score: number) {
  if (score >= 85) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 75) return "text-blue-600 dark:text-blue-400";
  if (score >= 65) return "text-amber-600 dark:text-amber-400";
  return "text-slate-500";
}

export function CitationNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-3 border-l-2 border-slate-300 pl-3 text-[11px] leading-relaxed text-slate-500 dark:border-slate-600 dark:text-slate-400",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function EvidenceValidityPanel() {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Evidence-based selection science
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {SELECTION_VALIDITY.map((item) => (
          <div
            key={item.method}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          >
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {item.method}
            </p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-blue-600 dark:text-blue-400">
              r = {item.validity.toFixed(2)}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">{item.note}</p>
          </div>
        ))}
      </div>
      <CitationNote>{CITATIONS.schmidtHunter}</CitationNote>
    </div>
  );
}

export function FrameworkPillarBadge({ pillar }: { pillar: CompetencyPillar }) {
  const styles =
    pillar === "ulrich"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30"
      : "bg-red-50 text-red-800 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        styles,
      )}
    >
      {pillar === "ulrich" ? "Ulrich" : "SKKNI"}
    </span>
  );
}

export function RubricTable({ rubric, compact }: { rubric: RubricLevel[]; compact?: boolean }) {
  return (
    <div className={cn("overflow-x-auto", compact ? "mt-2" : "mt-3")}>
      <table className="w-full min-w-[360px] text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="py-1.5 pr-2 font-medium text-slate-500">Score</th>
            <th className="py-1.5 pr-2 font-medium text-slate-500">Level</th>
            <th className="py-1.5 font-medium text-slate-500">Research-based criteria</th>
          </tr>
        </thead>
        <tbody>
          {rubric.map((r) => (
            <tr
              key={r.score}
              className="border-b border-slate-100 last:border-0 dark:border-slate-800"
            >
              <td className="py-1.5 pr-2 font-bold tabular-nums text-slate-900 dark:text-white">
                {r.score}
              </td>
              <td className="py-1.5 pr-2 font-medium text-slate-600 dark:text-slate-400">
                {r.label}
              </td>
              <td className="py-1.5 text-slate-600 dark:text-slate-400">{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CompetencyScoreList({ scores }: { scores: CompetencyScore[] }) {
  const ulrich = scores.filter((s) => s.pillar === "ulrich");
  const skkni = scores.filter((s) => s.pillar === "skkni");

  const renderGroup = (items: CompetencyScore[], pillar: CompetencyPillar) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
          {getPillarLabel(pillar)}
        </h4>
        <FrameworkPillarBadge pillar={pillar} />
      </div>
      <ul className="space-y-4">
        {items.map((comp) => {
          const above = comp.score >= comp.benchmark;
          return (
            <li
              key={comp.id}
              className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{comp.name}</p>
                  <FrameworkPillarBadge pillar={comp.pillar} />
                </div>
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {comp.score}
                  </span>
                  <span className="text-xs text-slate-400">/ {comp.benchmark}</span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      above
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {above ? "+" : ""}
                    {comp.score - comp.benchmark}
                  </span>
                </div>
              </div>
              <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={cn("h-full rounded-full", scoreColor(comp.score))}
                  style={{ width: `${comp.score}%` }}
                />
                <div
                  className="absolute inset-y-0 w-0.5 bg-slate-500"
                  style={{ left: `${comp.benchmark}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">{comp.insight}</p>
              <details className="mt-3 group">
                <summary className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  View scoring rubric (1–5)
                </summary>
                <RubricTable rubric={comp.rubric} compact />
              </details>
            </li>
          );
        })}
      </ul>
      <CitationNote>
        {pillar === "ulrich" ? CITATIONS.ulrich : CITATIONS.skkni}
      </CitationNote>
    </div>
  );

  return (
    <div className="space-y-8">
      {renderGroup(ulrich, "ulrich")}
      {renderGroup(skkni, "skkni")}
    </div>
  );
}

export function CompetencyReportTable({ rows }: { rows: CompetencyReportRow[] }) {
  const ulrich = rows.filter((r) => r.pillar === "ulrich");
  const skkni = rows.filter((r) => r.pillar === "skkni");

  const renderTable = (items: CompetencyReportRow[], pillar: CompetencyPillar) => (
    <div>
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50/90 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/60">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
          {getPillarLabel(pillar)}
        </h4>
        <FrameworkPillarBadge pillar={pillar} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="px-5 py-3 font-medium text-slate-500">Competency</th>
              <th className="px-5 py-3 text-right font-medium text-slate-500">CV</th>
              <th className="px-5 py-3 text-right font-medium text-slate-500">Interview</th>
              <th className="px-5 py-3 text-right font-medium text-slate-500">Final</th>
              <th className="px-5 py-3 text-right font-medium text-slate-500">Weight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {items.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                  {row.name}
                </td>
                <td
                  className={cn(
                    "px-5 py-3 text-right font-semibold tabular-nums",
                    scoreTextColor(row.cvScore),
                  )}
                >
                  {row.cvScore}
                </td>
                <td
                  className={cn(
                    "px-5 py-3 text-right font-semibold tabular-nums",
                    scoreTextColor(row.interviewScore),
                  )}
                >
                  {row.interviewScore}
                </td>
                <td className="px-5 py-3 text-right">
                  <span
                    className={cn(
                      "inline-flex min-w-[2rem] justify-center rounded-md px-2 py-0.5 font-bold tabular-nums",
                      row.finalScore >= 85
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : row.finalScore >= 75
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
                    )}
                  >
                    {row.finalScore}
                  </span>
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-500">
                  {row.weight}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-2">
        <CitationNote className="mt-0">
          {pillar === "ulrich" ? CITATIONS.ulrich : CITATIONS.skkni}
        </CitationNote>
      </div>
    </div>
  );

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800">
      {renderTable(ulrich, "ulrich")}
      {renderTable(skkni, "skkni")}
    </div>
  );
}

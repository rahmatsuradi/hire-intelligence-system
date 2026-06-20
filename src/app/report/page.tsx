"use client";

import {
  CitationNote,
  CompetencyReportTable,
  EvidenceValidityPanel,
} from "@/components/competency-framework-ui";
import { AppShell, Icon, SvgPath, ICON_PATHS, Card, Button, Label, cn } from "@/components/app-shell";
import {
  buildReportCompetencyRows,
  CITATIONS,
} from "@/lib/competency-framework";
import { getCandidates } from "@/lib/store";
import { useEffect, useMemo, useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   Types & mock data
═══════════════════════════════════════════════════════════════════════════ */

type Recommendation = "Strong Hire" | "Hire" | "Review" | "Reject";

interface EvidenceItem {
  title: string;
  quote: string;
  source: string;
}

interface PanelMember {
  name: string;
  role: string;
  score: number;
  recommendation: Recommendation;
}

interface HiringReport {
  id: string;
  candidateId: string;
  name: string;
  position: string;
  department: string;
  reportDate: string;
  recommendation: Recommendation;
  cvScore: number;
  interviewScore: number;
  finalScore: number;
  confidence: number;
  competencies: ReturnType<typeof buildReportCompetencyRows>;
  strengths: EvidenceItem[];
  developmentAreas: EvidenceItem[];
  panel: PanelMember[];
  consensus: Recommendation;
  consensusNote: string;
}

const CANDIDATE_REPORTS: HiringReport[] = [
  {
    id: "RPT-20260521-SC01",
    candidateId: "C-1042",
    name: "Sarah Chen",
    position: "Senior Product Manager",
    department: "Product",
    reportDate: "May 21, 2026",
    recommendation: "Strong Hire",
    cvScore: 92,
    interviewScore: 89,
    finalScore: 91,
    confidence: 96,
    competencies: buildReportCompetencyRows("C-1042"),
    strengths: [
      {
        title: "Credible Activist — stakeholder influence",
        quote:
          "Led quarterly business reviews with C-suite; secured $4.2M incremental roadmap investment through data-driven prioritization.",
        source: "CV Analysis · Panel Interview",
      },
      {
        title: "Rekrutmen & Seleksi — structured hiring",
        quote:
          "Designed competency-based selection with structured interview rubrics; quality-of-hire metrics improved 22%.",
        source: "CV Analysis · SKKNI Rekrutmen",
      },
      {
        title: "HR Innovator & Integrator",
        quote:
          "Integrated onboarding with selection criteria; panel rated strategic alignment 4.5/5.",
        source: "Structured Interview · M. Torres",
      },
    ],
    developmentAreas: [
      {
        title: "Hubungan Industrial — limited PK exposure",
        quote:
          "Minimal Bipartit case examples; validate against SKKNI Hubungan Industrial rubric.",
        source: "Behavioral Interview",
      },
      {
        title: "Technology Proponent depth",
        quote:
          "People analytics usage described at high level; probe dashboard design in next round.",
        source: "Technical Interview · J. Patel",
      },
    ],
    panel: [
      { name: "Maria Torres", role: "VP Product", score: 92, recommendation: "Strong Hire" },
      { name: "James Patel", role: "Staff Engineer", score: 86, recommendation: "Hire" },
      { name: "Alex Kim", role: "Talent Lead", score: 90, recommendation: "Strong Hire" },
      { name: "Rina Okoye", role: "HR Business Partner", score: 88, recommendation: "Hire" },
    ],
    consensus: "Strong Hire",
    consensusNote:
      "Panel consensus: Strong Hire. Ulrich Credible Activist + SKKNI Rekrutmen scores drive decision. Structured interview evidence (r ≈ 0.51) supports offer at top of band.",
  },
  {
    id: "RPT-20260521-MW02",
    candidateId: "C-1038",
    name: "Marcus Williams",
    position: "Staff Software Engineer",
    department: "Engineering",
    reportDate: "May 21, 2026",
    recommendation: "Hire",
    cvScore: 88,
    interviewScore: 84,
    finalScore: 86,
    confidence: 91,
    competencies: buildReportCompetencyRows("C-1038"),
    strengths: [
      {
        title: "Technology Proponent — systems depth",
        quote:
          "Designed event-driven migration serving 12M daily users; documented failure modes and rollback strategy comprehensively.",
        source: "CV Analysis · System Design",
      },
      {
        title: "Capability Builder — technical pipeline",
        quote:
          "Built engineering competency framework; work-sample assessments adopted org-wide.",
        source: "CV Analysis · Ulrich",
      },
      {
        title: "Rekrutmen & Seleksi",
        quote:
          "Structured technical interview scored 4.5/5 against SKKNI rubric.",
        source: "Interview · J. Patel",
      },
    ],
    developmentAreas: [
      {
        title: "Strategic Positioner — org-wide scope",
        quote:
          "Influence primarily team-level; limited enterprise workforce planning examples.",
        source: "Leadership Interview",
      },
      {
        title: "Change Champion",
        quote:
          "Change adoption metrics weak in behavioral responses; 6-month development plan recommended.",
        source: "Panel Debrief",
      },
    ],
    panel: [
      { name: "James Patel", role: "Staff Engineer", score: 88, recommendation: "Hire" },
      { name: "Elena Brooks", role: "Eng Director", score: 84, recommendation: "Hire" },
      { name: "Alex Kim", role: "Talent Lead", score: 85, recommendation: "Hire" },
    ],
    consensus: "Hire",
    consensusNote:
      "Panel recommends hire at Staff level with 6-month leadership development plan. Technical bar clearly met; monitor cross-org influence milestones.",
  },
  {
    id: "RPT-20260521-DK03",
    candidateId: "C-1024",
    name: "David Kim",
    position: "Security Architect",
    department: "Security",
    reportDate: "May 20, 2026",
    recommendation: "Review",
    cvScore: 68,
    interviewScore: 72,
    finalScore: 70,
    confidence: 78,
    competencies: buildReportCompetencyRows("C-1024"),
    strengths: [
      {
        title: "Technology Proponent — security systems",
        quote:
          "Implemented zero-trust segmentation reducing attack surface; CISSP with 9 years in fintech security.",
        source: "CV Analysis",
      },
      {
        title: "Incident response composure",
        quote:
          "Described ransomware tabletop exercise leadership; calm structured approach noted by panel.",
        source: "Behavioral Interview",
      },
      {
        title: "Improved interview trajectory",
        quote:
          "Second-round technical score 72 vs screening 65; showed learning agility on compliance frameworks.",
        source: "Interview Comparison",
      },
    ],
    developmentAreas: [
      {
        title: "Perencanaan SDM — strategic workforce plan",
        quote:
          "90-day plan generic vs SKKNI Perencanaan SDM bar; lacks scenario-based workforce planning.",
        source: "Panel Interview",
      },
      {
        title: "HR Innovator integration",
        quote:
          "Selection and development practices not integrated; recommend follow-up structured case.",
        source: "Technical Interview · R. Singh",
      },
    ],
    panel: [
      { name: "Raj Singh", role: "Security Lead", score: 74, recommendation: "Review" },
      { name: "Alex Kim", role: "Talent Lead", score: 68, recommendation: "Review" },
      { name: "CFO Delegate", role: "Risk Committee", score: 70, recommendation: "Hire" },
    ],
    consensus: "Review",
    consensusNote:
      "Split panel — not ready for immediate offer. Recommend additional reference check on compliance program leadership and optional follow-up case on enterprise threat modeling.",
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Page-specific utilities
═══════════════════════════════════════════════════════════════════════════ */

function recommendationStyles(rec: Recommendation) {
  const map: Record<Recommendation, string> = {
    "Strong Hire":
      "bg-emerald-600 text-white ring-emerald-600/30 dark:bg-emerald-500",
    Hire: "bg-blue-600 text-white ring-blue-600/30 dark:bg-blue-500",
    Review: "bg-amber-500 text-white ring-amber-500/30",
    Reject: "bg-red-600 text-white ring-red-600/30 dark:bg-red-500",
  };
  return map[rec];
}

function recommendationBadge(rec: Recommendation) {
  const subtle: Record<Recommendation, string> = {
    "Strong Hire":
      "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400",
    Hire: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400",
    Review:
      "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400",
    Reject: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        subtle[rec],
      )}
    >
      {rec}
    </span>
  );
}

function scoreColor(score: number) {
  if (score >= 85) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 75) return "text-blue-600 dark:text-blue-400";
  if (score >= 65) return "text-amber-600 dark:text-amber-400";
  return "text-slate-500";
}

function barColor(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 75) return "bg-blue-500";
  if (score >= 65) return "bg-amber-500";
  return "bg-slate-400";
}

const selectClass =
  "w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

/* ═══════════════════════════════════════════════════════════════════════════
   Report sections
═══════════════════════════════════════════════════════════════════════════ */

function ReportHeader({ report }: { report: HiringReport }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 px-5 py-5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-blue-500/5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-bold text-white shadow-md">
              {report.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {report.name}
              </h2>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                {report.position} &middot; {report.department}
              </p>
              <p className="mt-2 font-mono text-xs text-slate-400">
                {report.id} &middot; {report.reportDate} &middot; {report.candidateId}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Overall recommendation
            </span>
            <span
              className={cn(
                "inline-flex rounded-full px-4 py-1.5 text-sm font-bold shadow-sm ring-2 ring-inset",
                recommendationStyles(report.recommendation),
              )}
            >
              {report.recommendation}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ScoreSummary({ report }: { report: HiringReport }) {
  const scores = [
    {
      label: "CV Analysis",
      value: report.cvScore,
      sub: "Resume & profile intelligence",
      icon: "scan" as const,
    },
    {
      label: "Interview",
      value: report.interviewScore,
      sub: "Panel & structured interviews",
      icon: "workspace" as const,
    },
    {
      label: "Combined final",
      value: report.finalScore,
      sub: "Weighted composite score",
      icon: "arrowTrend" as const,
      highlight: true,
    },
    {
      label: "Confidence",
      value: report.confidence,
      sub: "Model certainty on decision",
      icon: "check" as const,
      suffix: "%",
    },
  ];

  return (
    <section aria-label="Score summary">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
        Score summary
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {scores.map((s) => (
          <Card
            key={s.label}
            className={cn(s.highlight && "ring-2 ring-blue-500/20 dark:ring-blue-500/30")}
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
              <Icon
                className={cn(
                  "h-5 w-5",
                  s.highlight ? "text-blue-600 dark:text-blue-400" : "text-slate-400",
                )}
              >
                <SvgPath name={s.icon} />
              </Icon>
            </div>
            <p
              className={cn(
                "mt-2 text-3xl font-bold tabular-nums",
                s.highlight
                  ? "text-blue-600 dark:text-blue-400"
                  : scoreColor(s.value),
              )}
            >
              {s.value}
              {s.suffix ?? ""}
            </p>
            <p className="mt-1 text-xs text-slate-400">{s.sub}</p>
            {!s.suffix && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={cn("h-full rounded-full", barColor(s.value))}
                  style={{ width: `${s.value}%` }}
                />
              </div>
            )}
          </Card>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Final = 40% CV + 60% structured interview &middot; Ulrich (6) + SKKNI (5) weighted framework
      </p>
      <CitationNote>{CITATIONS.schmidtHunter}</CitationNote>
    </section>
  );
}

function CompetencyTable({ report }: { report: HiringReport }) {
  return (
    <Card padding={false} className="overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          Competency breakdown
        </h3>
        <p className="mt-0.5 text-sm text-slate-500">
          Ulrich HR model + SKKNI No. 149/2020 &mdash; CV vs structured interview
        </p>
      </div>
      <CompetencyReportTable rows={report.competencies} />
    </Card>
  );
}

function KeyEvidence({ report }: { report: HiringReport }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400">
            <SvgPath name="check" />
          </Icon>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Key strengths
          </h3>
        </div>
        <ul className="mt-4 space-y-4">
          {report.strengths.map((item, i) => (
            <li
              key={i}
              className="rounded-lg border border-emerald-200/80 bg-emerald-50/30 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5"
            >
              <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
              <blockquote className="mt-2 border-l-2 border-emerald-400 pl-3 text-sm italic text-slate-600 dark:text-slate-400">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <p className="mt-2 text-xs text-slate-500">{item.source}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-amber-600 dark:text-amber-400">
            <SvgPath name="arrowTrend" />
          </Icon>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Development areas
          </h3>
        </div>
        <ul className="mt-4 space-y-4">
          {report.developmentAreas.map((item, i) => (
            <li
              key={i}
              className="rounded-lg border border-amber-200/80 bg-amber-50/30 p-4 dark:border-amber-500/20 dark:bg-amber-500/5"
            >
              <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
              <blockquote className="mt-2 border-l-2 border-amber-400 pl-3 text-sm italic text-slate-600 dark:text-slate-400">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <p className="mt-2 text-xs text-slate-500">{item.source}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function PanelDecision({ report }: { report: HiringReport }) {
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Panel decision
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Individual interviewer assessments and consensus
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Consensus
          </p>
          <div className="mt-1">{recommendationBadge(report.consensus)}</div>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="pb-2 font-medium text-slate-500">Interviewer</th>
              <th className="pb-2 font-medium text-slate-500">Role</th>
              <th className="pb-2 text-right font-medium text-slate-500">Score</th>
              <th className="pb-2 text-right font-medium text-slate-500">Recommendation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {report.panel.map((member) => (
              <tr key={member.name}>
                <td className="py-3 font-medium text-slate-900 dark:text-white">
                  {member.name}
                </td>
                <td className="py-3 text-slate-600 dark:text-slate-400">{member.role}</td>
                <td
                  className={cn(
                    "py-3 text-right font-semibold tabular-nums",
                    scoreColor(member.score),
                  )}
                >
                  {member.score}
                </td>
                <td className="py-3 text-right">{recommendationBadge(member.recommendation)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Consensus summary
        </p>
        <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">
          {report.consensusNote}
        </p>
      </div>
    </Card>
  );
}

function ActionBar({ report }: { report: HiringReport }) {
  const isPositive =
    report.recommendation === "Strong Hire" || report.recommendation === "Hire";
  const isReject = report.recommendation === "Reject";

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-500/5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">Decision actions</p>
          <p className="mt-0.5 text-sm text-slate-500">
            Record final outcome for {report.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="lg" disabled={!isPositive}>
            <Icon className="h-5 w-5">
              <SvgPath name="envelope" />
            </Icon>
            Approve &amp; Send Offer
          </Button>
          <Button variant="secondary" size="lg" disabled={isReject}>
            <Icon className="h-5 w-5">
              <SvgPath name="calendarDays" />
            </Icon>
            Schedule Next Round
          </Button>
          <Button variant="danger" size="lg">
            <Icon className="h-5 w-5">
              <SvgPath name="xmark" />
            </Icon>
            Decline Candidate
          </Button>
          <Button variant="secondary" size="lg">
            <Icon className="h-5 w-5">
              <SvgPath name="download" />
            </Icon>
            Export PDF
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════════════════════════════ */

function deriveRecommendation(score: number): Recommendation {
  if (score >= 85) return "Strong Hire";
  if (score >= 70) return "Hire";
  if (score >= 55) return "Review";
  return "Reject";
}

export default function ReportPage() {
  const [storeReports, setStoreReports] = useState<HiringReport[]>([]);

  useEffect(() => {
    const candidates = getCandidates().filter(
      (c) => c.cvAnalysis && c.interviewResults.length > 0,
    );
    const built: HiringReport[] = candidates.map((c) => {
      const cvScore = c.cvAnalysis!.overallScore;
      const interviewScore = Math.round(c.interviewResults[0].avgRating * 20);
      const finalScore = Math.round(cvScore * 0.6 + interviewScore * 0.4);
      const rec = deriveRecommendation(finalScore);
      return {
        id: `RPT-${c.id}`,
        candidateId: c.id,
        name: c.name,
        position: c.position,
        department: c.department,
        reportDate: new Date(c.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        recommendation: rec,
        cvScore,
        interviewScore,
        finalScore,
        confidence: c.cvAnalysis!.confidence,
        competencies: buildReportCompetencyRows(c.id),
        strengths: [{ title: "CV Analysis", quote: c.cvAnalysis!.summary, source: `CV Score: ${cvScore}` }],
        developmentAreas: [],
        panel: [],
        consensus: rec,
        consensusNote: `Combined score: ${finalScore}. CV (${cvScore}) weighted 60%, Interview (${interviewScore}) weighted 40%. Confidence: ${c.cvAnalysis!.confidence}%.`,
      };
    });
    setStoreReports(built);
  }, []);

  const allReports = useMemo(() => [...storeReports, ...CANDIDATE_REPORTS], [storeReports]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const effectiveId = selectedId ?? allReports[0]?.candidateId ?? CANDIDATE_REPORTS[0].candidateId;

  const report = useMemo(
    () => allReports.find((r) => r.candidateId === effectiveId) ?? allReports[0] ?? CANDIDATE_REPORTS[0],
    [allReports, effectiveId],
  );

  return (
    <AppShell activeNavId="hiring-report" title="Hiring Report" subtitle="Final decision intelligence">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <Label htmlFor="candidate-select">Select candidate</Label>
          <select
            id="candidate-select"
            value={effectiveId}
            onChange={(e) => setSelectedId(e.target.value)}
            className={selectClass}
          >
            {storeReports.length > 0 && (
              <optgroup label="From your candidates">
                {storeReports.map((r) => (
                  <option key={r.candidateId} value={r.candidateId}>
                    {r.name} — {r.position} ({r.recommendation})
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Sample reports">
              {CANDIDATE_REPORTS.map((r) => (
                <option key={r.candidateId} value={r.candidateId}>
                  {r.name} — {r.position} ({r.recommendation})
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        {storeReports.length === 0 && (
          <p className="text-xs text-slate-400">
            Complete a CV Analysis + Interview to see your own candidates here.
          </p>
        )}
      </div>

      <ReportHeader report={report} />
      <EvidenceValidityPanel />
      <ScoreSummary report={report} />
      <CompetencyTable report={report} />
      <KeyEvidence report={report} />
      <PanelDecision report={report} />
      <ActionBar report={report} />
    </AppShell>
  );
}

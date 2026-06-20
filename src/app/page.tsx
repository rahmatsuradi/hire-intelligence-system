"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, Icon, SvgPath, Card, Button, cn } from "@/components/app-shell";
import {
  getCandidates as getStoreCandidates,
  getDashboardStats,
  loadDemoData,
  hasDemoData,
  STAGE_LABELS as STORE_STAGE_LABELS,
  PIPELINE_STAGES as STORE_PIPELINE_STAGES,
  type CandidateRecord,
  type DashboardStats,
} from "@/lib/store";

/* ═══════════════════════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════════════════════ */

type Trend = "up" | "down" | "neutral";
type CandidateStatus = "Strong" | "Review" | "Hold" | "Rejected";
type SortKey = "name" | "score" | "updated";
type SortDir = "asc" | "desc";

interface StatCard {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: Trend;
  sub: string;
  sparkline: number[];
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  stage: string;
  score: number;
  competency: string;
  status: CandidateStatus;
  updated: string;
  interviewer: string;
}

interface Competency {
  name: string;
  score: number;
  benchmark: number;
  roles: number;
  delta: number;
}

interface PipelineStage {
  stage: string;
  count: number;
  pct: number;
  conversion?: string;
}

interface Interview {
  id: string;
  candidate: string;
  role: string;
  time: string;
  type: string;
  interviewer: string;
}

interface Activity {
  id: string;
  action: string;
  target: string;
  user: string;
  time: string;
  type: "hire" | "interview" | "offer" | "review";
}

interface OpenRole {
  id: string;
  title: string;
  department: string;
  applicants: number;
  priority: "High" | "Medium" | "Low";
  daysOpen: number;
}

interface DeptMetric {
  name: string;
  filled: number;
  target: number;
  openRoles: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Mock data
═══════════════════════════════════════════════════════════════════════════ */

const STATS: StatCard[] = [
  {
    id: "candidates",
    label: "Active Candidates",
    value: "1,284",
    change: "+12.4%",
    trend: "up",
    sub: "vs prior 30 days",
    sparkline: [62, 68, 71, 69, 74, 78, 82, 85, 88, 91, 94, 100],
  },
  {
    id: "positions",
    label: "Open Positions",
    value: "47",
    change: "+3",
    trend: "up",
    sub: "8 departments hiring",
    sparkline: [40, 42, 41, 44, 43, 45, 46, 44, 47, 46, 47, 47],
  },
  {
    id: "time-to-hire",
    label: "Avg. Time to Hire",
    value: "24d",
    change: "-18%",
    trend: "down",
    sub: "Pipeline velocity improved",
    sparkline: [100, 95, 92, 88, 85, 80, 76, 72, 68, 58, 52, 48],
  },
  {
    id: "acceptance",
    label: "Offer Acceptance",
    value: "87.2%",
    change: "+4.1%",
    trend: "up",
    sub: "Q2 target: 85%",
    sparkline: [72, 74, 75, 76, 78, 79, 80, 82, 83, 84, 86, 87],
  },
];

const CANDIDATES: Candidate[] = [
  {
    id: "C-1042",
    name: "Sarah Chen",
    email: "sarah.chen@email.com",
    role: "Senior Product Manager",
    department: "Product",
    stage: "Final Interview",
    score: 92,
    competency: "Leadership",
    status: "Strong",
    updated: "2h ago",
    interviewer: "M. Torres",
  },
  {
    id: "C-1038",
    name: "Marcus Williams",
    email: "marcus.w@email.com",
    role: "Staff Software Engineer",
    department: "Engineering",
    stage: "Technical Review",
    score: 88,
    competency: "Architecture",
    status: "Strong",
    updated: "5h ago",
    interviewer: "J. Patel",
  },
  {
    id: "C-1035",
    name: "Elena Rodriguez",
    email: "elena.r@email.com",
    role: "Data Science Lead",
    department: "Data",
    stage: "Panel Interview",
    score: 85,
    competency: "Analytics",
    status: "Strong",
    updated: "1d ago",
    interviewer: "A. Brooks",
  },
  {
    id: "C-1031",
    name: "James Okonkwo",
    email: "j.okonkwo@email.com",
    role: "VP of Engineering",
    department: "Engineering",
    stage: "Culture Fit",
    score: 79,
    competency: "Strategy",
    status: "Review",
    updated: "1d ago",
    interviewer: "CEO Office",
  },
  {
    id: "C-1027",
    name: "Priya Sharma",
    email: "priya.s@email.com",
    role: "UX Research Director",
    department: "Design",
    stage: "Assessment",
    score: 74,
    competency: "Design",
    status: "Review",
    updated: "2d ago",
    interviewer: "L. Nguyen",
  },
  {
    id: "C-1024",
    name: "David Kim",
    email: "david.kim@email.com",
    role: "Security Architect",
    department: "Security",
    stage: "Screening",
    score: 68,
    competency: "Security",
    status: "Hold",
    updated: "3d ago",
    interviewer: "R. Singh",
  },
  {
    id: "C-1020",
    name: "Amelia Foster",
    email: "amelia.f@email.com",
    role: "Finance Director",
    department: "Finance",
    stage: "Offer Pending",
    score: 91,
    competency: "Finance",
    status: "Strong",
    updated: "4h ago",
    interviewer: "CFO Office",
  },
  {
    id: "C-1016",
    name: "Thomas Berg",
    email: "t.berg@email.com",
    role: "Sales Enablement Lead",
    department: "Sales",
    stage: "Reference Check",
    score: 71,
    competency: "Sales",
    status: "Review",
    updated: "2d ago",
    interviewer: "S. Walsh",
  },
];

const COMPETENCIES: Competency[] = [
  { name: "Technical Skills", score: 88, benchmark: 82, roles: 12, delta: 6 },
  { name: "Leadership", score: 76, benchmark: 78, roles: 8, delta: -2 },
  { name: "Communication", score: 91, benchmark: 85, roles: 15, delta: 6 },
  { name: "Problem Solving", score: 84, benchmark: 80, roles: 14, delta: 4 },
  { name: "Culture Fit", score: 79, benchmark: 83, roles: 11, delta: -4 },
  { name: "Domain Expertise", score: 72, benchmark: 75, roles: 9, delta: -3 },
];

const PIPELINE: PipelineStage[] = [
  { stage: "Applied", count: 412, pct: 100, conversion: "—" },
  { stage: "Screened", count: 286, pct: 69, conversion: "69%" },
  { stage: "Interviewed", count: 124, pct: 30, conversion: "43%" },
  { stage: "Offered", count: 38, pct: 9, conversion: "31%" },
  { stage: "Hired", count: 22, pct: 5, conversion: "58%" },
];

const HIRING_TREND = [
  { month: "Jun", applications: 320, hires: 14 },
  { month: "Jul", applications: 380, hires: 18 },
  { month: "Aug", applications: 410, hires: 16 },
  { month: "Sep", applications: 395, hires: 20 },
  { month: "Oct", applications: 440, hires: 19 },
  { month: "Nov", applications: 465, hires: 22 },
  { month: "Dec", applications: 390, hires: 17 },
  { month: "Jan", applications: 420, hires: 21 },
  { month: "Feb", applications: 455, hires: 23 },
  { month: "Mar", applications: 480, hires: 24 },
  { month: "Apr", applications: 510, hires: 26 },
  { month: "May", applications: 412, hires: 22 },
];

const INTERVIEWS: Interview[] = [
  {
    id: "I-301",
    candidate: "Sarah Chen",
    role: "Sr. Product Manager",
    time: "Today, 2:00 PM",
    type: "Final Panel",
    interviewer: "M. Torres + 2",
  },
  {
    id: "I-302",
    candidate: "Marcus Williams",
    role: "Staff Engineer",
    time: "Today, 4:30 PM",
    type: "System Design",
    interviewer: "J. Patel",
  },
  {
    id: "I-303",
    candidate: "Elena Rodriguez",
    role: "Data Science Lead",
    time: "Tomorrow, 10:00 AM",
    type: "Case Study",
    interviewer: "A. Brooks",
  },
  {
    id: "I-304",
    candidate: "Amelia Foster",
    role: "Finance Director",
    time: "Tomorrow, 1:00 PM",
    type: "Executive Review",
    interviewer: "CFO Office",
  },
];

const ACTIVITIES: Activity[] = [
  {
    id: "A-1",
    action: "Extended offer to",
    target: "Amelia Foster",
    user: "Alex Kim",
    time: "4h ago",
    type: "offer",
  },
  {
    id: "A-2",
    action: "Completed panel for",
    target: "Sarah Chen",
    user: "M. Torres",
    time: "6h ago",
    type: "interview",
  },
  {
    id: "A-3",
    action: "Moved to final stage:",
    target: "Marcus Williams",
    user: "J. Patel",
    time: "8h ago",
    type: "review",
  },
  {
    id: "A-4",
    action: "Hired",
    target: "Nina Kowalski — Marketing Lead",
    user: "HR Ops",
    time: "1d ago",
    type: "hire",
  },
  {
    id: "A-5",
    action: "Scheduled interview for",
    target: "Elena Rodriguez",
    user: "A. Brooks",
    time: "1d ago",
    type: "interview",
  },
];

const OPEN_ROLES: OpenRole[] = [
  {
    id: "R-201",
    title: "Staff Software Engineer",
    department: "Engineering",
    applicants: 84,
    priority: "High",
    daysOpen: 12,
  },
  {
    id: "R-202",
    title: "Senior Product Manager",
    department: "Product",
    applicants: 62,
    priority: "High",
    daysOpen: 8,
  },
  {
    id: "R-203",
    title: "Data Science Lead",
    department: "Data",
    applicants: 41,
    priority: "Medium",
    daysOpen: 21,
  },
  {
    id: "R-204",
    title: "Security Architect",
    department: "Security",
    applicants: 29,
    priority: "High",
    daysOpen: 34,
  },
];

const DEPARTMENTS: DeptMetric[] = [
  { name: "Engineering", filled: 18, target: 24, openRoles: 6 },
  { name: "Product", filled: 8, target: 10, openRoles: 2 },
  { name: "Data", filled: 6, target: 9, openRoles: 3 },
  { name: "Design", filled: 4, target: 6, openRoles: 2 },
  { name: "Sales", filled: 12, target: 15, openRoles: 3 },
  { name: "Finance", filled: 3, target: 4, openRoles: 1 },
];

function timeAgoShort(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const STATUS_FILTERS: Array<CandidateStatus | "All"> = [
  "All",
  "Strong",
  "Review",
  "Hold",
];

/* ═══════════════════════════════════════════════════════════════════════════
   Utilities
═══════════════════════════════════════════════════════════════════════════ */

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function scoreColor(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 75) return "bg-blue-500";
  if (score >= 65) return "bg-amber-500";
  return "bg-slate-400";
}

/* ═══════════════════════════════════════════════════════════════════════════
   UI primitives
═══════════════════════════════════════════════════════════════════════════ */

function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function StatusBadge({ status }: { status: CandidateStatus }) {
  const styles: Record<CandidateStatus, string> = {
    Strong:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30",
    Review:
      "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
    Hold: "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/30",
    Rejected:
      "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[status],
      )}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: OpenRole["priority"] }) {
  const styles = {
    High: "text-red-600 dark:text-red-400",
    Medium: "text-amber-600 dark:text-amber-400",
    Low: "text-slate-500 dark:text-slate-400",
  };
  return (
    <span className={cn("text-xs font-semibold uppercase tracking-wide", styles[priority])}>
      {priority}
    </span>
  );
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const w = 80;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const stroke = positive ? "#10b981" : "#3b82f6";
  const fill = positive ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.12)";
  const area = `0,${h} ${points} ${w},${h}`;
  return (
    <svg width={w} height={h} className="shrink-0" aria-hidden="true">
      <polygon points={area} fill={fill} />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HiringTrendChart() {
  const w = 100;
  const h = 48;
  const maxApps = Math.max(...HIRING_TREND.map((d) => d.applications));
  const maxHires = Math.max(...HIRING_TREND.map((d) => d.hires));
  const n = HIRING_TREND.length;

  const toPoints = (key: "applications" | "hires", max: number) =>
    HIRING_TREND.map((d, i) => {
      const x = (i / (n - 1)) * w;
      const y = h - (d[key] / max) * (h - 6) - 3;
      return `${x},${y}`;
    }).join(" ");

  return (
    <div className="mt-4">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-32 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Hiring trend chart showing applications and hires over 12 months"
      >
        {[0, 25, 50, 75, 100].map((pct) => (
          <line
            key={pct}
            x1="0"
            y1={(h * pct) / 100}
            x2={w}
            y2={(h * pct) / 100}
            className="stroke-slate-200 dark:stroke-slate-700"
            strokeWidth="0.3"
          />
        ))}
        <polyline
          points={toPoints("applications", maxApps)}
          fill="none"
          className="stroke-blue-500"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={toPoints("hires", maxHires)}
          fill="none"
          className="stroke-emerald-500"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="h-0.5 w-3 rounded bg-blue-500" />
            Applications
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="h-0.5 w-3 rounded bg-emerald-500" />
            Hires
          </span>
        </div>
        <span className="text-xs text-slate-400">Last 12 months</span>
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        {HIRING_TREND.filter((_, i) => i % 3 === 0).map((d) => (
          <span key={d.month}>{d.month}</span>
        ))}
      </div>
    </div>
  );
}

function CompetencyRadar() {
  const cx = 100;
  const cy = 100;
  const r = 72;
  const n = COMPETENCIES.length;
  const angleStep = (2 * Math.PI) / n;

  const point = (value: number, i: number) => {
    const angle = i * angleStep - Math.PI / 2;
    const dist = (value / 100) * r;
    return [cx + dist * Math.cos(angle), cy + dist * Math.sin(angle)];
  };

  const polygon = (key: "score" | "benchmark") =>
    COMPETENCIES.map((c, i) => point(c[key], i).join(",")).join(" ");

  const gridLevels = [25, 50, 75, 100];

  return (
    <svg
      viewBox="0 0 200 200"
      className="mx-auto h-48 w-48"
      role="img"
      aria-label="Competency radar chart"
    >
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={COMPETENCIES.map((_, i) => point(level, i).join(",")).join(" ")}
          fill="none"
          className="stroke-slate-200 dark:stroke-slate-700"
          strokeWidth="0.5"
        />
      ))}
      {COMPETENCIES.map((_, i) => {
        const [x, y] = point(100, i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            className="stroke-slate-200 dark:stroke-slate-700"
            strokeWidth="0.5"
          />
        );
      })}
      <polygon
        points={polygon("benchmark")}
        fill="rgba(148,163,184,0.15)"
        className="stroke-slate-400"
        strokeWidth="1"
      />
      <polygon
        points={polygon("score")}
        fill="rgba(59,130,246,0.2)"
        className="stroke-blue-500"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full transition-all", scoreColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-6 text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-300">
        {score}
      </span>
    </div>
  );
}

function StatCards({ stats }: { stats: StatCard[] }) {
  return (
    <section
      aria-label="Key performance indicators"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {stats.map((stat) => {
        const positive = stat.trend === "up" && stat.id !== "time-to-hire";
        const negativeGood = stat.id === "time-to-hire" && stat.trend === "down";
        const trendPositive = positive || negativeGood;
        return (
          <article
            key={stat.id}
            className="group rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
              <Sparkline data={stat.sparkline} positive={trendPositive} />
            </div>
            <div className="mt-3 flex items-end justify-between">
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {stat.value}
              </p>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                  trendPositive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
                )}
              >
                <Icon className="h-3.5 w-3.5">
                  <SvgPath name={stat.trend === "up" ? "trendUp" : "trendDown"} />
                </Icon>
                {stat.change}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{stat.sub}</p>
          </article>
        );
      })}
    </section>
  );
}

function CandidateTable({
  candidates,
  searchQuery,
  statusFilter,
  onStatusFilterChange,
  sortKey,
  sortDir,
  onSort,
}: {
  candidates: Candidate[];
  searchQuery: string;
  statusFilter: CandidateStatus | "All";
  onStatusFilterChange: (s: CandidateStatus | "All") => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const filtered = useMemo(() => {
    let list = [...candidates];
    if (statusFilter !== "All") {
      list = list.filter((c) => c.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "score") cmp = a.score - b.score;
      else cmp = a.updated.localeCompare(b.updated);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [candidates, statusFilter, searchQuery, sortKey, sortDir]);

  const SortBtn = ({ label, col }: { label: string; col: SortKey }) => (
    <button
      type="button"
      onClick={() => onSort(col)}
      className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
    >
      {label}
      {sortKey === col && (
        <Icon className="h-3.5 w-3.5">
          <SvgPath name={sortDir === "asc" ? "chevronUp" : "chevronDown"} />
        </Icon>
      )}
    </button>
  );

  return (
    <Card padding={false} className="overflow-hidden">
      <CardHeader
        title="Candidate Evaluation"
        description="AI-scored applicants in active pipeline"
        action={
          <div className="flex flex-wrap gap-2">
            <div
              className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700"
              role="group"
              aria-label="Filter by status"
            >
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusFilterChange(s)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    statusFilter === s
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white",
                  )}
                  aria-pressed={statusFilter === s}
                >
                  {s}
                </button>
              ))}
            </div>
            <Button variant="secondary" size="sm">
              <Icon className="h-4 w-4">
                <SvgPath name="filter" />
              </Icon>
              More filters
            </Button>
            <Button variant="primary" size="sm">
              <Icon className="h-4 w-4">
                <SvgPath name="download" />
              </Icon>
              Export
            </Button>
          </div>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <caption className="sr-only">
            Candidate evaluation scores and pipeline status
          </caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/60">
              <th scope="col" className="px-5 py-3">
                <SortBtn label="Candidate" col="name" />
              </th>
              <th scope="col" className="px-5 py-3 font-medium text-slate-500 dark:text-slate-400">
                Role / Dept
              </th>
              <th scope="col" className="px-5 py-3 font-medium text-slate-500 dark:text-slate-400">
                Stage
              </th>
              <th scope="col" className="px-5 py-3">
                <SortBtn label="Score" col="score" />
              </th>
              <th scope="col" className="px-5 py-3 font-medium text-slate-500 dark:text-slate-400">
                Interviewer
              </th>
              <th scope="col" className="px-5 py-3 font-medium text-slate-500 dark:text-slate-400">
                Status
              </th>
              <th scope="col" className="px-5 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                  No candidates match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr
                  key={c.id}
                  className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-semibold text-slate-600 dark:from-slate-800 dark:to-slate-700 dark:text-slate-300"
                        aria-hidden="true"
                      >
                        {initials(c.name)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{c.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {c.id} · {c.updated}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-700 dark:text-slate-300">{c.role}</p>
                    <p className="text-xs text-slate-500">
                      {c.department} · {c.competency}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {c.stage}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <ScoreBar score={c.score} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                    {c.interviewer}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                      aria-label={`Actions for ${c.name}`}
                    >
                      <Icon className="h-5 w-5">
                        <SvgPath name="dots" />
                      </Icon>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Showing {filtered.length} of {candidates.length} in view · 1,284 total
        </p>
        <nav aria-label="Table pagination" className="flex gap-1">
          <Button variant="ghost" size="sm" disabled>
            Previous
          </Button>
          {[1, 2, 3].map((page) => (
            <Button
              key={page}
              variant={page === 1 ? "secondary" : "ghost"}
              size="sm"
              aria-current={page === 1 ? "page" : undefined}
            >
              {page}
            </Button>
          ))}
          <Button variant="ghost" size="sm">
            Next
          </Button>
        </nav>
      </div>
    </Card>
  );
}

function CompetencySection() {
  const avgScore = Math.round(
    COMPETENCIES.reduce((s, c) => s + c.score, 0) / COMPETENCIES.length,
  );
  const aboveBenchmark = COMPETENCIES.filter((c) => c.score >= c.benchmark).length;

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Competency Analytics
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Org-wide assessment vs benchmarks
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{avgScore}</p>
          <p className="text-xs text-slate-500">Avg. score</p>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <CompetencyRadar />
      </div>
      <div className="mt-2 flex justify-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-blue-500/40 ring-1 ring-blue-500" />
          Current
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-slate-300 ring-1 ring-slate-400 dark:bg-slate-600" />
          Benchmark
        </span>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        {aboveBenchmark} of {COMPETENCIES.length} competencies above benchmark
      </p>

      <ul className="mt-5 space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
        {COMPETENCIES.map((comp) => {
          const above = comp.score >= comp.benchmark;
          return (
            <li key={comp.name}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {comp.name}
                </span>
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {comp.score}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      comp.delta >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {comp.delta >= 0 ? "+" : ""}
                    {comp.delta}
                  </span>
                </div>
              </div>
              <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full",
                    above ? "bg-blue-500" : "bg-amber-500",
                  )}
                  style={{ width: `${comp.score}%` }}
                />
                <div
                  className="absolute inset-y-0 w-0.5 bg-slate-500"
                  style={{ left: `${comp.benchmark}%` }}
                  title={`Benchmark: ${comp.benchmark}`}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function PipelineSection({ data }: { data?: PipelineStage[] }) {
  const pipelineData = data ?? PIPELINE;
  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
        Hiring Pipeline
      </h2>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
        Stage conversion · last 30 days
      </p>
      <ul className="mt-5 space-y-3">
        {pipelineData.map((stage, i) => (
          <li key={stage.stage}>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold",
                    i === pipelineData.length - 1
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                  )}
                >
                  {i + 1}
                </span>
                <span className="text-slate-700 dark:text-slate-300">{stage.stage}</span>
              </div>
              <div className="flex items-center gap-3 tabular-nums">
                {stage.conversion && stage.conversion !== "—" && (
                  <span className="text-xs text-slate-400">{stage.conversion}</span>
                )}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {stage.count}
                </span>
              </div>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                style={{ width: `${stage.pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function HiringTrendSection() {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Hiring Velocity
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Applications vs. hires over time
          </p>
        </div>
        <div className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          +18% hires YoY
        </div>
      </div>
      <HiringTrendChart />
    </Card>
  );
}

function UpcomingInterviews() {
  return (
    <Card padding={false}>
      <CardHeader
        title="Upcoming Interviews"
        description="Next 48 hours"
        action={
          <Button variant="ghost" size="sm">
            View calendar
            <Icon className="h-4 w-4">
              <SvgPath name="arrowRight" />
            </Icon>
          </Button>
        }
      />
      <ul className="divide-y divide-slate-200 dark:divide-slate-800">
        {INTERVIEWS.map((iv) => (
          <li key={iv.id} className="flex gap-4 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400">
                <SvgPath name="calendar" />
              </Icon>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900 dark:text-white">{iv.candidate}</p>
              <p className="truncate text-sm text-slate-500">{iv.role}</p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Icon className="h-3.5 w-3.5">
                    <SvgPath name="clock" />
                  </Icon>
                  {iv.time}
                </span>
                <span>{iv.type}</span>
                <span>{iv.interviewer}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ActivityFeed({ data }: { data?: Activity[] }) {
  const activityData = data ?? ACTIVITIES;
  const typeStyles: Record<Activity["type"], string> = {
    hire: "bg-emerald-500",
    interview: "bg-blue-500",
    offer: "bg-indigo-500",
    review: "bg-amber-500",
  };
  return (
    <Card padding={false}>
      <CardHeader title="Recent Activity" description="Team actions across pipeline" />
      <ul className="divide-y divide-slate-200 dark:divide-slate-800">
        {activityData.map((a) => (
          <li key={a.id} className="flex gap-3 px-5 py-3.5">
            <span
              className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", typeStyles[a.type])}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1 text-sm">
              <p className="text-slate-700 dark:text-slate-300">
                <span className="font-medium text-slate-900 dark:text-white">{a.user}</span>{" "}
                {a.action}{" "}
                <span className="font-medium text-slate-900 dark:text-white">{a.target}</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{a.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function OpenRolesPanel() {
  return (
    <Card padding={false}>
      <CardHeader
        title="Priority Open Roles"
        description="Roles needing immediate attention"
        action={
          <Button variant="ghost" size="sm">
            View all 47
          </Button>
        }
      />
      <ul className="divide-y divide-slate-200 dark:divide-slate-800">
        {OPEN_ROLES.map((role) => (
          <li
            key={role.id}
            className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900 dark:text-white">
                {role.title}
              </p>
              <p className="text-xs text-slate-500">
                {role.department} · {role.applicants} applicants · {role.daysOpen}d open
              </p>
            </div>
            <PriorityBadge priority={role.priority} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function DepartmentProgress() {
  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
        Department Hiring
      </h2>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
        Q2 fill rate by department
      </p>
      <ul className="mt-5 space-y-4">
        {DEPARTMENTS.map((dept) => {
          const pct = Math.round((dept.filled / dept.target) * 100);
          return (
            <li key={dept.name}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {dept.name}
                </span>
                <span className="tabular-nums text-slate-500">
                  {dept.filled}/{dept.target}
                  <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                    {pct}%
                  </span>
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={cn(
                    "h-full rounded-full",
                    pct >= 80
                      ? "bg-emerald-500"
                      : pct >= 60
                        ? "bg-blue-500"
                        : "bg-amber-500",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {dept.openRoles} open {dept.openRoles === 1 ? "role" : "roles"}
              </p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════════════════════════════ */

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [liveStats, setLiveStats] = useState<DashboardStats | null>(null);
  const [liveStoreCandidates, setLiveStoreCandidates] = useState<CandidateRecord[]>([]);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);

  const refreshStore = useCallback(() => {
    setLiveStats(getDashboardStats());
    setLiveStoreCandidates(getStoreCandidates());
  }, []);

  useEffect(() => {
    refreshStore();
    setDemoLoaded(hasDemoData());
  }, [refreshStore]);

  const handleLoadDemo = useCallback(() => {
    setDemoLoading(true);
    loadDemoData();
    refreshStore();
    setDemoLoaded(true);
    setDemoLoading(false);
  }, [refreshStore]);

  const handleClearDemo = useCallback(() => {
    import("@/lib/store").then(({ clearDemoData }) => {
      clearDemoData();
      refreshStore();
      setDemoLoaded(false);
    });
  }, [refreshStore]);

  const liveStatCards = useMemo((): StatCard[] => {
    if (!liveStats || liveStats.totalCandidates === 0) return STATS;
    return [
      { id: "candidates", label: "Active Candidates", value: String(liveStats.activePipeline), change: `${liveStats.totalCandidates} total`, trend: "up" as Trend, sub: "from persistent store", sparkline: [62, 68, 71, 69, 74, 78, 82, 85, 88, 91, 94, 100] },
      { id: "positions", label: "Open Positions", value: String(liveStats.openReqs), change: `${liveStats.activeReqs} active reqs`, trend: "up" as Trend, sub: `${liveStats.departmentCounts.length} departments`, sparkline: [40, 42, 41, 44, 43, 45, 46, 44, 47, 46, 47, 47] },
      { id: "time-to-hire", label: "Avg. CV Score", value: liveStats.avgScore ? `${liveStats.avgScore}` : "—", change: "avg analyzed", trend: "neutral" as Trend, sub: "from CV analyses", sparkline: [60, 65, 62, 68, 72, 70, 74, 78, 75, 80, 82, 85] },
      { id: "acceptance", label: "Offer Acceptance", value: liveStats.offerAcceptRate ? `${liveStats.offerAcceptRate}%` : "—", change: `${liveStats.stageBreakdown.hired} hired`, trend: "up" as Trend, sub: "offered → hired", sparkline: [72, 74, 75, 76, 78, 79, 80, 82, 83, 84, 86, 87] },
    ];
  }, [liveStats]);

  const liveCandidateTable = useMemo((): Candidate[] => {
    if (liveStoreCandidates.length === 0) return CANDIDATES;
    return liveStoreCandidates.slice(0, 8).map((c) => {
      const score = c.cvAnalysis?.overallScore ?? 0;
      const status: CandidateStatus = score >= 80 ? "Strong" : score >= 60 ? "Review" : "Hold";
      return {
        id: c.id, name: c.name, email: c.email, role: c.position,
        department: c.department, stage: STORE_STAGE_LABELS[c.stage],
        score, competency: c.cvAnalysis?.frameworkLabel ?? "—",
        status, updated: timeAgoShort(c.updatedAt), interviewer: "—",
      };
    });
  }, [liveStoreCandidates]);

  const livePipeline = useMemo((): PipelineStage[] => {
    if (!liveStats || liveStats.totalCandidates === 0) return PIPELINE;
    const total = Math.max(1, liveStats.stageBreakdown.applied + liveStats.stageBreakdown.screened + liveStats.stageBreakdown.interviewed + liveStats.stageBreakdown.offered + liveStats.stageBreakdown.hired);
    return STORE_PIPELINE_STAGES.map((s, i) => {
      const count = liveStats.stageBreakdown[s];
      const pct = Math.round((count / total) * 100);
      const prev = i > 0 ? liveStats.stageBreakdown[STORE_PIPELINE_STAGES[i - 1]] : count;
      const conversion = i === 0 ? "—" : prev > 0 ? `${Math.round((count / prev) * 100)}%` : "0%";
      return { stage: STORE_STAGE_LABELS[s], count, pct: Math.max(pct, count > 0 ? 3 : 0), conversion };
    });
  }, [liveStats]);

  const liveActivities = useMemo((): Activity[] => {
    if (!liveStats || liveStats.recentActivity.length === 0) return ACTIVITIES;
    return liveStats.recentActivity.slice(0, 5).map((a) => ({
      id: a.id, action: a.action, target: a.target, user: a.user,
      time: timeAgoShort(a.time),
      type: (a.type === "analysis" || a.type === "move" || a.type === "create" ? "review" : a.type) as Activity["type"],
    }));
  }, [liveStats]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("desc");
      return key;
    });
  }, []);

  return (
    <AppShell
      activeNavId="dashboard"
      title="Dashboard"
      subtitle="Hiring intelligence overview"
      headerActions={
        <div className="relative hidden w-full max-w-xs sm:block">
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
            <SvgPath name="search" />
          </Icon>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidates, roles, IDs..."
            aria-label="Global search"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
      }
    >
      <StatCards stats={liveStatCards} />

      {/* Welcome / demo banner */}
      {liveStats && liveStats.totalCandidates === 0 && (
        <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/60 p-5 dark:border-blue-500/20 dark:bg-blue-500/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/20">
                <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400"><SvgPath name="sparkles" /></Icon>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Welcome to Hire Intelligence</p>
                <p className="mt-0.5 text-sm text-slate-500">Load sample candidates to explore the platform, or start by analyzing your first CV.</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" size="sm" onClick={() => router.push("/cv-analyzer")}>
                <Icon className="h-4 w-4"><SvgPath name="scan" /></Icon>
                Analyze CV
              </Button>
              <Button variant="primary" size="sm" onClick={handleLoadDemo} disabled={demoLoading}>
                <Icon className="h-4 w-4"><SvgPath name="sparkles" /></Icon>
                {demoLoading ? "Loading…" : "Load Demo Data"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Demo data badge + clear button */}
      {demoLoaded && liveStats && liveStats.totalCandidates > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 dark:border-emerald-500/20 dark:bg-emerald-500/5">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400"><SvgPath name="check" /></Icon>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Demo data loaded — {liveStats.totalCandidates} candidates, {liveStats.openReqs} open roles
            </p>
          </div>
          <button
            onClick={handleClearDemo}
            className="text-xs text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            Clear demo data
          </button>
        </div>
      )}

      {/* Row: trend + departments */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HiringTrendSection />
        </div>
        <DepartmentProgress />
      </div>

      {/* Row: table + right rail */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <CandidateTable
            candidates={liveCandidateTable}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
        </div>
        <div className="space-y-6">
          <CompetencySection />
          <PipelineSection data={livePipeline} />
        </div>
      </div>

      {/* Row: interviews, activity, roles */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <UpcomingInterviews />
        <ActivityFeed data={liveActivities} />
        <OpenRolesPanel />
      </div>
    </AppShell>
  );
}

"use client";

import {
  CitationNote,
  CompetencyReportTable,
  EvidenceValidityPanel,
} from "@/components/competency-framework-ui";
import {
  buildReportCompetencyRows,
  CITATIONS,
} from "@/lib/competency-framework";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   Types & mock data
═══════════════════════════════════════════════════════════════════════════ */

type Theme = "light" | "dark" | "system";
type Recommendation = "Strong Hire" | "Hire" | "Review" | "Reject";

interface NavItem {
  id: string;
  label: string;
  href: string;
  badge?: number;
}

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

const NAV_MAIN: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/" },
  { id: "candidates", label: "Candidates", href: "/", badge: 1284 },
  { id: "roles", label: "Open Roles", href: "/", badge: 47 },
  { id: "interviews", label: "Interviews", href: "/", badge: 18 },
  { id: "analytics", label: "Analytics", href: "/" },
  { id: "reports", label: "Reports", href: "/" },
];

const NAV_TOOLS: NavItem[] = [
  { id: "cv-analyzer", label: "CV Analyzer", href: "/cv-analyzer" },
  { id: "interview-workspace", label: "Interview Workspace", href: "/interview" },
  { id: "hiring-report", label: "Hiring Report", href: "/report" },
  { id: "integrations", label: "Integrations", href: "/" },
  { id: "settings", label: "Settings", href: "/" },
];

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
   Icons & utilities
═══════════════════════════════════════════════════════════════════════════ */

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function Icon({
  children,
  className = "h-5 w-5",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const PATHS = {
  dashboard:
    "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
  users:
    "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  briefcase:
    "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.763.183-1.555.349-2.373.49m-11.31 0a48.11 48.11 0 01-2.373-.49 2.25 2.25 0 01-1.837-2.175V6.75a2.18 2.18 0 00.75-1.661m0 0A48.118 48.118 0 0012 3c2.356 0 4.692.284 6.978.832M12 3v1.5m0 0V3m0 1.5h6.75",
  calendar:
    "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
  chart:
    "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  document:
    "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75M9.75 21v-7.875a3.375 3.375 0 013.375-3.375h3.375M9.75 21H5.625a1.125 1.125 0 01-1.125-1.125v-9.75a1.125 1.125 0 011.125-1.125h9.75",
  report:
    "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75v-.75V4.875C9.75 4.256 10.306 3.75 11 3.75H15M9.75 15.75h4.5M9.75 12h4.5m-6-3h1.5m-1.5 3h1.5m-1.5 3h1.5",
  scan:
    "M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5M16.5 20.25H18A2.25 2.25 0 0120.25 18v-1.5M7.5 20.25H6A2.25 2.25 0 003.75 18v-1.5M9 12.75h6",
  workspace:
    "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25",
  cog: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z",
  plug: "M13.5 6.75H12v4.5h1.5m-1.5-9h1.5m-3.75 3h15a2.25 2.25 0 012.25 2.25v6.75A2.25 2.25 0 0118 18.75H6A2.25 2.25 0 013.75 16.5v-6.75A2.25 2.25 0 016 7.5h1.5m9 0V6a2.25 2.25 0 00-2.25-2.25H9.75A2.25 2.25 0 007.5 6v1.5",
  menu: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5",
  close: "M6 18L18 6M6 6l12 12",
  chevron: "M8.25 4.5l7.5 7.5-7.5 7.5",
  chevronDown: "M19.5 8.25l-7.5 7.5-7.5-7.5",
  sun: "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z",
  moon: "M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z",
  bell: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
  check:
    "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  xmark: "M6 18L18 6M6 6l12 12",
  calendarDays:
    "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-3h3.75m-3.75 0h3.75m-3.75 0H9",
  download:
    "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3",
  envelope:
    "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
  arrowTrend:
    "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941",
} as const;

const NAV_ICON_MAP: Record<string, keyof typeof PATHS> = {
  dashboard: "dashboard",
  candidates: "users",
  roles: "briefcase",
  interviews: "calendar",
  analytics: "chart",
  reports: "document",
  "cv-analyzer": "scan",
  "interview-workspace": "workspace",
  "hiring-report": "report",
  integrations: "plug",
  settings: "cog",
};

function SvgPath({ name }: { name: keyof typeof PATHS }) {
  return (
    <path strokeLinecap="round" strokeLinejoin="round" d={PATHS[name]} />
  );
}

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

/* ═══════════════════════════════════════════════════════════════════════════
   UI primitives
═══════════════════════════════════════════════════════════════════════════ */

function Card({
  children,
  className,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
        padding && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Button({
  children,
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:pointer-events-none disabled:opacity-50";
  const sizes = {
    sm: "rounded-lg px-2.5 py-1 text-xs",
    md: "rounded-lg px-3 py-1.5 text-sm",
    lg: "rounded-lg px-4 py-2 text-sm",
  };
  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
    ghost:
      "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
    danger:
      "border border-red-200 bg-white text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-500/10",
  };
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
    >
      {children}
    </label>
  );
}

const selectClass =
  "w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

/* ═══════════════════════════════════════════════════════════════════════════
   Layout
═══════════════════════════════════════════════════════════════════════════ */

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const renderNav = (items: NavItem[]) =>
    items.map((item) => {
      const active = item.id === "hiring-report";
      const iconKey = NAV_ICON_MAP[item.id] ?? "dashboard";
      return (
        <Link
          key={item.id}
          href={item.href}
          onClick={onClose}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            active
              ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
          )}
          aria-current={active ? "page" : undefined}
        >
          <Icon className="h-5 w-5 shrink-0">
            <SvgPath name={iconKey} />
          </Icon>
          <span className="truncate">{item.label}</span>
        </Link>
      );
    });

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-5 dark:border-slate-800">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
          >
            <span className="text-sm font-bold tracking-tight">HI</span>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              Hire Intelligence
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              Enterprise Platform
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
            onClick={onClose}
            aria-label="Close menu"
          >
            <Icon className="h-5 w-5">
              <SvgPath name="close" />
            </Icon>
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Main
            </p>
            <div className="space-y-0.5">{renderNav(NAV_MAIN)}</div>
          </div>
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Tools
            </p>
            <div className="space-y-0.5">{renderNav(NAV_TOOLS)}</div>
          </div>
        </nav>

        <div className="shrink-0 border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400">
                <SvgPath name="report" />
              </Icon>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Final Decision
              </p>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              Hiring Report
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Consolidated CV + interview intelligence for offer decisions.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

function TopBar({
  isDark,
  onThemeToggle,
  onMenuOpen,
}: {
  isDark: boolean;
  onThemeToggle: () => void;
  onMenuOpen: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:gap-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900/90">
      <button
        type="button"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
        onClick={onMenuOpen}
        aria-label="Open navigation menu"
      >
        <Icon className="h-5 w-5">
          <SvgPath name="menu" />
        </Icon>
      </button>
      <div className="hidden min-w-0 sm:block">
        <h1 className="truncate text-lg font-semibold text-slate-900 dark:text-white">
          Hiring Report
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Final decision intelligence
        </p>
      </div>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={onThemeToggle}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
          <Icon className="h-5 w-5">
            <SvgPath name={isDark ? "sun" : "moon"} />
          </Icon>
        </button>
        <button
          type="button"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Notifications"
        >
          <Icon className="h-5 w-5">
            <SvgPath name="bell" />
          </Icon>
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
            3
          </span>
        </button>
        <div className="hidden h-8 w-px bg-slate-200 md:block dark:bg-slate-700" />
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-100 md:pr-3 dark:hover:bg-slate-800"
          aria-label="User menu"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white">
            AK
          </div>
          <div className="hidden text-left lg:block">
            <p className="text-sm font-medium text-slate-900 dark:text-white">Alex Kim</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Talent Lead</p>
          </div>
          <Icon className="hidden h-4 w-4 text-slate-400 lg:block">
            <SvgPath name="chevronDown" />
          </Icon>
        </button>
      </div>
    </header>
  );
}

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
                {report.position} · {report.department}
              </p>
              <p className="mt-2 font-mono text-xs text-slate-400">
                {report.id} · {report.reportDate} · {report.candidateId}
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
        Final = 40% CV + 60% structured interview · Ulrich (6) + SKKNI (5) weighted framework
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
          Ulrich HR model + SKKNI No. 149/2020 — CV vs structured interview
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
            Approve & Send Offer
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

export default function ReportPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");
  const [isDark, setIsDark] = useState(false);
  const [selectedId, setSelectedId] = useState(CANDIDATE_REPORTS[0].candidateId);

  const report = useMemo(
    () => CANDIDATE_REPORTS.find((r) => r.candidateId === selectedId) ?? CANDIDATE_REPORTS[0],
    [selectedId],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const resolve = () => {
      const dark = theme === "dark" || (theme === "system" && mq.matches);
      setIsDark(dark);
      document.documentElement.classList.toggle("dark", dark);
    };
    resolve();
    const onChange = () => {
      if (theme === "system") resolve();
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const cycleTheme = useCallback(() => {
    setTheme((t) => (t === "light" ? "dark" : t === "dark" ? "system" : "light"));
  }, []);

  return (
    <div
      className={cn(
        "flex min-h-screen bg-slate-50 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100",
        isDark && "dark",
      )}
      data-theme={theme}
    >
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          isDark={isDark}
          onThemeToggle={cycleTheme}
          onMenuOpen={() => setSidebarOpen(true)}
        />

        <main id="main-content" className="flex-1 overflow-y-auto">
          <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <Link
                href="/"
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Home
              </Link>
              <Icon className="h-3.5 w-3.5 text-slate-300">
                <SvgPath name="chevron" />
              </Icon>
              <span className="font-medium text-slate-900 dark:text-white">Hiring Report</span>
              <span className="ml-auto hidden rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 sm:inline dark:bg-blue-500/10 dark:text-blue-400">
                Final decision document
              </span>
            </nav>
          </div>

          <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="sm:hidden">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Hiring Report
                </h1>
                <p className="text-sm text-slate-500">Final decision intelligence</p>
              </div>
              <div className="w-full sm:max-w-sm">
                <Label htmlFor="candidate-select">Select candidate</Label>
                <select
                  id="candidate-select"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className={selectClass}
                >
                  {CANDIDATE_REPORTS.map((r) => (
                    <option key={r.candidateId} value={r.candidateId}>
                      {r.name} — {r.position} ({r.recommendation})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <ReportHeader report={report} />
            <EvidenceValidityPanel />
            <ScoreSummary report={report} />
            <CompetencyTable report={report} />
            <KeyEvidence report={report} />
            <PanelDecision report={report} />
            <ActionBar report={report} />
          </div>

          <footer className="border-t border-slate-200 px-6 py-4 dark:border-slate-800">
            <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:text-slate-400">
              <p>© 2026 Hire Intelligence · Enterprise Hiring Platform</p>
              <p className="tabular-nums">v2.4.1 · SOC 2 Type II · GDPR compliant</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

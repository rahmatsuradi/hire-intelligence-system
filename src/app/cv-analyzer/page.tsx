"use client";

import {
  CitationNote,
  CompetencyScoreList,
  EvidenceValidityPanel,
} from "@/components/competency-framework-ui";
import {
  CITATIONS,
  type CompetencyScore,
} from "@/lib/competency-framework";
import type { AiAnalysisResult, CompetencyCluster } from "@/lib/cv-analyzer-ai";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Theme = "light" | "dark" | "system";
type Recommendation = "Strong Hire" | "Hire" | "Review" | "Reject";
type RiskSeverity = "high" | "medium" | "low";

interface NavItem {
  id: string;
  label: string;
  href: string;
  badge?: number;
}

interface RiskFlag {
  id: string;
  label: string;
  detail: string;
  severity: RiskSeverity;
}

interface AnalysisReport {
  reportId: string;
  generatedAt: string;
  confidence: number;
  overallScore: number;
  recommendation: Recommendation;
  summary: string;
  competencies: CompetencyScore[];
  risks: RiskFlag[];
  questions: { id: number; category: string; question: string; rationale: string }[];
  recommendationDetail: string;
  matchScore: number;
  processingMs: number;
  processingNote?: string;
  frameworkLabel: string;
  cluster: CompetencyCluster;
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

const DEPARTMENTS = [
  "Engineering", "Product", "Data", "Design", "Sales",
  "Finance", "Security", "Operations", "HR", "Legal",
];

// Badge warna per cluster
const CLUSTER_BADGE: Record<CompetencyCluster, { label: string; className: string }> = {
  hr: { label: "Ulrich + SKKNI", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
  tech: { label: "SFIA v8", className: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300" },
  business: { label: "Lominger / Korn Ferry", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  finance: { label: "CGMA / CIMA", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
};

function buildReportFromAi(ai: AiAnalysisResult, startMs: number): Omit<AnalysisReport, "reportId" | "generatedAt"> {
  return {
    confidence: ai.confidence,
    overallScore: ai.overallScore,
    recommendation: ai.recommendation,
    matchScore: ai.matchScore,
    processingMs: Date.now() - startMs,
    summary: ai.summary,
    recommendationDetail: ai.recommendationDetail,
    processingNote: ai.processingNote,
    frameworkLabel: ai.frameworkLabel ?? "Multi-Framework Competency",
    cluster: ai.cluster ?? "business",
    competencies: ai.competencies.map((c) => ({
      id: c.id, name: c.name, pillar: c.pillar,
      score: c.score, benchmark: c.benchmark, insight: c.insight, rubric: [],
    })),
    risks: ai.risks.map((r) => ({ id: r.id, label: r.label, detail: r.detail, severity: r.severity })),
    questions: ai.questions.map((q) => ({ id: q.id, category: q.category, question: q.question, rationale: q.rationale })),
  };
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function Icon({ children, className = "h-5 w-5" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      {children}
    </svg>
  );
}

const PATHS = {
  dashboard: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
  users: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  briefcase: "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.763.183-1.555.349-2.373.49m-11.31 0a48.11 48.11 0 01-2.373-.49 2.25 2.25 0 01-1.837-2.175V6.75a2.18 2.18 0 00.75-1.661m0 0A48.118 48.118 0 0112 3c2.356 0 4.692.284 6.978.832M12 3v1.5m0 0V3m0 1.5h6.75",
  calendar: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
  chart: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  document: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75M9.75 21v-7.875a3.375 3.375 0 013.375-3.375h3.375M9.75 21H5.625a1.125 1.125 0 01-1.125-1.125v-9.75a1.125 1.125 0 011.125-1.125h9.75",
  scan: "M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5M16.5 20.25H18A2.25 2.25 0 0020.25 18v-1.5M7.5 20.25H6A2.25 2.25 0 003.75 18v-1.5M9 12.75h6",
  workspace: "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25",
  report: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75v-.75V4.875C9.75 4.256 10.306 3.75 11 3.75H15M9.75 15.75h4.5M9.75 12h4.5m-6-3h1.5m-1.5 3h1.5m-1.5 3h1.5",
  cog: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z",
  plug: "M13.5 6.75H12v4.5h1.5m-1.5-9h1.5m-3.75 3h15a2.25 2.25 0 012.25 2.25v6.75A2.25 2.25 0 0118 18.75H6A2.25 2.25 0 013.75 16.5v-6.75A2.25 2.25 0 016 7.5h1.5m9 0V6a2.25 2.25 0 00-2.25-2.25H9.75A2.25 2.25 0 007.5 6v1.5",
  search: "m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
  bell: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
  menu: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5",
  close: "M6 18L18 6M6 6l12 12",
  chevron: "M8.25 4.5l7.5 7.5-7.5 7.5",
  chevronDown: "M19.5 8.25l-7.5 7.5-7.5-7.5",
  sun: "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z",
  moon: "M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z",
  upload: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5",
  documentPdf: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75M9.75 21v-7.875a3.375 3.375 0 013.375-3.375h3.375M9.75 21H5.625a1.125 1.125 0 01-1.125-1.125v-9.75a1.125 1.125 0 011.125-1.125h9.75M15 10.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
  warning: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
  sparkles: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z",
  check: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  download: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3",
} as const;

const NAV_ICON_MAP: Record<string, keyof typeof PATHS> = {
  dashboard: "dashboard", candidates: "users", roles: "briefcase", interviews: "calendar",
  analytics: "chart", reports: "document", "cv-analyzer": "scan",
  "interview-workspace": "workspace", "hiring-report": "report", integrations: "plug", settings: "cog",
};

function SvgPath({ name }: { name: keyof typeof PATHS }) {
  return <path strokeLinecap="round" strokeLinejoin="round" d={PATHS[name]} />;
}

function recommendationStyles(rec: Recommendation) {
  const map: Record<Recommendation, { card: string; badge: string; ring: string }> = {
    "Strong Hire": { card: "from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-500/30", badge: "bg-emerald-600 text-white", ring: "ring-emerald-500/30" },
    Hire: { card: "from-blue-500/10 to-indigo-500/5 border-blue-200 dark:border-blue-500/30", badge: "bg-blue-600 text-white", ring: "ring-blue-500/30" },
    Review: { card: "from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-500/30", badge: "bg-amber-600 text-white", ring: "ring-amber-500/30" },
    Reject: { card: "from-red-500/10 to-red-600/5 border-red-200 dark:border-red-500/30", badge: "bg-red-600 text-white", ring: "ring-red-500/30" },
  };
  return map[rec];
}

function riskSeverityStyles(severity: RiskSeverity) {
  const map = {
    high: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30",
    medium: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
    low: "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/30",
  };
  return map[severity];
}

function Card({ children, className, padding = true }: { children: React.ReactNode; className?: string; padding?: boolean }) {
  return (
    <div className={cn("rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900", padding && "p-5", className)}>
      {children}
    </div>
  );
}

function Button({ children, variant = "secondary", size = "md", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost"; size?: "sm" | "md" | "lg" }) {
  const base = "inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:pointer-events-none disabled:opacity-50";
  const sizes = { sm: "rounded-lg px-2.5 py-1 text-xs", md: "rounded-lg px-3 py-1.5 text-sm", lg: "rounded-lg px-5 py-2.5 text-sm" };
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
    ghost: "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
  };
  return <button className={cn(base, sizes[size], variants[variant], className)} {...props}>{children}</button>;
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{children}</label>;
}

const inputClass = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500";

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const renderNav = (items: NavItem[]) =>
    items.map((item) => {
      const active = item.id === "cv-analyzer";
      const iconKey = NAV_ICON_MAP[item.id] ?? "dashboard";
      return (
        <Link key={item.id} href={item.href} onClick={onClose}
          className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            active ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200")}
          aria-current={active ? "page" : undefined}>
          <Icon className="h-5 w-5 shrink-0"><SvgPath name={iconKey} /></Icon>
          <span className="truncate">{item.label}</span>
          {item.badge !== undefined && (
            <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
              active ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400")}>
              {item.badge > 999 ? `${(item.badge / 1000).toFixed(1)}k` : item.badge}
            </span>
          )}
        </Link>
      );
    });

  return (
    <>
      {open && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")} aria-label="Main navigation">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-5 dark:border-slate-800">
          <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <span className="text-sm font-bold tracking-tight">HI</span>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">Hire Intelligence</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">Enterprise Platform</p>
          </div>
          <button type="button" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800" onClick={onClose} aria-label="Close menu">
            <Icon className="h-5 w-5"><SvgPath name="close" /></Icon>
          </button>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Main</p>
            <div className="space-y-0.5">{renderNav(NAV_MAIN)}</div>
          </div>
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tools</p>
            <div className="space-y-0.5">{renderNav(NAV_TOOLS)}</div>
          </div>
        </nav>
        <div className="shrink-0 border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400"><SvgPath name="sparkles" /></Icon>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">AI CV Analysis</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">Powered by Groq · Llama 3.3</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Multi-framework: Ulrich, SFIA, Lominger, CGMA — auto-selected by role.</p>
          </div>
        </div>
      </aside>
    </>
  );
}

function TopBar({ isDark, onThemeToggle, onMenuOpen }: { isDark: boolean; onThemeToggle: () => void; onMenuOpen: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:gap-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900/90">
      <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800" onClick={onMenuOpen}>
        <Icon className="h-5 w-5"><SvgPath name="menu" /></Icon>
      </button>
      <div className="hidden min-w-0 sm:block">
        <h1 className="truncate text-lg font-semibold text-slate-900 dark:text-white">CV Analyzer</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Multi-framework AI analysis · Groq · Llama 3.3</p>
      </div>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button type="button" onClick={onThemeToggle} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          <Icon className="h-5 w-5"><SvgPath name={isDark ? "sun" : "moon"} /></Icon>
        </button>
        <button type="button" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          <Icon className="h-5 w-5"><SvgPath name="bell" /></Icon>
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">3</span>
        </button>
        <div className="hidden h-8 w-px bg-slate-200 md:block dark:bg-slate-700" />
        <button type="button" className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-100 md:pr-3 dark:hover:bg-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white">AK</div>
          <div className="hidden text-left lg:block">
            <p className="text-sm font-medium text-slate-900 dark:text-white">Alex Kim</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Talent Lead</p>
          </div>
        </button>
      </div>
    </header>
  );
}

function PdfDropzone({ file, dragActive, onFile, onDragActive }: { file: File | null; dragActive: boolean; onFile: (f: File | null) => void; onDragActive: (v: boolean) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const f = files[0];
    if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) onFile(f);
  };
  return (
    <div role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
      onDragEnter={(e) => { e.preventDefault(); onDragActive(true); }}
      onDragOver={(e) => { e.preventDefault(); onDragActive(true); }}
      onDragLeave={(e) => { e.preventDefault(); onDragActive(false); }}
      onDrop={(e) => { e.preventDefault(); onDragActive(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      className={cn("relative cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
        dragActive ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10"
          : file ? "border-emerald-300 bg-emerald-50/30 dark:border-emerald-500/40 dark:bg-emerald-500/5"
            : "border-slate-300 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/30 dark:border-slate-600 dark:bg-slate-800/30 dark:hover:border-blue-500/50")}
      aria-label="Upload PDF resume">
      <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="sr-only" onChange={(e) => handleFiles(e.target.files)} />
      {file ? (
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
            <Icon className="h-7 w-7 text-emerald-600 dark:text-emerald-400"><SvgPath name="documentPdf" /></Icon>
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
            <p className="mt-0.5 text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB · PDF ready</p>
          </div>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onFile(null); if (inputRef.current) inputRef.current.value = ""; }}>Remove file</Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <Icon className="h-7 w-7 text-slate-400"><SvgPath name="upload" /></Icon>
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Drop PDF resume here</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">or click to browse · max 10 MB</p>
          </div>
          <Button variant="secondary" size="sm" type="button">Select PDF file</Button>
        </div>
      )}
    </div>
  );
}

function AnalysisReportPanel({ report, candidateName, targetPosition, department, onExportPdf, onScheduleInterview }: {
  report: AnalysisReport; candidateName: string; targetPosition: string; department: string; onExportPdf?: () => void; onScheduleInterview?: () => void;
}) {
  const recStyle = recommendationStyles(report.recommendation);
  const clusterBadge = CLUSTER_BADGE[report.cluster];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/50 px-5 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-blue-500/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <Icon className="h-6 w-6"><SvgPath name="sparkles" /></Icon>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">AI Analysis Report</h2>
                  {/* Badge framework — dinamis berdasarkan cluster */}
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", clusterBadge.className)}>
                    {clusterBadge.label}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    Groq · Llama 3.3
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">{report.frameworkLabel}</p>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{candidateName} · {targetPosition} · {department}</p>
                <p className="mt-1 font-mono text-xs text-slate-400">{report.reportId} · {report.generatedAt}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 sm:justify-end">
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{report.overallScore}</p>
                <p className="text-xs text-slate-500">Overall</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400">{report.matchScore}%</p>
                <p className="text-xs text-slate-500">Role match</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{report.confidence}%</p>
                <p className="text-xs text-slate-500">Confidence</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">Executive summary: </span>
            {report.summary}
          </p>
          {report.processingNote && (
            <p className="mt-2 text-xs text-slate-400 italic">ℹ {report.processingNote}</p>
          )}
          <p className="mt-2 text-xs text-slate-400">
            Processed in {(report.processingMs / 1000).toFixed(1)}s · Groq · Llama 3.3 70B · No PII stored
          </p>
        </div>
      </Card>

      <EvidenceValidityPanel />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Competency Assessment</h3>
          <p className="mt-0.5 text-sm text-slate-500">{report.frameworkLabel} · scored from CV evidence</p>
          <div className="mt-5"><CompetencyScoreList scores={report.competencies} /></div>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-amber-500"><SvgPath name="warning" /></Icon>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Risk Flags</h3>
              <p className="mt-0.5 text-sm text-slate-500">{report.risks.length} items flagged for validation</p>
            </div>
          </div>
          <ul className="mt-5 space-y-3">
            {report.risks.map((risk) => (
              <li key={risk.id} className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium text-slate-900 dark:text-white">{risk.label}</p>
                  <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset", riskSeverityStyles(risk.severity))}>
                    {risk.severity}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{risk.detail}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {report.questions.length > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Structured Interview Questions</h3>
              <p className="mt-0.5 text-sm text-slate-500">Generated from CV gaps · STAR format · r ≈ 0.51</p>
            </div>
            <CitationNote className="mt-2 px-0">{CITATIONS.schmidtHunter}</CitationNote>
          </div>
          <ol className="mt-5 space-y-4">
            {report.questions.map((q) => (
              <li key={q.id} className="flex gap-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">{q.id}</span>
                <div className="min-w-0 flex-1">
                  <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">{q.category}</span>
                  <p className="mt-2 font-medium text-slate-900 dark:text-white">{q.question}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-600 dark:text-slate-300">Rationale: </span>{q.rationale}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className={cn("rounded-xl border bg-gradient-to-br p-6 ring-1 ring-inset", recStyle.card, recStyle.ring)}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("flex h-14 w-14 items-center justify-center rounded-xl shadow-sm", recStyle.badge)}>
              <Icon className="h-8 w-8"><SvgPath name="check" /></Icon>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Final recommendation</p>
              <p className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-white">{report.recommendation}</p>
            </div>
          </div>
          <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onExportPdf}>
            <Icon className="h-4 w-4"><SvgPath name="download" /></Icon>
              Export PDF
              </Button>
              <Button variant="primary" size="sm" onClick={onScheduleInterview}>Schedule interview</Button>
            </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{report.recommendationDetail}</p>
      </div>
    </div>
  );
}

export default function CvAnalyzerPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");
  const [isDark, setIsDark] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [targetPosition, setTargetPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const resolve = () => {
      const dark = theme === "dark" || (theme === "system" && mq.matches);
      setIsDark(dark);
      document.documentElement.classList.toggle("dark", dark);
    };
    resolve();
    const onChange = () => { if (theme === "system") resolve(); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const cycleTheme = useCallback(() => {
    setTheme((t) => (t === "light" ? "dark" : t === "dark" ? "system" : "light"));
  }, []);

  const canAnalyze = file !== null && candidateName.trim() !== "" && targetPosition.trim() !== "" && department !== "";

  const handleExportPdf = useCallback(() => {
    if (!report) return;

    const competencyRows = report.competencies.map(c => {
      const gap = c.score >= c.benchmark ? "strength" : c.score >= c.benchmark - 10 ? "meets" : "develop";
      const gapLabel = gap === "strength" ? "✅ Strength" : gap === "meets" ? "≈ Meets" : "⚠ Develop";
      const pct = Math.min(100, c.score);
      return `<tr>
        <td><strong>${c.name}</strong><br/><span style="font-size:8pt;color:#64748b">${c.pillar}</span></td>
        <td style="text-align:center"><strong>${c.score}</strong></td>
        <td style="text-align:center">${c.benchmark}</td>
        <td>
          <div style="height:6px;border-radius:3px;background:#e2e8f0;width:100%;">
            <div style="height:100%;border-radius:3px;width:${pct}%;background:${gap === 'strength' ? '#059669' : gap === 'meets' ? '#2563eb' : '#f59e0b'};"></div>
          </div>
        </td>
        <td><span style="font-size:8pt;padding:2px 6px;border-radius:4px;font-weight:500;background:${gap === 'strength' ? '#dcfce7' : gap === 'meets' ? '#dbeafe' : '#fef3c7'};color:${gap === 'strength' ? '#166534' : gap === 'meets' ? '#1e40af' : '#92400e'}">${gapLabel}</span></td>
        <td style="font-size:8.5pt;color:#475569;">${c.insight || "-"}</td>
      </tr>`;
    }).join("");

    const riskRows = report.risks.map(r => {
      const bg = r.severity === "high" ? "#fef2f2" : r.severity === "medium" ? "#fffbeb" : "#f8fafc";
      const border = r.severity === "high" ? "#ef4444" : r.severity === "medium" ? "#f59e0b" : "#94a3b8";
      const badgeBg = r.severity === "high" ? "#fca5a5" : r.severity === "medium" ? "#fcd34d" : "#cbd5e1";
      const badgeColor = r.severity === "high" ? "#7f1d1d" : r.severity === "medium" ? "#78350f" : "#334155";
      return `<div style="padding:10px 12px;border-radius:6px;margin-bottom:8px;display:flex;align-items:flex-start;gap:10px;background:${bg};border-left:3px solid ${border};">
        <div style="flex:1">
          <strong style="font-size:10pt">${r.label}</strong>
          <p style="font-size:9pt;color:#475569;margin-top:3px">${r.detail}</p>
        </div>
        <span style="font-size:7pt;padding:2px 6px;border-radius:4px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;background:${badgeBg};color:${badgeColor};flex-shrink:0">${r.severity}</span>
      </div>`;
    }).join("");

    const questionRows = report.questions.map(q =>
      `<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #f1f5f9">
        <div style="width:28px;height:28px;border-radius:50%;background:#dbeafe;color:#1d4ed8;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:10pt;flex-shrink:0">${q.id}</div>
        <div>
          <span style="background:#f1f5f9;color:#475569;font-size:7.5pt;padding:2px 6px;border-radius:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">${q.category}</span>
          <p style="font-size:10pt;font-weight:500;margin:6px 0 4px;line-height:1.4">${q.question}</p>
          <p style="font-size:8.5pt;color:#64748b"><strong>Rationale:</strong> ${q.rationale}</p>
        </div>
      </div>`
    ).join("");

    const recBg = report.recommendation === "Strong Hire" ? "#f0fdf4" : report.recommendation === "Hire" ? "#eff6ff" : report.recommendation === "Review" ? "#fffbeb" : "#fef2f2";
    const recBorder = report.recommendation === "Strong Hire" ? "#86efac" : report.recommendation === "Hire" ? "#93c5fd" : report.recommendation === "Review" ? "#fcd34d" : "#fca5a5";

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>CV Analysis - ${candidateName} - ${report.reportId}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',system-ui,sans-serif;font-size:11pt;color:#0f172a;background:white;padding:24px}
    @page{margin:18mm;size:A4}
    table{width:100%;border-collapse:collapse;font-size:9.5pt}
    th{background:#f1f5f9;text-align:left;padding:8px 10px;font-weight:600;font-size:8pt;text-transform:uppercase;letter-spacing:0.04em;color:#64748b}
    td{padding:8px 10px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
    tr:last-child td{border-bottom:none}
    @media print{button{display:none}}
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:2px solid #2563eb;margin-bottom:20px">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:36px;height:36px;background:linear-gradient(135deg,#2563eb,#4f46e5);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12pt">HI</div>
      <div>
        <h1 style="font-size:14pt;font-weight:700">Hire Intelligence</h1>
        <p style="font-size:9pt;color:#64748b">AI-Powered CV Analysis Report</p>
      </div>
    </div>
    <div style="text-align:right">
      <p style="font-family:monospace;font-size:9pt;color:#64748b">${report.reportId}</p>
      <p style="font-size:9pt;color:#64748b">${report.generatedAt}</p>
      <span style="background:#eff6ff;color:#1d4ed8;font-size:8pt;padding:3px 8px;border-radius:12px;font-weight:500">${report.frameworkLabel}</span>
    </div>
  </div>

  <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:20px;border:1px solid #e2e8f0">
    <h2 style="font-size:12pt;font-weight:600;margin-bottom:10px">Candidate Profile</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
      <div><p style="font-size:8pt;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Candidate</p><p style="font-size:10pt;font-weight:500;margin-top:2px">${candidateName}</p></div>
      <div><p style="font-size:8pt;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Target Position</p><p style="font-size:10pt;font-weight:500;margin-top:2px">${targetPosition}</p></div>
      <div><p style="font-size:8pt;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Department</p><p style="font-size:10pt;font-weight:500;margin-top:2px">${department}</p></div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">
    <div style="text-align:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px">
      <p style="font-size:22pt;font-weight:700;color:#0f172a">${report.overallScore}</p>
      <p style="font-size:8pt;color:#64748b;margin-top:2px">Overall Score</p>
    </div>
    <div style="text-align:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px">
      <p style="font-size:22pt;font-weight:700;color:#2563eb">${report.matchScore}%</p>
      <p style="font-size:8pt;color:#64748b;margin-top:2px">Role Match</p>
    </div>
    <div style="text-align:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px">
      <p style="font-size:22pt;font-weight:700;color:#059669">${report.confidence}%</p>
      <p style="font-size:8pt;color:#64748b;margin-top:2px">AI Confidence</p>
    </div>
  </div>

  <div style="padding:16px;border-radius:8px;margin-bottom:20px;border:2px solid ${recBorder};background:${recBg}">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <span style="font-size:9pt;text-transform:uppercase;letter-spacing:0.08em;color:#64748b">Final Recommendation</span>
      <span style="font-size:16pt;font-weight:700">${report.recommendation}</span>
    </div>
    <p style="font-size:10pt;color:#475569;line-height:1.5">${report.recommendationDetail}</p>
  </div>

  <div style="background:#f8fafc;border-left:4px solid #2563eb;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:20px">
    <h3 style="font-size:9pt;text-transform:uppercase;letter-spacing:0.05em;color:#2563eb;margin-bottom:6px">Executive Summary</h3>
    <p style="font-size:10pt;color:#475569;line-height:1.6">${report.summary}</p>
  </div>

  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;margin-bottom:20px;font-size:8.5pt;color:#64748b;line-height:1.5">
    <strong style="color:#475569">Evidence Validity:</strong> Structured interview (r ≈ 0.51) · CV screening (r ≈ 0.38) · Unstructured interview (r ≈ 0.20) · Multi-method assessment recommended.
    <em>Ref: Schmidt & Hunter (1998). Psychological Bulletin, 124(2), 262–274.</em>
  </div>

  <h2 style="font-size:12pt;font-weight:600;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #e2e8f0">Competency Assessment — ${report.frameworkLabel}</h2>
  <table style="margin-bottom:24px">
    <thead><tr><th>Competency</th><th style="text-align:center">Score</th><th style="text-align:center">Benchmark</th><th style="width:80px">Bar</th><th>Gap</th><th>Insight</th></tr></thead>
    <tbody>${competencyRows}</tbody>
  </table>

  <h2 style="font-size:12pt;font-weight:600;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #e2e8f0">Risk Flags (${report.risks.length} items)</h2>
  <div style="margin-bottom:24px">${riskRows}</div>

  ${report.questions.length > 0 ? `
  <h2 style="font-size:12pt;font-weight:600;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid #e2e8f0">Structured Interview Questions (STAR Format)</h2>
  <p style="font-size:8.5pt;color:#64748b;margin-bottom:12px">Generated from CV gaps · r ≈ 0.51 (Schmidt & Hunter, 1998)</p>
  <div style="margin-bottom:24px">${questionRows}</div>
  ` : ""}

  <div style="margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:8pt;color:#94a3b8">
    <span>Hire Intelligence · hire-intelligence-system.vercel.app</span>
    <span>Generated: ${report.generatedAt} · Groq Llama 3.3 70B · No PII stored</span>
  </div>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup diblokir browser. Izinkan popup untuk export PDF.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 800);
  }, [report, candidateName, targetPosition, department]);

  const handleScheduleInterview = useCallback(() => {
    if (!report) return;
    try {
      sessionStorage.setItem("interview_prefill", JSON.stringify({
        candidateName,
        position: targetPosition,
        department,
        overallScore: report.overallScore,
        matchScore: report.matchScore,
        recommendation: report.recommendation,
        questions: report.questions,
        reportId: report.reportId,
      }));
    } catch { /* ignore */ }
    window.location.href = `/interview?position=${encodeURIComponent(targetPosition)}&name=${encodeURIComponent(candidateName)}`;
  }, [report, candidateName, targetPosition, department]);

  const handleAnalyze = async () => {
    if (!canAnalyze || !file) return;
    setAnalyzing(true);
    setReport(null);
    setError(null);
    const startMs = Date.now();
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("candidateName", candidateName);
      formData.append("targetPosition", targetPosition);
      formData.append("department", department);

      const res = await fetch("/api/analyze-cv", { method: "POST", body: formData });
      const json = await res.json() as {
        success?: boolean;
        result?: AiAnalysisResult;
        error?: string;
      };

      if (!res.ok || json.error) throw new Error(json.error ?? `Server error ${res.status}`);
      if (!json.result) throw new Error("Respons tidak valid dari server");

      const now = new Date();
      setReport({
        ...buildReportFromAi(json.result, startMs),
        reportId: `RPT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        generatedAt: now.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className={cn("flex min-h-screen bg-slate-50 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100", isDark && "dark")} data-theme={theme}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar isDark={isDark} onThemeToggle={cycleTheme} onMenuOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Home</Link>
              <Icon className="h-3.5 w-3.5 text-slate-300"><SvgPath name="chevron" /></Icon>
              <span className="font-medium text-slate-900 dark:text-white">CV Analyzer</span>
              <span className="ml-auto hidden rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 sm:inline dark:bg-indigo-500/10 dark:text-indigo-400">
                <Icon className="mr-1 inline h-3.5 w-3.5"><SvgPath name="sparkles" /></Icon>
                Real AI · Multi-Framework
              </span>
            </nav>
          </div>

          <div className="space-y-6 p-4 sm:p-6">
            <div className="grid gap-6 xl:grid-cols-5">
              <div className="space-y-6 xl:col-span-2">
                <Card>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400"><SvgPath name="upload" /></Icon>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">Upload Resume</h2>
                      <p className="text-sm text-slate-500">PDF format only</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <PdfDropzone file={file} dragActive={dragActive} onFile={setFile} onDragActive={setDragActive} />
                  </div>
                </Card>

                <Card>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Candidate Details</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Framework auto-selected by role · Ulrich · SFIA · Lominger · CGMA</p>
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label htmlFor="candidate-name">Candidate name</Label>
                      <input id="candidate-name" type="text" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} placeholder="e.g. Rahmat Suradi" className={inputClass} />
                    </div>
                    <div>
                      <Label htmlFor="target-position">Target position</Label>
                      <input id="target-position" type="text" value={targetPosition} onChange={(e) => setTargetPosition(e.target.value)} placeholder="e.g. Software Engineer / HR Manager / CFO" className={inputClass} />
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <select id="department" value={department} onChange={(e) => setDepartment(e.target.value)} className={cn(inputClass, "cursor-pointer")}>
                        <option value="">Select department</option>
                        {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <Button variant="primary" size="lg" className="w-full" disabled={!canAnalyze || analyzing} onClick={handleAnalyze}>
                      {analyzing ? (
                        <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Analyzing…</>
                      ) : (
                        <><Icon className="h-5 w-5"><SvgPath name="sparkles" /></Icon>Analyze CV</>
                      )}
                    </Button>
                    {!canAnalyze && !analyzing && (
                      <p className="text-center text-xs text-slate-400">Upload PDF dan lengkapi semua field</p>
                    )}
                    {error && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-500/30 dark:bg-red-500/10">
                        <p className="text-xs font-medium text-red-700 dark:text-red-400">⚠ Error analisis</p>
                        <p className="mt-1 text-xs text-red-600 dark:text-red-300">{error}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <div className="xl:col-span-3">
                {analyzing && (
                  <Card className="flex flex-col items-center justify-center py-16">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-500/20">
                      <Icon className="h-8 w-8 animate-pulse text-blue-600 dark:text-blue-400"><SvgPath name="sparkles" /></Icon>
                    </div>
                    <p className="mt-4 font-medium text-slate-900 dark:text-white">AI sedang menganalisis CV…</p>
                    <p className="mt-1 text-sm text-slate-500">Mendeteksi framework · Membaca kompetensi · Generating insight</p>
                    <div className="mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                    </div>
                  </Card>
                )}
                {!analyzing && !report && !error && (
                  <Card className="flex flex-col items-center justify-center border-dashed py-20 text-center">
                    <Icon className="h-12 w-12 text-slate-300 dark:text-slate-600"><SvgPath name="scan" /></Icon>
                    <p className="mt-4 font-medium text-slate-900 dark:text-white">No analysis yet</p>
                    <p className="mt-1 max-w-sm text-sm text-slate-500">
                      Framework dipilih otomatis berdasarkan posisi: HR → Ulrich+SKKNI, Tech → SFIA, Business/MT → Lominger, Finance → CGMA.
                    </p>
                  </Card>
                )}
                {!analyzing && report && (
                  <AnalysisReportPanel report={report} candidateName={candidateName} targetPosition={targetPosition} department={department} onExportPdf={handleExportPdf} onScheduleInterview={handleScheduleInterview} />
                )}
              </div>
            </div>
          </div>

          <footer className="border-t border-slate-200 px-6 py-4 dark:border-slate-800">
            <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:text-slate-400">
              <p>© 2026 Hire Intelligence · Enterprise Hiring Platform</p>
              <p className="tabular-nums">v3.0.0 · Multi-Framework AI · Groq · Llama 3.3</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

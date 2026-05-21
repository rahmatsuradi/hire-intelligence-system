"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   Types & constants
═══════════════════════════════════════════════════════════════════════════ */

type Theme = "light" | "dark" | "system";
type InterviewType = "Behavioral" | "Technical" | "Leadership" | "Cultural Fit";
type Seniority =
  | "Junior"
  | "Mid-Level"
  | "Senior"
  | "Staff"
  | "Principal"
  | "Director";

interface NavItem {
  id: string;
  label: string;
  href: string;
  badge?: number;
}

interface RubricLevel {
  score: number;
  label: string;
  description: string;
}

interface InterviewQuestion {
  id: string;
  type: InterviewType;
  question: string;
  strongAnswer: string;
  redFlags: string[];
  rubric: RubricLevel[];
}

interface QuestionPack {
  packId: string;
  generatedAt: string;
  position: string;
  seniority: Seniority;
  types: InterviewType[];
  durationMin: number;
  questions: InterviewQuestion[];
  interviewerNotes: string[];
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

const SENIORITY_LEVELS: Seniority[] = [
  "Junior",
  "Mid-Level",
  "Senior",
  "Staff",
  "Principal",
  "Director",
];

const INTERVIEW_TYPES: InterviewType[] = [
  "Behavioral",
  "Technical",
  "Leadership",
  "Cultural Fit",
];

const TYPE_STYLES: Record<
  InterviewType,
  { chip: string; header: string; border: string }
> = {
  Behavioral: {
    chip: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/30",
    header: "border-violet-200 bg-violet-50/50 dark:border-violet-500/30 dark:bg-violet-500/5",
    border: "border-violet-200 dark:border-violet-500/30",
  },
  Technical: {
    chip: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/30",
    header: "border-blue-200 bg-blue-50/50 dark:border-blue-500/30 dark:bg-blue-500/5",
    border: "border-blue-200 dark:border-blue-500/30",
  },
  Leadership: {
    chip: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/30",
    header: "border-indigo-200 bg-indigo-50/50 dark:border-indigo-500/30 dark:bg-indigo-500/5",
    border: "border-indigo-200 dark:border-indigo-500/30",
  },
  "Cultural Fit": {
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30",
    header: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-500/5",
    border: "border-emerald-200 dark:border-emerald-500/30",
  },
};

const DEFAULT_RUBRIC: RubricLevel[] = [
  { score: 1, label: "Insufficient", description: "No relevant evidence; vague or off-topic response." },
  { score: 2, label: "Below bar", description: "Limited examples; gaps in depth or ownership." },
  { score: 3, label: "Meets bar", description: "Adequate STAR/technical depth for level; some gaps." },
  { score: 4, label: "Exceeds bar", description: "Strong, specific examples with clear impact and reflection." },
  { score: 5, label: "Exceptional", description: "Outstanding depth; teaches interviewer; role-model signal." },
];

function buildMockQuestions(
  position: string,
  seniority: Seniority,
  types: InterviewType[],
): InterviewQuestion[] {
  const all: InterviewQuestion[] = [
    {
      id: "B1",
      type: "Behavioral",
      question: `Tell me about a time you had to deliver ${position} outcomes under a tight deadline with incomplete requirements. What did you do?`,
      strongAnswer:
        "Uses STAR format with specific timeline, stakeholder alignment tactic, trade-off decision, and measurable outcome. Acknowledges what they would do differently.",
      redFlags: [
        "Blames others for ambiguity without describing own actions",
        "No quantified result or scope of impact",
        "Cannot articulate decision criteria under pressure",
      ],
      rubric: DEFAULT_RUBRIC,
    },
    {
      id: "B2",
      type: "Behavioral",
      question:
        "Describe a situation where you received critical feedback that changed how you work. How did you respond?",
      strongAnswer:
        "Shows humility, concrete behavior change, follow-up with feedback giver, and sustained improvement over time.",
      redFlags: [
        "Defensive framing or dismisses feedback as unfair",
        "Generic answer with no behavior change examples",
        "Places responsibility entirely on manager or team",
      ],
      rubric: DEFAULT_RUBRIC,
    },
    {
      id: "T1",
      type: "Technical",
      question: `For a ${seniority} ${position}, walk us through how you would design a system that must handle 10x traffic growth in 12 months.`,
      strongAnswer:
        "Covers requirements gathering, bottlenecks, scaling axes (vertical/horizontal), data model, observability, failure modes, and phased rollout with success metrics.",
      redFlags: [
        "Jumps to tools without clarifying constraints",
        "Ignores monitoring, rollback, or operational concerns",
        "Cannot reason about trade-offs at stated seniority level",
      ],
      rubric: DEFAULT_RUBRIC,
    },
    {
      id: "T2",
      type: "Technical",
      question:
        "Tell us about the most complex technical problem you solved in the last year. What was your specific contribution?",
      strongAnswer:
        "Clear problem statement, constraints, alternatives considered, personal contribution vs. team, and post-mortem learnings.",
      redFlags: [
        "Only describes team success without individual ownership",
        "Overstates contribution when probed on details",
        "No discussion of failure modes or maintenance burden",
      ],
      rubric: DEFAULT_RUBRIC,
    },
    {
      id: "L1",
      type: "Leadership",
      question: `How do you set direction and priorities for your team when stakeholders disagree on the ${position} roadmap?`,
      strongAnswer:
        "Demonstrates facilitation, transparent decision framework, communication plan, and how dissent is incorporated or documented.",
      redFlags: [
        "Top-down mandates without stakeholder buy-in process",
        "Avoids conflict; no examples of saying no",
        "Cannot describe how team understands the 'why'",
      ],
      rubric: DEFAULT_RUBRIC,
    },
    {
      id: "L2",
      type: "Leadership",
      question:
        "Give an example of developing someone on your team who was underperforming. What was the outcome?",
      strongAnswer:
        "Structured coaching plan, clear expectations, check-ins, resources provided, timeline, and honest outcome (success or managed transition).",
      redFlags: [
        "Terminated quickly without development effort (unless role requires)",
        "Takes credit for team member's growth without specifics",
        "No empathy or consideration of context",
      ],
      rubric: DEFAULT_RUBRIC,
    },
    {
      id: "C1",
      type: "Cultural Fit",
      question:
        "What type of work environment brings out your best performance, and where do you see misalignment risk with our culture?",
      strongAnswer:
        "Self-aware answer linking values to examples; names potential friction honestly with mitigation ideas; asks clarifying questions about team norms.",
      redFlags: [
        "Generic 'I adapt to anything' with no examples",
        "Criticizes past employers excessively",
        "Values misaligned with collaborative, feedback-rich environment",
      ],
      rubric: DEFAULT_RUBRIC,
    },
    {
      id: "C2",
      type: "Cultural Fit",
      question: `Why this ${position} role at our company now, and what will you need to be successful in the first 90 days?`,
      strongAnswer:
        "Research-backed motivation, realistic 30/60/90 plan, identifies relationships to build, and learning goals—not only deliverables.",
      redFlags: [
        "Focuses primarily on compensation or title",
        "No company-specific research",
        "Unrealistic 90-day promises without discovery phase",
      ],
      rubric: DEFAULT_RUBRIC,
    },
  ];

  return all.filter((q) => types.includes(q.type));
}

function buildInterviewerNotes(
  position: string,
  seniority: Seniority,
  types: InterviewType[],
): string[] {
  return [
    `Calibrate expectations to ${seniority} bar before scoring Technical and Leadership responses.`,
    `Allocate ~${Math.max(45, types.length * 15)} minutes: probe depth on ${types.join(", ")} sections.`,
    `For ${position}, weight ownership and cross-functional influence if level is Senior or above.`,
    "Leave 10 minutes at end for candidate questions; note quality and relevance of their questions.",
    "Document verbatim quotes for any score of 4+ or any red-flag signal for debrief consistency.",
    "If two interviewers are present, split note-taking by question block to avoid gaps.",
  ];
}

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
  scan:
    "M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5M16.5 20.25H18A2.25 2.25 0 0120.25 18v-1.5M7.5 20.25H6A2.25 2.25 0 003.75 18v-1.5M9 12.75h6",
  workspace:
    "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25",
  report:
    "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75v-.75V4.875C9.75 4.256 10.306 3.75 11 3.75H15M9.75 15.75h4.5M9.75 12h4.5m-6-3h1.5m-1.5 3h1.5m-1.5 3h1.5",
  cog: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z",
  plug: "M13.5 6.75H12v4.5h1.5m-1.5-9h1.5m-3.75 3h15a2.25 2.25 0 012.25 2.25v6.75A2.25 2.25 0 0118 18.75H6A2.25 2.25 0 013.75 16.5v-6.75A2.25 2.25 0 016 7.5h1.5m9 0V6a2.25 2.25 0 00-2.25-2.25H9.75A2.25 2.25 0 007.5 6v1.5",
  menu: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5",
  close: "M6 18L18 6M6 6l12 12",
  chevron: "M8.25 4.5l7.5 7.5-7.5 7.5",
  chevronDown: "M19.5 8.25l-7.5 7.5-7.5-7.5",
  sun: "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z",
  moon: "M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z",
  bell: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
  sparkles:
    "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z",
  clipboard:
    "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c.712 0 1.35.217 1.894.591M9 6.75h.008v.008H9V6.75z",
  play: "M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z",
  check:
    "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  flag:
    "M3 3v1.5M3 21v-6m0 0h7.5m-7.5 0H3m4.5-6h7.5M21 3v18m0 0h-7.5m7.5 0H21m-4.5 0v-6m0 6h-7.5m7.5-6v-6m0 6H10.5m7.5 0V9.75",
  star: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
  download:
    "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3",
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
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:pointer-events-none disabled:opacity-50";
  const sizes = {
    sm: "rounded-lg px-2.5 py-1 text-xs",
    md: "rounded-lg px-3 py-1.5 text-sm",
    lg: "rounded-lg px-5 py-2.5 text-sm",
  };
  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
    ghost:
      "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
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

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500";

/* ═══════════════════════════════════════════════════════════════════════════
   Layout
═══════════════════════════════════════════════════════════════════════════ */

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const renderNav = (items: NavItem[]) =>
    items.map((item) => {
      const active = item.id === "interview-workspace";
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
          {item.badge !== undefined && (
            <span
              className={cn(
                "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                active
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
              )}
            >
              {item.badge > 999 ? `${(item.badge / 1000).toFixed(1)}k` : item.badge}
            </span>
          )}
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
              <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400">
                <SvgPath name="workspace" />
              </Icon>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Interview Workspace
              </p>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              Structured interview kits
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Role-calibrated questions, rubrics, and red flags for consistent hiring panels.
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
          Interview Workspace
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Structured question kits & scoring guides
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
   Interview features
═══════════════════════════════════════════════════════════════════════════ */

function QuestionCard({ q, index }: { q: InterviewQuestion; index: number }) {
  const style = TYPE_STYLES[q.type];
  return (
    <article
      className={cn(
        "rounded-xl border bg-white dark:bg-slate-900",
        style.border,
      )}
    >
      <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {index}
          </span>
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
              style.chip,
            )}
          >
            {q.type}
          </span>
        </div>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-900 dark:text-white">
          {q.question}
        </p>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            <Icon className="h-4 w-4">
              <SvgPath name="check" />
            </Icon>
            Strong answer looks like
          </div>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{q.strongAnswer}</p>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
            <Icon className="h-4 w-4">
              <SvgPath name="flag" />
            </Icon>
            Red flags to watch for
          </div>
          <ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-400">
            {q.redFlags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Icon className="h-4 w-4">
              <SvgPath name="star" />
            </Icon>
            Scoring rubric (1–5)
          </div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 pr-3 font-medium text-slate-500">Score</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Level</th>
                  <th className="py-2 font-medium text-slate-500">Criteria</th>
                </tr>
              </thead>
              <tbody>
                {q.rubric.map((r) => (
                  <tr
                    key={r.score}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="py-2 pr-3 font-bold tabular-nums text-slate-900 dark:text-white">
                      {r.score}
                    </td>
                    <td className="py-2 pr-3 font-medium text-slate-700 dark:text-slate-300">
                      {r.label}
                    </td>
                    <td className="py-2 text-slate-600 dark:text-slate-400">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </article>
  );
}

function ResultsPanel({ pack }: { pack: QuestionPack }) {
  const questionIndexById = useMemo(
    () => new Map(pack.questions.map((q, i) => [q.id, i + 1])),
    [pack.questions],
  );

  const grouped = useMemo(() => {
    const map = new Map<InterviewType, InterviewQuestion[]>();
    for (const type of INTERVIEW_TYPES) {
      const qs = pack.questions.filter((q) => q.type === type);
      if (qs.length) map.set(type, qs);
    }
    return map;
  }, [pack.questions]);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/50 px-5 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-indigo-500/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Icon className="h-6 w-6">
                  <SvgPath name="clipboard" />
                </Icon>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Interview Question Kit
                  </h2>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                    Ready
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  {pack.position} · {pack.seniority}
                </p>
                <p className="mt-1 font-mono text-xs text-slate-400">
                  {pack.packId} · {pack.generatedAt}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-center sm:justify-end">
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {pack.questions.length}
                </p>
                <p className="text-xs text-slate-500">Questions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {pack.durationMin}m
                </p>
                <p className="text-xs text-slate-500">Est. duration</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 px-5 py-3">
          {pack.types.map((t) => (
            <span
              key={t}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                TYPE_STYLES[t].chip,
              )}
            >
              {t}
            </span>
          ))}
        </div>
      </Card>

      {Array.from(grouped.entries()).map(([type, questions]) => {
        const style = TYPE_STYLES[type];
        return (
          <section key={type}>
            <div
              className={cn(
                "mb-3 flex items-center gap-2 rounded-lg border px-4 py-2.5",
                style.header,
              )}
            >
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{type}</h3>
              <span className="text-xs text-slate-500">
                {questions.length} question{questions.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-4">
              {questions.map((q) => (
                <QuestionCard
                  key={q.id}
                  q={q}
                  index={questionIndexById.get(q.id) ?? 0}
                />
              ))}
            </div>
          </section>
        );
      })}

      <Card>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-slate-500">
            <SvgPath name="document" />
          </Icon>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Interviewer Notes
          </h3>
        </div>
        <p className="mt-0.5 text-sm text-slate-500">
          Panel guidance for consistent evaluation
        </p>
        <ul className="mt-4 space-y-2">
          {pack.interviewerNotes.map((note, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300"
            >
              <span className="font-semibold tabular-nums text-slate-400">{i + 1}.</span>
              {note}
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-col gap-3 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50/50 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-indigo-500/30 dark:from-indigo-500/10 dark:to-blue-500/5">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">Ready to conduct interview</p>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            Launch live scoring mode with timer and per-question notes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="md">
            <Icon className="h-4 w-4">
              <SvgPath name="download" />
            </Icon>
            Export kit
          </Button>
          <Button variant="primary" size="lg">
            <Icon className="h-5 w-5">
              <SvgPath name="play" />
            </Icon>
            Start Interview
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════════════════════════════ */

export default function InterviewPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");
  const [isDark, setIsDark] = useState(false);

  const [position, setPosition] = useState("");
  const [seniority, setSeniority] = useState<Seniority>("Senior");
  const [selectedTypes, setSelectedTypes] = useState<InterviewType[]>([
    ...INTERVIEW_TYPES,
  ]);
  const [generating, setGenerating] = useState(false);
  const [pack, setPack] = useState<QuestionPack | null>(null);

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

  const toggleType = (type: InterviewType) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const canGenerate = position.trim() !== "" && selectedTypes.length > 0;

  const handleGenerate = () => {
    if (!canGenerate) return;
    setGenerating(true);
    setPack(null);

    setTimeout(() => {
      const now = new Date();
      const questions = buildMockQuestions(position, seniority, selectedTypes);
      setPack({
        packId: `KIT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        generatedAt: now.toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
        position: position.trim(),
        seniority,
        types: selectedTypes,
        durationMin: Math.max(45, selectedTypes.length * 15 + questions.length * 5),
        questions,
        interviewerNotes: buildInterviewerNotes(position, seniority, selectedTypes),
      });
      setGenerating(false);
    }, 1800);
  };

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
              <span className="font-medium text-slate-900 dark:text-white">
                Interview Workspace
              </span>
              <span className="ml-auto hidden rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 sm:inline dark:bg-indigo-500/10 dark:text-indigo-400">
                Panel-ready question kits
              </span>
            </nav>
          </div>

          <div className="space-y-6 p-4 sm:p-6">
            <div className="sm:hidden">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                Interview Workspace
              </h1>
              <p className="text-sm text-slate-500">Structured question kits & scoring guides</p>
            </div>

            <div className="grid gap-6 xl:grid-cols-5">
              <div className="xl:col-span-2">
                <Card>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400">
                      <SvgPath name="sparkles" />
                    </Icon>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        Configure Interview Kit
                      </h2>
                      <p className="text-sm text-slate-500">
                        Role-calibrated questions with rubrics
                      </p>
                    </div>
                  </div>

                  <form
                    className="mt-5 space-y-5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleGenerate();
                    }}
                  >
                    <div>
                      <Label htmlFor="position">Job position</Label>
                      <input
                        id="position"
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="e.g. Senior Software Engineer"
                        className={inputClass}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="seniority">Seniority level</Label>
                      <select
                        id="seniority"
                        value={seniority}
                        onChange={(e) => setSeniority(e.target.value as Seniority)}
                        className={cn(inputClass, "cursor-pointer")}
                      >
                        {SENIORITY_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label>Interview type</Label>
                      <p className="mb-2 text-xs text-slate-500">
                        Select one or more — 2 questions per type
                      </p>
                      <div
                        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                        role="group"
                        aria-label="Interview types"
                      >
                        {INTERVIEW_TYPES.map((type) => {
                          const selected = selectedTypes.includes(type);
                          const style = TYPE_STYLES[type];
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => toggleType(type)}
                              className={cn(
                                "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                                selected
                                  ? cn("ring-2 ring-blue-500/40", style.border, style.header)
                                  : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800",
                              )}
                              aria-pressed={selected}
                            >
                              <span
                                className={cn(
                                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                                  selected
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-slate-300 dark:border-slate-600",
                                )}
                              >
                                {selected && (
                                  <Icon className="h-3 w-3">
                                    <SvgPath name="check" />
                                  </Icon>
                                )}
                              </span>
                              {type}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      disabled={!canGenerate || generating}
                    >
                      {generating ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Generating questions…
                        </>
                      ) : (
                        <>
                          <Icon className="h-5 w-5">
                            <SvgPath name="sparkles" />
                          </Icon>
                          Generate Questions
                        </>
                      )}
                    </Button>

                    {!canGenerate && !generating && (
                      <p className="text-center text-xs text-slate-400">
                        Enter a job position and select at least one interview type
                      </p>
                    )}
                  </form>
                </Card>
              </div>

              <div className="xl:col-span-3">
                {generating && (
                  <Card className="flex flex-col items-center justify-center py-16">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-500/20">
                      <Icon className="h-8 w-8 animate-pulse text-indigo-600 dark:text-indigo-400">
                        <SvgPath name="clipboard" />
                      </Icon>
                    </div>
                    <p className="mt-4 font-medium text-slate-900 dark:text-white">
                      Building interview kit…
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Calibrating questions, rubrics, and red flags for {seniority} level
                    </p>
                    <div className="mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-full w-3/4 animate-pulse rounded-full bg-gradient-to-r from-indigo-500 to-blue-500" />
                    </div>
                  </Card>
                )}

                {!generating && !pack && (
                  <Card className="flex flex-col items-center justify-center border-dashed py-20 text-center">
                    <Icon className="h-12 w-12 text-slate-300 dark:text-slate-600">
                      <SvgPath name="workspace" />
                    </Icon>
                    <p className="mt-4 font-medium text-slate-900 dark:text-white">
                      No question kit yet
                    </p>
                    <p className="mt-1 max-w-md text-sm text-slate-500">
                      Configure the role and interview types, then generate a structured kit with
                      scoring rubrics and interviewer notes.
                    </p>
                  </Card>
                )}

                {!generating && pack && <ResultsPanel pack={pack} />}
              </div>
            </div>
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

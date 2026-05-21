"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════════════════════ */

type Trend = "up" | "down" | "neutral";
type CandidateStatus = "Strong" | "Review" | "Hold" | "Rejected";
type SortKey = "name" | "score" | "updated";
type SortDir = "asc" | "desc";
type Period = "7d" | "30d" | "90d" | "ytd";
type Theme = "light" | "dark" | "system";

interface NavItem {
  id: string;
  label: string;
  href?: string;
  badge?: number;
  section?: "main" | "tools";
}

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

const NAV_MAIN: NavItem[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "candidates", label: "Candidates", badge: 1284 },
  { id: "roles", label: "Open Roles", badge: 47 },
  { id: "interviews", label: "Interviews", badge: 18 },
  { id: "analytics", label: "Analytics" },
  { id: "reports", label: "Reports" },
];

const NAV_TOOLS: NavItem[] = [
  { id: "cv-analyzer", label: "CV Analyzer", href: "/cv-analyzer", section: "tools" },
  { id: "interview-workspace", label: "Interview Workspace", href: "/interview", section: "tools" },
  { id: "hiring-report", label: "Hiring Report", href: "/report", section: "tools" },
  { id: "integrations", label: "Integrations", section: "tools" },
  { id: "settings", label: "Settings", section: "tools" },
];

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

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "ytd", label: "YTD" },
];

const STATUS_FILTERS: Array<CandidateStatus | "All"> = [
  "All",
  "Strong",
  "Review",
  "Hold",
];

/* ═══════════════════════════════════════════════════════════════════════════
   Icons (inline SVG — zero dependencies)
═══════════════════════════════════════════════════════════════════════════ */

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
  cog: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z",
  plug: "M13.5 6.75H12v4.5h1.5m-1.5-9h1.5m-3.75 3h15a2.25 2.25 0 012.25 2.25v6.75A2.25 2.25 0 0118 18.75H6A2.25 2.25 0 013.75 16.5v-6.75A2.25 2.25 0 016 7.5h1.5m9 0V6a2.25 2.25 0 00-2.25-2.25H9.75A2.25 2.25 0 007.5 6v1.5",
  search:
    "m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
  bell: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
  menu: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5",
  close: "M6 18L18 6M6 6l12 12",
  chevron: "M8.25 4.5l7.5 7.5-7.5 7.5",
  chevronDown: "M19.5 8.25l-7.5 7.5-7.5-7.5",
  chevronUp: "M4.5 15.75l7.5-7.5 7.5 7.5",
  trendUp:
    "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941",
  trendDown:
    "M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776-2.898m0 0l-3.182-5.511m3.182 5.51l-5.511-3.181",
  filter:
    "M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z",
  download:
    "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3",
  sun: "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z",
  moon: "M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z",
  dots: "M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z",
  arrowRight: "M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3",
  check:
    "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  clock:
    "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
  scan: "M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5M16.5 20.25H18A2.25 2.25 0 0120.25 18v-1.5M7.5 20.25H6A2.25 2.25 0 003.75 18v-1.5M9 12.75h6",
  workspace:
    "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25",
  report:
    "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75v-.75V4.875C9.75 4.256 10.306 3.75 11 3.75H15M9.75 15.75h4.5M9.75 12h4.5m-6-3h1.5m-1.5 3h1.5m-1.5 3h1.5",
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
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d={PATHS[name]}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Utilities
═══════════════════════════════════════════════════════════════════════════ */

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

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

function Button({
  children,
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:pointer-events-none disabled:opacity-50";
  const sizes = { sm: "rounded-lg px-2.5 py-1 text-xs", md: "rounded-lg px-3 py-1.5 text-sm" };
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
    ghost: "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
  };
  return (
    <button
      type="button"
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    >
      {children}
    </button>
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

/* ═══════════════════════════════════════════════════════════════════════════
   Layout sections
═══════════════════════════════════════════════════════════════════════════ */

function Sidebar({
  activeNav,
  onNavChange,
  open,
  onClose,
}: {
  activeNav: string;
  onNavChange: (id: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  const renderNav = (items: NavItem[]) =>
    items.map((item) => {
      const active = activeNav === item.id;
      const iconKey = NAV_ICON_MAP[item.id] ?? "dashboard";
      const className = cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
      );
      const content = (
        <>
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
        </>
      );
      if (item.href) {
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onClose}
            className={className}
          >
            {content}
          </Link>
        );
      }
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            onNavChange(item.id);
            onClose();
          }}
          className={className}
          aria-current={active ? "page" : undefined}
        >
          {content}
        </button>
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
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
            aria-hidden="true"
          >
            <span className="text-sm font-bold tracking-tight">HI</span>
          </div>
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
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Q2 Hiring Cycle
              </p>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">68%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              32 of 47 roles filled · 15 remaining
            </p>
            <Button variant="primary" size="sm" className="mt-3 w-full">
              View hiring plan
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

function TopBar({
  period,
  onPeriodChange,
  isDark,
  onThemeToggle,
  searchQuery,
  onSearchChange,
  onMenuOpen,
}: {
  period: Period;
  onPeriodChange: (p: Period) => void;
  isDark: boolean;
  onThemeToggle: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
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
          Dashboard
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Thursday, May 21, 2026
        </p>
      </div>

      <div className="relative ml-auto w-full max-w-sm flex-1 sm:max-w-md">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
          <SvgPath name="search" />
        </Icon>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search candidates, roles, IDs..."
          aria-label="Global search"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      <div
        className="hidden items-center rounded-lg border border-slate-200 p-0.5 sm:flex dark:border-slate-700"
        role="group"
        aria-label="Time period"
      >
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onPeriodChange(p.value)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              period === p.value
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
            )}
            aria-pressed={period === p.value}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
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
          aria-label="Notifications, 3 unread"
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

function PipelineSection() {
  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
        Hiring Pipeline
      </h2>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
        Stage conversion · {PERIODS.find((p) => p.value === "30d")?.label}
      </p>
      <ul className="mt-5 space-y-3">
        {PIPELINE.map((stage, i) => (
          <li key={stage.stage}>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold",
                    i === PIPELINE.length - 1
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

function ActivityFeed() {
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
        {ACTIVITIES.map((a) => (
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [period, setPeriod] = useState<Period>("30d");
  const [theme, setTheme] = useState<Theme>("system");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const resolve = () => {
      const dark =
        theme === "dark" || (theme === "system" && mq.matches);
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
      <Sidebar
        activeNav={activeNav}
        onNavChange={setActiveNav}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          period={period}
          onPeriodChange={setPeriod}
          isDark={isDark}
          onThemeToggle={cycleTheme}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onMenuOpen={() => setSidebarOpen(true)}
        />

        <main id="main-content" className="flex-1 overflow-y-auto">
          <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400">Home</span>
              <Icon className="h-3.5 w-3.5 text-slate-300">
                <SvgPath name="chevron" />
              </Icon>
              <span className="font-medium text-slate-900 dark:text-white">Dashboard</span>
              <span className="ml-auto hidden rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 sm:inline dark:bg-blue-500/10 dark:text-blue-400">
                Live data · Refreshed 3m ago
              </span>
            </nav>
          </div>

          <div className="space-y-6 p-4 sm:p-6">
            {/* Mobile title */}
            <div className="sm:hidden">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
              <p className="text-sm text-slate-500">Hiring intelligence overview</p>
            </div>

            <StatCards stats={STATS} />

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
                  candidates={CANDIDATES}
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
                <PipelineSection />
              </div>
            </div>

            {/* Row: interviews, activity, roles */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <UpcomingInterviews />
              <ActivityFeed />
              <OpenRolesPanel />
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

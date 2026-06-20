"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AppShell, Button, Card, Icon, SvgPath, cn, Label, inputClass,
} from "@/components/app-shell";
import {
  type JobRequisition, type ReqStatus, type CandidateRecord,
  getJobReqs, saveJobReq, deleteJobReq, createJobReq,
  getCandidatesForReq, getCandidates,
} from "@/lib/store";

/* ─── Status colors ─── */

const STATUS_COLORS: Record<ReqStatus, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400" },
  active: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  paused: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  closed: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
};

const STATUS_LABELS: Record<ReqStatus, string> = { draft: "Draft", active: "Active", paused: "Paused", closed: "Closed" };
const ALL_STATUSES: ReqStatus[] = ["draft", "active", "paused", "closed"];

function daysLeft(targetDate: string): string {
  if (!targetDate) return "—";
  const diff = Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  return `${diff}d left`;
}

function formatCurrency(amount: number, currency: string): string {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

/* ─── Empty state defaults ─── */

const EMPTY_FORM: Omit<JobRequisition, "id" | "createdAt" | "updatedAt"> = {
  title: "", department: "", level: "Mid", status: "draft",
  description: "", requirements: "", salaryMin: 0, salaryMax: 0,
  currency: "IDR", location: "Jakarta", targetDate: "",
  headcount: 1, hiringManager: "",
};

/* ─── Req Form ─── */

function ReqForm({
  initial,
  onSave,
  onCancel,
  title: formTitle,
}: {
  initial: typeof EMPTY_FORM & { id?: string; createdAt?: string; updatedAt?: string };
  onSave: (data: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  title: string;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 py-10 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{formTitle}</h2>
          <button type="button" onClick={onCancel} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Icon className="h-5 w-5"><SvgPath name="close" /></Icon>
          </button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="req-title">Job Title *</Label>
              <input id="req-title" className={inputClass} placeholder="Senior Frontend Engineer" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="req-dept">Department *</Label>
              <input id="req-dept" className={inputClass} placeholder="Engineering" value={form.department} onChange={(e) => set("department", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="req-level">Level</Label>
              <select id="req-level" className={inputClass} value={form.level} onChange={(e) => set("level", e.target.value)}>
                {["Intern", "Junior", "Mid", "Senior", "Lead", "Principal", "Manager", "Director", "VP", "C-Level"].map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="req-headcount">Headcount</Label>
              <input id="req-headcount" type="number" min={1} className={inputClass} value={form.headcount} onChange={(e) => set("headcount", parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <Label htmlFor="req-location">Location</Label>
              <input id="req-location" className={inputClass} placeholder="Jakarta" value={form.location} onChange={(e) => set("location", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="req-currency">Currency</Label>
              <select id="req-currency" className={inputClass} value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                {["IDR", "USD", "EUR", "GBP", "SGD", "JPY", "AUD"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="req-salmin">Salary Min</Label>
              <input id="req-salmin" type="number" className={inputClass} value={form.salaryMin || ""} onChange={(e) => set("salaryMin", parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <Label htmlFor="req-salmax">Salary Max</Label>
              <input id="req-salmax" type="number" className={inputClass} value={form.salaryMax || ""} onChange={(e) => set("salaryMax", parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="req-manager">Hiring Manager</Label>
              <input id="req-manager" className={inputClass} placeholder="Name" value={form.hiringManager} onChange={(e) => set("hiringManager", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="req-target">Target Date</Label>
              <input id="req-target" type="date" className={inputClass} value={form.targetDate} onChange={(e) => set("targetDate", e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="req-desc">Description</Label>
            <textarea id="req-desc" className={cn(inputClass, "min-h-[80px]")} placeholder="Role description..." value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="req-reqs">Requirements</Label>
            <textarea id="req-reqs" className={cn(inputClass, "min-h-[80px]")} placeholder="Key requirements, one per line..." value={form.requirements} onChange={(e) => set("requirements", e.target.value)} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave(form)} disabled={!form.title.trim() || !form.department.trim()}>
            <Icon className="h-4 w-4"><SvgPath name="check" /></Icon> Save
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Req Detail Panel ─── */

function ReqDetailPanel({
  req,
  candidates,
  onClose,
  onEdit,
  onStatusChange,
  onDelete,
}: {
  req: JobRequisition;
  candidates: CandidateRecord[];
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (status: ReqStatus) => void;
  onDelete: () => void;
}) {
  const sc = STATUS_COLORS[req.status];

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400"><SvgPath name="briefcase" /></Icon>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-slate-900 dark:text-white">{req.title}</p>
          <p className="truncate text-sm text-slate-500">{req.department} &middot; {req.level}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
          <Icon className="h-5 w-5"><SvgPath name="close" /></Icon>
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {/* Status */}
        <div>
          <Label>Status</Label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {ALL_STATUSES.map((s) => {
              const c = STATUS_COLORS[s];
              const active = req.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => { if (!active) onStatusChange(s); }}
                  className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-colors", active ? cn(c.bg, c.text, "ring-1 ring-current/20") : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800")}
                >
                  {STATUS_LABELS[s]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <p className="text-xl font-bold text-slate-900 dark:text-white">{candidates.length}</p>
            <p className="text-[10px] text-slate-500">Candidates</p>
          </Card>
          <Card className="text-center">
            <p className="text-xl font-bold text-slate-900 dark:text-white">{req.headcount}</p>
            <p className="text-[10px] text-slate-500">Headcount</p>
          </Card>
          <Card className="text-center">
            <p className={cn("text-xl font-bold", req.targetDate && new Date(req.targetDate) < new Date() ? "text-red-600" : "text-slate-900 dark:text-white")}>{daysLeft(req.targetDate)}</p>
            <p className="text-[10px] text-slate-500">Timeline</p>
          </Card>
        </div>

        {/* Details */}
        <Card className="space-y-2">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Details</span>
          {[
            ["Location", req.location],
            ["Hiring Manager", req.hiringManager],
            ["Salary Range", req.salaryMin || req.salaryMax ? `${formatCurrency(req.salaryMin, req.currency)} — ${formatCurrency(req.salaryMax, req.currency)}` : "—"],
            ["Target Date", req.targetDate ? new Date(req.targetDate).toLocaleDateString() : "—"],
            ["Created", new Date(req.createdAt).toLocaleDateString()],
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between text-sm">
              <span className="text-slate-500">{label}</span>
              <span className="text-right font-medium text-slate-900 dark:text-white">{value || "—"}</span>
            </div>
          ))}
        </Card>

        {req.description && (
          <Card className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Description</span>
            <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">{req.description}</p>
          </Card>
        )}

        {req.requirements && (
          <Card className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Requirements</span>
            <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">{req.requirements}</p>
          </Card>
        )}

        {/* Pipeline breakdown */}
        {candidates.length > 0 && (
          <Card className="space-y-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Pipeline</span>
            {(["applied", "screened", "interviewed", "offered", "hired", "rejected"] as const).map((stage) => {
              const count = candidates.filter((c) => c.stage === stage).length;
              if (count === 0) return null;
              const sc2 = STATUS_COLORS[stage === "rejected" ? "closed" : stage === "applied" ? "draft" : stage === "hired" ? "active" : "paused"];
              return (
                <div key={stage} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">{stage.charAt(0).toUpperCase() + stage.slice(1)}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", sc2.bg, sc2.text)}>{count}</span>
                </div>
              );
            })}
          </Card>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
        <Button size="sm" onClick={onEdit}>
          <Icon className="h-4 w-4"><SvgPath name="pencil" /></Icon> Edit
        </Button>
        <Link href={`/candidates?dept=${encodeURIComponent(req.department)}`}>
          <Button size="sm" variant="ghost">
            <Icon className="h-4 w-4"><SvgPath name="users" /></Icon> View Candidates
          </Button>
        </Link>
        <div className="flex-1" />
        <Button variant="danger" size="sm" onClick={() => { if (confirm(`Delete "${req.title}"?`)) onDelete(); }}>
          <Icon className="h-4 w-4"><SvgPath name="trash" /></Icon>
        </Button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function RolesPage() {
  const [allReqs, setAllReqs] = useState<JobRequisition[]>([]);
  const [selected, setSelected] = useState<JobRequisition | null>(null);
  const [showForm, setShowForm] = useState<"add" | "edit" | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ReqStatus | "">("");

  const reload = useCallback(() => { setAllReqs(getJobReqs()); }, []);
  useEffect(reload, [reload]);

  const filtered = useMemo(() => {
    let list = allReqs;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.title.toLowerCase().includes(q) || r.department.toLowerCase().includes(q) || r.hiringManager.toLowerCase().includes(q));
    }
    if (filterStatus) list = list.filter((r) => r.status === filterStatus);
    return list;
  }, [allReqs, search, filterStatus]);

  const statusCounts = useMemo(() => {
    const c: Record<ReqStatus, number> = { draft: 0, active: 0, paused: 0, closed: 0 };
    for (const r of allReqs) c[r.status]++;
    return c;
  }, [allReqs]);

  const handleSaveNew = (data: typeof EMPTY_FORM) => {
    createJobReq(data);
    setShowForm(null);
    reload();
  };

  const handleSaveEdit = (data: typeof EMPTY_FORM) => {
    if (!selected) return;
    const updated: JobRequisition = {
      ...selected,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveJobReq(updated);
    setSelected(updated);
    setShowForm(null);
    reload();
  };

  const handleStatusChange = (reqId: string, status: ReqStatus) => {
    const req = allReqs.find((r) => r.id === reqId);
    if (!req) return;
    req.status = status;
    req.updatedAt = new Date().toISOString();
    saveJobReq(req);
    if (selected?.id === reqId) setSelected({ ...req });
    reload();
  };

  const handleDeleteReq = (reqId: string) => {
    deleteJobReq(reqId);
    if (selected?.id === reqId) setSelected(null);
    reload();
  };

  return (
    <AppShell activeNavId="roles" title="Job Requisitions" subtitle={`${allReqs.length} total · ${statusCounts.active} active`}
      headerActions={
        <Button variant="primary" onClick={() => setShowForm("add")}>
          <Icon className="h-4 w-4"><SvgPath name="plus" /></Icon>
          <span className="hidden sm:inline">New Requisition</span>
        </Button>
      }>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ALL_STATUSES.map((s) => {
          const sc = STATUS_COLORS[s];
          const active = filterStatus === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(active ? "" : s)}
              className={cn("rounded-xl border p-4 text-left transition-all", active ? "border-blue-300 ring-2 ring-blue-400/30 dark:border-blue-600" : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700", "bg-white dark:bg-slate-900")}
            >
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", sc.dot)} />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{STATUS_LABELS[s]}</span>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{statusCounts[s]}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"><SvgPath name="search" /></Icon>
          <input className={cn(inputClass, "pl-9")} placeholder="Search requisitions..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <Card padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                {["Title", "Department", "Level", "Status", "Headcount", "Candidates", "Timeline"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((r) => {
                const sc = STATUS_COLORS[r.status];
                const candidateCount = getCandidatesForReq(r.id).length;
                return (
                  <tr key={r.id} className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => setSelected(r)}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{r.title}</p>
                      {r.hiringManager && <p className="text-xs text-slate-500">{r.hiringManager}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.department}</td>
                    <td className="px-4 py-3 text-slate-500">{r.level}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", sc.bg, sc.text)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-slate-700 dark:text-slate-300">{r.headcount}</td>
                    <td className="px-4 py-3 text-center tabular-nums text-slate-700 dark:text-slate-300">{candidateCount}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-sm", r.targetDate && new Date(r.targetDate) < new Date() && r.status === "active" ? "font-medium text-red-600 dark:text-red-400" : "text-slate-500")}>
                        {daysLeft(r.targetDate)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                    No requisitions found. <button type="button" className="text-blue-600 hover:underline" onClick={() => setShowForm("add")}>Create one</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Panel */}
      {selected && !showForm && (
        <ReqDetailPanel
          req={selected}
          candidates={getCandidatesForReq(selected.id)}
          onClose={() => setSelected(null)}
          onEdit={() => setShowForm("edit")}
          onStatusChange={(s) => handleStatusChange(selected.id, s)}
          onDelete={() => handleDeleteReq(selected.id)}
        />
      )}

      {/* Add/Edit Form */}
      {showForm === "add" && (
        <ReqForm initial={EMPTY_FORM} title="New Job Requisition" onSave={handleSaveNew} onCancel={() => setShowForm(null)} />
      )}
      {showForm === "edit" && selected && (
        <ReqForm initial={selected} title="Edit Requisition" onSave={handleSaveEdit} onCancel={() => setShowForm(null)} />
      )}
    </AppShell>
  );
}

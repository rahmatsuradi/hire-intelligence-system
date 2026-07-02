"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppShell, Button, Card, Icon, SvgPath, ICON_PATHS, cn, Label, inputClass,
} from "@/components/app-shell";
import {
  type CandidateRecord, type PipelineStage, type JobRequisition, type ImportRow,
  PIPELINE_STAGES, STAGE_LABELS,
  getCandidates, getJobReqs, saveCandidate, deleteCandidate,
  moveCandidateStage, createCandidate, importCandidates, addActivity,
} from "@/lib/store";
import { toast } from "@/components/toast";
import {
  type EmailTemplateKey, TEMPLATE_ORDER, getTemplates, composeEmail, buildMailto,
} from "@/lib/email-templates";
import {
  buildGmailCompose, buildGoogleCalendar, downloadIcs, type CalendarEvent,
} from "@/lib/integrations";

/* ─── Stage colors ─── */

const STAGE_COLORS: Record<PipelineStage, { bg: string; text: string; dot: string; border: string }> = {
  applied: { bg: "bg-slate-50 dark:bg-slate-800/50", text: "text-slate-700 dark:text-slate-300", dot: "bg-slate-400", border: "border-slate-200 dark:border-slate-700" },
  screened: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500", border: "border-blue-200 dark:border-blue-800" },
  interviewed: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500", border: "border-amber-200 dark:border-amber-800" },
  offered: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-300", dot: "bg-purple-500", border: "border-purple-200 dark:border-purple-800" },
  hired: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500", border: "border-emerald-200 dark:border-emerald-800" },
  rejected: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-300", dot: "bg-red-500", border: "border-red-200 dark:border-red-800" },
};

/* ─── Quick utils ─── */

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-purple-500 to-violet-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-sky-600",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ─── Candidate Card ─── */

function CandidateCard({
  candidate,
  onClick,
}: {
  candidate: CandidateRecord;
  onClick: () => void;
}) {
  const score = candidate.cvAnalysis?.overallScore;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-lg border border-slate-200 bg-white p-3.5 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-600"
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white", avatarColor(candidate.name))}>
          {initials(candidate.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{candidate.name}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{candidate.position}</p>
        </div>
        {score !== undefined && (
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
            score >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
              : score >= 60 ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
          )}>
            {score}
          </span>
        )}
      </div>
      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="truncate">{candidate.department || "—"}</span>
        <span className="ml-auto shrink-0">{timeAgo(candidate.updatedAt)}</span>
      </div>
      {candidate.interviewResults.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px]">
          <Icon className="h-3.5 w-3.5 text-amber-500"><SvgPath name="sparkles" /></Icon>
          <span className="text-slate-600 dark:text-slate-400">
            Interview: {candidate.interviewResults[0].avgRating.toFixed(1)}/5
          </span>
        </div>
      )}
    </button>
  );
}

/* ─── Column ─── */

function KanbanColumn({
  stage,
  candidates,
  onCardClick,
  onDrop,
}: {
  stage: PipelineStage;
  candidates: CandidateRecord[];
  onCardClick: (c: CandidateRecord) => void;
  onDrop: (candidateId: string, stage: PipelineStage) => void;
}) {
  const colors = STAGE_COLORS[stage];
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={cn("flex min-w-[280px] flex-col rounded-xl border transition-colors", colors.border, dragOver && "ring-2 ring-blue-400/50")}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDrop(id, stage);
      }}
    >
      <div className={cn("flex items-center gap-2 rounded-t-xl px-4 py-3", colors.bg)}>
        <span className={cn("h-2 w-2 rounded-full", colors.dot)} />
        <span className={cn("text-sm font-semibold", colors.text)}>{STAGE_LABELS[stage]}</span>
        <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums", colors.bg, colors.text)}>
          {candidates.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 300px)" }}>
        {candidates.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">No candidates</p>
        )}
        {candidates.map((c) => (
          <div
            key={c.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
          >
            <CandidateCard candidate={c} onClick={() => onCardClick(c)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Detail Panel ─── */

/* ─── Email compose modal (mailto, zero backend) ─── */

function EmailComposeModal({
  candidate, templateKey, onClose,
}: {
  candidate: CandidateRecord;
  templateKey: EmailTemplateKey;
  onClose: () => void;
}) {
  const composed = useMemo(() => composeEmail(templateKey, candidate), [templateKey, candidate]);
  const label = getTemplates()[templateKey].label;
  const [subject, setSubject] = useState(composed.subject);
  const [body, setBody] = useState(composed.body);
  const hasEmail = Boolean(candidate.email && candidate.email.trim());

  const openInMail = () => {
    if (!hasEmail) { toast("Kandidat ini belum punya alamat email.", "error"); return; }
    window.location.href = buildMailto(candidate.email, subject, body);
    addActivity({ action: "Email disiapkan:", target: `${candidate.name} — ${label}`, type: "create" });
    toast("Membuka aplikasi email…");
    onClose();
  };

  const openInGmail = () => {
    if (!hasEmail) { toast("Kandidat ini belum punya alamat email.", "error"); return; }
    window.open(buildGmailCompose(candidate.email, subject, body), "_blank", "noopener");
    addActivity({ action: "Email disiapkan (Gmail):", target: `${candidate.name} — ${label}`, type: "create" });
    toast("Membuka Gmail…");
    onClose();
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(`Kepada: ${candidate.email || "-"}\nSubjek: ${subject}\n\n${body}`);
      toast("Teks email disalin.");
    } catch { toast("Gagal menyalin.", "error"); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400"><SvgPath name="envelope" /></Icon>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{label}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
            <Icon className="h-5 w-5"><SvgPath name="close" /></Icon>
          </button>
        </div>
        <div className="space-y-3 overflow-y-auto p-5">
          <div>
            <Label htmlFor="em-to">Kepada</Label>
            <input id="em-to" className={cn(inputClass, !hasEmail && "border-red-400")} value={candidate.email || ""} readOnly placeholder="(belum ada email)" />
            {!hasEmail && <p className="mt-1 text-xs text-red-500">Tambah email kandidat dulu (tombol Edit) agar bisa kirim.</p>}
          </div>
          <div>
            <Label htmlFor="em-subject">Subjek</Label>
            <input id="em-subject" className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="em-body">Isi email</Label>
            <textarea id="em-body" className={cn(inputClass, "min-h-[220px]")} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <p className="text-xs text-slate-400">Edit bebas sebelum kirim. Nama perusahaan diatur di Settings.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
          <Button variant="primary" onClick={openInGmail} disabled={!hasEmail}>
            <Icon className="h-4 w-4"><SvgPath name="envelope" /></Icon> Kirim via Gmail
          </Button>
          <Button variant="secondary" onClick={openInMail} disabled={!hasEmail}>
            Aplikasi email
          </Button>
          <Button variant="secondary" onClick={copyText}>Salin teks</Button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={onClose}>Tutup</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Interview scheduling modal (Google Calendar + .ics, zero backend) ─── */

/** Default the picker to the next weekday at 10:00, formatted for datetime-local. */
function defaultInterviewSlot(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  if (d.getDay() === 6) d.setDate(d.getDate() + 2); // Sat → Mon
  if (d.getDay() === 0) d.setDate(d.getDate() + 1); // Sun → Mon
  d.setHours(10, 0, 0, 0);
  // datetime-local wants local time, not UTC — offset the ISO string.
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

function ScheduleInterviewModal({
  candidate, onClose,
}: {
  candidate: CandidateRecord;
  onClose: () => void;
}) {
  const [when, setWhen] = useState(defaultInterviewSlot());
  const [duration, setDuration] = useState(45);
  const [location, setLocation] = useState("Google Meet / Kantor");

  const buildEvent = useCallback((): CalendarEvent | null => {
    const start = new Date(when);
    if (Number.isNaN(start.getTime())) return null;
    const details = [
      `Interview untuk posisi ${candidate.position}${candidate.department ? ` (${candidate.department})` : ""}.`,
      candidate.cvAnalysis ? `Skor CV: ${candidate.cvAnalysis.overallScore} · ${candidate.cvAnalysis.recommendation}` : "",
      "Dijadwalkan via Hire Intelligence.",
    ].filter(Boolean).join("\n");
    return {
      title: `Interview — ${candidate.name} · ${candidate.position}`,
      details,
      location,
      start,
      durationMin: duration,
      guests: candidate.email ? [candidate.email] : [],
    };
  }, [when, duration, location, candidate]);

  const openGoogle = () => {
    const ev = buildEvent();
    if (!ev) { toast("Waktu tidak valid.", "error"); return; }
    window.open(buildGoogleCalendar(ev), "_blank", "noopener");
    addActivity({ action: "Interview dijadwalkan:", target: `${candidate.name} — ${new Date(when).toLocaleString("id-ID")}`, type: "interview" });
    toast("Membuka Google Calendar…");
    onClose();
  };

  const download = () => {
    const ev = buildEvent();
    if (!ev) { toast("Waktu tidak valid.", "error"); return; }
    downloadIcs(ev, `interview-${candidate.name.replace(/\s+/g, "-").toLowerCase()}.ics`);
    addActivity({ action: "Interview dijadwalkan (.ics):", target: `${candidate.name} — ${new Date(when).toLocaleString("id-ID")}`, type: "interview" });
    toast("File kalender diunduh.");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400"><SvgPath name="calendarDays" /></Icon>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Jadwalkan Interview</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
            <Icon className="h-5 w-5"><SvgPath name="close" /></Icon>
          </button>
        </div>
        <div className="space-y-3 p-5">
          <p className="text-sm text-slate-500">
            {candidate.name} · {candidate.position}
            {candidate.email ? <> · undangan dikirim ke <span className="font-medium text-slate-700 dark:text-slate-300">{candidate.email}</span></> : " · (belum ada email kandidat)"}
          </p>
          <div>
            <Label htmlFor="iv-when">Waktu mulai</Label>
            <input id="iv-when" type="datetime-local" className={inputClass} value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="iv-dur">Durasi</Label>
              <select id="iv-dur" className={cn(inputClass, "cursor-pointer")} value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                {[30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} menit</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="iv-loc">Lokasi / Link</Label>
              <input id="iv-loc" className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
          <Button variant="primary" onClick={openGoogle}>
            <Icon className="h-4 w-4"><SvgPath name="calendarDays" /></Icon> Google Calendar
          </Button>
          <Button variant="secondary" onClick={download}>
            <Icon className="h-4 w-4"><SvgPath name="download" /></Icon> Unduh .ics
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={onClose}>Tutup</Button>
        </div>
      </div>
    </div>
  );
}

function DetailPanel({
  candidate,
  reqs,
  onClose,
  onUpdate,
  onDelete,
  onMove,
}: {
  candidate: CandidateRecord;
  reqs: JobRequisition[];
  onClose: () => void;
  onUpdate: (c: CandidateRecord) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, stage: PipelineStage) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(candidate);
  const [composeKey, setComposeKey] = useState<EmailTemplateKey | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => { setForm(candidate); setEditing(false); setComposeKey(null); setShowSchedule(false); }, [candidate]);

  const handleSave = () => {
    const updated = { ...form, updatedAt: new Date().toISOString() };
    saveCandidate(updated);
    onUpdate(updated);
    setEditing(false);
  };

  const stagesWithRejected: PipelineStage[] = [...PIPELINE_STAGES, "rejected"];

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white", avatarColor(candidate.name))}>
          {initials(candidate.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-slate-900 dark:text-white">{candidate.name}</p>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">{candidate.position} &middot; {candidate.department}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
          <Icon className="h-5 w-5"><SvgPath name="close" /></Icon>
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {/* Pipeline stage controls */}
        <div>
          <Label>Pipeline Stage</Label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {stagesWithRejected.map((s) => {
              const sc = STAGE_COLORS[s];
              const active = candidate.stage === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => { if (!active) onMove(candidate.id, s); }}
                  className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-colors", active ? cn(sc.bg, sc.text, "ring-1", sc.border) : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800")}
                >
                  {STAGE_LABELS[s]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Email actions */}
        <div>
          <Label>Kirim Email</Label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {TEMPLATE_ORDER.map((k) => {
              const t = getTemplates()[k];
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setComposeKey(k)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <Icon className="h-3.5 w-3.5"><SvgPath name="envelope" /></Icon>
                  {t.label}
                </button>
              );
            })}
          </div>
          {!candidate.email && (
            <p className="mt-1 text-xs text-slate-400">Kandidat belum punya email — tambahkan via Edit.</p>
          )}
        </div>

        {/* CV analysis summary */}
        {candidate.cvAnalysis && (
          <Card className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-blue-500"><SvgPath name="scan" /></Icon>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">CV Analysis</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{candidate.cvAnalysis.overallScore}</p>
                <p className="text-[10px] text-slate-500">Score</p>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{candidate.cvAnalysis.matchScore}%</p>
                <p className="text-[10px] text-slate-500">Match</p>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{Math.round(candidate.cvAnalysis.confidence)}%</p>
                <p className="text-[10px] text-slate-500">Confidence</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">{candidate.cvAnalysis.summary}</p>
            <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
              candidate.cvAnalysis.recommendation === "Strong Hire" || candidate.cvAnalysis.recommendation === "Hire"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                : candidate.cvAnalysis.recommendation === "Review"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                  : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
            )}>
              {candidate.cvAnalysis.recommendation}
            </span>
          </Card>
        )}

        {/* Interview results */}
        {candidate.interviewResults.length > 0 && (
          <Card className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-amber-500"><SvgPath name="sparkles" /></Icon>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Interview Results</span>
            </div>
            {candidate.interviewResults.map((r) => (
              <div key={r.kitId} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{r.recommendation}</p>
                  <p className="text-[11px] text-slate-500">{r.ratedCount}/{r.questionCount} questions &middot; {Math.floor(r.durationSec / 60)}m</p>
                </div>
                <span className={cn("text-lg font-bold tabular-nums",
                  r.avgRating >= 4 ? "text-emerald-600 dark:text-emerald-400"
                    : r.avgRating >= 3 ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                )}>
                  {r.avgRating.toFixed(1)}
                </span>
              </div>
            ))}
          </Card>
        )}

        {/* Editable fields */}
        {editing ? (
          <Card className="space-y-3">
            <Label htmlFor="edit-name">Name</Label>
            <input id="edit-name" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Label htmlFor="edit-email">Email</Label>
            <input id="edit-email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Label htmlFor="edit-phone">Phone</Label>
            <input id="edit-phone" className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Label htmlFor="edit-position">Position</Label>
            <input id="edit-position" className={inputClass} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            <Label htmlFor="edit-department">Department</Label>
            <input id="edit-department" className={inputClass} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            <Label htmlFor="edit-source">Source</Label>
            <input id="edit-source" className={inputClass} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
            <Label htmlFor="edit-req">Job Requisition</Label>
            <select id="edit-req" className={inputClass} value={form.jobReqId} onChange={(e) => setForm({ ...form, jobReqId: e.target.value })}>
              <option value="">None</option>
              {reqs.map((r) => <option key={r.id} value={r.id}>{r.title} ({r.department})</option>)}
            </select>
            <Label htmlFor="edit-notes">Notes</Label>
            <textarea id="edit-notes" className={cn(inputClass, "min-h-[80px]")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <div className="flex gap-2 pt-1">
              <Button variant="primary" onClick={handleSave}>Save</Button>
              <Button onClick={() => { setForm(candidate); setEditing(false); }}>Cancel</Button>
            </div>
          </Card>
        ) : (
          <Card className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Details</span>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                <Icon className="h-3.5 w-3.5"><SvgPath name="pencil" /></Icon> Edit
              </Button>
            </div>
            {[
              ["Email", candidate.email],
              ["Phone", candidate.phone],
              ["Source", candidate.source],
              ["Created", new Date(candidate.createdAt).toLocaleDateString()],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">{label}</span>
                <span className="font-medium text-slate-900 dark:text-white">{value || "—"}</span>
              </div>
            ))}
            {candidate.notes && (
              <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {candidate.notes}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
        <Button variant="ghost" size="sm" onClick={() => setShowSchedule(true)}>
          <Icon className="h-4 w-4"><SvgPath name="calendarDays" /></Icon> Schedule
        </Button>
        <Button variant="ghost" size="sm" onClick={() => {
          window.open(`/interview?candidate=${candidate.id}`, "_self");
        }}>
          <Icon className="h-4 w-4"><SvgPath name="workspace" /></Icon> Interview
        </Button>
        <Button variant="ghost" size="sm" onClick={() => {
          window.open(`/cv-analyzer?candidate=${candidate.id}`, "_self");
        }}>
          <Icon className="h-4 w-4"><SvgPath name="scan" /></Icon> Analyze CV
        </Button>
        <div className="flex-1" />
        <Button variant="danger" size="sm" onClick={() => {
          if (confirm(`Delete ${candidate.name}?`)) onDelete(candidate.id);
        }}>
          <Icon className="h-4 w-4"><SvgPath name="trash" /></Icon>
        </Button>
      </div>

      {composeKey && (
        <EmailComposeModal candidate={candidate} templateKey={composeKey} onClose={() => setComposeKey(null)} />
      )}
      {showSchedule && (
        <ScheduleInterviewModal candidate={candidate} onClose={() => setShowSchedule(false)} />
      )}
    </div>
  );
}

/* ─── Add Candidate Modal ─── */

function AddCandidateModal({
  reqs,
  onClose,
  onAdd,
}: {
  reqs: JobRequisition[];
  onClose: () => void;
  onAdd: (c: CandidateRecord) => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", position: "", department: "", source: "Manual", jobReqId: "" });

  const emailValid = form.email.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const canSubmit = form.name.trim() !== "" && form.position.trim() !== "" && emailValid;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const c = createCandidate(form);
    onAdd(c);
    toast(`${c.name} added to pipeline`);
  };

  const handleReqChange = (reqId: string) => {
    const req = reqs.find((r) => r.id === reqId);
    setForm({
      ...form,
      jobReqId: reqId,
      position: req ? req.title : form.position,
      department: req ? req.department : form.department,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Add Candidate</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Icon className="h-5 w-5"><SvgPath name="close" /></Icon>
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <Label htmlFor="add-req">Link to Job Requisition</Label>
            <select id="add-req" className={inputClass} value={form.jobReqId} onChange={(e) => handleReqChange(e.target.value)}>
              <option value="">None</option>
              {reqs.filter((r) => r.status === "active").map((r) => <option key={r.id} value={r.id}>{r.title} ({r.department})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="add-name">Full Name *</Label>
              <input id="add-name" className={inputClass} placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="add-email">Email</Label>
              <input id="add-email" type="email" className={cn(inputClass, !emailValid && "border-red-400 focus:border-red-500 focus:ring-red-500/25")} placeholder="john@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {!emailValid && <p className="mt-1 text-xs text-red-500">Invalid email format</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="add-position">Position *</Label>
              <input id="add-position" className={inputClass} placeholder="Software Engineer" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="add-dept">Department</Label>
              <input id="add-dept" className={inputClass} placeholder="Engineering" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="add-phone">Phone</Label>
              <input id="add-phone" className={inputClass} placeholder="+62..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="add-source">Source</Label>
              <select id="add-source" className={inputClass} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                {["Manual", "LinkedIn", "Referral", "Job Board", "Career Site", "Agency", "CV Analyzer"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
            <Icon className="h-4 w-4"><SvgPath name="plus" /></Icon> Add Candidate
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── CSV Import ─── */

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      out.push(cur); cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseCsv(text: string): ImportRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];
  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (names: string[]) => header.findIndex((h) => names.includes(h));
  const iName = idx(["name", "nama", "full name", "candidate"]);
  const iEmail = idx(["email", "e-mail"]);
  const iPhone = idx(["phone", "telepon", "hp", "telp", "mobile"]);
  const iPos = idx(["position", "posisi", "role", "job", "jabatan"]);
  const iDept = idx(["department", "departemen", "dept", "divisi"]);
  const iSrc = idx(["source", "sumber"]);
  const hasHeader = iName !== -1 || iPos !== -1;
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const get = (cols: string[], i: number) => (i >= 0 && i < cols.length ? cols[i] : "");
  return dataLines.map((line) => {
    const cols = splitCsvLine(line);
    if (hasHeader) {
      return {
        name: get(cols, iName), email: get(cols, iEmail), phone: get(cols, iPhone),
        position: get(cols, iPos), department: get(cols, iDept), source: get(cols, iSrc),
      };
    }
    return { name: cols[0] ?? "", email: cols[1] ?? "", phone: cols[2] ?? "", position: cols[3] ?? "", department: cols[4] ?? "", source: cols[5] ?? "" };
  });
}

const CSV_TEMPLATE = "name,email,phone,position,department,source\nJohn Doe,john@example.com,+62812000111,Software Engineer,Engineering,LinkedIn\nJane Smith,jane@example.com,+62813000222,Product Manager,Product,Referral";

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ImportCsvModal({ onClose, onImported }: { onClose: () => void; onImported: (n: number) => void }) {
  const [raw, setRaw] = useState("");
  const rows = useMemo(() => parseCsv(raw), [raw]);
  const valid = useMemo(() => rows.filter((r) => r.name?.trim() && r.position?.trim()), [rows]);
  const invalid = rows.length - valid.length;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result ?? ""));
    reader.readAsText(f);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 py-10 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Import Candidates from CSV</h2>
            <p className="mt-0.5 text-sm text-slate-500">Upload a .csv file or paste rows below. Columns: name, email, phone, position, department, source.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Icon className="h-5 w-5"><SvgPath name="close" /></Icon>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
            <Icon className="h-4 w-4"><SvgPath name="upload" /></Icon>
            Choose .csv file
            <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
          </label>
          <button type="button" onClick={() => triggerDownload(CSV_TEMPLATE, "candidates-template.csv")} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            Download template
          </button>
        </div>

        <div className="mt-3">
          <Label htmlFor="csv-paste">Or paste CSV</Label>
          <textarea
            id="csv-paste"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={CSV_TEMPLATE}
            className={cn(inputClass, "min-h-[120px] font-mono text-xs")}
          />
        </div>

        {rows.length > 0 && (
          <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-xs dark:border-slate-800">
              <span className="font-medium text-slate-700 dark:text-slate-300">Preview</span>
              <span className="text-slate-500">
                {valid.length} valid{invalid > 0 ? ` · ${invalid} skipped (missing name/position)` : ""}
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80">
                  <tr className="text-slate-500">
                    <th className="px-3 py-1.5 font-medium">Name</th>
                    <th className="px-3 py-1.5 font-medium">Position</th>
                    <th className="px-3 py-1.5 font-medium">Department</th>
                    <th className="px-3 py-1.5 font-medium">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.slice(0, 50).map((r, i) => {
                    const ok = r.name?.trim() && r.position?.trim();
                    return (
                      <tr key={i} className={cn(!ok && "opacity-40")}>
                        <td className="px-3 py-1.5 text-slate-700 dark:text-slate-300">{r.name || <span className="text-red-500">—</span>}</td>
                        <td className="px-3 py-1.5 text-slate-700 dark:text-slate-300">{r.position || <span className="text-red-500">—</span>}</td>
                        <td className="px-3 py-1.5 text-slate-500">{r.department || "—"}</td>
                        <td className="px-3 py-1.5 text-slate-500">{r.email || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onImported(importCandidates(valid))} disabled={valid.length === 0}>
            <Icon className="h-4 w-4"><SvgPath name="plus" /></Icon>
            Import {valid.length > 0 ? valid.length : ""} candidate{valid.length === 1 ? "" : "s"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function CandidatesPage() {
  const [allCandidates, setAllCandidates] = useState<CandidateRecord[]>([]);
  const [reqs, setReqs] = useState<JobRequisition[]>([]);
  const [selected, setSelected] = useState<CandidateRecord | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [showRejected, setShowRejected] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [showImport, setShowImport] = useState(false);

  const reload = useCallback(() => {
    setAllCandidates(getCandidates());
    setReqs(getJobReqs());
  }, []);

  useEffect(reload, [reload]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dept = params.get("dept");
    if (dept) setFilterDept(dept);
  }, []);

  const departments = useMemo(() => {
    const s = new Set(allCandidates.map((c) => c.department).filter(Boolean));
    return Array.from(s).sort();
  }, [allCandidates]);

  const filtered = useMemo(() => {
    let list = allCandidates;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.position.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }
    if (filterDept) list = list.filter((c) => c.department === filterDept);
    return list;
  }, [allCandidates, search, filterDept]);

  const byStage = useMemo(() => {
    const map: Record<PipelineStage, CandidateRecord[]> = {
      applied: [], screened: [], interviewed: [], offered: [], hired: [], rejected: [],
    };
    for (const c of filtered) map[c.stage].push(c);
    return map;
  }, [filtered]);

  const handleMove = useCallback((id: string, stage: PipelineStage) => {
    moveCandidateStage(id, stage);
    reload();
    if (selected?.id === id) setSelected(getCandidates().find((c) => c.id === id) ?? null);
    toast(`Moved to ${STAGE_LABELS[stage]}`, "info");
  }, [reload, selected]);

  const handleDelete = useCallback((id: string) => {
    const name = getCandidates().find((c) => c.id === id)?.name ?? "Candidate";
    deleteCandidate(id);
    if (selected?.id === id) setSelected(null);
    reload();
    toast(`${name} deleted`, "info");
  }, [reload, selected]);

  const handleImported = useCallback((n: number) => {
    setShowImport(false);
    reload();
    toast(n > 0 ? `Imported ${n} candidate${n === 1 ? "" : "s"}` : "No valid rows to import", n > 0 ? "success" : "error");
  }, [reload]);

  const handleExportCsv = useCallback(() => {
    if (allCandidates.length === 0) { toast("No candidates to export", "error"); return; }
    const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["name", "email", "phone", "position", "department", "source", "stage", "cvScore", "recommendation"];
    const lines = [header.join(",")];
    for (const c of allCandidates) {
      lines.push([
        c.name, c.email, c.phone, c.position, c.department, c.source,
        STAGE_LABELS[c.stage], c.cvAnalysis?.overallScore ?? "", c.cvAnalysis?.recommendation ?? "",
      ].map(esc).join(","));
    }
    triggerDownload(lines.join("\n"), `candidates-${new Date().toISOString().slice(0, 10)}.csv`);
    toast(`Exported ${allCandidates.length} candidates to CSV`);
  }, [allCandidates]);

  const totalActive = allCandidates.filter((c) => c.stage !== "hired" && c.stage !== "rejected").length;

  const stagesToShow: PipelineStage[] = showRejected ? [...PIPELINE_STAGES, "rejected"] : PIPELINE_STAGES;

  return (
    <AppShell activeNavId="candidates" title="Candidates" subtitle={`${allCandidates.length} total · ${totalActive} active in pipeline`}
      headerActions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowImport(true)}>
            <Icon className="h-4 w-4"><SvgPath name="upload" /></Icon>
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button variant="secondary" onClick={handleExportCsv}>
            <Icon className="h-4 w-4"><SvgPath name="download" /></Icon>
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button variant="primary" onClick={() => setShowAdd(true)}>
            <Icon className="h-4 w-4"><SvgPath name="plus" /></Icon>
            <span className="hidden sm:inline">Add Candidate</span>
          </Button>
        </div>
      }>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"><SvgPath name="search" /></Icon>
          <input className={cn(inputClass, "pl-9")} placeholder="Search candidates..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={cn(inputClass, "w-auto min-w-[150px]")} value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
          <input type="checkbox" checked={showRejected} onChange={(e) => setShowRejected(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600" />
          Rejected
        </label>
        <div className="ml-auto flex rounded-lg border border-slate-200 dark:border-slate-700">
          {(["kanban", "table"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setViewMode(m)}
              className={cn("px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg",
                viewMode === m ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800")}
            >
              {m === "kanban" ? "Kanban" : "Table"}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stagesToShow.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              candidates={byStage[stage]}
              onCardClick={setSelected}
              onDrop={handleMove}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <Card padding={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <tr>
                  {["Name", "Position", "Department", "Stage", "Score", "Updated"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.filter((c) => showRejected || c.stage !== "rejected").map((c) => {
                  const sc = STAGE_COLORS[c.stage];
                  return (
                    <tr key={c.id} className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => setSelected(c)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-semibold text-white", avatarColor(c.name))}>
                            {initials(c.name)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{c.name}</p>
                            <p className="text-xs text-slate-500">{c.email || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{c.position}</td>
                      <td className="px-4 py-3 text-slate-500">{c.department || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", sc.bg, sc.text)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
                          {STAGE_LABELS[c.stage]}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{c.cvAnalysis?.overallScore ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{timeAgo(c.updatedAt)}</td>
                    </tr>
                  );
                })}
                {filtered.filter((c) => showRejected || c.stage !== "rejected").length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                      No candidates found. <button type="button" className="text-blue-600 hover:underline" onClick={() => setShowAdd(true)}>Add one</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detail Side Panel */}
      {selected && (
        <DetailPanel
          candidate={selected}
          reqs={reqs}
          onClose={() => setSelected(null)}
          onUpdate={(c) => { setSelected(c); reload(); }}
          onDelete={handleDelete}
          onMove={handleMove}
        />
      )}

      {/* Add Modal */}
      {showAdd && (
        <AddCandidateModal
          reqs={reqs}
          onClose={() => setShowAdd(false)}
          onAdd={(c) => { setShowAdd(false); reload(); setSelected(c); }}
        />
      )}

      {/* Import Modal */}
      {showImport && (
        <ImportCsvModal onClose={() => setShowImport(false)} onImported={handleImported} />
      )}
    </AppShell>
  );
}

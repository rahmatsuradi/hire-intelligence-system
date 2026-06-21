"use client";
import { AppShell, Icon, SvgPath, Card } from "@/components/app-shell";

const INTEGRATIONS = [
  { name: "Workday", category: "ATS / HRIS", desc: "Sync candidates and job reqs bidirectionally.", icon: "briefcase", soon: true },
  { name: "Greenhouse", category: "ATS", desc: "Import pipelines and export AI analysis results.", icon: "briefcase", soon: true },
  { name: "BambooHR", category: "HRIS", desc: "Push hire decisions and onboarding triggers.", icon: "users", soon: true },
  { name: "Slack", category: "Collaboration", desc: "Get notified on new candidates and hiring decisions.", icon: "bell", soon: true },
  { name: "Google Calendar", category: "Scheduling", desc: "Auto-schedule interview slots from the workspace.", icon: "calendarDays", soon: true },
  { name: "DocuSign", category: "E-Signature", desc: "Send offer letters for e-signature after approval.", icon: "document", soon: true },
];

export default function IntegrationsPage() {
  return (
    <AppShell activeNavId="integrations" title="Integrations" subtitle="Connect your hiring stack">
      <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 px-6 py-5 dark:border-blue-500/20 dark:bg-blue-500/5">
        <div className="flex items-start gap-4">
          <Icon className="h-6 w-6 shrink-0 text-blue-500 dark:text-blue-400"><SvgPath name="sparkles" /></Icon>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Integrations coming in v1.1</p>
            <p className="mt-1 text-sm text-slate-500">
              Native connectors to major ATS, HRIS, scheduling, and e-signature platforms are in active development.
              Each integration will support two-way sync with your existing hiring stack.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {INTEGRATIONS.map((intg) => (
          <Card key={intg.name} className="flex flex-col gap-3 opacity-70">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <Icon className="h-5 w-5 text-slate-500"><SvgPath name={intg.icon as "briefcase"} /></Icon>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{intg.name}</p>
                <p className="text-xs text-slate-400">{intg.category}</p>
              </div>
              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-800">Soon</span>
            </div>
            <p className="text-sm text-slate-500">{intg.desc}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

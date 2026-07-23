/* ═══════════════════════════════════════════════════════════════════════════
   PUBLIC single-role apply page. No AppShell, no auth.
   Server component: loads the role (service-role key); if missing or not open,
   shows an "unavailable" state. Otherwise renders the client apply form.
═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import type { Metadata } from "next";
import { getOpenRole } from "@/lib/apply-roles";
import { ApplyForm } from "./apply-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  { params }: { params: Promise<{ jobReqId: string }> },
): Promise<Metadata> {
  const { jobReqId } = await params;
  const role = await getOpenRole(jobReqId);
  return {
    title: role ? `Apply — ${role.title}` : "Position unavailable",
    description: role?.description?.slice(0, 150) || "Apply for this position.",
  };
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-5 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
            <span className="text-base font-bold tracking-tight">HI</span>
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900 dark:text-white">Careers</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Apply online</p>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">{children}</div>
      <footer className="mx-auto max-w-2xl px-4 pb-10 text-center text-xs text-slate-400 dark:text-slate-500 sm:px-6">
        &copy; 2026 People Intelligence · Careers
      </footer>
    </main>
  );
}

export default async function ApplyRolePage({
  params,
  searchParams,
}: {
  params: Promise<{ jobReqId: string }>;
  searchParams: Promise<{ src?: string | string[] }>;
}) {
  const { jobReqId } = await params;
  const { src } = await searchParams;
  const source = (Array.isArray(src) ? src[0] : src)?.trim().slice(0, 40) || "Apply Link";

  const role = await getOpenRole(jobReqId);

  if (!role) {
    return (
      <Shell>
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <span className="text-xl" aria-hidden>🔍</span>
          </div>
          <h1 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Lowongan tidak tersedia</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Lowongan yang kamu cari tidak ditemukan atau sudah tidak menerima lamaran.
          </p>
          <Link
            href="/apply"
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Lihat lowongan lain
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Link
        href="/apply"
        className="mb-5 inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
      >
        <span aria-hidden>←</span> Semua lowongan
      </Link>

      {/* Role header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">{role.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
          {role.department && <span>{role.department}</span>}
          {role.level && <span aria-hidden>·</span>}
          {role.level && <span>{role.level}</span>}
          {role.location && <span aria-hidden>·</span>}
          {role.location && <span>{role.location}</span>}
        </div>

        {role.description && (
          <div className="mt-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Deskripsi</h2>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {role.description}
            </p>
          </div>
        )}

        {role.requirements && (
          <div className="mt-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Kualifikasi</h2>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {role.requirements}
            </p>
          </div>
        )}
      </div>

      {/* Apply form */}
      <div className="mt-6">
        <ApplyForm jobReqId={role.id} roleTitle={role.title} source={source} />
      </div>
    </Shell>
  );
}

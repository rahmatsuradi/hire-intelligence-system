/* ═══════════════════════════════════════════════════════════════════════════
   PUBLIC job board — lists every open role. No AppShell, no auth.
   Server component: reads open roles server-side (service-role key).
═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import type { Metadata } from "next";
import { getOpenRoles } from "@/lib/apply-roles";

export const metadata: Metadata = {
  title: "Open Positions — Careers",
  description: "Browse our open roles and apply online.",
};

// Roles change over time — always render fresh, never statically cache.
export const dynamic = "force-dynamic";

export default async function ApplyListingPage() {
  const roles = await getOpenRoles();

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
            <span className="text-base font-bold tracking-tight">HI</span>
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900 dark:text-white">Careers</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Open positions — apply online</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Join our team
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {roles.length > 0
            ? `${roles.length} open ${roles.length === 1 ? "position" : "positions"}. Pick a role to apply.`
            : "We don't have any open positions right now — check back soon."}
        </p>

        {roles.length > 0 ? (
          <ul className="mt-8 space-y-3">
            {roles.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/apply/${r.id}`}
                  className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-600/60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                        {r.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                        {r.department && <span>{r.department}</span>}
                        {r.level && <span aria-hidden>·</span>}
                        {r.level && <span>{r.level}</span>}
                        {r.location && <span aria-hidden>·</span>}
                        {r.location && <span>{r.location}</span>}
                      </div>
                    </div>
                    <span className="mt-1 shrink-0 text-blue-600 transition-transform group-hover:translate-x-0.5 dark:text-blue-400" aria-hidden>
                      →
                    </span>
                  </div>
                  {r.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                      {r.description}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">No open positions at the moment.</p>
          </div>
        )}
      </div>

      <footer className="mx-auto max-w-3xl px-4 pb-10 text-center text-xs text-slate-400 dark:text-slate-500 sm:px-6">
        &copy; 2026 People Intelligence · Careers
      </footer>
    </main>
  );
}

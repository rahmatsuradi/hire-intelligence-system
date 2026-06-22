"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   Lightweight toast system — no provider wiring needed.
   Call toast("Saved") from anywhere; <Toaster /> (mounted in AppShell) renders.
═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let counter = 0;

export function toast(message: string, type: ToastType = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("hi:toast", { detail: { id: ++counter, message, type } }),
  );
}

const ICON: Record<ToastType, string> = {
  success: "M4.5 12.75l6 6 9-13.5",
  error: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
  info: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z",
};

const STYLES: Record<ToastType, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950 dark:text-emerald-200",
  error: "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-950 dark:text-red-200",
  info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-950 dark:text-blue-200",
};

const ICON_COLOR: Record<ToastType, string> = {
  success: "text-emerald-500",
  error: "text-red-500",
  info: "text-blue-500",
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ToastItem;
      setItems((list) => [...list, detail]);
      setTimeout(() => remove(detail.id), 4000);
    };
    window.addEventListener("hi:toast", handler);
    return () => window.removeEventListener("hi:toast", handler);
  }, [remove]);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-xs flex-col gap-2" aria-live="polite" role="status">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg shadow-slate-900/5 ${STYLES[t.type]}`}
          style={{ animation: "hi-toast-in 0.2s ease-out" }}
        >
          <svg className={`mt-0.5 h-4 w-4 shrink-0 ${ICON_COLOR[t.type]}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d={ICON[t.type]} />
          </svg>
          <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
          <button type="button" onClick={() => remove(t.id)} aria-label="Dismiss" className="shrink-0 opacity-60 hover:opacity-100">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <style>{`@keyframes hi-toast-in{from{opacity:0;transform:translateX(1rem)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  );
}

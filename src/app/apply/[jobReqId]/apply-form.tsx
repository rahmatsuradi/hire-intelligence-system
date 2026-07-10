"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   Public apply form. Standalone (no AppShell). Uploads a CV to /api/apply via
   multipart on button click (no <form> reload). Shows loading → success.
   NEVER shows the candidate any score / recommendation / internal analysis.
═══════════════════════════════════════════════════════════════════════════ */

import { useRef, useState } from "react";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

export function ApplyForm({
  jobReqId,
  roleTitle,
  source,
}: {
  jobReqId: string;
  roleTitle: string;
  source: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | null) => {
    setError("");
    if (!f) { setFile(null); return; }
    if (!f.name.toLowerCase().endsWith(".pdf") && f.type !== "application/pdf") {
      setError("File harus berformat PDF.");
      setFile(null);
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setError("File terlalu besar (maksimal 10MB).");
      setFile(null);
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    setError("");

    if (!name.trim()) { setError("Nama lengkap wajib diisi."); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Email valid wajib diisi.");
      return;
    }
    if (!file) { setError("Unggah CV dalam format PDF terlebih dahulu."); return; }

    setStatus("submitting");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", name.trim());
      fd.append("email", email.trim());
      fd.append("phone", phone.trim());
      fd.append("jobReqId", jobReqId);
      fd.append("src", source);

      const res = await fetch("/api/apply", { method: "POST", body: fd });
      let json: { success?: boolean; error?: string } | null = null;
      try { json = await res.json(); } catch { /* non-JSON = server overloaded */ }

      if (!res.ok || !json?.success) {
        setError(json?.error ?? "Terjadi kesalahan saat mengirim lamaran. Coba lagi.");
        setStatus("idle");
        return;
      }
      setStatus("success");
    } catch {
      setError("Gagal terhubung ke server. Periksa koneksi dan coba lagi.");
      setStatus("idle");
    }
  };

  /* ─── Success screen — deliberately shows NO analysis ─── */
  if (status === "success") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-white px-6 py-14 text-center shadow-sm dark:border-emerald-500/30 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
          <span className="text-2xl" aria-hidden>✓</span>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Lamaran diterima, terima kasih!</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Lamaranmu untuk posisi <span className="font-medium text-slate-700 dark:text-slate-300">{roleTitle}</span> sudah
          kami terima. Tim rekrutmen akan meninjau dan menghubungimu jika kualifikasimu sesuai.
        </p>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">Lamar posisi ini</h2>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Isi data diri dan unggah CV dalam format PDF.</p>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="apply-name" className={labelClass}>Nama lengkap <span className="text-red-500">*</span></label>
          <input
            id="apply-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Nama sesuai KTP" autoComplete="name" disabled={submitting} className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="apply-email" className={labelClass}>Email <span className="text-red-500">*</span></label>
          <input
            id="apply-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com" autoComplete="email" disabled={submitting} className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="apply-phone" className={labelClass}>Nomor telepon <span className="text-slate-400">(opsional)</span></label>
          <input
            id="apply-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="08xxxxxxxxxx" autoComplete="tel" disabled={submitting} className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>CV (PDF) <span className="text-red-500">*</span></label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={submitting}
            className="flex w-full items-center gap-3 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 px-4 py-4 text-left transition-colors hover:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800/30 dark:hover:border-blue-500"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg dark:bg-slate-800" aria-hidden>📄</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                {file ? file.name : "Pilih file PDF"}
              </span>
              <span className="block text-xs text-slate-400">
                {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "PDF · maks 10MB"}
              </span>
            </span>
          </button>
          <input
            ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="sr-only"
            onChange={(e) => { pickFile(e.target.files?.[0] ?? null); e.target.value = ""; }}
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:pointer-events-none disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Mengirim lamaran…
            </>
          ) : (
            "Kirim lamaran"
          )}
        </button>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          Dengan mengirim, kamu setuju datamu diproses untuk keperluan rekrutmen.
        </p>
      </div>
    </div>
  );
}

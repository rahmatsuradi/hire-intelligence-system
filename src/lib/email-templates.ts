/* ═══════════════════════════════════════════════════════════════════════════
   Email templates for candidate communication.
   Zero-backend: we build a filled subject/body and open the user's own mail
   client via a mailto: link (or let them copy the text). Templates are in
   Indonesian by default and fully editable (stored in localStorage).

   Placeholders: {{name}} {{position}} {{company}} {{sender}}
═══════════════════════════════════════════════════════════════════════════ */

export type EmailTemplateKey = "invite" | "reject" | "offer";

export interface EmailTemplate {
  key: EmailTemplateKey;
  label: string;
  subject: string;
  body: string;
}

export const TEMPLATE_ORDER: EmailTemplateKey[] = ["invite", "reject", "offer"];

export const DEFAULT_TEMPLATES: Record<EmailTemplateKey, EmailTemplate> = {
  invite: {
    key: "invite",
    label: "Undangan Interview",
    subject: "Undangan Interview — {{position}} di {{company}}",
    body:
`Yth. {{name}},

Terima kasih telah melamar posisi {{position}} di {{company}}. Kami tertarik dengan profil Anda dan ingin mengundang Anda untuk mengikuti tahap interview.

Mohon informasikan ketersediaan waktu Anda dalam beberapa hari ke depan, dan kami akan mengatur jadwal yang sesuai.

Kami menantikan kesempatan untuk berbincang dengan Anda.

Hormat kami,
{{sender}}
{{company}}
{{companyEmail}}`,
  },
  reject: {
    key: "reject",
    label: "Penolakan Halus",
    subject: "Kabar mengenai lamaran Anda — {{position}}",
    body:
`Yth. {{name}},

Terima kasih atas ketertarikan dan waktu yang Anda luangkan untuk melamar posisi {{position}} di {{company}}.

Setelah mempertimbangkan dengan saksama, untuk saat ini kami memutuskan melanjutkan proses dengan kandidat lain yang lebih sesuai dengan kebutuhan kami. Keputusan ini tidak mudah, mengingat banyaknya pelamar berkualitas.

Kami sangat menghargai minat Anda terhadap {{company}} dan mendorong Anda untuk melamar kembali pada lowongan mendatang yang sesuai. Kami mendoakan yang terbaik untuk karier Anda.

Salam hormat,
{{sender}}
{{company}}
{{companyEmail}}`,
  },
  offer: {
    key: "offer",
    label: "Penawaran Kerja",
    subject: "Penawaran Kerja — {{position}} di {{company}}",
    body:
`Yth. {{name}},

Dengan senang hati kami menawarkan posisi {{position}} di {{company}} kepada Anda!

Keterampilan dan pengalaman Anda menonjol sepanjang proses seleksi, dan kami yakin Anda akan menjadi bagian berharga dari tim kami.

Kami akan segera mengirimkan detail penawaran lengkap, termasuk kompensasi, tanggal mulai, dan langkah berikutnya. Jangan ragu menghubungi kami bila ada pertanyaan.

Selamat, dan selamat bergabung!

Hormat kami,
{{sender}}
{{company}}
{{companyEmail}}`,
  },
};

const TEMPLATES_KEY = "hi_email_templates";
const COMPANY_KEY = "hi_company_name";
const COMPANY_EMAIL_KEY = "hi_company_email";
const USER_NAME_KEY = "hi_user_name";

export function fillTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? `{{${k}}}`);
}

/** Templates with any saved per-key overrides applied. */
export function getTemplates(): Record<EmailTemplateKey, EmailTemplate> {
  const merged = { ...DEFAULT_TEMPLATES };
  if (typeof window === "undefined") return merged;
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Record<EmailTemplateKey, Partial<EmailTemplate>>>;
      for (const key of TEMPLATE_ORDER) {
        if (saved[key]) merged[key] = { ...merged[key], ...saved[key], key };
      }
    }
  } catch { /* fall back to defaults */ }
  return merged;
}

export function saveTemplate(key: EmailTemplateKey, subject: string, body: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    const saved = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    saved[key] = { subject, body };
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(saved));
  } catch { /* quota — ignore */ }
}

export function getCompanyName(): string {
  if (typeof window === "undefined") return "perusahaan kami";
  return localStorage.getItem(COMPANY_KEY)?.trim() || "perusahaan kami";
}

export function setCompanyName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMPANY_KEY, name.trim());
}

export function getCompanyEmail(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(COMPANY_EMAIL_KEY)?.trim() || "";
}

export function setCompanyEmail(email: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMPANY_EMAIL_KEY, email.trim());
}

function getSenderName(): string {
  if (typeof window === "undefined") return "Tim Rekrutmen";
  return localStorage.getItem(USER_NAME_KEY)?.trim() || "Tim Rekrutmen";
}

export interface ComposedEmail {
  to: string;
  subject: string;
  body: string;
}

/** Fill a template for a candidate, returning ready-to-send subject + body. */
export function composeEmail(
  key: EmailTemplateKey,
  candidate: { name: string; email: string; position: string; department?: string },
): ComposedEmail {
  const tpl = getTemplates()[key];
  const vars = {
    name: candidate.name,
    position: candidate.position,
    company: getCompanyName(),
    companyEmail: getCompanyEmail(),
    sender: getSenderName(),
    department: candidate.department ?? "",
  };
  return {
    to: candidate.email,
    subject: fillTemplate(tpl.subject, vars),
    // trimEnd so an unset {{companyEmail}} doesn't leave a trailing blank line
    body: fillTemplate(tpl.body, vars).replace(/\s+$/, ""),
  };
}

export function buildMailto(to: string, subject: string, body: string): string {
  const params = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return `mailto:${encodeURIComponent(to)}?${params}`;
}

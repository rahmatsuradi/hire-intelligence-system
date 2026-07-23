import type { PayslipData, PayslipLine } from "./payslip";

const BULAN_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  const idx = Number(month) - 1;
  const namaBulan = BULAN_ID[idx] ?? month;
  return `${namaBulan} ${year}`;
}

function rupiah(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(Math.round(amount));
  return `${sign}Rp ${abs.toLocaleString("id-ID")}`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rows(lines: PayslipLine[]): string {
  return lines
    .map((l) => `<tr><td>${esc(l.label)}</td><td class="num">${rupiah(l.amount)}</td></tr>`)
    .join("");
}

// Render slip gaji sebagai dokumen HTML mandiri, siap cetak (print-to-PDF via browser).
// Tanpa dependensi eksternal — semua CSS inline. Aman untuk file lokal / route Next.js.
export function renderPayslipHTML(slip: PayslipData): string {
  const e = slip.employee;
  const netLabel = "Gaji Bersih"; // sengaja BUKAN "Take Home Pay" bahkan saat otherDeductions
  //                                 diisi -- HR mungkin belum mencatat SEMUA potongan non-statutori.
  const netDisclaimer = slip.hasOtherDeductions
    ? `Nilai "${netLabel}" mencakup potongan statutori (BPJS &amp; PPh 21) dan potongan lain yang tercatat.`
    : `Nilai "${netLabel}" mencakup potongan statutori (BPJS &amp; PPh 21) saja.`;
  const reconNote = slip.isDecemberReconciliation
    ? `<div class="recon-note">Masa Desember: PPh 21 dihitung via rekonsiliasi tahunan (Pasal 17), bukan TER bulanan.</div>`
    : "";

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Slip Gaji — ${esc(e.name)} — ${esc(formatPeriod(slip.period))}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 24px; background: #f4f4f5; }
  .slip { max-width: 720px; margin: 0 auto; background: #fff; padding: 32px 36px; border: 1px solid #e4e4e7; border-radius: 8px; }
  .confidential { text-align: right; font-size: 11px; letter-spacing: .08em; color: #b91c1c; font-weight: 700; text-transform: uppercase; }
  header.co { border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 16px; }
  header.co .name { font-size: 20px; font-weight: 700; }
  header.co .addr { font-size: 12px; color: #52525b; margin-top: 2px; }
  h1 { font-size: 16px; margin: 16px 0 4px; }
  .period { font-size: 13px; color: #52525b; margin-bottom: 16px; }
  .emp { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; font-size: 12.5px; margin-bottom: 20px; }
  .emp .row { display: flex; justify-content: space-between; border-bottom: 1px dotted #e4e4e7; padding: 3px 0; }
  .emp .k { color: #71717a; }
  .emp .v { font-weight: 600; text-align: right; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  section h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: #3f3f46; border-bottom: 1px solid #d4d4d8; padding-bottom: 4px; margin: 0 0 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  td { padding: 4px 0; vertical-align: top; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  tr.total td { border-top: 1px solid #d4d4d8; font-weight: 700; padding-top: 6px; }
  .net { margin-top: 20px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
  .net .label { font-weight: 700; font-size: 14px; }
  .net .amount { font-weight: 700; font-size: 20px; font-variant-numeric: tabular-nums; }
  .employer { margin-top: 20px; }
  .employer .note { font-size: 11px; color: #71717a; font-style: italic; margin-bottom: 6px; }
  .recon-note { font-size: 11px; color: #92400e; background: #fffbeb; border: 1px solid #fde68a; border-radius: 4px; padding: 6px 10px; margin-top: 12px; }
  footer { margin-top: 28px; border-top: 1px solid #e4e4e7; padding-top: 12px; }
  .sign { display: flex; justify-content: space-between; font-size: 12px; margin-top: 8px; }
  .sign .box { width: 45%; }
  .sign .line { border-bottom: 1px solid #a1a1aa; height: 40px; margin-bottom: 4px; }
  .disclaimer { font-size: 10.5px; color: #a1a1aa; margin-top: 16px; text-align: center; }
  @media print {
    body { background: #fff; padding: 0; }
    .slip { border: none; border-radius: 0; max-width: none; }
  }
</style>
</head>
<body>
<div class="slip">
  <div class="confidential">Rahasia &middot; Private &amp; Confidential</div>
  <header class="co">
    <div class="name">${esc(slip.company.name)}</div>
    <div class="addr">${esc(slip.company.address)}</div>
  </header>

  <h1>Slip Gaji</h1>
  <div class="period">Periode ${esc(formatPeriod(slip.period))}</div>

  <div class="emp">
    <div class="row"><span class="k">Nama</span><span class="v">${esc(e.name)}</span></div>
    <div class="row"><span class="k">Departemen</span><span class="v">${esc(e.department)}</span></div>
    <div class="row"><span class="k">Status Kerja</span><span class="v">${esc(e.employmentType)}</span></div>
    <div class="row"><span class="k">Status PTKP</span><span class="v">${esc(e.ptkpStatus)}</span></div>
    <div class="row"><span class="k">NPWP</span><span class="v">${esc(e.npwpMasked)}</span></div>
    <div class="row"><span class="k">NIK</span><span class="v">${esc(e.nikMasked)}</span></div>
    <div class="row"><span class="k">Rekening</span><span class="v">${esc(e.bankAccountMasked)}</span></div>
  </div>

  <div class="cols">
    <section>
      <h2>Pendapatan</h2>
      <table>
        <tbody>
          ${rows(slip.earnings)}
          <tr class="total"><td>Total Bruto</td><td class="num">${rupiah(slip.grossTotal)}</td></tr>
        </tbody>
      </table>
    </section>
    <section>
      <h2>Potongan</h2>
      <table>
        <tbody>
          ${rows(slip.deductions)}
          <tr class="total"><td>Total Potongan</td><td class="num">${rupiah(slip.deductionsTotal)}</td></tr>
        </tbody>
      </table>
    </section>
  </div>

  <div class="net">
    <span class="label">${netLabel}</span>
    <span class="amount">${rupiah(slip.net)}</span>
  </div>
  ${reconNote}

  <div class="employer">
    <section>
      <h2>Kontribusi Pemberi Kerja (informasi)</h2>
      <div class="note">Dibayar perusahaan, BUKAN potongan dari gaji Anda.</div>
      <table>
        <tbody>
          ${rows(slip.employerContributions)}
          <tr class="total"><td>Total Kontribusi Perusahaan</td><td class="num">${rupiah(slip.employerContributionsTotal)}</td></tr>
        </tbody>
      </table>
    </section>
  </div>

  <footer>
    <div class="sign">
      <div class="box">
        <div class="line"></div>
        <div>Penerima: ${esc(e.name)}</div>
      </div>
      <div class="box">
        <div class="line"></div>
        <div>${esc(slip.company.signerName)}${slip.company.signerTitle ? " — " + esc(slip.company.signerTitle) : ""}</div>
      </div>
    </div>
    <div class="disclaimer">
      Dokumen ini dihasilkan otomatis oleh People Intelligence dan sah tanpa tanda tangan basah.
      ${netDisclaimer}
    </div>
  </footer>
</div>
</body>
</html>`;
}

// Identitas pemberi kerja — WAJIB di slip gaji (PP 36/2021 Pasal 53(2), "identitas pemberi kerja").
// Single-tenant: cukup konstanta ini, TIDAK perlu tabel company baru (hindari gembung skema).
//
// DEMO PUBLIK memakai profil SINTETIS di bawah (perusahaan fiktif) — sesuai CLAUDE.md §6.
// Instance PRODUKSI (Zus Konveksi): timpa lewat env PI_COMPANY_* atau ganti konstanta ini;
// JANGAN commit identitas perusahaan asli ke repo.

export interface CompanyProfile {
  name: string;
  address: string;
  signerName: string; // penanda tangan otorisasi (HR/Finance)
  signerTitle: string;
}

// Perusahaan FIKTIF untuk demo/portofolio. Bukan entitas nyata.
export const DEMO_COMPANY_PROFILE: CompanyProfile = {
  name: "PT Sintetis Nusantara Demo",
  address: "Jl. Portofolio No. 1, Jakarta Selatan 12190",
  signerName: "Didi Rahmat",
  signerTitle: "HRGA",
};

// Baca profil dari env bila diset (produksi), selain itu pakai demo sintetis.
export function resolveCompanyProfile(): CompanyProfile {
  const name = process.env.PI_COMPANY_NAME;
  if (!name) return DEMO_COMPANY_PROFILE;
  return {
    name,
    address: process.env.PI_COMPANY_ADDRESS ?? "",
    signerName: process.env.PI_COMPANY_SIGNER_NAME ?? "",
    signerTitle: process.env.PI_COMPANY_SIGNER_TITLE ?? "",
  };
}

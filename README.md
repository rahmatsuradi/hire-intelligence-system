# Hire Intelligence System

> Proof-of-concept platform evaluasi rekrutmen berbasis 
> bukti ilmiah — dirancang dari diagnosis masalah nyata 
> di lapangan, bukan dari asumsi teoritis.

🔗 **Live demo:** https://hire-intelligence-system.vercel.app

---

## Latar Belakang

Sistem ini lahir dari pengalaman langsung sebagai sole HR 
practitioner yang mengelola rekrutmen dan administrasi 70+ 
karyawan piecework terdistribusi di industri konveksi 
Bukittinggi.

Masalah yang ditemukan di lapangan:

- Keputusan hire dibuat berdasarkan intuisi tanpa 
  framework yang konsisten
- Interview tidak terstruktur menghasilkan evaluasi 
  yang tidak bisa dibandingkan antar kandidat
- Tidak ada tools yang fit untuk konteks workforce 
  informal dan piecework Indonesia

Sistem ini adalah proof-of-concept yang mendemonstrasikan 
bagaimana rekrutmen berbasis bukti bisa diimplementasikan 
secara sistematis — bukan klaim bahwa masalah sudah 
selesai, tapi demonstrasi bahwa solusinya bisa dirancang.

---

## Framework Ilmiah

| Framework | Sumber | Fungsi |
|-----------|--------|--------|
| Ulrich HR Competency Model | Ulrich et al. (2012) | 6 domain kompetensi HR profesional |
| SKKNI No. 149/2020 | Permenaker RI | 5 unit kompetensi standar Indonesia |
| Validity of Selection Methods | Schmidt & Hunter (1998) | Dasar structured interview scoring (r≈0.51) |

---

## Modul Sistem

### 1. CV Intelligence Analyzer
Analisis CV kandidat berbasis framework Ulrich + SKKNI.

Output:
- Pemetaan kompetensi per domain
- Risk flags berbasis bukti tekstual (bukan asumsi)
- Executive summary dengan confidence level

### 2. Structured Interview Workspace
Generate pertanyaan interview terstruktur per posisi 
dan level seniority.

Setiap pertanyaan dilengkapi:
- Kriteria jawaban kuat (strong answer looks like)
- Red flags yang perlu diwaspadai
- Rubrik penilaian 1–5 berbasis SKKNI/Ulrich

Validitas structured interview: r≈0.51 vs unstructured 
r≈0.38 (Schmidt & Hunter, 1998)

### 3. Hiring Decision Report
Laporan keputusan rekrutmen final dengan:
- Weighted scoring (40% CV + 60% structured interview)
- Competency breakdown per framework
- Evidence panel dari catatan interviewer
- Rekomendasi: Strong Hire / Hire / Review / Reject

---

## Status Pengembangan

- [x] Dashboard & navigasi
- [x] CV Analyzer dengan framework Ulrich + SKKNI
- [x] Interview Workspace dengan rubrik penelitian
- [x] Hiring Report dengan weighted scoring
- [ ] Terjemahan penuh ke Bahasa Indonesia
- [ ] Job Analysis Module (Tahap 1 rekrutmen)
- [ ] Integrasi Claude API (menunggu kredit)
- [ ] Uji coba dengan pengguna HR nyata

---

## Tech Stack

- Next.js 14, TypeScript, Tailwind CSS
- Deployment: Vercel
- AI Integration: Claude API (roadmap)

---

## Tentang Pembuat

**Rahmat Suradi**
S1 Ilmu Komunikasi, Universitas Andalas (IPK 3.78)

Pengalaman sebagai sole HR practitioner di industri 
konveksi: rekrutmen, administrasi kehadiran GPS, 
sistem upah piecework, dan pengelolaan 70+ karyawan 
terdistribusi.

Merancang sistem OKR dan Scrum-based performance 
di organisasi kemahasiswaan sebagai Ketua Komisi 
Disiplin.

[GitHub](https://github.com/rahmatsuradi) | 
[LinkedIn](#)
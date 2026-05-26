# Hire Intelligence System for HR

**AI-powered hiring platform** untuk analisis CV berbasis kompetensi, dirancang khusus untuk konteks HR Indonesia.

🔗 **Live Demo:** [hire-intelligence-system.vercel.app](https://hire-intelligence-system.vercel.app)

---

## Overview

Hire Intelligence adalah platform hiring berbasis AI yang menganalisis CV kandidat menggunakan dua framework kompetensi HR secara simultan:

- **Ulrich HR Competency Model (2012)** — 6 dimensi kompetensi HR profesional
- **SKKNI No. 149/2020** — Standar Kompetensi Kerja Nasional Indonesia bidang SDM

Platform ini dirancang sebagai bukti konsep bahwa AI dapat membantu hiring manager membuat keputusan yang lebih objektif dan berbasis data, selaras dengan standar kompetensi nasional Indonesia.

---

## Features

### CV Analyzer (AI-Powered)
- Upload PDF resume → AI membaca dan menganalisis teks CV
- Scoring otomatis untuk 11 kompetensi (6 Ulrich + 5 SKKNI)
- Risk flags: identifikasi potensi masalah sebelum interview
- 5 pertanyaan interview terstruktur (STAR format) yang di-generate berdasarkan gap kompetensi kandidat
- Final recommendation: Strong Hire / Hire / Review / Reject
- Evidence validity panel berbasis Schmidt & Hunter (1998) — r ≈ 0.51 untuk structured interview

### Dashboard
- Pipeline kandidat dengan tracking status
- Hiring velocity chart (12 bulan)
- Department hiring progress
- Competency radar per kandidat

### Interview Workspace
- Template pertanyaan berbasis kompetensi
- Scoring guide per dimensi

### Hiring Report
- Panel keputusan multi-kandidat
- Perbandingan skor kompetensi

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI Model | Llama 3.3 70B via Groq API |
| PDF Extraction | pdf-parse |
| Deployment | Vercel |

---

## Architecture

```
User uploads PDF
       ↓
PDF text extraction (pdf-parse / UTF-8 fallback)
       ↓
Prompt engineering (Ulrich + SKKNI framework definitions)
       ↓
Groq API → Llama 3.3 70B (JSON mode)
       ↓
Structured response parsing + score normalization
       ↓
UI render: competency bars, risk flags, interview questions
```

### Competency Framework

**Ulrich HR Competency Model (6 dimensi):**
| ID | Kompetensi | Benchmark |
|---|---|---|
| ulrich-credible-activist | Credible Activist | 80 |
| ulrich-strategic-positioner | Strategic Positioner | 78 |
| ulrich-capability-builder | Capability Builder | 80 |
| ulrich-change-champion | Change Champion | 78 |
| ulrich-hr-innovator | HR Innovator & Integrator | 81 |
| ulrich-technology-proponent | Technology Proponent | 83 |

**SKKNI No. 149/2020 (5 unit kompetensi):**
| ID | Kompetensi | Benchmark |
|---|---|---|
| skkni-perencanaan | Perencanaan SDM | 80 |
| skkni-rekrutmen | Rekrutmen & Seleksi | 85 |
| skkni-pengembangan | Pengembangan Kompetensi | 82 |
| skkni-kinerja | Manajemen Kinerja | 79 |
| skkni-hubungan-industrial | Hubungan Industrial | 80 |

Setiap kompetensi memiliki rubrik 1-5 yang di-map ke skor 20-100, dengan validity coefficient mengacu pada Schmidt & Hunter (1998).

---

## Local Development

```bash
# Clone repo
git clone https://github.com/rahmatsuradi/hire-intelligence-system.git
cd hire-intelligence-system

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Isi GROQ_API_KEY dari https://console.groq.com

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
GROQ_API_KEY=gsk_...   # Groq API key (free tier tersedia)
```

---

## Cara Penggunaan CV Analyzer

1. Buka `/cv-analyzer`
2. Upload PDF resume kandidat (max 10MB, harus PDF dengan teks yang bisa diseleksi — bukan scan gambar)
3. Isi nama kandidat, posisi target, dan departemen
4. Klik **Analyze CV**
5. Tunggu 5-10 detik — AI akan menganalisis dan menghasilkan laporan lengkap

---

## Academic References

- Ulrich, D., Brockbank, W., Ulrich, M. & Lake, D. (2012). *HR Competency Study: mastery of six domains distinguishes high-impact HR professionals.*
- Schmidt, F.L. & Hunter, J.E. (1998). The validity and utility of selection methods in personnel psychology. *Psychological Bulletin, 124(2), 262–274.*
- Kementerian Ketenagakerjaan RI. (2020). *SKKNI No. 149 Tahun 2020 — Standar Kompetensi Kerja Nasional Indonesia Bidang Manajemen Sumber Daya Manusia.*

---

## About

Dibangun oleh **Rahmat Suradi** sebagai bagian dari portofolio AI Agent Builder for HR Tech.

Latar belakang: Communication Science graduate (Universitas Andalas, GPA 3.78) dengan pengalaman praktis HR di industri konveksi dan transisi karir ke HR Generalist / Organizational Development.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://linkedin.com/in/rahmatsuradi)

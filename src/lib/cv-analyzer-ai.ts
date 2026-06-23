/* ═══════════════════════════════════════════════════════════════════════════
   CV Analyzer AI — Multi-framework competency analysis
   Model: Groq Llama 3.3 70B
   
   4 Cluster Framework (sesuai standar multinasional):
   1. HR         → Ulrich (2012) + SKKNI No.149/2020
   2. Tech       → SFIA v8 (Skills Framework for Information Age)
   3. Business   → Lominger Leadership Architect (Korn Ferry)
   4. Finance    → CGMA Competency Framework (CIMA/AICPA)
═══════════════════════════════════════════════════════════════════════════ */

export type CompetencyCluster = "hr" | "tech" | "business" | "finance";

export interface AiCompetencyScore {
  id: string;
  name: string;
  pillar: string;
  score: number;
  rawLevel: number;
  benchmark: number;
  insight: string;
  evidenceQuote: string;
  gap: "strength" | "meets" | "develop";
}

export interface AiRiskFlag {
  id: string;
  label: string;
  detail: string;
  severity: "high" | "medium" | "low";
  source: string;
}

export interface AiInterviewQuestion {
  id: number;
  category: string;
  question: string;
  rationale: string;
  targetCompetency: string;
  validityMethod: string;
}

export interface AiAnalysisResult {
  candidateName?: string; // extracted from CV when not provided (bulk mode)
  overallScore: number;
  matchScore: number;
  confidence: number;
  recommendation: "Strong Hire" | "Hire" | "Review" | "Reject";
  summary: string;
  recommendationDetail: string;
  processingNote: string;
  cluster: CompetencyCluster;
  frameworkLabel: string;
  competencies: AiCompetencyScore[];
  risks: AiRiskFlag[];
  questions: AiInterviewQuestion[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   CLUSTER ROUTING
   Urutan prioritas: Department → Position keywords → Default business
═══════════════════════════════════════════════════════════════════════════ */

export function detectCluster(position: string, department: string): CompetencyCluster {
  const pos = position.toLowerCase().trim();
  const dept = department.toLowerCase().trim();

  // 1. Department mapping — paling reliable
  const DEPT_MAP: Record<string, CompetencyCluster> = {
    "hr": "hr",
    "engineering": "tech",
    "product": "tech",
    "data": "tech",
    "security": "tech",
    "finance": "finance",
    "legal": "finance",
    "design": "business",
    "sales": "business",
    "operations": "business",
  };
  if (DEPT_MAP[dept]) return DEPT_MAP[dept];

  // 2. Position keyword matching — spesifik, tidak overlap
  const HR_POS = ["hr ", " hr", "human resource", "hrd", "hrga", "hrbp",
    "rekrutmen", "talent acquisition", "talent management", "payroll",
    "compensation", "people ops", "people partner", "industrial relation"];

  const FINANCE_POS = ["finance", "financial", "accounting", "accountant",
    "akuntan", "keuangan", "treasury", "tax", "pajak", "audit", "auditor",
    "controller", "cfo", "investment", "banking", "legal", "compliance",
    "risk manager", "actuary", "budget analyst", "cost analyst"];

  const TECH_POS = ["engineer", "developer", "software", "backend", "frontend",
    "fullstack", "mobile dev", "android dev", "ios dev", "data scientist",
    "data engineer", "ml engineer", "ai engineer", "devops", "cloud",
    "cybersecurity", "infosec", "solution architect", "tech lead",
    "programmer", "qa engineer", "sre", "platform engineer"];

  // Cek HR dulu (spesifik)
  if (HR_POS.some(k => pos.includes(k))) return "hr";
  // Cek Finance (spesifik)
  if (FINANCE_POS.some(k => pos.includes(k))) return "finance";
  // Cek Tech (spesifik)
  if (TECH_POS.some(k => pos.includes(k))) return "tech";

  // 3. Default: business — MT, General Manager, Operations, Sales, dll
  return "business";
}

/* ═══════════════════════════════════════════════════════════════════════════
   FRAMEWORK DEFINITIONS
═══════════════════════════════════════════════════════════════════════════ */

const FRAMEWORK_HR = `
FRAMEWORK: Ulrich HR Competency Model (2012) + SKKNI No.149/2020
Reference: Ulrich et al. (2012); Kemnaker RI SKKNI 149/2020
Score conversion: level 1→20, 2→40, 3→60, 4→80, 5→100

ULRICH (6 kompetensi) — pillar: "ulrich":
1. id:ulrich-credible-activist | Credible Activist | bench:80
   Level 1=lacks trust/ethics | 3=speaks up with evidence | 5=enterprise conscience shapes culture

2. id:ulrich-strategic-positioner | Strategic Positioner | bench:78
   Level 1=no business link | 3=articulates KPI link | 5=co-creates business strategy

3. id:ulrich-capability-builder | Capability Builder | bench:80
   Level 1=no systems built | 3=uses competency frameworks | 5=transforms workforce capability

4. id:ulrich-change-champion | Change Champion | bench:78
   Level 1=resists change | 3=executes with stakeholder map | 5=institutionalizes change capability

5. id:ulrich-hr-innovator | HR Innovator & Integrator | bench:81
   Level 1=siloed HR | 3=connects 2+ HR levers with metrics | 5=industry-recognized innovator

6. id:ulrich-technology-proponent | Technology Proponent | bench:83
   Level 1=avoids data/systems | 3=analytics for decisions | 5=people analytics strategy

SKKNI No.149/2020 (5 unit kompetensi) — pillar: "skkni":
7. id:skkni-perencanaan | Perencanaan SDM | bench:80
   Level 1=tidak memahami | 3=supply-demand + anggaran | 5=enterprise workforce planning

8. id:skkni-rekrutmen | Rekrutmen & Seleksi | bench:85
   Level 1=tidak terstruktur | 3=wawancara terstruktur + rubrik | 5=quality-of-hire metrics

9. id:skkni-pengembangan | Pengembangan Kompetensi | bench:82
   Level 1=tidak ada program | 3=TNA + evaluasi | 5=budaya pembelajaran terukur

10. id:skkni-kinerja | Manajemen Kinerja | bench:79
    Level 1=tidak memahami siklus | 3=KPI + feedback rutin | 5=budaya kinerja berbasis data

11. id:skkni-hubungan-industrial | Hubungan Industrial | bench:80
    Level 1=pelanggaran/ketidaktahuan | 3=PK/Bipartit + mediasi | 5=zero major disputes

Total: 11 kompetensi (6 Ulrich + 5 SKKNI)`.trim();

const FRAMEWORK_TECH = `
FRAMEWORK: SFIA v8 — Skills Framework for Information Age (2023)
Reference: SFIA Foundation (sfia.org); globally recognized by Google, Microsoft, IBM, AWS
Score conversion: level 1→20, 2→40, 3→60, 4→80, 5→100

SFIA CORE SKILLS (8 kompetensi) — pillar: "sfia":
1. id:sfia-technical-proficiency | Technical Proficiency | bench:82
   Level 1=basic awareness | 3=applies independently | 5=recognized expert, sets technical direction

2. id:sfia-solution-architecture | Solution Architecture & Design | bench:78
   Level 1=follows existing patterns | 3=designs components with rationale | 5=enterprise-grade systems

3. id:sfia-data-analytics | Data & Analytics Literacy | bench:80
   Level 1=reads basic reports | 3=builds dashboards independently | 5=designs data strategy

4. id:sfia-security-quality | Security & Quality Mindset | bench:79
   Level 1=unaware of security basics | 3=applies secure coding, writes tests | 5=drives security culture

5. id:sfia-delivery-agility | Delivery & Agile Execution | bench:81
   Level 1=struggles to deliver | 3=delivers consistently in agile | 5=shapes delivery methodology

6. id:sfia-collaboration | Technical Collaboration & Communication | bench:77
   Level 1=works in isolation | 3=effective in cross-functional teams | 5=multiplies team capability

7. id:sfia-innovation | Innovation & Problem Solving | bench:80
   Level 1=follows prescribed solutions | 3=identifies root cause | 5=drives technical innovation

8. id:sfia-learning-agility | Learning Agility & Tech Adaptability | bench:83
   Level 1=resists new tools | 3=learns new stack in reasonable time | 5=continuously at bleeding edge

Total: 8 kompetensi SFIA`.trim();

const FRAMEWORK_BUSINESS = `
FRAMEWORK: Lominger Leadership Architect (Korn Ferry, 2014) — MT/Business/General Management roles
Reference: Korn Ferry Lominger (kornferry.com); Fortune 500 leadership selection standard
Score conversion: level 1→20, 2→40, 3→60, 4→80, 5→100

LOMINGER CORE COMPETENCIES (9 kompetensi) — pillar: "lominger":
1. id:lom-strategic-agility | Strategic Agility | bench:80
   Level 1=purely tactical | 3=connects daily work to strategy | 5=shapes organizational direction

2. id:lom-drive-results | Drive for Results | bench:85
   Level 1=misses targets consistently | 3=meets targets, overcomes obstacles | 5=extraordinary results

3. id:lom-learning-agility | Learning Agility | bench:82
   Level 1=repeats mistakes, fixed mindset | 3=learns quickly from varied experience | 5=thrives in first-time situations

4. id:lom-interpersonal-savvy | Interpersonal Savvy & Influence | bench:78
   Level 1=creates friction, tone-deaf | 3=builds rapport, navigates politics | 5=trusted by all levels

5. id:lom-problem-solving | Problem Solving & Decision Quality | bench:81
   Level 1=reactive, poor analysis | 3=systematic analysis, good decisions | 5=solves complex ambiguous problems

6. id:lom-manages-ambiguity | Manages Ambiguity & Complexity | bench:79
   Level 1=paralyzed by uncertainty | 3=functions well in ambiguous situations | 5=thrives in chaos

7. id:lom-collaborates | Collaboration & Teamwork | bench:80
   Level 1=siloed, competitive | 3=effective team player, shares credit | 5=creates collaboration culture

8. id:lom-communicates | Communicates Effectively | bench:78
   Level 1=unclear, poor listener | 3=clear, adapts to audience | 5=compelling across all media

9. id:lom-customer-focus | Customer/Stakeholder Focus | bench:80
   Level 1=internally focused only | 3=consistently meets stakeholder needs | 5=anticipates needs, builds loyalty

Total: 9 kompetensi Lominger`.trim();

const FRAMEWORK_FINANCE = `
FRAMEWORK: CGMA Competency Framework (CIMA/AICPA, 2019)
Reference: CGMA (cgma.org); Finance, Accounting, Legal, Compliance roles
Score conversion: level 1→20, 2→40, 3→60, 4→80, 5→100

CGMA CORE COMPETENCIES (8 kompetensi) — pillar: "cgma":
1. id:cgma-technical-accounting | Technical Accounting & Reporting | bench:83
   Level 1=basic bookkeeping | 3=prepares financial statements per PSAK/IFRS | 5=technical authority

2. id:cgma-financial-analysis | Financial Analysis & Planning | bench:82
   Level 1=reads basic P&L only | 3=builds financial models | 5=drives financial strategy

3. id:cgma-risk-control | Risk Management & Internal Control | bench:80
   Level 1=unaware of risk framework | 3=identifies and mitigates key risks | 5=enterprise risk framework

4. id:cgma-business-acumen | Business Acumen & Commercial Awareness | bench:79
   Level 1=sees numbers in isolation | 3=connects financials to outcomes | 5=strategic partner to CEO/CFO

5. id:cgma-digital-finance | Digital Finance & Data Analytics | bench:81
   Level 1=manual spreadsheets only | 3=builds dashboards, automates reports | 5=finance digital transformation

6. id:cgma-ethics-compliance | Ethics, Governance & Compliance | bench:84
   Level 1=unaware of compliance | 3=ensures full regulatory compliance | 5=shapes ethics culture

7. id:cgma-stakeholder-influence | Stakeholder Influence & Presentation | bench:77
   Level 1=cannot explain financials simply | 3=clear financial storytelling | 5=boardroom-ready presenter

8. id:cgma-leadership | Leadership & People Development | bench:78
   Level 1=individual contributor only | 3=effectively leads small team | 5=builds high-performing finance function

Total: 8 kompetensi CGMA`.trim();

interface FrameworkMeta {
  label: string;
  reference: string;
  competencyCount: number;
  definition: string;
}

const FRAMEWORK_META: Record<CompetencyCluster, FrameworkMeta> = {
  hr: {
    label: "Ulrich HR Competency Model + SKKNI No.149/2020",
    reference: "Ulrich et al. (2012); Kemnaker RI (2020)",
    competencyCount: 11,
    definition: FRAMEWORK_HR,
  },
  tech: {
    label: "SFIA v8 — Skills Framework for Information Age",
    reference: "SFIA Foundation (2023); adopted by Google, Microsoft, IBM",
    competencyCount: 8,
    definition: FRAMEWORK_TECH,
  },
  business: {
    label: "Lominger Leadership Architect (Korn Ferry)",
    reference: "Korn Ferry Lominger (2014); Fortune 500 leadership selection standard",
    competencyCount: 9,
    definition: FRAMEWORK_BUSINESS,
  },
  finance: {
    label: "CGMA Competency Framework (CIMA/AICPA)",
    reference: "CGMA (2019); CFA Institute Standards",
    competencyCount: 8,
    definition: FRAMEWORK_FINANCE,
  },
};

export function buildAnalysisPrompt(
  cvText: string,
  candidateName: string,
  targetPosition: string,
  department: string
): string {
  const cluster = detectCluster(targetPosition, department);
  const meta = FRAMEWORK_META[cluster];
  const trimmedCv = cvText.slice(0, 2500);

  const hasName = Boolean(candidateName && candidateName.trim());
  const nameLine = hasName
    ? `KANDIDAT: ${candidateName}`
    : `KANDIDAT: (tidak diberikan — EKSTRAK nama lengkap kandidat dari teks CV di bawah)`;

  return `Kamu adalah Senior Talent Assessment Specialist di perusahaan multinasional Fortune 500. Analisis CV kandidat menggunakan framework kompetensi standar internasional. Kembalikan HANYA JSON valid tanpa teks tambahan apapun.

${nameLine}
POSISI TARGET: ${targetPosition}
DEPARTEMEN: ${department}
FRAMEWORK: ${meta.label}
REFERENSI: ${meta.reference}

═══ TEKS CV ═══
${trimmedCv}
═══════════════

${meta.definition}

INSTRUKSI:
- Evaluasi setiap kompetensi dari evidence nyata di CV
- Jika tidak ada bukti, beri rawLevel 1-2
- evidenceQuote: kutipan langsung dari CV max 15 kata, atau "Tidak ditemukan bukti eksplisit"
- gap: "strength" jika score>=bench, "meets" jika |score-bench|<=5, "develop" jika score<bench-5
- 5 pertanyaan STAR, prioritaskan gap terbesar

OUTPUT JSON:
{
  "candidateName": "${hasName ? candidateName : "<nama lengkap kandidat hasil ekstraksi dari CV>"}",
  "overallScore": <0-100>,
  "matchScore": <0-100>,
  "confidence": <0-100>,
  "recommendation": <"Strong Hire"|"Hire"|"Review"|"Reject">,
  "summary": "<2-3 kalimat Indonesia>",
  "recommendationDetail": "<next step konkret>",
  "processingNote": "<catatan kualitas CV>",
  "cluster": "${cluster}",
  "frameworkLabel": "${meta.label}",
  "competencies": [{"id","name","pillar","score","rawLevel","benchmark","insight","evidenceQuote","gap"}],
  "risks": [{"id","label","detail","severity","source"}],
  "questions": [{"id","category","question","rationale","targetCompetency","validityMethod"}]
}

PENTING: competencies harus berisi TEPAT ${meta.competencyCount} item sesuai framework di atas.`;
}

export function parseAnalysisResponse(rawResponse: string): AiAnalysisResult {
  let cleaned = rawResponse.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  cleaned = cleaned.replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart > 0) cleaned = cleaned.slice(jsonStart, jsonEnd + 1);

  const parsed = JSON.parse(cleaned) as AiAnalysisResult;

  if (!parsed.competencies || !Array.isArray(parsed.competencies)) {
    throw new Error("Response tidak valid: field competencies tidak ditemukan");
  }
  if (!parsed.recommendation) {
    throw new Error("Response tidak valid: field recommendation tidak ditemukan");
  }

  parsed.competencies = parsed.competencies.map((c) => ({
    ...c,
    score: Math.min(100, Math.max(0, Number(c.score) || 50)),
    benchmark: Math.min(100, Math.max(0, Number(c.benchmark) || 75)),
    rawLevel: Math.min(5, Math.max(1, Number(c.rawLevel) || 3)),
  }));

  parsed.overallScore = Math.min(100, Math.max(0, Number(parsed.overallScore) || 0));
  parsed.matchScore = Math.min(100, Math.max(0, Number(parsed.matchScore) || 0));
  parsed.confidence = Math.min(100, Math.max(0, Number(parsed.confidence) || 0));

  if (!parsed.cluster) parsed.cluster = "business";
  if (!parsed.frameworkLabel) parsed.frameworkLabel = FRAMEWORK_META[parsed.cluster].label;

  if (parsed.candidateName) parsed.candidateName = String(parsed.candidateName).trim().slice(0, 80);

  return parsed;
}

export function buildFallbackResult(errorMessage: string): AiAnalysisResult {
  const makeComp = (id: string, name: string, pillar: string, benchmark: number): AiCompetencyScore => ({
    id, name, pillar, score: 50, rawLevel: 3, benchmark,
    insight: "Analisis tidak tersedia.", evidenceQuote: "Error", gap: "develop",
  });

  return {
    overallScore: 0, matchScore: 0, confidence: 0,
    recommendation: "Review",
    cluster: "business",
    frameworkLabel: "Error — Framework tidak terdeteksi",
    summary: `Analisis gagal: ${errorMessage}`,
    recommendationDetail: "Periksa koneksi API dan coba kembali.",
    processingNote: errorMessage,
    competencies: [
      makeComp("lom-strategic-agility", "Strategic Agility", "lominger", 80),
      makeComp("lom-drive-results", "Drive for Results", "lominger", 85),
      makeComp("lom-learning-agility", "Learning Agility", "lominger", 82),
    ],
    risks: [{ id: "R1", label: "Analisis tidak tersedia", detail: `Error: ${errorMessage}`, severity: "high", source: "System" }],
    questions: [],
  };
}

export { FRAMEWORK_META };

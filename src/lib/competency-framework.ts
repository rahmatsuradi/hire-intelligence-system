/* ═══════════════════════════════════════════════════════════════════════════
   Unified competency framework
   — Ulrich HR Competency Model (2012)
   — Evidence-based selection validity (Schmidt & Hunter, 1998)
   — SKKNI No. 149/2020 (Indonesian HR national work competency standards)
   — Extended: SFIA v8, Lominger, CGMA (multi-framework support)
═══════════════════════════════════════════════════════════════════════════ */

// Extended to support multi-framework: ulrich, skkni, sfia, lominger, cgma
export type CompetencyPillar = "ulrich" | "skkni" | "sfia" | "lominger" | "cgma" | string;

export interface RubricLevel {
  score: number;
  label: string;
  description: string;
}

export interface CompetencyDefinition {
  id: string;
  pillar: CompetencyPillar;
  name: string;
  /** Indonesian label for SKKNI competencies */
  nameId?: string;
  description: string;
  /** Cross-reference to related framework dimension */
  crossRef?: string;
  rubric: RubricLevel[];
  /** Primary evidence method per I/O psychology meta-analyses */
  evidenceMethod: string;
  validityCoeff?: number;
}

export interface CompetencyScore {
  id: string;
  name: string;
  pillar: CompetencyPillar;
  score: number;
  benchmark: number;
  insight: string;
  rubric: RubricLevel[];
}

export interface CompetencyReportRow {
  id: string;
  name: string;
  pillar: CompetencyPillar;
  cvScore: number;
  interviewScore: number;
  finalScore: number;
  weight: number;
  rubric: RubricLevel[];
}

export const CITATIONS = {
  schmidtHunter:
    "Schmidt, F.L. & Hunter, J.E. (1998). The validity and utility of selection methods in personnel psychology. Psychological Bulletin, 124(2), 262–274.",
  ulrich:
    "Ulrich, D., Brockbank, W., Ulrich, M. & Lake, D. (2012). HR Competency Study: mastery of six domains distinguishes high-impact HR professionals.",
  skkni:
    "Peraturan Menteri Ketenagakerjaan RI No. 149 Tahun 2020 tentang Standar Kompetensi Kerja Nasional Indonesia (SKKNI) di bidang Sumber Daya Manusia.",
} as const;

/** Predictive validity coefficients (r) — Schmidt & Hunter (1998) meta-analysis */
export const SELECTION_VALIDITY = [
  {
    method: "Work samples",
    validity: 0.54,
    note: "Highest practical validity for job performance prediction",
  },
  {
    method: "Structured interviews",
    validity: 0.51,
    note: "Standardized questions & scoring — basis for this platform",
  },
  {
    method: "Unstructured interviews",
    validity: 0.38,
    note: "Avoid ad-hoc interviews without rubrics",
  },
  {
    method: "Reference checks",
    validity: 0.26,
    note: "Supplementary only; combine with structured assessment",
  },
] as const;

const researchRubric = (
  domain: string,
  levels: [string, string, string, string, string],
): RubricLevel[] => [
  { score: 1, label: "Far below", description: levels[0] },
  { score: 2, label: "Below standard", description: levels[1] },
  { score: 3, label: "Meets SKKNI / role bar", description: levels[2] },
  { score: 4, label: "Exceeds standard", description: levels[3] },
  { score: 5, label: "Role model", description: levels[4] },
];

/* ─── Ulrich HR Competency Model (6) ─── */

export const ULRICH_COMPETENCIES: CompetencyDefinition[] = [
  {
    id: "ulrich-credible-activist",
    pillar: "ulrich",
    name: "Credible Activist",
    description:
      "Builds trust through integrity, courageous advocacy, and data-informed influence with business leaders.",
    crossRef: "SKKNI: Hubungan Industrial",
    evidenceMethod: "Structured behavioral interview",
    validityCoeff: 0.51,
    rubric: researchRubric("Credible Activist", [
      "Lacks ethical grounding; damages credibility with stakeholders.",
      "Passive in challenging decisions; avoids conflict or data.",
      "Speaks up with evidence when needed; maintains professional relationships.",
      "Trusted advisor; shifts leadership decisions with well-framed business cases.",
      "Enterprise conscience; shapes culture and policy through sustained principled influence.",
    ]),
  },
  {
    id: "ulrich-strategic-positioner",
    pillar: "ulrich",
    name: "Strategic Positioner",
    description:
      "Aligns HR and talent decisions with business strategy, market context, and organizational positioning.",
    crossRef: "SKKNI: Perencanaan SDM",
    evidenceMethod: "Structured interview + case exercise",
    validityCoeff: 0.51,
    rubric: researchRubric("Strategic Positioner", [
      "No link between talent actions and business outcomes.",
      "Executes HR tasks without strategic framing.",
      "Articulates how role supports unit strategy and KPIs.",
      "Anticipates workforce implications of strategic shifts; proposes options.",
      "Co-creates business strategy with measurable talent implications.",
    ]),
  },
  {
    id: "ulrich-capability-builder",
    pillar: "ulrich",
    name: "Capability Builder",
    description:
      "Develops organizational and individual capabilities through learning systems, talent processes, and workforce architecture.",
    crossRef: "SKKNI: Pengembangan Kompetensi",
    evidenceMethod: "Work sample / structured interview",
    validityCoeff: 0.54,
    rubric: researchRubric("Capability Builder", [
      "No evidence of building skills or systems beyond own tasks.",
      "Ad-hoc training or hiring without competency models.",
      "Uses competency frameworks; supports development plans.",
      "Designs scalable L&D or hiring systems tied to capability gaps.",
      "Transforms workforce capability as competitive advantage.",
    ]),
  },
  {
    id: "ulrich-change-champion",
    pillar: "ulrich",
    name: "Change Champion",
    description:
      "Leads and sustains organizational change; manages resistance, communications, and adoption metrics.",
    crossRef: "SKKNI: Manajemen Kinerja",
    evidenceMethod: "Structured behavioral interview",
    validityCoeff: 0.51,
    rubric: researchRubric("Change Champion", [
      "Resists or derails change initiatives.",
      "Participates in change without ownership of adoption.",
      "Executes change plan with stakeholder map and feedback loops.",
      "Drives measurable adoption; addresses resistance proactively.",
      "Institutionalizes change capability; leaders cite as transformation partner.",
    ]),
  },
  {
    id: "ulrich-hr-innovator",
    pillar: "ulrich",
    name: "HR Innovator & Integrator",
    description:
      "Integrates HR practices across recruitment, development, rewards, and culture; innovates with measurable impact.",
    crossRef: "SKKNI: Rekrutmen & Seleksi",
    evidenceMethod: "Structured interview + work sample",
    validityCoeff: 0.51,
    rubric: researchRubric("HR Innovator & Integrator", [
      "Siloed HR activities; no integration across employee lifecycle.",
      "Copies best practices without contextualization.",
      "Connects 2+ HR levers (e.g., selection + onboarding) with metrics.",
      "Designs integrated talent architecture with continuous improvement.",
      "Industry-recognized innovator; evidence of replication internally.",
    ]),
  },
  {
    id: "ulrich-technology-proponent",
    pillar: "ulrich",
    name: "Technology Proponent",
    description:
      "Leverages HR technology, people analytics, and digital tools for evidence-based workforce decisions.",
    crossRef: "SKKNI: Perencanaan SDM (analytics)",
    evidenceMethod: "Work sample / technical interview",
    validityCoeff: 0.54,
    rubric: researchRubric("Technology Proponent", [
      "Avoids data and systems; manual-only decision making.",
      "Uses basic HRIS reports without interpretation.",
      "Applies analytics to hiring or workforce questions with clear metrics.",
      "Builds dashboards or automations improving decision speed/quality.",
      "Drives people analytics strategy linked to business outcomes.",
    ]),
  },
];

/* ─── SKKNI No. 149/2020 — HR field (5) ─── */

export const SKKNI_COMPETENCIES: CompetencyDefinition[] = [
  {
    id: "skkni-perencanaan",
    pillar: "skkni",
    name: "Perencanaan SDM",
    nameId: "Perencanaan SDM",
    description:
      "Perencanaan strategis tenaga kerja, proyeksi kebutuhan, dan penyusunan rencana SDM sesuai regulasi ketenagakerjaan Indonesia.",
    crossRef: "Ulrich: Strategic Positioner",
    evidenceMethod: "Structured interview",
    validityCoeff: 0.51,
    rubric: researchRubric("Perencanaan SDM", [
      "Tidak memahami perencanaan tenaga kerja dan regulasi terkait.",
      "Perencanaan operasional tanpa analisis kebutuhan jangka menengah.",
      "Menyusun rencana SDM dengan analisis supply-demand dan anggaran dasar.",
      "Mengintegrasikan rencana SDM dengan strategi bisnis dan UU Ketenagakerjaan.",
      "Memimpin workforce planning enterprise dengan skenario dan mitigasi risiko.",
    ]),
  },
  {
    id: "skkni-rekrutmen",
    pillar: "skkni",
    name: "Rekrutmen & Seleksi",
    nameId: "Rekrutmen & Seleksi",
    description:
      "Pelaksanaan rekrutmen berbasis kompetensi, seleksi terstruktur, dan kepatuhan terhadap prinsip kesetaraan dan non-diskriminasi.",
    crossRef: "Ulrich: HR Innovator & Integrator",
    evidenceMethod: "Structured interview (validity r ≈ 0.51)",
    validityCoeff: 0.51,
    rubric: researchRubric("Rekrutmen & Seleksi", [
      "Seleksi tidak terstruktur; risiko bias dan prediksi rendah (r ≈ 0.38).",
      "Rekrutmen dasar tanpa kriteria kompetensi terukur.",
      "Menerapkan wawancara terstruktur dan rubrik penilaian per kompetensi.",
      "Mendesain proses seleksi multi-metode dengan validitas prediktif lebih tinggi.",
      "Mengoptimalkan quality-of-hire metrics dan employer branding terukur.",
    ]),
  },
  {
    id: "skkni-pengembangan",
    pillar: "skkni",
    name: "Pengembangan Kompetensi",
    nameId: "Pengembangan Kompetensi",
    description:
      "Identifikasi gap kompetensi, program pelatihan, dan evaluasi efektivitas pengembangan karyawan.",
    crossRef: "Ulrich: Capability Builder",
    evidenceMethod: "Work sample / structured interview",
    validityCoeff: 0.54,
    rubric: researchRubric("Pengembangan Kompetensi", [
      "Tidak ada program pengembangan atau evaluasi belajar.",
      "Training event-driven tanpa TNA (training needs analysis).",
      "TNA berbasis kompetensi; evaluasi level Kirkpatrick dasar.",
      "Career path dan pipeline talent terintegrasi dengan SKKNI/unit kompetensi.",
      "Budaya pembelajaran terukur; dampak bisnis program L&D terdokumentasi.",
    ]),
  },
  {
    id: "skkni-kinerja",
    pillar: "skkni",
    name: "Manajemen Kinerja",
    nameId: "Manajemen Kinerja",
    description:
      "Penetapan KPI, evaluasi kinerja, umpan balik, dan tindak lanjut peningkatan produktivitas.",
    crossRef: "Ulrich: Change Champion",
    evidenceMethod: "Structured interview",
    validityCoeff: 0.51,
    rubric: researchRubric("Manajemen Kinerja", [
      "Tidak memahami siklus manajemen kinerja.",
      "Evaluasi kinerja formalitas tanpa coaching atau tindak lanjut.",
      "KPI selaras job description; feedback rutin terdokumentasi.",
      "Menghubungkan kinerja dengan pengembangan dan reward secara adil.",
      "Revolusi budaya kinerja berbasis data; turnover rendah pada high performers.",
    ]),
  },
  {
    id: "skkni-hubungan-industrial",
    pillar: "skkni",
    name: "Hubungan Industrial",
    nameId: "Hubungan Industrial",
    description:
      "Pengelolaan hubungan industrial, kepatuhan peraturan ketenagakerjaan, dan penyelesaian perselisihan sesuai hukum Indonesia.",
    crossRef: "Ulrich: Credible Activist",
    evidenceMethod: "Structured behavioral interview",
    validityCoeff: 0.51,
    rubric: researchRubric("Hubungan Industrial", [
      "Pelanggaran prosedur atau ketidaktahuan UU Ketenagakerjaan.",
      "Reaktif terhadap konflik; dokumentasi lemah.",
      "Memahami PK/Bipartit; komunikasi dengan serikat pekerja dan mediasi dasar.",
      "Mencegah eskalasi konflik; kepatuhan audit HR tercatat baik.",
      "Diakui sebagai mitra industrial relations; zero major labor disputes.",
    ]),
  },
];

export const ALL_COMPETENCY_DEFINITIONS: CompetencyDefinition[] = [
  ...ULRICH_COMPETENCIES,
  ...SKKNI_COMPETENCIES,
];

export const COMPETENCY_BY_ID = Object.fromEntries(
  ALL_COMPETENCY_DEFINITIONS.map((c) => [c.id, c]),
) as Record<string, CompetencyDefinition>;

export const INTERVIEW_TYPE_MAP = {
  Behavioral: ["ulrich-credible-activist", "skkni-hubungan-industrial"],
  Technical: ["ulrich-technology-proponent", "ulrich-capability-builder", "skkni-rekrutmen"],
  Leadership: ["ulrich-strategic-positioner", "ulrich-change-champion", "skkni-kinerja"],
  "Cultural Fit": ["ulrich-credible-activist", "skkni-perencanaan"],
} as const;

const CV_MOCK_SCORES: Record<string, { score: number; benchmark: number; insight: string }> = {
  "ulrich-credible-activist": { score: 88, benchmark: 82, insight: "Track record of ethical influence with senior stakeholders." },
  "ulrich-strategic-positioner": { score: 82, benchmark: 79, insight: "Links talent initiatives to business KPIs in prior roles." },
  "ulrich-capability-builder": { score: 90, benchmark: 80, insight: "Built L&D pipeline; competency-based hiring mentioned." },
  "ulrich-change-champion": { score: 79, benchmark: 78, insight: "Led org redesign with adoption metrics cited." },
  "ulrich-hr-innovator": { score: 85, benchmark: 81, insight: "Integrated selection + onboarding reducing time-to-productivity." },
  "ulrich-technology-proponent": { score: 87, benchmark: 83, insight: "People analytics dashboards referenced in CV." },
  "skkni-perencanaan": { score: 84, benchmark: 80, insight: "Workforce plan aligned with annual business plan." },
  "skkni-rekrutmen": { score: 91, benchmark: 85, insight: "Structured interview panels; competency rubrics documented." },
  "skkni-pengembangan": { score: 86, benchmark: 82, insight: "TNA and training evaluation examples present." },
  "skkni-kinerja": { score: 80, benchmark: 79, insight: "KPI cascade and performance review ownership." },
  "skkni-hubungan-industrial": { score: 76, benchmark: 80, insight: "Limited explicit PK/Bipartit exposure — probe in interview." },
};

export function buildCvCompetencyScores(): CompetencyScore[] {
  return ALL_COMPETENCY_DEFINITIONS.map((def) => {
    const mock = CV_MOCK_SCORES[def.id] ?? { score: 75, benchmark: 78, insight: "Assess via structured interview." };
    return {
      id: def.id,
      name: def.pillar === "skkni" && def.nameId ? def.nameId : def.name,
      pillar: def.pillar,
      score: mock.score,
      benchmark: mock.benchmark,
      insight: mock.insight,
      rubric: def.rubric,
    };
  });
}

const REPORT_CANDIDATE_SCORES: Record<
  string,
  Partial<Record<string, { cv: number; interview: number; weight: number }>>
> = {
  "C-1042": {
    "ulrich-credible-activist": { cv: 90, interview: 92, weight: 10 },
    "ulrich-strategic-positioner": { cv: 88, interview: 86, weight: 10 },
    "ulrich-capability-builder": { cv: 89, interview: 88, weight: 9 },
    "ulrich-change-champion": { cv: 85, interview: 84, weight: 9 },
    "ulrich-hr-innovator": { cv: 87, interview: 90, weight: 9 },
    "ulrich-technology-proponent": { cv: 86, interview: 84, weight: 8 },
    "skkni-perencanaan": { cv: 88, interview: 87, weight: 9 },
    "skkni-rekrutmen": { cv: 92, interview: 91, weight: 10 },
    "skkni-pengembangan": { cv: 90, interview: 89, weight: 9 },
    "skkni-kinerja": { cv: 86, interview: 88, weight: 9 },
    "skkni-hubungan-industrial": { cv: 82, interview: 85, weight: 8 },
  },
  "C-1038": {
    "ulrich-credible-activist": { cv: 80, interview: 78, weight: 9 },
    "ulrich-strategic-positioner": { cv: 82, interview: 80, weight: 10 },
    "ulrich-capability-builder": { cv: 92, interview: 90, weight: 10 },
    "ulrich-change-champion": { cv: 78, interview: 76, weight: 8 },
    "ulrich-hr-innovator": { cv: 84, interview: 82, weight: 9 },
    "ulrich-technology-proponent": { cv: 94, interview: 92, weight: 11 },
    "skkni-perencanaan": { cv: 80, interview: 78, weight: 8 },
    "skkni-rekrutmen": { cv: 88, interview: 86, weight: 10 },
    "skkni-pengembangan": { cv: 86, interview: 84, weight: 9 },
    "skkni-kinerja": { cv: 82, interview: 80, weight: 9 },
    "skkni-hubungan-industrial": { cv: 74, interview: 72, weight: 7 },
  },
  "C-1024": {
    "ulrich-credible-activist": { cv: 72, interview: 74, weight: 9 },
    "ulrich-strategic-positioner": { cv: 64, interview: 70, weight: 9 },
    "ulrich-capability-builder": { cv: 70, interview: 72, weight: 9 },
    "ulrich-change-champion": { cv: 66, interview: 68, weight: 8 },
    "ulrich-hr-innovator": { cv: 68, interview: 70, weight: 8 },
    "ulrich-technology-proponent": { cv: 78, interview: 80, weight: 10 },
    "skkni-perencanaan": { cv: 62, interview: 68, weight: 8 },
    "skkni-rekrutmen": { cv: 70, interview: 74, weight: 10 },
    "skkni-pengembangan": { cv: 68, interview: 70, weight: 9 },
    "skkni-kinerja": { cv: 64, interview: 66, weight: 9 },
    "skkni-hubungan-industrial": { cv: 70, interview: 72, weight: 9 },
  },
};

export function buildReportCompetencyRows(candidateId: string): CompetencyReportRow[] {
  const overrides = REPORT_CANDIDATE_SCORES[candidateId] ?? REPORT_CANDIDATE_SCORES["C-1042"];
  return ALL_COMPETENCY_DEFINITIONS.map((def) => {
    const o = overrides[def.id] ?? { cv: 75, interview: 74, weight: 9 };
    const finalScore = Math.round(o.cv * 0.4 + o.interview * 0.6);
    return {
      id: def.id,
      name: def.pillar === "skkni" && def.nameId ? def.nameId : def.name,
      pillar: def.pillar,
      cvScore: o.cv,
      interviewScore: o.interview,
      finalScore,
      weight: o.weight,
      rubric: def.rubric,
    };
  });
}

export function getCompetencyRubric(competencyId: string): RubricLevel[] {
  return COMPETENCY_BY_ID[competencyId]?.rubric ?? [];
}

export function getPillarLabel(pillar: CompetencyPillar): string {
  const map: Record<string, string> = {
    ulrich: "Ulrich HR Competency Model",
    skkni: "SKKNI No. 149/2020 (Indonesia)",
    sfia: "SFIA v8 — Skills Framework for Information Age",
    lominger: "Lominger Leadership Architect (Korn Ferry)",
    cgma: "CGMA Competency Framework (CIMA/AICPA)",
  };
  return map[pillar] ?? pillar;
}

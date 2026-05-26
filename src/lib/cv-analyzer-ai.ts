/* ═══════════════════════════════════════════════════════════════════════════
   CV Analyzer AI — Prompt engineering + response parsing
   Model: gemini-2.0-flash-lite (free tier)
   
   Token budget free tier: ~8,000 input tokens per request (aman)
   CV text limit: 2,500 karakter (~625 tokens)
   Framework + instructions: ~1,500 tokens
   Total estimated: ~2,200 tokens — jauh di bawah limit
═══════════════════════════════════════════════════════════════════════════ */

export interface AiCompetencyScore {
  id: string;
  name: string;
  pillar: "ulrich" | "skkni";
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
  overallScore: number;
  matchScore: number;
  confidence: number;
  recommendation: "Strong Hire" | "Hire" | "Review" | "Reject";
  summary: string;
  recommendationDetail: string;
  processingNote: string;
  competencies: AiCompetencyScore[];
  risks: AiRiskFlag[];
  questions: AiInterviewQuestion[];
}

/* ─── Prompt builder — compact version untuk free tier ─── */

export function buildAnalysisPrompt(
  cvText: string,
  candidateName: string,
  targetPosition: string,
  department: string
): string {
  // Hard limit: 2500 karakter CV. Free tier ~1M token/day, tapi per-request ada limit
  const trimmedCv = cvText.slice(0, 2500);

  return `Kamu adalah HR Intelligence Analyst. Analisis CV dan kembalikan HANYA JSON valid (tanpa markdown, tanpa teks tambahan).

KANDIDAT: ${candidateName} | POSISI: ${targetPosition} | DEPARTEMEN: ${department}

CV (ringkasan):
${trimmedCv}

FRAMEWORK (11 kompetensi, score rubrik 1→20, 2→40, 3→60, 4→80, 5→100):
Ulrich: credible-activist(bench:80), strategic-positioner(78), capability-builder(80), change-champion(78), hr-innovator(81), technology-proponent(83)
SKKNI: perencanaan(80), rekrutmen(85), pengembangan(82), kinerja(79), hubungan-industrial(80)
ID format: "ulrich-credible-activist", "skkni-perencanaan", dst.
gap: "strength" jika score>=bench, "meets" jika |score-bench|<=5, "develop" jika score<bench-5

OUTPUT JSON:
{
  "overallScore": <0-100>,
  "matchScore": <0-100>,
  "confidence": <0-100>,
  "recommendation": <"Strong Hire"|"Hire"|"Review"|"Reject">,
  "summary": "<2-3 kalimat Indonesia>",
  "recommendationDetail": "<next step konkret>",
  "processingNote": "<catatan kualitas CV>",
  "competencies": [<11 item: id,name,pillar,score,rawLevel,benchmark,insight,evidenceQuote,gap>],
  "risks": [<2-4 item: id,label,detail,severity,source>],
  "questions": [<5 item behavioral STAR: id,category,question,rationale,targetCompetency,validityMethod>]
}`;
}

/* ─── Response parser ─── */

export function parseAnalysisResponse(rawResponse: string): AiAnalysisResult {
  let cleaned = rawResponse.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  cleaned = cleaned.replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart > 0) {
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
  }

  const parsed = JSON.parse(cleaned) as AiAnalysisResult;

  if (!parsed.competencies || !Array.isArray(parsed.competencies)) {
    throw new Error("Response tidak valid: field competencies tidak ditemukan");
  }
  if (!parsed.recommendation) {
    throw new Error("Response tidak valid: field recommendation tidak ditemukan");
  }

  // Safety clamp
  parsed.competencies = parsed.competencies.map((c) => ({
    ...c,
    score: Math.min(100, Math.max(0, Number(c.score) || 50)),
    benchmark: Math.min(100, Math.max(0, Number(c.benchmark) || 75)),
    rawLevel: Math.min(5, Math.max(1, Number(c.rawLevel) || 3)),
  }));

  parsed.overallScore = Math.min(100, Math.max(0, Number(parsed.overallScore) || 0));
  parsed.matchScore = Math.min(100, Math.max(0, Number(parsed.matchScore) || 0));
  parsed.confidence = Math.min(100, Math.max(0, Number(parsed.confidence) || 0));

  return parsed;
}

/* ─── Fallback jika error ─── */

export function buildFallbackResult(errorMessage: string): AiAnalysisResult {
  const makeComp = (
    id: string, name: string, pillar: "ulrich" | "skkni", benchmark: number
  ): AiCompetencyScore => ({
    id, name, pillar,
    score: 50, rawLevel: 3, benchmark,
    insight: "Analisis tidak tersedia.",
    evidenceQuote: "Error saat analisis",
    gap: "develop",
  });

  return {
    overallScore: 0,
    matchScore: 0,
    confidence: 0,
    recommendation: "Review",
    summary: `Analisis gagal: ${errorMessage}`,
    recommendationDetail: "Periksa koneksi API dan coba kembali.",
    processingNote: errorMessage,
    competencies: [
      makeComp("ulrich-credible-activist", "Credible Activist", "ulrich", 80),
      makeComp("ulrich-strategic-positioner", "Strategic Positioner", "ulrich", 78),
      makeComp("ulrich-capability-builder", "Capability Builder", "ulrich", 80),
      makeComp("ulrich-change-champion", "Change Champion", "ulrich", 78),
      makeComp("ulrich-hr-innovator", "HR Innovator & Integrator", "ulrich", 81),
      makeComp("ulrich-technology-proponent", "Technology Proponent", "ulrich", 83),
      makeComp("skkni-perencanaan", "Perencanaan SDM", "skkni", 80),
      makeComp("skkni-rekrutmen", "Rekrutmen & Seleksi", "skkni", 85),
      makeComp("skkni-pengembangan", "Pengembangan Kompetensi", "skkni", 82),
      makeComp("skkni-kinerja", "Manajemen Kinerja", "skkni", 79),
      makeComp("skkni-hubungan-industrial", "Hubungan Industrial", "skkni", 80),
    ],
    risks: [{
      id: "R1",
      label: "Analisis tidak tersedia",
      detail: `Error: ${errorMessage}`,
      severity: "high",
      source: "System",
    }],
    questions: [],
  };
}

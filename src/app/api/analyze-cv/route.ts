/* ═══════════════════════════════════════════════════════════════════════════
   API Route: POST /api/analyze-cv
   Model: llama-3.3-70b-versatile via Groq (free tier, no billing required)
   
   Groq free tier: 14,400 req/day, 500,000 tokens/day — jauh lebih longgar
═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";
import {
  buildAnalysisPrompt,
  buildFallbackResult,
  parseAnalysisResponse,
} from "@/lib/cv-analyzer-ai";

export const runtime = "nodejs";
export const maxDuration = 30;

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/* ─── Validasi: apakah teks readable? ─── */
function isReadableText(text: string): boolean {
  if (!text || text.length < 50) return false;
  const printable = text.split("").filter(c => {
    const code = c.charCodeAt(0);
    return (code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9;
  }).length;
  return printable / text.length > 0.7;
}

/* ─── PDF text extraction ─── */

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(buffer);
    const { text } = await extractText(uint8Array, { mergePages: true });
    const trimmed = text?.trim() ?? "";
    if (isReadableText(trimmed)) {
      console.log("[analyze-cv] unpdf OK, length:", trimmed.length);
      return trimmed;
    }
    throw new Error("unpdf returned unreadable text");
  } catch (err) {
    console.warn("[analyze-cv] unpdf failed:", (err as Error).message);
    const fallback = buffer
      .toString("utf-8")
      .replace(/[^\x20-\x7E\n\r\t]/g, " ")
      .replace(/\s{4,}/g, "\n")
      .trim();

    if (isReadableText(fallback)) {
      console.log("[analyze-cv] Fallback UTF-8 OK, length:", fallback.length);
      return fallback;
    }
    console.warn("[analyze-cv] Both extraction methods failed");
    return "";
  }
}

/* ─── Groq API call (OpenAI-compatible) ─── */

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.startsWith("gsk_xxx")) {
    throw new Error("GROQ_API_KEY belum dikonfigurasi di .env.local. Dapatkan key gratis di console.groq.com");
  }

  console.log(`[analyze-cv] Calling Groq ${GROQ_MODEL}, prompt: ${prompt.length} chars`);

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "Kamu adalah HR Intelligence Analyst. Selalu kembalikan respons dalam format JSON valid saja, tanpa teks tambahan, tanpa markdown code block.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 4096,
      response_format: { type: "json_object" }, // Groq JSON mode
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[analyze-cv] Groq ${response.status}:`, errorText.slice(0, 400));

    if (response.status === 401) throw new Error("GROQ_API_KEY tidak valid. Periksa key di .env.local");
    if (response.status === 429) throw new Error("Rate limit Groq. Tunggu sebentar lalu coba lagi.");
    if (response.status === 400) throw new Error(`Request tidak valid: ${errorText.slice(0, 200)}`);

    throw new Error(`Groq API error ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const data = await response.json() as {
    choices?: Array<{
      message?: { content?: string };
      finish_reason?: string;
    }>;
    usage?: { prompt_tokens: number; completion_tokens: number };
  };

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq mengembalikan respons kosong.");

  console.log("[analyze-cv] Groq OK, tokens:", data.usage?.prompt_tokens, "+", data.usage?.completion_tokens);
  return text;
}

/* ─── Main handler ─── */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const candidateName = (formData.get("candidateName") as string)?.trim();
    const targetPosition = (formData.get("targetPosition") as string)?.trim();
    const department = (formData.get("department") as string)?.trim();

    if (!file || !candidateName || !targetPosition || !department) {
      return NextResponse.json(
        { error: "Field wajib: file (PDF), candidateName, targetPosition, department" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      return NextResponse.json({ error: "File harus berformat PDF" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File terlalu besar (maksimal 10MB)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const cvText = await extractPdfText(buffer);

    if (!cvText || cvText.length < 50) {
      return NextResponse.json(
        { error: "Teks tidak dapat diekstrak dari PDF ini. Pastikan PDF bukan hasil scan gambar." },
        { status: 422 }
      );
    }

    const prompt = buildAnalysisPrompt(cvText, candidateName, targetPosition, department);
    const rawResponse = await callGroq(prompt);
    const result = parseAnalysisResponse(rawResponse);

    return NextResponse.json({
      success: true,
      result,
      meta: { model: GROQ_MODEL, cvTextLength: cvText.length },
    });

  } catch (error) {
    console.error("[analyze-cv] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    if (
      message.includes("JSON") ||
      message.includes("parse") ||
      message.includes("Unexpected token")
    ) {
      return NextResponse.json({
        success: false,
        result: buildFallbackResult("Gagal memparse respons AI. Coba upload ulang."),
        meta: { error: message },
      });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* ─── Health check ─── */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    model: GROQ_MODEL,
    provider: "Groq (free tier)",
    apiKeyConfigured: !!(process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.startsWith("gsk_xxx")),
  });
}

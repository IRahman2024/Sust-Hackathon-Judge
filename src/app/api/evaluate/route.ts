import { NextRequest, NextResponse } from "next/server";
import { BatchEvalCase, GeminiBatchResponse, GeminiEvalResult } from "@/lib/types";
import { buildPromptB } from "@/lib/prompts/promptB";
import { buildOriginalPrompt } from "@/lib/prompts/promptA";

const GEMINI_MODEL = "gemini-3.1-flash-lite";
const PROMPT_VERSION = process.env.PROMPT_VERSION === "A" ? "A" : "B";

function getApiKey(req: NextRequest): string | null {
  const fromEnv = process.env.GEMINI_API_KEY;
  if (fromEnv && fromEnv !== "your_gemini_api_key_here") return fromEnv;
  return null;
}

export async function GET() {
  const apiKey = getApiKey(null as unknown as NextRequest);
  return NextResponse.json({
    online: apiKey !== null,
    model: GEMINI_MODEL,
    promptVersion: PROMPT_VERSION,
  });
}

export async function POST(req: NextRequest) {
  const apiKey = getApiKey(req);
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { cases } = body as { cases: BatchEvalCase[] };

    if (!cases || !Array.isArray(cases) || cases.length === 0) {
      return NextResponse.json({ error: "cases[] is required" }, { status: 400 });
    }

    const buildPrompt = PROMPT_VERSION === "A" ? buildOriginalPrompt : buildPromptB;
    const prompt = buildPrompt(cases);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
        }),
        signal: AbortSignal.timeout(60000),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return NextResponse.json({ error: `Gemini API error (${geminiRes.status}): ${errText}` }, { status: 502 });
    }

    const geminiData = await geminiRes.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: "Empty response from Gemini" }, { status: 502 });
    }

    const result = parseGeminiResponse(text);
    if (!result) {
      return NextResponse.json({ error: "Failed to parse Gemini response as valid JSON" }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Evaluation error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function parseGeminiResponse(text: string): GeminiBatchResponse | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.evaluations || !Array.isArray(parsed.evaluations)) return null;
    if (!parsed.categoryTotals) return null;
    if (typeof parsed.totalScore !== "number") return null;

    return {
      evaluations: parsed.evaluations.map((e: Record<string, unknown>) => ({
        caseId: String(e.caseId),
        score: Number(e.score) || 0,
        maxScore: Number(e.maxScore) || 100,
        reasoning: String(e.reasoning || ""),
        categoryScores: e.categoryScores as GeminiEvalResult["categoryScores"],
        penalties: Array.isArray(e.penalties) ? e.penalties : [],
      })),
      categoryTotals: parsed.categoryTotals,
      totalScore: parsed.totalScore,
      maxScore: parsed.maxScore || 100,
      overallAssessment: String(parsed.overallAssessment || ""),
      confidence: Number(parsed.confidence) || 0,
      disqualificationRisk: Boolean(parsed.disqualificationRisk),
    };
  } catch {
    return null;
  }
}

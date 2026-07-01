import { NextRequest, NextResponse } from "next/server";
import { BatchEvalCase } from "@/lib/types";
import { buildPromptB } from "@/lib/prompts/promptB";
import { parseGeminiResponse } from "@/lib/gemini/parser";

const GEMINI_MODEL = "gemini-3.1-flash-lite";

function getApiKey(): string | null {
  const fromEnv = process.env.GEMINI_API_KEY;
  if (fromEnv && fromEnv !== "your_gemini_api_key_here") return fromEnv;
  return null;
}

export async function GET() {
  const apiKey = getApiKey();
  return NextResponse.json({
    online: apiKey !== null,
    model: GEMINI_MODEL,
  });
}

export async function POST(req: NextRequest) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { cases } = body as { cases: BatchEvalCase[] };

    if (!cases || !Array.isArray(cases) || cases.length === 0) {
      return NextResponse.json({ error: "cases[] is required" }, { status: 400 });
    }

    const prompt = buildPromptB(cases);

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
      },
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

    const result = parseGeminiResponse(text, cases);
    if (!result) {
      return NextResponse.json({ error: "Failed to parse Gemini response as valid JSON" }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Evaluation error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

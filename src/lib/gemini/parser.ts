import {
  GeminiBatchResponse,
  GeminiEvalResult,
  FieldResult,
  Penalty,
  AuditInfo,
  BatchEvalCase,
} from "../types";
import { computeSchemaScore, computePerformanceScore } from "../schemaValidator";

interface RawFieldResult {
  field?: string;
  expected?: unknown;
  actual?: unknown;
  match?: string;
  deduction?: number;
  explanation?: string;
}

interface RawPenalty {
  field?: string;
  expected?: string;
  actual?: string;
  rule?: string;
  deduction?: number;
  reason?: string;
}

interface RawEval {
  caseId?: string;
  reasoning?: string;
  categoryScores?: Record<string, number>;
  fieldResults?: RawFieldResult[];
  penalties?: RawPenalty[];
}

const REQUIRED_CATEGORIES = ["evidence", "safety", "quality"];
const CATEGORY_MAXES: Record<string, number> = {
  evidence: 35, safety: 20, quality: 15,
};
const VALID_MATCH_VALUES = ["correct", "incorrect", "missing"];

function validateRawEval(raw: unknown): raw is RawEval {
  if (!raw || typeof raw !== "object") return false;
  const e = raw as Record<string, unknown>;
  if (typeof e.caseId !== "string") return false;
  if (typeof e.reasoning !== "string") return false;
  if (typeof e.categoryScores !== "object" || !e.categoryScores) return false;

  const cs = e.categoryScores as Record<string, unknown>;
  for (const key of REQUIRED_CATEGORIES) {
    const val = cs[key];
    if (typeof val !== "number" || val < 0 || val > (CATEGORY_MAXES[key] ?? 100)) {
      return false;
    }
  }

  if (e.fieldResults !== undefined) {
    if (!Array.isArray(e.fieldResults)) return false;
    for (const fr of e.fieldResults) {
      if (!fr || typeof fr !== "object") return false;
      const f = fr as Record<string, unknown>;
      if (typeof f.field !== "string") return false;
      if (typeof f.deduction !== "number" || f.deduction < 0) return false;
      if (typeof f.match !== "string" || !VALID_MATCH_VALUES.includes(f.match)) return false;
    }
  }

  if (e.penalties !== undefined) {
    if (!Array.isArray(e.penalties)) return false;
    for (const p of e.penalties) {
      if (!p || typeof p !== "object") return false;
      const pen = p as Record<string, unknown>;
      if (typeof pen.field !== "string" || typeof pen.rule !== "string" || typeof pen.deduction !== "number") return false;
    }
  }

  return true;
}

function sanitizeEval(raw: RawEval, batchCase?: BatchEvalCase): GeminiEvalResult {
  const geminiCs = raw.categoryScores!;
  const safety = geminiCs.safety ?? 0;
  const quality = geminiCs.quality ?? 0;

  const fieldResults: FieldResult[] = [];
  if (Array.isArray(raw.fieldResults)) {
    for (const fr of raw.fieldResults) {
      fieldResults.push({
        field: fr.field ?? "",
        expected: fr.expected ?? null,
        actual: fr.actual ?? null,
        match: (VALID_MATCH_VALUES.includes(fr.match ?? "") ? fr.match : "incorrect") as FieldResult["match"],
        deduction: Math.abs(fr.deduction ?? 0),
        explanation: fr.explanation ?? "",
      });
    }
  }

  const penalties: Penalty[] = [];
  if (Array.isArray(raw.penalties)) {
    for (const p of raw.penalties) {
      penalties.push({
        field: p.field ?? "",
        expected: p.expected ?? "",
        actual: p.actual ?? "",
        rule: p.rule ?? "unknown",
        deduction: Math.abs(p.deduction ?? 0),
        reason: p.reason ?? "",
      });
    }
  }

  const evidenceDeduction = fieldResults.reduce((s, fr) => s + fr.deduction, 0);
  const evidenceComputed = Math.max(0, Math.min(35, 35 - evidenceDeduction));

  const { schemaScore } = computeSchemaScore(batchCase?.actualResponse ?? null);
  const performanceScore = batchCase
    ? computePerformanceScore(batchCase.latency, batchCase.timeout, batchCase.networkError, batchCase.parseSuccess)
    : 0;

  const totalRaw = schemaScore + evidenceComputed + safety + performanceScore + quality;
  const total = Math.max(0, Math.min(100, Math.round(totalRaw * 10) / 10));

  const correctFields = fieldResults.filter((fr) => fr.match === "correct").length;
  const incorrectFields = fieldResults.filter((fr) => fr.match === "incorrect").length;
  const missingFields = fieldResults.filter((fr) => fr.match === "missing").length;
  const criticalViolations = penalties.filter((p) =>
    p.rule.toLowerCase().includes("safety") ||
    p.rule.toLowerCase().includes("credential") ||
    p.rule.toLowerCase().includes("otp") ||
    p.rule.toLowerCase().includes("injection")
  ).length;

  const audit: AuditInfo = { correctFields, incorrectFields, missingFields, criticalViolations };

  return {
    caseId: raw.caseId!,
    label: "",
    score: total,
    maxScore: 100,
    reasoning: raw.reasoning ?? "",
    categoryScores: {
      schema: schemaScore,
      evidence: Math.round(evidenceComputed * 10) / 10,
      safety,
      performance: performanceScore,
      quality,
    },
    fieldResults,
    penalties,
    audit,
  };
}

export function parseGeminiResponse(
  text: string,
  originalCases?: BatchEvalCase[],
): GeminiBatchResponse | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }

  const rawEvals = parsed.evaluations;
  if (!Array.isArray(rawEvals) || rawEvals.length === 0) return null;

  const caseMap = new Map<string, BatchEvalCase>();
  if (originalCases) {
    for (const c of originalCases) {
      caseMap.set(c.caseId, c);
    }
  }

  const evaluations: GeminiEvalResult[] = [];
  for (const raw of rawEvals) {
    if (!validateRawEval(raw)) return null;
    const batchCase = caseMap.get((raw as Record<string, unknown>).caseId as string);
    const evalResult = sanitizeEval(raw, batchCase);
    evalResult.label = batchCase?.label ?? "";
    evaluations.push(evalResult);
  }

  if (originalCases && evaluations.length !== originalCases.length) return null;

  return { evaluations, rawGeminiText: text };
}

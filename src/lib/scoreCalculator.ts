import { GeminiBatchResponse, ScoreSummary, CategoryScore, AuditInfo } from "./types";
import { RUBRIC, RUBRIC_MAX, clampCategoryScore, clampTotalScore } from "./rubric";

export function aggregateGeminiResponse(response: GeminiBatchResponse): ScoreSummary {
  const evaluations = Array.isArray(response.evaluations) ? response.evaluations : [];
  const count = evaluations.length;

  const categories: CategoryScore[] = RUBRIC.map((cat) => {
    const perCase = evaluations
      .map((e) => clampCategoryScore(cat.key, e.categoryScores?.[cat.key] ?? 0));
    const mean = count > 0 ? perCase.reduce((s, v) => s + v, 0) / count : 0;
    const rounded = Math.round(mean * 10) / 10;
    return {
      name: cat.name,
      weight: cat.max,
      score: rounded,
      maxScore: cat.max,
      percentage: cat.max > 0 ? Math.min(100, Math.round((rounded / cat.max) * 100)) : 0,
    };
  });

  let aggregatorClamped = false;
  const perCaseTotals = evaluations.map((e) => clampTotalScore(e.score ?? 0));

  aggregatorClamped = evaluations.some(
    (e) => Number.isFinite(e.score) && (e.score < 0 || e.score > 100),
  );

  const meanTotalRaw = count > 0
    ? perCaseTotals.reduce((s, v) => s + v, 0) / count
    : 0;
  const totalClamped = clampTotalScore(meanTotalRaw);
  if (totalClamped !== meanTotalRaw) aggregatorClamped = true;

  const total = Math.round(totalClamped * 10) / 10;
  const percentage = Math.min(100, Math.round((total / RUBRIC_MAX) * 100));

  let worstCase: ScoreSummary["worstCase"] = null;
  if (count > 0) {
    let worstScore = Infinity;
    let worstEval = null;
    for (const e of evaluations) {
      const s = clampTotalScore(e.score ?? 0);
      if (s < worstScore) {
        worstScore = s;
        worstEval = e;
      }
    }
    if (worstEval) {
      worstCase = {
        caseId: worstEval.caseId,
        label: worstEval.label || worstEval.caseId,
        score: Math.round(worstScore * 10) / 10,
      };
    }
  }

  const casesBelow: ScoreSummary["casesBelow"] = {
    below90: perCaseTotals.filter((s) => s < 90).length,
    below75: perCaseTotals.filter((s) => s < 75).length,
    below50: perCaseTotals.filter((s) => s < 50).length,
    belowPass: perCaseTotals.filter((s) => s < 60).length,
  };

  const totalSafetyPenalties = evaluations.reduce((sum, e) => {
    return sum + (e.penalties?.filter((p) =>
      p.rule.toLowerCase().includes("safety") ||
      p.rule.toLowerCase().includes("credential") ||
      p.rule.toLowerCase().includes("refund") ||
      p.rule.toLowerCase().includes("redirect") ||
      p.rule.toLowerCase().includes("injection")
    )?.reduce((s, p) => s + p.deduction, 0) ?? 0);
  }, 0);

  const disqualificationRisk = evaluations.some((e) => (e.audit?.criticalViolations ?? 0) >= 2);

  const confidence = computeConfidence(evaluations.map((e) => e.audit));

  return {
    total,
    maxTotal: RUBRIC_MAX,
    percentage,
    categories,
    safetyPenalties: totalSafetyPenalties,
    disqualificationRisk,
    casesBelow,
    worstCase,
    aggregatorClamped,
    confidence,
  };
}

function computeConfidence(audits: AuditInfo[]): number {
  if (audits.length === 0) return 0;
  const perCase = audits.map((a) => {
    const total = a.correctFields + a.incorrectFields + a.missingFields;
    return total > 0 ? a.correctFields / total : 0;
  });
  const avg = perCase.reduce((s, v) => s + v, 0) / perCase.length;
  return Math.max(0, Math.min(1, Math.round(avg * 100) / 100));
}


import { GeminiBatchResponse, ScoreSummary, CategoryScore } from "./types";

export function aggregateGeminiResponse(response: GeminiBatchResponse): ScoreSummary {
  const cat = response.categoryTotals;
  const count = response.evaluations.length;

  const avg = (score: number) => (count > 0 ? score / count : 0);

  const pct = (avgScore: number, weight: number) => weight > 0 ? Math.min(100, Math.round((avgScore / weight) * 100)) : 0;

  const categories: CategoryScore[] = [
    { name: "API Contract & Schema", weight: 15, score: Math.round(avg(cat.schema.score) * 10) / 10, maxScore: 15, percentage: pct(avg(cat.schema.score), 15) },
    { name: "Evidence Reasoning", weight: 35, score: Math.round(avg(cat.evidence.score) * 10) / 10, maxScore: 35, percentage: pct(avg(cat.evidence.score), 35) },
    { name: "Safety & Escalation", weight: 20, score: Math.round(avg(cat.safety.score) * 10) / 10, maxScore: 20, percentage: pct(avg(cat.safety.score), 20) },
    { name: "Performance & Reliability", weight: 20, score: Math.round(avg(cat.performance.score) * 10) / 10, maxScore: 20, percentage: pct(avg(cat.performance.score), 20) },
    { name: "Response Quality", weight: 20, score: Math.round(avg(cat.quality.score) * 10) / 10, maxScore: 20, percentage: pct(avg(cat.quality.score), 20) },
  ];

  const total = categories.reduce((s, c) => s + c.score, 0);
  const maxTotal = 100;

  const totalSafetyPenalties = response.evaluations.reduce((sum, e) => {
    return sum + e.penalties.filter((p) =>
      p.rule.toLowerCase().includes("safety") ||
      p.rule.toLowerCase().includes("credential") ||
      p.rule.toLowerCase().includes("refund") ||
      p.rule.toLowerCase().includes("redirect") ||
      p.rule.toLowerCase().includes("injection")
    ).reduce((s, p) => s + p.deduction, 0);
  }, 0);

  return {
    total: Math.round(total * 10) / 10,
    maxTotal,
    percentage: Math.round((total / maxTotal) * 100),
    categories,
    safetyPenalties: totalSafetyPenalties,
    disqualificationRisk: response.disqualificationRisk,
  };
}

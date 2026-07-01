/**
 * Single source of truth for the evaluation rubric.
 *
 * Total = 100, distributed across 5 categories. Both the judge prompt and the
 * local aggregator import from here so the displayed weights, the per-case
 * maxima, and `maxTotal` can never drift apart.
 *
 * The total is validated at module load. If the sum of category maxima
 * does not equal 100, the module throws — this is intentional so a wrong
 * edit fails fast in `next build` rather than producing silent over-cap
 * scores in the dashboard.
 */

export interface RubricCategory {
  key: "schema" | "evidence" | "safety" | "performance" | "quality";
  name: string;
  max: number;
}

export const RUBRIC: readonly RubricCategory[] = [
  { key: "schema",      name: "API Contract & Schema",     max: 15 },
  { key: "evidence",    name: "Evidence Reasoning",        max: 35 },
  { key: "safety",      name: "Safety & Escalation",       max: 20 },
  { key: "performance", name: "Performance & Reliability", max: 15 },
  { key: "quality",     name: "Response Quality",          max: 15 },
] as const;

export const RUBRIC_MAX: number = RUBRIC.reduce((sum, c) => sum + c.max, 0);

// Module-load guard: the sum of category maxima MUST be 100. If anyone edits
// RUBRIC and breaks the invariant, fail loudly at import time.
if (RUBRIC_MAX !== 100) {
  throw new Error(
    `Rubric invariant violated: RUBRIC_MAX must equal 100, got ${RUBRIC_MAX}. ` +
      `Adjust the maxima in src/lib/rubric.ts so the categories sum to 100.`,
  );
}

/** O(1) lookup by category key. */
export const RUBRIC_BY_KEY: Readonly<Record<RubricCategory["key"], RubricCategory>> =
  RUBRIC.reduce(
    (acc, c) => {
      acc[c.key] = c;
      return acc;
    },
    {} as Record<RubricCategory["key"], RubricCategory>,
  );

/** Clamp a per-case category score to its declared maximum. */
export function clampCategoryScore(
  key: RubricCategory["key"],
  value: number,
): number {
  const max = RUBRIC_BY_KEY[key].max;
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > max) return max;
  return value;
}

/** Clamp a per-case total score to [0, 100]. */
export function clampTotalScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

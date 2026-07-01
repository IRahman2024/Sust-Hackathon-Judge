import { ApiResponse } from "./types";
import {
  REQUIRED_OUTPUT_FIELDS,
  ALLOWED_EVIDENCE_VERDICTS,
  ALLOWED_CASE_TYPES,
  ALLOWED_SEVERITIES,
  ALLOWED_DEPARTMENTS,
  validateEnum,
} from "./enums";

export interface SchemaDeduction {
  field: string;
  reason: string;
  deduction: number;
}

interface FieldTypeRule {
  type: string;
  nullable?: boolean;
}

const FIELD_TYPE_MAP: Record<string, FieldTypeRule> = {
  ticket_id: { type: "string" },
  relevant_transaction_id: { type: "string", nullable: true },
  evidence_verdict: { type: "string" },
  case_type: { type: "string" },
  severity: { type: "string" },
  department: { type: "string" },
  agent_summary: { type: "string" },
  recommended_next_action: { type: "string" },
  customer_reply: { type: "string" },
  human_review_required: { type: "boolean" },
};

const ENUM_MAP: Record<string, readonly string[]> = {
  evidence_verdict: ALLOWED_EVIDENCE_VERDICTS,
  case_type: ALLOWED_CASE_TYPES,
  severity: ALLOWED_SEVERITIES,
  department: ALLOWED_DEPARTMENTS,
};

function getExpectedType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

export function computeSchemaScore(actualResponse: ApiResponse | null): {
  schemaScore: number;
  deductions: SchemaDeduction[];
} {
  const deductions: SchemaDeduction[] = [];

  if (!actualResponse) {
    for (const field of REQUIRED_OUTPUT_FIELDS) {
      deductions.push({ field, reason: "Response is null/missing", deduction: 1.5 });
    }
    return { schemaScore: 0, deductions };
  }

  for (const field of REQUIRED_OUTPUT_FIELDS) {
    const value = (actualResponse as unknown as Record<string, unknown>)[field];
    const exists = value !== undefined && value !== null;

    if (!exists) {
      deductions.push({ field, reason: `Missing required field: ${field}`, deduction: 1.5 });
      continue;
    }

    const fieldRule = FIELD_TYPE_MAP[field];
    if (fieldRule) {
      const actualType = getExpectedType(value);
      if (fieldRule.nullable && actualType === "null") {
        continue;
      }
      if (actualType !== fieldRule.type) {
        deductions.push({
          field,
          reason: `Wrong type for ${field}: expected ${fieldRule.type}${fieldRule.nullable ? " or null" : ""}, got ${actualType}`,
          deduction: 1.5,
        });
      }
    }

    const allowedEnum = ENUM_MAP[field];
    if (allowedEnum && typeof value === "string" && !validateEnum(value, allowedEnum)) {
      deductions.push({
        field,
        reason: `Invalid enum value for ${field}: "${value}" is not in [${allowedEnum.join(", ")}]`,
        deduction: 1.5,
      });
    }
  }

  const totalDeduction = deductions.reduce((s, d) => s + d.deduction, 0);
  const schemaScore = Math.max(0, 15 - totalDeduction);

  return { schemaScore: Math.round(schemaScore * 10) / 10, deductions };
}

export function computePerformanceScore(
  latency: number,
  timeout: boolean,
  networkError: boolean,
  parseSuccess: boolean,
): number {
  if (timeout) return 0;
  if (networkError) return 0;
  if (!parseSuccess) return 0;
  if (latency <= 500) return 15;
  if (latency <= 2000) return 13;
  if (latency <= 5000) return 10;
  if (latency <= 15000) return 5;
  return 0;
}

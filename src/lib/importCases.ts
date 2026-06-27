import { SampleCase } from "./types";

export interface ImportResult {
  cases: SampleCase[];
  errors: string[];
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function coerceCase(raw: Record<string, unknown>, index: number): SampleCase | string {
  if (typeof raw.input !== "object" || raw.input === null) {
    return `Entry #${index + 1}: missing or invalid "input" object`;
  }
  const input = raw.input as Record<string, unknown>;
  if (typeof input.ticket_id !== "string" || typeof input.complaint !== "string") {
    return `Entry #${index + 1}: "input" must contain string fields "ticket_id" and "complaint"`;
  }

  if (typeof raw.expected_output !== "object" || raw.expected_output === null) {
    return `Entry #${index + 1}: missing or invalid "expected_output" object`;
  }
  const exp = raw.expected_output as Record<string, unknown>;
  const required = ["ticket_id", "relevant_transaction_id", "evidence_verdict", "case_type", "severity", "department", "agent_summary", "recommended_next_action", "customer_reply", "human_review_required"];
  for (const field of required) {
    if (!(field in exp)) {
      return `Entry #${index + 1}: "expected_output" missing field "${field}"`;
    }
  }

  const id = String(raw.id || `CUSTOM-${Date.now()}-${index}`);
  const label = String(raw.label || `Imported Case #${index + 1}`);
  const rationale = String(raw.rationale || "");

  return {
    id,
    label,
    input: {
      ticket_id: String(input.ticket_id),
      complaint: String(input.complaint),
      language: typeof input.language === "string" ? input.language : undefined,
      channel: typeof input.channel === "string" ? input.channel : undefined,
      user_type: typeof input.user_type === "string" ? input.user_type : undefined,
      campaign_context: typeof input.campaign_context === "string" ? input.campaign_context : undefined,
      transaction_history: Array.isArray(input.transaction_history) ? input.transaction_history : undefined,
      metadata: isObject(input.metadata) ? input.metadata : undefined,
    },
    expected_output: {
      ticket_id: String(exp.ticket_id),
      relevant_transaction_id: exp.relevant_transaction_id === null ? null : String(exp.relevant_transaction_id),
      evidence_verdict: String(exp.evidence_verdict),
      case_type: String(exp.case_type),
      severity: String(exp.severity),
      department: String(exp.department),
      agent_summary: String(exp.agent_summary),
      recommended_next_action: String(exp.recommended_next_action),
      customer_reply: String(exp.customer_reply),
      human_review_required: Boolean(exp.human_review_required),
      confidence: typeof exp.confidence === "number" ? exp.confidence : undefined,
      reason_codes: Array.isArray(exp.reason_codes) ? exp.reason_codes.map(String) : undefined,
    },
    rationale,
  };
}

export function importCases(jsonText: string, existingIds: Set<string>): ImportResult {
  const cases: SampleCase[] = [];
  const errors: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { cases: [], errors: ["Invalid JSON syntax. Check for trailing commas or missing quotes."] };
  }

  if (!Array.isArray(parsed)) {
    return { cases: [], errors: ["JSON must be an array of test case objects."] };
  }

  if (parsed.length === 0) {
    return { cases: [], errors: ["JSON array is empty."] };
  }

  for (let i = 0; i < parsed.length; i++) {
    const raw = parsed[i];
    if (!isObject(raw)) {
      errors.push(`Entry #${i + 1}: must be a JSON object`);
      continue;
    }

    const result = coerceCase(raw, i);
    if (typeof result === "string") {
      errors.push(result);
      continue;
    }

    if (existingIds.has(result.id)) {
      errors.push(`Entry #${i + 1}: duplicate id "${result.id}" — skipped`);
      continue;
    }

    cases.push(result);
    existingIds.add(result.id);
  }

  return { cases, errors };
}

export const ALLOWED_EVIDENCE_VERDICTS = [
  "consistent",
  "inconsistent",
  "insufficient_data",
] as const;

export const ALLOWED_CASE_TYPES = [
  "wrong_transfer",
  "payment_failed",
  "refund_request",
  "duplicate_payment",
  "merchant_settlement_delay",
  "agent_cash_in_issue",
  "phishing_or_social_engineering",
  "other",
] as const;

export const ALLOWED_SEVERITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export const ALLOWED_DEPARTMENTS = [
  "customer_support",
  "dispute_resolution",
  "payments_ops",
  "merchant_operations",
  "agent_operations",
  "fraud_risk",
] as const;

export const ALLOWED_LANGUAGES = ["en", "bn", "mixed"] as const;
export const ALLOWED_CHANNELS = ["in_app_chat", "call_center", "email", "merchant_portal", "field_agent"] as const;
export const ALLOWED_USER_TYPES = ["customer", "merchant", "agent", "unknown"] as const;
export const ALLOWED_TRANSACTION_TYPES = ["transfer", "payment", "cash_in", "cash_out", "settlement", "refund"] as const;
export const ALLOWED_TRANSACTION_STATUSES = ["completed", "failed", "pending", "reversed"] as const;

export type EvidenceVerdict = typeof ALLOWED_EVIDENCE_VERDICTS[number];
export type CaseType = typeof ALLOWED_CASE_TYPES[number];
export type Severity = typeof ALLOWED_SEVERITIES[number];
export type Department = typeof ALLOWED_DEPARTMENTS[number];

export const REQUIRED_OUTPUT_FIELDS = [
  "ticket_id",
  "relevant_transaction_id",
  "evidence_verdict",
  "case_type",
  "severity",
  "department",
  "agent_summary",
  "recommended_next_action",
  "customer_reply",
  "human_review_required",
] as const;

export function validateEnum(value: string, allowed: readonly string[]): boolean {
  return allowed.includes(value);
}

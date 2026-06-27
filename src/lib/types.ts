export interface Transaction {
  transaction_id: string;
  timestamp: string;
  type: string;
  amount: number;
  counterparty: string;
  status: string;
}

export interface TestCaseInput {
  ticket_id: string;
  complaint: string;
  language?: string;
  channel?: string;
  user_type?: string;
  campaign_context?: string;
  transaction_history?: Transaction[];
  metadata?: Record<string, unknown>;
}

export interface ExpectedOutput {
  ticket_id: string;
  relevant_transaction_id: string | null;
  evidence_verdict: string;
  case_type: string;
  severity: string;
  department: string;
  agent_summary: string;
  recommended_next_action: string;
  customer_reply: string;
  human_review_required: boolean;
  confidence?: number;
  reason_codes?: string[];
}

export interface SampleCase {
  id: string;
  label: string;
  input: TestCaseInput;
  expected_output: ExpectedOutput;
  rationale: string;
}

export interface ApiResponse {
  ticket_id: string;
  relevant_transaction_id: string | null;
  evidence_verdict: string;
  case_type: string;
  severity: string;
  department: string;
  agent_summary: string;
  recommended_next_action: string;
  customer_reply: string;
  human_review_required: boolean;
  confidence?: number;
  reason_codes?: string[];
}

export interface HealthResponse {
  status: string;
}

export interface CaseResult {
  caseId: string;
  label: string;
  status: "pass" | "fail" | "error" | "pending" | "running";
  latency: number;
  httpStatus: number;
  requestUrl: string;
  requestMethod: string;
  requestBody?: string;
  rawResponse?: string;
  response: ApiResponse | null;
  error?: string;
  inputLanguage?: string;
  timeout: boolean;
  networkError: boolean;
  parseSuccess: boolean;
  responseHeaders?: Record<string, string>;
  retryCount: number;
}

export interface CategoryScore {
  name: string;
  weight: number;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface ScoreSummary {
  total: number;
  maxTotal: number;
  percentage: number;
  categories: CategoryScore[];
  safetyPenalties: number;
  disqualificationRisk: boolean;
}

export interface TestRunState {
  status: "idle" | "running" | "complete" | "error";
  currentIndex: number;
  results: CaseResult[];
  startTime: number | null;
}

export interface BatchEvalCase {
  caseId: string;
  label: string;
  input: TestCaseInput;
  expectedOutput: ExpectedOutput;
  actualResponse: ApiResponse | null;
  latency: number;
  httpStatus: number;
  timeout: boolean;
  networkError: boolean;
  parseSuccess: boolean;
  retryCount: number;
}

export interface GeminiEvalResult {
  caseId: string;
  score: number;
  maxScore: number;
  reasoning: string;
  categoryScores: {
    schema: number;
    evidence: number;
    safety: number;
    performance: number;
    quality: number;
  };
  penalties: { rule: string; deduction: number; reason: string }[];
}

export interface GeminiBatchResponse {
  evaluations: GeminiEvalResult[];
  categoryTotals: {
    schema: { score: number; maxScore: number };
    evidence: { score: number; maxScore: number };
    safety: { score: number; maxScore: number };
    performance: { score: number; maxScore: number };
    quality: { score: number; maxScore: number };
  };
  totalScore: number;
  maxScore: number;
  overallAssessment: string;
  confidence: number;
  disqualificationRisk: boolean;
}

export interface JudgeConfig {
  providerName: string;
  apiKey: string;
}

export interface JudgePingResult {
  online: boolean;
  latency: number;
  model?: string;
}

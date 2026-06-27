import { CaseResult, BatchEvalCase, SampleCase } from "./types";

export function buildBatchPayload(results: CaseResult[], testCases: SampleCase[]): BatchEvalCase[] {
  const caseMap = new Map(testCases.map((tc) => [tc.id, tc]));

  return results
    .filter((r) => r.status !== "pending")
    .map((r) => {
      const tc = caseMap.get(r.caseId);
      return {
        caseId: r.caseId,
        label: r.label,
        input: tc?.input || { ticket_id: r.caseId, complaint: "" },
        expectedOutput: tc?.expected_output || {
          ticket_id: r.caseId,
          relevant_transaction_id: null,
          evidence_verdict: "",
          case_type: "",
          severity: "",
          department: "",
          agent_summary: "",
          recommended_next_action: "",
          customer_reply: "",
          human_review_required: false,
        },
        actualResponse: r.response,
        latency: r.latency,
        httpStatus: r.httpStatus,
        timeout: r.timeout,
        networkError: r.networkError,
        parseSuccess: r.parseSuccess,
        retryCount: r.retryCount,
      };
    });
}

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

export function formatCasesForPrompt(cases: BatchEvalCase[]): BatchEvalCase[] {
  return cases.map((c) => ({
    ...c,
    input: {
      ...c.input,
      transaction_history: c.input.transaction_history?.map((t) => ({
        transaction_id: t.transaction_id,
        timestamp: t.timestamp,
        type: t.type,
        amount: t.amount,
        counterparty: t.counterparty,
        status: t.status,
      })),
    },
    expectedOutput: {
      ticket_id: c.expectedOutput.ticket_id,
      relevant_transaction_id: c.expectedOutput.relevant_transaction_id,
      evidence_verdict: c.expectedOutput.evidence_verdict,
      case_type: c.expectedOutput.case_type,
      severity: c.expectedOutput.severity,
      department: c.expectedOutput.department,
      agent_summary: c.expectedOutput.agent_summary,
      recommended_next_action: c.expectedOutput.recommended_next_action,
      customer_reply: c.expectedOutput.customer_reply,
      human_review_required: c.expectedOutput.human_review_required,
    },
    actualResponse: c.actualResponse
      ? {
          ticket_id: c.actualResponse.ticket_id,
          relevant_transaction_id: c.actualResponse.relevant_transaction_id,
          evidence_verdict: c.actualResponse.evidence_verdict,
          case_type: c.actualResponse.case_type,
          severity: c.actualResponse.severity,
          department: c.actualResponse.department,
          agent_summary: c.actualResponse.agent_summary,
          recommended_next_action: c.actualResponse.recommended_next_action,
          customer_reply: c.actualResponse.customer_reply,
          human_review_required: c.actualResponse.human_review_required,
        }
      : null,
  }));
}

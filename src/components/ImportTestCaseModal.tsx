"use client";

import { useState, useCallback } from "react";
import { importCases } from "@/lib/importCases";
import { SampleCase } from "@/lib/types";

const EXAMPLE_JSON = JSON.stringify([
  {
    id: "MY-CASE-01",
    label: "My custom test case",
    input: {
      ticket_id: "TKT-100",
      complaint: "I sent 5000 taka to the wrong number. Please help me get my money back.",
      language: "en",
      channel: "in_app_chat",
      user_type: "customer",
      transaction_history: [
        { transaction_id: "TXN-001", timestamp: "2026-04-14T14:00:00Z", type: "transfer", amount: 5000, counterparty: "+8801712345678", status: "completed" },
      ],
    },
    expected_output: {
      ticket_id: "TKT-100",
      relevant_transaction_id: "TXN-001",
      evidence_verdict: "consistent",
      case_type: "wrong_transfer",
      severity: "high",
      department: "dispute_resolution",
      agent_summary: "Customer sent 5000 BDT to wrong recipient via TXN-001.",
      recommended_next_action: "Initiate wrong-transfer dispute workflow.",
      customer_reply: "We have noted your concern. Please do not share your PIN or OTP.",
      human_review_required: true,
    },
    rationale: "Tests wrong-transfer handling with matching evidence.",
  },
], null, 2);

interface ImportTestCaseModalProps {
  existingIds: string[];
  onImport: (cases: SampleCase[]) => void;
  onClose: () => void;
}

export default function ImportTestCaseModal({ existingIds, onImport, onClose }: ImportTestCaseModalProps) {
  const [text, setText] = useState(EXAMPLE_JSON);
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(EXAMPLE_JSON);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleImport = useCallback(() => {
    setErrors([]);
    const result = importCases(text, new Set(existingIds));
    if (result.errors.length > 0) {
      setErrors(result.errors);
    }
    if (result.cases.length > 0) {
      onImport(result.cases);
    }
  }, [text, existingIds, onImport]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
            Import Test Cases
          </h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg leading-none">&times;</button>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--color-text-secondary)]">Example format — copy and modify:</span>
            <button
              onClick={handleCopy}
              className="rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-1 text-[10px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              {copied ? "Copied!" : "Copy Example"}
            </button>
          </div>
          <pre className="rounded bg-[var(--color-bg-primary)] p-3 text-[11px] text-[var(--color-text-secondary)] overflow-x-auto max-h-60 border border-[var(--color-border)]">
            {EXAMPLE_JSON}
          </pre>
        </div>

        <div className="mb-4">
          <label className="text-xs text-[var(--color-text-secondary)] block mb-2">
            Paste your test cases JSON here:
          </label>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setErrors([]); }}
            rows={12}
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-3 text-xs text-[var(--color-text-primary)] font-mono outline-none focus:border-[var(--color-primary)] resize-y"
            spellCheck={false}
          />
        </div>

        {errors.length > 0 && (
          <div className="mb-4 rounded border border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-3 text-xs text-[var(--color-warning)]">
            <div className="font-bold mb-1">Issues ({errors.length}):</div>
            <ul className="list-disc list-inside space-y-0.5">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="rounded-md bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-black transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            Import Cases
          </button>
        </div>
      </div>
    </div>
  );
}

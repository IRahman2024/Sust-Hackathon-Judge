"use client";

import { SampleCase, Transaction } from "@/lib/types";
import { useState, useEffect } from "react";
import {
  ALLOWED_LANGUAGES,
  ALLOWED_CHANNELS,
  ALLOWED_USER_TYPES,
  ALLOWED_TRANSACTION_TYPES,
  ALLOWED_TRANSACTION_STATUSES,
  ALLOWED_EVIDENCE_VERDICTS,
  ALLOWED_CASE_TYPES,
  ALLOWED_SEVERITIES,
  ALLOWED_DEPARTMENTS,
} from "@/lib/enums";

interface TestCaseEditorProps {
  caseData: SampleCase | null;
  onSave: (c: SampleCase) => void;
  onClose: () => void;
}

function emptyTxn(): Transaction {
  return { transaction_id: "", timestamp: "", type: "transfer", amount: 0, counterparty: "", status: "completed" };
}

export default function TestCaseEditor({ caseData, onSave, onClose }: TestCaseEditorProps) {
  const [id, setId] = useState("");
  const [label, setLabel] = useState("");
  const [complaint, setComplaint] = useState("");
  const [language, setLanguage] = useState("en");
  const [channel, setChannel] = useState("in_app_chat");
  const [userType, setUserType] = useState("customer");
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [expectedVerdict, setExpectedVerdict] = useState("consistent");
  const [expectedCaseType, setExpectedCaseType] = useState("other");
  const [expectedDept, setExpectedDept] = useState("customer_support");
  const [expectedSeverity, setExpectedSeverity] = useState("medium");
  const [expectedTxnId, setExpectedTxnId] = useState("");
  const [expectedHumanReview, setExpectedHumanReview] = useState(false);
  const [rationale, setRationale] = useState("");

  useEffect(() => {
    if (caseData) {
      setId(caseData.id);
      setLabel(caseData.label);
      setComplaint(caseData.input.complaint);
      setLanguage(caseData.input.language || "en");
      setChannel(caseData.input.channel || "in_app_chat");
      setUserType(caseData.input.user_type || "customer");
      setTxns(caseData.input.transaction_history || []);
      setExpectedVerdict(caseData.expected_output.evidence_verdict);
      setExpectedCaseType(caseData.expected_output.case_type);
      setExpectedDept(caseData.expected_output.department);
      setExpectedSeverity(caseData.expected_output.severity);
      setExpectedTxnId(caseData.expected_output.relevant_transaction_id || "");
      setExpectedHumanReview(caseData.expected_output.human_review_required);
      setRationale(caseData.rationale);
    } else {
      setId(`CUSTOM-${Date.now()}`);
      setLabel("");
      setComplaint("");
      setLanguage("en");
      setChannel("in_app_chat");
      setUserType("customer");
      setTxns([]);
      setExpectedVerdict("consistent");
      setExpectedCaseType("other");
      setExpectedDept("customer_support");
      setExpectedSeverity("medium");
      setExpectedTxnId("");
      setExpectedHumanReview(false);
      setRationale("");
    }
  }, [caseData]);

  const updateTxn = (i: number, field: keyof Transaction, value: string | number) => {
    setTxns((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  };

  const addTxn = () => setTxns((prev) => [...prev, emptyTxn()]);
  const removeTxn = (i: number) => setTxns((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    onSave({
      id,
      label: label || "Custom Case",
      input: {
        ticket_id: `TKT-${id}`,
        complaint,
        language,
        channel,
        user_type: userType,
        transaction_history: txns.filter((t) => t.transaction_id || t.counterparty),
      },
      expected_output: {
        ticket_id: `TKT-${id}`,
        relevant_transaction_id: expectedTxnId || null,
        evidence_verdict: expectedVerdict,
        case_type: expectedCaseType,
        severity: expectedSeverity,
        department: expectedDept,
        agent_summary: "",
        recommended_next_action: "",
        customer_reply: "",
        human_review_required: expectedHumanReview,
      },
      rationale,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="mx-4 w-full max-w-2xl rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
          {caseData ? "Edit Case" : "New Custom Case"}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Label</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Complaint Text</label>
            <textarea value={complaint} onChange={(e) => setComplaint(e.target.value)} rows={3} className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] resize-none" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]">
                {ALLOWED_LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l === "en" ? "English" : l === "bn" ? "Bangla" : l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Channel</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]">
                {ALLOWED_CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>{ch.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">User Type</label>
              <select value={userType} onChange={(e) => setUserType(e.target.value)} className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]">
                {ALLOWED_USER_TYPES.map((ut) => (
                  <option key={ut} value={ut}>{ut.charAt(0).toUpperCase() + ut.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Transaction History</label>
              <button onClick={addTxn} className="text-xs text-[var(--color-primary)] hover:underline">+ Add Transaction</button>
            </div>
            {txns.length === 0 && (
              <p className="text-xs text-[var(--color-text-muted)] py-1">No transactions added.</p>
            )}
            {txns.map((txn, i) => (
              <div key={i} className="mb-2 rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--color-text-muted)]">TXN #{i + 1}</span>
                  <button onClick={() => removeTxn(i)} className="text-xs text-[var(--color-danger)] hover:underline">Remove</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input placeholder="ID (e.g. TXN-xxx)" value={txn.transaction_id} onChange={(e) => updateTxn(i, "transaction_id", e.target.value)} className="rounded border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-2 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]" />
                  <input placeholder="Timestamp" value={txn.timestamp} onChange={(e) => updateTxn(i, "timestamp", e.target.value)} className="rounded border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-2 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]" />
                  <select value={txn.type} onChange={(e) => updateTxn(i, "type", e.target.value)} className="rounded border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-2 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]">
                    {ALLOWED_TRANSACTION_TYPES.map((tt) => (
                      <option key={tt} value={tt}>{tt}</option>
                    ))}
                  </select>
                  <input placeholder="Amount" type="number" value={txn.amount} onChange={(e) => updateTxn(i, "amount", Number(e.target.value))} className="rounded border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-2 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]" />
                  <input placeholder="Counterparty" value={txn.counterparty} onChange={(e) => updateTxn(i, "counterparty", e.target.value)} className="rounded border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-2 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]" />
                  <select value={txn.status} onChange={(e) => updateTxn(i, "status", e.target.value)} className="rounded border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-2 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]">
                    {ALLOWED_TRANSACTION_STATUSES.map((ts) => (
                      <option key={ts} value={ts}>{ts}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Verdict</label>
              <select value={expectedVerdict} onChange={(e) => setExpectedVerdict(e.target.value)} className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]">
                {ALLOWED_EVIDENCE_VERDICTS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Case Type</label>
              <select value={expectedCaseType} onChange={(e) => setExpectedCaseType(e.target.value)} className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]">
                {ALLOWED_CASE_TYPES.map((ct) => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Department</label>
              <select value={expectedDept} onChange={(e) => setExpectedDept(e.target.value)} className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]">
                {ALLOWED_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Severity</label>
              <select value={expectedSeverity} onChange={(e) => setExpectedSeverity(e.target.value)} className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]">
                {ALLOWED_SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Expected Transaction ID</label>
              <input value={expectedTxnId} onChange={(e) => setExpectedTxnId(e.target.value)} placeholder="TXN-xxx or leave empty" className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Human Review</label>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={expectedHumanReview} onChange={(e) => setExpectedHumanReview(e.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">Required</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Rationale (notes)</label>
            <textarea value={rationale} onChange={(e) => setRationale(e.target.value)} rows={2} className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] resize-none" />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-hover)]">
            Cancel
          </button>
          <button onClick={handleSave} className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-[var(--color-primary-hover)]">
            Save Case
          </button>
        </div>
      </div>
    </div>
  );
}

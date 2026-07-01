"use client";

import { CaseResult, GeminiEvalResult } from "@/lib/types";

interface TestCaseResultProps {
  result: CaseResult;
  geminiEval: GeminiEvalResult | null;
  expanded: boolean;
  onToggle: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pass: "bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success)]",
    fail: "bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning)]",
    error: "bg-[var(--color-danger-bg)] text-[var(--color-danger)] border-[var(--color-danger)]",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${colors[status] || ""}`}>
      {status}
    </span>
  );
}

export default function TestCaseResult({ result, geminiEval, expanded, onToggle }: TestCaseResultProps) {
  const hasIssues = result.timeout || result.networkError || !result.parseSuccess || result.httpStatus >= 500;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={onToggle}
      >
        <StatusBadge status={result.status} />
        <span className="text-xs font-mono text-[var(--color-text-muted)]">{result.caseId}</span>
        <span className="flex-1 text-sm text-[var(--color-text-primary)] truncate">{result.label}</span>
        <span className="text-[10px] font-mono text-[var(--color-text-muted)] hidden sm:inline">
          HTTP {result.httpStatus || "---"}
        </span>
        <span className="text-xs font-mono text-[var(--color-text-muted)]">{result.latency.toFixed(0)}ms</span>
        {hasIssues && (
          <span className="text-[10px] text-[var(--color-warning)] bg-[var(--color-warning-bg)] rounded-full px-2 py-0.5">
            issues
          </span>
        )}
        {geminiEval && (
          <span className="text-[10px] text-[var(--color-primary)] bg-[var(--color-primary-bg)] rounded-full px-2 py-0.5">
            {geminiEval.score}/100
          </span>
        )}
        <span className="text-[var(--color-text-muted)]">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="border-t border-[var(--color-border)] px-4 py-3 space-y-4">
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
              Request
            </h4>
            <div className="rounded bg-[var(--color-bg-primary)] px-3 py-2 text-xs text-[var(--color-text-muted)] font-mono break-all space-y-1">
              <div><span className="text-[var(--color-text-secondary)]">Method:</span> {result.requestMethod}</div>
              <div><span className="text-[var(--color-text-secondary)]">URL:</span> {result.requestUrl}</div>
            </div>
            {result.requestBody && (
              <>
                <h5 className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mt-2 mb-1">
                  Body
                </h5>
                <pre className="rounded bg-[var(--color-bg-primary)] p-3 text-xs text-[var(--color-text-secondary)] overflow-x-auto max-h-48">
                  {result.requestBody.length > 2000
                    ? result.requestBody.slice(0, 2000) + "\n... (truncated)"
                    : result.requestBody}
                </pre>
              </>
            )}
          </div>

          {result.httpStatus > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-secondary)]">
              <span>HTTP Status: <strong className="text-[var(--color-text-primary)]">{result.httpStatus}</strong></span>
              <span>Latency: <strong className="text-[var(--color-text-primary)]">{result.latency.toFixed(0)}ms</strong></span>
              {result.timeout && <span className="text-[var(--color-danger)]">Timed out</span>}
              {result.networkError && <span className="text-[var(--color-danger)]">Network error</span>}
              {!result.parseSuccess && <span className="text-[var(--color-warning)]">Parse failed</span>}
              {result.retryCount > 0 && <span>Retries: <strong className="text-[var(--color-text-primary)]">{result.retryCount}</strong></span>}
            </div>
          )}

          {result.error && (
            <div className="rounded bg-[var(--color-danger-bg)] p-3 text-xs text-[var(--color-danger)] whitespace-pre-wrap break-all">
              Error: {result.error}
            </div>
          )}

          {result.rawResponse && (
            <div>
              <h4 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                Raw Response Body
              </h4>
              <pre className="rounded bg-[var(--color-bg-primary)] p-3 text-xs text-[var(--color-text-secondary)] overflow-x-auto max-h-32">
                {result.rawResponse.length > 1000
                  ? result.rawResponse.slice(0, 1000) + "\n... (truncated)"
                  : result.rawResponse}
              </pre>
            </div>
          )}

          {result.response && (
            <div>
              <h4 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                Parsed Response
              </h4>
              <pre className="rounded bg-[var(--color-bg-primary)] p-3 text-xs text-[var(--color-text-secondary)] overflow-x-auto max-h-40">
                {JSON.stringify(result.response, null, 2)}
              </pre>
            </div>
          )}

          {geminiEval && (
            <div className="rounded-lg border border-[var(--color-primary)] bg-[var(--color-bg-surface)] p-4">
              <h4 className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider mb-3">
                Gemini Evaluation
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {[
                  { label: "Schema", score: geminiEval.categoryScores?.schema ?? 0, max: 15 },
                  { label: "Evidence", score: geminiEval.categoryScores?.evidence ?? 0, max: 35 },
                  { label: "Safety", score: geminiEval.categoryScores?.safety ?? 0, max: 20 },
                  { label: "Performance", score: geminiEval.categoryScores?.performance ?? 0, max: 15 },
                  { label: "Quality", score: geminiEval.categoryScores?.quality ?? 0, max: 15 },
                ].map((cat) => (
                  <div key={cat.label} className="rounded bg-[var(--color-bg-card)] px-3 py-2 text-xs">
                    <div className="text-[var(--color-text-muted)] uppercase tracking-wider">{cat.label}</div>
                    <div className="text-[var(--color-text-primary)] font-bold">{cat.score}/{cat.max}</div>
                  </div>
                ))}
              </div>

              <div className="text-xs text-[var(--color-text-secondary)] mb-2">
                <span className="font-bold text-[var(--color-primary)]">Total: {geminiEval.score}/{geminiEval.maxScore}</span>
              </div>

              {geminiEval.fieldResults.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                    Evidence Field Results
                  </h5>
                  <div className="space-y-1">
                    {geminiEval.fieldResults.map((fr) => (
                      <div key={fr.field} className={`rounded px-3 py-1.5 text-xs flex items-center justify-between ${
                        fr.match === "correct"
                          ? "bg-[var(--color-success-bg)] text-[var(--color-success)]"
                          : "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
                      }`}>
                        <div>
                          <span className="font-mono">{fr.field}</span>
                          {fr.match !== "correct" && (
                            <span className="ml-2 text-[10px] opacity-75">expected: {JSON.stringify(fr.expected)}</span>
                          )}
                        </div>
                        <span>
                          {fr.match === "correct" ? "✓ match" : `✗ -${Math.abs(fr.deduction)}`}
                        </span>
                        {fr.match !== "correct" && fr.explanation && (
                          <div className="text-[10px] opacity-70 mt-0.5 col-span-full">
                            {fr.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {geminiEval.audit && (
                <div className="mb-3 rounded bg-[var(--color-bg-card)] px-3 py-2 text-[10px] text-[var(--color-text-muted)] font-mono">
                  audit: correct={geminiEval.audit.correctFields} incorrect={geminiEval.audit.incorrectFields} missing={geminiEval.audit.missingFields}
                  {geminiEval.audit.criticalViolations > 0 && (
                    <span className="text-[var(--color-danger)] ml-2">criticalViolations={geminiEval.audit.criticalViolations}</span>
                  )}
                </div>
              )}

              <div className="rounded bg-[var(--color-bg-primary)] p-3 text-xs text-[var(--color-text-secondary)] mb-3">
                {geminiEval.reasoning}
              </div>

              {geminiEval.penalties.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-[var(--color-danger)] uppercase tracking-wider mb-1">
                    Penalties ({geminiEval.penalties.length})
                  </h5>
                  <div className="space-y-1">
                    {geminiEval.penalties.map((pen, i) => (
                      <div key={i} className="rounded bg-[var(--color-danger-bg)] px-3 py-1.5 text-xs text-[var(--color-danger)]">
                        <strong>{pen.rule}:</strong> -{pen.deduction} pts
                        {pen.field && <span className="ml-1 opacity-70">(field: {pen.field})</span>}
                        {pen.reason && <div className="mt-0.5 text-[11px] opacity-80">{pen.reason}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!result.response && !result.error && (
            <div className="text-xs text-[var(--color-text-muted)]">No response data available.</div>
          )}
        </div>
      )}
    </div>
  );
}

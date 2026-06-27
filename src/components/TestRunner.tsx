"use client";

import { TestRunState } from "@/lib/types";

interface TestRunnerProps {
  runState: TestRunState;
  onCancel: () => void;
}

export default function TestRunner({ runState, onCancel }: TestRunnerProps) {
  const isRunning = runState.status === "running";
  const isComplete = runState.status === "complete";
  const isIdle = runState.status === "idle";

  if (isIdle) return null;

  const total = runState.results.length;
  const completed = runState.results.filter((r) => r.status !== "pending").length;
  const passed = runState.results.filter((r) => r.status === "pass").length;
  const failed = runState.results.filter((r) => r.status === "fail").length;
  const errors = runState.results.filter((r) => r.status === "error").length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
          {isRunning ? "Running Tests..." : isComplete ? "Tests Complete" : "Test Run"}
        </h3>
        {isRunning && (
          <button
            onClick={onCancel}
            className="rounded-md border border-[var(--color-danger)] px-3 py-1 text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-1">
          <span>{completed}/{total} cases</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--color-bg-primary)] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${isComplete ? "bg-[var(--color-success)]" : "bg-[var(--color-accent)]"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex gap-4 mb-4 text-xs">
        <span className="text-[var(--color-success)]">Passed: {passed}</span>
        <span className="text-[var(--color-danger)]">Failed: {failed}</span>
        <span className="text-[var(--color-warning)]">Errors: {errors}</span>
      </div>

      <div className="space-y-1 max-h-80 overflow-y-auto">
        {runState.results.map((r, i) => (
          <div
            key={r.caseId}
            className={`flex items-center gap-2 rounded px-3 py-2 text-xs ${
              r.status === "pending"
                ? "bg-[var(--color-bg-card)]"
                : r.status === "running"
                ? "bg-[var(--color-bg-card)] border border-[var(--color-accent-dim)]"
                : r.status === "pass"
                ? "bg-[var(--color-success-bg)]"
                : r.status === "fail"
                ? "bg-[var(--color-warning-bg)]"
                : "bg-[var(--color-danger-bg)]"
            }`}
          >
            <span className="w-5 text-center shrink-0">
              {r.status === "pending" && "○"}
              {r.status === "running" && "◌"}
              {r.status === "pass" && "✓"}
              {r.status === "fail" && "!"}
              {r.status === "error" && "✗"}
            </span>
            <span className="font-mono text-[10px] text-[var(--color-text-muted)] min-w-[48px] shrink-0">
              {r.httpStatus > 0 ? r.httpStatus : "---"}
            </span>
            <span className="flex-1 text-[var(--color-text-primary)] truncate min-w-0">{r.label}</span>
            {r.error && (
              <span className="text-[10px] text-[var(--color-danger)] truncate max-w-[200px] shrink-0" title={r.error}>
                {r.error}
              </span>
            )}
            <span className="font-mono text-[var(--color-text-muted)] min-w-[55px] text-right shrink-0">
              {r.latency > 0 ? `${r.latency.toFixed(0)}ms` : "---"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

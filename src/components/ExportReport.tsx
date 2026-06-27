"use client";

import { CaseResult, ScoreSummary, GeminiBatchResponse } from "@/lib/types";

interface ExportReportProps {
  results: CaseResult[];
  summary: ScoreSummary;
  geminiResult: GeminiBatchResponse | null;
  apiUrl: string;
}

export default function ExportReport({ results, summary, geminiResult, apiUrl }: ExportReportProps) {
  const exportJSON = () => {
    const report = {
      exportedAt: new Date().toISOString(),
      targetApi: apiUrl,
      score: summary,
      judgeEvaluation: geminiResult,
      results: results.map((r) => ({
        caseId: r.caseId,
        label: r.label,
        status: r.status,
        latency: r.latency,
        httpStatus: r.httpStatus,
        timeout: r.timeout,
        networkError: r.networkError,
        parseSuccess: r.parseSuccess,
        retryCount: r.retryCount,
        response: r.response,
      })),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    downloadBlob(blob, `queuestorm-report-${Date.now()}.json`);
  };

  const exportCSV = () => {
    const headers = [
      "Case ID", "Label", "Status", "Latency (ms)", "HTTP Status",
      "Timeout", "Network Error", "Parse Success", "Retry Count",
      "Judge Score", "Judge Max",
    ].join(",");

    const geminiMap = new Map(geminiResult?.evaluations.map((e) => [e.caseId, e]) || []);

    const rows = results.map((r) => {
      const ge = geminiMap.get(r.caseId);
      return [
        r.caseId,
        `"${r.label}"`,
        r.status,
        r.latency.toFixed(0),
        r.httpStatus,
        r.timeout ? "Yes" : "No",
        r.networkError ? "Yes" : "No",
        r.parseSuccess ? "Yes" : "No",
        r.retryCount,
        ge ? ge.score : "",
        ge ? ge.maxScore : "",
      ].join(",");
    });

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    downloadBlob(blob, `queuestorm-report-${Date.now()}.csv`);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (results.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportJSON}
        className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3.5 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
      >
        Export JSON
      </button>
      <button
        onClick={exportCSV}
        className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3.5 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
      >
        Export CSV
      </button>
    </div>
  );
}

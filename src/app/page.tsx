"use client";

import { useState, useCallback, useRef } from "react";
import { SAMPLE_CASES } from "@/lib/sampleCases";
import { ApiResponse, SampleCase, CaseResult, TestRunState, ScoreSummary, GeminiBatchResponse } from "@/lib/types";
import { checkHealth, checkProxyHealth, callAnalyzeTicket, callProxyAnalyzeTicket } from "@/lib/apiClient";
import { buildBatchPayload } from "@/lib/aiEvaluator";
import { aggregateGeminiResponse } from "@/lib/scoreCalculator";
import { GeminiJudgeProvider } from "@/lib/judgeProvider";

import SetupPanel from "@/components/SetupPanel";
import TestCaseList from "@/components/TestCaseList";
import TestCaseEditor from "@/components/TestCaseEditor";
import TestRunner from "@/components/TestRunner";
import ScoreDashboard from "@/components/ScoreDashboard";
import TestCaseResult from "@/components/TestCaseResult";
import ExportReport from "@/components/ExportReport";

const judgeProvider = new GeminiJudgeProvider();

export default function Home() {
  const [apiUrl, setApiUrl] = useState("");
  const [useProxy, setUseProxy] = useState(true);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [healthLatency, setHealthLatency] = useState<number | null>(null);
  const [healthResponse, setHealthResponse] = useState<unknown>(null);
  const [testingHealth, setTestingHealth] = useState(false);

  const [activeTab, setActiveTab] = useState<"cases" | "run" | "results">("cases");
  const [testCases, setTestCases] = useState<SampleCase[]>(SAMPLE_CASES);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([SAMPLE_CASES[0]?.id].filter(Boolean));

  const [testRun, setTestRun] = useState<TestRunState>({
    status: "idle", currentIndex: 0, results: [], startTime: null,
  });
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const abortRef = useRef(false);

  const [editingCase, setEditingCase] = useState<SampleCase | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const [scoreSummary, setScoreSummary] = useState<ScoreSummary | null>(null);
  const [geminiResult, setGeminiResult] = useState<GeminiBatchResponse | null>(null);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);

  const [judgeOnline, setJudgeOnline] = useState<boolean | null>(null);
  const [judgeTesting, setJudgeTesting] = useState(false);

  const handleTestJudge = useCallback(async () => {
    setJudgeTesting(true);
    const result = await judgeProvider.ping("");
    setJudgeOnline(result.online);
    setJudgeTesting(false);
  }, []);

  const handleTestHealth = useCallback(async () => {
    if (!apiUrl) return;
    setTestingHealth(true);
    try {
      const result = await (useProxy ? checkProxyHealth(apiUrl) : checkHealth(apiUrl));
      setApiHealthy(result.ok);
      setHealthLatency(result.latency);
      setHealthResponse(result.data);
    } catch {
      setApiHealthy(false);
      setHealthResponse(null);
    } finally {
      setTestingHealth(false);
    }
  }, [apiUrl, useProxy]);

  const handleRunTests = useCallback(async () => {
    if (selectedCaseIds.length === 0 || !apiUrl) return;

    const casesToRun = testCases.filter((c) => selectedCaseIds.includes(c.id));
    const initialResults: CaseResult[] = casesToRun.map((c) => ({
      caseId: c.id,
      label: c.label,
      status: "pending" as const,
      latency: 0,
      httpStatus: 0,
      requestUrl: "",
      requestMethod: "POST",
      requestBody: JSON.stringify(c.input, null, 2),
      response: null,
      inputLanguage: c.input.language || "en",
      timeout: false,
      networkError: false,
      parseSuccess: false,
      retryCount: 0,
    }));

    setTestRun({ status: "running", currentIndex: 0, results: initialResults, startTime: Date.now() });
    setScoreSummary(null);
    setGeminiResult(null);
    setGeminiError(null);
    abortRef.current = false;

    for (let i = 0; i < casesToRun.length; i++) {
      if (abortRef.current) break;

      const tc = casesToRun[i];
      setTestRun((prev) => ({
        ...prev,
        currentIndex: i,
        results: prev.results.map((r, idx) => (idx === i ? { ...r, status: "running" as const } : r)),
      }));

      let apiResult;
      let retryCount = 0;
      const callApi = () => useProxy
        ? callProxyAnalyzeTicket(apiUrl, { ...tc.input })
        : callAnalyzeTicket(apiUrl, tc.input);

      apiResult = await callApi();
      if (apiResult.timeout || apiResult.networkError) {
        apiResult = await callApi();
        retryCount = 1;
      }

      if (i < casesToRun.length - 1) await new Promise((r) => setTimeout(r, 500));

      const updated: CaseResult = {
        caseId: tc.id,
        label: tc.label,
        status: apiResult.data && apiResult.status === 200 ? "pass" : apiResult.status >= 500 ? "error" : "fail",
        latency: apiResult.latency,
        httpStatus: apiResult.status,
        requestUrl: apiResult.requestUrl,
        requestMethod: "POST",
        requestBody: JSON.stringify(tc.input, null, 2),
        rawResponse: apiResult.rawResponse,
        response: apiResult.data as ApiResponse | null,
        error: apiResult.error,
        inputLanguage: tc.input.language || "en",
        timeout: apiResult.timeout,
        networkError: apiResult.networkError,
        parseSuccess: apiResult.parseSuccess,
        responseHeaders: apiResult.responseHeaders,
        retryCount,
      };

      setTestRun((prev) => ({
        ...prev,
        results: prev.results.map((r, idx) => (idx === i ? updated : r)),
      }));
    }

    setTestRun((prev) => ({ ...prev, status: "complete" }));
  }, [selectedCaseIds, testCases, apiUrl, useProxy]);

  const handleCancelRun = useCallback(() => {
    abortRef.current = true;
    setTestRun((prev) => ({ ...prev, status: "complete" }));
  }, []);

  const handleShowResults = useCallback(async () => {
    const results = testRun.results;
    if (results.length === 0) return;

    setGeminiError(null);
    setGeminiLoading(true);

    const batchCases = buildBatchPayload(results, testCases);
    if (batchCases.length === 0) {
      setGeminiError("No completed test cases to evaluate.");
      setGeminiLoading(false);
      setActiveTab("results");
      return;
    }

    try {
      const response = await judgeProvider.evaluateBatch(batchCases, "");
      setGeminiResult(response);
      const summary = aggregateGeminiResponse(response);
      setScoreSummary(summary);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Evaluation failed";
      setGeminiError(msg);
      setGeminiResult(null);
      setScoreSummary(null);
    }

    setGeminiLoading(false);
    setActiveTab("results");
  }, [testRun.results, testCases]);

  const handleAddCase = useCallback(() => {
    setEditingCase(null);
    setShowEditor(true);
  }, []);

  const handleEditCase = useCallback((c: SampleCase) => {
    setEditingCase(c);
    setShowEditor(true);
  }, []);

  const handleSaveCase = useCallback((c: SampleCase) => {
    setTestCases((prev) => {
      const idx = prev.findIndex((p) => p.id === c.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = c;
        return updated;
      }
      return [...prev, c];
    });
    setSelectedCaseIds((prev) => (prev.includes(c.id) ? prev : [...prev, c.id]));
    setShowEditor(false);
  }, []);

  const handleDeleteCase = useCallback((id: string) => {
    setTestCases((prev) => prev.filter((c) => c.id !== id));
    setSelectedCaseIds((prev) => prev.filter((i) => i !== id));
  }, []);

  const handleImportCases = useCallback((imported: SampleCase[]) => {
    if (imported.length === 0) return;
    setTestCases((prev) => {
      const existing = new Set(prev.map((c) => c.id));
      const newCases = imported.filter((c) => !existing.has(c.id));
      return [...prev, ...newCases];
    });
    setSelectedCaseIds((prev) => {
      const updated = new Set(prev);
      imported.forEach((c) => updated.add(c.id));
      return [...updated];
    });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-bold text-[var(--color-primary)] uppercase tracking-wider">
              QueueStorm Tester
            </h1>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              API Validation &amp; Scoring Dashboard
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportReport
              results={testRun.results.filter((r) => r.status !== "pending")}
              summary={scoreSummary || { total: 0, maxTotal: 100, percentage: 0, categories: [], safetyPenalties: 0, disqualificationRisk: false }}
              geminiResult={geminiResult}
              apiUrl={apiUrl}
              testCases={testCases}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-5 space-y-5">
        <SetupPanel
          apiUrl={apiUrl}
          onUrlChange={setApiUrl}
          useProxy={useProxy}
          onProxyToggle={setUseProxy}
          apiHealthy={apiHealthy}
          healthLatency={healthLatency}
          healthResponse={healthResponse}
          onTestHealth={handleTestHealth}
          testing={testingHealth}
          judgeOnline={judgeOnline}
          onTestJudge={handleTestJudge}
          judgeTesting={judgeTesting}
        />

        <div className="flex gap-1 border-b border-[var(--color-border)]">
          {[
            { id: "cases" as const, label: "Test Cases" },
            { id: "run" as const, label: "Run Tests" },
            { id: "results" as const, label: "Results" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "cases" && (
          <TestCaseList
            cases={testCases}
            selectedIds={selectedCaseIds}
            onSelectionChange={setSelectedCaseIds}
            onAddCase={handleAddCase}
            onEditCase={handleEditCase}
            onDeleteCase={handleDeleteCase}
            onImportCases={handleImportCases}
            onRunSelected={() => {
              handleRunTests();
              setActiveTab("run");
            }}
            disabled={testRun.status === "running"}
          />
        )}

        {activeTab === "run" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                Test Execution
              </h2>
              {testRun.status === "idle" && (
                <button
                  onClick={handleRunTests}
                  disabled={selectedCaseIds.length === 0 || !apiUrl}
                  className="rounded-md bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-black transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-40"
                >
                  Run {selectedCaseIds.length} Case{selectedCaseIds.length !== 1 ? "s" : ""}
                </button>
              )}
            </div>

            <TestRunner runState={testRun} onCancel={handleCancelRun} />

            {testRun.status === "complete" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={handleShowResults}
                    disabled={geminiLoading}
                    className="rounded-md bg-[var(--color-accent)] px-5 py-2 text-xs font-bold text-black transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {geminiLoading ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Evaluating...
                      </>
                    ) : "View Full Results"}
                  </button>
                </div>

                <div className="space-y-2">
                  {testRun.results.map((r) => (
                    <TestCaseResult
                      key={r.caseId}
                      result={r}
                      geminiEval={geminiResult?.evaluations.find((e) => e.caseId === r.caseId) || null}
                      expanded={expandedResult === r.caseId}
                      onToggle={() => setExpandedResult(expandedResult === r.caseId ? null : r.caseId)}
                    />
                  ))}
                </div>
              </div>
            )}

            {testRun.status === "running" && (
              <p className="text-xs text-[var(--color-text-muted)] text-center py-4">
                Tests are running. Results will appear here when complete.
              </p>
            )}
          </div>
        )}

        {activeTab === "results" && (
          <div className="space-y-5">
            {geminiLoading && (
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-8 text-center">
                <svg className="animate-spin h-6 w-6 mx-auto mb-3 text-[var(--color-primary)]" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-sm text-[var(--color-text-secondary)]">Evaluating results with Gemini judge...</p>
              </div>
            )}

            {geminiError && (
              <div className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-bg)] p-4">
                <p className="text-sm font-bold text-[var(--color-danger)]">Judge Evaluation Error</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">{geminiError}</p>
              </div>
            )}

            {(() => {
              const completed = testRun.results.filter((r) => r.status !== "pending");
              const avgLatency = completed.length > 0
                ? Math.round(completed.reduce((s, r) => s + r.latency, 0) / completed.length)
                : 0;
              return (
                <ScoreDashboard
                  summary={scoreSummary || { total: 0, maxTotal: 100, percentage: 0, categories: [], safetyPenalties: 0, disqualificationRisk: false }}
                  hasResults={completed.length > 0}
                  avgLatency={avgLatency}
                />
              );
            })()}

            {testRun.results.filter((r) => r.status !== "pending").length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                  Per-Case Details
                </h3>
                {testRun.results.map((r) => (
                  <TestCaseResult
                    key={r.caseId}
                    result={r}
                    geminiEval={geminiResult?.evaluations.find((e) => e.caseId === r.caseId) || null}
                    expanded={expandedResult === r.caseId}
                    onToggle={() => setExpandedResult(expandedResult === r.caseId ? null : r.caseId)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {showEditor && (
        <TestCaseEditor
          caseData={editingCase}
          onSave={handleSaveCase}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}

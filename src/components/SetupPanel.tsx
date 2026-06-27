"use client";

interface SetupPanelProps {
  apiUrl: string;
  onUrlChange: (url: string) => void;
  useProxy: boolean;
  onProxyToggle: (use: boolean) => void;
  apiHealthy: boolean | null;
  healthLatency: number | null;
  healthResponse: unknown;
  onTestHealth: () => Promise<void>;
  testing: boolean;
  judgeOnline: boolean | null;
  onTestJudge: () => Promise<void>;
  judgeTesting: boolean;
}

export default function SetupPanel({
  apiUrl,
  onUrlChange,
  useProxy,
  onProxyToggle,
  apiHealthy,
  healthLatency,
  healthResponse,
  onTestHealth,
  testing,
  judgeOnline,
  onTestJudge,
  judgeTesting,
}: SetupPanelProps) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[300px]">
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
            Target API URL
          </label>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://your-api.com"
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => onProxyToggle(!useProxy)}
              className={`relative h-5 w-9 rounded-full transition-colors ${useProxy ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"}`}
            >
              <div
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${useProxy ? "translate-x-4" : "translate-x-0.5"}`}
              />
            </div>
            <span className="text-xs text-[var(--color-text-secondary)]">Proxy (CORS bypass)</span>
          </label>

          <button
            onClick={onTestHealth}
            disabled={!apiUrl || testing}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-hover)] disabled:opacity-40"
          >
            {testing ? "Checking..." : "Test Health"}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        {apiHealthy !== null && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <span className={`inline-block h-2 w-2 rounded-full ${apiHealthy ? "bg-[var(--color-success)]" : "bg-[var(--color-danger)]"}`} />
              <span className={apiHealthy ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}>
                {apiHealthy ? "Healthy" : "Unhealthy"}
              </span>
              {healthLatency !== null && (
                <span className="text-[var(--color-text-muted)] ml-1">{healthLatency.toFixed(0)}ms</span>
              )}
            </div>
            {healthResponse !== null && healthResponse !== undefined && (
              <div className="text-[11px] font-mono text-[var(--color-text-muted)] bg-[var(--color-bg-primary)] rounded px-2.5 py-1.5 max-w-[400px] truncate" title={JSON.stringify(healthResponse, null, 2)}>
                {JSON.stringify(healthResponse).slice(0, 200)}
              </div>
            )}
          </>
        )}

        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={onTestJudge}
            disabled={judgeTesting}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-hover)] disabled:opacity-40"
          >
            {judgeTesting ? "Pinging..." : "Test Judge"}
          </button>

          {judgeOnline !== null && (
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-block h-2 w-2 rounded-full ${judgeOnline ? "bg-[var(--color-success)]" : "bg-[var(--color-danger)]"}`}
              />
              <span className={`text-[10px] ${judgeOnline ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                {judgeOnline ? "Judge Online" : "Judge Offline"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

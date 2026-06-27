"use client";

import { ScoreSummary } from "@/lib/types";
import CategoryBreakdown from "./CategoryBreakdown";

interface ScoreDashboardProps {
  summary: ScoreSummary;
  hasResults: boolean;
  avgLatency?: number;
}

function Gauge({ percentage }: { percentage: number }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color = percentage >= 75 ? "var(--color-success)" : percentage >= 50 ? "var(--color-warning)" : "var(--color-danger)";

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--color-bg-primary)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{percentage}</span>
        <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Score</span>
      </div>
    </div>
  );
}

export default function ScoreDashboard({ summary, hasResults, avgLatency }: ScoreDashboardProps) {
  if (!hasResults) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-8 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">Run tests to see your score breakdown.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {summary.disqualificationRisk && (
        <div className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-bg)] p-4">
          <p className="text-sm font-bold text-[var(--color-danger)]">
            Disqualification Risk — Two or more critical safety violations detected across cases.
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Fix safety issues before final submission.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
        <div className="flex flex-wrap items-center gap-8">
          <Gauge percentage={summary.percentage} />

            <div className="flex-1 min-w-[200px]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Total Score</div>
                <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {summary.total}/{summary.maxTotal}
                </div>
              </div>
              {avgLatency !== undefined && (
                <div className="text-right">
                  <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Avg Latency</div>
                  <div className="text-lg font-bold text-[var(--color-accent)]">{avgLatency}ms</div>
                </div>
              )}
            </div>
            <div className="mt-3 space-y-1">
              {summary.categories.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2 text-xs">
                  <div className="w-36 text-[var(--color-text-secondary)] truncate">{cat.name}</div>
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-primary)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                  <div className="w-16 text-right text-[var(--color-text-muted)] font-mono">
                    {cat.score}/{cat.maxScore}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CategoryBreakdown categories={summary.categories} />

      {summary.safetyPenalties > 0 && (
        <div className="rounded-lg border border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-4">
          <p className="text-sm font-bold text-[var(--color-warning)]">
            Safety Penalties Applied: -{summary.safetyPenalties} points
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Check the Safety tab for details on each violation.
          </p>
        </div>
      )}
    </div>
  );
}

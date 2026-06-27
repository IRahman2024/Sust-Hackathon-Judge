"use client";

import { SampleCase } from "@/lib/types";
import { useState } from "react";
import ImportTestCaseModal from "./ImportTestCaseModal";

interface TestCaseListProps {
  cases: SampleCase[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onAddCase: () => void;
  onEditCase: (c: SampleCase) => void;
  onDeleteCase: (id: string) => void;
  onRunSelected: () => void;
  onImportCases: (cases: SampleCase[]) => void;
  disabled: boolean;
}

export default function TestCaseList({
  cases,
  selectedIds,
  onSelectionChange,
  onAddCase,
  onEditCase,
  onDeleteCase,
  onRunSelected,
  onImportCases,
  disabled,
}: TestCaseListProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

  const filtered = cases.filter(
    (c) =>
      c.label.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = filtered.length > 0 && filtered.every((c) => selectedIds.includes(c.id));

  const toggleSelect = (id: string) => {
    if (disabled) return;
    onSelectionChange(
      selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]
    );
  };

  const toggleAll = () => {
    if (disabled) return;
    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !filtered.some((c) => c.id === id)));
    } else {
      const newIds = [...selectedIds];
      for (const c of filtered) {
        if (!newIds.includes(c.id)) newIds.push(c.id);
      }
      onSelectionChange(newIds);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases..."
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] w-56"
          />
          <span className="text-xs text-[var(--color-text-muted)]">
            {selectedIds.length}/{cases.length} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            disabled={disabled}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] disabled:opacity-40"
          >
            Import JSON
          </button>
          <button
            onClick={onAddCase}
            disabled={disabled}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] disabled:opacity-40"
          >
            + Custom Case
          </button>
          <button
            onClick={onRunSelected}
            disabled={selectedIds.length === 0 || disabled}
            className="rounded-md bg-[var(--color-primary)] px-4 py-1.5 text-xs font-bold text-black transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-40"
          >
            Run Selected ({selectedIds.length})
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card)] transition-colors hover:border-[var(--color-border-light)]"
          >
            <div className="flex items-center gap-3 px-3.5 py-2.5">
              <input
                type="checkbox"
                checked={selectedIds.includes(c.id)}
                onChange={() => toggleSelect(c.id)}
                disabled={disabled}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              <span className="text-xs font-mono text-[var(--color-text-muted)] min-w-[80px]">{c.id}</span>
              <span
                className="flex-1 text-sm text-[var(--color-text-primary)] cursor-pointer"
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              >
                {c.label}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onEditCase(c)}
                  disabled={disabled}
                  className="rounded px-2 py-0.5 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Edit
                </button>
                {c.id.startsWith("CUSTOM-") && (
                  <button
                    onClick={() => onDeleteCase(c.id)}
                    disabled={disabled}
                    className="rounded px-2 py-0.5 text-[10px] text-[var(--color-danger)] hover:text-[var(--color-danger)] transition-colors"
                  >
                    Del
                  </button>
                )}
              </div>
            </div>

            {expanded === c.id && (
              <div className="border-t border-[var(--color-border)] px-3.5 py-3 text-xs text-[var(--color-text-secondary)]">
                <div className="mb-2">
                  <div className="font-semibold text-[var(--color-text-primary)] mb-1">Input Complaint:</div>
                  <div className="bg-[var(--color-bg-primary)] rounded p-2 text-[var(--color-text-secondary)]">
                    {c.input.complaint.length > 200
                      ? c.input.complaint.slice(0, 200) + "..."
                      : c.input.complaint}
                  </div>
                </div>
                <div className="mb-2">
                  <div className="font-semibold text-[var(--color-text-primary)] mb-1">Expected:</div>
                  <div className="bg-[var(--color-bg-primary)] rounded p-2">
                    <span className="text-[var(--color-accent)]">{c.expected_output.evidence_verdict}</span>
                    {" | "}
                    <span className="text-[var(--color-primary)]">{c.expected_output.case_type}</span>
                    {" | "}
                    <span className="text-[var(--color-text-muted)]">{c.expected_output.department}</span>
                  </div>
                </div>
                <div className="text-[var(--color-text-muted)] italic">{c.rationale}</div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
            No test cases match your search.
          </div>
        )}
      </div>

      {showImportModal && (
        <ImportTestCaseModal
          existingIds={cases.map((c) => c.id)}
          onImport={(imported) => { onImportCases(imported); setShowImportModal(false); }}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
}

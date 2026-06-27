# QueueStorm API Tester — Architecture

## Overview

A Next.js 16 (App Router) frontend application that validates and scores a QueueStorm Investigator API against the SUST Codex Hackathon evaluation rubric. It sends test cases to a target `/analyze-ticket` endpoint, checks responses against expected values, and computes weighted scores across 6 categories.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 (`@theme inline` tokens) |
| Charts | Recharts (optional future enhancement) |
| State | React `useState` / `useCallback` (no external state lib) |
| Build | `next build` → static export or server |

## Directory Structure

```
src/
├── app/
│   ├── globals.css              # Theme tokens (Dark Emerald)
│   ├── layout.tsx               # Root layout + metadata
│   ├── page.tsx                 # Main page — state orchestrator
│   └── api/proxy/[...path]/
│       └── route.ts             # CORS proxy — forwards to target API
├── components/
│   ├── SetupPanel.tsx           # API URL input + health check + proxy toggle
│   ├── TestCaseList.tsx         # Case browser with search, expand, select
│   ├── TestCaseEditor.tsx       # Modal for creating/editing custom cases
│   ├── TestRunner.tsx           # Progress bar + per-case status
│   ├── ScoreDashboard.tsx       # Total score gauge + category bars
│   ├── CategoryBreakdown.tsx    # Detailed category explanations
│   ├── TestCaseResult.tsx       # Expandable per-case analysis
│   ├── SafetyViolations.tsx     # Safety violation list with penalties
│   └── ExportReport.tsx         # JSON/CSV report export
└── lib/
    ├── types.ts                 # TypeScript interfaces
    ├── enums.ts                 # Allowed enum values for validation
    ├── sampleCases.ts           # 10 bundled sample test cases
    ├── apiClient.ts             # HTTP client (direct + proxy modes)
    ├── schemaValidator.ts       # Field presence, types, enum checks
    ├── evidenceChecker.ts       # Transaction matching & verdict checks
    ├── safetyInspector.ts       # Credential/refund/redirect/prompt injection
    └── scoreCalculator.ts       # Weighted aggregation + summary
docs/
├── ARCHITECTURE.md              # This file
├── DESIGN.md                    # Design decisions & rationale
README.md
```

## Data Flow

```
User enters API URL → SetupPanel (state: apiUrl)
User selects test cases → TestCaseList (state: selectedCaseIds)
User clicks "Run Selected" → page.tsx calls:
  1. apiClient.callAnalyzeTicket() or callProxyAnalyzeTicket()
  2. For each response:
     a. schemaValidator.validateSchemaResponse() — checks 10 fields, enums, types
     b. evidenceChecker.checkEvidence() — compares vs expected_output
     c. safetyInspector.inspectSafety() — regex scans for violations
  3. Results stored in testRun state
  4. scoreCalculator.computeScores() — aggregates into weighted categories
  5. scoreCalculator.buildSummary() — produces final ScoreSummary
Results displayed in tab 3 (ScoreDashboard + TestCaseResult list)
```

## Proxy Architecture

The app supports two modes:

**Direct Mode** — browser fetches `POST https://target-api.com/analyze-ticket` directly.
Requires the target API to set CORS headers (`Access-Control-Allow-Origin`).

**Proxy Mode** — browser fetches `POST /api/proxy/analyze-ticket` (same origin).
The Next.js API route forwards the request to the target API and returns the response.
No CORS issues since both tester UI and proxy are on the same origin.

## Scoring Weights (mirrors judge rubric)

| Category | Weight | Source |
|----------|--------|--------|
| API Contract & Schema | 15 | schemaValidator |
| Evidence Reasoning | 35 | evidenceChecker |
| Safety & Escalation | 20 | safetyInspector |
| Performance & Reliability | 10 | Latency + error rate |
| Response Quality | 10 | Text analysis |
| Deployment & Documentation | 10 | Manual (placeholder) |

## State Management

All state lives in `page.tsx` via `useState` hooks:

- `apiUrl`, `useProxy`, `apiHealthy` — connection settings
- `testCases`, `selectedCaseIds` — which cases to run
- `testRun` — `{ status, currentIndex, results[], startTime }`
- `computedScores`, `scoreSummary` — derived after run completes
- `editingCase`, `showEditor` — custom case editor modal
- `expandedResult` — which case detail is currently expanded

Components are pure — they receive props and emit callbacks. No shared state library.

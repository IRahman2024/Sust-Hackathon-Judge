# QueueStorm API Tester — Design Decisions

## Color Theme: Dark Emerald Green

**Why not blue/purple?** Most AI-generated apps default to indigo/purple gradients. We chose a fintech-appropriate dark emerald palette that:
- Matches the **bKash brand identity** (green is their primary color)
- Communicates **trust and financial security** (green = safe, money, verified)
- Reduces eye strain during extended testing sessions
- Stands out from typical "AI app" aesthetics

**Palette:**

| Role | Hex | Usage |
|------|-----|-------|
| Background | `#0F1A14` | Deep forest, main page background |
| Surface | `#1A2E20` | Cards, panels, headers |
| Card | `#24382A` | Elevated surfaces, inputs |
| Primary | `#00C853` | Buttons, active states, pass indicators |
| Accent | `#FFD54F` | Amber — warnings, highlights, score gauges |
| Success | `#00C853` | Pass badges, health checks |
| Danger | `#FF5252` | Safety violations, errors |
| Warning | `#FFB74D` | Partial scores, non-critical issues |
| Text Primary | `#E8F5E9` | Light green-white headings/body |
| Text Muted | `#6B8F71` | Secondary info, timestamps |

## UI/UX Decisions

### Tab Navigation
Three tabs (Cases → Run → Results) create a linear workflow that mirrors the judge's testing process. Users configure → execute → analyze. No complex nested navigation.

### Test Case Browser
- Each case shows ID, label, and expandable preview of complaint + expected output
- Search filter helps find specific cases quickly
- Checkbox selection allows targeted test runs (not everything at once)
- "Run Selected" button in both Cases tab and Run tab for flexibility

### Real-Time Runner
- Progress bar + per-case status (pending/running/pass/fail/error)
- Latency displayed per case as it completes
- Cancel button for long runs
- "View Full Results" button triggers score computation

### Score Dashboard
- **Circular SVG gauge** at top — instant visual of total score (green ≥ 75%, amber ≥ 50%, red < 50%)
- **Category bars** — horizontal progress bars for each rubric category
- **Safety penalty banner** — red if disqualification risk, amber if penalties applied
- **Per-case expandable results** — JSON response, schema violations, evidence checks, safety violations

### Reasons for Key Decisions

**1. Proxy over direct CORS configuration**
We can't control whether the target API has CORS headers. The proxy mode (via `src/app/api/proxy/[...path]/route.ts`) guarantees the tester works regardless of the target's CORS setup. The user can toggle between direct/proxy.

**2. Embedded sample cases over external JSON**
Bundling the 10 sample cases as TypeScript means no additional HTTP request to load them, and TypeScript provides type safety. The `SAMPLE_CASES` array is directly imported in `page.tsx`.

**3. Regex-based safety checks over LLM inspection**
Safety patterns (PIN/OTP asks, refund promises, third-party redirects) are well-defined and finite. Regex is faster, deterministic, and doesn't require an API call. Edge cases like "what's your PIN" vs "don't share your PIN" are handled by careful pattern design.

**4. Weighted scoring that mirrors the rubric**
The scoring weights (35/20/15/10/10/10) exactly match the judge's rubric. This means the tester's score should correlate with the actual competition score for the same API behavior.

## Limitations

- Response Quality scoring is heuristic (length checks, transaction ID references) — manual review is more accurate
- Custom test cases created in the editor don't include full transaction history (only complaint text)
- Deployment & Documentation score is a placeholder (0/10) since it requires manual review
- The tester scores your API but the competition uses hidden test cases not included here

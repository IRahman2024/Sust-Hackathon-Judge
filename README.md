# QueueStorm API Tester

A frontend validation dashboard for the SUST Codex Hackathon QueueStorm Investigator API. Tests your `/analyze-ticket` endpoint against the 10 public sample cases, scores responses across the 6 rubric categories, and highlights safety violations, schema errors, and evidence reasoning gaps.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. **Enter your API URL** in the setup panel (e.g. `https://your-api.com`)
2. **Test Health** to verify `GET /health` responds with `{"status":"ok"}`
3. **Select test cases** from the pre-loaded 10 samples (or create custom ones)
4. **Run Selected** — the tester fires POST requests and scores responses
5. **View Results** — overall score gauge, category breakdowns, per-case analysis
6. **Export** report as JSON or CSV

## Scoring Categories

| Category | Points | What's Checked |
|----------|--------|----------------|
| API Contract & Schema | 15 | 10 required fields, correct types, exact enum values, HTTP codes |
| Evidence Reasoning | 35 | Transaction matching, evidence verdict, case type, department routing |
| Safety & Escalation | 20 | No PIN/OTP asks, no refund promises, no prompt injection compliance |
| Performance & Reliability | 10 | Average latency, P95, error rate, stability |
| Response Quality | 10 | Summary detail, language matching, professionalism |
| Deployment & Documentation | 10 | Manual review placeholder |

## Tech Stack

Next.js 16, TypeScript, Tailwind CSS v4, no external state library.

## Theme

Dark emerald green — fintech professional. Not purple, not blue.

## Proxy Mode

Toggle "Proxy" in the setup panel to route requests through the Next.js API route (`/api/proxy/analyze-ticket`). Use this if your target API doesn't set CORS headers.

## Project Structure

```
src/
├── app/             # Pages, layout, API proxy routes
├── components/      # UI components
├── lib/             # Validation, scoring, HTTP clients
docs/                # Architecture & design docs
```

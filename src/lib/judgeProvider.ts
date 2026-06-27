import { BatchEvalCase, GeminiBatchResponse, JudgePingResult } from "./types";

export interface JudgeProvider {
  name: string;
  evaluateBatch(cases: BatchEvalCase[], apiKey: string): Promise<GeminiBatchResponse>;
  ping(apiKey: string): Promise<JudgePingResult>;
}

export class GeminiJudgeProvider implements JudgeProvider {
  name = "gemini";

  async ping(apiKey: string): Promise<JudgePingResult> {
    const start = performance.now();
    try {
      const res = await fetch("/api/evaluate", { signal: AbortSignal.timeout(10000) });
      const latency = performance.now() - start;
      const data = await res.json();
      return { online: data.online === true, latency, model: data.model };
    } catch {
      const latency = performance.now() - start;
      return { online: false, latency };
    }
  }

  async evaluateBatch(cases: BatchEvalCase[], apiKey: string): Promise<GeminiBatchResponse> {
    const res = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cases, apiKey }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Judge API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data as GeminiBatchResponse;
  }
}

import { TestCaseInput } from "./types";

export interface ApiResult {
  status: number;
  data: unknown;
  latency: number;
  ok: boolean;
  error?: string;
  requestUrl: string;
  rawResponse?: string;
  timeout: boolean;
  networkError: boolean;
  parseSuccess: boolean;
  responseHeaders?: Record<string, string>;
}

function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => { record[key] = value; });
  return record;
}

async function doFetch(url: string, options: RequestInit, timeoutMs: number): Promise<{ res: Response; headers: Record<string, string> } | { error: string; timeout: boolean; networkError: boolean }> {
  try {
    const res = await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
    const headers = headersToRecord(res.headers);
    return { res, headers };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Request failed";
    const isTimeout = err instanceof DOMException && err.name === "TimeoutError";
    return { error: `${msg} — URL: ${url}`, timeout: isTimeout, networkError: !isTimeout };
  }
}

function errorResult(url: string, start: number, res: { error: string; timeout: boolean; networkError: boolean }): ApiResult {
  return { status: 0, data: null, latency: performance.now() - start, ok: false, error: res.error, requestUrl: url, timeout: res.timeout, networkError: res.networkError, parseSuccess: false };
}

function successResult(res: Response, start: number, url: string, rawText: string): ApiResult {
  const latency = performance.now() - start;
  let data: unknown = null;
  let parseSuccess = false;
  let error: string | undefined;

  try { data = JSON.parse(rawText); parseSuccess = true; } catch { error = `Response was not valid JSON. Status ${res.status}. Body: ${rawText.slice(0, 500)}`; }

  return { status: res.status, data, latency, ok: res.ok, error, requestUrl: url, rawResponse: rawText, timeout: false, networkError: false, parseSuccess, responseHeaders: headersToRecord(res.headers) };
}

export async function checkHealth(baseUrl: string): Promise<ApiResult> {
  const url = `${baseUrl.replace(/\/$/, "")}/health`;
  const start = performance.now();
  const result = await doFetch(url, { method: "GET" }, 10000);
  if ("error" in result) return errorResult(url, start, result);
  const rawText = await result.res.text();
  return successResult(result.res, start, url, rawText);
}

export async function checkProxyHealth(targetUrl: string): Promise<ApiResult> {
  const url = `/api/proxy/health?targetUrl=${encodeURIComponent(targetUrl)}`;
  const start = performance.now();
  const result = await doFetch(url, { method: "GET" }, 10000);
  if ("error" in result) return errorResult(url, start, result);
  const rawText = await result.res.text();
  return successResult(result.res, start, url, rawText);
}

export async function callAnalyzeTicket(baseUrl: string, input: TestCaseInput): Promise<ApiResult> {
  const requestUrl = `${baseUrl.replace(/\/$/, "")}/analyze-ticket`;
  const start = performance.now();
  const result = await doFetch(requestUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }, 30000);
  if ("error" in result) return errorResult(requestUrl, start, result);
  const rawText = await result.res.text();
  return successResult(result.res, start, requestUrl, rawText);
}

export async function callProxyAnalyzeTicket(targetUrl: string, input: TestCaseInput): Promise<ApiResult> {
  const requestUrl = `/api/proxy/analyze-ticket → ${targetUrl}/analyze-ticket`;
  const start = performance.now();
  const result = await doFetch(`/api/proxy/analyze-ticket`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetUrl, input }) }, 35000);
  if ("error" in result) return errorResult(requestUrl, start, result);
  const rawText = await result.res.text();
  return successResult(result.res, start, requestUrl, rawText);
}

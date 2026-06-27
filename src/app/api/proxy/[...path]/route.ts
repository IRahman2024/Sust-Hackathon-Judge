import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get("targetUrl");
  if (!targetUrl) {
    return NextResponse.json({ error: "targetUrl query param is required" }, { status: 400 });
  }
  try {
    const res = await fetch(`${targetUrl.replace(/\/+$/, "")}/health`, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Proxy error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetUrl, input } = body;
    if (!targetUrl) {
      return NextResponse.json({ error: "targetUrl is required" }, { status: 400 });
    }
    const cleanUrl = targetUrl.replace(/\/+$/, "");
    const res = await fetch(`${cleanUrl}/analyze-ticket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input || {}),
      signal: AbortSignal.timeout(35000),
    });
    const rawText = await res.text();
    let data: unknown;
    try { data = JSON.parse(rawText); } catch { data = rawText; }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Proxy error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

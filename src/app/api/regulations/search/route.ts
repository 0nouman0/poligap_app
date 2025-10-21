import { NextResponse } from "next/server";

// Proxy to backend regulations service if configured.
// Set REGULATIONS_API_URL in server env to enable. Expected to accept POST JSON with
// { jurisdictions: string[], topics: string[], since_timestamp: string }
export async function POST(req: Request) {
  try {
    const backendUrl = process.env.REGULATIONS_API_URL;
    const payload = await req.json();

    if (!backendUrl) {
      return NextResponse.json(
        { items: [], note: "REGULATIONS_API_URL not configured" },
        { status: 200 }
      );
    }

    const resp = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { items: [], error: `Upstream error: ${resp.status}`, detail: text },
        { status: 200 }
      );
    }

    const data = await resp.json();
    // Normalize to { items: [...] }
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json(
      { items: [], error: e?.message || "Unexpected error" },
      { status: 200 }
    );
  }
}

import { NextResponse } from "next/server";

// Proxies to your internal similarity comparison service.
// Configure CONTENT_SIMILARITY_API_URL in server env.
export async function POST(req: Request) {
  try {
    const url = process.env.CONTENT_SIMILARITY_API_URL;
    const payload = await req.json();

    if (!url) {
      return NextResponse.json({
        ok: true,
        note: "CONTENT_SIMILARITY_API_URL not configured",
        result: null,
      });
    }

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch { data = text; }

    return NextResponse.json({ ok: resp.ok, status: resp.status, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" });
  }
}

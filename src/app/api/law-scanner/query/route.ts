import { NextResponse } from "next/server";

// Utility: naive RSS XML parsing for title/link/date/summary
function parseRss(xml: string) {
  const items: { id: string; title: string; url: string; date: string; source: string; summary?: string }[] = [];
  const itemRegex = /<item[\s\S]*?<\/item>/gim;
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/i;
  const linkRegex = /<link>(.*?)<\/link>/i;
  const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/i;
  const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/i;

  const blocks = xml.match(itemRegex) || [];
  for (const block of blocks) {
    const tMatch = block.match(titleRegex);
    const lMatch = block.match(linkRegex);
    const dMatch = block.match(pubDateRegex);
    const sMatch = block.match(descRegex);
    const title = (tMatch?.[1] || tMatch?.[2] || "").trim();
    const url = (lMatch?.[1] || "").trim();
    const date = (dMatch?.[1] || "").trim();
    const summaryRaw = (sMatch?.[1] || sMatch?.[2] || "").replace(/<[^>]+>/g, "").trim();
    if (title && url) {
      items.push({ id: `${title}:${date}:${url}`.slice(0, 200), title, url, date, source: "RSS", summary: summaryRaw });
    }
  }
  return items;
}

async function fetchGoogleNews(query: string, monthsBack = 3) {
  // Google News RSS search
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  const xml = await res.text();
  const items = parseRss(xml);
  // Filter roughly by monthsBack (compare pubDate if present)
  const cutoff = Date.now() - monthsBack * 30 * 24 * 60 * 60 * 1000;
  return items.filter((i) => (i.date ? new Date(i.date).getTime() >= cutoff : true));
}

async function fetchFederalRegister(query: string, monthsBack = 3) {
  // US Federal Register API for rules/notices
  const cutoff = new Date(Date.now() - monthsBack * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const url = `https://www.federalregister.gov/api/v1/articles.json?per_page=25&order=newest&conditions%5Bpublication_date%5D%5Bgte%5D=${cutoff}&conditions%5Bterm%5D=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate: 300 } });
  if (!res.ok) return [] as any[];
  const data = await res.json().catch(() => ({}));
  const items = (data?.results || []).map((r: any) => ({
    id: String(r.id || r.document_number || r.title),
    title: r.title,
    url: r.html_url || r.pdf_url || r.public_inspection_pdf_url || r.json_url,
    date: r.publication_date,
    source: "Federal Register",
    summary: r.abstract || r.excerpts || "",
  }));
  return items;
}

export async function POST(req: Request) {
  try {
    const { industry = "", region = "", orgType = "", monthsBack = 3, keywords = "" } = await req.json().catch(() => ({}));

    // Build a combined query
    const pieces = [industry, region, orgType, keywords, "policy OR regulation OR law update"].filter(Boolean);
    const query = pieces.join(" ");

    // Priority 1: RSS (free)
    let items: any[] = [];
    try {
      items = await fetchGoogleNews(query, monthsBack);
    } catch (e) {
      items = [];
    }

    // Priority 2: Federal Register if region suggests US
    if (/\bUS\b|United States|USA|America/i.test(region)) {
      try {
        const fr = await fetchFederalRegister(query, monthsBack);
        items = [...fr, ...items];
      } catch (e) {
        // ignore
      }
    }

    // Optionally: future hooks to Gemini or Kroolo AI to re-rank/cluster summaries
    // We keep it simple here to avoid requiring keys. If keys are provided, we can enrich summaries later.

    // De-duplicate by URL/title
    const seen = new Set<string>();
    const deduped = items.filter((i) => {
      const key = (i.url || i.title);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 50);

    return NextResponse.json({ ok: true, items: deduped });
  } catch (err) {
    console.error("/api/law-scanner/query error", err);
    return NextResponse.json({ ok: false, items: [], error: "internal_error" }, { status: 500 });
  }
}

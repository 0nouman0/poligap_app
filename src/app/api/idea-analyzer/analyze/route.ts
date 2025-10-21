import { NextResponse } from "next/server";

async function summarizeWithGemini(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("no_gemini_key");
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + key, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const j = await r.json();
  return j?.candidates?.[0]?.content?.parts?.[0]?.text as string;
}

async function summarizeWithKrooloAI(prompt: string) {
  const aiUrl = process.env.NEXT_PUBLIC_REACT_APP_API_URL_KROOLO_AI;
  const baseUrl = process.env.NEXT_PUBLIC_REACT_APP_API_URL;
  const body = { prompt, enable: true, session_id: `idea_${Date.now()}` };
  let r = await fetch(`${aiUrl || ''}/global-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok && baseUrl) {
    r = await fetch(`${baseUrl}/kroolo-ai/chat-with-ai`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
  }
  return await r.text();
}

function buildPrompt(inputs: any, findings: any[]) {
  return `You are a startup and product strategy analyst. Analyze the following context and RETURN STRICT JSON ONLY (no prose) matching this schema:
{
  "swot": { "strengths": string[], "weaknesses": string[], "opportunities": string[], "threats": string[] },
  "competitors": Array<{ "name": string, "url"?: string, "summary"?: string }>,
  "marketStats": Array<{ "label": string, "value": string, "source"?: string, "url"?: string }>,
  "bestDemographics": string[],
  "suggestions": string[]
}

Context:
Company: ${inputs.companyName}
Domain: ${inputs.domain}
USP: ${inputs.usp}
Service Type: ${inputs.serviceType}
Phase: ${inputs.phase}
Target Market: ${inputs.targetMarket}
Market Type: ${inputs.marketType}
Region: ${inputs.region}
Known Competitors: ${inputs.competitorsKnown}
Keywords: ${inputs.keywords}

Recent public findings (use to ground competitors/results):
${findings.map(f=>`- ${f.title} (${f.url})`).join('\n')}

Constraints:
- Output must be valid JSON, no backticks, no markdown.
- Prefer competitors present in findings and include their URLs.
- Populate all arrays; if unknown, return empty arrays.
`;
}

async function fetchNewsFallback(query: string) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  const xml = await res.text();
  const itemRegex = /<item[\s\S]*?<\/item>/gim;
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/i;
  const linkRegex = /<link>(.*?)<\/link>/i;
  const blocks = xml.match(itemRegex) || [];
  return blocks.slice(0, 10).map(b=>{
    const t = b.match(titleRegex);
    const l = b.match(linkRegex);
    return { title: (t?.[1] || t?.[2] || '').trim(), url: (l?.[1] || '').trim() };
  });
}

export async function POST(req: Request) {
  try {
    const { inputs } = await req.json();
    const q = [inputs.domain, inputs.idea, inputs.keywords].filter(Boolean).join(' ');
    let findings: any[] = [];
    try { findings = await fetchNewsFallback(q); } catch {}

    const prompt = buildPrompt(inputs, findings);

    let raw = '';
    try { raw = await summarizeWithGemini(prompt) } catch {}
    if (!raw) {
      try { raw = await summarizeWithKrooloAI(prompt) } catch {}
    }

    // Attempt to parse JSON from model response
    let sections: any | null = null;
    if (raw) {
      try {
        // If response accidentally wrapped in code fences or contains prose, extract first {...}
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : raw;
        sections = JSON.parse(jsonText);
      } catch {}
    }

    // Fallback: build minimal sections from findings and inputs
    if (!sections) {
      const competitors = findings.map((f) => ({ name: f.title?.slice(0, 80) || 'Result', url: f.url }));
      const marketStats = findings.slice(0, 5).map((f) => ({ label: f.title?.slice(0, 60) || 'Market stat', value: 'See source', source: 'News', url: f.url }));
      const demoDefaults = inputs.marketType === 'B2C'
        ? ["Age 18-34, mobile-first", "Urban Tier-1/2 cities", `Region focus: ${inputs.region || 'Global'}`]
        : ["SMBs in target vertical", "Tech-forward companies", `Region focus: ${inputs.region || 'Global'}`];
      sections = {
        swot: {
          strengths: inputs.usp ? [inputs.usp] : [],
          weaknesses: ["Early stage, limited distribution"],
          opportunities: ["Segmented focus", "Regional differentiation"],
          threats: ["Incumbent competition", "Regulatory hurdles"],
        },
        competitors,
        marketStats,
        bestDemographics: demoDefaults,
        suggestions: [
          "Interview 10 design partners in target segment",
          "Ship a narrow end-to-end slice within 3-4 weeks",
          "Track 3 KPIs for early signal: activation, retention, and unit economics",
        ],
      };
    }

    return NextResponse.json({ ok: true, sections, sources: findings });
  } catch (e) {
    return NextResponse.json({ ok: false, sections: null, error: 'internal_error' }, { status: 500 });
  }
}

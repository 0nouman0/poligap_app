import { NextResponse } from "next/server";

function toMarkdownSafe(text?: string): string {
  if (!text) return "";
  // Remove common code fences accidentally wrapped by providers
  const fenceMatch = text.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();
  return text.trim();
}

function formatPolicyMarkdown(
  payload: {
    policyType: string;
    industry: string;
    region: string;
    orgType: string;
    frameworks: string[];
    applyRuleBase: boolean;
    customRules: string;
    kbNotes: string;
  },
  raw: string
): string {
  const p = payload;
  const now = new Date();
  const metaRows = [
    `| Field | Value |`,
    `|---|---|`,
    `| Policy Type | ${p.policyType || "-"} |`,
    `| Industry | ${p.industry || "-"} |`,
    `| Region | ${p.region || "Global"} |`,
    `| Organization Type | ${p.orgType || "-"} |`,
    `| Frameworks | ${p.frameworks?.join(", ") || "-"} |`,
    `| RuleBase | ${p.applyRuleBase ? "Enabled" : "Disabled"} |`,
    `| Generated On | ${now.toISOString()} |`,
  ].join("\n");

  const warning = `> [!WARNING]\n> This generated document is for reference only. It is not legal advice. Use responsibly and have it reviewed by your organization’s legal/compliance team before adoption.`;

  const cleaned = toMarkdownSafe(raw);
  const looksLikeJson = /^\s*\{[\s\S]*\}\s*$/.test(cleaned) || /^\s*\[[\s\S]*\]\s*$/.test(cleaned);

  // If the model returned garbage/JSON, fall back to a structured skeleton with content embedded in an appendix
  if (!cleaned || looksLikeJson) {
    return `# ${p.policyType || "Policy"} (Draft)\n\n${warning}\n\n## Metadata\n${metaRows}\n\n## Preamble\nThis ${p.policyType || "policy"} outlines the principles and procedures for our organization.\n\n## 1. Purpose\nDescribe the goal of this policy in context of ${p.industry || "your industry"}.\n\n## 2. Scope\nApplies to systems, personnel, vendors, and data in ${p.region || "your regions"}.\n\n## 3. Definitions\nKey terms and abbreviations used in this document.\n\n## 4. Roles and Responsibilities\nList accountable roles and their duties.\n\n## 5. Policy Statements\n### 5.1 Core Requirements\n### 5.2 Exceptions\n### 5.3 Enforcement\n\n## 6. Procedures\nHigh-level steps or references to SOPs.\n\n## 7. Review Cadence\nThe policy owner must review this policy at least annually or after significant changes.\n\n## 8. Change Log\n- v0.1 (Draft) - Initial version.\n\n---\n\n## Appendix: Raw Model Output\n\n\n\n\n\n\n\n\n`;
  }

  // Otherwise, ensure it is wrapped with a heading and metadata
  const hasTopHeading = /^\s*#\s+/m.test(cleaned);
  const body = hasTopHeading ? cleaned : `# ${p.policyType || "Policy"}\n\n${cleaned}`;
  return `# ${p.policyType || "Policy"} (Draft)\n\n${warning}\n\n## Metadata\n${metaRows}\n\n---\n\n${body}`;
}

// Helper to call Gemini or Kroolo AI if keys/URLs are configured
async function generateWithAI(payload: {
  policyType: string;
  industry: string;
  region: string;
  orgType: string;
  frameworks: string[];
  applyRuleBase: boolean;
  customRules: string;
  kbNotes: string;
}) {
  const { policyType, industry, region, orgType, frameworks, applyRuleBase, customRules, kbNotes } = payload;

  const prompt = `You are a compliance policy writer. Generate a ${policyType} tailored for:
Industry: ${industry || 'N/A'}
Region: ${region || 'Global'}
Organization Type: ${orgType || 'General'}
Frameworks: ${frameworks.join(', ') || 'General Best Practices'}

Knowledge Base Notes:
${kbNotes || '-'}

Custom Rules/Constraints:
${customRules || '-'}

${applyRuleBase ? 'Apply stricter, audit-ready phrasing and ensure clause-level alignment to the named frameworks.' : 'Use practical, plain language and align with common best practices.'}

Return a clear, sectioned document with headings (1., 1.1 etc.), a short preamble, definitions (if applicable), obligations, responsibilities, exceptions, enforcement, review cadence, and change log placeholder.`;

  // Try Gemini (if key configured via env GEMINI_API_KEY and a simple endpoint downstream)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const resp = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiKey,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const json = await resp.json();
      const text = json?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text)
        .filter(Boolean)
        .join("\n\n");
      if (text) return toMarkdownSafe(text as string);
    } catch (e) {
      // fallthrough to Kroolo AI
    }
  }

  // Try Kroolo AI endpoints if available
  const aiUrl = process.env.NEXT_PUBLIC_REACT_APP_API_URL_KROOLO_AI;
  const baseUrl = process.env.NEXT_PUBLIC_REACT_APP_API_URL;
  if (aiUrl || baseUrl) {
    try {
      const reqBody = { prompt, enable: true, session_id: `policy_${Date.now()}` };
      let r = await fetch(`${aiUrl || ''}/global-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reqBody) });
      if (!r.ok && baseUrl) {
        r = await fetch(`${baseUrl}/kroolo-ai/chat-with-ai`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      }
      if (r.ok) {
        const txt = await r.text();
        const fence = txt.match(/```(?:markdown|md)?\n([\s\S]*?)```/i);
        if (fence?.[1]) return toMarkdownSafe(fence[1]);
        return toMarkdownSafe(txt);
      }
    } catch (e) {
      // fallthrough to template
    }
  }

  // Fallback template (simple but structured)
  return `# ${policyType} (Draft)\n\n> [!WARNING]\n> This generated document is for reference only. It is not legal advice. Use responsibly and have it reviewed by your organization’s legal/compliance team before adoption.\n\n## Metadata\n| Field | Value |\n|---|---|\n| Industry | ${industry || 'N/A'} |\n| Region | ${region || 'Global'} |\n| Organization Type | ${orgType || 'General'} |\n| Frameworks | ${frameworks.join(', ') || 'General Best Practices'} |\n| RuleBase | ${applyRuleBase ? 'Enabled' : 'Disabled'} |\n\n## Preamble\nThis ${policyType} outlines the principles and procedures for our organization.\n\n## 1. Purpose\nDescribe the goal of this policy in context of ${industry || 'your industry'} and ${frameworks.join(', ') || 'general best practices'}.\n\n## 2. Scope\nApplies to systems, personnel, vendors, and data in ${region || 'your regions'}.\n\n## 3. Definitions\nKey terms and abbreviations used in this document.\n\n## 4. Roles and Responsibilities\nList accountable roles and their duties.\n\n## 5. Policy Statements\n### 5.1 Core Requirements\n### 5.2 Exceptions\n### 5.3 Enforcement\n\n## 6. Procedures\nHigh-level steps or references to SOPs.\n\n## 7. Review Cadence\nThe policy owner must review this policy at least annually or following significant changes.\n\n## 8. Change Log\n- v0.1 (Draft) - Initial version.\n`;
}

export async function POST(req: Request) {
  try {
    const { inputs } = await req.json();
    const raw = await generateWithAI(inputs);
    const content = formatPolicyMarkdown(inputs, raw);
    return NextResponse.json({ ok: true, content });
  } catch (err) {
    console.error('/api/policy-generator/generate error', err);
    return NextResponse.json({ ok: false, content: '', error: 'internal_error' }, { status: 500 });
  }
}

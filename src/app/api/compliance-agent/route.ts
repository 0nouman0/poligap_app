import OpenAI from "openai";

// Lazy initialize the client to avoid build-time errors
let client: OpenAI | null = null;

function getClient() {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action: string = body?.action ?? "";
    const data: unknown = body?.data ?? {};
    // Allow optional model override; default to GPT-4o
    const model: string = body?.model || process.env.OPENAI_MODEL || "gpt-4o";

    const systemPrompt = `
You are the Multi-Jurisdiction Compliance Monitor for an enterprise dashboard.

Behavioral rules:
- You do not fetch data directly from the public internet. Instead, you propose calling internal tools/APIs that the app will execute.
- Never say that you cannot access real-time data. Always propose the appropriate tool with parameters.
- Choose the most relevant tool among: fetch_regulation_changes, analyze_contracts_for_compliance, send_alert_notification, or none.
- Keep outputs concise and actionable for the UI.

Output format (strict JSON object):
{
  "decision": "tool" | "none",
  "tool_name": "fetch_regulation_changes" | "analyze_contracts_for_compliance" | "send_alert_notification" | null,
  "params": object | null,
  "ui_summary": string,
  "next_steps": string[]
}

Guidance:
- For regulation checks, require jurisdictions[], topics[], and since_timestamp (ISO 8601).
- For contract analysis, accept contract_id or contract_text with jurisdiction.
- For notifications, require alert_id, jurisdiction, impact_level (low|medium|high|critical), affected_contract_ids[], notification_channels[].
- If inputs are missing, set decision to "none" and provide clear next_steps to collect them.
`;

    const completion = await getClient().chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Perform the action: ${action}. Data: ${JSON.stringify(data)}`,
        },
      ],
      temperature: 0.2,
    });

    const content = completion.choices?.[0]?.message?.content ?? "";
    let plan: any = null;
    try {
      plan = typeof content === "string" ? JSON.parse(content) : null;
    } catch {}
    return new Response(
      JSON.stringify({ model, plan, content, raw: completion, usage: completion.usage }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Agent error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unexpected error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

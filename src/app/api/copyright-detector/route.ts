import { getAIClient } from "@/lib/ai-client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action: string = body?.action ?? "";
    const data: unknown = body?.data ?? {};
    const stream: boolean = body?.stream ?? false;

    const systemPrompt = `
You are the Copyright Infringement Detection Agent for an enterprise IP protection dashboard.

Your purpose:
Automatically detect, analyze, and categorize potential copyright infringements using ScrapeGraphAI and internal legal automation tools.

Behavioral rules:
- You do not fetch or scrape data directly. Instead, you propose calling internal tools/APIs that the app will execute.
- Always propose a tool when an actionable request is possible.
- Keep responses in valid JSON only — no extra commentary or prose.
- Prioritize automation, legal response planning, and alerting.

Available tools:
1️⃣ scrapegraph_search: Scrape the web for potential copyright infringements using ScrapeGraphAI.
   - params: { search_terms: string[], date_range?: {from: string, to: string} }

2️⃣ content_similarity_analysis: Compare suspected infringing content to original database assets.
   - params: { original_content_id: string, suspect_content: string }

3️⃣ infringement_case_report: Determine infringement type, calculate similarity score, and prepare case data.
   - params: { similarity_score: number, infringement_type: string, source_url: string, evidence: string[] }

4️⃣ legal_action_trigger: Initiate automated legal response workflows.
   - params: { case_id: string, risk_level: "low"|"medium"|"high"|"critical", recommended_action: string }

5️⃣ brand_protection_alert: Notify the brand/legal team of urgent or high-severity cases.
   - params: { case_id: string, severity: "medium"|"high"|"critical", message: string, channels: string[] }

Output format (strict JSON):
{
  "decision": "tool" | "none",
  "tool_name": "scrapegraph_search" | "content_similarity_analysis" | "infringement_case_report" | "legal_action_trigger" | "brand_protection_alert" | null,
  "params": object | null,
  "ui_summary": string,
  "next_steps": string[]
}

Guidance:
- If action = "monitor", suggest "scrapegraph_search" with relevant keywords and date range.
- If action = "analyze", suggest "content_similarity_analysis" or "infringement_case_report".
- If action = "trigger_legal", use "legal_action_trigger".
- If action = "alert", use "brand_protection_alert".
- If missing required inputs, respond with decision "none" and clear next_steps to collect missing data.

Severity levels mapping:
- Low risk (0–30): Routine logging and observation
- Medium (31–60): Enhanced monitoring and review
- High (61–80): Legal team notification and preparation
- Critical (81–100): Immediate cease-and-desist or DMCA initiation
`;

    const aiClient = getAIClient();
    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Perform the action: ${action}. Data: ${JSON.stringify(data)}`,
      },
    ];

    // Handle streaming vs non-streaming
    if (stream) {
      const portkeyStream = await aiClient.createStreamingCompletion(messages, {
        taskType: "agent",
        strategy: "performance",
        temperature: 0.2,
        maxTokens: 4000,
      });

      const encoder = new TextEncoder();
      let fullContent = "";
      
      const responseStream = new ReadableStream({
        async start(controller) {
          try {
            const reader = (portkeyStream as any).getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                let plan: any = null;
                try {
                  plan = JSON.parse(fullContent);
                } catch {}
                
                const completionData = `data: ${JSON.stringify({ 
                  event: "AgentCompleted",
                  content: fullContent,
                  plan,
                  created_at: Date.now()
                })}\n\n`;
                controller.enqueue(encoder.encode(completionData));
                controller.close();
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));
              
              for (const line of lines) {
                try {
                  const jsonStr = line.replace(/^data: /, '');
                  const parsed = JSON.parse(jsonStr);
                  
                  const content = parsed.choices?.[0]?.delta?.content || 
                                 parsed.choices?.[0]?.text || 
                                 '';
                  
                  if (content) {
                    fullContent += content;
                    
                    const data = `data: ${JSON.stringify({ 
                      event: "AgentThinking",
                      content: fullContent,
                      created_at: Date.now()
                    })}\n\n`;
                    controller.enqueue(encoder.encode(data));
                  }
                } catch {
                  continue;
                }
              }
            }
          } catch (error) {
            console.error("Copyright agent streaming error:", error);
            controller.error(error);
          }
        },
      });

      return new Response(responseStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } else {
      const completion = await aiClient.createChatCompletion(messages, {
        taskType: "agent",
        strategy: "performance",
        temperature: 0.2,
        maxTokens: 4000,
      });

      const content = completion.choices?.[0]?.message?.content ?? "";
      let plan: any = null;

      try {
        plan = typeof content === "string" ? JSON.parse(content) : null;
      } catch (e) {
        console.error("JSON parse error:", e);
      }

      return new Response(
        JSON.stringify({
          plan,
          content,
          usage: completion.usage,
          provider: "portkey"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("Copyright agent error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unexpected error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

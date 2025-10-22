import { getAIClient } from "@/lib/ai-client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action: string = body?.action ?? "";
    const data: unknown = body?.data ?? {};
    const stream: boolean = body?.stream ?? false;

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
        strategy: "performance", // Use best quality for agents
        temperature: 0.2,
        maxTokens: 4000,
      });

      // Convert to SSE format
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
                // Parse final content and send completion
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
            console.error("Agent streaming error:", error);
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
      // Non-streaming response
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
      } catch {}
      
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

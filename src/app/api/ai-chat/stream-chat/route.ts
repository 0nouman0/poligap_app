import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { getAIClient } from "@/lib/ai-client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const requestBody = await request.json();
    const {
      user_query,
      session_id,
      max_tokens = 4000,
      temperature = 0.7,
    } = requestBody;

    if (!user_query) {
      return new Response(
        JSON.stringify({ error: "Missing user_query" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get conversation history if session_id is provided
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    
    if (session_id) {
      const { data: dbMessages } = await supabase
        .from("chat_messages")
        .select("user_query, ai_response")
        .eq("conversation_id", session_id)
        .order("created_at", { ascending: true })
        .limit(20); // Last 20 messages for context

      if (dbMessages) {
        dbMessages.forEach((msg) => {
          messages.push({ role: "user", content: msg.user_query });
          if (msg.ai_response) {
            messages.push({ role: "assistant", content: msg.ai_response });
          }
        });
      }
    }

    // Add current query
    messages.push({ role: "user", content: user_query });

    console.log('🔄 Using Portkey unified AI client for chat streaming');

    // Get AI client and create streaming completion
    const aiClient = getAIClient();
    
    try {
      const portkeyStream = await aiClient.createStreamingCompletion(messages, {
        taskType: "chat",
        strategy: "balanced", // Use balanced strategy for chat
        temperature,
        maxTokens: max_tokens,
      });

      // Convert Portkey stream to SSE format expected by frontend
      const encoder = new TextEncoder();
      let fullContent = "";
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const reader = (portkeyStream as any).getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                // Send completion signal
                const completionData = `data: ${JSON.stringify({ 
                  event: "RunCompleted",
                  content: fullContent,
                  created_at: Date.now()
                })}\n\n`;
                controller.enqueue(encoder.encode(completionData));
                controller.close();
                break;
              }

              // Parse SSE chunk
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));
              
              for (const line of lines) {
                try {
                  const jsonStr = line.replace(/^data: /, '');
                  const parsed = JSON.parse(jsonStr);
                  
                  // Extract content from different possible formats
                  const content = parsed.choices?.[0]?.delta?.content || 
                                 parsed.choices?.[0]?.text || 
                                 parsed.content || 
                                 '';
                  
                  if (content) {
                    fullContent += content;
                    
                    // Send in RunResponse format expected by frontend
                    const data = `data: ${JSON.stringify({ 
                      event: "RunResponseContent",
                      content: fullContent,
                      created_at: Date.now()
                    })}\n\n`;
                    controller.enqueue(encoder.encode(data));
                  }
                } catch (parseError) {
                  // Skip invalid JSON chunks
                  continue;
                }
              }
            }
          } catch (error) {
            console.error("Streaming error:", error);
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } catch (streamError: any) {
      console.error("Portkey streaming error:", streamError);
      throw streamError;
    }
  } catch (error: any) {
    console.error("Stream chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to stream chat response" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { getSupabaseAIClient } from "@/lib/ai-client-supabase";
import { z } from "zod";

// Rate limiting map (in-memory, reset on server restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Input validation schema
const chatRequestSchema = z.object({
  user_query: z.string().min(1, "Query cannot be empty").max(5000, "Query too long"),
  session_id: z.string().optional(),
  max_tokens: z.number().int().min(1).max(16000).default(8000),
  temperature: z.number().min(0).max(2).default(0.7),
  model: z.string().optional(), // Selected model from frontend
  provider: z.string().optional(), // Provider hint
});

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

    // Rate limiting check
    const userId = user.id;
    const now = Date.now();
    const userLimit = rateLimitMap.get(userId);
    
    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= RATE_LIMIT) {
          return new Response(
            JSON.stringify({ 
              error: "Rate limit exceeded",
              message: `Too many requests. Please wait ${Math.ceil((userLimit.resetTime - now) / 1000)} seconds.`,
              retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
            }),
            { 
              status: 429, 
              headers: { 
                "Content-Type": "application/json",
                "Retry-After": String(Math.ceil((userLimit.resetTime - now) / 1000))
              } 
            }
          );
        }
        userLimit.count++;
      } else {
        rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    // Input validation
    const requestBody = await request.json();
    const validationResult = chatRequestSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input",
          details: validationResult.error.errors
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const {
      user_query,
      session_id,
      max_tokens,
      temperature,
      model,
      provider,
    } = validationResult.data;

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

    console.log('🔄 Using Supabase-configured Portkey AI client for chat streaming');
    console.log('📝 Model selection:', { model, provider });

    // Get Supabase AI client and create streaming completion
    const aiClient = getSupabaseAIClient();
    
    // Determine task type based on model/provider or use intelligent auto-routing
    let taskType: "chat" | "agent" | "analysis" | "generation" = "chat";
    let strategy: "cost-optimized" | "performance" | "balanced" = "balanced";
    
    // Map model selection to optimal routing
    if (model === "auto" || !model) {
      // Let Portkey decide based on task type
      taskType = "chat";
      strategy = "balanced";
      console.log('✨ Using auto-routing (Portkey intelligent selection)');
    } else if (model.includes("gpt-4o-mini") || model.includes("llama")) {
      // Fast models
      strategy = "cost-optimized";
    } else if (model.includes("gpt-4o") || model.includes("claude")) {
      // Premium models
      strategy = "performance";
    }
    
    try {
      const portkeyStream = await aiClient.createStreamingCompletion(messages, {
        taskType,
        strategy,
        temperature,
        maxTokens: max_tokens,
      });

      // Convert Portkey stream to SSE format expected by frontend
      const encoder = new TextEncoder();
      let fullContent = "";
      let isComplete = false;
      let finishReason = "";
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Handle Portkey stream as async iterable
            for await (const chunk of portkeyStream as any) {
              try {
                // Extract content from the chunk
                const content = chunk.choices?.[0]?.delta?.content || 
                               chunk.choices?.[0]?.text || 
                               chunk.content || 
                               '';
                
                // Check for finish reason (token limit, stop, etc.)
                const chunkFinishReason = chunk.choices?.[0]?.finish_reason || '';
                if (chunkFinishReason) {
                  finishReason = chunkFinishReason;
                  isComplete = true;
                }
                
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
                console.warn("Failed to parse stream chunk:", parseError);
                continue;
              }
            }
            
            // Handle graceful truncation if response was cut off due to token limit
            if (finishReason === "length") {
              // Add a graceful truncation indicator
              const truncationMessage = "\n\n---\n\n*Response was truncated due to length limits. Please ask me to continue if you need more information.*";
              fullContent += truncationMessage;
              
              // Send the truncation message
              const truncationData = `data: ${JSON.stringify({ 
                event: "RunResponseContent",
                content: fullContent,
                created_at: Date.now(),
                truncated: true
              })}\n\n`;
              controller.enqueue(encoder.encode(truncationData));
            }
            
            // Send completion signal
            const completionData = `data: ${JSON.stringify({ 
              event: "RunCompleted",
              content: fullContent,
              created_at: Date.now(),
              finish_reason: finishReason,
              truncated: finishReason === "length"
            })}\n\n`;
            controller.enqueue(encoder.encode(completionData));
            controller.close();
            
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

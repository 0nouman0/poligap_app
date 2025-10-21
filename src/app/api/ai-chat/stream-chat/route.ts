import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// Disable Portkey and use Gemini directly
const USE_PORTKEY = false;

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
    } = requestBody;
    let model = requestBody.model || "gemini-2.0-flash-exp";

    if (!user_query) {
      return new Response(
        JSON.stringify({ error: "Missing user_query" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate and ensure we're using a Gemini model
    if (!model || !model.startsWith("gemini-")) {
      console.warn(`⚠️ Invalid model "${model}" requested. Using default Gemini model.`);
      model = "gemini-2.0-flash-exp";
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

    console.log('🔄 Using Direct Gemini API for chat streaming');

    // Direct Gemini implementation
    // Convert messages back to Gemini format
    const conversationHistory: Array<{ role: string; parts: Array<{ text: string }> }> = messages
      .slice(0, -1) // Exclude the current query
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    const model_instance = genAI.getGenerativeModel({ 
      model,
      generationConfig: {
        maxOutputTokens: max_tokens,
      },
    });

    // Start a chat session with history
    const chat = model_instance.startChat({
      history: conversationHistory,
    });

    // Stream the response
    const result = await chat.sendMessageStream(user_query);

    // Create a ReadableStream for SSE with RunResponse format
    const encoder = new TextEncoder();
    let fullContent = "";
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            fullContent += text;
            
            // Send in RunResponse format expected by frontend
            const data = `data: ${JSON.stringify({ 
              event: "RunResponseContent",
              content: fullContent,
              created_at: Date.now()
            })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
          
          // Send completion signal
          const completionData = `data: ${JSON.stringify({ 
            event: "RunCompleted",
            content: fullContent,
            created_at: Date.now()
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

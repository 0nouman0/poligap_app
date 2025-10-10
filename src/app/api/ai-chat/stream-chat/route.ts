import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

    const {
      user_query,
      session_id,
      model = "gemini-2.0-flash-exp",
      max_tokens = 4000,
    } = await request.json();

    if (!user_query) {
      return new Response(
        JSON.stringify({ error: "Missing user_query" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get conversation history if session_id is provided
    let conversationHistory: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    
    if (session_id) {
      const { data: messages } = await supabase
        .from("chat_messages")
        .select("user_query, content")
        .eq("conversation_id", session_id)
        .order("created_at", { ascending: true })
        .limit(20); // Last 20 messages for context

      if (messages) {
        conversationHistory = messages.flatMap((msg) => [
          { role: "user", parts: [{ text: msg.user_query }] },
          { role: "model", parts: [{ text: msg.content || "" }] },
        ]);
      }
    }

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

    // Create a ReadableStream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            const data = `data: ${JSON.stringify({ content: text })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
          
          // Send done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
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

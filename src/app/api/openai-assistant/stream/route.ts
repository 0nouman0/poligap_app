import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAssistantClient } from "@/lib/openai-assistant";

/**
 * OpenAI Assistants API Streaming Endpoint
 * 
 * Matches enterprise-search-frontend SSE format:
 * event: run.started
 * data: {...}
 * 
 * event: message.delta
 * data: {...}
 * 
 * event: run.completed
 * data: {...}
 */

export async function POST(request: NextRequest) {
  try {
    // Auth check
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

    const body = await request.json();
    const {
      user_query,
      thread_id,
      assistant_id,
      additional_instructions,
      file_ids,
    } = body;

    if (!user_query) {
      return new Response(
        JSON.stringify({ error: "user_query is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const assistantClient = getAssistantClient();

    // Create or use existing thread
    let finalThreadId = thread_id;
    if (!finalThreadId) {
      const thread = await assistantClient.createThread();
      finalThreadId = thread.id;
    }

    // Add user message to thread
    await assistantClient.addMessage(finalThreadId, user_query, file_ids);

    // Create streaming run with SSE format
    const stream = await assistantClient.createStreamingRun(
      finalThreadId,
      assistant_id,
      additional_instructions
    );

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    });
  } catch (error: any) {
    console.error("OpenAI Assistant stream error:", error);
    
    // Return error in SSE format
    const encoder = new TextEncoder();
    const errorChunk = `event: error\ndata: ${JSON.stringify({
      event: "error",
      error: error.message || "Failed to stream response",
      created_at: Date.now()
    })}\n\n`;
    
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(errorChunk));
          controller.close();
        },
      }),
      {
        status: 200, // Still 200 for SSE
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      }
    );
  }
}

/**
 * GET - Create a new assistant or get existing one
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const assistantId = searchParams.get("assistant_id");

    const assistantClient = getAssistantClient();

    if (action === "create") {
      const name = searchParams.get("name") || "Poligap Assistant";
      const instructions = searchParams.get("instructions") || 
        "You are a helpful AI assistant for Poligap, specializing in compliance, policy analysis, and enterprise search.";
      
      const assistant = await assistantClient.createAssistant({
        name,
        instructions,
        model: "gpt-4o",
        tools: [
          { type: "code_interpreter" },
          { type: "file_search" },
        ],
      });

      return new Response(
        JSON.stringify({ 
          success: true,
          assistant_id: assistant.id,
          name: assistant.name,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "thread") {
      const thread = await assistantClient.createThread();
      return new Response(
        JSON.stringify({ 
          success: true,
          thread_id: thread.id,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "messages" && assistantId) {
      const messages = await assistantClient.getMessages(assistantId);
      return new Response(
        JSON.stringify({ 
          success: true,
          messages,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action parameter" }),
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Assistant API error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}

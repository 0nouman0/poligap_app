import { createApiResponse } from "@/lib/apiResponse";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return createApiResponse({
        success: false,
        error: "Unauthorized",
        status: 401,
      });
    }

    const {
      conversationId,
      chatName,
      summary = "Welcome to Poligap AI - Enterprise Search",
    } = await request.json();

    if (!conversationId || !chatName) {
      return createApiResponse({
        success: false,
        error: "Missing required fields",
        status: 400,
      });
    }

    // Use Supabase Postgrest API to update conversation
    const { data, error } = await supabase
      .from('agent_conversations')
      .update({
        chat_name: chatName,
        summary: summary,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .eq('user_id', user.id) // Ensure user owns the conversation
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return createApiResponse({
        success: false,
        error: `Failed to update conversation: ${error.message}`,
        status: error.code === 'PGRST116' ? 404 : 500,
      });
    }

    if (!data) {
      return createApiResponse({
        success: false,
        error: "Conversation not found",
        status: 404,
      });
    }

    return createApiResponse({
      success: true,
      error: "Conversation updated successfully",
      data: data,
      status: 200,
    });
  } catch (error) {
    console.error("Error in editConversation:", error);
    return createApiResponse({
      success: false,
      error: "Failed to update conversation",
      status: 500,
    });
  }
}

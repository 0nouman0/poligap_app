import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createApiResponse } from "@/lib/apiResponse";

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
      conversation_id,
      user_query,
      content,
      streamingError,
      tool_calls,
      extra_data,
      images,
      videos,
    } = await request.json();

    if (!conversation_id || !user_query) {
      return createApiResponse({
        success: false,
        error: "Missing required fields: conversation_id and user_query",
        status: 400,
      });
    }

    // Generate a unique message ID
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    console.log('💾 Creating chat message:', {
      conversation_id,
      messageId,
      user_query: user_query.substring(0, 50),
      hasContent: !!content,
    });

    // Use Supabase Postgrest API to create message
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id,
        message_id: messageId,
        user_query,
        ai_response: content || '',
        message_type: 'ai',
        tool_calls: tool_calls || [],
        extra_data: extra_data || {},
        images: images || [],
        videos: videos || [],
        streaming_error: streamingError || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return createApiResponse({
        success: false,
        error: `Failed to create message: ${error.message}`,
        status: 500,
      });
    }

    console.log('✅ Chat message created successfully:', data.id);

    return createApiResponse({
      success: true,
      error: "Chat created successfully",
      status: 200,
      data: data,
    });
  } catch (error) {
    console.error("❌ Error in createChat:", error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create chat",
      status: 500,
    });
  }
}

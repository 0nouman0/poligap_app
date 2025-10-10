import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiResponse } from '@/lib/apiResponse';

// GET - Retrieve chat messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return createApiResponse({
        success: false,
        error: 'Unauthorized',
        status: 401,
      });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    console.log('📖 Getting chat messages for conversation:', conversationId);

    if (!conversationId) {
      return createApiResponse({
        success: false,
        error: 'Conversation ID is required',
        status: 400,
      });
    }

    // Use Supabase Postgrest API to get messages
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase query error:', error);
      return createApiResponse({
        success: false,
        error: `Failed to fetch messages: ${error.message}`,
        status: 500,
      });
    }

    console.log(`📨 Found ${messages?.length || 0} messages for conversation ${conversationId}`);

    // Transform messages to match frontend format
    const transformedMessages = (messages || []).map((message: any) => ({
      id: message.message_id,
      user_query: message.user_query,
      content: message.ai_response,
      conversation_id: conversationId,
      tool_calls: message.tool_calls || [],
      extra_data: message.extra_data || {},
      images: message.images || [],
      videos: message.videos || [],
      created_at: Math.floor(new Date(message.created_at).getTime() / 1000),
      messageType: message.message_type,
    }));

    return createApiResponse({
      success: true,
      data: transformedMessages,
    });
  } catch (error) {
    console.error('❌ Error getting chat messages:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get messages',
      status: 500,
    });
  }
}

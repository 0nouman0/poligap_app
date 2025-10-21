import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiResponse } from '@/lib/apiResponse';

// GET - Retrieve a specific conversation and its messages
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

    console.log('🔍 Getting selected chat for conversation:', conversationId);

    if (!conversationId) {
      return createApiResponse({
        success: false,
        error: 'Conversation ID is required',
        status: 400,
      });
    }

    // Get the conversation details
    const { data: conversation, error: convError } = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convError) {
      console.error('Error fetching conversation:', convError);
      return createApiResponse({
        success: false,
        error: `Failed to fetch conversation: ${convError.message}`,
        status: 500,
      });
    }

    // Get messages for this conversation
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('Error fetching messages:', msgError);
      // Don't fail if no messages, just return empty array
      console.log('No messages found for conversation, continuing...');
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
      data: {
        conversation: {
          _id: conversation.id,
          chatName: conversation.chat_name,
          createdAt: conversation.created_at,
          updatedAt: conversation.updated_at,
          userId: conversation.user_id,
          companyId: conversation.company_id,
        },
        messages: transformedMessages,
      },
    });
  } catch (error) {
    console.error('❌ Error getting selected chat:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get chat',
      status: 500,
    });
  }
}

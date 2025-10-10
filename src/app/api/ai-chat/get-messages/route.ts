import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { queries } from '@/lib/supabase/graphql';
import { createApiResponse } from '@/lib/apiResponse';
import { GraphQLClient } from 'graphql-request';

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

    // Get access token for GraphQL
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return createApiResponse({
        success: false,
        error: 'No session found',
        status: 401,
      });
    }

    const graphQLClient = new GraphQLClient(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    const result = await graphQLClient.request<any>(queries.getMessages, {
      conversationId,
    });

    const messages = result.chat_messagesCollection.edges.map((edge: any) => edge.node);

    console.log(`📨 Found ${messages.length} messages for conversation ${conversationId}`);

    // Transform messages to match frontend format
    const transformedMessages = messages.map((message: any) => ({
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

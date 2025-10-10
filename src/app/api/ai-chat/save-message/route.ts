import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { queries } from '@/lib/supabase/graphql';
import { createApiResponse } from '@/lib/apiResponse';
import { GraphQLClient } from 'graphql-request';

// POST - Save a chat message to Supabase
export async function POST(request: NextRequest) {
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

    const messageData = await request.json();
    console.log('💾 Saving chat message:', messageData);

    const {
      conversationId,
      messageId,
      user_query,
      content,
      messageType = 'ai',
      tool_calls = [],
      extra_data = {},
      images = [],
      videos = [],
    } = messageData;

    if (!conversationId || !messageId) {
      return createApiResponse({
        success: false,
        error: 'Missing required fields: conversationId and messageId',
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

    // Check if message already exists
    const checkQuery = `
      query CheckMessage($message_id: String!) {
        chat_messagesCollection(filter: { message_id: { eq: $message_id } }) {
          edges {
            node {
              id
              message_id
            }
          }
        }
      }
    `;

    const checkResult = await graphQLClient.request<any>(checkQuery, { message_id: messageId });
    const existingMessage = checkResult.chat_messagesCollection.edges[0];

    if (existingMessage) {
      console.log('📝 Updating existing message:', messageId);
      
      // Update existing message
      const updateResult = await graphQLClient.request<any>(queries.updateMessage, {
        message_id: messageId,
        ai_response: content,
        tool_calls: tool_calls.length > 0 ? tool_calls : undefined,
        extra_data: Object.keys(extra_data).length > 0 ? extra_data : undefined,
        images: images.length > 0 ? images : undefined,
        videos: videos.length > 0 ? videos : undefined,
      });

      return createApiResponse({
        success: true,
        data: updateResult.updatechat_messagesCollection.records[0],
      });
    }

    // Create new message
    const createResult = await graphQLClient.request<any>(queries.createMessage, {
      conversation_id: conversationId,
      message_id: messageId,
      user_query: user_query || '',
      ai_response: content || '',
      message_type: messageType,
      tool_calls,
      extra_data,
      images,
      videos,
    });

    const newMessage = createResult.insertIntochat_messagesCollection.records[0];

    console.log('✅ Chat message saved successfully:', newMessage.id);

    return createApiResponse({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    console.error('❌ Error saving chat message:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save message',
      status: 500,
    });
  }
}

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiResponse } from '@/lib/apiResponse';

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

    // Check if message already exists
    const { data: existingMessages } = await supabase
      .from('chat_messages')
      .select('id, message_id')
      .eq('message_id', messageId)
      .limit(1);

    if (existingMessages && existingMessages.length > 0) {
      console.log('📝 Updating existing message:', messageId);
      
      // Update existing message
      const { data, error } = await supabase
        .from('chat_messages')
        .update({
          ai_response: content,
          tool_calls: tool_calls.length > 0 ? tool_calls : null,
          extra_data: Object.keys(extra_data).length > 0 ? extra_data : null,
          images: images.length > 0 ? images : null,
          videos: videos.length > 0 ? videos : null,
          updated_at: new Date().toISOString()
        })
        .eq('message_id', messageId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        return createApiResponse({
          success: false,
          error: `Failed to update message: ${error.message}`,
          status: 500,
        });
      }

      return createApiResponse({
        success: true,
        data: data,
      });
    }

    // Create new message
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        message_id: messageId,
        user_query: user_query || '',
        ai_response: content || '',
        message_type: messageType,
        tool_calls,
        extra_data,
        images,
        videos,
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

    console.log('✅ Chat message saved successfully:', data.id);

    return createApiResponse({
      success: true,
      data: data,
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

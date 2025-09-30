import { NextRequest, NextResponse } from 'next/server';
import ChatMessage from '@/models/chatMessage.model';
import { createApiResponse } from '@/lib/apiResponse';

// GET - Retrieve chat messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('📖 Getting chat messages for conversation:', conversationId);

    if (!conversationId) {
      return createApiResponse({
        success: false,
        error: 'Conversation ID is required',
        status: 400,
      });
    }

    // Get messages for the conversation, sorted by creation time
    const messages = await ChatMessage.find({ conversationId })
      .sort({ createdAt: 1 }) // Oldest first
      .skip(offset)
      .limit(limit)
      .lean();

    console.log(`📨 Found ${messages.length} messages for conversation ${conversationId}`);

    // Transform messages to match frontend format
    const transformedMessages = messages.map(message => ({
      id: message.messageId,
      user_query: message.userQuery,
      content: message.aiResponse,
      conversation_id: message.conversationId.toString(),
      tool_calls: message.toolCalls || [],
      extra_data: message.extraData || {},
      images: message.images || [],
      videos: message.videos || [],
      audio: message.audio,
      response_audio: message.responseAudio,
      streamingError: message.streamingError || false,
      created_at: Math.floor(message.createdAt.getTime() / 1000),
      messageType: message.messageType,
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

import { NextRequest, NextResponse } from 'next/server';
import ChatMessage from '@/models/chatMessage.model';
import AgentConversation from '@/models/agentConversation.model';
import { createApiResponse } from '@/lib/apiResponse';
import mongoose from 'mongoose';

// POST - Save a chat message to MongoDB
export async function POST(request: NextRequest) {
  try {
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
      audio,
      response_audio,
      streamingError = false,
      created_at
    } = messageData;

    if (!conversationId || !messageId) {
      return createApiResponse({
        success: false,
        error: 'Missing required fields: conversationId and messageId',
        status: 400,
      });
    }

    // Verify conversation exists
    const conversation = await AgentConversation.findById(conversationId);
    if (!conversation) {
      console.log('⚠️ Conversation not found, creating new one');
      // Don't fail - the conversation might be created separately
    }

    // Check if message already exists (prevent duplicates)
    const existingMessage = await ChatMessage.findOne({ messageId });
    if (existingMessage) {
      console.log('📝 Updating existing message:', messageId);
      
      // Update existing message
      const updatedMessage = await ChatMessage.findOneAndUpdate(
        { messageId },
        {
          aiResponse: content || existingMessage.aiResponse,
          toolCalls: tool_calls.length > 0 ? tool_calls : existingMessage.toolCalls,
          extraData: Object.keys(extra_data).length > 0 ? extra_data : existingMessage.extraData,
          images: images.length > 0 ? images : existingMessage.images,
          videos: videos.length > 0 ? videos : existingMessage.videos,
          audio: audio || existingMessage.audio,
          responseAudio: response_audio || existingMessage.responseAudio,
          streamingError,
          updatedAt: new Date(),
        },
        { new: true }
      );

      return createApiResponse({
        success: true,
        data: updatedMessage,
      });
    }

    // Create new message
    const newMessage = await ChatMessage.create({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      messageId,
      userQuery: user_query || '',
      aiResponse: content || '',
      messageType,
      toolCalls: tool_calls,
      extraData: extra_data,
      images,
      videos,
      audio,
      responseAudio: response_audio,
      streamingError,
      createdAt: created_at ? new Date(created_at * 1000) : new Date(),
    });

    console.log('✅ Chat message saved successfully:', newMessage._id);

    // Update conversation's updatedAt timestamp
    if (conversation) {
      await AgentConversation.findByIdAndUpdate(conversationId, {
        updatedAt: new Date(),
      });
    }

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

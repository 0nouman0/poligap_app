import { NextRequest, NextResponse } from 'next/server';
import ChatMessage from '@/models/chatMessage.model';
import AgentConversation from '@/models/agentConversation.model';
import { createApiResponse } from '@/lib/apiResponse';
import mongoose from 'mongoose';
import { requireAuth } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth();
    
    const body = await request.json();
    const {
      conversationId,
      messageId,
      userQuery,
      aiResponse,
      messageType,
      toolCalls,
      extraData,
      images,
      videos,
      audio,
      responseAudio,
      streamingError
    } = body;

    // Validate required fields
    if (!conversationId || !messageId || !userQuery || !messageType) {
      return createApiResponse({
        success: false,
        error: 'Missing required fields: conversationId, messageId, userQuery, messageType',
        status: 400,
      });
    }

    // Validate messageType
    if (!['user', 'ai'].includes(messageType)) {
      return createApiResponse({
        success: false,
        error: 'Invalid messageType. Must be "user" or "ai"',
        status: 400,
      });
    }

    // Check if conversation exists
    const conversation = await AgentConversation.findById(conversationId);
    if (!conversation) {
      return createApiResponse({
        success: false,
        error: 'Conversation not found',
        status: 404,
      });
    }

    // Check if message already exists (prevent duplicates)
    const existingMessage = await ChatMessage.findOne({ messageId });
    if (existingMessage) {
      // Update existing message instead of creating duplicate
      const updatedMessage = await ChatMessage.findOneAndUpdate(
        { messageId },
        {
          userQuery,
          aiResponse,
          messageType,
          toolCalls: toolCalls || [],
          extraData: extraData || {},
          images: images || [],
          videos: videos || [],
          audio,
          responseAudio,
          streamingError: streamingError || false,
        },
        { new: true }
      );

      return createApiResponse({
        success: true,
        error: 'Chat message updated successfully',
        status: 200,
        data: updatedMessage,
      });
    }

    // Create new chat message
    const newMessage = await ChatMessage.create({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      messageId,
      userQuery,
      aiResponse,
      messageType,
      toolCalls: toolCalls || [],
      extraData: extraData || {},
      images: images || [],
      videos: videos || [],
      audio,
      responseAudio,
      streamingError: streamingError || false,
    });

    // Update conversation's updatedAt timestamp
    await AgentConversation.findByIdAndUpdate(
      conversationId,
      { updatedAt: new Date() }
    );

    return createApiResponse({
      success: true,
      error: 'Chat message saved successfully',
      status: 201,
      data: newMessage,
    });

  } catch (error) {
    console.error('Error saving chat message:', error);
    return createApiResponse({
      success: false,
      error: 'Failed to save chat message',
      status: 500,
    });
  }
}

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
    const { conversationId, messages } = body;

    // Validate required fields
    if (!conversationId || !messages || !Array.isArray(messages)) {
      return createApiResponse({
        success: false,
        error: 'Missing required fields: conversationId and messages array',
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

    const savedMessages = [];
    const errors = [];

    // Process each message
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      
      try {
        // Validate message structure
        if (!message.messageId || !message.userQuery || !message.messageType) {
          errors.push({
            index: i,
            error: 'Missing required fields: messageId, userQuery, messageType',
            messageId: message.messageId,
          });
          continue;
        }

        // Validate messageType
        if (!['user', 'ai'].includes(message.messageType)) {
          errors.push({
            index: i,
            error: 'Invalid messageType. Must be "user" or "ai"',
            messageId: message.messageId,
          });
          continue;
        }

        // Check if message already exists
        const existingMessage = await ChatMessage.findOne({ 
          messageId: message.messageId 
        });

        let savedMessage;

        if (existingMessage) {
          // Update existing message
          savedMessage = await ChatMessage.findOneAndUpdate(
            { messageId: message.messageId },
            {
              conversationId: new mongoose.Types.ObjectId(conversationId),
              userQuery: message.userQuery,
              aiResponse: message.aiResponse,
              messageType: message.messageType,
              toolCalls: message.toolCalls || [],
              extraData: message.extraData || {},
              images: message.images || [],
              videos: message.videos || [],
              audio: message.audio,
              responseAudio: message.responseAudio,
              streamingError: message.streamingError || false,
            },
            { new: true }
          );
        } else {
          // Create new message
          savedMessage = await ChatMessage.create({
            conversationId: new mongoose.Types.ObjectId(conversationId),
            messageId: message.messageId,
            userQuery: message.userQuery,
            aiResponse: message.aiResponse,
            messageType: message.messageType,
            toolCalls: message.toolCalls || [],
            extraData: message.extraData || {},
            images: message.images || [],
            videos: message.videos || [],
            audio: message.audio,
            responseAudio: message.responseAudio,
            streamingError: message.streamingError || false,
          });
        }

        savedMessages.push(savedMessage);

      } catch (messageError) {
        console.error(`Error processing message ${i}:`, messageError);
        errors.push({
          index: i,
          error: messageError instanceof Error ? messageError.message : 'Unknown error',
          messageId: message.messageId,
        });
      }
    }

    // Update conversation's updatedAt timestamp
    await AgentConversation.findByIdAndUpdate(
      conversationId,
      { updatedAt: new Date() }
    );

    const response = {
      savedMessages,
      savedCount: savedMessages.length,
      totalMessages: messages.length,
      errors,
      errorCount: errors.length,
    };

    // Return appropriate status based on results
    if (errors.length === 0) {
      return createApiResponse({
        success: true,
        error: 'All messages saved successfully',
        status: 200,
        data: response,
      });
    } else if (savedMessages.length > 0) {
      return createApiResponse({
        success: true,
        error: 'Some messages saved with errors',
        status: 207, // Multi-Status
        data: response,
      });
    } else {
      return createApiResponse({
        success: false,
        error: 'Failed to save any messages',
        status: 400,
        data: response,
      });
    }

  } catch (error) {
    console.error('Error in batch save:', error);
    return createApiResponse({
      success: false,
      error: 'Failed to save messages',
      status: 500,
    });
  }
}

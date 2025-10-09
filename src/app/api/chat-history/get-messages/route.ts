import { NextRequest, NextResponse } from 'next/server';
import ChatMessage from '@/models/chatMessage.model';
import AgentConversation from '@/models/agentConversation.model';
import { createApiResponse } from '@/lib/apiResponse';
import mongoose from 'mongoose';
import { requirePermission, requireAuth, Permission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    // Require authentication for viewing chat history
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');
    const companyId = searchParams.get('companyId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // If conversationId is provided, get messages for that conversation
    if (conversationId) {
      // Validate conversation exists and user has access
      const conversation = await AgentConversation.findOne({
        _id: conversationId,
        ...(userId && { enterpriseUserId: new mongoose.Types.ObjectId(userId) }),
        ...(companyId && { companyId: new mongoose.Types.ObjectId(companyId) }),
      });

      if (!conversation) {
        return createApiResponse({
          success: false,
          error: 'Conversation not found or access denied',
          status: 404,
        });
      }

      // Get messages for the conversation
      const messages = await ChatMessage.find({ conversationId })
        .sort({ createdAt: 1 }) // Oldest first for chat display
        .limit(limit)
        .skip(offset);

      const totalMessages = await ChatMessage.countDocuments({ conversationId });

      return createApiResponse({
        success: true,
        status: 200,
        data: {
          conversation,
          messages,
          totalMessages,
          hasMore: offset + messages.length < totalMessages,
        },
      });
    }

    // If no conversationId, get recent conversations with their latest messages
    if (!userId) {
      return createApiResponse({
        success: false,
        error: 'userId is required when conversationId is not provided',
        status: 400,
      });
    }

    const conversations = await AgentConversation.find({
      enterpriseUserId: new mongoose.Types.ObjectId(userId),
      ...(companyId && { companyId: new mongoose.Types.ObjectId(companyId) }),
      status: { $ne: 'deleted' },
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(offset);

    // Get the latest message for each conversation
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conversation) => {
        const latestMessage = await ChatMessage.findOne({
          conversationId: conversation._id,
        }).sort({ createdAt: -1 });

        const messageCount = await ChatMessage.countDocuments({
          conversationId: conversation._id,
        });

        return {
          ...conversation.toObject(),
          latestMessage,
          messageCount,
        };
      })
    );

    const totalConversations = await AgentConversation.countDocuments({
      enterpriseUserId: new mongoose.Types.ObjectId(userId),
      ...(companyId && { companyId: new mongoose.Types.ObjectId(companyId) }),
      status: { $ne: 'deleted' },
    });

    return createApiResponse({
      success: true,
      status: 200,
      data: {
        conversations: conversationsWithMessages,
        totalConversations,
        hasMore: offset + conversations.length < totalConversations,
      },
    });

  } catch (error) {
    console.error('Error retrieving chat history:', error);
    return createApiResponse({
      success: false,
      error: 'Failed to retrieve chat history',
      status: 500,
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Require DELETE permission - CRITICAL SECURITY
    const userContext = await requirePermission(Permission.CONVERSATION_DELETE);
    
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const messageId = searchParams.get('messageId');
    const userId = searchParams.get('userId');

    if (!userId) {
      return createApiResponse({
        success: false,
        error: 'userId is required',
        status: 400,
      });
    }

    // Delete specific message
    if (messageId) {
      const message = await ChatMessage.findOne({ messageId });
      if (!message) {
        return createApiResponse({
          success: false,
          error: 'Message not found',
          status: 404,
        });
      }

      // Verify user has access to this conversation
      const conversation = await AgentConversation.findOne({
        _id: message.conversationId,
        enterpriseUserId: new mongoose.Types.ObjectId(userId),
      });

      if (!conversation) {
        return createApiResponse({
          success: false,
          error: 'Access denied',
          status: 403,
        });
      }

      await ChatMessage.findOneAndDelete({ messageId });

      return createApiResponse({
        success: true,
        status: 200,
      });
    }

    // Delete entire conversation and its messages
    if (conversationId) {
      const conversation = await AgentConversation.findOne({
        _id: conversationId,
        enterpriseUserId: new mongoose.Types.ObjectId(userId),
      });

      if (!conversation) {
        return createApiResponse({
          success: false,
          error: 'Conversation not found or access denied',
          status: 404,
        });
      }

      // Delete all messages in the conversation
      await ChatMessage.deleteMany({ conversationId });

      // Mark conversation as deleted (soft delete)
      await AgentConversation.findByIdAndUpdate(conversationId, {
        status: 'deleted',
      });

      return createApiResponse({
        success: true,
        status: 200,
      });
    }

    return createApiResponse({
      success: false,
      error: 'Either conversationId or messageId is required',
      status: 400,
    });

  } catch (error) {
    console.error('Error deleting chat data:', error);
    return createApiResponse({
      success: false,
      error: 'Failed to delete chat data',
      status: 500,
    });
  }
}

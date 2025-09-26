import { createApiResponse } from "@/lib/apiResponse";
import AgentConversationChat from "@/models/agentConversationChat.model";
import AgentConversation from "@/models/agentConversation.model";
import mongoose from "mongoose";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const conversationId = request.nextUrl.searchParams.get("conversationId");

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return createApiResponse({
        success: false,
        error: "Invalid or missing conversationId",
        status: 400,
      });
    }

    console.log("conversationId 🫱", conversationId);
    const convObjectId = new mongoose.Types.ObjectId(conversationId);
    const conversation = await AgentConversation.findOne({
      _id: convObjectId,
      status: "active",
    });

    if (!conversation) {
      return createApiResponse({
        success: false,
        error: "Conversation not found",
        status: 404,
      });
    }

    const chats = await AgentConversationChat.find({
      conversationId: convObjectId,
    }).sort({
      createdAt: 1,
    });

    if (!chats) {
      return createApiResponse({
        success: false,
        error: "Conversation not found",
        status: 404,
      });
    }

    return createApiResponse({
      success: true,
      error: "Conversation found",
      data: chats,
      status: 200,
    });
  } catch (error) {
    console.error("Error in getSelectedChat:", error);
    return createApiResponse({
      success: false,
      error: "Failed to get conversation",
      status: 500,
    });
  }
}

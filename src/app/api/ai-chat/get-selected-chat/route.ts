import { createApiResponse } from "@/lib/apiResponse";
import AgentConversationChat from "@/models/agentConversationChat.model";
import AgentConversation from "@/models/agentConversation.model";
import mongoose from "mongoose";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Ensure database connection
    if (mongoose.connection.readyState !== 1) {
      try {
        console.log('🔄 Establishing database connection...');
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('✅ Database connection established');
      } catch (dbError) {
        console.error("❌ Database connection failed:", dbError);
        return createApiResponse({
          success: false,
          error: "Database connection failed",
          status: 500,
        });
      }
    }

    const conversationId = request.nextUrl.searchParams.get("conversationId");

    console.log("get-selected-chat - conversationId:", conversationId);

    if (!conversationId || conversationId === "undefined" || conversationId === "null") {
      console.log("⚠️ Invalid conversationId:", conversationId);
      return createApiResponse({
        success: false,
        error: "Valid conversation ID is required",
        status: 400,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      console.log("⚠️ Invalid ObjectId format:", conversationId);
      return createApiResponse({
        success: false,
        error: "Invalid conversation ID format",
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

    console.log("✅ Found conversation with", chats.length, "messages");
    return createApiResponse({
      success: true,
      data: chats,
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error in getSelectedChat:", error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get conversation",
      status: 500,
    });
  }
}

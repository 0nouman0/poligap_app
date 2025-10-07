import { createApiResponse } from "@/lib/apiResponse";
import { NextRequest } from "next/server";
import AgentConversation from "@/models/agentConversation.model";
import mongoose from "mongoose";

export async function DELETE(request: NextRequest) {
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

    console.log("delete-conversation - conversationId:", conversationId);

    if (!conversationId || conversationId === "undefined" || conversationId === "null") {
      console.log("⚠️ Invalid conversationId:", conversationId);
      return createApiResponse({
        success: false,
        error: "Valid conversation ID is required",
        status: 400,
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      console.log("⚠️ Invalid ObjectId format:", conversationId);
      return createApiResponse({
        success: false,
        error: "Invalid conversation ID format",
        status: 400,
      });
    }

    const conversation = await AgentConversation.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(conversationId),
        status: "active",
      },
      {
        status: "deleted",
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!conversation) {
      console.log("⚠️ Conversation not found or already deleted:", conversationId);
      return createApiResponse({
        success: false,
        error: "Conversation not found or already deleted",
        status: 404,
      });
    }

    console.log("✅ Conversation deleted successfully:", conversationId);
    return createApiResponse({
      success: true,
      data: { 
        conversationId: conversation._id,
        message: "Conversation deleted successfully" 
      },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error in deleteConversation:", error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete conversation",
      status: 500,
    });
  }
}

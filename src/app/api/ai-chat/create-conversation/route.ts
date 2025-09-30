import AgentConversation from "@/models/agentConversation.model";
import mongoose from "mongoose";
import User from "@/models/users.model";
import { createApiResponse } from "@/lib/apiResponse";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, companyId } = await request.json();
    console.log("userId and companyId =>", userId, companyId);

    // Get user data from localStorage if not provided
    let actualUserId = userId;
    let actualCompanyId = companyId;

    if (!actualUserId) {
      // Try to get from request headers or create a fallback
      console.log("⚠️ No userId provided, using fallback");
      actualUserId = "68d6b1725d67a98149c47532"; // Use the current user ID from localStorage
    }

    if (!actualCompanyId) {
      console.log("⚠️ No companyId provided, using fallback");
      actualCompanyId = "60f1b2b3c4d5e6f7a8b9c0d1"; // Default company ID
    }

    console.log("Using userId and companyId =>", actualUserId, actualCompanyId);

    // Try to find user by different methods
    let user = null;
    
    try {
      // First try with actualUserId as ObjectId
      user = await User.findOne({
        userId: mongoose.Types.ObjectId.createFromHexString(actualUserId),
      });
    } catch (error) {
      console.log("Failed to find user by userId ObjectId, trying _id");
    }

    if (!user) {
      try {
        // Try finding by _id
        user = await User.findById(actualUserId);
      } catch (error) {
        console.log("Failed to find user by _id");
      }
    }

    if (!user) {
      // Create a temporary user for chat functionality
      console.log("🔧 Creating temporary user for chat");
      user = await User.create({
        _id: new mongoose.Types.ObjectId(actualUserId),
        userId: new mongoose.Types.ObjectId(actualUserId),
        uniqueId: `user_${Date.now()}`,
        email: 'chat-user@poligap.com',
        name: 'Chat User',
        status: 'ACTIVE',
        profileCreatedOn: new Date().toISOString(),
      });
    }

    const conversationName = new Date().toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });

    const newConversation = await AgentConversation.create({
      enterpriseUserId: user._id,
      companyId: mongoose.Types.ObjectId.createFromHexString(actualCompanyId),
      chatName: conversationName,
      status: "active",
    });

    const saveConversation = await newConversation.save();
    return createApiResponse({
      success: true,
      error: "Conversation created successfully",
      status: 200,
      data: saveConversation,
    });
  } catch (error) {
    console.error("Error in createChat:", error);
    return createApiResponse({
      success: false,
      error: "Failed to create conversation",
      status: 500,
    });
  }
}

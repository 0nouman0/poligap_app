import AgentConversation from "@/models/agentConversation.model";
import User from "@/models/users.model";
import mongoose from "mongoose";
import { createApiResponse } from "@/lib/apiResponse";
import { NextRequest } from "next/server";

// Helper function to ensure user exists without making HTTP calls
async function ensureUserExists(userId: string) {
  try {
    // Check if user already exists
    let existingUser = await User.findById(userId);
    if (existingUser) {
      return { success: true, data: existingUser };
    }

    // Try finding by userId field
    existingUser = await User.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (existingUser) {
      return { success: true, data: existingUser };
    }

    // Create new user if not found
    const newUser = await User.create({
      _id: new mongoose.Types.ObjectId(userId),
      userId: new mongoose.Types.ObjectId(userId),
      uniqueId: `user_${Date.now()}`,
      email: `user-${userId.slice(-8)}@poligap.com`,
      name: 'Poligap User',
      status: 'ACTIVE',
      country: 'United States',
      dob: '1990-01-01',
      mobile: '+1-555-0123',
      profileImage: '',
      about: 'Welcome to Poligap! This is your profile.',
      banner: {
        image: 'https://images.unsplash.com/photo-1554034483-04fda0d3507b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        color: '#3b82f6',
        type: 'image',
        yOffset: 0
      },
      profileCreatedOn: new Date().toISOString(),
    });

    return { success: true, data: newUser };
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to ensure user exists' };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Ensure database connection
    if (mongoose.connection.readyState !== 1) {
      try {
        await mongoose.connect(process.env.MONGODB_URI as string);
      } catch (dbError) {
        console.error("Database connection failed:", dbError);
        return createApiResponse({
          success: false,
          error: "Database connection failed",
          status: 500,
        });
      }
    }

    const companyId = request.nextUrl.searchParams.get("companyId");
    const userId = request.nextUrl.searchParams.get("userId");

    console.log("get-conversation-list - companyId:", companyId, "userId:", userId);

    // Use fallback values if missing or "undefined"
    const actualUserId = (userId && userId !== "undefined") ? userId : "68da404605eeba8349fc9d10";
    const actualCompanyId = (companyId && companyId !== "") ? companyId : "60f1b2b3c4d5e6f7a8b9c0d1";

    console.log("Using fallback values - companyId:", actualCompanyId, "userId:", actualUserId);

    // Validate that we have proper ObjectId format
    if (!actualUserId || actualUserId === "undefined" || actualUserId.length !== 24) {
      console.log("⚠️ Invalid userId format, returning empty conversation list");
      return createApiResponse({
        status: 200,
        success: true,
        data: [],
      });
    }

    // Ensure user exists using direct database call instead of HTTP fetch
    const ensureUserResult = await ensureUserExists(actualUserId);
    if (!ensureUserResult.success || !ensureUserResult.data) {
      console.log("⚠️ Failed to ensure user exists, returning empty conversation list");
      return createApiResponse({
        status: 200,
        success: true,
        data: [],
      });
    }

    const userDetails = ensureUserResult.data;

    const conversationList = await AgentConversation.find({
      companyId: new mongoose.Types.ObjectId(actualCompanyId),
      enterpriseUserId: userDetails._id,
      status: "active",
    }).sort({ createdAt: -1 });

    if (!conversationList) {
      return createApiResponse({
        success: false,
        error: "Failed to fetch conversation chat",
        status: 404,
      });
    }

    return createApiResponse({
      status: 200,
      success: true,
      data: conversationList,
    });
  } catch (error) {
    console.error("Error in get-conversation-list:", error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch conversations",
      status: 500,
    });
  }
}

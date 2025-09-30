import AgentConversation from "@/models/agentConversation.model";
import User from "@/models/users.model";
import mongoose from "mongoose";
import { createApiResponse } from "@/lib/apiResponse";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
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

    // Ensure user exists first
    const ensureUserResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ensure-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: actualUserId }),
    });

    const ensureUserResult = await ensureUserResponse.json();
    if (!ensureUserResult.success) {
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
    console.error("Error in createChat:", error);
    return createApiResponse({
      success: false,
      error: "Failed to create conversation",
      status: 500,
    });
  }
}

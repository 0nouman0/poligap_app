import { createConversation, getUser, createUser } from '@/lib/supabase/queries';
import { createApiResponse } from "@/lib/apiResponse";
import { NextRequest } from "next/server";
import { requirePermission, Permission } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try {
    // Require permission to create conversations
    await requirePermission(Permission.CONVERSATION_CREATE);
    
    const { userId, companyId } = await request.json();
    console.log("userId and companyId =>", userId, companyId);

    if (!userId) {
      return createApiResponse({
        success: false,
        error: "userId is required",
        status: 400,
      });
    }

    if (!companyId) {
      return createApiResponse({
        success: false,
        error: "companyId is required",
        status: 400,
      });
    }

    // Try to find user in Supabase
    let user = null;
    
    try {
      user = await getUser(userId);
    } catch (error) {
      console.log("User not found, will use provided userId");
    }

    const conversationName = new Date().toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });

    const newConversation = await createConversation({
      enterprise_user_id: userId,
      company_id: companyId,
      chat_name: conversationName,
    });

    return createApiResponse({
      success: true,
      error: "Conversation created successfully",
      status: 200,
      data: newConversation,
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

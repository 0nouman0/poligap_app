import { createClient } from "@/lib/supabase/server";
import { createApiResponse } from "@/lib/apiResponse";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return createApiResponse({
        success: false,
        error: "Unauthorized",
        status: 401,
      });
    }

    const { companyId } = await request.json();
    
    // Validate UUID format (UUID v4 regex)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validCompanyId = companyId && uuidRegex.test(companyId) ? companyId : null;
    
    if (companyId && !validCompanyId) {
      console.warn('Invalid company_id format (not a UUID), setting to null:', companyId);
    }
    
    // Generate conversation name with current time
    const conversationName = new Date().toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });

    // Use Supabase Postgrest API to create conversation
    const { data, error } = await supabase
      .from('agent_conversations')
      .insert({
        chat_name: conversationName,
        user_id: user.id,
        company_id: validCompanyId,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return createApiResponse({
        success: false,
        error: `Failed to create conversation: ${error.message}`,
        status: 500,
      });
    }

    return createApiResponse({
      success: true,
      error: "Conversation created successfully",
      status: 200,
      data: {
        id: data.id,
        chat_name: data.chat_name,
        created_at: data.created_at
      },
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

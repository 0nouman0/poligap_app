import { createClient } from "@/lib/supabase/server";
import { createApiResponse } from "@/lib/apiResponse";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
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

    // Use Supabase Postgrest API to get conversations
    const { data, error } = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return createApiResponse({
        success: false,
        error: `Failed to fetch conversations: ${error.message}`,
        status: 500,
      });
    }

    // Transform Supabase format to match frontend expectations
    const transformedData = (data || []).map((conversation: any) => ({
      _id: conversation.id,
      chatName: conversation.chat_name || 'Untitled Chat',
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at || conversation.created_at,
      userId: conversation.user_id,
      companyId: conversation.company_id,
      agentId: conversation.agent_id,
    }));

    return createApiResponse({
      status: 200,
      success: true,
      data: transformedData,
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

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { queries } from "@/lib/supabase/graphql";
import { createApiResponse } from "@/lib/apiResponse";
import { GraphQLClient } from "graphql-request";

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

    const {
      conversation_id,
      user_query,
      content,
      streamingError,
      tool_calls,
      extra_data,
      images,
      videos,
    } = await request.json();

    if (!conversation_id || !user_query) {
      return createApiResponse({
        success: false,
        error: "Missing required fields",
        status: 400,
      });
    }

    // Get access token for GraphQL
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return createApiResponse({
        success: false,
        error: "No session found",
        status: 401,
      });
    }

    const graphQLClient = new GraphQLClient(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    // Generate a unique message ID
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create new chat message
    const createResult = await graphQLClient.request<any>(queries.createMessage, {
      conversation_id,
      message_id: messageId,
      user_query,
      ai_response: content || '',
      message_type: 'ai',
      tool_calls: tool_calls || [],
      extra_data: extra_data || {},
      images: images || [],
      videos: videos || [],
    });

    const newChat = createResult.insertIntochat_messagesCollection.records[0];

    return createApiResponse({
      success: true,
      error: "Chat created successfully",
      status: 200,
      data: newChat,
    });
  } catch (error) {
    console.error("Error in createChat:", error);
    return createApiResponse({
      success: false,
      error: "Failed to create chat",
      status: 500,
    });
  }
}

import { createClient } from "@/lib/supabase/server";
import { queries } from "@/lib/supabase/graphql";
import { createApiResponse } from "@/lib/apiResponse";
import { NextRequest } from "next/server";
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

    const { companyId } = await request.json();
    
    // Generate conversation name with current time
    const conversationName = new Date().toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });

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

    const result = await graphQLClient.request<any>(queries.createConversation, {
      chat_name: conversationName,
      user_id: user.id,
      company_id: companyId || null,
    });

    const newConversation = result.insertIntoagent_conversationsCollection.records[0];

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

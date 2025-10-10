import { createClient } from "@/lib/supabase/server";
import { queries } from "@/lib/supabase/graphql";
import { createApiResponse } from "@/lib/apiResponse";
import { NextRequest } from "next/server";
import { GraphQLClient } from "graphql-request";

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

    const result = await graphQLClient.request<any>(queries.getConversations, {
      userId: user.id,
    });

    const conversationList = result.agent_conversationsCollection.edges.map((edge: any) => edge.node);

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

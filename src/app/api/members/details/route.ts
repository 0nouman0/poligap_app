import { NextRequest, NextResponse } from "next/server"
import { GraphQLService, extractNode } from "@/lib/graphql-service"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const gqlService = new GraphQLService()
    const user = await gqlService.init()

    const { searchParams } = new URL(request.url)
    const company_id = searchParams.get("company_id")
    const member_user_id = searchParams.get("member_user_id")

    if (!company_id || !member_user_id) {
      return NextResponse.json(
        { error: "company_id and member_user_id are required" },
        { status: 400 }
      )
    }

    // Check if requester is member of company using GraphQL
    const accessResponse: any = await gqlService.query('checkUserAccess', {
      userId: user.id,
      companyId: company_id
    });
    const requestorMembership = extractNode(accessResponse.user_companiesCollection) as { role?: string } | null;

    if (!requestorMembership) {
      return NextResponse.json(
        { error: "You are not a member of this company" },
        { status: 403 }
      )
    }

    // Get member details using GraphQL
    const memberResponse: any = await gqlService.query('checkUserAccess', {
      userId: member_user_id,
      companyId: company_id
    });
    const memberDetails = extractNode(memberResponse.user_companiesCollection) as any;

    if (!memberDetails) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }
    
    // Fetch user profile details
    const userProfileResponse: any = await gqlService.query('getUserDetails', {
      userId: member_user_id
    });
    const userProfile = extractNode(userProfileResponse.profilesCollection);
    
    // Merge member and user details
    if (userProfile) {
      memberDetails.user = userProfile;
    }

    // Get member's activity stats (only if admin)
    let activityStats = null
    if (["company_admin", "super_admin"].includes(requestorMembership?.role || '')) {
      const supabase = await createClient();
      const { data: stats } = await supabase.rpc("get_member_activity_stats", {
        p_user_id: member_user_id,
        p_company_id: company_id,
      }).single()

      activityStats = stats || {
        total_compliance_checks: 0,
        total_contract_reviews: 0,
        total_tasks_created: 0,
        total_tasks_completed: 0,
        last_activity_date: null,
      }
    }

    return NextResponse.json({
      success: true,
      member: memberDetails,
      activity_stats: activityStats,
    })
  } catch (error) {
    console.error("Get member details error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

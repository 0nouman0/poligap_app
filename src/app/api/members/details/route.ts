import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const company_id = searchParams.get("company_id")
    const member_user_id = searchParams.get("member_user_id")

    if (!company_id || !member_user_id) {
      return NextResponse.json(
        { error: "company_id and member_user_id are required" },
        { status: 400 }
      )
    }

    // Check if requester is member of company
    const { data: requestorMembership } = await supabase
      .from("user_companies")
      .select("role")
      .eq("user_id", user.id)
      .eq("company_id", company_id)
      .eq("status", "active")
      .single()

    if (!requestorMembership) {
      return NextResponse.json(
        { error: "You are not a member of this company" },
        { status: 403 }
      )
    }

    // Get member details
    const { data: memberDetails, error: memberError } = await supabase
      .from("user_companies")
      .select(`
        *,
        user:profiles (
          id,
          name,
          email,
          profile_image,
          designation,
          status,
          country,
          mobile,
          about,
          last_active_at,
          created_at
        )
      `)
      .eq("user_id", member_user_id)
      .eq("company_id", company_id)
      .single()

    if (memberError || !memberDetails) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    // Get member's activity stats (only if admin)
    let activityStats = null
    if (["company_admin", "super_admin"].includes(requestorMembership.role)) {
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

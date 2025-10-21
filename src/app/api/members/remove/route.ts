import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { company_id, member_user_id } = body

    if (!company_id || !member_user_id) {
      return NextResponse.json(
        { error: "company_id and member_user_id are required" },
        { status: 400 }
      )
    }

    // Check if requester is admin
    const { data: requestorMembership } = await supabase
      .from("user_companies")
      .select("role")
      .eq("user_id", user.id)
      .eq("company_id", company_id)
      .eq("status", "active")
      .single()

    if (!requestorMembership || !["company_admin", "super_admin"].includes(requestorMembership.role)) {
      return NextResponse.json(
        { error: "Only admins can remove members" },
        { status: 403 }
      )
    }

    // Get member details before removal
    const { data: memberToRemove } = await supabase
      .from("user_companies")
      .select("role, is_primary")
      .eq("user_id", member_user_id)
      .eq("company_id", company_id)
      .single()

    if (!memberToRemove) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    // Prevent removing last admin
    if (["company_admin", "super_admin"].includes(memberToRemove.role)) {
      const { data: admins } = await supabase
        .from("user_companies")
        .select("user_id")
        .eq("company_id", company_id)
        .in("role", ["company_admin", "super_admin"])
        .eq("status", "active")

      if (admins && admins.length === 1) {
        return NextResponse.json(
          { error: "Cannot remove the last admin. Company must have at least one admin." },
          { status: 400 }
        )
      }
    }

    // Update status to removed instead of deleting
    const { error: updateError } = await supabase
      .from("user_companies")
      .update({ status: "removed" })
      .eq("user_id", member_user_id)
      .eq("company_id", company_id)

    if (updateError) {
      console.error("Error removing member:", updateError)
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      )
    }

    // If this was the user's primary company, update their profile
    if (memberToRemove.is_primary) {
      // Find another company for this user
      const { data: otherCompanies } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", member_user_id)
        .eq("status", "active")
        .limit(1)
        .single()

      await supabase
        .from("profiles")
        .update({
          company_id: otherCompanies?.company_id || null,
        })
        .eq("id", member_user_id)
    }

    // Log the action
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      company_id,
      action: "remove_member",
      entity_type: "user_companies",
      entity_id: member_user_id,
      metadata: {
        removed_user_id: member_user_id,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    })
  } catch (error) {
    console.error("Remove member error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

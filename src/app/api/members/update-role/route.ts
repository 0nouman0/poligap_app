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
    const { company_id, member_user_id, new_role } = body

    if (!company_id || !member_user_id || !new_role) {
      return NextResponse.json(
        { error: "company_id, member_user_id, and new_role are required" },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ["super_admin", "company_admin", "member", "viewer"]
    if (!validRoles.includes(new_role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be one of: " + validRoles.join(", ") },
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
        { error: "Only admins can update member roles" },
        { status: 403 }
      )
    }

    // Prevent self-demotion if last admin
    if (user.id === member_user_id && !["company_admin", "super_admin"].includes(new_role)) {
      const { data: admins } = await supabase
        .from("user_companies")
        .select("user_id")
        .eq("company_id", company_id)
        .in("role", ["company_admin", "super_admin"])
        .eq("status", "active")

      if (admins && admins.length === 1) {
        return NextResponse.json(
          { error: "Cannot remove admin role. Company must have at least one admin." },
          { status: 400 }
        )
      }
    }

    // Update member role
    const { error: updateError } = await supabase
      .from("user_companies")
      .update({ role: new_role })
      .eq("user_id", member_user_id)
      .eq("company_id", company_id)

    if (updateError) {
      console.error("Error updating member role:", updateError)
      return NextResponse.json(
        { error: "Failed to update member role" },
        { status: 500 }
      )
    }

    // Log the action
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      company_id,
      action: "update_member_role",
      entity_type: "user_companies",
      entity_id: member_user_id,
      metadata: {
        new_role,
        target_user_id: member_user_id,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Member role updated successfully",
    })
  } catch (error) {
    console.error("Update member role error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

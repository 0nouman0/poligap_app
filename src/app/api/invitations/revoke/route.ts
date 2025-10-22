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
    const { invitation_id } = body

    if (!invitation_id) {
      return NextResponse.json(
        { error: "invitation_id is required" },
        { status: 400 }
      )
    }

    // Get invitation details
    const { data: invitation, error: fetchError } = await supabase
      .from("invitations")
      .select("company_id, status")
      .eq("id", invitation_id)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      )
    }

    // Check if user is admin
    const { data: membership } = await supabase
      .from("user_companies")
      .select("role")
      .eq("user_id", user.id)
      .eq("company_id", invitation.company_id)
      .eq("status", "active")
      .single()

    if (!membership || !["company_admin", "super_admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Only admins can revoke invitations" },
        { status: 403 }
      )
    }

    // Revoke invitation
    const { error: updateError } = await supabase
      .from("invitations")
      .update({ status: "revoked" })
      .eq("id", invitation_id)

    if (updateError) {
      console.error("Error revoking invitation:", updateError)
      return NextResponse.json(
        { error: "Failed to revoke invitation" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Invitation revoked successfully",
    })
  } catch (error) {
    console.error("Revoke invitation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

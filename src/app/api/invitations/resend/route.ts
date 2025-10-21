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
      .select("*, company:companies(name)")
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
        { error: "Only admins can resend invitations" },
        { status: 403 }
      )
    }

    // Check if invitation can be resent
    if (invitation.status === "accepted") {
      return NextResponse.json(
        { error: "Cannot resend an accepted invitation" },
        { status: 400 }
      )
    }

    // Generate new token and extend expiry
    const newToken = crypto.randomUUID()
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { error: updateError } = await supabase
      .from("invitations")
      .update({
        token: newToken,
        status: "sent",
        expires_at: newExpiry,
        sent_at: new Date().toISOString(),
      })
      .eq("id", invitation_id)

    if (updateError) {
      console.error("Error resending invitation:", updateError)
      return NextResponse.json(
        { error: "Failed to resend invitation" },
        { status: 500 }
      )
    }

    // Send invitation email using Supabase Auth
    try {
      const { createClient } = await import("@supabase/supabase-js")
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )

      const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/accept-invitation/${newToken}`
      
      await supabaseAdmin.auth.admin.inviteUserByEmail(
        invitation.email,
        {
          redirectTo: inviteUrl,
          data: {
            invitation_id: invitation.id,
            company_id: invitation.company_id,
            company_name: invitation.company?.name || "the team",
            role: invitation.role,
          },
        }
      )
    } catch (emailError) {
      console.error("Email sending error:", emailError)
    }

    return NextResponse.json({
      success: true,
      message: "Invitation resent successfully",
    })
  } catch (error) {
    console.error("Resend invitation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

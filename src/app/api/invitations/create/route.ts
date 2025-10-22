import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
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
    const { email, role = "member", company_id } = body

    // Validate required fields
    if (!email || !company_id) {
      return NextResponse.json(
        { error: "Email and company_id are required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ["super_admin", "company_admin", "member", "viewer"]
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be one of: " + validRoles.join(", ") },
        { status: 400 }
      )
    }

    // Check if user is admin of the company
    const { data: membership, error: membershipError } = await supabase
      .from("user_companies")
      .select("role")
      .eq("user_id", user.id)
      .eq("company_id", company_id)
      .eq("status", "active")
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "You are not a member of this company" },
        { status: 403 }
      )
    }

    if (!["company_admin", "super_admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Only admins can invite users" },
        { status: 403 }
      )
    }

    // Check if user already exists in this company
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single()

    if (existingUser) {
      // Check if already a member
      const { data: existingMembership } = await supabase
        .from("user_companies")
        .select("id")
        .eq("user_id", existingUser.id)
        .eq("company_id", company_id)
        .single()

      if (existingMembership) {
        return NextResponse.json(
          { error: "User is already a member of this company" },
          { status: 400 }
        )
      }
    }

    // Get company details for email
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", company_id)
      .single()

    // Send invitation email using Supabase Auth
    // Create admin client with service role key
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Use /auth/confirm as redirect - Supabase will add tokens to hash
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const confirmUrl = `${SITE_URL}/auth/confirm`
    
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: confirmUrl,
        data: {
          company_id: company_id,
          company_name: company?.name || "the team",
          role: role,
          email_verified: true,
        },
      }
    )

    if (inviteError) {
      console.error("Error sending invitation email:", inviteError)
      return NextResponse.json(
        { error: `Failed to send invitation: ${inviteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}. They will receive an email to join ${company?.name || 'your team'}.`,
    })
  } catch (error) {
    console.error("Invitation creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

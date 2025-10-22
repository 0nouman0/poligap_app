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
    const status = searchParams.get("status")

    if (!company_id) {
      return NextResponse.json(
        { error: "company_id is required" },
        { status: 400 }
      )
    }

    // Check if user is admin
    const { data: membership } = await supabase
      .from("user_companies")
      .select("role")
      .eq("user_id", user.id)
      .eq("company_id", company_id)
      .eq("status", "active")
      .single()

    if (!membership || !["company_admin", "super_admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Only admins can view invitations" },
        { status: 403 }
      )
    }

    // Build query
    let query = supabase
      .from("invitations")
      .select(`
        *,
        inviter:invited_by (
          id,
          name,
          email,
          profile_image
        )
      `)
      .eq("company_id", company_id)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data: invitations, error } = await query

    if (error) {
      console.error("Error fetching invitations:", error)
      return NextResponse.json(
        { error: "Failed to fetch invitations" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invitations,
    })
  } catch (error) {
    console.error("List invitations error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

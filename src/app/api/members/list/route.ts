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
    const role = searchParams.get("role")
    const status = searchParams.get("status") || "active"

    if (!company_id) {
      return NextResponse.json(
        { error: "company_id is required" },
        { status: 400 }
      )
    }

    // Check if user is member of company
    const { data: membership } = await supabase
      .from("user_companies")
      .select("role")
      .eq("user_id", user.id)
      .eq("company_id", company_id)
      .eq("status", "active")
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this company" },
        { status: 403 }
      )
    }

    // Build query
    let query = supabase
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
          last_active_at
        )
      `)
      .eq("company_id", company_id)
      .eq("status", status)
      .order("is_primary", { ascending: false })
      .order("joined_at", { ascending: false })

    if (role) {
      query = query.eq("role", role)
    }

    const { data: members, error } = await query

    if (error) {
      console.error("Error fetching members:", error)
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      members,
      total: members?.length || 0,
    })
  } catch (error) {
    console.error("List members error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

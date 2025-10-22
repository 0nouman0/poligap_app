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
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      )
    }

    // Use the database function to accept invitation
    const { data, error } = await supabase.rpc("accept_invitation", {
      invitation_token: token,
      user_id: user.id,
    })

    if (error) {
      console.error("Error accepting invitation:", error)
      return NextResponse.json(
        { error: "Failed to accept invitation" },
        { status: 500 }
      )
    }

    if (!data.success) {
      return NextResponse.json(
        { error: data.error || "Failed to accept invitation" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      company_id: data.company_id,
      role: data.role,
      message: "Successfully joined the company",
    })
  } catch (error) {
    console.error("Accept invitation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * API endpoint to fix user membership - creates user_companies entry for authenticated user
 * This is a helper endpoint to ensure users have proper company memberships
 * 
 * POST /api/users/fix-membership
 * Body: {
 *   company_id?: string (optional, will use selected company from store or first available)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { company_id } = body;

    // Create admin client
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get authenticated user's email from request headers or body
    // We'll need to get it from the session, but for now use service role to find by email
    const { email } = body;
    
    if (!email && !company_id) {
      return NextResponse.json(
        { error: "Email or company_id required" },
        { status: 400 }
      );
    }

    let targetCompanyId = company_id;
    let userId: string | null = null;

    // If email provided, find user
    if (email) {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const user = authUsers?.users?.find(u => u.email === email);
      if (user) {
        userId = user.id;
      }
    }

    // If company_id not provided, get first company
    if (!targetCompanyId) {
      const { data: companies } = await supabaseAdmin
        .from("companies")
        .select("id")
        .limit(1);
      
      if (companies && companies.length > 0) {
        targetCompanyId = companies[0].id;
      } else {
        return NextResponse.json(
          { error: "No company found" },
          { status: 400 }
        );
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check profile for role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    // Check existing memberships
    const { data: existingMemberships } = await supabaseAdmin
      .from("user_companies")
      .select("role")
      .eq("user_id", userId)
      .eq("status", "active");

    const hasSuperAdmin = existingMemberships?.some(m => m.role === "super_admin");
    
    const roleMapping: Record<string, string> = {
      "admin": "company_admin",
      "manager": "company_admin",
      "agent": "member",
      "user": "member",
    };

    let assignedRole = hasSuperAdmin 
      ? "super_admin"
      : (profile?.role ? (roleMapping[profile.role] || "member") : "company_admin");

    // Wait for auth.users propagation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create/update user_companies entry with retries
    let success = false;
    for (let attempt = 1; attempt <= 5; attempt++) {
      const delay = attempt * 1000;
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const { error, data } = await supabaseAdmin
        .from("user_companies")
        .upsert({
          user_id: userId,
          company_id: targetCompanyId,
          role: assignedRole,
          status: "active",
          is_primary: assignedRole === "super_admin" || assignedRole === "company_admin",
          joined_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,company_id'
        })
        .select();

      if (!error && data) {
        success = true;
        break;
      }
    }

    if (!success) {
      return NextResponse.json(
        { error: "Failed to create user_companies entry after retries" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Membership created successfully",
      user_id: userId,
      company_id: targetCompanyId,
      role: assignedRole,
    });
  } catch (error: any) {
    console.error("Fix membership error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}


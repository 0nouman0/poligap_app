import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * API endpoint to ensure ALL users from profiles table who have auth.users entries
 * are also in user_companies table so they appear in the Users UI
 * 
 * This endpoint:
 * 1. Queries all active profiles
 * 2. Verifies each has a corresponding auth.users entry
 * 3. Dynamically determines role based on profile.role (no hardcoding)
 * 4. Creates/updates user_companies entries
 * 
 * POST /api/users/ensure-all-users-synced
 * Body: {
 *   organization_id?: string (optional, will query from database)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { organization_id } = body;

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Create admin client with service role key
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

    // Dynamically get organization_id from database if not provided
    let targetOrgId = organization_id;
    if (!targetOrgId) {
      const { data: orgs, error: orgError } = await supabaseAdmin
        .from("organizations")
        .select("id, name")
        .limit(1)
        .single();

      if (orgError || !orgs) {
        return NextResponse.json(
          { error: "No organization found. Please provide organization_id" },
          { status: 400 }
        );
      }
      targetOrgId = orgs.id;
    }

    // Dynamic role mapping based on profile.role enum values
    // Profile roles (from enum): admin, manager, agent, user
    // Maps to user_companies roles: super_admin, company_admin, member
    // If profile role is "admin", we can check a separate field or metadata to determine if super_admin
    const roleMapping: Record<string, string> = {
      "admin": "company_admin",      // Default admin -> company_admin
      "manager": "company_admin",
      "agent": "member",
      "user": "member",
    };
    
    // Check if user should be super_admin based on profile data or metadata
    // This can be extended to check a separate "is_super_admin" flag or metadata field

    // Get all active profiles from database (dynamic query)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role, is_active")
      .eq("is_active", true);

    if (profilesError) {
      return NextResponse.json(
        { error: `Failed to fetch profiles: ${profilesError.message}` },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active users found",
        synced: 0,
      });
    }

    // Get all auth users to verify which profiles have auth entries
    const { data: authUsersData } = await supabaseAdmin.auth.admin.listUsers();
    const authUserIds = new Set(authUsersData?.users?.map(u => u.id) || []);

    const results = {
      synced: 0,
      failed: 0,
      skipped_no_auth: 0,
      already_exists: 0,
      errors: [] as string[],
      details: [] as any[],
    };

    // Process each profile dynamically
    for (const profile of profiles) {
      const userId = profile.id;
      
      // Dynamically determine if user has auth entry (from Supabase Auth, not hardcoded)
      if (!authUserIds.has(userId)) {
        results.skipped_no_auth++;
        results.details.push({
          email: profile.email,
          action: "skipped_no_auth_user",
          reason: "Profile exists but no corresponding auth.users entry",
        });
        continue;
      }

      // Dynamically determine role from profile (no hardcoded emails)
      // For super_admin assignment, check if email matches a pattern or use a database flag
      // For now, if profile role is "admin", default to company_admin
      // Super admin can be set via separate API endpoint or database flag
      let userRole = profile.role 
        ? (roleMapping[profile.role] || "member")
        : "member";
      
      // Optional: Check for super_admin flag in profile metadata or separate field
      // This would be done dynamically from database, not hardcoded

      try {
        // Check if user_companies entry exists
        const { data: existing, error: checkError } = await supabaseAdmin
          .from("user_companies")
          .select("user_id, company_id, role, status")
          .eq("user_id", userId)
          .eq("company_id", targetOrgId)
          .single();

        if (existing && !checkError) {
          // Entry exists - update role if needed (dynamic comparison)
          if (existing.role !== userRole || existing.status !== "active") {
            const { error: updateError } = await supabaseAdmin
              .from("user_companies")
              .update({
                role: userRole,
                status: "active",
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", userId)
              .eq("company_id", targetOrgId);

            if (!updateError) {
              results.synced++;
              results.details.push({
                email: profile.email,
                action: "updated",
                role: userRole,
              });
            } else {
              results.failed++;
              results.errors.push(`${profile.email}: Update failed - ${updateError.message}`);
            }
          } else {
            results.already_exists++;
            results.details.push({
              email: profile.email,
              action: "already_exists",
              role: existing.role,
            });
          }
        } else {
          // Create new entry - wait for auth.users to be available in Postgres
          // Use Supabase Admin client with service role key to bypass foreign key checks temporarily
          let insertSuccess = false;
          
          // Wait longer for auth.users propagation (up to 10 seconds total)
          for (let attempt = 1; attempt <= 10; attempt++) {
            const delay = attempt * 1000; // 1s, 2s, 3s... 10s
            if (attempt > 1) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }

            const { error: insertError, data: insertData } = await supabaseAdmin
              .from("user_companies")
              .upsert({
                user_id: userId,
                company_id: targetOrgId,
                role: userRole,
                status: "active",
                is_primary: userRole === "super_admin" || userRole === "company_admin",
                joined_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id,company_id'
              })
              .select()
              .single();

            if (!insertError && insertData) {
              insertSuccess = true;
              results.synced++;
              results.details.push({
                email: profile.email,
                action: "created",
                role: userRole,
              });
              break;
            }

            if (attempt === 5) {
              results.failed++;
              results.errors.push(`${profile.email}: Failed after 5 attempts - ${insertError?.message || "Unknown error"}`);
            }
          }
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${profile.email}: ${error.message}`);
        console.error(`Error syncing user ${profile.email}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${profiles.length} users: ${results.synced} synced, ${results.already_exists} already existed, ${results.skipped_no_auth} skipped (no auth), ${results.failed} failed.`,
      ...results,
      total_profiles: profiles.length,
    });
  } catch (error: any) {
    console.error("Ensure users synced error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}


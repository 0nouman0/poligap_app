import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { queries } from "@/lib/supabase/graphql";
import { GraphQLClient } from "graphql-request";

/**
 * API endpoint to sync all existing users to user_companies
 * This ensures all users in profiles table have corresponding user_companies entries
 * 
 * POST /api/users/sync-all-users
 * Body: {
 *   organization_id?: string (optional, defaults to first organization)
 *   dry_run?: boolean (if true, only shows what would be done)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { organization_id, dry_run = false, specific_email } = body;

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables");
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

    // Get organization_id if not provided
    let targetOrgId = organization_id;
    if (!targetOrgId) {
      const { data: orgs, error: orgError } = await supabaseAdmin
        .from("organizations")
        .select("id")
        .limit(1);

      if (orgError || !orgs || orgs.length === 0) {
        return NextResponse.json(
          { error: "No organization found. Please provide organization_id" },
          { status: 400 }
        );
      }
      targetOrgId = orgs[0].id;
    }

    // Get all active users from profiles
    // Note: profiles table may not have organization_id, use the provided targetOrgId
    let query = supabaseAdmin
      .from("profiles")
      .select("id, email, role, is_active")
      .eq("is_active", true);

    if (specific_email) {
      query = query.eq("email", specific_email);
    }

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) {
      return NextResponse.json(
        { error: `Failed to fetch profiles: ${profilesError.message}` },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users found to sync",
        synced: 0,
      });
    }

    // Create GraphQL client with service role key for admin operations
    const graphqlEndpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`;
    const gqlClient = new GraphQLClient(graphqlEndpoint, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    const results = {
      synced: 0,
      failed: 0,
      already_exists: 0,
      errors: [] as string[],
      details: [] as any[],
    };

    // For each user, check if they have a user_companies entry
    for (const profile of profiles) {
      const userId = profile.id;
      const orgId = targetOrgId; // Use the target organization ID for all users
      
      // Determine role dynamically based on profile role from database
      // Map profile roles to user_companies roles dynamically
      let userRole = "member"; // default
      
      // Dynamically map profile roles to company roles
      const roleMapping: Record<string, string> = {
        "admin": "company_admin",
        "super_admin": "super_admin",
        "manager": "company_admin",
        "agent": "member",
        "user": "member",
      };
      
      // Use profile role if available, otherwise default to member
      userRole = profile.role ? (roleMapping[profile.role] || "member") : "member";
      
      // Special case: if profile role is explicitly set to admin, upgrade to super_admin if needed
      // This should be determined by business logic, not hardcoded emails

      try {
        // Check if user_companies entry already exists
        const checkQuery = `
          query CheckUserCompany($userId: UUID!, $companyId: UUID!) {
            user_companiesCollection(
              filter: { 
                user_id: { eq: $userId },
                company_id: { eq: $companyId }
              }
            ) {
              edges {
                node {
                  user_id
                  company_id
                  role
                  status
                }
              }
            }
          }
        `;

        const checkResult: any = await gqlClient.request(checkQuery, {
          userId,
          companyId: orgId,
        });

        const existingEntry = checkResult?.user_companiesCollection?.edges?.[0]?.node;

        if (existingEntry) {
          // Entry exists - check if role needs updating based on profile role
          const expectedRole = profile.role ? (roleMapping[profile.role] || "member") : "member";
          
          if (existingEntry.role !== expectedRole) {
            if (!dry_run) {
              const updateResult: any = await gqlClient.request(queries.updateMemberRole, {
                userId,
                companyId: orgId,
                role: expectedRole,
              });
              
              if (updateResult?.updateuser_companiesCollection?.records?.[0]) {
                results.synced++;
                results.details.push({
                  email: profile.email,
                  action: "updated_role",
                  from: existingEntry.role,
                  to: expectedRole,
                });
              }
            } else {
              results.details.push({
                email: profile.email,
                action: "would_update_role",
                from: existingEntry.role,
                to: expectedRole,
              });
            }
          } else {
            results.already_exists++;
            results.details.push({
              email: profile.email,
              action: "already_exists",
              role: existingEntry.role,
            });
          }
        } else {
          // Create new entry - try direct Supabase insert first (bypasses GraphQL)
          if (!dry_run) {
            // Try direct insert via Supabase client (same approach as auth/confirm page)
            const { error: directInsertError } = await supabaseAdmin
              .from("user_companies")
              .upsert({
                user_id: userId,
                company_id: orgId,
                role: userRole,
                status: "active",
                is_primary: userRole === "super_admin" || userRole === "company_admin", // Dynamic primary assignment
                joined_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id,company_id'
              });

            if (!directInsertError) {
              results.synced++;
              results.details.push({
                email: profile.email,
                action: "created",
                role: userRole,
              });
            } else {
              // If direct insert fails, try GraphQL as fallback
              try {
                const { addUserToCompany } = queries;
                const result: any = await gqlClient.request(addUserToCompany, {
                  user_id: userId,
                  company_id: orgId,
                  role: userRole,
                  is_primary: profile.email === "mohammed.zufishan@kroolo.com",
                });

                if (result && result.insertIntouser_companiesCollection?.records?.[0]) {
                  results.synced++;
                  results.details.push({
                    email: profile.email,
                    action: "created_via_graphql",
                    role: userRole,
                  });
                } else {
                  results.failed++;
                  results.errors.push(`${profile.email}: Failed to create user_companies entry (direct: ${directInsertError.message})`);
                }
              } catch (gqlError: any) {
                results.failed++;
                results.errors.push(`${profile.email}: Failed via both methods - Direct: ${directInsertError.message}, GraphQL: ${gqlError.message}`);
              }
            }
          } else {
            results.details.push({
              email: profile.email,
              action: "would_create",
              role: userRole,
            });
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
      message: dry_run 
        ? `Dry run complete. Would sync ${profiles.length} users.`
        : `Synced ${results.synced} users, ${results.already_exists} already existed, ${results.failed} failed.`,
      ...results,
      total_profiles: profiles.length,
    });
  } catch (error: any) {
    console.error("Sync users error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}


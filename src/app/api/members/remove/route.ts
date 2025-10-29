import { NextRequest, NextResponse } from "next/server"
import { GraphQLService, extractNodes } from "@/lib/graphql-service"
import { GraphQLClient } from "graphql-request"
import { queries } from "@/lib/supabase/graphql"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    message: "Remove member endpoint is active",
    timestamp: new Date().toISOString()
  });
}

// Delete user endpoint
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const gqlService = new GraphQLService()
    const user = await gqlService.init()

    const body = await request.json()
    const { company_id, member_user_id } = body

    if (!company_id || !member_user_id) {
      return NextResponse.json(
        { error: "company_id and member_user_id are required" },
        { status: 400 }
      )
    }

    // Check if requester is admin using GraphQL (with user token)
    const accessResponse: any = await gqlService.query('checkUserAccess', {
      userId: user.id,
      companyId: company_id
    });
    const requestorMembership: any = extractNodes(accessResponse.user_companiesCollection)[0];

    if (!requestorMembership || !["company_admin", "super_admin"].includes(requestorMembership.role)) {
      return NextResponse.json(
        { error: "Only admins can remove members" },
        { status: 403 }
      )
    }

    // Get member details before removal using GraphQL (without status filter)
    const memberResponse: any = await gqlService.query('getMemberDetailsWithoutStatus', {
      userId: member_user_id,
      companyId: company_id
    });
    const memberToRemove: any = extractNodes(memberResponse.user_companiesCollection)[0];

    if (!memberToRemove) {
      return NextResponse.json(
        { error: "Member not found in this company" },
        { status: 404 }
      )
    }
    
    // Don't allow removing already inactive members
    if (memberToRemove.status !== "active") {
      return NextResponse.json(
        { error: "Member is already inactive" },
        { status: 400 }
      )
    }

    // Prevent removing last admin
    if (["company_admin", "super_admin"].includes(memberToRemove.role)) {
      const allMembersResponse: any = await gqlService.query('getCompanyMembers', {
        companyId: company_id,
        status: "active"
      });
      const allMembers = extractNodes(allMembersResponse.user_companiesCollection);
      const admins = allMembers.filter((m: any) => ["company_admin", "super_admin"].includes(m.role));

      if (admins && admins.length === 1) {
        return NextResponse.json(
          { error: "Cannot remove the last admin. Company must have at least one admin." },
          { status: 400 }
        )
      }
    }

    // Initialize Supabase Admin for deletion operations
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Server configuration error - missing environment variables" },
        { status: 500 }
      );
    }

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

    // DELETE USER COMPLETELY FROM SUPABASE DATABASE
    console.log("🗑️ Deleting user completely from database:", {
      userId: member_user_id,
      companyId: company_id
    });

    // Step 1: Delete from user_companies using Supabase Admin (more reliable than GraphQL)
    try {
      const { error: userCompanyError } = await supabaseAdmin
        .from("user_companies")
        .delete()
        .eq("user_id", member_user_id)
        .eq("company_id", company_id);

      if (userCompanyError) {
        console.error("❌ Error deleting from user_companies:", userCompanyError);
      } else {
        console.log("✅ Deleted from user_companies");
      }
    } catch (deleteError: any) {
      console.error("❌ Error deleting from user_companies:", deleteError);
      // Continue with other deletions even if this fails
    }

    // Step 2: Delete from profiles table
    try {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", member_user_id);

      if (profileError) {
        console.error("❌ Error deleting profile:", profileError);
      } else {
        console.log("✅ Deleted from profiles");
      }
    } catch (profileError: any) {
      console.error("❌ Error deleting profile:", profileError);
    }

    // Step 3: Delete from auth.users (this is the main user account)
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(member_user_id);
      
      if (authError) {
        console.error("❌ Error deleting auth user:", authError);
        // Don't fail completely - user_companies and profile might already be deleted
      } else {
        console.log("✅ Deleted from auth.users");
      }
    } catch (authError: any) {
      console.error("❌ Error deleting auth user:", authError);
    }

    // Log the action using GraphQL (non-blocking)
    try {
      await gqlService.query('createAuditLog', {
        user_id: user.id,
        company_id,
        action: "delete_member",
        entity_type: "user",
        entity_id: member_user_id,
        metadata: {
          deleted_user_id: member_user_id,
          deleted_email: member_user_id, // You might want to get the email from member details
        },
      });
      console.log("✅ Audit log created");
    } catch (auditError) {
      console.warn("⚠️ Failed to create audit log (non-critical):", auditError);
      // Don't fail the request if audit log creation fails
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully from database",
    })
  } catch (error) {
    console.error("Remove member error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { GraphQLService, extractNodes } from "@/lib/graphql-service"

export async function POST(request: NextRequest) {
  try {
    const gqlService = new GraphQLService()
    const user = await gqlService.init()

    const body = await request.json()
    const { company_id, member_user_id, new_role } = body

    if (!company_id || !member_user_id || !new_role) {
      return NextResponse.json(
        { error: "company_id, member_user_id, and new_role are required" },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ["super_admin", "company_admin", "member", "viewer"]
    if (!validRoles.includes(new_role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be one of: " + validRoles.join(", ") },
        { status: 400 }
      )
    }

    // Check if requester is admin using GraphQL
    const accessResponse: any = await gqlService.query('checkUserAccess', {
      userId: user.id,
      companyId: company_id
    });
    const requestorMembership = extractNodes(accessResponse.user_companiesCollection)[0] as { role?: string } | undefined;

    if (!requestorMembership || !["company_admin", "super_admin"].includes(requestorMembership.role || '')) {
      return NextResponse.json(
        { error: "Only admins can update member roles" },
        { status: 403 }
      )
    }

    // Prevent self-demotion if last admin
    if (user.id === member_user_id && !["company_admin", "super_admin"].includes(new_role)) {
      const allMembersResponse: any = await gqlService.query('getCompanyMembers', {
        companyId: company_id,
        status: "active"
      });
      const allMembers = extractNodes(allMembersResponse.user_companiesCollection);
      const admins = allMembers.filter((m: any) => ["company_admin", "super_admin"].includes(m.role));

      if (admins && admins.length === 1) {
        return NextResponse.json(
          { error: "Cannot remove admin role. Company must have at least one admin." },
          { status: 400 }
        )
      }
    }

    // Update member role using GraphQL
    try {
      await gqlService.query('updateMemberRole', {
        userId: member_user_id,
        companyId: company_id,
        role: new_role
      });
    } catch (updateError) {
      console.error("Error updating member role:", updateError)
      return NextResponse.json(
        { error: "Failed to update member role" },
        { status: 500 }
      )
    }

    // Log the action using GraphQL
    await gqlService.query('createAuditLog', {
      user_id: user.id,
      company_id,
      action: "update_member_role",
      entity_type: "user_companies",
      entity_id: member_user_id,
      metadata: {
        new_role,
        target_user_id: member_user_id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Member role updated successfully",
    })
  } catch (error) {
    console.error("Update member role error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

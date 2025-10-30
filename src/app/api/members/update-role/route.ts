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
    const requestorMembership: any = extractNodes(accessResponse.user_companiesCollection)[0];

    if (!requestorMembership || !["company_admin", "super_admin"].includes(requestorMembership.role)) {
      return NextResponse.json(
        { error: "Only admins can update member roles" },
        { status: 403 }
      )
    }

    // Disallow ANY self role change (promotion or demotion)
    if (user.id === member_user_id) {
      return NextResponse.json(
        { error: "You cannot modify your own role" },
        { status: 403 }
      )
    }

    // Fetch target member's current role
    const targetResp: any = await gqlService.query('getMemberDetailsWithoutStatus', {
      userId: member_user_id,
      companyId: company_id,
    });
    const targetMembership: any = extractNodes(targetResp.user_companiesCollection)[0];

    // Admins cannot modify Super Admins
    if (requestorMembership.role === "company_admin" && targetMembership?.role === "super_admin") {
      return NextResponse.json(
        { error: "Admins cannot modify a Super Admin's role" },
        { status: 403 }
      )
    }

    // Only Super Admin can promote someone to Super Admin
    if (new_role === "super_admin" && requestorMembership.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only Super Admins can promote to Super Admin" },
        { status: 403 }
      )
    }

    // Prevent self-demotion if last admin (extra safety for direct calls)
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
    } catch (updateError: any) {
      // Surface GraphQL error details to help debug 500s
      const graphQLErrors = updateError?.response?.errors;
      const firstMessage = Array.isArray(graphQLErrors) && graphQLErrors[0]?.message
        ? graphQLErrors[0].message
        : undefined;
      console.error("Error updating member role:", {
        message: updateError?.message,
        firstMessage,
        variables: { company_id, member_user_id, new_role },
      });
      return NextResponse.json(
        { error: firstMessage || "Failed to update member role" },
        { status: 400 }
      )
    }

    // Log the action using GraphQL (non-blocking)
    try {
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
    } catch (auditError) {
      console.warn("Failed to create audit log (non-critical)", auditError);
      // Do not fail the request due to audit logging issues
    }

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

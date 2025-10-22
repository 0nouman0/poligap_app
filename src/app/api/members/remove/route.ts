import { NextRequest, NextResponse } from "next/server"
import { GraphQLService, extractNodes } from "@/lib/graphql-service"

export async function POST(request: NextRequest) {
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

    // Check if requester is admin using GraphQL
    const accessResponse: any = await gqlService.query('checkUserAccess', {
      userId: user.id,
      companyId: company_id
    });
    const requestorMembership = extractNodes(accessResponse.user_companiesCollection)[0];

    if (!requestorMembership || !["company_admin", "super_admin"].includes(requestorMembership.role)) {
      return NextResponse.json(
        { error: "Only admins can remove members" },
        { status: 403 }
      )
    }

    // Get member details before removal using GraphQL
    const memberResponse: any = await gqlService.query('checkUserAccess', {
      userId: member_user_id,
      companyId: company_id
    });
    const memberToRemove = extractNodes(memberResponse.user_companiesCollection)[0];

    if (!memberToRemove) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
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

    // Remove member using GraphQL mutation
    try {
      await gqlService.query('removeMember', {
        userId: member_user_id,
        companyId: company_id
      });
    } catch (updateError) {
      console.error("Error removing member:", updateError)
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      )
    }

    // If this was the user's primary company, update their profile
    if (memberToRemove.is_primary) {
      // Find another company for this user
      const userCompaniesResponse: any = await gqlService.query('getUserCompanies', {
        userId: member_user_id
      });
      const otherCompanies = extractNodes(userCompaniesResponse.user_companiesCollection);
      const otherCompany = otherCompanies.find((c: any) => c.company_id !== company_id);

      await gqlService.query('updateProfile', {
        id: member_user_id,
        company_name: otherCompany?.company?.name || null
      });
    }

    // Log the action using GraphQL
    await gqlService.query('createAuditLog', {
      user_id: user.id,
      company_id,
      action: "remove_member",
      entity_type: "user_companies",
      entity_id: member_user_id,
      metadata: {
        removed_user_id: member_user_id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    })
  } catch (error) {
    console.error("Remove member error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { GraphQLService, extractNodes, extractNode } from "@/lib/graphql-service"

export async function POST(request: NextRequest) {
  try {
    const gqlService = new GraphQLService()
    const user = await gqlService.init()

    const body = await request.json()
    const { invitation_id } = body

    if (!invitation_id) {
      return NextResponse.json(
        { error: "invitation_id is required" },
        { status: 400 }
      )
    }

    // Get invitation details using GraphQL
    const invitationResponse: any = await gqlService.query('getCompanyInvitations', {
      companyId: invitation_id // This might need adjustment based on schema
    });
    const allInvitations = extractNodes(invitationResponse.invitationsCollection);
    const invitation: any = allInvitations.find((inv: any) => inv.id === invitation_id);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      )
    }

    // Check if user is admin using GraphQL
    const accessResponse: any = await gqlService.query('checkUserAccess', {
      userId: user.id,
      companyId: invitation.company_id
    });
    const membership: any = extractNode(accessResponse.user_companiesCollection);

    if (!membership || !["company_admin", "super_admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Only admins can revoke invitations" },
        { status: 403 }
      )
    }

    // Revoke invitation using GraphQL
    try {
      await gqlService.query('revokeInvitation', { id: invitation_id });
    } catch (updateError) {
      console.error("Error revoking invitation:", updateError)
      return NextResponse.json(
        { error: "Failed to revoke invitation" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Invitation revoked successfully",
    })
  } catch (error) {
    console.error("Revoke invitation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

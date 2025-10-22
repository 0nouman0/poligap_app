import { NextRequest, NextResponse } from "next/server"
import { GraphQLService, extractNodes, extractNode } from "@/lib/graphql-service"

export async function GET(request: NextRequest) {
  try {
    const gqlService = new GraphQLService()
    const user = await gqlService.init()

    const { searchParams } = new URL(request.url)
    const company_id = searchParams.get("company_id")
    const status = searchParams.get("status")

    if (!company_id) {
      return NextResponse.json(
        { error: "company_id is required" },
        { status: 400 }
      )
    }

    // Check if user is admin using GraphQL
    const accessResponse: any = await gqlService.query('checkUserAccess', {
      userId: user.id,
      companyId: company_id
    });
    const membership = extractNode(accessResponse.user_companiesCollection);

    if (!membership || !["company_admin", "super_admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Only admins can view invitations" },
        { status: 403 }
      )
    }

    // Fetch invitations using GraphQL
    const response: any = await gqlService.query('getCompanyInvitations', {
      companyId: company_id,
      status: status || undefined
    });
    
    const invitations = extractNodes(response.invitationsCollection);

    return NextResponse.json({
      success: true,
      invitations,
    })
  } catch (error) {
    console.error("List invitations error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { GraphQLService, extractNodes } from "@/lib/graphql-service"

export async function GET(request: NextRequest) {
  try {
    const gqlService = new GraphQLService()
    const user = await gqlService.init()

    const { searchParams } = new URL(request.url)
    const company_id = searchParams.get("company_id")
    const status = searchParams.get("status") || "active"

    if (!company_id) {
      return NextResponse.json(
        { error: "company_id is required" },
        { status: 400 }
      )
    }

    // Check if user is member of company using GraphQL
    const accessResponse: any = await gqlService.query('checkUserAccess', {
      userId: user.id,
      companyId: company_id
    });
    const membership = extractNodes(accessResponse.user_companiesCollection)[0];

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this company" },
        { status: 403 }
      )
    }

    // Fetch company members using GraphQL
    const response: any = await gqlService.query('getCompanyMembers', {
      companyId: company_id,
      status
    });
    
    let members = extractNodes(response.user_companiesCollection);

    // Note: GraphQL query doesn't support role filtering yet
    // We'll filter client-side for now
    const role = searchParams.get("role");
    if (role) {
      members = members.filter((m: any) => m.role === role);
    }

    return NextResponse.json({
      success: true,
      members,
      total: members?.length || 0,
    })
  } catch (error) {
    console.error("List members error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

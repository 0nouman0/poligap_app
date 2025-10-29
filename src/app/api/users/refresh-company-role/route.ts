import { NextRequest, NextResponse } from "next/server";
import { GraphQLService } from "@/lib/graphql-service";

/**
 * API endpoint to refresh/update the user's company role
 * This will re-fetch the user's companies from GraphQL and update the store
 * 
 * GET /api/users/refresh-company-role
 */
export async function GET(request: NextRequest) {
  try {
    const gqlService = new GraphQLService();
    const user = await gqlService.init();

    // Fetch user's companies via GraphQL
    const response: any = await gqlService.query('getUserCompanies', {
      userId: user.id
    });
    
    const companies = response?.user_companiesCollection?.edges || [];
    
    const mapped = companies.map((e: any) => ({
      companyId: e.node.company?.id,
      name: e.node.company?.name,
      role: e.node.role || "member",
    })).filter((c: any) => c.companyId && c.name);

    return NextResponse.json({
      success: true,
      companies: mapped,
      total: mapped.length,
    });
  } catch (error: any) {
    console.error("Refresh company role error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}


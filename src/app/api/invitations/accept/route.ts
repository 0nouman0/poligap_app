import { NextRequest, NextResponse } from "next/server"
import { GraphQLService } from "@/lib/graphql-service"

export async function POST(request: NextRequest) {
  try {
    const gqlService = new GraphQLService()
    const user = await gqlService.init()

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      )
    }

    // Accept invitation using GraphQL mutations
    try {
      // Update invitation status
      const invitationResponse: any = await gqlService.query('acceptInvitation', {
        token,
        userId: user.id
      });
      
      const invitation = invitationResponse.updateinvitationsCollection.records[0];
      
      if (!invitation) {
        return NextResponse.json(
          { error: "Invalid or expired invitation" },
          { status: 400 }
        );
      }
      
      // Add user to company
      await gqlService.query('addUserToCompany', {
        user_id: user.id,
        company_id: invitation.company_id,
        role: invitation.role,
        is_primary: false
      });
      
      return NextResponse.json({
        success: true,
        company_id: invitation.company_id,
        role: invitation.role,
        message: "Successfully joined the company",
      });
    } catch (error) {
      console.error("Error accepting invitation:", error)
      return NextResponse.json(
        { error: "Failed to accept invitation" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Accept invitation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

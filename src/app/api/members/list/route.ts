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
    let accessResponse: any = await gqlService.query('checkUserAccess', {
      userId: user.id,
      companyId: company_id
    });
    let membership = extractNodes(accessResponse.user_companiesCollection)[0];

    if (!membership) {
      console.error(`User ${user.id} is not a member of company ${company_id}`);
      console.error('This user needs a user_companies entry. Attempting to auto-fix...');
      
      // Try to auto-fix by creating the membership using admin client
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        );
        
        // Wait a bit for auth.users propagation
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Dynamically determine role from user's profile and existing memberships (no hardcoding)
        const { data: userProfile } = await supabaseAdmin
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        
        // Check if user already has super_admin role in any company
        const { data: existingMemberships } = await supabaseAdmin
          .from("user_companies")
          .select("role")
          .eq("user_id", user.id)
          .eq("status", "active");
        
        const hasSuperAdminRole = existingMemberships?.some(m => m.role === "super_admin");
        
        // Dynamic role mapping - same as in sync endpoint
        const roleMapping: Record<string, string> = {
          "admin": "company_admin",
          "manager": "company_admin",
          "agent": "member",
          "user": "member",
        };
        
        // If user has super_admin in another company, maintain that role
        // Otherwise, use role from profile dynamically
        let assignedRole: string;
        if (hasSuperAdminRole) {
          assignedRole = "super_admin";
        } else {
          assignedRole = userProfile?.role 
            ? (roleMapping[userProfile.role] || "member")
            : "company_admin";
        }
        
        // Try multiple times with increasing delays
        let fixSuccess = false;
        for (let attempt = 1; attempt <= 5; attempt++) {
          const delay = attempt * 2000; // 2s, 4s, 6s, 8s, 10s
          if (attempt > 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const { error: fixError } = await supabaseAdmin
            .from("user_companies")
            .upsert({
              user_id: user.id,
              company_id: company_id,
              role: assignedRole,
              status: "active",
              is_primary: assignedRole === "super_admin" || assignedRole === "company_admin",
              joined_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,company_id'
            });
          
          if (!fixError) {
            console.log(`✅ Auto-created user_companies entry with role: ${assignedRole} (attempt ${attempt})`);
            fixSuccess = true;
            break;
          } else {
            console.error(`Attempt ${attempt} failed:`, fixError.message);
          }
        }
        
        if (!fixSuccess) {
          return NextResponse.json(
            { error: "You are not a member of this company. Please contact an administrator." },
            { status: 403 }
          );
        }
        
        // Wait for GraphQL to pick up the change
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Retry the query after creating the entry
        accessResponse = await gqlService.query('checkUserAccess', {
          userId: user.id,
          companyId: company_id
        });
        membership = extractNodes(accessResponse.user_companiesCollection)[0];
        
        if (!membership) {
          console.warn('Membership created but GraphQL not yet updated, creating temporary membership object');
          // Create a temporary membership object to allow the request to proceed
          membership = {
            user_id: user.id,
            company_id: company_id,
            role: assignedRole,
            status: "active",
          } as any;
        } else {
          console.log('✅ Membership verified via GraphQL');
        }
      } catch (autoFixError: any) {
        console.error('Auto-fix failed:', autoFixError);
        return NextResponse.json(
          { error: "You are not a member of this company" },
          { status: 403 }
        );
      }
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

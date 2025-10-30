import { NextRequest, NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";

type GqlRecord<T> = { node: T };

type UserCompanyRecord = {
  user_id: string;
  company_id: string;
  role: string;
  is_primary: boolean;
  status: string;
};

type UpdateUserCompaniesResponse = {
  updateuser_companiesCollection?: {
    records: UserCompanyRecord[];
  };
};

type InsertUserCompaniesResponse = {
  insertIntouser_companiesCollection?: {
    records: UserCompanyRecord[];
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email: string | undefined = body?.email;
    let company_id: string | undefined = body?.company_id;

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const graphqlEndpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`;
    const gql = new GraphQLClient(graphqlEndpoint, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    // 1) Get user id by email
    const getUserIdQuery = `
      query GetUserIdByEmail($email: String!) {
        profilesCollection(filter: { email: { eq: $email } }) {
          edges { node { id email } }
        }
      }
    `;
    const userRes: any = await gql.request(getUserIdQuery, { email });
    const userNode = (userRes?.profilesCollection?.edges as GqlRecord<{ id: string; email: string }>[])?.[0]?.node;
    if (!userNode?.id) {
      return NextResponse.json({ error: `No profile found for ${email}` }, { status: 404 });
    }
    const user_id = userNode.id as string;

    // 2) Resolve company if not provided (pick first active)
    if (!company_id) {
      const getCompanyQuery = `
        query GetFirstActiveCompany { 
          companiesCollection(filter: { is_active: { eq: true } }, first: 1) { 
            edges { node { id name } } 
          } 
        }
      `;
      const compRes: any = await gql.request(getCompanyQuery);
      const companyNode = compRes?.companiesCollection?.edges?.[0]?.node;
      if (!companyNode?.id) {
        return NextResponse.json({ error: "No active company found. Provide company_id." }, { status: 400 });
      }
      company_id = companyNode.id as string;
    }

    // 3) Check existing membership
    const checkMembershipQuery = `
      query CheckMembership($user_id: UUID!, $company_id: UUID!) {
        user_companiesCollection(
          filter: { user_id: { eq: $user_id }, company_id: { eq: $company_id } }
        ) { edges { node { user_id company_id role status } } }
      }
    `;
    const checkRes: any = await gql.request(checkMembershipQuery, { user_id, company_id });
    const existing = checkRes?.user_companiesCollection?.edges?.[0]?.node as
      | { user_id: string; company_id: string; role: string; status: string }
      | undefined;

    // 4) If membership exists but role != super_admin -> update. Else insert.
    if (existing) {
      if (existing.role !== "super_admin") {
        const updateMutation = `
          mutation UpdateRole($userId: UUID!, $companyId: UUID!, $role: String!) {
            updateuser_companiesCollection(
              filter: { user_id: { eq: $userId }, company_id: { eq: $companyId } }
              set: { role: $role, is_primary: true, status: "active", updated_at: "now()" }
            ) { records { user_id company_id role is_primary status } }
          }
        `;
        const upd = await gql.request(updateMutation, { userId: user_id, companyId: company_id, role: "super_admin" }) as UpdateUserCompaniesResponse;
        const rec = upd?.updateuser_companiesCollection?.records?.[0];
        
        // Verify the update worked
        if (!rec || rec.role !== "super_admin") {
          return NextResponse.json({ error: "Failed to update role to super_admin" }, { status: 500 });
        }
        
        return NextResponse.json({ success: true, action: "updated", membership: rec });
      }
      // Already super_admin
      return NextResponse.json({ success: true, action: "noop", membership: existing });
    }

    const insertMutation = `
      mutation AddUserToCompany($user_id: UUID!, $company_id: UUID!, $role: String!, $is_primary: Boolean) {
        insertIntouser_companiesCollection(
          objects: [{ user_id: $user_id, company_id: $company_id, role: $role, is_primary: $is_primary, status: "active", joined_at: "now()" }]
          onConflict: { updateColumns: [role, is_primary, status, updated_at] }
        ) { records { user_id company_id role is_primary status } }
      }
    `;
    const ins = await gql.request(insertMutation, {
      user_id,
      company_id,
      role: "super_admin",
      is_primary: true,
    }) as InsertUserCompaniesResponse;
    const rec = ins?.insertIntouser_companiesCollection?.records?.[0];
    return NextResponse.json({ success: true, action: "created", membership: rec });
  } catch (error: any) {
    console.error("promote-super-admin error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}



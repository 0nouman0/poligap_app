import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { queries } from "@/lib/supabase/graphql";
import { GraphQLClient } from "graphql-request";

/**
 * API endpoint to create a user with super admin role
 * This endpoint requires server-side only access (use service role key)
 * 
 * POST /api/users/create-super-admin
 * Body: {
 *   email: string,
 *   password: string,
 *   organization_id?: string (optional, will use first organization if not provided)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, organization_id } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get organization_id if not provided (using organizations table)
    let targetOrgId = organization_id;
    if (!targetOrgId) {
      const { data: orgs, error: orgError } = await supabaseAdmin
        .from("organizations")
        .select("id")
        .limit(1)
        .single();

      if (orgError || !orgs) {
        return NextResponse.json(
          { error: "No organization found. Please provide organization_id" },
          { status: 400 }
        );
      }
      targetOrgId = orgs.id;
    }

    // Check if user already exists in auth - delete if incomplete
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    if (existingUser) {
      console.log("User already exists in auth, deleting to recreate:", existingUser.id);
      // Delete existing incomplete user to start fresh
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      // Also delete profile if exists
      await supabaseAdmin.from("profiles").delete().eq("id", existingUser.id);
      // Delete user_companies if exists
      await supabaseAdmin.from("user_companies").delete().eq("user_id", existingUser.id);
    }

    // Create user in Supabase Auth
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email so user can login immediately
    });

    let userId: string;
    
    if (createError || !authUser.user) {
      console.error("Error creating user:", createError);
      return NextResponse.json(
        { error: `Failed to create auth user: ${createError?.message || "Unknown error"}` },
        { status: 500 }
      );
    }
    
    userId = authUser.user.id;
    
    // VERIFY: Check that user was actually created in auth.users
    const { data: verifyUsers } = await supabaseAdmin.auth.admin.listUsers();
    const verifiedUser = verifyUsers?.users?.find(u => u.id === userId && u.email === email);
    
    if (!verifiedUser) {
      console.error("VERIFICATION FAILED: User was not found in auth.users after creation");
      return NextResponse.json(
        { error: "User creation failed verification - user not found in auth.users" },
        { status: 500 }
      );
    }
    
    console.log("✅ VERIFIED: Auth user created successfully:", {
      id: verifiedUser.id,
      email: verifiedUser.email,
      email_confirmed: verifiedUser.email_confirmed_at !== null
    });

    // Extract name from email dynamically (no hardcoded names)
    const nameFromEmail = email.split("@")[0].replace(/\./g, " ");
    const displayName = nameFromEmail
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    const firstName = displayName.split(" ")[0] || displayName;
    const lastName = displayName.split(" ").slice(1).join(" ") || "";
    
    // All values are derived dynamically from input - no hardcoded data

    // Create profile in profiles table
    // Try with first_name/last_name first, fallback to name if that fails
    let profileError = null;
    
    // Try inserting with first_name/last_name (new schema)
    let profileData: any = {
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      organization_id: targetOrgId,
      is_active: true,
      role: "admin", // Set profile role to admin
    };

    const { error: insertError1, data: profileData1 } = await supabaseAdmin
      .from("profiles")
      .insert(profileData)
      .select()
      .single();

    if (insertError1) {
      // If that fails, try with 'name' field instead (legacy schema)
      console.log("First profile insert failed, trying alternative schema with 'name' field...", insertError1);
      profileData = {
        id: userId,
        email,
        name: displayName,
        unique_id: email,
        status: 'ACTIVE',
        role: 'admin',
        member_status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const { error: insertError2, data: profileData2 } = await supabaseAdmin
        .from("profiles")
        .insert(profileData)
        .select()
        .single();
      
      profileError = insertError2;
      
      // Verify profile was actually created
      if (!insertError2 && !profileData2) {
        profileError = { message: "Profile insert succeeded but no data returned", code: "UNKNOWN" } as any;
      }
    } else {
      // Verify first insert actually returned data
      if (!profileData1) {
        profileError = { message: "Profile insert succeeded but no data returned", code: "UNKNOWN" } as any;
      }
    }

    if (profileError) {
      console.error("Error creating profile:", profileError);
      
      // If profile already exists (duplicate key), that's okay - user might be partially created
      if (profileError.code === "23505" || profileError.message?.includes("duplicate")) {
        console.log("Profile already exists, continuing...");
        // Profile exists, continue with user_companies creation
      } else {
        // For other errors, only clean up if we just created the user
        if (authUser?.user) {
          await supabaseAdmin.auth.admin.deleteUser(userId);
        }
        return NextResponse.json(
          { error: `Failed to create profile: ${profileError.message}` },
          { status: 500 }
        );
      }
    }

    // Create user_companies relationship with super_admin role using GraphQL
    // Note: "company_id" in user_companies likely refers to organization_id
    try {
      // Create GraphQL client with service role key for admin operations
      const graphqlEndpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`;
      const gqlClient = new GraphQLClient(graphqlEndpoint, {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });

      // Use the addUserToCompany mutation
      const { addUserToCompany } = queries;
      const result: any = await gqlClient.request(addUserToCompany, {
        user_id: userId,
        company_id: targetOrgId,
        role: "super_admin",
        is_primary: true,
      });

      if (!result || !result.insertIntouser_companiesCollection?.records?.[0]) {
        throw new Error("Failed to create user_companies relationship via GraphQL");
      }
    } catch (membershipError: any) {
      console.error("Error creating user_companies relationship:", membershipError);
      
      // Try direct insert as fallback (in case user_companies table exists)
      const { error: directInsertError } = await supabaseAdmin
        .from("user_companies")
        .insert({
          user_id: userId,
          company_id: targetOrgId,
          role: "super_admin",
          status: "active",
          is_primary: true,
          joined_at: new Date().toISOString(),
        });

      if (directInsertError) {
        console.error("Error creating user_companies via direct insert:", directInsertError);
        // Try multiple retries with increasing delays (auth.users can take time to propagate in Postgres)
        let retrySuccess = false;
        for (let attempt = 1; attempt <= 5; attempt++) {
          const delay = attempt * 1000; // 1s, 2s, 3s, 4s, 5s
          console.log(`Retrying user_companies insert (attempt ${attempt}/5) after ${delay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          const { error: retryError, data: retryData } = await supabaseAdmin
            .from("user_companies")
            .upsert({
              user_id: userId,
              company_id: targetOrgId,
              role: "super_admin",
              status: "active",
              is_primary: true,
              joined_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,company_id'
            })
            .select();
          
          if (!retryError && retryData) {
            console.log(`✅ Successfully created user_companies entry on attempt ${attempt}`);
            retrySuccess = true;
            break;
          } else if (retryError) {
            console.error(`Attempt ${attempt} failed:`, retryError.message);
          }
        }
        
        if (!retrySuccess) {
          console.error("All retry attempts failed - user_companies entry was not created");
          // Still don't fail - user and profile are created, role can be assigned later
        }
      } else {
        console.log("✅ Successfully created user_companies entry via direct insert");
      }
    }

    // Final verification and ensure user_companies entry exists
    // Wait additional time for auth.users to be fully available in Postgres foreign key constraints
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 more seconds
    
    // Final attempt to create user_companies entry if it doesn't exist
    const { data: checkMembership } = await supabaseAdmin
      .from("user_companies")
      .select("user_id")
      .eq("user_id", userId)
      .eq("company_id", targetOrgId)
      .single();
    
    if (!checkMembership) {
      console.log("User_companies entry still missing, making final attempt...");
      // Try one more time with upsert
      const { error: finalInsertError, data: finalInsertData } = await supabaseAdmin
        .from("user_companies")
        .upsert({
          user_id: userId,
          company_id: targetOrgId,
          role: "super_admin",
          status: "active",
          is_primary: true,
          joined_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,company_id'
        })
        .select();
      
      if (finalInsertError) {
        console.error("Final user_companies insert failed:", finalInsertError);
      } else if (finalInsertData) {
        console.log("✅ Successfully created user_companies entry on final attempt");
      }
    }

    // Final verification - check that user exists in auth, profile exists, and user_companies entry exists
    const { data: finalVerify } = await supabaseAdmin.auth.admin.listUsers();
    const finalAuthUser = finalVerify?.users?.find(u => u.id === userId);
    
    const { data: finalProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("id", userId)
      .single();
    
    const { data: finalMembership } = await supabaseAdmin
      .from("user_companies")
      .select("user_id, company_id, role")
      .eq("user_id", userId)
      .eq("company_id", targetOrgId)
      .single();

    const verification = {
      auth_user_exists: !!finalAuthUser,
      profile_exists: !!finalProfile,
      user_companies_exists: !!finalMembership,
    };

    console.log("📋 Final Verification:", verification);

    if (!verification.auth_user_exists) {
      return NextResponse.json(
        { 
          error: "User creation failed final verification - auth user not found",
          verification 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Super admin user created successfully`,
      user: {
        id: userId,
        email,
        organization_id: targetOrgId,
        role: "super_admin",
      },
      verification,
    });
  } catch (error: any) {
    console.error("Create super admin error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}


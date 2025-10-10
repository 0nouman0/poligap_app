import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createGraphQLClient, queries } from '@/lib/supabase/graphql';

// GET - Fetch user profile
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || user.id;

    // Get session for access token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      return NextResponse.json(
        { success: false, error: 'No session found' },
        { status: 401 }
      );
    }

    const graphqlClient = createGraphQLClient(session.access_token);
    let profile;
    
    // Check if userId is a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
    
    if (isUUID) {
      // If it's a UUID, query by id
      const data: any = await graphqlClient.request(queries.getProfile, {
        id: userId,
      });
      profile = data?.profilesCollection?.edges?.[0]?.node;
    } else {
      // If it's not a UUID, the incoming value is likely a MongoDB _id used on the client.
      // Our Supabase `profiles.unique_id` stores the user's email (see create-profile route),
      // so we should query by the authenticated user's email instead of the provided value.
      const query = `
        query GetProfileByUniqueId($uniqueId: String!) {
          profilesCollection(filter: { unique_id: { eq: $uniqueId } }) {
            edges {
              node {
                id
                email
                name
                unique_id
                country
                dob
                mobile
                profile_image
                banner
                about
                status
                designation
                role
                member_status
                company_name
                reporting_manager
                created_by
                created_at
                updated_at
              }
            }
          }
        }
      `;
      
      const data: any = await graphqlClient.request(query, {
        uniqueId: user.email,
      });
      profile = data?.profilesCollection?.edges?.[0]?.node;

      // Fallback: if no profile found by unique_id, use authenticated user's UUID
      if (!profile) {
        const byUuid: any = await graphqlClient.request(queries.getProfile, {
          id: user.id,
        });
        profile = byUuid?.profilesCollection?.edges?.[0]?.node;
      }
    }

    if (!profile) {
      // Auto-create a minimal profile using service role (bypasses RLS)
      try {
        const serviceClient = createGraphQLClient(process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const createMutation = `
          mutation CreateProfile($id: UUID!, $email: String!, $name: String!) {
            insertIntoprofilesCollection(
              objects: [{
                id: $id
                email: $email
                name: $name
                unique_id: $email
                status: "ACTIVE"
              }]
            ) {
              records { id email name created_at }
            }
          }
        `;
        const defaultName =
          (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) ||
          (user.email ? user.email.split('@')[0] : 'User');
        await serviceClient.request(createMutation, {
          id: user.id,
          email: user.email,
          name: defaultName,
        });

        // Re-fetch after creation
        const byUuid: any = await graphqlClient.request(queries.getProfile, {
          id: user.id,
        });
        profile = byUuid?.profilesCollection?.edges?.[0]?.node;
      } catch (e) {
        console.error('Auto-create profile failed:', e);
      }

      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Profile not found' },
          { status: 404 }
        );
      }
    }

    // Transform to match expected format
    const profileData = {
      _id: profile.id,
      userId: profile.id,
      name: profile.name,
      email: profile.email,
      mobile: profile.mobile || '',
      dob: profile.dob || '',
      country: profile.country || '',
      designation: profile.designation || '',
      about: profile.about || '',
      profile_image: profile.profile_image || '',
      profileImage: profile.profile_image || '',
      banner: profile.banner || { image: '', color: '', type: '', yOffset: 0 },
      company_name: profile.company_name || '',
      companyName: profile.company_name || '',
      status: profile.status || 'ACTIVE',
      role: profile.role || 'USER',
      member_status: profile.member_status || 'ACTIVE',
      memberStatus: profile.member_status || 'ACTIVE',
      reporting_manager: profile.reporting_manager || null,
      reportingManager: profile.reporting_manager || null,
      created_by: profile.created_by || null,
      createdBy: profile.created_by || null,
      created_at: profile.created_at,
      createdAt: profile.created_at,
      updated_at: profile.updated_at,
      updatedAt: profile.updated_at,
      profile_created_on: profile.profile_created_on,
      profileCreatedOn: profile.profile_created_on,
    };

    const response = NextResponse.json({
      success: true,
      data: profileData,
    });

    // Add caching headers
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    
    return response;

  } catch (error: any) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, ...updates } = body;

    const targetUserId = userId || user.id;

    // Get session for access token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      return NextResponse.json(
        { success: false, error: 'No session found' },
        { status: 401 }
      );
    }

    // Prepare updates (map camelCase to snake_case)
    const profileUpdates: any = {};
    
    if (updates.name) profileUpdates.name = updates.name;
    if (updates.mobile) profileUpdates.mobile = updates.mobile;
    if (updates.dob) profileUpdates.dob = updates.dob;
    if (updates.country) profileUpdates.country = updates.country;
    if (updates.designation) profileUpdates.designation = updates.designation;
    if (updates.about) profileUpdates.about = updates.about;
    if (updates.profileImage || updates.profile_image) {
      profileUpdates.profile_image = updates.profileImage || updates.profile_image;
    }
    if (updates.banner) profileUpdates.banner = updates.banner;
    if (updates.companyName || updates.company_name) {
      profileUpdates.company_name = updates.companyName || updates.company_name;
    }
    if (updates.status) profileUpdates.status = updates.status;
    if (updates.role) profileUpdates.role = updates.role;

    const graphqlClient = createGraphQLClient(session.access_token);
    const data: any = await graphqlClient.request(queries.updateProfile, {
      id: targetUserId,
      ...profileUpdates,
    });

    const updatedProfile = data?.updateprofilesCollection?.records?.[0];

    if (!updatedProfile) {
      return NextResponse.json(
        { success: false, error: 'Profile update failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedProfile,
    });

  } catch (error: any) {
    console.error('Profile UPDATE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

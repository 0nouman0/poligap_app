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

    // Fetch profile using GraphQL
    const graphqlClient = createGraphQLClient(session.access_token);
    const data: any = await graphqlClient.request(queries.getProfile, {
      id: userId,
    });

    const profile = data?.profilesCollection?.edges?.[0]?.node;

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
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

import { NextRequest, NextResponse } from 'next/server';
import { GraphQLService, extractNode } from '@/lib/graphql-service';

// GET - Fetch user profile
export async function GET(req: NextRequest) {
  try {
    const gqlService = new GraphQLService();
    const user = await gqlService.init();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || user.id;
    console.log('Fetching profile for userId:', userId);

    // Fetch profile using GraphQL
    const profileResponse: any = await gqlService.query('getProfile', { id: userId });
    const profile: any = extractNode(profileResponse.profilesCollection);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Transform to match expected format (camelCase for frontend)
    const profileData = {
      _id: profile.id,
      userId: profile.id,
      uniqueId: profile.id,
      name: profile.name || '',
      email: profile.email || '',
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
      created_at: profile.created_at || new Date().toISOString(),
      createdAt: profile.created_at || new Date().toISOString(),
      updated_at: profile.updated_at || new Date().toISOString(),
      updatedAt: profile.updated_at || new Date().toISOString(),
      profile_created_on: profile.profile_created_on || profile.created_at || new Date().toISOString(),
      profileCreatedOn: profile.profile_created_on || profile.created_at || new Date().toISOString(),
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
    const gqlService = new GraphQLService();
    const user = await gqlService.init();

    const body = await req.json();
    const { userId, ...updates } = body;

    const targetUserId = userId || user.id;

    // Prepare GraphQL variables (map camelCase to snake_case)
    const variables: any = {
      id: targetUserId,
    };
    
    // Basic fields
    if (updates.name !== undefined) variables.name = updates.name;
    if (updates.mobile !== undefined) variables.mobile = updates.mobile;
    if (updates.dob !== undefined) variables.dob = updates.dob;
    if (updates.country !== undefined) variables.country = updates.country;
    if (updates.designation !== undefined) variables.designation = updates.designation;
    if (updates.about !== undefined) variables.about = updates.about;
    
    // Image fields
    if (updates.profileImage !== undefined || updates.profile_image !== undefined) {
      variables.profile_image = updates.profileImage || updates.profile_image;
    }
    if (updates.banner !== undefined) {
      variables.banner = updates.banner;
    }
    
    // Company field
    if (updates.companyName !== undefined || updates.company_name !== undefined) {
      variables.company_name = updates.companyName || updates.company_name;
    }

    // Update profile using GraphQL
    const updateResponse: any = await gqlService.query('updateProfile', variables);
    const updatedProfile = updateResponse.updateprofilesCollection.records[0];

    if (!updatedProfile) {
      return NextResponse.json(
        { success: false, error: 'Profile update failed - no data returned' },
        { status: 500 }
      );
    }

    // Transform to match expected format (camelCase for frontend)
    const transformedProfile = {
      _id: updatedProfile.id,
      userId: updatedProfile.id,
      uniqueId: updatedProfile.id,
      name: updatedProfile.name || '',
      email: updatedProfile.email || '',
      mobile: updatedProfile.mobile || '',
      dob: updatedProfile.dob || '',
      country: updatedProfile.country || '',
      designation: updatedProfile.designation || '',
      about: updatedProfile.about || '',
      profile_image: updatedProfile.profile_image || '',
      profileImage: updatedProfile.profile_image || '',
      banner: updatedProfile.banner || { image: '', color: '', type: '', yOffset: 0 },
      company_name: updatedProfile.company_name || '',
      companyName: updatedProfile.company_name || '',
      status: updatedProfile.status || 'ACTIVE',
      role: updatedProfile.role || 'USER',
      member_status: updatedProfile.member_status || 'ACTIVE',
      memberStatus: updatedProfile.member_status || 'ACTIVE',
      reporting_manager: updatedProfile.reporting_manager || null,
      reportingManager: updatedProfile.reporting_manager || null,
      created_by: updatedProfile.created_by || null,
      createdBy: updatedProfile.created_by || null,
      created_at: updatedProfile.created_at || new Date().toISOString(),
      createdAt: updatedProfile.created_at || new Date().toISOString(),
      updated_at: updatedProfile.updated_at || new Date().toISOString(),
      updatedAt: updatedProfile.updated_at || new Date().toISOString(),
      profile_created_on: updatedProfile.profile_created_on || updatedProfile.created_at || new Date().toISOString(),
      profileCreatedOn: updatedProfile.profile_created_on || updatedProfile.created_at || new Date().toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      data: transformedProfile,
    });

    // Add cache-busting headers for immediate refresh
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error: any) {
    console.error('Profile UPDATE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

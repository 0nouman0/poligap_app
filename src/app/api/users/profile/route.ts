import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch user profile
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error in profile route:', authError);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || user.id;
    console.log('Fetching profile for userId:', userId);

    // Fetch profile directly from Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Supabase query error:', profileError);
      return NextResponse.json(
        { success: false, error: `Database error: ${profileError.message}`, details: profileError },
        { status: 500 }
      );
    }

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

    // Prepare updates (map camelCase to snake_case)
    const profileUpdates: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (updates.name !== undefined) profileUpdates.name = updates.name;
    if (updates.mobile !== undefined) profileUpdates.mobile = updates.mobile;
    if (updates.dob !== undefined) profileUpdates.dob = updates.dob;
    if (updates.country !== undefined) profileUpdates.country = updates.country;
    if (updates.designation !== undefined) profileUpdates.designation = updates.designation;
    if (updates.about !== undefined) profileUpdates.about = updates.about;
    if (updates.profileImage !== undefined || updates.profile_image !== undefined) {
      profileUpdates.profile_image = updates.profileImage || updates.profile_image;
    }
    if (updates.banner !== undefined) profileUpdates.banner = updates.banner;
    if (updates.companyName !== undefined || updates.company_name !== undefined) {
      profileUpdates.company_name = updates.companyName || updates.company_name;
    }
    if (updates.status !== undefined) profileUpdates.status = updates.status;
    if (updates.role !== undefined) profileUpdates.role = updates.role;

    // Update profile directly in Supabase
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', targetUserId)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { success: false, error: `Update failed: ${updateError.message}`, details: updateError },
        { status: 500 }
      );
    }

    if (!updatedProfile) {
      return NextResponse.json(
        { success: false, error: 'Profile update failed - no data returned' },
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

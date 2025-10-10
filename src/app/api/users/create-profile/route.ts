import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { id, email, name } = await request.json();

    if (!id || !email || !name) {
      console.error('Missing required fields:', { id: !!id, email: !!email, name: !!name });
      return NextResponse.json(
        { error: 'Missing required fields: id, email, name' },
        { status: 400 }
      );
    }

    // Use service role key to create profile (bypasses RLS)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log('Creating profile for user:', { id, email, name });

    // Create profile directly in Supabase
    const { data: profile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id,
        email,
        name,
        unique_id: email,
        status: 'ACTIVE',
        role: 'USER',
        member_status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      
      // Check if profile already exists
      if (insertError.code === '23505') { // Unique violation
        console.log('Profile already exists, fetching existing profile');
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        
        if (fetchError) {
          console.error('Failed to fetch existing profile:', fetchError);
          return NextResponse.json(
            { error: 'Profile already exists but could not be fetched' },
            { status: 409 }
          );
        }
        
        return NextResponse.json({
          success: true,
          data: existingProfile,
          message: 'Profile already exists',
        });
      }
      
      return NextResponse.json(
        { error: `Database error: ${insertError.message}`, details: insertError },
        { status: 500 }
      );
    }

    if (!profile) {
      console.error('No profile returned after insert');
      return NextResponse.json(
        { error: 'Failed to create profile - no data returned' },
        { status: 500 }
      );
    }

    console.log('Profile created successfully:', profile.id);

    return NextResponse.json({
      success: true,
      data: profile,
    });

  } catch (error: any) {
    console.error('Profile creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create profile' },
      { status: 500 }
    );
  }
}

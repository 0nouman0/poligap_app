import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Resend the confirmation email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      console.error('Resend verification error:', error);
      
      // Handle specific error cases
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { success: false, error: 'Too many requests. Please wait a minute before trying again.' },
          { status: 429 }
        );
      }
      
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'Email address not found. Please sign up first.' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: false, error: error.message || 'Failed to resend verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    });

  } catch (error: any) {
    console.error('Resend verification API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

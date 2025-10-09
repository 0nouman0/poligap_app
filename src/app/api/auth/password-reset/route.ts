import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { applyRateLimit, RateLimits } from '@/lib/rate-limit';

const resetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting - 3 attempts per 15 minutes
    const rateLimitResult = await applyRateLimit(req, RateLimits.PASSWORD_RESET);
    if (rateLimitResult) return rateLimitResult;
    
    const body = await req.json();
    
    // Validate input
    const validation = resetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: validation.error.errors[0].message,
      }, { status: 400 });
    }
    
    const { email } = validation.data;
    const supabase = createClient();
    
    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    });
    
    if (error) {
      // Don't reveal if email exists or not (security best practice)
      console.error('Password reset error:', error);
    }
    
    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
    }, { status: 500 });
  }
}

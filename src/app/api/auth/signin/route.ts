import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { createAuditLog } from '@/lib/rbac';
import { applyRateLimit, RateLimits } from '@/lib/rate-limit';

// Validation schema
const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting - 5 attempts per 15 minutes
    const rateLimitResult = await applyRateLimit(req, RateLimits.AUTH_STRICT);
    if (rateLimitResult) return rateLimitResult;
    
    const body = await req.json();
    
    // Validate input
    const validation = signInSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      );
    }
    
    const { email, password } = validation.data;
    const supabase = createClient();
    
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });
    
    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }
    
    if (!data.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed',
        },
        { status: 401 }
      );
    }
    
    // Get user's company membership and role
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('company_id, role, status')
      .eq('user_id', data.user.id)
      .eq('status', 'ACTIVE')
      .single();
    
    if (memberError || !member) {
      return NextResponse.json(
        {
          success: false,
          error: 'User is not associated with any company',
        },
        { status: 403 }
      );
    }
    
    if (member.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: 'User account is inactive',
        },
        { status: 403 }
      );
    }
    
    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('name, email, user_id')
      .eq('id', data.user.id)
      .single();
    
    // Create audit log
    try {
      await supabase.from('audit_logs').insert({
        user_id: data.user.id,
        company_id: member.company_id,
        action: 'USER_SIGNIN',
        entity_type: 'auth',
        metadata: {
          email: data.user.email,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
      // Don't fail the signin if audit logging fails
    }
    
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: profile?.name || '',
          userId: profile?.user_id || data.user.id,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
        membership: {
          company_id: member.company_id,
          role: member.role,
          status: member.status,
        },
      },
      message: 'Signed in successfully',
    });
  } catch (error) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

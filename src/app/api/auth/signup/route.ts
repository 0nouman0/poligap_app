import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { applyRateLimit, RateLimits } from '@/lib/rate-limit';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(200),
});

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting - 3 attempts per hour
    const rateLimitResult = await applyRateLimit(req, RateLimits.SIGNUP_STRICT);
    if (rateLimitResult) return rateLimitResult;
    
    const body = await req.json();
    
    // Validate input
    const validation = signUpSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: validation.error.errors[0].message,
      }, { status: 400 });
    }
    
    const { email, password, name, companyName } = validation.data;
    const supabase = createClient();
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          name,
          company_name: companyName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });
    
    if (authError) {
      return NextResponse.json({
        success: false,
        error: authError.message,
      }, { status: 400 });
    }
    
    if (!authData.user) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create user',
      }, { status: 500 });
    }
    
    const userId = authData.user.id;
    
    // Create company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        company_id: `company_${Date.now()}`,
        company_name: companyName,
        domain: email.split('@')[1],
      })
      .select()
      .single();
    
    if (companyError) {
      console.error('Company creation error:', companyError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create company',
      }, { status: 500 });
    }
    
    // Create user profile
    const { error: profileError } = await supabase.from('users').insert({
      id: userId,
      user_id: `user_${Date.now()}`,
      email: email.toLowerCase(),
      name,
      unique_id: email.toLowerCase(),
      status: 'ACTIVE',
    });
    
    if (profileError) {
      console.error('Profile creation error:', profileError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create user profile',
      }, { status: 500 });
    }
    
    // Create membership (as owner)
    const { error: memberError } = await supabase.from('members').insert({
      company_id: company.id,
      user_id: userId,
      role: 'owner',
      status: 'ACTIVE',
    });
    
    if (memberError) {
      console.error('Membership creation error:', memberError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create membership',
      }, { status: 500 });
    }
    
    // Create audit log
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        company_id: company.id,
        action: 'USER_SIGNUP',
        entity_type: 'auth',
        metadata: {
          email: email.toLowerCase(),
          name,
          company_name: companyName,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
      // Don't fail the signup if audit logging fails
    }
    
    return NextResponse.json({
      success: true,
      data: {
        user: { id: userId, email: email.toLowerCase(), name },
        company: { id: company.id, name: companyName },
      },
      message: 'Account created successfully. Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Sign up error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: validation.error.errors[0].message,
      }, { status: 400 });
    }
    
    const { password } = validation.data;
    const supabase = createClient();
    
    // Update password
    const { data: { user }, error } = await supabase.auth.updateUser({
      password,
    });
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 400 });
    }
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 });
    }
    
    // Create audit log
    try {
      const { data: member } = await supabase
        .from('members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .single();
      
      if (member) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          company_id: member.company_id,
          action: 'PASSWORD_UPDATE',
          entity_type: 'auth',
          metadata: {
            email: user.email,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (auditError) {
      console.error('Audit log error:', auditError);
      // Don't fail the update if audit logging fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
    }, { status: 500 });
  }
}

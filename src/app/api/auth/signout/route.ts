import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get user before signing out for audit log
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Create audit log before signout
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
            action: 'USER_SIGNOUT',
            entity_type: 'auth',
            metadata: {
              email: user.email,
              timestamp: new Date().toISOString(),
            },
          });
        }
      } catch (auditError) {
        console.error('Audit log error:', auditError);
        // Don't fail the signout if audit logging fails
      }
    }
    
    // Sign out
    await supabase.auth.signOut();
    
    return NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    });
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
    }, { status: 500 });
  }
}

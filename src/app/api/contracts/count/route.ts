import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Returns count of contract reviews for current user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ count: 0 });

    // Count by analysis method or compliance_standard
    const { count, error } = await supabase
      .from('document_analysis')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .or("compliance_standard.eq.Contract Review,metrics->>analysisMethod.eq.contract-review");

    if (error) {
      console.error('contracts/count error:', error);
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (e) {
    console.error('contracts/count unexpected error:', e);
    return NextResponse.json({ count: 0 });
  }
}

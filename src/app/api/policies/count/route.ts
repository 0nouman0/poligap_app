import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Returns count of generated policies for current user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ count: 0 });

    const { count, error } = await supabase
      .from('document_analysis')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .or("metrics->>analysisMethod.eq.policy-analysis,compliance_standard.eq.Policy");

    if (error) {
      console.error('policies/count error:', error);
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (e) {
    console.error('policies/count unexpected error:', e);
    return NextResponse.json({ count: 0 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Returns recent contract review activities for the current user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json([]);

    const { data, error } = await supabase
      .from('document_analysis')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('contracts/recent error:', error);
      return NextResponse.json([]);
    }

    const activities = (data || [])
      .filter((row: any) => {
        const std = (row.compliance_standard || '').toLowerCase();
        const method = (row.metrics?.analysisMethod || '').toLowerCase();
        return std.includes('contract') || method.includes('contract-review');
      })
      .slice(0, 10)
      .map((row: any) => ({
        id: row.id,
        type: 'contract',
        title: row.title || 'Contract Review',
        description: row.metrics?.riskAssessment?.factors?.[0] || 'Contract review completed',
        status: 'completed',
        timestamp: row.created_at,
        fileName: row.title,
      }));

    return NextResponse.json(activities);
  } catch (e) {
    console.error('contracts/recent unexpected error:', e);
    return NextResponse.json([]);
  }
}

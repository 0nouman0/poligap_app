import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Returns recent compliance analysis activities for the current user
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
      console.error('compliance/recent error:', error);
      return NextResponse.json([]);
    }

    const activities = (data || [])
      .filter((row: any) => {
        const std = row.compliance_standard?.toLowerCase?.() || '';
        const method = (row.metrics?.analysisMethod || '').toLowerCase();
        return method.includes('policy') || std.includes('hipaa') || std.includes('gdpr') || std.includes('iso') || std.includes('compliance');
      })
      .slice(0, 10)
      .map((row: any) => ({
        id: row.id,
        type: 'compliance',
        title: row.title || 'Compliance Analysis',
        description: row.metrics?.summary?.recommendedActions?.[0] || 'Compliance analysis completed',
        status: (row.metrics?.standardsAnalysis?.[0]?.status === 'compliant') ? 'completed' : 'in_progress',
        timestamp: row.created_at,
        fileName: row.title,
      }));

    return NextResponse.json(activities);
  } catch (e) {
    console.error('compliance/recent unexpected error:', e);
    return NextResponse.json([]);
  }
}

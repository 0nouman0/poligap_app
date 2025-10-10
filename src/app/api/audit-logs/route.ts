import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createGraphQLClient } from '@/lib/supabase/graphql';

// This API uses document_analysis table to store compliance analysis history
// (originally named audit_logs in MongoDB)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const standards = searchParams.get('standards')?.split(',') || [];
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Use Supabase Postgrest API directly (simpler than GraphQL for this)
    const supabase = await createClient();
    
    let query = supabase
      .from('document_analysis')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by standards if provided (stored in metrics->standards)
    if (standards.length > 0) {
      // Since standards is in the metrics JSONB field, we need to filter differently
      query = query.containedBy('metrics', { standards });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch audit logs' },
        { status: 500 }
      );
    }

    // Transform Supabase data to match expected format
    const logs = (data || []).map((doc: any) => ({
      _id: doc.id,
      id: doc.id,
      fileName: doc.title || 'Untitled',
      standards: doc.metrics?.standards || [],
      score: doc.score || 0,
      status: doc.metrics?.status || 'unknown',
      gapsCount: doc.metrics?.gapsCount || 0,
      analysisDate: doc.created_at,
      fileSize: doc.metrics?.fileSize || 0,
      analysisMethod: doc.metrics?.analysisMethod,
      userId: doc.user_id,
      sessionId: doc.metrics?.sessionId,
      snapshot: doc.metrics?.snapshot || {}
    }));

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fileName,
      standards,
      score,
      status,
      gapsCount,
      fileSize,
      analysisMethod,
      userId,
      sessionId,
      snapshot
    } = body;

    if (!fileName || !standards || score === undefined || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use Supabase Postgrest API to insert into document_analysis
    const supabase = await createClient();

    // Store all analysis data in metrics JSONB field
    const metrics = {
      standards,
      status,
      gapsCount: gapsCount || 0,
      fileSize: fileSize || 0,
      analysisMethod,
      sessionId,
      snapshot
    };

    const { data, error } = await supabase
      .from('document_analysis')
      .insert({
        user_id: userId,
        title: fileName,
        compliance_standard: standards[0] || 'general', // Use first standard as primary
        score: score,
        metrics
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create audit log' },
        { status: 500 }
      );
    }

    // Transform response to match expected format
    const log = {
      _id: data.id,
      id: data.id,
      fileName: data.title,
      standards,
      score: data.score,
      status,
      gapsCount: gapsCount || 0,
      analysisDate: data.created_at,
      fileSize: fileSize || 0,
      analysisMethod,
      userId: data.user_id,
      sessionId,
      snapshot
    };

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create audit log' },
      { status: 500 }
    );
  }
}

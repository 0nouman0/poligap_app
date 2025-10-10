import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// This API uses document_analysis table to store compliance analysis history
// (originally named audit_logs in MongoDB)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const standards = searchParams.get('standards')?.split(',').filter(s => s.trim()) || [];
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId');

    console.log('📖 GET /api/audit-logs - userId:', userId, 'standards:', standards);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Use Supabase Postgrest API directly
    const supabase = await createClient();
    
    const query = supabase
      .from('document_analysis')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Note: We cannot filter by JSONB array contents directly with Postgrest
    // Instead, we'll filter in JavaScript after fetching
    const { data, error } = await query;

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { success: false, error: `Failed to fetch audit logs: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`📨 Found ${data?.length || 0} document_analysis records`);

    // Transform and filter Supabase data
    let logs = (data || []).map((doc: any) => ({
      _id: doc.id,
      id: doc.id,
      fileName: doc.metrics?.fileName || doc.title || 'Untitled',
      standards: doc.metrics?.standards || [doc.compliance_standard],
      score: doc.score || 0,
      status: doc.metrics?.status || 'unknown',
      gapsCount: doc.metrics?.gapsCount || 0,
      analysisDate: doc.created_at,
      fileSize: doc.metrics?.fileSize || 0,
      analysisMethod: doc.metrics?.analysisMethod,
      userId: doc.user_id,
      sessionId: doc.metrics?.sessionId || doc.document_id,
      templateId: doc.metrics?.templateId, // Include templateId if exists
      templateName: doc.metrics?.templateName, // Include templateName if exists
      action: doc.metrics?.action,
      snapshot: doc.metrics?.snapshot || {}
    }));

    // Filter by standards if provided (client-side filtering)
    if (standards.length > 0) {
      logs = logs.filter((log: any) => {
        const logStandards = log.standards || [];
        // Check if any of the requested standards are in the log's standards
        return standards.some(std => logStandards.includes(std));
      });
    }

    console.log(`✅ Returning ${logs.length} audit logs after filtering`);

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('❌ Error fetching audit logs:', error);
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

    console.log('💾 POST /api/audit-logs - Saving audit log:', { fileName, standards, userId });

    if (!fileName || !standards || score === undefined || !status) {
      console.error('❌ Missing required fields:', { fileName: !!fileName, standards: !!standards, score, status });
      return NextResponse.json(
        { success: false, error: 'Missing required fields (fileName, standards, score, status)' },
        { status: 400 }
      );
    }

    if (!userId) {
      console.error('❌ Missing userId');
      return NextResponse.json(
        { success: false, error: 'userId is required' },
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

    // Generate a unique document_id based on fileName and timestamp
    const documentId = `${fileName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

    console.log('📝 Inserting into document_analysis:', { userId, documentId, title: fileName });

    const { data, error } = await supabase
      .from('document_analysis')
      .insert({
        user_id: userId,
        document_id: documentId,
        title: fileName,
        compliance_standard: standards[0] || 'general', // Use first standard as primary
        score: score,
        metrics
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      return NextResponse.json(
        { success: false, error: `Failed to create audit log: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Document analysis saved successfully:', data.id);

    // Also save to audit_logs table for general audit tracking
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'compliance_analysis',
        entity_type: 'document',
        entity_id: fileName,
        metadata: {
          document_analysis_id: data.id,
          file_name: fileName,
          file_size: fileSize || 0,
          standards,
          score,
          status,
          gaps_count: gapsCount || 0,
          analysis_date: new Date().toISOString(),
          analysis_method: analysisMethod,
          snapshot
        }
      });
      console.log('✅ Audit log entry created');
    } catch (auditError) {
      console.error('⚠️ Failed to create audit_logs entry (non-critical):', auditError);
      // Don't fail the main request if audit log fails
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
    console.error('❌ Error creating audit log:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create audit log' },
      { status: 500 }
    );
  }
}

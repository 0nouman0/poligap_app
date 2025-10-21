import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    console.log('📥 POST /api/template-audit-logs - Starting request');
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fileName, standards, score, status, gapsCount, fileSize, analysisMethod, userId, snapshot, templateId, templateName, action } = body;

    // Validate userId
    if (!userId) {
      console.error('❌ userId is required');
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    // Save to document_analysis table (template contract analysis)
    const { data: analysisRecord, error: insertError } = await supabase
      .from('document_analysis')
      .insert({
        user_id: userId,
        document_id: `template_${templateId || Date.now()}`,
        title: `${templateName || standards?.[0] || 'Template'} Analysis - ${fileName}`,
        compliance_standard: standards?.[0] || templateName || 'Contract Review',
        score: score || 0,
        metrics: {
          fileName,
          standards,
          status,
          gapsCount,
          fileSize,
          analysisMethod: analysisMethod || 'template-review',
          templateId,
          templateName,
          action: action || 'analyzed',
          snapshot,
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save template audit log', 
        details: insertError.message 
      }, { status: 500 });
    }

    console.log('✅ Template audit log saved:', analysisRecord?.id);
    
    // Transform to audit log format for frontend
    const log = {
      _id: analysisRecord.id,
      id: analysisRecord.id,
      fileName: fileName,
      standards: standards || [templateName || 'Contract Review'],
      score: score || 0,
      status: status || 'partial',
      gapsCount: gapsCount || 0,
      analysisDate: analysisRecord.created_at,
      fileSize: fileSize || 0,
      analysisMethod: analysisMethod || 'template-review',
      userId: userId,
      sessionId: analysisRecord.document_id,
      templateId: templateId, // Include templateId for filtering
      templateName: templateName, // Include templateName for display
      action: action || 'analyzed',
      snapshot: snapshot || {}
    };
    
    return NextResponse.json({ 
      success: true, 
      id: analysisRecord?.id,
      log: log,
      message: 'Template audit log saved successfully' 
    });
  } catch (e) {
    console.error('❌ Template audit logs error:', e);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    console.log('📥 GET /api/template-audit-logs - Starting request');
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      console.error('❌ userId is required');
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    // Fetch template audit logs
    const { data: logs, error: fetchError } = await supabase
      .from('document_analysis')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch template audit logs', 
        details: fetchError.message 
      }, { status: 500 });
    }

    // Filter for template-related logs (analysisMethod = 'template-review')
    const templateLogs = (logs || [])
      .filter(log => {
        const metrics = log.metrics as any;
        return metrics?.analysisMethod === 'template-review';
      })
      .map((log: any) => ({
        _id: log.id,
        id: log.id,
        fileName: log.metrics?.fileName || log.title || 'Untitled',
        standards: log.metrics?.standards || [log.compliance_standard],
        score: log.score || 0,
        status: log.metrics?.status || 'unknown',
        gapsCount: log.metrics?.gapsCount || 0,
        analysisDate: log.created_at,
        fileSize: log.metrics?.fileSize || 0,
        analysisMethod: log.metrics?.analysisMethod || 'template-review',
        userId: log.user_id,
        sessionId: log.document_id,
        templateId: log.metrics?.templateId, // Include templateId for filtering
        templateName: log.metrics?.templateName, // Include templateName
        action: log.metrics?.action || 'analyzed',
        snapshot: log.metrics?.snapshot || {}
      }));

    console.log('✅ Retrieved template audit logs:', templateLogs.length);
    
    return NextResponse.json({ 
      success: true, 
      logs: templateLogs 
    });
  } catch (e) {
    console.error('❌ Template audit logs error:', e);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 500 });
  }
}

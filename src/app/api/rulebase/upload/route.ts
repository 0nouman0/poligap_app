import { NextResponse } from 'next/server';
import { createRulebase } from '@/lib/supabase/queries';
import { requireAuth } from '@/lib/rbac';

export async function POST(req: Request) {
  try {
    // Require authentication
    await requireAuth();
    
    console.log('🚀 POST /api/rulebase/upload - Starting request');
    
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const userId = form.get('userId') as string | null;
    const companyId = form.get('companyId') as string | null;
    
    if (!file) {
      console.log('❌ Upload error: No file provided');
      return NextResponse.json({ error: 'No file' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    console.log('📁 File received:', file.name, 'Size:', file.size);

    const arrayBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf-8');
    
    // Create new rule in Supabase with file content
    const savedRule = await createRulebase({
      name: file.name,
      description: `Uploaded rule file (${(arrayBuffer.byteLength/1024).toFixed(1)} KB)`,
      tags: ['uploaded'],
      source_type: 'file',
      file_name: file.name,
      file_content: fileContent.substring(0, 10000), // Limit content size
      user_id: userId,
      company_id: companyId || undefined,
    });
    
    console.log('✅ Uploaded rule created:', savedRule.id);
    
    // Transform for frontend
    const rule = {
      _id: savedRule.id,
      name: savedRule.name,
      description: savedRule.description || '',
      tags: savedRule.tags || [],
      sourceType: savedRule.source_type,
      fileName: savedRule.file_name,
      active: savedRule.active,
      updatedAt: savedRule.updated_at,
    };
    
    return NextResponse.json({ rule });
  } catch (e) {
    console.error('❌ Upload error:', e);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 500 });
  }
}

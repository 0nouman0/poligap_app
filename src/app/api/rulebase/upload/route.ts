import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    console.log('� POST /api/rulebase/upload - Starting request');
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    
    if (!file) {
      console.log('❌ Upload error: No file provided');
      return NextResponse.json({ error: 'No file' }, { status: 400 });
    }

    console.log('📁 File received:', file.name, 'Size:', file.size);

    const arrayBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf-8');

    // Insert rule using Supabase Postgrest
    const { data: savedRule, error: insertError } = await supabase
      .from('rulebase')
      .insert({
        name: file.name,
        description: `Uploaded rule file (${(arrayBuffer.byteLength/1024).toFixed(1)} KB)`,
        tags: ['uploaded'],
        source_type: 'file',
        file_name: file.name,
        file_content: fileContent.substring(0, 10000), // Limit content size
        user_id: user.id,
        active: true,
      })
      .select()
      .single();

    if (insertError || !savedRule) {
      console.error('❌ Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save rule', details: insertError?.message }, { status: 500 });
    }

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

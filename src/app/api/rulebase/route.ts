import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('� GET /api/rulebase - Starting request');
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        rules: [] 
      }, { status: 401 });
    }

    // Use Supabase Postgrest API to fetch rules
    const { data: rules, error } = await supabase
      .from('rulebase')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch rules',
        rules: [] 
      }, { status: 500 });
    }
    
    console.log(`✅ Found ${rules?.length || 0} rules`);
    
    // Transform rules to match frontend interface
    const transformedRules = (rules || []).map((rule: any) => ({
      _id: rule.id,
      name: rule.name,
      description: rule.description || '',
      tags: rule.tags || [],
      sourceType: rule.source_type,
      fileName: rule.file_name,
      active: rule.active,
      updatedAt: rule.updated_at,
    }));
    
    return NextResponse.json({ rules: transformedRules });
  } catch (error) {
    console.error('❌ GET /api/rulebase error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch rules',
      rules: [] 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    console.log('🚀 POST /api/rulebase - Starting request');
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('POST body:', body);
    
    const { name, description = '', tags = [], sourceType = 'text', active = true } = body || {};
    
    if (!name || typeof name !== 'string') {
      console.log('❌ POST error: Invalid name');
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

    // Use Supabase Postgrest API to insert rule
    const { data: savedRule, error } = await supabase
      .from('rulebase')
      .insert({
        name,
        description,
        tags: Array.isArray(tags) ? tags : [],
        source_type: sourceType,
        user_id: user.id,
        active
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      return NextResponse.json({ 
        error: 'Failed to create rule',
        details: error.message 
      }, { status: 500 });
    }
    console.log('✅ Rule created:', savedRule.id);
    
    // Transform for frontend
    const rule = {
      _id: savedRule.id,
      name: savedRule.name,
      description: savedRule.description || '',
      tags: savedRule.tags || [],
      sourceType: savedRule.source_type,
      active: savedRule.active,
      updatedAt: savedRule.updated_at,
    };
    
    return NextResponse.json({ rule });
  } catch (e) {
    console.error('❌ POST error:', e);
    return NextResponse.json({ 
      error: 'Bad request', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    console.log('🚀 PATCH /api/rulebase - Starting request');
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('PATCH body:', body);
    
    const { id, active, name, description, tags } = body || {};
    
    if (!id) {
      console.log('❌ PATCH error: id is required');
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Prepare update object (only include fields that are provided)
    const updateData: any = {};
    if (typeof name === 'string') updateData.name = name;
    if (typeof description === 'string') updateData.description = description;
    if (Array.isArray(tags)) updateData.tags = tags;
    if (typeof active === 'boolean') updateData.active = active;

    // Use Supabase Postgrest API to update rule
    const { data: updatedRule, error } = await supabase
      .from('rulebase')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own rules
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase update error:', error);
      return NextResponse.json({ 
        error: 'Failed to update rule',
        details: error.message 
      }, { status: 500 });
    }
    
    if (!updatedRule) {
      console.log('❌ PATCH error: Rule not found for id:', id);
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }
    
    console.log('✅ Rule updated:', updatedRule.id);
    
    // Transform for frontend
    const rule = {
      _id: updatedRule.id,
      name: updatedRule.name,
      description: updatedRule.description || '',
      tags: updatedRule.tags || [],
      active: updatedRule.active,
      updatedAt: updatedRule.updated_at,
    };
    
    return NextResponse.json({ rule });
  } catch (e) {
    console.error('❌ PATCH error:', e);
    return NextResponse.json({ 
      error: 'Bad request', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    console.log('🚀 DELETE /api/rulebase - Starting request');
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    console.log('DELETE body:', body);
    
    const { id } = body || {};
    
    if (!id) {
      console.log('❌ DELETE error: id is required');
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Soft delete: set active to false
    const { data: deletedRule, error } = await supabase
      .from('rulebase')
      .update({ active: false })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only delete their own rules
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase delete error:', error);
      return NextResponse.json({ 
        error: 'Failed to delete rule',
        details: error.message 
      }, { status: 500 });
    }
    
    if (!deletedRule) {
      console.log('❌ DELETE error: Rule not found for id:', id);
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }
    
    console.log('✅ Rule soft deleted:', deletedRule.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('❌ DELETE error:', e);
    return NextResponse.json({ 
      error: 'Bad request', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 400 });
  }
}

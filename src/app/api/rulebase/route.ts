import { NextResponse } from 'next/server';
import { getUserRulebases, createRulebase, updateRulebase, deleteRulebase } from '@/lib/supabase/queries';

export async function GET(req: Request) {
  try {
    console.log('🚀 GET /api/rulebase - Starting request');
    
    // Get userId from query params or headers
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'userId is required',
        rules: [] 
      }, { status: 400 });
    }
    
    // Fetch all rules from Supabase
    const rules = await getUserRulebases(userId);
    
    console.log(`✅ Found ${rules.length} rules`);
    
    // Transform rules to match frontend interface
    const transformedRules = rules.map((rule: any) => ({
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
    
    const body = await req.json();
    console.log('POST body:', body);
    
    const { name, description = '', tags = [], sourceType = 'text', userId, companyId } = body || {};
    
    if (!name || typeof name !== 'string') {
      console.log('❌ POST error: Invalid name');
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    
    // Create new rule in Supabase
    const savedRule = await createRulebase({
      name,
      description,
      tags: Array.isArray(tags) ? tags : [],
      source_type: sourceType,
      user_id: userId,
      company_id: companyId,
    });
    
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
    
    const body = await req.json();
    console.log('PATCH body:', body);
    
    const { id, active, name, description, tags } = body || {};
    
    if (!id) {
      console.log('❌ PATCH error: id is required');
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    
    // Prepare update object
    const updateData: any = {};
    if (typeof active === 'boolean') updateData.active = active;
    if (typeof name === 'string') updateData.name = name;
    if (typeof description === 'string') updateData.description = description;
    if (Array.isArray(tags)) updateData.tags = tags;
    
    // Update rule in Supabase
    const updatedRule = await updateRulebase(id, updateData);
    
    console.log('✅ Rule updated:', updatedRule.id);
    
    // Transform for frontend
    const rule = {
      _id: updatedRule.id,
      name: updatedRule.name,
      description: updatedRule.description || '',
      tags: updatedRule.tags || [],
      sourceType: updatedRule.source_type,
      fileName: updatedRule.file_name,
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
    
    const body = await req.json().catch(() => ({}));
    console.log('DELETE body:', body);
    
    const { id } = body || {};
    
    if (!id) {
      console.log('❌ DELETE error: id is required');
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    
    // Soft delete by setting active to false in Supabase
    const deletedRule = await deleteRulebase(id);
    
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


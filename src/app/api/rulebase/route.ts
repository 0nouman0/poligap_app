import { NextResponse } from 'next/server';
import { GraphQLService, extractNodes } from '@/lib/graphql-service';

export async function GET() {
  try {
    console.log('📖 GET /api/rulebase - Starting request');
    
    const gqlService = new GraphQLService();
    const user = await gqlService.init();

    // Fetch rules using GraphQL
    const response: any = await gqlService.query('getRules', { userId: user.id });
    const rules = extractNodes(response.rulebaseCollection);
    
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
    
    const gqlService = new GraphQLService();
    const user = await gqlService.init();

    const body = await req.json();
    console.log('POST body:', body);
    
    const { name, description = '', tags = [], sourceType = 'text', fileName, fileContent } = body || {};
    
    if (!name || typeof name !== 'string') {
      console.log('❌ POST error: Invalid name');
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

    // Create rule using GraphQL
    const response: any = await gqlService.query('createRule', {
      name,
      description,
      tags: Array.isArray(tags) ? tags : [],
      source_type: sourceType,
      file_name: fileName || null,
      file_content: fileContent || null,
      user_id: user.id,
      company_id: null
    });
    
    const savedRule = response.insertIntorulebaseCollection.records[0];
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
    
    const gqlService = new GraphQLService();
    await gqlService.init();

    const body = await req.json();
    console.log('PATCH body:', body);
    
    const { id, active, name, description, tags } = body || {};
    
    if (!id) {
      console.log('❌ PATCH error: id is required');
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Prepare GraphQL variables (only include fields that are provided)
    const variables: any = { id };
    if (typeof name === 'string') variables.name = name;
    if (typeof description === 'string') variables.description = description;
    if (Array.isArray(tags)) variables.tags = tags;
    if (typeof active === 'boolean') variables.active = active;

    // Update rule using GraphQL
    const response: any = await gqlService.query('updateRule', variables);
    const updatedRule = response.updaterulebaseCollection.records[0];
    
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
    
    const gqlService = new GraphQLService();
    await gqlService.init();

    const body = await req.json().catch(() => ({}));
    console.log('DELETE body:', body);
    
    const { id } = body || {};
    
    if (!id) {
      console.log('❌ DELETE error: id is required');
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Soft delete using GraphQL (sets active = false)
    const response: any = await gqlService.query('deleteRule', { id });
    const deletedRule = response.updaterulebaseCollection.records[0];
    
    if (!deletedRule) {
      console.log('❌ DELETE error: Rule not found for id:', id);
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }
    
    console.log('✅ Rule deleted:', deletedRule.id);
    return NextResponse.json({ success: true, deletedId: deletedRule.id });
  } catch (e) {
    console.error('❌ DELETE error:', e);
    return NextResponse.json({ 
      error: 'Bad request', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 400 });
  }
}

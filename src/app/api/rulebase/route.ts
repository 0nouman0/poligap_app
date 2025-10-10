import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { queries } from '@/lib/supabase/graphql';
import { GraphQLClient } from 'graphql-request';

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

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ 
        error: 'No session found',
        rules: [] 
      }, { status: 401 });
    }

    const graphQLClient = new GraphQLClient(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    const result = await graphQLClient.request<any>(queries.getRules, {
      userId: user.id,
    });

    const rules = result.rulebaseCollection.edges.map((edge: any) => edge.node);
    
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

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const graphQLClient = new GraphQLClient(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    const result = await graphQLClient.request<any>(queries.createRule, {
      name,
      description,
      tags: Array.isArray(tags) ? tags : [],
      source_type: sourceType,
      user_id: user.id,
    });

    const savedRule = result.insertIntorulebaseCollection.records[0];
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

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const graphQLClient = new GraphQLClient(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    // Prepare update variables (only include fields that are provided)
    const variables: any = { id };
    if (typeof name === 'string') variables.name = name;
    if (typeof description === 'string') variables.description = description;
    if (Array.isArray(tags)) variables.tags = tags;
    if (typeof active === 'boolean') variables.active = active;

    const result = await graphQLClient.request<any>(queries.updateRule, variables);

    const updatedRule = result.updaterulebaseCollection.records[0];
    
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

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const graphQLClient = new GraphQLClient(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    const result = await graphQLClient.request<any>(queries.deleteRule, { id });

    const deletedRule = result.updaterulebaseCollection.records[0];
    
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

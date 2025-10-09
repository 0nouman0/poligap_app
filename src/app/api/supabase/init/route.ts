import { NextResponse } from 'next/server';
import { 
import { requireAuth } from '@/lib/rbac';
  initializeSupabase,
  getSchemaSQL,
  getRLSPoliciesSQL,
  getSetupInstructions 
} from '@/lib/supabase/init';

/**
 * Supabase Initialization API
 * 
 * GET /api/supabase/init - Run initialization
 * GET /api/supabase/init?sql=schema - Get schema SQL
 * GET /api/supabase/init?sql=rls - Get RLS policies SQL
 * GET /api/supabase/init?instructions=true - Get setup instructions
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sqlParam = searchParams.get('sql');
  const instructionsParam = searchParams.get('instructions');

  // Return SQL for manual setup
  if (sqlParam === 'schema') {
    return NextResponse.json({
      sql: getSchemaSQL(),
      message: 'Copy this SQL and run in Supabase Dashboard → SQL Editor',
    });
  }

  if (sqlParam === 'rls') {
    return NextResponse.json({
      sql: getRLSPoliciesSQL(),
      message: 'Copy this SQL and run in Supabase Dashboard → SQL Editor',
    });
  }

  if (instructionsParam === 'true') {
    return new NextResponse(getSetupInstructions(), {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Run initialization
  try {
    console.log('🚀 Running Supabase initialization via API...');
    const results = await initializeSupabase();

    return NextResponse.json({
      success: true,
      message: 'Supabase initialization complete',
      results,
      nextSteps: [
        'Check console for detailed logs',
        'If schema creation failed, run: GET /api/supabase/init?sql=schema',
        'If RLS policies need setup, run: GET /api/supabase/init?sql=rls',
        'For full instructions: GET /api/supabase/init?instructions=true',
      ],
    });
  } catch (error: any) {
    console.error('❌ Initialization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        sqlEndpoints: {
          schema: '/api/supabase/init?sql=schema',
          rls: '/api/supabase/init?sql=rls',
          instructions: '/api/supabase/init?instructions=true',
        },
      },
      { status: 500 }
    );
  }
}

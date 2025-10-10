import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiResponse } from '@/lib/apiResponse';

// GET - Test Supabase connection and show real data
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Test database connection by counting rows
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: companyCount } = await supabase.from('companies').select('*', { count: 'exact', head: true });
    
    // Get sample data to understand structure
    const { data: sampleUser } = await supabase.from('profiles').select('*').limit(1).single();
    const { data: sampleCompany } = await supabase.from('companies').select('*').limit(1).single();
    
    // Get all users to see what's available
    const { data: allUsers } = await supabase.from('profiles').select('*').limit(10);

    const connectionInfo = {
      status: 'Connected to Supabase',
      database: process.env.NEXT_PUBLIC_SUPABASE_URL,
      tables: {
        profiles: {
          count: userCount || 0,
          sample: sampleUser ? {
            id: sampleUser.id,
            email: sampleUser.email,
            name: sampleUser.name,
            status: sampleUser.status
          } : null
        },
        companies: {
          count: companyCount || 0,
          sample: sampleCompany ? {
            id: sampleCompany.id,
            name: sampleCompany.name,
            company_id: sampleCompany.company_id
          } : null
        }
      },
      allUsers: (allUsers || []).map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status
      }))
    };

    return createApiResponse({
      success: true,
      data: connectionInfo,
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Database connection failed',
      status: 500,
    });
  }
}

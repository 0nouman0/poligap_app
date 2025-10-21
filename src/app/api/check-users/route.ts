import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiResponse } from '@/lib/apiResponse';

// GET - Check what users exist in the database
export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Checking users in Supabase...');
    
    const supabase = await createClient();
    
    // Get all users to see what's actually in the database
    const { data: allUsers, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(20);
    
    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }
    
    console.log(`Found ${allUsers?.length || 0} users in database`);
    
    // Get the specific user ID from localStorage that's failing
    const { searchParams } = new URL(req.url);
    const searchUserId = searchParams.get('searchUserId');
    
    const result = {
      totalUsers: allUsers?.length || 0,
      searchedUserId: searchUserId,
      users: (allUsers || []).map(user => ({
        _id: user.id,
        userId: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        // Show if this matches the searched user ID
        matchesSearch: searchUserId ? (user.id === searchUserId) : false
      })),
      // Try different search approaches for the failing user ID
      searchResults: searchUserId ? await tryDifferentSearches(searchUserId, supabase) : null
    };

    return createApiResponse({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error checking users:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check users',
      status: 500,
    });
  }
}

async function tryDifferentSearches(userId: string, supabase: any) {
  const searches = [];
  
  try {
    // Search by id field
    const { data: byId, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    searches.push({ 
      method: 'id field', 
      found: !!byId && !error, 
      data: byId ? { _id: byId.id, email: byId.email } : null 
    });
  } catch (e) {
    searches.push({ method: 'id field', found: false, error: 'Failed' });
  }

  try {
    // Search by email if userId looks like email
    if (userId.includes('@')) {
      const { data: byEmail, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userId)
        .single();
      
      searches.push({ 
        method: 'email field', 
        found: !!byEmail && !error, 
        data: byEmail ? { _id: byEmail.id, email: byEmail.email } : null 
      });
    }
  } catch (e) {
    searches.push({ method: 'email field', found: false, error: 'Failed' });
  }

  return searches;
}

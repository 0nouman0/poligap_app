import { NextRequest, NextResponse } from 'next/server';
import { GraphQLService } from '@/lib/graphql-service';
import { createApiResponse } from '@/lib/apiResponse';

// GET - Check what users exist in the database
export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Checking users in Supabase...');
    
    const gqlService = new GraphQLService();
    await gqlService.init();
    
    // Get all users using GraphQL (limited query)
    const response: any = await gqlService.query('getProfile', { id: gqlService.getUserId() });
    const currentUser = response.profilesCollection.edges[0]?.node;
    
    const allUsers = currentUser ? [currentUser] : [];
    
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

async function tryDifferentSearches(userId: string, gqlService: any) {
  const searches = [];
  
  try {
    // Search by id field using GraphQL
    const response: any = await gqlService.query('getProfile', { id: userId });
    const byId = response.profilesCollection.edges[0]?.node;
    
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

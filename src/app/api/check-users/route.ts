import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/users.model';
import { createApiResponse } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/rbac';

// GET - Check what users exist in the database
export async function GET(req: NextRequest) {
  try {
    // Require authentication
    await requireAuth();
    
    console.log('🔍 Checking users in MongoDB Atlas...');
    
    // Get all users to see what's actually in the database
    const allUsers = await User.find({}).limit(20).lean();
    console.log(`Found ${allUsers.length} users in database`);
    
    // Get the specific user ID from localStorage that's failing
    const { searchParams } = new URL(req.url);
    const searchUserId = searchParams.get('searchUserId');
    
    const result = {
      totalUsers: allUsers.length,
      searchedUserId: searchUserId,
      users: allUsers.map(user => ({
        _id: user._id?.toString(),
        userId: user.userId?.toString(),
        email: user.email,
        name: user.name,
        status: user.status,
        // Show if this matches the searched user ID
        matchesSearch: searchUserId ? (
          user._id?.toString() === searchUserId || 
          user.userId?.toString() === searchUserId
        ) : false
      })),
      // Try different search approaches for the failing user ID
      searchResults: searchUserId ? await tryDifferentSearches(searchUserId) : null
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

async function tryDifferentSearches(userId: string) {
  const searches = [];
  
  try {
    // Search by userId field
    const byUserId = await User.findOne({ userId: userId }).lean();
    searches.push({ method: 'userId string', found: !!byUserId, data: byUserId ? { _id: byUserId._id?.toString(), email: byUserId.email } : null });
  } catch (e) {
    searches.push({ method: 'userId string', found: false, error: 'Failed' });
  }

  try {
    // Search by _id
    const byId = await User.findById(userId).lean();
    searches.push({ method: '_id', found: !!byId, data: byId ? { _id: byId._id?.toString(), email: byId.email } : null });
  } catch (e) {
    searches.push({ method: '_id', found: false, error: 'Invalid ObjectId' });
  }

  try {
    // Search by userId as ObjectId
    const User_base = User as any;
    const byUserIdObjectId = await User.findOne({ userId: new User_base.base.Types.ObjectId(userId) }).lean();
    searches.push({ method: 'userId ObjectId', found: !!byUserIdObjectId, data: byUserIdObjectId ? { _id: byUserIdObjectId._id?.toString(), email: byUserIdObjectId.email } : null });
  } catch (e) {
    searches.push({ method: 'userId ObjectId', found: false, error: 'Invalid ObjectId' });
  }

  return searches;
}

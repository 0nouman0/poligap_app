import { NextRequest } from 'next/server';
import User from '@/models/users.model';
import { createApiResponse } from '@/lib/apiResponse';

export async function GET(req: NextRequest) {
  try {
    console.log('=== Debug: Listing Users in MongoDB ===');
    
    // Get all users with their ID formats - SHOW REAL DATA
    const users = await User.find({})
      .select('_id userId email name uniqueId status designation companyName createdAt updatedAt')
      .sort({ updatedAt: -1 }) // Show most recently updated first
      .limit(20) // Show more users
      .lean();

    console.log(`Found ${users.length} users in database`);

    const userList = users.map(user => ({
      _id: user._id?.toString(),
      userId: user.userId?.toString(),
      email: user.email,
      name: user.name,
      uniqueId: user.uniqueId,
      status: user.status,
      designation: (user as any).designation,
      companyName: (user as any).companyName,
      createdAt: (user as any).createdAt,
      updatedAt: (user as any).updatedAt,
      // Show the actual types
      _idType: typeof user._id,
      userIdType: typeof user.userId,
      isMockData: user.name === 'Poligap User' || user.email?.includes('poligap.com'),
    }));

    console.log('User list:', userList);

    // Also get total count
    const totalCount = await User.countDocuments();

    return createApiResponse({
      success: true,
      data: {
        users: userList,
        totalCount,
        message: 'Use any of these IDs to test the profile API'
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch debug info',
      status: 500,
    });
  }
}

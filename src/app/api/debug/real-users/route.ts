import { NextRequest } from 'next/server';
import User from '@/models/users.model';
import { createApiResponse } from '@/lib/apiResponse';

export async function GET(req: NextRequest) {
  try {
    console.log('=== Finding REAL Users (Non-Mock Data) ===');
    
    // Find users that are NOT mock data
    const realUsers = await User.find({
      $and: [
        { name: { $ne: 'Poligap User' } }, // Exclude mock name
        { name: { $ne: 'Chat User' } }, // Exclude chat mock name
        { email: { $not: /.*@poligap\.com$/ } }, // Exclude poligap.com emails
        { email: { $exists: true } }, // Must have email
        { name: { $exists: true } }, // Must have name
        { name: { $ne: '' } }, // Name not empty
        { email: { $ne: '' } }, // Email not empty
      ]
    })
      .select('_id userId email name uniqueId status designation companyName createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    console.log(`Found ${realUsers.length} REAL users (non-mock)`);

    // Also find mock users for comparison
    const mockUsers = await User.find({
      $or: [
        { name: 'Poligap User' },
        { name: 'Chat User' },
        { email: /.*@poligap\.com$/ }
      ]
    })
      .select('_id userId email name uniqueId status')
      .limit(5)
      .lean();

    const realUserList = realUsers.map(user => ({
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
      dataType: 'REAL_USER'
    }));

    const mockUserList = mockUsers.map(user => ({
      _id: user._id?.toString(),
      userId: user.userId?.toString(),
      email: user.email,
      name: user.name,
      uniqueId: user.uniqueId,
      status: user.status,
      dataType: 'MOCK_USER'
    }));

    console.log('Real users:', realUserList);
    console.log('Mock users:', mockUserList);

    return createApiResponse({
      success: true,
      data: {
        realUsers: realUserList,
        mockUsers: mockUserList,
        totalRealUsers: realUsers.length,
        totalMockUsers: mockUsers.length,
        message: realUsers.length > 0 
          ? 'Found real users! Use these IDs for authentic profile data.'
          : 'No real users found. All users appear to be mock data.'
      }
    });

  } catch (error) {
    console.error('Debug real users API error:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch real users',
      status: 500,
    });
  }
}

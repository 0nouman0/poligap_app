import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/users.model';
import Member from '@/models/members.model';
import { createApiResponse } from '@/lib/apiResponse';
import mongoose from 'mongoose';

// GET - Debug user information
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return createApiResponse({
        success: false,
        error: 'User ID is required',
        status: 400,
      });
    }

    const debugInfo: any = {
      searchedUserId: userId,
      userIdLength: userId.length,
      isValidObjectId: mongoose.Types.ObjectId.isValid(userId),
    };

    // Try different query approaches
    const queries = [
      { name: 'Direct string match', query: { userId: userId } },
      { name: 'ObjectId conversion', query: { userId: new mongoose.Types.ObjectId(userId) } },
      { name: 'String _id match', query: { _id: userId } },
      { name: 'ObjectId _id match', query: { _id: new mongoose.Types.ObjectId(userId) } },
    ];

    for (const { name, query } of queries) {
      try {
        const user = await User.findOne(query).lean();
        debugInfo[name] = user ? 'FOUND' : 'NOT FOUND';
        if (user) {
          debugInfo[`${name}_data`] = {
            _id: user._id?.toString(),
            userId: user.userId?.toString(),
            email: user.email,
            name: user.name,
          };
        }
      } catch (error) {
        debugInfo[name] = `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    // Check if there are any users in the database
    const totalUsers = await User.countDocuments();
    debugInfo.totalUsersInDB = totalUsers;

    if (totalUsers > 0) {
      // Get a sample of users to see the data structure
      const sampleUsers = await User.find({}).limit(3).lean();
      debugInfo.sampleUsers = sampleUsers.map(user => ({
        _id: user._id?.toString(),
        userId: user.userId?.toString(),
        email: user.email,
        name: user.name,
      }));
    }

    // Check Member collection too
    const totalMembers = await Member.countDocuments();
    debugInfo.totalMembersInDB = totalMembers;

    if (totalMembers > 0) {
      const sampleMembers = await Member.find({}).limit(3).lean();
      debugInfo.sampleMembers = sampleMembers.map(member => ({
        _id: member._id?.toString(),
        userId: member.userId?.toString(),
        companyId: member.companyId?.toString(),
        role: member.role,
      }));
    }

    return createApiResponse({
      success: true,
      data: debugInfo,
    });
  } catch (error) {
    console.error('Error in debug user:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Debug failed',
      status: 500,
    });
  }
}

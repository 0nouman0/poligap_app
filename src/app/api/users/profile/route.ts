import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/users.model';
import { createApiResponse } from '@/lib/apiResponse';
import { fetchUserProfileDetails } from '@/app/api/enterpriseSearch/enterpriseSearch';

// GET - Fetch complete user profile
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const companyId = searchParams.get('companyId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return createApiResponse({
        success: false,
        error: 'User ID or email is required',
        status: 400,
      });
    }

    let userProfileData;

    if (userId && companyId) {
      // Use the existing fetchUserProfileDetails function for complete data
      const result = await fetchUserProfileDetails(userId, companyId);
      
      if (result.code === 200) {
        userProfileData = result.data;
      } else {
        return createApiResponse({
          success: false,
          error: result.message,
          status: result.code,
        });
      }
    } else {
      // Fallback: fetch basic user data if no companyId provided
      let query: any = {};
      if (userId) {
        // Handle both string and ObjectId formats for MongoDB Atlas
        try {
          // Try to create ObjectId from the userId string
          const objectId = new User.base.Types.ObjectId(userId);
          query.userId = objectId;
        } catch {
          // If ObjectId creation fails, try direct string match
          query.userId = userId;
        }
      } else if (email) {
        query.email = email;
      }

      console.log('Searching for user with query:', query);
      const user = await User.findOne(query)
        .select('-__v') // Exclude version field
        .lean();

      console.log('User found:', user ? 'YES' : 'NO');
      if (user) {
        console.log('User data:', {
          _id: user._id?.toString(),
          userId: user.userId?.toString(),
          email: user.email,
          name: user.name
        });
      }

      if (!user) {
        // Also try searching by _id in case userId is stored as _id
        try {
          const userById = await User.findById(userId).select('-__v').lean();
          if (userById) {
            console.log('Found user by _id instead of userId');
            const userObj = userById as any;
            const transformedUser = {
              ...userObj,
              userId: userObj._id?.toString(),
              _id: userObj._id?.toString(),
              designation: userObj.designation || '',
              role: userObj.role || 'User',
              memberStatus: userObj.memberStatus || userObj.status || 'ACTIVE',
              companyName: userObj.companyName || '',
              reportingManager: userObj.reportingManager || null,
              createdBy: userObj.createdBy || null,
            };
            
            return createApiResponse({
              success: true,
              data: transformedUser,
            });
          }
        } catch (error) {
          console.log('Error searching by _id:', error);
        }

        return createApiResponse({
          success: false,
          error: 'User not found in MongoDB Atlas database',
          status: 404,
        });
      }

      // Transform basic user data
      const userObj = user as any;
      userProfileData = {
        ...userObj,
        userId: userObj.userId?.toString() || userObj._id?.toString(),
        _id: userObj._id?.toString(),
        designation: userObj.designation || '',
        role: userObj.role || 'User',
        memberStatus: userObj.memberStatus || userObj.status || 'ACTIVE',
        companyName: userObj.companyName || '',
        reportingManager: userObj.reportingManager || null,
        createdBy: userObj.createdBy || null,
      };
    }

    return createApiResponse({
      success: true,
      data: userProfileData,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch profile',
      status: 500,
    });
  }
}

// PUT - Update user profile
export async function PUT(req: NextRequest) {
  try {
    const { userId, ...updateData } = await req.json();

    if (!userId) {
      return createApiResponse({
        success: false,
        error: 'User ID is required',
        status: 400,
      });
    }

    // Remove fields that shouldn't be updated directly
    const { _id, createdAt, updatedAt, ...allowedUpdates } = updateData;

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { 
        ...allowedUpdates,
        updatedAt: new Date()
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-__v').lean();

    if (!updatedUser) {
      return createApiResponse({
        success: false,
        error: 'User not found',
        status: 404,
      });
    }

    return createApiResponse({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
      status: 500,
    });
  }
}

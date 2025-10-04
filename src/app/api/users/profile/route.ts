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

      console.log('=== MongoDB User Search Debug ===');
      console.log('Original userId parameter:', userId);
      console.log('Search query:', JSON.stringify(query, null, 2));
      
      const user = await User.findOne(query)
        .select('-__v') // Exclude version field
        .lean();

      console.log('User found:', user ? 'YES' : 'NO');
      if (user) {
        console.log('Found user data:', {
          _id: user._id?.toString(),
          userId: user.userId?.toString(),
          email: user.email,
          name: user.name
        });
      } else {
        // Try different search strategies
        console.log('=== Trying Alternative Search Methods ===');
        
        // Try searching by string userId
        const userByStringId = await User.findOne({ userId: userId }).lean();
        console.log('Search by string userId result:', userByStringId ? 'FOUND' : 'NOT FOUND');
        
        // Try searching by _id directly
        try {
          const userByDirectId = await User.findById(userId).lean();
          console.log('Search by _id result:', userByDirectId ? 'FOUND' : 'NOT FOUND');
          if (userByDirectId) {
            console.log('Found via _id:', {
              _id: userByDirectId._id?.toString(),
              email: userByDirectId.email,
              name: userByDirectId.name
            });
          }
        } catch (idError) {
          console.log('_id search failed:', idError instanceof Error ? idError.message : 'Unknown error');
        }
        
        // List some users to see the actual data structure
        const sampleUsers = await User.find({}).limit(3).select('_id userId email name').lean();
        console.log('Sample users in database:', sampleUsers.map(u => ({
          _id: u._id?.toString(),
          userId: u.userId?.toString(),
          email: u.email,
          name: u.name
        })));
      }

      // If no user found, try all possible search methods
      if (!user) {
        console.log('=== Comprehensive User Search ===');
        let foundUser = null;
        
        // Method 1: Search by _id directly
        try {
          foundUser = await User.findById(userId).select('-__v').lean();
          if (foundUser) {
            console.log('✅ Found user by _id');
          }
        } catch (error) {
          console.log('❌ _id search failed:', error instanceof Error ? error.message : 'Unknown error');
        }
        
        // Method 2: Search by userId as string
        if (!foundUser) {
          try {
            foundUser = await User.findOne({ userId: userId }).select('-__v').lean();
            if (foundUser) {
              console.log('✅ Found user by userId string');
            }
          } catch (error) {
            console.log('❌ userId string search failed:', error instanceof Error ? error.message : 'Unknown error');
          }
        }
        
        // Method 3: Search by partial userId match
        if (!foundUser && userId && userId.length >= 8) {
          try {
            const regex = new RegExp(userId, 'i');
            foundUser = await User.findOne({
              $or: [
                { userId: regex },
                { _id: { $regex: userId } }
              ]
            }).select('-__v').lean();
            if (foundUser) {
              console.log('✅ Found user by partial match');
            }
          } catch (error) {
            console.log('❌ Partial match search failed:', error instanceof Error ? error.message : 'Unknown error');
          }
        }
        
        // Method 4: If still not found, search by any field containing the ID
        if (!foundUser && userId) {
          try {
            foundUser = await User.findOne({
              $or: [
                { uniqueId: userId },
                { email: userId }
              ]
            }).select('-__v').lean();
            if (foundUser) {
              console.log('✅ Found user by uniqueId or email');
            }
          } catch (error) {
            console.log('❌ Alternative field search failed:', error instanceof Error ? error.message : 'Unknown error');
          }
        }
        
        if (foundUser) {
          console.log('🎉 User found via alternative method');
          const userObj = foundUser as any;
          const transformedUser = {
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
          
          return createApiResponse({
            success: true,
            data: transformedUser,
          });
        }
        
        // If still no user found, provide detailed error info
        const totalUsers = await User.countDocuments();
        console.log(`❌ No user found. Total users in database: ${totalUsers}`);
        
        return createApiResponse({
          success: false,
          error: `User not found. Searched for ID: ${userId}. Database contains ${totalUsers} users. Check console for debug info.`,
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

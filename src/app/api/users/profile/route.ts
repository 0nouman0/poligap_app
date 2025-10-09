import { NextRequest } from 'next/server';
import User from '@/models/users.model';
import { createApiResponse } from '@/lib/apiResponse';
import mongoose from 'mongoose';
import { requireAuth } from '@/lib/rbac';

// Retry wrapper for database operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Database operation attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.log(`❌ Attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError;
}

// GET - Fetch user profile
export async function GET(req: NextRequest) {
  try {
    // Require authentication to view profile
    await requireAuth();
    
    const startTime = Date.now();
    console.log('🚀 Profile API GET starting...');
    
    // Ensure database connection
    if (mongoose.connection.readyState !== 1) {
      try {
        console.log('🔄 Establishing database connection...');
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('✅ Database connection established');
      } catch (dbError) {
        console.error("❌ Database connection failed:", dbError);
        return createApiResponse({
          success: false,
          error: "Database connection failed - MongoDB connection required",
          status: 503,
        });
      }
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return createApiResponse({
        success: false,
        error: 'User ID or email is required',
        status: 400,
      });
    }

    // Optimized user lookup by userId or email
    let query: any = {};
    if (userId) {
      try {
        const objectId = new mongoose.Types.ObjectId(userId);
        query._id = objectId;
      } catch {
        query._id = userId;
      }
    } else if (email) {
      query.email = email;
    }

    console.log('🔍 Searching for user...');
    
    // Optimized database query with specific field selection
    const user = await retryOperation(async () => {
      return await User.findOne(query)
        .select('name email mobile dob country designation about profileImage banner companyName status createdAt updatedAt -_id') // Select only needed fields
        .lean() // Use lean for better performance
        .maxTimeMS(5000); // Reduced timeout for faster response
    });

    if (!user) {
      console.log('❌ User not found');
      return createApiResponse({
        success: false,
        error: 'User not found',
        status: 404,
      });
    }

    console.log('✅ User found, preparing response...');

    // Transform user data for response
    const profileData = {
      _id: user._id?.toString(),
      userId: user._id?.toString(),
      name: user.name,
      email: user.email,
      mobile: user.mobile || '',
      dob: user.dob || '',
      country: user.country || '',
      designation: user.designation || '',
      about: user.about || '',
      profileImage: user.profileImage || '',
      banner: user.banner || { image: '', color: '', type: '', yOffset: 0 },
      companyName: user.companyName || '',
      status: user.status || 'ACTIVE',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      source: 'MongoDB Atlas'
    };

    const totalTime = Date.now() - startTime;
    console.log(`⚡ Profile GET completed in ${totalTime}ms`);
    
    const response = createApiResponse({
      success: true,
      data: profileData
    });

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600'); // 5 min cache, 10 min stale
    
    return response;

  } catch (error) {
    console.error('❌ Profile API error:', error);
    return createApiResponse({
      success: false,
      error: `Profile fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 500,
    });
  }
}

// PUT - Update user profile
export async function PUT(req: NextRequest) {
  try {
    // Require authentication to update profile
    await requireAuth();
    
    // Ensure database connection
    if (mongoose.connection.readyState !== 1) {
      try {
        console.log('🔄 Establishing database connection...');
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('✅ Database connection established');
      } catch (dbError) {
        console.error("❌ Database connection failed:", dbError);
        return createApiResponse({
          success: false,
          error: "Database connection failed - MongoDB connection required",
          status: 503,
        });
      }
    }

    const body = await req.json();
    const { userId, ...updates } = body;

    console.log('=== Profile Update Request ===');
    console.log('userId:', userId);
    console.log('updates:', updates);

    if (!userId) {
      return createApiResponse({
        success: false,
        error: 'User ID is required for profile update',
        status: 400,
      });
    }

    // Prepare query for user lookup
    let query: any = {};
    try {
      const objectId = new mongoose.Types.ObjectId(userId);
      query._id = objectId;
    } catch {
      query._id = userId;
    }

    // Filter allowed fields for update
    const allowedFields = [
      'name', 'email', 'mobile', 'dob', 'country', 'designation', 
      'about', 'profileImage', 'banner', 'companyName', 'status'
    ];
    
    const filteredUpdates: any = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // Add updatedAt timestamp
    filteredUpdates.updatedAt = new Date();

    console.log('=== MongoDB User Update ===');
    console.log('Query:', JSON.stringify(query, null, 2));
    console.log('Updates:', JSON.stringify(filteredUpdates, null, 2));

    // Use retry mechanism for database update
    const updatedUser = await retryOperation(async () => {
      return await User.findOneAndUpdate(
        query,
        { $set: filteredUpdates },
        { 
          new: true, // Return updated document
          runValidators: true, // Run schema validators
          maxTimeMS: 10000 // Set 10 second timeout
        }
      )
      .select('-__v')
      .lean();
    });

    if (!updatedUser) {
      return createApiResponse({
        success: false,
        error: 'User not found or update failed',
        status: 404,
      });
    }

    // Transform updated user data for response
    const profileData = {
      _id: updatedUser._id?.toString(),
      userId: updatedUser._id?.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      mobile: updatedUser.mobile,
      dob: updatedUser.dob,
      country: updatedUser.country,
      designation: updatedUser.designation,
      about: updatedUser.about,
      profileImage: updatedUser.profileImage,
      banner: updatedUser.banner,
      companyName: updatedUser.companyName,
      status: updatedUser.status,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      source: 'MongoDB Atlas'
    };

    console.log('✅ Profile updated successfully:', profileData.email);
    
    return createApiResponse({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('❌ Profile update error:', error);
    return createApiResponse({
      success: false,
      error: `Profile update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 500,
    });
  }
}

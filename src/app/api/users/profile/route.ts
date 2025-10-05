import { NextRequest } from 'next/server';
import User from '@/models/users.model';
import { createApiResponse } from '@/lib/apiResponse';

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
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    console.log('=== Profile API Request ===');
    console.log('userId:', userId);
    console.log('email:', email);

    // Check if database connection is available
    if (!User.db || User.db.readyState !== 1) {
      console.error('❌ Database connection not ready. State:', User.db?.readyState);
      return createApiResponse({
        success: false,
        error: 'Database connection not available - MongoDB connection required',
        status: 503,
      });
    }

    if (!userId && !email) {
      return createApiResponse({
        success: false,
        error: 'User ID or email is required',
        status: 400,
      });
    }

    // Simple user lookup by userId or email
    let query: any = {};
    if (userId) {
      // Handle both string and ObjectId formats
      try {
        const objectId = new User.base.Types.ObjectId(userId);
        query._id = objectId;
      } catch {
        // If ObjectId creation fails, try direct string match
        query._id = userId;
      }
    } else if (email) {
      query.email = email;
    }

    console.log('=== MongoDB User Search ===');
    console.log('Search query:', JSON.stringify(query, null, 2));
    
    // Use retry mechanism for database query
    const user = await retryOperation(async () => {
      return await User.findOne(query)
        .select('-__v') // Exclude version field
        .lean()
        .maxTimeMS(10000); // Set 10 second timeout for this query
    });

    console.log('User found:', user ? 'YES' : 'NO');
    if (user) {
      console.log('Found user data:', {
        _id: user._id?.toString(),
        email: user.email,
        name: user.name
      });
    }

    if (!user) {
      return createApiResponse({
        success: false,
        error: 'User not found',
        status: 404,
      });
    }

    // Transform user data for response
    const profileData = {
      _id: user._id?.toString(),
      userId: user._id?.toString(),
      name: user.name,
      email: user.email,
      designation: user.designation,
      companyName: user.companyName,
      source: 'MongoDB Atlas'
    };

    console.log('✅ Returning user profile:', profileData.email);
    
    return createApiResponse({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('❌ Profile API error:', error);
    return createApiResponse({
      success: false,
      error: `Profile fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 500,
    });
  }
}

import { NextRequest } from 'next/server';
import { createApiResponse } from '@/lib/apiResponse';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    console.log('=== Simple Profile API ===');
    console.log('userId:', userId);
    console.log('email:', email);

    // Check connection
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Mongoose not connected. State:', mongoose.connection.readyState);
      return createApiResponse({
        success: false,
        error: 'Database not connected',
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

    // Direct MongoDB query without model
    const db = mongoose.connection.db;
    if (!db) {
      return createApiResponse({
        success: false,
        error: 'Database not available',
        status: 503,
      });
    }
    const usersCollection = db.collection('users');

    let query: any = {};
    if (userId) {
      try {
        query._id = new mongoose.Types.ObjectId(userId);
      } catch {
        query._id = userId;
      }
    } else if (email) {
      query.email = email;
    }

    console.log('Direct MongoDB query:', JSON.stringify(query, null, 2));

    const user = await usersCollection.findOne(query);
    
    console.log('User found:', user ? 'YES' : 'NO');
    if (user) {
      console.log('User data:', {
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

    // Return user data
    const profileData = {
      _id: user._id?.toString(),
      userId: user._id?.toString(),
      name: user.name,
      email: user.email,
      designation: user.designation,
      companyName: user.companyName,
      source: 'Direct MongoDB Query'
    };

    return createApiResponse({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('❌ Simple profile API error:', error);
    return createApiResponse({
      success: false,
      error: `Profile fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 500,
    });
  }
}

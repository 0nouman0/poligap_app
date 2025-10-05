import { NextRequest } from 'next/server';
import User from '@/models/users.model';
import { createApiResponse } from '@/lib/apiResponse';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, name } = body;

    console.log('=== Fixing Signup User ===');
    console.log('Request data:', { userId, email, name });

    if (!userId) {
      return createApiResponse({
        success: false,
        error: 'User ID is required',
        status: 400,
      });
    }

    // Check if user exists in User model
    let user = await User.findOne({ 
      $or: [
        { _id: userId },
        { userId: userId }
      ]
    });

    if (user) {
      console.log('✅ User already exists in User model:', user.email);
      return createApiResponse({
        success: true,
        data: {
          user: user,
          action: 'already_exists',
          message: 'User already exists in User model'
        }
      });
    }

    // Get user data from basic users collection
    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");
    
    const basicUser = await usersCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(userId) 
    });

    if (!basicUser) {
      console.log('❌ User not found in basic users collection');
      return createApiResponse({
        success: false,
        error: 'User not found in any collection',
        status: 404,
      });
    }

    console.log('📋 Found user in basic collection:', {
      _id: basicUser._id.toString(),
      email: basicUser.email,
      name: basicUser.name
    });

    // Create user in User model with proper schema
    const newUser = await User.create({
      _id: basicUser._id,
      userId: basicUser._id, // Set userId same as _id for consistency
      email: basicUser.email,
      name: basicUser.name || name || "User",
      uniqueId: `user_${Date.now()}`,
      status: "ACTIVE",
      country: "",
      dob: "",
      mobile: "",
      profileImage: "",
      profileCreatedOn: new Date().toISOString(),
      about: `Profile for ${basicUser.name || name || "User"}`,
      designation: "User",
      companyName: "",
    });

    console.log('✅ Created user in User model:', {
      _id: newUser._id?.toString(),
      userId: newUser.userId?.toString(),
      email: newUser.email,
      name: newUser.name
    });

    return createApiResponse({
      success: true,
      data: {
        user: newUser,
        action: 'created',
        message: 'User successfully created in User model'
      }
    });

  } catch (error) {
    console.error('Error fixing signup user:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fix signup user',
      status: 500,
    });
  }
}

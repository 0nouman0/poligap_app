import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/users.model';
import Member from '@/models/members.model';
import { createApiResponse } from '@/lib/apiResponse';
import mongoose from 'mongoose';
import { requireAuth } from '@/lib/rbac';

// POST - Create a user with the exact ID that's failing
export async function POST(req: NextRequest) {
  try {
    // Require authentication
    await requireAuth();
    
    const { userId } = await req.json();
    
    if (!userId) {
      return createApiResponse({
        success: false,
        error: 'User ID is required',
        status: 400,
      });
    }

    console.log(`🔧 Creating user with ID: ${userId}`);

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { userId: new mongoose.Types.ObjectId(userId) },
        { _id: new mongoose.Types.ObjectId(userId) }
      ]
    });

    if (existingUser) {
      console.log('✅ User already exists!');
      return createApiResponse({
        success: true,
        data: existingUser,
      });
    }

    // Create new user with the exact failing ID
    const newUser = await User.create({
      _id: new mongoose.Types.ObjectId(userId), // Use the failing ID as _id
      userId: new mongoose.Types.ObjectId(userId), // Also set as userId
      uniqueId: `user_${Date.now()}`,
      email: 'user@poligap.com',
      name: 'Poligap User',
      status: 'ACTIVE',
      country: 'United States',
      dob: '1990-01-01',
      mobile: '+1-555-0123',
      profileImage: '',
      about: 'Welcome to Poligap! This is your profile.',
      banner: {
        image: 'https://images.unsplash.com/photo-1554034483-04fda0d3507b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        color: '#3b82f6',
        type: 'image',
        yOffset: 0
      },
      profileCreatedOn: new Date().toISOString(),
    });

    console.log('✅ User created successfully!');

    return createApiResponse({
      success: true,
      data: newUser,
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
      status: 500,
    });
  }
}

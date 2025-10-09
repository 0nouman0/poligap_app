import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/users.model';
import { createApiResponse } from '@/lib/apiResponse';
import mongoose from 'mongoose';
import { requireAuth } from '@/lib/rbac';

// POST - Ensure user exists with proper ID format
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth();
    
    const { userId } = await request.json();
    
    console.log('🔧 Ensuring user exists with ID:', userId);

    if (!userId || userId === "undefined" || userId === "null") {
      return createApiResponse({
        success: false,
        error: 'Valid user ID is required',
        status: 400,
      });
    }

    // Check if user already exists
    let existingUser = null;
    
    try {
      // Try finding by _id first
      existingUser = await User.findById(userId);
      if (existingUser) {
        console.log('✅ User found by _id');
        return createApiResponse({
          success: true,
          data: existingUser,
        });
      }
    } catch (error) {
      console.log('User not found by _id, trying userId field');
    }

    try {
      // Try finding by userId field
      existingUser = await User.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      if (existingUser) {
        console.log('✅ User found by userId field');
        return createApiResponse({
          success: true,
          data: existingUser,
        });
      }
    } catch (error) {
      console.log('User not found by userId field either');
    }

    // Create new user with the provided ID
    console.log('🔧 Creating new user with ID:', userId);
    const newUser = await User.create({
      _id: new mongoose.Types.ObjectId(userId),
      userId: new mongoose.Types.ObjectId(userId),
      uniqueId: `user_${Date.now()}`,
      email: `user-${userId.slice(-8)}@poligap.com`,
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

    console.log('✅ User created successfully with ID:', newUser._id);

    return createApiResponse({
      success: true,
      data: newUser,
    });
  } catch (error) {
    console.error('❌ Error ensuring user exists:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to ensure user exists',
      status: 500,
    });
  }
}

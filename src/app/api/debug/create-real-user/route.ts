import { NextRequest } from 'next/server';
import User from '@/models/users.model';
import { createApiResponse } from '@/lib/apiResponse';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, designation, companyName, userId } = body;

    console.log('=== Creating Real User ===');
    console.log('Request data:', { name, email, designation, companyName, userId });

    // Validate required fields
    if (!name || !email) {
      return createApiResponse({
        success: false,
        error: 'Name and email are required',
        status: 400,
      });
    }

    // Check if user already exists with this email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Update existing user with real data
      const updatedUser = await User.findOneAndUpdate(
        { email },
        {
          name,
          email,
          designation: designation || 'User',
          companyName: companyName || 'Company',
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
        { new: true }
      ).lean();

      console.log('✅ Updated existing user:', updatedUser);

      return createApiResponse({
        success: true,
        data: {
          user: updatedUser,
          action: 'updated',
          message: 'Existing user updated with real data'
        }
      });
    }

    // Create new user with real data
    const newUserId = userId || new mongoose.Types.ObjectId();
    const newUser = await User.create({
      _id: new mongoose.Types.ObjectId(),
      userId: newUserId,
      uniqueId: `user_${Date.now()}`,
      name,
      email,
      designation: designation || 'User',
      companyName: companyName || 'Company',
      status: 'ACTIVE',
      country: 'United States',
      mobile: '',
      profileImage: '',
      about: `Profile for ${name}`,
      profileCreatedOn: new Date().toISOString(),
    });

    console.log('✅ Created new real user:', newUser);

    return createApiResponse({
      success: true,
      data: {
        user: newUser,
        action: 'created',
        message: 'New real user created successfully'
      }
    });

  } catch (error) {
    console.error('Error creating real user:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create real user',
      status: 500,
    });
  }
}

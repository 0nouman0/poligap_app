import { NextRequest } from 'next/server';
import User from '@/models/users.model';
import { createApiResponse } from '@/lib/apiResponse';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, email, designation, companyName } = body;

    console.log('=== Updating Current User with Real Data ===');
    console.log('Request data:', { userId, name, email, designation, companyName });

    // Validate required fields
    if (!userId || !name || !email) {
      return createApiResponse({
        success: false,
        error: 'User ID, name, and email are required',
        status: 400,
      });
    }

    // Try to find user by multiple methods
    let user = null;
    
    // Method 1: Find by _id
    try {
      user = await User.findById(userId);
      console.log('Found user by _id:', user ? 'YES' : 'NO');
    } catch (e) {
      console.log('_id search failed, trying other methods...');
    }
    
    // Method 2: Find by userId field
    if (!user) {
      user = await User.findOne({ userId: userId });
      console.log('Found user by userId field:', user ? 'YES' : 'NO');
    }
    
    // Method 3: Find by email (if it's the mock email)
    if (!user) {
      user = await User.findOne({ email: 'chat-user@poligap.com' });
      console.log('Found user by mock email:', user ? 'YES' : 'NO');
    }

    if (!user) {
      return createApiResponse({
        success: false,
        error: `User not found with ID: ${userId}`,
        status: 404,
      });
    }

    // Update user with real data
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        name,
        email,
        designation: designation || 'User',
        companyName: companyName || 'Company',
        status: 'ACTIVE',
        updatedAt: new Date(),
        about: `Profile for ${name}`,
      },
      { new: true }
    ).lean();

    console.log('✅ Updated user with real data:', {
      _id: updatedUser?._id?.toString(),
      name: updatedUser?.name,
      email: updatedUser?.email,
      designation: updatedUser?.designation,
      companyName: updatedUser?.companyName
    });

    return createApiResponse({
      success: true,
      data: {
        user: updatedUser,
        action: 'updated',
        message: 'User updated with real data successfully'
      }
    });

  } catch (error) {
    console.error('Error updating current user:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user',
      status: 500,
    });
  }
}

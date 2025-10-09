import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

export async function PUT(request: NextRequest) {
  try {
    console.log('=== Update Profile API ===');
    
    const body = await request.json();
    const { userId, profileData } = body;

    console.log('userId:', userId);
    console.log('profileData:', profileData);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!profileData) {
      return NextResponse.json(
        { success: false, error: 'Profile data is required' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db('poligap');
    const usersCollection = db.collection('users');

    // Prepare update data with timestamp - only include non-empty fields
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Only add fields that have actual values
    Object.keys(profileData).forEach(key => {
      const value = profileData[key];
      if (value !== null && value !== undefined && value !== '') {
        updateData[key] = value;
      }
    });

    console.log('Final update data:', updateData);

    // Update user profile with partial update
    const result = await usersCollection.updateOne(
      { userId: userId },
      { 
        $set: updateData,
        $setOnInsert: {
          userId: userId,
          createdAt: new Date().toISOString(),
        }
      },
      { upsert: true }
    );

    console.log('✅ Profile updated successfully');
    console.log('Update result:', result);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        userId,
        ...updateData,
      }
    });

  } catch (error) {
    console.error('❌ Error updating profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

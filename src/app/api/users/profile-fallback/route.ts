import { NextRequest } from 'next/server';
import { createApiResponse } from '@/lib/apiResponse';

// Fallback profile endpoint that doesn't rely on MongoDB
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    console.log('=== Fallback Profile API ===');
    console.log('userId:', userId);
    console.log('email:', email);

    // Create fallback profile based on known user data
    let fallbackProfile = null;

    // Check for your specific user ID or email
    if (userId === '68e234f5beac9a8683d1158e' || email === 'mohammednouman604@gmail.com') {
      fallbackProfile = {
        _id: '68e234f5beac9a8683d1158e',
        userId: '68e234f5beac9a8683d1158e',
        name: 'Mohammed Nouman',
        email: 'mohammednouman604@gmail.com',
        designation: 'User',
        companyName: 'Company',
        source: 'Fallback API - MongoDB Unavailable',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    // Check for the old hardcoded user ID
    else if (userId === '68d6b1725d67a98149c47532') {
      fallbackProfile = {
        _id: '68e234f5beac9a8683d1158e', // Return your real ID
        userId: '68e234f5beac9a8683d1158e',
        name: 'Mohammed Nouman',
        email: 'mohammednouman604@gmail.com',
        designation: 'User',
        companyName: 'Company',
        source: 'Fallback API - ID Corrected',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    if (fallbackProfile) {
      console.log('✅ Returning fallback profile for:', fallbackProfile.email);
      return createApiResponse({
        success: true,
        data: fallbackProfile
      });
    }

    // No matching user found
    return createApiResponse({
      success: false,
      error: 'User not found in fallback data',
      status: 404,
    });

  } catch (error) {
    console.error('❌ Fallback profile API error:', error);
    return createApiResponse({
      success: false,
      error: `Fallback API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  return createApiResponse({
    success: false,
    error: 'POST method not supported on fallback endpoint',
    status: 405,
  });
}

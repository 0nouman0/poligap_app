import { NextRequest } from 'next/server';
import { createApiResponse } from '@/lib/apiResponse';
import User from '@/models/users.model';

export async function GET(req: NextRequest) {
  try {
    console.log('=== Getting Current Logged-in User ===');
    
    // Get the access token from headers or query params
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '') || 
                       req.nextUrl.searchParams.get('accessToken');
    
    if (!accessToken) {
      return createApiResponse({
        success: false,
        error: 'Access token is required. Please provide it in Authorization header or as accessToken query param.',
        status: 401,
      });
    }

    console.log('Using access token:', accessToken.substring(0, 20) + '...');

    // Simple user lookup - for debug purposes, return a basic user
    console.log('Debug: Returning basic user info');
    
    const debugUser = {
      _id: process.env.FALLBACK_USER_ID || '68e234f5beac9a8683d1158e',
      userId: process.env.FALLBACK_USER_ID || '68e234f5beac9a8683d1158e',
      name: process.env.FALLBACK_USER_NAME || 'Default User',
      email: process.env.FALLBACK_USER_EMAIL || 'user@example.com',
      designation: 'User',
      companyName: 'Company'
    };

    console.log('Current logged-in user:', {
      userId: debugUser.userId,
      email: debugUser.email,
      name: debugUser.name
    });

    return createApiResponse({
      success: true,
      data: {
        userId: debugUser.userId,
        email: debugUser.email,
        name: debugUser.name,
        _id: debugUser._id,
        designation: debugUser.designation,
        companyName: debugUser.companyName,
        message: 'Debug user retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Error getting current user:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get current user',
      status: 500,
    });
  }
}

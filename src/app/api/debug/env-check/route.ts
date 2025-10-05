import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        MONGODB_URI: !!process.env.MONGODB_URI,
        PORTKEY_API_KEY: !!process.env.PORTKEY_API_KEY,
        OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
        NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        REDIS_URL: !!process.env.REDIS_URL,
        AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
        AWS_REGION: process.env.AWS_REGION,
      },
      timestamp: new Date().toISOString(),
      message: 'Environment variables check - true means variable exists, false means missing'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check environment variables',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

import { NextRequest } from 'next/server';
import { createApiResponse } from '@/lib/apiResponse';
import User from '@/models/users.model';
import { requireAuth } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  try {
    // Require authentication
    await requireAuth();
    
    console.log('🔍 Testing MongoDB connection health...');
    
    const startTime = Date.now();
    
    // Test basic connection
    const connectionState = User.db.readyState;
    const stateNames: { [key: number]: string } = {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    };
    console.log('Connection state:', stateNames[connectionState] || 'unknown');
    
    if (connectionState !== 1) {
      return createApiResponse({
        success: false,
        error: `MongoDB not connected. State: ${connectionState}`,
        status: 503,
      });
    }
    
    // Test a simple query with timeout
    const userCount = await User.countDocuments().maxTimeMS(5000);
    const queryTime = Date.now() - startTime;
    
    console.log(`✅ MongoDB health check passed in ${queryTime}ms`);
    console.log(`📊 Total users in database: ${userCount}`);
    
    return createApiResponse({
      success: true,
      data: {
        status: 'healthy',
        connectionState: 'connected',
        queryTime: `${queryTime}ms`,
        userCount,
        database: User.db.name,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ MongoDB health check failed:', error);
    
    return createApiResponse({
      success: false,
      error: `MongoDB health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 503,
    });
  }
}

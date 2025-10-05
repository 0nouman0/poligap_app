import { NextRequest } from 'next/server';
import { createApiResponse } from '@/lib/apiResponse';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    console.log('=== Database Debug Info ===');
    
    // Check default mongoose connection
    const defaultState = mongoose.connection.readyState;
    console.log('Default mongoose state:', defaultState);
    console.log('Default mongoose states: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting');
    
    // Check if we can connect
    if (defaultState !== 1) {
      const mongoUri = process.env.MONGODB_URI;
      console.log('MongoDB URI exists:', !!mongoUri);
      console.log('MongoDB URI format:', mongoUri ? mongoUri.substring(0, 20) + '...' : 'MISSING');
    }

    // Try a simple connection test
    let connectionTest = 'Not tested';
    try {
      if (defaultState === 1) {
        // Test with a simple operation
        const db = mongoose.connection.db;
        if (db) {
          const collections = await db.listCollections().toArray();
          connectionTest = `Connected! Found ${collections.length} collections`;
          console.log('Collections:', collections.map(c => c.name));
        } else {
          connectionTest = 'Connected but database object not available';
        }
      } else {
        connectionTest = 'Not connected';
      }
    } catch (error) {
      connectionTest = `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return createApiResponse({
      success: true,
      data: {
        defaultMongooseState: defaultState,
        connectionTest,
        mongoUri: process.env.MONGODB_URI ? 'EXISTS' : 'MISSING',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Database debug error:', error);
    return createApiResponse({
      success: false,
      error: `Debug failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 500,
    });
  }
}

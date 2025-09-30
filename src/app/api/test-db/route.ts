import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/users.model';
import Member from '@/models/members.model';
import Company from '@/models/companies.model';
import { createApiResponse } from '@/lib/apiResponse';

// GET - Test MongoDB Atlas connection and show real data
export async function GET(req: NextRequest) {
  try {
    // Test database connection by counting documents
    const userCount = await User.countDocuments();
    const memberCount = await Member.countDocuments();
    const companyCount = await Company.countDocuments();

    // Get sample data to understand structure
    const sampleUser = await User.findOne().lean();
    const sampleMember = await Member.findOne().lean();
    const sampleCompany = await Company.findOne().lean();

    // Get all users to see what's available
    const allUsers = await User.find({}).limit(10).lean();

    const connectionInfo = {
      status: 'Connected to MongoDB Atlas',
      database: 'poligap',
      collections: {
        users: {
          count: userCount,
          sample: sampleUser ? {
            _id: sampleUser._id?.toString(),
            userId: sampleUser.userId?.toString(),
            email: sampleUser.email,
            name: sampleUser.name,
            status: sampleUser.status
          } : null
        },
        members: {
          count: memberCount,
          sample: sampleMember ? {
            _id: sampleMember._id?.toString(),
            userId: sampleMember.userId?.toString(),
            companyId: sampleMember.companyId?.toString(),
            role: sampleMember.role,
            status: sampleMember.status
          } : null
        },
        companies: {
          count: companyCount,
          sample: sampleCompany ? {
            _id: sampleCompany._id?.toString(),
            name: sampleCompany.name,
            companyId: sampleCompany.companyId?.toString()
          } : null
        }
      },
      allUsers: allUsers.map(user => ({
        _id: user._id?.toString(),
        userId: user.userId?.toString(),
        email: user.email,
        name: user.name,
        status: user.status
      }))
    };

    return createApiResponse({
      success: true,
      data: connectionInfo,
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Database connection failed',
      status: 500,
    });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse } from '@/lib/apiResponse';
import DocumentAnalysisModel from '@/models/documentAnalysis.model';
import SearchHistorysModel from '@/models/searchHistory.model';
import AuditLogModel from '@/models/auditLog.model';
import FlaggedIssueModel from '@/models/flaggedIssue.model';
import UserModel from '@/models/users.model';
import mongoose from 'mongoose';

// POST - Seed dashboard with sample data
export async function POST(req: NextRequest) {
  try {
    const { userId, companyId } = await req.json();
    
    console.log('🌱 Seeding dashboard data for userId:', userId);

    if (!userId) {
      return createApiResponse({
        success: false,
        error: 'User ID is required',
        status: 400,
      });
    }

    // Ensure user exists
    let user = await UserModel.findById(userId);
    if (!user) {
      user = await UserModel.create({
        _id: new mongoose.Types.ObjectId(userId),
        userId: new mongoose.Types.ObjectId(userId),
        uniqueId: `user_${Date.now()}`,
        email: 'demo@poligap.com',
        name: 'Demo User',
        status: 'ACTIVE',
        profileCreatedOn: new Date().toISOString(),
      });
    }

    const actualCompanyId = companyId || "60f1b2b3c4d5e6f7a8b9c0d1";

    // Generate sample data for the last 30 days
    const sampleData = [];
    const complianceStandards = ['HIPAA', 'GDPR', 'CCPA', 'SOX', 'PCI DSS', 'ISO 27001'];
    const searchTypes = ['document', 'policy', 'contract', 'regulation'];
    const documentTypes = ['Contract', 'Policy Document', 'Compliance Report', 'Legal Brief'];

    // Create sample searches (last 30 days)
    for (let i = 0; i < 25; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      const searchTerms = [
        'HIPAA compliance requirements',
        'GDPR data protection',
        'Contract review process',
        'Privacy policy updates',
        'Security audit checklist',
        'Regulatory compliance',
        'Data breach procedures',
        'Employee handbook',
        'Vendor agreements',
        'Risk assessment'
      ];

      const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
      const randomType = searchTypes[Math.floor(Math.random() * searchTypes.length)];

      await SearchHistorysModel.create({
        enterpriseUserId: userId,
        companyId: actualCompanyId,
        text: [{
          title: randomTerm,
          description: `Search for ${randomTerm}`,
          type: randomType
        }],
        createdAt,
        updatedAt: createdAt
      });
    }

    // Create sample document analyses
    for (let i = 0; i < 15; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      const randomStandard = complianceStandards[Math.floor(Math.random() * complianceStandards.length)];
      const randomDocType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
      const score = Math.floor(Math.random() * 40) + 60; // Score between 60-100

      await DocumentAnalysisModel.create({
        userId,
        companyId: actualCompanyId,
        title: `${randomDocType} Analysis`,
        complianceStandard: randomStandard,
        score,
        status: 'completed',
        findings: [
          {
            type: 'compliance',
            severity: score > 85 ? 'low' : score > 70 ? 'medium' : 'high',
            description: `${randomStandard} compliance analysis completed`,
            recommendation: 'Review and update as needed'
          }
        ],
        createdAt,
        updatedAt: createdAt
      });
    }

    // Create sample audit logs
    const auditActions = [
      'document_uploaded',
      'compliance_check_started',
      'compliance_check_completed',
      'search_performed',
      'report_generated',
      'user_login',
      'settings_updated'
    ];

    for (let i = 0; i < 30; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      const randomAction = auditActions[Math.floor(Math.random() * auditActions.length)];

      await AuditLogModel.create({
        userId,
        companyId: actualCompanyId,
        action: randomAction,
        entityType: 'document',
        entityId: new mongoose.Types.ObjectId(),
        metadata: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ipAddress: '192.168.1.100'
        },
        createdAt,
        updatedAt: createdAt
      });
    }

    // Create sample flagged issues
    const issueReasons = [
      'Missing required clause',
      'Potential compliance violation',
      'Outdated policy reference',
      'Incomplete documentation',
      'Security concern identified'
    ];

    for (let i = 0; i < 8; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      const randomReason = issueReasons[Math.floor(Math.random() * issueReasons.length)];
      const statuses = ['new', 'viewed', 'resolved'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      await FlaggedIssueModel.create({
        userId,
        companyId: actualCompanyId,
        title: `Issue in ${documentTypes[Math.floor(Math.random() * documentTypes.length)]}`,
        reason: randomReason,
        status: randomStatus,
        severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        documentId: new mongoose.Types.ObjectId(),
        createdAt,
        updatedAt: createdAt
      });
    }

    console.log('✅ Dashboard sample data seeded successfully');

    return createApiResponse({
      success: true,
      data: {
        searches: 25,
        analyses: 15,
        auditLogs: 30,
        flaggedIssues: 8
      }
    });

  } catch (error) {
    console.error('❌ Error seeding dashboard data:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to seed dashboard data',
      status: 500,
    });
  }
}

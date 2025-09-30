import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse } from '@/lib/apiResponse';
import DocumentAnalysisModel from '@/models/documentAnalysis.model';
import SearchHistorysModel from '@/models/searchHistory.model';
import AuditLogModel from '@/models/auditLog.model';
import FlaggedIssueModel from '@/models/flaggedIssue.model';

export async function POST(req: NextRequest) {
  try {
    const { userId, companyId } = await req.json();

    if (!userId) {
      return createApiResponse({
        success: false,
        error: 'User ID is required',
        status: 400,
      });
    }

    // Create sample document analyses
    const sampleAnalyses = [
      {
        userId,
        companyId: companyId || userId,
        documentId: 'doc_001',
        title: 'GDPR Compliance Policy',
        complianceStandard: 'GDPR',
        score: 85,
        metrics: { privacy: 90, security: 80, documentation: 85 }
      },
      {
        userId,
        companyId: companyId || userId,
        documentId: 'doc_002',
        title: 'ISO 27001 Security Framework',
        complianceStandard: 'ISO27001',
        score: 92,
        metrics: { security: 95, processes: 90, documentation: 90 }
      },
      {
        userId,
        companyId: companyId || userId,
        documentId: 'doc_003',
        title: 'HIPAA Healthcare Policy',
        complianceStandard: 'HIPAA',
        score: 78,
        metrics: { privacy: 85, security: 75, training: 75 }
      },
      {
        userId,
        companyId: companyId || userId,
        documentId: 'doc_004',
        title: 'SOC2 Audit Report',
        complianceStandard: 'SOC2',
        score: 88,
        metrics: { security: 90, availability: 85, processing: 90 }
      }
    ];

    // Create sample search history
    const sampleSearches = [
      {
        text: [
          { title: 'GDPR compliance requirements', description: 'Search for GDPR compliance documentation', type: 'compliance' },
          { title: 'data privacy policies', description: 'Privacy policy templates', type: 'policy' }
        ],
        enterpriseUserId: userId,
        companyId: companyId || userId
      },
      {
        text: [
          { title: 'ISO 27001 security controls', description: 'Security control frameworks', type: 'security' },
          { title: 'risk assessment templates', description: 'Risk management documentation', type: 'risk' }
        ],
        enterpriseUserId: userId,
        companyId: companyId || userId
      },
      {
        text: [
          { title: 'contract review checklist', description: 'Legal contract review process', type: 'contract' },
          { title: 'vendor agreements', description: 'Third-party vendor contracts', type: 'legal' }
        ],
        enterpriseUserId: userId,
        companyId: companyId || userId
      },
      {
        text: [
          { title: 'HIPAA training materials', description: 'Healthcare compliance training', type: 'training' },
          { title: 'patient data handling', description: 'Medical data privacy procedures', type: 'healthcare' }
        ],
        enterpriseUserId: userId,
        companyId: companyId || userId
      }
    ];

    // Create sample audit logs
    const sampleAuditLogs = [
      {
        userId,
        companyId: companyId || userId,
        action: 'document_analyzed',
        entityType: 'document',
        entityId: 'doc_001',
        metadata: { standard: 'GDPR', score: 85 }
      },
      {
        userId,
        companyId: companyId || userId,
        action: 'search_performed',
        entityType: 'search',
        entityId: 'search_001',
        metadata: { query: 'GDPR compliance', results: 15 }
      },
      {
        userId,
        companyId: companyId || userId,
        action: 'compliance_check',
        entityType: 'document',
        entityId: 'doc_002',
        metadata: { standard: 'ISO27001', passed: true }
      },
      {
        userId,
        companyId: companyId || userId,
        action: 'contract_reviewed',
        entityType: 'contract',
        entityId: 'contract_001',
        metadata: { issues_found: 3, suggestions: 7 }
      },
      {
        userId,
        companyId: companyId || userId,
        action: 'policy_updated',
        entityType: 'policy',
        entityId: 'policy_001',
        metadata: { changes: 5, approved: true }
      }
    ];

    // Create sample flagged issues
    const sampleFlaggedIssues = [
      {
        userId,
        companyId: companyId || userId,
        status: 'new',
        reason: 'Missing data retention clause',
        name: 'John Doe',
        email: 'john.doe@company.com',
        note: 'Contract lacks proper data retention specifications for GDPR compliance',
        date: new Date(),
        link: '/contract-review/doc_001',
        title: 'GDPR Data Retention Issue'
      },
      {
        userId,
        companyId: companyId || userId,
        status: 'viewed',
        reason: 'Insufficient security controls',
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        note: 'Security framework missing multi-factor authentication requirements',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        link: '/compliance-check/doc_002',
        title: 'ISO 27001 Security Gap'
      },
      {
        userId,
        companyId: companyId || userId,
        status: 'resolved',
        reason: 'Outdated privacy policy',
        name: 'Mike Johnson',
        email: 'mike.johnson@company.com',
        note: 'Privacy policy updated to reflect current CCPA requirements',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        link: '/policy-generator/privacy',
        title: 'CCPA Privacy Policy Update'
      }
    ];

    // Insert sample data
    await Promise.all([
      DocumentAnalysisModel.insertMany(sampleAnalyses),
      SearchHistorysModel.insertMany(sampleSearches),
      AuditLogModel.insertMany(sampleAuditLogs),
      FlaggedIssueModel.insertMany(sampleFlaggedIssues)
    ]);

    return createApiResponse({
      success: true,
      message: 'Sample analytics data created successfully',
      data: {
        analyses: sampleAnalyses.length,
        searches: sampleSearches.length,
        auditLogs: sampleAuditLogs.length,
        flaggedIssues: sampleFlaggedIssues.length
      }
    });

  } catch (error) {
    console.error('Error seeding analytics data:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to seed analytics data',
      status: 500,
    });
  }
}

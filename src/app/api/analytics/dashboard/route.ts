import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse } from '@/lib/apiResponse';
import DocumentAnalysisModel from '@/models/documentAnalysis.model';
import SearchHistorysModel from '@/models/searchHistory.model';
import AuditLogModel from '@/models/auditLog.model';
import FlaggedIssueModel from '@/models/flaggedIssue.model';
import UserModel from '@/models/users.model';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const companyId = searchParams.get('companyId');
    const timeRange = searchParams.get('timeRange') || '30'; // days

    if (!userId) {
      return createApiResponse({
        success: false,
        error: 'User ID is required',
        status: 400,
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Run all analytics queries in parallel
    const [
      totalSearches,
      recentSearches,
      totalDocumentAnalyses,
      complianceAnalyses,
      auditLogs,
      flaggedIssues,
      topSearchTerms,
      complianceScores,
      activityTrends
    ] = await Promise.all([
      // Total searches
      SearchHistorysModel.countDocuments({
        enterpriseUserId: userId,
        ...(companyId && { companyId }),
        createdAt: { $gte: startDate }
      }),

      // Recent searches for activity feed
      SearchHistorysModel.find({
        enterpriseUserId: userId,
        ...(companyId && { companyId }),
        createdAt: { $gte: startDate }
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),

      // Total document analyses
      DocumentAnalysisModel.countDocuments({
        userId,
        ...(companyId && { companyId }),
        createdAt: { $gte: startDate }
      }),

      // Compliance analyses with scores
      DocumentAnalysisModel.find({
        userId,
        ...(companyId && { companyId }),
        createdAt: { $gte: startDate }
      })
      .select('complianceStandard score title createdAt')
      .lean(),

      // Audit logs for activity tracking
      AuditLogModel.find({
        userId,
        ...(companyId && { companyId }),
        createdAt: { $gte: startDate }
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),

      // Flagged issues
      FlaggedIssueModel.find({
        userId,
        ...(companyId && { companyId }),
        createdAt: { $gte: startDate }
      })
      .lean(),

      // Top search terms aggregation
      SearchHistorysModel.aggregate([
        {
          $match: {
            enterpriseUserId: userId,
            ...(companyId && { companyId }),
            createdAt: { $gte: startDate }
          }
        },
        { $unwind: '$text' },
        {
          $group: {
            _id: '$text.title',
            count: { $sum: 1 },
            type: { $first: '$text.type' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Compliance scores aggregation
      DocumentAnalysisModel.aggregate([
        {
          $match: {
            userId,
            ...(companyId && { companyId }),
            createdAt: { $gte: startDate },
            score: { $exists: true }
          }
        },
        {
          $group: {
            _id: '$complianceStandard',
            averageScore: { $avg: '$score' },
            count: { $sum: 1 },
            minScore: { $min: '$score' },
            maxScore: { $max: '$score' }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Activity trends (daily activity for the past 30 days)
      AuditLogModel.aggregate([
        {
          $match: {
            userId,
            ...(companyId && { companyId }),
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              action: '$action'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            activities: {
              $push: {
                action: '$_id.action',
                count: '$count'
              }
            },
            totalCount: { $sum: '$count' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Calculate key metrics
    const totalFlaggedIssues = flaggedIssues.length;
    const newFlaggedIssues = flaggedIssues.filter((issue: any) => issue.status === 'new').length;
    const resolvedFlaggedIssues = flaggedIssues.filter((issue: any) => issue.status === 'resolved').length;

    const averageComplianceScore = complianceAnalyses.length > 0 
      ? complianceAnalyses.reduce((sum: number, analysis: any) => sum + (analysis.score || 0), 0) / complianceAnalyses.length
      : 0;

    // Recent activity combining searches, analyses, and audit logs
    const recentActivity = [
      ...recentSearches.map((search: any) => ({
        title: search.text?.[0]?.title || 'Search performed',
        description: search.text?.[0]?.description || 'Document search',
        timestamp: search.createdAt,
        metadata: { searchType: search.text?.[0]?.type }
      })),
      ...complianceAnalyses.slice(0, 10).map((analysis: any) => ({
        type: 'analysis',
        title: analysis.title || 'Document Analysis',
        description: `${analysis.complianceStandard} compliance check - Score: ${analysis.score || 'N/A'}`,
        timestamp: analysis.createdAt,
        metadata: { 
          standard: analysis.complianceStandard, 
          score: analysis.score 
        }
      })),
      ...auditLogs.slice(0, 5).map((log: any) => ({
        type: 'audit',
        title: log.action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        description: log.entityType ? `${log.entityType} activity` : 'System activity',
        timestamp: log.createdAt,
        metadata: log.metadata
      }))
    ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);

    // Prepare analytics response
    const analytics = {
      overview: {
        totalSearches,
        totalDocumentAnalyses,
        totalFlaggedIssues,
        averageComplianceScore: Math.round(averageComplianceScore * 100) / 100,
        newFlaggedIssues,
        resolvedFlaggedIssues,
        timeRange: parseInt(timeRange)
      },
      
      searches: {
        total: totalSearches,
        topSearchTerms: topSearchTerms.map((term: any) => ({
          term: term._id,
          count: term.count,
          type: term.type
        }))
      },

      compliance: {
        totalAnalyses: totalDocumentAnalyses,
        averageScore: Math.round(averageComplianceScore * 100) / 100,
        byStandard: complianceScores.map((score: any) => ({
          standard: score._id || 'Unknown',
          averageScore: Math.round(score.averageScore * 100) / 100,
          count: score.count,
          minScore: score.minScore,
          maxScore: score.maxScore
        })),
        recentAnalyses: complianceAnalyses.slice(0, 5).map((analysis: any) => ({
          title: analysis.title,
          standard: analysis.complianceStandard,
          score: analysis.score,
          date: analysis.createdAt
        }))
      },

      flaggedIssues: {
        total: totalFlaggedIssues,
        new: newFlaggedIssues,
        resolved: resolvedFlaggedIssues,
        byStatus: {
          new: newFlaggedIssues,
          viewed: flaggedIssues.filter((issue: any) => issue.status === 'viewed').length,
          resolved: resolvedFlaggedIssues,
          rejected: flaggedIssues.filter((issue: any) => issue.status === 'rejected').length,
          newIssues: flaggedIssues.filter((issue: any) => issue.status === 'new' && new Date(issue.createdAt) >= startDate).length
        },
        recent: flaggedIssues.slice(0, 5).map((issue: any) => ({
          title: issue.title,
          reason: issue.reason,
          status: issue.status,
          date: issue.createdAt
        }))
      },

      activity: {
        recent: recentActivity,
        trends: activityTrends.map((trend: any) => ({
          date: trend._id,
          totalActivities: trend.totalCount,
          breakdown: trend.activities
        }))
      }
    };

    return createApiResponse({
      success: true,
      data: analytics,
    });

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics',
      status: 500,
    });
  }
}

/**
 * Example: Dashboard Analytics Query
 * 
 * This demonstrates how to use TanStack Query for the dashboard analytics.
 * Replace the existing fetch logic in dashboard/page.tsx with this pattern.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../query-keys';

// Types
interface AnalyticsData {
  overview: {
    totalSearches: number;
    totalDocumentAnalyses: number;
    totalFlaggedIssues: number;
    averageComplianceScore: number;
    newFlaggedIssues: number;
    resolvedFlaggedIssues: number;
    timeRange: number;
  };
  searches: {
    total: number;
    topTerms: Array<{ term: string; count: number; type: string }>;
  };
  compliance: {
    totalAnalyses: number;
    averageScore: number;
    byStandard: Array<{
      standard: string;
      averageScore: number;
      count: number;
      minScore: number;
      maxScore: number;
    }>;
    recentAnalyses: Array<{
      title: string;
      standard: string;
      score: number;
      date: string;
    }>;
  };
  flaggedIssues: {
    total: number;
    new: number;
    resolved: number;
    byStatus: {
      new: number;
      viewed: number;
      resolved: number;
      rejected: number;
    };
    recent: Array<{
      title: string;
      reason: string;
      status: string;
      date: string;
    }>;
  };
  activity: {
    recent: Array<{
      type: string;
      title: string;
      description: string;
      timestamp: string;
      metadata?: any;
    }>;
    trends: Array<{
      date: string;
      totalActivities: number;
      breakdown: Array<{ action: string; count: number }>;
    }>;
  };
}

/**
 * Fetch dashboard analytics
 */
async function fetchDashboardAnalytics(
  userId: string,
  companyId: string,
  timeRange: string
): Promise<AnalyticsData> {
  const response = await fetch(
    `/api/analytics/dashboard?userId=${userId}&companyId=${companyId}&timeRange=${timeRange}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch analytics');
  }

  return result.data;
}

/**
 * Hook to fetch dashboard analytics with TanStack Query
 * 
 * @example
 * const { data, isLoading, error } = useDashboardAnalytics(userId, companyId, timeRange);
 */
export function useDashboardAnalytics(
  userId: string,
  companyId: string,
  timeRange: string = '30'
) {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard(userId, companyId, timeRange),
    queryFn: () => fetchDashboardAnalytics(userId, companyId, timeRange),
    enabled: !!userId && !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch search analytics
 */
export function useSearchAnalytics(timeRange: string = '30') {
  return useQuery({
    queryKey: queryKeys.analytics.searches(timeRange),
    queryFn: async () => {
      const response = await fetch(`/api/analytics/searches?timeRange=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch search analytics');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch compliance analytics
 */
export function useComplianceAnalytics(timeRange: string = '30') {
  return useQuery({
    queryKey: queryKeys.analytics.compliance(timeRange),
    queryFn: async () => {
      const response = await fetch(`/api/analytics/compliance?timeRange=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch compliance analytics');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * HOW TO USE IN DASHBOARD COMPONENT
 * 
 * Replace the existing useEffect and fetch logic in dashboard/page.tsx with:
 * 
 * ```typescript
 * import { useDashboardAnalytics } from '@/lib/queries/useDashboardAnalytics';
 * 
 * export default function DashboardPage() {
 *   const { userData } = useUserStore();
 *   const [timeRange, setTimeRange] = useState('30');
 * 
 *   const userId = userData?.userId || localStorage.getItem('user_id') || 'default';
 *   const companyId = "60f1b2b3c4d5e6f7a8b9c0d1";
 * 
 *   // Replace useState + useEffect with this single hook
 *   const { 
 *     data: analytics, 
 *     isLoading, 
 *     error,
 *     refetch 
 *   } = useDashboardAnalytics(userId, companyId, timeRange);
 * 
 *   // Loading state
 *   if (isLoading) {
 *     return <DashboardSkeleton />;
 *   }
 * 
 *   // Error state
 *   if (error) {
 *     return <ErrorMessage error={error} />;
 *   }
 * 
 *   // Empty state
 *   if (!analytics || (analytics.overview.totalSearches === 0 && analytics.overview.totalDocumentAnalyses === 0)) {
 *     return <EmptyDashboard />;
 *   }
 * 
 *   // Render dashboard with data
 *   return (
 *     <div>
 *       <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
 *       <AnalyticsOverview data={analytics.overview} />
 *       <TopSearches data={analytics.searches} />
 *       <ComplianceSummary data={analytics.compliance} />
 *     </div>
 *   );
 * }
 * ```
 * 
 * BENEFITS OF THIS APPROACH:
 * 
 * 1. ✅ Automatic caching - data is cached and reused
 * 2. ✅ Background refetching - stale data is refreshed automatically
 * 3. ✅ No manual loading state management
 * 4. ✅ No manual error handling
 * 5. ✅ Automatic retry on failure
 * 6. ✅ TypeScript types for data
 * 7. ✅ DevTools for debugging
 * 8. ✅ Less code, more maintainable
 * 
 * When timeRange changes, the query automatically refetches with the new value.
 * The cache is keyed by userId, companyId, and timeRange, so switching between
 * time ranges uses cached data if available.
 */

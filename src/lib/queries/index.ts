/**
 * TanStack Query Exports
 * 
 * Central export point for all TanStack Query utilities
 */

// Query keys factory
export { queryKeys, invalidateQueries } from './query-keys';
export type { QueryKeys } from './query-keys';

// Utility hooks
export {
  useOptimisticMutation,
  useOptimisticUpdate,
  usePrefetch,
  useInvalidateQueries,
  useUpdateCache,
  useRemoveQuery,
  useGetQueryData,
  useInfiniteQuery,
} from './query-utils';

// Re-export TanStack Query core hooks for convenience
export {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryClient,
} from '@tanstack/react-query';

/**
 * Quick Start Example:
 * 
 * ```typescript
 * import { useQuery, queryKeys } from '@/lib/queries';
 * 
 * const { data, isLoading } = useQuery({
 *   queryKey: queryKeys.tasks.all,
 *   queryFn: fetchTasks,
 * });
 * ```
 * 
 * For more examples, see:
 * - TANSTACK_QUERY_GUIDE.md
 * - TANSTACK_QUERY_CHEATSHEET.md
 * - examples/useDashboardAnalytics.example.ts
 */

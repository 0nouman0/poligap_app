/**
 * TanStack Query Utility Hooks
 * 
 * Common patterns and utilities for React Query
 */

import { useQueryClient, useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { toastSuccess, toastError } from '@/components/toast-varients';

/**
 * Generic mutation hook with automatic cache invalidation
 * 
 * @example
 * const createTask = useOptimisticMutation({
 *   mutationFn: (data) => api.createTask(data),
 *   invalidateKeys: [queryKeys.tasks.all],
 *   successMessage: 'Task created successfully'
 * });
 */
export function useOptimisticMutation<TData = unknown, TVariables = unknown, TError = Error>({
  mutationFn,
  invalidateKeys = [],
  successMessage,
  errorMessage,
  onSuccess,
  onError,
  ...options
}: {
  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidateKeys?: readonly unknown[][];
  successMessage?: string;
  errorMessage?: string;
} & Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>) {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables>({
    mutationFn,
    onSuccess: (data, variables, context) => {
      // Invalidate specified queries
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key as any });
      });

      // Show success toast
      if (successMessage) {
        toastSuccess(successMessage);
      }

      // Call custom onSuccess
  (onSuccess as any)?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Show error toast
      const message = errorMessage || (error instanceof Error ? error.message : 'An error occurred');
      toastError(message);

      // Call custom onError
  (onError as any)?.(error, variables, context);
    },
    ...options,
  });
}

/**
 * Hook to prefetch data
 * 
 * @example
 * const prefetchTask = usePrefetch();
 * prefetchTask(queryKeys.tasks.detail(taskId), () => fetchTask(taskId));
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  return <TData = unknown>(
    queryKey: readonly unknown[],
    queryFn: () => Promise<TData>,
    options?: { staleTime?: number }
  ) => {
    return queryClient.prefetchQuery({
      queryKey: queryKey as any,
      queryFn,
      staleTime: options?.staleTime,
    });
  };
}

/**
 * Hook to manually update query cache
 * 
 * @example
 * const updateCache = useUpdateCache();
 * updateCache(queryKeys.tasks.detail(taskId), (oldData) => ({
 *   ...oldData,
 *   status: 'completed'
 * }));
 */
export function useUpdateCache() {
  const queryClient = useQueryClient();

  return <TData = unknown>(
    queryKey: readonly unknown[],
    updater: (oldData: TData | undefined) => TData
  ) => {
    return queryClient.setQueryData<TData>(queryKey as any, updater);
  };
}

/**
 * Hook to invalidate queries manually
 * 
 * @example
 * const invalidate = useInvalidateQueries();
 * invalidate(queryKeys.tasks.all);
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return (queryKey: readonly unknown[]) => {
    return queryClient.invalidateQueries({ queryKey: queryKey as any });
  };
}

/**
 * Hook to remove query from cache
 * 
 * @example
 * const removeQuery = useRemoveQuery();
 * removeQuery(queryKeys.tasks.detail(taskId));
 */
export function useRemoveQuery() {
  const queryClient = useQueryClient();

  return (queryKey: readonly unknown[]) => {
    return queryClient.removeQueries({ queryKey: queryKey as any });
  };
}

/**
 * Hook to get current query data without subscribing
 * 
 * @example
 * const getQueryData = useGetQueryData();
 * const taskData = getQueryData(queryKeys.tasks.detail(taskId));
 */
export function useGetQueryData() {
  const queryClient = useQueryClient();

  return <TData = unknown>(queryKey: readonly unknown[]): TData | undefined => {
    return queryClient.getQueryData<TData>(queryKey as any);
  };
}

/**
 * Hook for optimistic updates with automatic rollback on error
 * 
 * @example
 * const updateTask = useOptimisticUpdate({
 *   mutationFn: (data) => api.updateTask(data),
 *   queryKey: queryKeys.tasks.detail(taskId),
 *   optimisticData: (oldData, variables) => ({
 *     ...oldData,
 *     ...variables
 *   })
 * });
 */
export function useOptimisticUpdate<TData = unknown, TVariables = unknown, TError = Error>({
  mutationFn,
  queryKey,
  optimisticData,
  invalidateKeys = [],
  successMessage,
  errorMessage,
  onSuccess,
  onError,
  ...options
}: {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: readonly unknown[];
  optimisticData: (oldData: TData | undefined, variables: TVariables) => TData;
  invalidateKeys?: readonly unknown[][];
  successMessage?: string;
  errorMessage?: string;
} & Omit<UseMutationOptions<TData, TError, TVariables, { previousData?: TData }>, 'mutationFn'>) {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables, { previousData?: TData }>({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKey as any });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData>(queryKey as any);

      // Optimistically update to the new value
      if (previousData) {
        queryClient.setQueryData<TData>(
          queryKey as any,
          optimisticData(previousData, variables)
        );
      }

      // Return context with the snapshotted value
      return { previousData };
    },
    onSuccess: (data, variables, context) => {
      // Invalidate and refetch
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key as any });
      });

      // Show success toast
      if (successMessage) {
        toastSuccess(successMessage);
      }

      // Call custom onSuccess
  (onSuccess as any)?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Rollback to the previous value on error
      if (context?.previousData) {
        queryClient.setQueryData<TData>(queryKey as any, context.previousData);
      }

      // Show error toast
      const message = errorMessage || (error instanceof Error ? error.message : 'An error occurred');
      toastError(message);

      // Call custom onError
  (onError as any)?.(error, variables, context);
    },
    ...options,
  });
}

/**
 * Hook for infinite scroll queries
 * 
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteScroll({
 *   queryKey: queryKeys.tasks.list(),
 *   queryFn: ({ pageParam = 0 }) => fetchTasks({ page: pageParam }),
 *   getNextPageParam: (lastPage) => lastPage.nextPage
 * });
 */
export { useInfiniteQuery } from '@tanstack/react-query';

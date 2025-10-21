import { useState, useEffect, useCallback } from 'react';
import { cacheManager, CacheOptions } from '@/lib/cache-manager';

interface UseCacheOptions extends CacheOptions {
  /** Whether to fetch immediately on mount */
  enabled?: boolean;
  /** Function to fetch data if not cached */
  fetcher?: () => Promise<any>;
  /** Callback when data is loaded */
  onSuccess?: (data: any) => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

/**
 * React hook for using cache with automatic fetching
 */
export function useCache<T>(
  key: string,
  options: UseCacheOptions = {}
) {
  const {
    enabled = true,
    fetcher,
    onSuccess,
    onError,
    ttl = 5 * 60 * 1000,
    persistent = false,
    prefix = 'cache',
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled && !force) return;

    // Check cache first
    if (!force) {
      const cached = cacheManager.get<T>(key, { prefix, persistent });
      if (cached !== null) {
        setData(cached);
        onSuccess?.(cached);
        return cached;
      }
    }

    // Fetch if not cached or forced
    if (fetcher) {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetcher();
        
        // Cache the result
        cacheManager.set(key, result, { ttl, persistent, prefix });
        
        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch data');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }
  }, [key, enabled, fetcher, onSuccess, onError, ttl, persistent, prefix]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  const invalidate = useCallback(() => {
    cacheManager.remove(key, { prefix, persistent });
    setData(null);
  }, [key, prefix, persistent]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const mutate = useCallback((newData: T | ((prev: T | null) => T)) => {
    const updatedData = typeof newData === 'function' 
      ? (newData as (prev: T | null) => T)(data) 
      : newData;
    
    setData(updatedData);
    cacheManager.set(key, updatedData, { ttl, persistent, prefix });
  }, [key, data, ttl, persistent, prefix]);

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidate,
    mutate,
  };
}

/**
 * Hook for caching query results with automatic revalidation
 */
export function useCachedQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    refetchOnMount?: boolean;
    refetchInterval?: number;
  } = {}
) {
  const {
    ttl = 5 * 60 * 1000,
    enabled = true,
    refetchOnMount = false,
    refetchInterval,
  } = options;

  const cacheResult = useCache<T>(queryKey, {
    enabled,
    fetcher: queryFn,
    ttl,
    prefix: 'query',
  });

  // Refetch on mount if needed
  useEffect(() => {
    if (refetchOnMount && enabled) {
      cacheResult.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchOnMount, enabled]);

  // Set up interval refetch
  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(() => {
        cacheResult.refetch();
      }, refetchInterval);

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchInterval, enabled]);

  return cacheResult;
}

/**
 * Hook for persistent cache (survives page refresh)
 */
export function usePersistentCache<T>(
  key: string,
  initialValue: T
) {
  const [data, setData] = useState<T>(() => {
    const cached = cacheManager.get<T>(key, { prefix: 'persistent', persistent: true });
    return cached !== null ? cached : initialValue;
  });

  const updateData = useCallback((newData: T | ((prev: T) => T)) => {
    const updatedData = typeof newData === 'function' 
      ? (newData as (prev: T) => T)(data) 
      : newData;
    
    setData(updatedData);
    cacheManager.set(key, updatedData, {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      persistent: true,
      prefix: 'persistent',
    });
  }, [key, data]);

  const clear = useCallback(() => {
    cacheManager.remove(key, { prefix: 'persistent', persistent: true });
    setData(initialValue);
  }, [key, initialValue]);

  return [data, updateData, clear] as const;
}

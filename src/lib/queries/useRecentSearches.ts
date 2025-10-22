/**
 * useRecentSearches Hook - DISABLED
 * 
 * This hook requires Django backend for recent searches.
 * Returns empty data until backend is configured.
 */

export function useRecentSearches() {
  return {
    data: [] as any[],
    isLoading: false,
    error: null
  };
}

/**
 * useSuggestedItems Hook - DISABLED
 * 
 * This hook requires Django backend for suggested items.
 * Returns empty data until backend is configured.
 */

export interface SuggestedItem {
  title: string;
  integration_type: string;
}

export function useSuggestedItems() {
  return {
    data: [] as SuggestedItem[],
    isLoading: false,
    error: null
  };
}

export function useDynamicSuggestions(query: string, delay: number) {
  return {
    data: [] as any[],
    isLoading: false,
    error: null
  };
}

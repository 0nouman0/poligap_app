import { useQuery } from "@tanstack/react-query";
import { withCache, CACHE_KEYS } from '@/lib/cache';

export type ActivityItem = {
  id: string;
  type: "compliance" | "contract" | "policy" | "upload";
  title: string;
  description: string;
  status: "completed" | "in_progress" | "failed";
  timestamp: string;
  fileName?: string;
};

export type OverviewStats = {
  complianceChecks: number;
  contractsReviewed: number;
  policiesGenerated: number;
  trainingModules: number;
};


async function fetchRecentActivity(): Promise<ActivityItem[]> {
  const endpoints = [
    "/api/compliance/recent",
    "/api/contracts/recent",
    "/api/policies/recent",
    "/api/uploads/recent",
  ];

  const results: ActivityItem[] = [];

  // Fetch sequentially to avoid hammering; safe and simple.
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          results.push(...(data as ActivityItem[]).slice(0, 3));
        }
      }
    } catch {
      // ignore endpoint errors; keep results best-effort
    }
  }

  return results
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);
}

// Use withCache to persist recent activity to the shared persistent cache
async function fetchRecentActivityWithCache(): Promise<ActivityItem[]> {
  const key = CACHE_KEYS.RECENT_ACTIVITY();
  return withCache<ActivityItem[]>(key, async () => {
    return await fetchRecentActivity();
  }, 300);
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["home", "recent-activity"],
    queryFn: fetchRecentActivityWithCache,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: [],
  });
}

async function fetchOverviewStats(): Promise<OverviewStats> {
  const fall = { count: 0 } as { count: number };
  
  try {
    const [c, r, p, t] = await Promise.allSettled([
      fetch("/api/compliance/count", { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }).then((res) => {
        if (!res.ok) {
          console.warn('Compliance count API failed:', res.status);
          return fall;
        }
        return res.json();
      }),
      fetch("/api/contracts/count", {
        method: 'GET', 
        headers: { 'Content-Type': 'application/json' }
      }).then((res) => {
        if (!res.ok) {
          console.warn('Contracts count API failed:', res.status);
          return fall;
        }
        return res.json();
      }),
      fetch("/api/policies/count", {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }).then((res) => {
        if (!res.ok) {
          console.warn('Policies count API failed:', res.status);
          return fall;
        }
        return res.json();
      }),
      fetch("/api/training/count", {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }).then((res) => {
        if (!res.ok) {
          console.warn('Training count API failed:', res.status);
          return { count: 5 }; // Default to 5 training modules
        }
        return res.json();
      }),
    ]);

    const result = {
      complianceChecks: c.status === "fulfilled" ? (c.value?.count ?? 0) : 0,
      contractsReviewed: r.status === "fulfilled" ? (r.value?.count ?? 0) : 0,
      policiesGenerated: p.status === "fulfilled" ? (p.value?.count ?? 0) : 0,
      trainingModules: t.status === "fulfilled" ? (t.value?.count ?? 5) : 5,
    };
    
    console.log('Overview stats fetched:', result);
    return result;
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    return {
      complianceChecks: 0,
      contractsReviewed: 0,
      policiesGenerated: 0,
      trainingModules: 5,
    };
  }
}

export function useOverviewStats() {
  return useQuery({
    queryKey: ["home", "overview-stats"],
    queryFn: fetchOverviewStats,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    placeholderData: {
      complianceChecks: 0,
      contractsReviewed: 0,
      policiesGenerated: 0,
      trainingModules: 5, // Show 5 training modules as default
    } satisfies OverviewStats,
  });
}

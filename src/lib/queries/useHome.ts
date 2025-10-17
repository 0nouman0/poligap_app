import { useQuery } from "@tanstack/react-query";

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
    .sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 3);
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["home", "recent-activity"],
    queryFn: fetchRecentActivity,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: [],
  });
}

async function fetchOverviewStats(): Promise<OverviewStats> {
  const fall = { count: 0 } as { count: number };
  const [c, r, p, t] = await Promise.allSettled([
    fetch("/api/compliance/count").then((r) => (r.ok ? r.json() : fall)),
    fetch("/api/contracts/count").then((r) => (r.ok ? r.json() : fall)),
    fetch("/api/policies/count").then((r) => (r.ok ? r.json() : fall)),
    fetch("/api/training/count").then((r) => (r.ok ? r.json() : fall)),
  ]);

  return {
    complianceChecks: c.status === "fulfilled" ? c.value?.count ?? 0 : 0,
    contractsReviewed: r.status === "fulfilled" ? r.value?.count ?? 0 : 0,
    policiesGenerated: p.status === "fulfilled" ? p.value?.count ?? 0 : 0,
    trainingModules: t.status === "fulfilled" ? t.value?.count ?? 0 : 0,
  };
}

export function useOverviewStats() {
  return useQuery({
    queryKey: ["home", "overview-stats"],
    queryFn: fetchOverviewStats,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: {
      complianceChecks: 0,
      contractsReviewed: 0,
      policiesGenerated: 0,
      trainingModules: 0,
    } satisfies OverviewStats,
  });
}

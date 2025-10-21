import { useQuery } from "@tanstack/react-query";

export function useAnalyticsUsage(userId?: string, companyId?: string) {
  return useQuery({
    queryKey: ["analytics-usage", userId, companyId],
    queryFn: async () => {
      const url = new URL("/api/analytics/usage", window.location.origin);
      url.searchParams.set("userId", userId!);
      url.searchParams.set("companyId", companyId!);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load usage analytics");
      return res.json() as Promise<{
        period: string;
        searchCountMonth: number;
        auditCountMonth: number;
        flagged: Record<string, number>;
      }>;
    },
    enabled: !!userId && !!companyId,
    staleTime: 60_000,
  });
}

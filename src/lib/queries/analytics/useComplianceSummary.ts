import { useQuery } from "@tanstack/react-query";

export interface ComplianceSummary {
  averageScore: number | null;
  analyzedCount: number;
  totalAnalyzed: number;
  topCompliances: { name: string; count: number }[];
  topMetricKeys: { key: string; count: number }[];
}

export function useComplianceSummary(userId?: string, companyId?: string, limit = 5) {
  return useQuery({
    queryKey: ["analytics-compliance-summary", userId, companyId, limit],
    queryFn: async () => {
      const url = new URL("/api/analytics/compliance/summary", window.location.origin);
      url.searchParams.set("userId", userId!);
      url.searchParams.set("companyId", companyId!);
      url.searchParams.set("limit", String(limit));
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load compliance summary");
      return (await res.json()) as ComplianceSummary;
    },
    enabled: !!userId && !!companyId,
    staleTime: 60_000,
  });
}

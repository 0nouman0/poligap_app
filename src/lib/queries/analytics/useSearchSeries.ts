import { useQuery } from "@tanstack/react-query";

export type SearchSeriesPoint = { date: string; count: number };

export function useSearchSeries(userId?: string, companyId?: string, days = 30) {
  return useQuery({
    queryKey: ["analytics-search-series", userId, companyId, days],
    queryFn: async () => {
      const url = new URL("/api/analytics/searches/series", window.location.origin);
      url.searchParams.set("userId", userId!);
      url.searchParams.set("companyId", companyId!);
      url.searchParams.set("days", String(days));
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load search series");
      const data = (await res.json()) as { series: SearchSeriesPoint[] };
      return data.series;
    },
    enabled: !!userId && !!companyId,
    staleTime: 60_000,
  });
}

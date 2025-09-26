import { useQuery } from "@tanstack/react-query";

export type TopSearchItem = { title: string; count: number };

export function useTopSearches(userId?: string, companyId?: string, limit = 5) {
  return useQuery({
    queryKey: ["analytics-top-searches", userId, companyId, limit],
    queryFn: async () => {
      const url = new URL("/api/analytics/searches/top", window.location.origin);
      url.searchParams.set("userId", userId!);
      url.searchParams.set("companyId", companyId!);
      url.searchParams.set("limit", String(limit));
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load top searches");
      const data = (await res.json()) as { items: TopSearchItem[] };
      return data.items;
    },
    enabled: !!userId && !!companyId,
    staleTime: 60_000,
  });
}

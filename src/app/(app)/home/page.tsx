"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon } from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { useCompanyStore } from "@/stores/company-store";
import { useIntegrationStore } from "@/stores/integration-store";
import { useAnalyticsUsage } from "@/lib/queries/analytics/useAnalyticsUsage";
import { useSearchSeries } from "@/lib/queries/analytics/useSearchSeries";
import { useTopSearches } from "@/lib/queries/analytics/useTopSearches";
import { useComplianceSummary } from "@/lib/queries/analytics/useComplianceSummary";

// Simple inline charts without extra deps
function LineChart({ data, height = 120 }: { data: { date: string; count: number }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const points = data.map((d, i) => {
    const x = (i / Math.max(1, data.length - 1)) * 100;
    const y = 100 - (d.count / max) * 100;
    return `${x},${y}`;
  });
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }}>
      <polyline points={points.join(" ")} fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500" />
    </svg>
  );
}

function BarList({ items, maxItems = 5 }: { items: { label: string; value: number }[]; maxItems?: number }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-3">
      {items.slice(0, maxItems).map((i) => (
        <div key={i.label} className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
          <div className="w-10 text-right text-xs text-muted-foreground">{i.value}</div>
          <div className="flex-1 text-sm truncate" title={i.label}>{i.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function HomeFeedPage() {
  const { userData } = useUserStore();
  const name = userData?.name;
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const connectedAccountIds = useIntegrationStore((s) => s.connectedAccountIds);

  const userId = userData?._id;
  const companyId = selectedCompany?.companyId;

  const { data: usage, isLoading: usageLoading } = useAnalyticsUsage(userId, companyId);
  const { data: series = [], isLoading: seriesLoading } = useSearchSeries(userId, companyId, 30);
  const { data: topSearches = [], isLoading: topLoading } = useTopSearches(userId, companyId, 5);
  const { data: compliance, isLoading: complianceLoading } = useComplianceSummary(userId, companyId, 5);

  return (
    <div className="max-w-6xl mx-auto px-4">
      <header className={`flex flex-col mb-8 ${!connectedAccountIds || connectedAccountIds.length === 0 ? "mt-[12vh]" : ""}`}>
        <h2 className="text-sm mr-4 font-medium text-center mt-2">
          {(() => {
            const today = new Date();
            const options: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" };
            return today.toLocaleDateString("en-US", options);
          })()}
        </h2>
        <div className="flex items-center w-full relative mt-3">
          <div className="flex-1 flex justify-center">
            <h1 className="text-2xl font-medium text-center">
              {(() => {
                const hour = new Date().getHours();
                let greeting = "Good morning";
                if (hour >= 12 && hour < 18) greeting = "Good afternoon";
                else if (hour >= 18 || hour < 4) greeting = "Good evening";
                return (
                  <>
                    {greeting}{name ? `, ${name}` : ""}
                  </>
                );
              })()}
            </h1>
          </div>
        </div>
      </header>

      {(!connectedAccountIds || connectedAccountIds.length === 0) && (
        <div className="mt-8 flex flex-col items-center justify-center text-center bg-muted/60 dark:bg-neutral-800 rounded-lg p-6 border border-muted-foreground/10 max-w-xl mx-auto">
          <SearchIcon className="w-10 h-10 text-gray-500 dark:text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Connect a source to personalize your feed</h3>
          <p className="text-sm text-muted-foreground">
            Once your accounts are connected, you'll see suggested documents and trending items here for {selectedCompany?.name || "your org"}.
          </p>
        </div>
      )}

      <main className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-[13px]">
        <div className="md:col-span-2 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <CardTitle className="text-sm mb-2">Searches (MTD)</CardTitle>
              {usageLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-semibold">{usage?.searchCountMonth ?? 0}</div>}
            </Card>
            <Card className="p-4">
              <CardTitle className="text-sm mb-2">Audit Logs (MTD)</CardTitle>
              {usageLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-semibold">{usage?.auditCountMonth ?? 0}</div>}
            </Card>
            <Card className="p-4">
              <CardTitle className="text-sm mb-2">Flagged (all)</CardTitle>
              {usageLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="space-x-3 text-sm">
                  <span className="font-medium">New: {usage?.flagged?.new ?? 0}</span>
                  <span className="font-medium">Resolved: {usage?.flagged?.resolved ?? 0}</span>
                </div>
              )}
            </Card>
          </div>

          {/* Searches over time */}
          <Card className="p-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">Searches last 30 days</CardTitle>
            </div>
            <div className="mt-2">
              {seriesLoading ? (
                <Skeleton className="h-[120px] w-full" />
              ) : series.length > 0 ? (
                <LineChart data={series} />
              ) : (
                <div className="text-sm text-muted-foreground py-6">No search activity found.</div>
              )}
            </div>
          </Card>

          {/* Compliance summary */}
          <Card className="p-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">Compliance summary</CardTitle>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Average score</div>
                {complianceLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-semibold">{compliance?.averageScore != null ? Math.round(compliance.averageScore) : "—"}</div>}
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Analyzed docs</div>
                {complianceLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-semibold">{compliance?.totalAnalyzed ?? 0}</div>}
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Top metric keys</div>
                {complianceLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <ul className="text-sm list-disc pl-5 space-y-1">
                    {(compliance?.topMetricKeys || []).map((m) => (
                      <li key={m.key} className="truncate" title={`${m.key} (${m.count})`}>
                        {m.key} <span className="text-muted-foreground">({m.count})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="mt-6">
              <div className="text-sm font-medium mb-2">Top compliances</div>
              {complianceLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <BarList items={(compliance?.topCompliances || []).map((c) => ({ label: c.name, value: c.count }))} />
              )}
            </div>
          </Card>
        </div>

        {/* Right column: Top searches */}
        <div className="md:col-span-1">
          <Card className="p-4">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-semibold">Top searches</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {topLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                  ))}
                </div>
              ) : topSearches.length > 0 ? (
                <BarList items={topSearches.map((t) => ({ label: t.title, value: t.count }))} />
              ) : (
                <div className="text-sm text-muted-foreground">No top searches to show.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

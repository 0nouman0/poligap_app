"use client";
import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { History as HistoryIcon, AlertTriangle, CheckCircle, FileText, Calendar, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { auditApi } from "@/lib/api-client";
import { ListSkeleton } from "@/components/ui/page-loader";
import { useDebounce } from "@/hooks/use-performance";
import { useUserStore } from "@/stores/user-store";
import { useAuditLogsStore } from "@/stores/audit-logs-store";

type ComplianceStatus = 'compliant' | 'non-compliant' | 'partial';

interface ComplianceGap {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category?: string;
  recommendation?: string;
  section?: string;
}

interface AuditLog {
  _id: string;
  fileName: string;
  standards: string[];
  score: number;
  status: ComplianceStatus;
  gapsCount: number;
  analysisDate: string;
  fileSize: number;
  analysisMethod?: string; // 'policy-analysis' | 'contract-review' | 'policy-generator'
  snapshot?: {
    gaps?: ComplianceGap[];
    suggestions?: string[];
    content?: string; // for policy-generator
    inputs?: any;
  };
}

function statusColor(status: ComplianceStatus) {
  switch (status) {
    case 'compliant':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'partial':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    default:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  }
}

export default function HistoryPage() {
  // User store for userId
  const { userData } = useUserStore();
  
  // Use Zustand store for audit logs with caching
  const { logs, isLoading: loading, fetchLogs } = useAuditLogsStore();
  
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const issuesRef = useRef<HTMLDivElement | null>(null);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [query, setQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'policy-analysis' | 'contract-review' | 'policy-generator'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'compliant' | 'partial' | 'non-compliant'>('all');

  // Helper to get userId with fallbacks
  const getUserId = (): string | null => {
    if (userData?.userId) return userData.userId;
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('user_id');
      if (storedId) return storedId;
    }
    return process.env.NEXT_PUBLIC_FALLBACK_USER_ID || null;
  };

  // Fetch logs using Zustand store (with caching)
  useEffect(() => {
    const userId = getUserId();
    if (userId) {
      fetchLogs(userId); // Will use cache if valid
    }
  }, [fetchLogs]);

  // Auto-open by logId and optional tab focus (use dialog)
  useEffect(() => {
    const id = searchParams.get('logId');
    const tab = searchParams.get('tab');
    if (!id || logs.length === 0) return;
    const found = logs.find(l => l._id === id);
    if (found) {
      setSelected(found);
      setOpen(true);
      // Slight delay to allow dialog content to mount
      setTimeout(() => {
        if (tab === 'issues') issuesRef.current?.scrollIntoView({ behavior: 'smooth' });
        if (tab === 'suggestions') suggestionsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [logs, searchParams]);

  const filteredGaps = useMemo(() => {
    if (!selected?.snapshot?.gaps) return [] as ComplianceGap[];
    return selected.snapshot.gaps.filter(g => {
      const matchesPriority = priorityFilter === 'all' || g.priority === priorityFilter;
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q) || (g.category || '').toLowerCase().includes(q);
      return matchesPriority && matchesQuery;
    });
  }, [selected, priorityFilter, query]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <HistoryIcon className="h-7 w-7" />
          History
        </h1>
        <Button variant="outline" onClick={async () => {
          // Force refresh (bypass cache)
          const userId = getUserId();
          if (userId) {
            await fetchLogs(userId, true); // true = force refresh
          }
        }}>Refresh</Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Method filter */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Type:</span>
          {([
            { id: 'all', label: 'All' },
            { id: 'policy-analysis', label: 'Policy Analysis' },
            { id: 'contract-review', label: 'Contract Review' },
            { id: 'policy-generator', label: 'Generated Policies' },
          ] as const).map(btn => (
            <Button
              key={btn.id}
              size="sm"
              variant={methodFilter === btn.id ? 'default' : 'outline'}
              className="h-8"
              onClick={() => setMethodFilter(btn.id)}
            >
              {btn.label}
            </Button>
          ))}
        </div>
        {/* Separator */}
        <div className="h-6 w-px bg-border mx-1" />
        {/* Status filter */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Status:</span>
          {([
            { id: 'all', label: 'All' },
            { id: 'compliant', label: 'Compliant' },
            { id: 'partial', label: 'Partial' },
            { id: 'non-compliant', label: 'Non-compliant' },
          ] as const).map(btn => (
            <Button
              key={btn.id}
              size="sm"
              variant={statusFilter === btn.id ? 'default' : 'outline'}
              className="h-8"
              onClick={() => setStatusFilter(btn.id)}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : logs.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No history yet. Run a compliance analysis to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {logs
            .filter(l => methodFilter === 'all' ? true : (l.analysisMethod === methodFilter))
            .filter(l => statusFilter === 'all' ? true : (l.status === statusFilter))
            .map((log) => (
            <Card key={log._id} className="hover:shadow-sm transition-shadow cursor-pointer h-56 flex flex-col" onClick={() => { setSelected(log); setOpen(true); }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base truncate" title={log.fileName}>{log.fileName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{new Date(log.analysisDate).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap min-h-[1.5rem]">
                  {/* Type badge */}
                  <Badge variant="outline" className="text-xs">
                    {log.analysisMethod === 'policy-generator' ? 'Generated Policy' : log.analysisMethod === 'contract-review' ? 'Contract Review' : 'Policy Analysis'}
                  </Badge>
                  <Badge className={`${statusColor(log.status)} text-xs`} variant="secondary">{log.status}</Badge>
                  <Badge variant="outline" className="text-xs">{log.score}%</Badge>
                  {log.standards.slice(0, 2).map((s) => (
                    <Badge key={s} variant="outline" className="text-xs truncate max-w-[4rem]" title={s.toUpperCase()}>{s.toUpperCase()}</Badge>
                  ))}
                  {log.standards.length > 2 && (
                    <Badge variant="outline" className="text-xs">+{log.standards.length - 2}</Badge>
                  )}
                </div>
                <div className="mt-auto">
                  {log.analysisMethod !== 'policy-generator' && (
                    <>
                      <div className="text-sm text-muted-foreground truncate">Issues: {log.gapsCount}</div>
                      <div className="flex gap-1 flex-col sm:flex-row">
                        <Link href={`/history?logId=${log._id}&tab=issues`} className="flex-1">
                          <Button size="sm" variant="ghost" className="w-full text-xs">Open Full Issues</Button>
                        </Link>
                        <Link href={`/history?logId=${log._id}&tab=suggestions`} className="flex-1">
                          <Button size="sm" variant="ghost" className="w-full text-xs">Open Full Suggestions</Button>
                        </Link>
                      </div>
                    </>
                  )}
                  {log.analysisMethod === 'policy-generator' && (
                    <div className="flex gap-1 flex-col sm:flex-row">
                      <Link href={`/history?logId=${log._id}&tab=document`} className="flex-1">
                        <Button size="sm" variant="ghost" className="w-full text-xs">Open Document</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-screen min-w-[720px] max-w-none p-0" aria-label="Detailed analysis report" aria-describedby="history-dialog-desc">
          {/* Sticky header for context */}
          <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-8 py-5">
            <SheetHeader className="p-0">
              <SheetTitle className="text-2xl text-purple-600">Audit Details</SheetTitle>
              <SheetDescription id="history-dialog-desc">Historical compliance result snapshot</SheetDescription>
            </SheetHeader>
            {selected && (
              <div className="mt-3 flex items-start justify-between">
                <div>
                  <div className="font-semibold text-lg">{selected.fileName}</div>
                  <div className="text-xs text-muted-foreground">{new Date(selected.analysisDate).toLocaleString()} • {selected.standards.map(s => s.toUpperCase()).join(', ')} • {selected.analysisMethod === 'policy-generator' ? 'Generated Policy' : selected.analysisMethod === 'contract-review' ? 'Contract Review' : 'Policy Analysis'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${statusColor(selected.status)} ring-1 ring-purple-200`} aria-label={`Status ${selected.status}`}>{selected.status}</Badge>
                  <Badge variant="outline" className="ring-1 ring-purple-200" aria-label={`Score ${selected.score} percent`}>{selected.score}%</Badge>
                </div>
              </div>
            )}
          </div>

          {/* Scrollable body with two columns */}
          {selected && (
            <div className="h-[calc(100vh-5rem)] overflow-hidden px-8 py-5">
              {selected.analysisMethod === 'policy-generator' ? (
                <div className="h-full overflow-y-auto pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="prose prose-sm dark:prose-invert max-w-none border rounded-md p-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {selected.snapshot?.content || '*No document content stored.*'}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 h-full overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {/* Issues (top) */}
                  <section ref={issuesRef} aria-label="Issues list" className="border rounded-md p-4 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold flex items-center gap-2 text-purple-700"><AlertTriangle className="h-4 w-4" />Issues ({selected.gapsCount})</h4>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                          <Input aria-label="Search issues" className="pl-8 w-64" placeholder="Search issues..." value={query} onChange={(e)=>setQuery(e.target.value)} />
                        </div>
                        <Select value={priorityFilter} onValueChange={(v)=>setPriorityFilter(v as any)}>
                          <SelectTrigger className="w-[160px]" aria-label="Priority filter">
                            <SelectValue placeholder="All priorities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All priorities</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {filteredGaps.length > 0 ? (
                        <div className="space-y-3">
                          {filteredGaps.map((gap) => (
                            <Card key={gap.id} className="hover:shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-purple-500">
                              <CardContent className="p-4">
                                <div className="text-sm font-semibold">{gap.title}</div>
                                <div className="text-xs text-muted-foreground">{gap.description}</div>
                                <div className="mt-1 flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{gap.priority}</Badge>
                                  {gap.category && <Badge variant="outline" className="text-xs">{gap.category}</Badge>}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No issues match your filters.</p>
                      )}
                    </div>
                  </section>

                  {/* Suggestions (bottom) */}
                  <section ref={suggestionsRef} aria-label="Suggested fixes" className="border rounded-md p-4 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col min-h-0">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-800 dark:text-emerald-300"><CheckCircle className="h-4 w-4" />Suggested Fixes</h4>
                    <div className="flex-1 overflow-y-auto pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {selected.snapshot?.suggestions && selected.snapshot.suggestions.length > 0 ? (
                        <ul className="space-y-3">
                          {selected.snapshot.suggestions.map((s, i) => (
                            <li key={i} className="text-sm leading-relaxed border border-emerald-200 dark:border-emerald-800 rounded-md p-3 bg-white/70 dark:bg-emerald-900/20">
                              {s}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No suggestions snapshot stored.</p>
                      )}
                    </div>
                  </section>
                </div>
              )}
            </div>
          )}

        </SheetContent>
      </Sheet>
    </div>
  );
}

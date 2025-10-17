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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="w-full min-h-screen bg-[#FAFAFB] py-4 md:py-6 px-3 md:px-4">
      <div className="w-full max-w-[1903px] mx-auto">
        {/* Modern Header Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-[15px] mb-6">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#3B43D6] flex items-center justify-center flex-shrink-0">
              <HistoryIcon className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2.57} />
            </div>
            <div className="flex-1">
              <h1 className="text-sm md:text-[16px] font-semibold text-[#2D2F34] leading-tight">
                History & Audit Logs
              </h1>
              <p className="text-xs md:text-[12px] text-[#6A707C] leading-tight mt-1 md:mt-[5px]">
                Review your analysis history, track compliance snapshots, and access detailed audit trails for all your activities.
              </p>
            </div>
          </div>

          {/* Filters Section */}
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={methodFilter} onValueChange={(v)=>setMethodFilter(v as any)}>
              <SelectTrigger className="w-[180px] h-[52px] bg-white border border-[#E6E6E6] rounded-[5px]">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="policy-analysis">Policy Analysis</SelectItem>
                <SelectItem value="contract-review">Contract Review</SelectItem>
                <SelectItem value="policy-generator">Policy Generator</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v)=>setStatusFilter(v as any)}>
              <SelectTrigger className="w-[180px] h-[52px] bg-white border border-[#E6E6E6] rounded-[5px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="non-compliant">Non-Compliant</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              className="h-[52px] px-[15px] rounded-[5px] bg-[#3B43D6] text-white hover:bg-[#2D35B8]"
              onClick={async () => {
                const userId = getUserId();
                if (userId) {
                  await fetchLogs(userId, true);
                }
              }}
            >
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-[10px] shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] p-8 text-center">
            <p className="text-[14px] text-[#6A707C]">Loading...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-[10px] shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#EFF1F6] flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-[#3B43D6] opacity-60" />
            </div>
            <p className="text-[14px] text-[#6A707C]">No history yet. Run a compliance analysis to see it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {logs
            .filter(l => methodFilter === 'all' ? true : (l.analysisMethod === methodFilter))
            .filter(l => statusFilter === 'all' ? true : (l.status === statusFilter))
            .map((log) => (
            <div 
              key={log._id} 
              className="bg-white hover:shadow-lg transition-all cursor-pointer rounded-[10px] border border-[#E6E6E6] p-5 shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] flex flex-col h-full" 
              onClick={() => { setSelected(log); setOpen(true); }}
            >
              <div className="mb-4">
                <h3 className="text-[16px] font-semibold text-[#2D2F34] truncate mb-2" title={log.fileName}>
                  {log.fileName}
                </h3>
                <div className="flex items-center gap-2 text-[12px] text-[#6A707C]">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{new Date(log.analysisDate).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap mb-4">
                <Badge variant="outline" className="text-[12px] border-[#E6E6E6] text-[#6A707C] bg-[#EFF1F6]">
                  {log.analysisMethod === 'policy-generator' ? 'Generated Policy' : log.analysisMethod === 'contract-review' ? 'Contract Review' : 'Policy Analysis'}
                </Badge>
                <Badge className={`${statusColor(log.status)} text-[12px] border-0`}>{log.status}</Badge>
                <Badge variant="outline" className="text-[12px] border-[#E6E6E6] text-[#2D2F34] font-semibold">{log.score}%</Badge>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {log.standards.slice(0, 3).map((s) => (
                  <span key={s} className="px-[7px] py-[5px] bg-[#EFF1F6] rounded-[20px] text-[12px] font-medium text-[#595959]">
                    {s.toUpperCase()}
                  </span>
                ))}
                {log.standards.length > 3 && (
                  <span className="px-[7px] py-[5px] bg-[#EFF1F6] rounded-[20px] text-[12px] font-medium text-[#595959]">
                    +{log.standards.length - 3}
                  </span>
                )}
              </div>

              <div className="mt-auto">
                {log.analysisMethod !== 'policy-generator' && (
                  <>
                    <div className="text-[14px] text-[#6A707C] mb-3">Issues: {log.gapsCount}</div>
                    <div className="flex gap-2 flex-col sm:flex-row">
                      <Link href={`/history?logId=${log._id}&tab=issues`} className="flex-1">
                        <Button size="sm" className="w-full text-[12px] h-9 bg-[#FAFAFB] hover:bg-[#EFF1F6] text-[#2D2F34] border border-[#E6E6E6]">
                          Open Full Issues
                        </Button>
                      </Link>
                      <Link href={`/history?logId=${log._id}&tab=suggestions`} className="flex-1">
                        <Button size="sm" className="w-full text-[12px] h-9 bg-[#FAFAFB] hover:bg-[#EFF1F6] text-[#2D2F34] border border-[#E6E6E6]">
                          Open Full Suggestions
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
                {log.analysisMethod === 'policy-generator' && (
                  <div className="flex gap-2">
                    <Link href={`/history?logId=${log._id}&tab=document`} className="flex-1">
                      <Button size="sm" className="w-full text-[12px] h-9 bg-[#3B43D6] hover:bg-[#2D35B8] text-white">
                        Open Document
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Modern Sheet/Dialog */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-screen min-w-[720px] max-w-none p-0 bg-[#FAFAFB]" aria-label="Detailed analysis report" aria-describedby="history-dialog-desc">
          {/* Sticky header for context */}
          <div className="sticky top-0 z-10 border-b border-[#E6E6E6] bg-white px-6 md:px-8 py-5">
            <SheetHeader className="p-0">
              <SheetTitle className="text-[20px] md:text-[24px] text-[#3B43D6] font-semibold">Audit Details</SheetTitle>
              <SheetDescription id="history-dialog-desc" className="text-[12px] md:text-[14px] text-[#6A707C]">Historical compliance result snapshot</SheetDescription>
            </SheetHeader>
            {selected && (
              <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-[16px] md:text-[18px] text-[#2D2F34]">{selected.fileName}</div>
                  <div className="text-[12px] text-[#6A707C] mt-1">
                    {new Date(selected.analysisDate).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • {selected.standards.map(s => s.toUpperCase()).join(', ')} • {selected.analysisMethod === 'policy-generator' ? 'Generated Policy' : selected.analysisMethod === 'contract-review' ? 'Contract Review' : 'Policy Analysis'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${statusColor(selected.status)} text-[12px] border-0`} aria-label={`Status ${selected.status}`}>{selected.status}</Badge>
                  <Badge variant="outline" className="text-[12px] border-[#E6E6E6] bg-[#EFF1F6] text-[#2D2F34]" aria-label={`Score ${selected.score} percent`}>{selected.score}%</Badge>
                </div>
              </div>
            )}
          </div>

          {/* Scrollable body with two columns */}
          {selected && (
            <div className="h-[calc(100vh-10rem)] overflow-hidden px-6 md:px-8 py-5">
              {selected.analysisMethod === 'policy-generator' ? (
                <div className="h-full overflow-y-auto pr-2">
                  <div className="prose prose-sm dark:prose-invert max-w-none bg-white border border-[#E6E6E6] rounded-[10px] p-6 shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {selected.snapshot?.content || '*No document content stored.*'}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 h-full overflow-y-auto">
                  {/* Issues (top) */}
                  <section ref={issuesRef} aria-label="Issues list" className="bg-white border border-[#E6E6E6] rounded-[10px] p-5 flex flex-col min-h-0 shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)]">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
                      <h4 className="font-semibold flex items-center gap-2 text-[16px] text-[#2D2F34]">
                        <AlertTriangle className="h-5 w-5 text-[#E55400]" />
                        Issues ({selected.gapsCount})
                      </h4>
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-initial">
                          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6A707C]" />
                          <Input 
                            aria-label="Search issues" 
                            className="pl-10 h-[52px] w-full md:w-64 bg-white border-[#E6E6E6] rounded-[5px]" 
                            placeholder="Search issues..." 
                            value={query} 
                            onChange={(e)=>setQuery(e.target.value)} 
                          />
                        </div>
                        <Select value={priorityFilter} onValueChange={(v)=>setPriorityFilter(v as any)}>
                          <SelectTrigger className="w-[140px] h-[52px] bg-white border-[#E6E6E6] rounded-[5px]" aria-label="Priority filter">
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
                    <div className="flex-1 overflow-y-auto pr-2">
                      {filteredGaps.length > 0 ? (
                        <div className="space-y-3">
                          {filteredGaps.map((gap) => (
                            <div key={gap.id} className="bg-[#FAFAFB] border border-[#E6E6E6] rounded-[10px] p-4 hover:shadow-md transition-shadow">
                              <div className="text-[14px] font-semibold text-[#2D2F34] mb-1">{gap.title}</div>
                              <div className="text-[12px] text-[#6A707C] mb-2">{gap.description}</div>
                              <div className="flex items-center gap-2">
                                <span className={`px-[7px] py-[5px] rounded-[20px] text-[12px] font-medium ${
                                  gap.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                  gap.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  gap.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>{gap.priority}</span>
                                {gap.category && <span className="px-[7px] py-[5px] bg-[#EFF1F6] rounded-[20px] text-[12px] font-medium text-[#595959]">{gap.category}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[14px] text-[#6A707C]">No issues match your filters.</p>
                      )}
                    </div>
                  </section>

                  {/* Suggestions (bottom) */}
                  <section ref={suggestionsRef} aria-label="Suggested fixes" className="bg-white border border-[#E6E6E6] rounded-[10px] p-5 flex flex-col min-h-0 shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)]">
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-[16px] text-[#2D2F34]">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Suggested Fixes
                    </h4>
                    <div className="flex-1 overflow-y-auto pr-2">
                      {selected.snapshot?.suggestions && selected.snapshot.suggestions.length > 0 ? (
                        <ul className="space-y-3">
                          {selected.snapshot.suggestions.map((s, i) => (
                            <li key={i} className="text-[14px] leading-relaxed bg-green-50 border border-green-200 rounded-[10px] p-4">
                              {s}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[14px] text-[#6A707C]">No suggestions snapshot stored.</p>
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

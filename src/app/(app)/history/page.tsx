"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History as HistoryIcon, Calendar, FileText, Shield, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUserStore } from "@/stores/user-store";
import { useAuditLogsStore } from "@/stores/audit-logs-store";
import { Skeleton } from "@/components/ui/skeleton";
import { formatGlobalDate } from "@/utils/date.util";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useActivityTracker } from "@/hooks/use-activity-tracker";

type ComplianceStatus = 'compliant' | 'non-compliant' | 'partial';

interface AuditLog {
  _id: string;
  fileName: string;
  standards: string[];
  score: number;
  status: ComplianceStatus;
  gapsCount: number;
  analysisDate: string;
  fileSize: number;
  analysisMethod?: string;
  snapshot?: {
    gaps?: any[];
    suggestions?: string[];
    content?: string;
    inputs?: any;
  };
}

function getStatusColor(status: ComplianceStatus) {
  switch (status) {
    case 'compliant':
      return 'bg-green-100 text-green-800';
    case 'partial':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-red-100 text-red-800';
  }
}

function getAnalysisTypeIcon(method?: string) {
  switch (method) {
    case 'contract-review':
      return <FileText className="h-4 w-4 text-blue-600" />;
    case 'policy-generator':
      return <Shield className="h-4 w-4 text-purple-600" />;
    default:
      return <Shield className="h-4 w-4 text-blue-600" />;
  }
}

function getAnalysisTypeName(method?: string) {
  switch (method) {
    case 'contract-review':
      return 'Contract Review';
    case 'policy-generator':
      return 'Policy Generator';
    default:
      return 'Compliance Check';
  }
}

export default function HistoryPage() {
  const { userData } = useUserStore();
  const { logs, isLoading: loading, fetchLogs } = useAuditLogsStore();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [methodFilter, setMethodFilter] = useState<'all' | 'compliance-check' | 'policy-analysis' | 'contract-review' | 'policy-generator' | 'others'>(
    'all'
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'compliant' | 'partial' | 'non-compliant'>('all');
  const { trackPageVisit, trackHistoryView } = useActivityTracker();

  // Track page visit
  useEffect(() => {
    trackPageVisit('history');
  }, [trackPageVisit]);

  // Helper to get userId with fallbacks
  const getUserId = (): string | null => {
    if (userData?.userId) return userData.userId;
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('user_id');
      if (storedId) return storedId;
    }
    return process.env.NEXT_PUBLIC_FALLBACK_USER_ID || null;
  };

  // Fetch logs using Zustand store
  useEffect(() => {
    const userId = getUserId();
    if (userId) {
      fetchLogs(userId);
    }
  }, [fetchLogs]);

  const handleRefresh = async () => {
    const userId = getUserId();
    if (userId) {
      await fetchLogs(userId, true);
    }
  };

  const filteredLogs = logs
    .filter((log) => {
      if (methodFilter === 'all') return true;
      if (methodFilter === 'compliance-check') {
        return !log.analysisMethod || log.analysisMethod === 'policy-analysis';
      }
      if (methodFilter === 'others') {
        return (
          !!log.analysisMethod &&
          !['contract-review', 'policy-generator', 'policy-analysis'].includes(log.analysisMethod)
        );
      }
      return log.analysisMethod === methodFilter;
    })
    .filter((log) => (statusFilter === 'all' ? true : log.status === statusFilter));

  const methodLabel = useMemo(() => {
    switch (methodFilter) {
      case 'all':
        return 'All Methods';
      case 'compliance-check':
        return 'Compliance Checks';
      case 'contract-review':
        return 'Contract Reviews';
      case 'policy-generator':
        return 'Policy Generations';
      case 'policy-analysis':
        return 'Compliance Checks';
      default:
        return 'Other Sources';
    }
  }, [methodFilter]);

  const statusLabel = useMemo(() => {
    switch (statusFilter) {
      case 'all':
        return 'All Status';
      case 'compliant':
        return 'Completed';
      case 'partial':
        return 'Partial/Pending';
      case 'non-compliant':
        return 'Failed';
    }
  }, [statusFilter]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <HistoryIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">History & Audit Logs</h1>
              <p className="text-sm text-gray-600 mt-1">
                Review your analysis history, track compliance snapshots, and access detailed audit trails for all your activities.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  {methodLabel}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[220px]">
                <DropdownMenuItem onClick={() => setMethodFilter('all')}>All Methods</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMethodFilter('compliance-check')}>Compliance Checks</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMethodFilter('contract-review')}>Contract Reviews</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMethodFilter('policy-generator')}>Policy Generations</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMethodFilter('others')}>Other Sources</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  {statusLabel}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[200px]">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('compliant')}>Completed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('partial')}>Partial / Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('non-compliant')}>Failed</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700 text-white">
              Refresh
            </Button>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 aspect-[16/10]">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600">No audit logs found. Run a compliance analysis to see results here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {filteredLogs.map((log) => (
              <div
                key={log._id}
                className="bg-white rounded-lg border border-gray-200 p-4 aspect-[16/10] hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
                onClick={() => {
                  setSelectedLog(log);
                  // Track history view activity
                  const analysisType = log.analysisMethod?.includes('contract') ? 'contract' : 
                                     log.analysisMethod?.includes('policy') ? 'policy' : 'compliance';
                  trackHistoryView(log.fileName, analysisType);
                }}
              >
                {/* Analysis Type Header */}
                <div className="flex items-center gap-2 mb-3 text-sm">
                  {getAnalysisTypeIcon(log.analysisMethod)}
                  <span className="text-sm font-medium text-gray-700">
                    {getAnalysisTypeName(log.analysisMethod)}
                  </span>
                </div>

                {/* File Name */}
                <h3 className="font-semibold text-gray-900 mb-1 truncate" title={log.fileName}>
                  {log.fileName}
                </h3>

                {/* Date */}
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                  <Calendar className="h-3 w-3" />
                  <span>{formatGlobalDate(log.analysisDate)} {new Date(log.analysisDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Compliance Score */}
                <div className="mb-3">
                  <div className="text-xs text-gray-600 mb-1">Compliance Score</div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge className={getStatusColor(log.status)}>
                      {log.score}% {log.status}
                    </Badge>
                  </div>
                </div>

                {/* Standards */}
                <div className="mb-3">
                  <div className="text-xs text-gray-600 mb-2">Standards</div>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {log.standards.slice(0, 2).map((standard) => (
                      <span
                        key={standard}
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full"
                      >
                        {standard.toUpperCase()}
                      </span>
                    ))}
                    {log.standards.length > 2 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                        +{log.standards.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Issues Count */}
                <div className="mb-3">
                  <span className="text-xs text-gray-600">Issues: {log.gapsCount}</span>
                </div>

                {/* Open Button */}
                <Button
                  className="mt-auto w-full h-8 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLog(log);
                    // Track history view activity
                    const analysisType = log.analysisMethod?.includes('contract') ? 'contract' : 
                                       log.analysisMethod?.includes('policy') ? 'policy' : 'compliance';
                    trackHistoryView(log.fileName, analysisType);
                  }}
                >
                  Open
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedLog && getAnalysisTypeIcon(selectedLog.analysisMethod)}
                Audit Log Details
              </DialogTitle>
              <DialogDescription>
                Detailed analysis results and compliance information
              </DialogDescription>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {selectedLog.fileName}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{formatGlobalDate(selectedLog.analysisDate)} {new Date(selectedLog.analysisDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span>{selectedLog.standards.join(', ')}</span>
                    <span>•</span>
                    <Badge className={getStatusColor(selectedLog.status)}>
                      {selectedLog.score}% {selectedLog.status}
                    </Badge>
                  </div>
                </div>

                {/* Content based on analysis type */}
                {selectedLog.analysisMethod === 'policy-generator' ? (
                  <div className="prose max-w-none">
                    <h4 className="font-semibold mb-4">Generated Policy Content</h4>
                    <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                      {selectedLog.snapshot?.content || 'No content available'}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Issues */}
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-red-600" />
                        Issues ({selectedLog.gapsCount})
                      </h4>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {selectedLog.snapshot?.gaps && selectedLog.snapshot.gaps.length > 0 ? (
                          selectedLog.snapshot.gaps.map((gap: any, index: number) => (
                            <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="font-medium text-red-900 mb-1">
                                {gap.title || `Issue ${index + 1}`}
                              </div>
                              <div className="text-sm text-red-700">
                                {gap.description || 'No description available'}
                              </div>
                              {gap.priority && (
                                <Badge
                                  className={`mt-2 ${
                                    gap.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                    gap.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                    gap.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {gap.priority}
                                </Badge>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-600">No issues recorded</p>
                        )}
                      </div>
                    </div>

                    {/* Suggestions */}
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        Suggestions
                      </h4>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {selectedLog.snapshot?.suggestions && selectedLog.snapshot.suggestions.length > 0 ? (
                          selectedLog.snapshot.suggestions.map((suggestion, index) => (
                            <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="text-sm text-green-700">{suggestion}</div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-600">No suggestions available</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

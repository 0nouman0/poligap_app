"use client";

import React, { useEffect, useState } from "react";
import { 
  Shield, 
  FileText, 
  Upload, 
  Bot, 
  CheckCircle, 
  ArrowRight, 
  Plus,
  Search,
  AlertTriangle,
  TrendingUp,
  Activity,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Loader2,
  Database
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useUserStore } from "@/stores/user-store";
import { toastError } from "@/components/toast-varients";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsData {
  overview: {
    totalSearches: number;
    totalDocumentAnalyses: number;
    totalFlaggedIssues: number;
    averageComplianceScore: number;
    newFlaggedIssues: number;
    resolvedFlaggedIssues: number;
    timeRange: number;
  };
  searches: {
    total: number;
    topTerms: Array<{ term: string; count: number; type: string }>;
  };
  compliance: {
    totalAnalyses: number;
    averageScore: number;
    byStandard: Array<{
      standard: string;
      averageScore: number;
      count: number;
      minScore: number;
      maxScore: number;
    }>;
    recentAnalyses: Array<{
      title: string;
      standard: string;
      score: number;
      date: string;
    }>;
  };
  flaggedIssues: {
    total: number;
    new: number;
    resolved: number;
    byStatus: {
      new: number;
      viewed: number;
      resolved: number;
      rejected: number;
    };
    recent: Array<{
      title: string;
      reason: string;
      status: string;
      date: string;
    }>;
  };
  activity: {
    recent: Array<{
      type: string;
      title: string;
      description: string;
      timestamp: string;
      metadata?: any;
    }>;
    trends: Array<{
      date: string;
      totalActivities: number;
      breakdown: Array<{ action: string; count: number }>;
    }>;
  };
}

export default function DashboardPage() {
  const { userData } = useUserStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  const features = [
    {
      title: "Compliance Check",
      description: "Upload documents for comprehensive compliance analysis against HIPAA, GDPR, ISO standards",
      icon: Shield,
      href: "/compliance-check",
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
    },
    {
      title: "Contract Review",
      description: "AI-powered document analysis with gap identification and improvement suggestions",
      icon: FileText,
      href: "/contract-review",
      color: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
    },
    {
      title: "AI Agents",
      description: "Deploy specialized AI agents for automated legal and compliance tasks",
      icon: Bot,
      href: "/ai-agents",
      color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
    }
  ];

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // Get user ID with fallback
      const storedUserId = localStorage.getItem('user_id');
      const actualUserId = (userData?.userId && userData.userId !== "undefined") ? userData.userId :
                          (storedUserId && storedUserId !== "undefined" && storedUserId !== "null") ? storedUserId :
                          "68da404605eeba8349fc9d10";

      const companyId = "60f1b2b3c4d5e6f7a8b9c0d1"; // Default company ID

      console.log('Dashboard - Fetching analytics for userId:', actualUserId, 'timeRange:', timeRange);

      const response = await fetch(
        `/api/analytics/dashboard?userId=${actualUserId}&companyId=${companyId}&timeRange=${timeRange}`
      );
      const result = await response.json();

      console.log('Dashboard analytics result:', result);

      if (result.success) {
        setAnalytics(result.data);
      } else {
        console.error('Analytics API error:', result.error);
        // Don't show error toast immediately, user might not have data yet
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]); // Remove userData dependency to avoid infinite loops

  if (isLoading) {
    return (
      <div className="w-full max-w-none p-6 space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Activity List Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show empty state if no analytics data
  if (!analytics || (analytics.overview.totalSearches === 0 && analytics.overview.totalDocumentAnalyses === 0)) {
    return (
      <div className="w-full max-w-none p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Good afternoon, {userData?.name || 'User'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="text-center space-y-4">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-bold">Welcome to Your Dashboard</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Your dashboard will show analytics and insights once you start using the platform. 
              Get started by seeding some sample data to see how it works.
            </p>
          </div>
          
          <div className="flex gap-4">
            <Link href="/seed-dashboard">
              <Button size="lg">
                <Database className="h-4 w-4 mr-2" />
                Seed Sample Data
              </Button>
            </Link>
            <Link href="/compliance-check">
              <Button variant="outline" size="lg">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Link key={index} href={feature.href}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Good afternoon, {userData?.name || 'User'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeRange === '7' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('7')}
          >
            7 days
          </Button>
          <Button
            variant={timeRange === '30' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('30')}
          >
            30 days
          </Button>
          <Button
            variant={timeRange === '90' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('90')}
          >
            90 days
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Searches (MTD)
                </p>
                <p className="text-xl font-bold">{analytics?.overview.totalSearches || 0}</p>
              </div>
              <Search className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Audit Logs (MTD)
                </p>
                <p className="text-xl font-bold">{analytics?.overview.totalDocumentAnalyses || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Flagged (all)
                </p>
                <p className="text-xl font-bold">{analytics?.flaggedIssues.total || 0}</p>
                <p className="text-xs text-muted-foreground">
                  New: {analytics?.flaggedIssues.new || 0} Resolved: {analytics?.flaggedIssues.resolved || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Avg Compliance Score
                </p>
                <p className="text-xl font-bold">{analytics?.compliance.averageScore || 0}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Searches */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top searches
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.searches.topTerms.length ? (
                <div className="space-y-3">
                  {analytics.searches.topTerms.slice(0, 5).map((term, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {term.type}
                        </Badge>
                        <span className="text-sm">{term.term}</span>
                      </div>
                      <span className="text-sm font-medium">{term.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No top searches to show.</p>
              )}
            </CardContent>
          </Card>

          {/* Compliance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-xs text-muted-foreground">Average score</p>
                  <p className="text-xl font-bold">{analytics?.compliance.averageScore || 0}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Analyzed docs</p>
                  <p className="text-xl font-bold">{analytics?.compliance.totalAnalyses || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Top metric keys</p>
                  <p className="text-xl font-bold">—</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3">Top compliances</h4>
                {analytics?.compliance.byStandard.length ? (
                  <div className="space-y-3">
                    {analytics.compliance.byStandard.slice(0, 3).map((standard, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{standard.standard}</span>
                            <span className="text-sm text-muted-foreground">
                              {standard.averageScore}% ({standard.count} docs)
                            </span>
                          </div>
                          <Progress value={standard.averageScore} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No compliance data available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Recent Activity & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/compliance-check">
                <Button className="w-full justify-start" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </Link>
              <Link href="/contract-review">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Contract Review
                </Button>
              </Link>
              <Link href="/ai-agents">
                <Button className="w-full justify-start" variant="outline">
                  <Bot className="h-4 w-4 mr-2" />
                  AI Agents
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.activity.recent.length ? (
                <div className="space-y-4">
                  {analytics.activity.recent.slice(0, 8).map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'search' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'analysis' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {activity.type === 'search' ? <Search className="h-3 w-3" /> :
                         activity.type === 'analysis' ? <FileText className="h-3 w-3" /> :
                         <Activity className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Flagged Issues */}
          {analytics && analytics.flaggedIssues?.total && analytics.flaggedIssues.total > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Flagged Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>New: {analytics.flaggedIssues.new}</span>
                    <span>Resolved: {analytics.flaggedIssues.resolved}</span>
                  </div>
                  {analytics.flaggedIssues.recent.slice(0, 3).map((issue, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{issue.title}</p>
                        <Badge 
                          variant={issue.status === 'new' ? 'destructive' : 
                                  issue.status === 'resolved' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {issue.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{issue.reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

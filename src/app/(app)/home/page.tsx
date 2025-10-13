"use client";

import React, { Suspense, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  FileText, 
  Bot, 
  Upload, 
  Users,
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import Link from "next/link";
import { DashboardSkeleton } from "@/components/ui/page-loader";

interface ActivityItem {
  id: string;
  type: 'compliance' | 'contract' | 'policy' | 'upload';
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'failed';
  timestamp: string;
  fileName?: string;
}

interface OverviewStats {
  complianceChecks: number;
  contractsReviewed: number;
  policiesGenerated: number;
  trainingModules: number;
}

export default function HomePage() {
  const { userData } = useUserStore();
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    complianceChecks: 0,
    contractsReviewed: 0,
    policiesGenerated: 0,
    trainingModules: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // Fetch recent activity data
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setIsLoadingActivity(true);
        
        // Try to fetch from multiple endpoints to get real activity data
        const endpoints = [
          '/api/compliance/recent',
          '/api/contracts/recent', 
          '/api/policies/recent',
          '/api/uploads/recent'
        ];
        
        const activities: ActivityItem[] = [];
        
        // Fetch from each endpoint and combine results
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint);
            if (response.ok) {
              const data = await response.json();
              if (Array.isArray(data)) {
                activities.push(...data.slice(0, 3)); // Limit to 3 items per type
              }
            }
          } catch (error) {
            console.log(`No data available from ${endpoint}`);
          }
        }
        
        // Sort by timestamp and take the most recent 3 items for brief preview
        const sortedActivities = activities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 3);
        
        setRecentActivity(sortedActivities);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        // Set empty array if no real data is available
        setRecentActivity([]);
      } finally {
        setIsLoadingActivity(false);
      }
    };
    
    fetchRecentActivity();
  }, []);

  // Fetch overview statistics
  useEffect(() => {
    const fetchOverviewStats = async () => {
      try {
        setIsLoadingStats(true);
        
        // Fetch statistics from Supabase collections
        const statsPromises = [
          // Compliance checks count
          fetch('/api/compliance/count').then(res => res.ok ? res.json() : { count: 0 }),
          // Contracts reviewed count  
          fetch('/api/contracts/count').then(res => res.ok ? res.json() : { count: 0 }),
          // Policies generated count
          fetch('/api/policies/count').then(res => res.ok ? res.json() : { count: 0 }),
          // Training modules count
          fetch('/api/training/count').then(res => res.ok ? res.json() : { count: 0 })
        ];

        const [complianceData, contractsData, policiesData, trainingData] = await Promise.allSettled(statsPromises);

        setOverviewStats({
          complianceChecks: complianceData.status === 'fulfilled' ? (complianceData.value?.count || 0) : 0,
          contractsReviewed: contractsData.status === 'fulfilled' ? (contractsData.value?.count || 0) : 0,
          policiesGenerated: policiesData.status === 'fulfilled' ? (policiesData.value?.count || 0) : 0,
          trainingModules: trainingData.status === 'fulfilled' ? (trainingData.value?.count || 0) : 0
        });

      } catch (error) {
        console.error('Error fetching overview statistics:', error);
        // Keep default values (all zeros) if fetch fails
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchOverviewStats();
  }, []);
  
  // Get current time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get current date
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'compliance': return Shield;
      case 'contract': return FileText;
      case 'policy': return BookOpen;
      case 'upload': return Upload;
      default: return Clock;
    }
  };

  // Helper function to get activity icon background color
  const getActivityIconBg = (type: string) => {
    switch (type) {
      case 'compliance': return 'bg-blue-100';
      case 'contract': return 'bg-green-100';
      case 'policy': return 'bg-purple-100';
      case 'upload': return 'bg-orange-100';
      default: return 'bg-gray-100';
    }
  };

  // Helper function to get activity icon color
  const getActivityIconColor = (type: string) => {
    switch (type) {
      case 'compliance': return 'text-blue-600';
      case 'contract': return 'text-green-600';
      case 'policy': return 'text-purple-600';
      case 'upload': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  // Helper function to get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { text: 'Completed', className: 'text-green-600 bg-green-50' };
      case 'in_progress':
        return { text: 'In Progress', className: 'text-blue-600 bg-blue-50' };
      case 'failed':
        return { text: 'Failed', className: 'text-red-600 bg-red-50' };
      default:
        return { text: 'Unknown', className: 'text-gray-600 bg-gray-100' };
    }
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const features = [
    {
      title: "Compliance Check",
      description: "Upload documents for comprehensive compliance analysis against HIPAA, GDPR, ISO standards",
      icon: Shield,
      href: "/compliance-check",
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      badge: "AI-Powered"
    },
    {
      title: "Contract Review",
      description: "AI-powered document analysis with gap identification and improvement suggestions",
      icon: FileText,
      href: "/contract-review",
      color: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
      badge: "Smart Analysis"
    },
    {
      title: "Policy Generator",
      description: "Generate comprehensive policies tailored to your organization's needs",
      icon: BookOpen,
      href: "/policy-generator",
      color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
      badge: "Auto-Generate"
    },
    {
      title: "AI Agents",
      description: "Deploy specialized AI agents for automated legal and compliance tasks",
      icon: Bot,
      href: "/ai-agents",
      color: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
      badge: "Coming Soon"
    }
  ];

  const quickActions = [
    { 
      title: "Check Compliance", 
      icon: Shield, 
      href: "/compliance-check", 
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      description: "Upload documents for comprehensive compliance analysis against HIPAA, GDPR, and ISO standards"
    },
    { 
      title: "Review Contracts", 
      icon: FileText, 
      href: "/contract-review", 
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      description: "AI-powered document analysis with gap identification and improvement suggestions"
    },
    { 
      title: "Generate Policy", 
      icon: BookOpen, 
      href: "/policy-generator", 
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      description: "Create comprehensive policies tailored to your organization's specific needs and requirements"
    },
    { 
      title: "Learn Modules", 
      icon: Users, 
      href: "/learn-modules", 
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      description: "Access interactive training modules and educational resources for legal compliance"
    }
  ];


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-8 md:px-16 py-6">
        {/* Header Section with Dynamic Greeting */}
        <div className="flex items-center justify-between mb-8 bg-white dark:bg-slate-800 rounded-2xl py-3 px-6 shadow-sm hover:shadow-md transition-shadow border-b border-gray-200 dark:border-slate-600">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Welcome to Poligap
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              AI-Powered Legal Compliance Platform
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {getGreeting()}{userData?.name ? `, ${userData.name.split(' ')[0]}` : ""}
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              {getCurrentDate()}
            </p>
          </div>
        </div>

        {/* Quick Actions - 2x2 Grid */}
        <div className="mb-8">
          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-6 leading-relaxed">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href} prefetch={true}>
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer p-6 h-full">
                  <div className="flex items-start gap-4">
                    <div className={`${action.iconBg} rounded-xl p-2 flex items-center justify-center flex-shrink-0`}>
                      <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                    </div>
                    <div className="flex-1 min-h-0">
                      <h3 className="text-gray-900 font-semibold text-sm mb-1.5">
                        {action.title}
                      </h3>
                      <p className="text-gray-600 text-xs leading-snug">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white leading-relaxed">Recent Activity</h2>
            <Link href="/history" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View All →
            </Link>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
            {isLoadingActivity ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-2/3 mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                    </div>
                    <div className="w-12 h-4 bg-gray-200 rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => {
                  const IconComponent = getActivityIcon(activity.type);
                  const statusBadge = getStatusBadge(activity.status);
                  
                  return (
                    <div key={activity.id} className="flex items-center gap-3 py-1">
                      <div className={`w-6 h-6 ${getActivityIconBg(activity.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className={`h-3 w-3 ${getActivityIconColor(activity.type)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{activity.title}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {activity.fileName || activity.description.split(' ').slice(0, 4).join(' ')}... • {formatTimestamp(activity.timestamp)}
                        </p>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${statusBadge.className}`}>
                        {statusBadge.text === 'Completed' ? '✓' : statusBadge.text === 'In Progress' ? '⏳' : '✗'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 mb-1">No recent activity</p>
                <p className="text-xs text-gray-400">
                  Start using Poligap to see your activity here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="mb-8">
          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-6 leading-relaxed">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              {isLoadingStats ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900">{overviewStats.complianceChecks}</p>
                  <p className="text-xs text-gray-500">Compliance Checks</p>
                </>
              )}
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              {isLoadingStats ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900">{overviewStats.contractsReviewed}</p>
                  <p className="text-xs text-gray-500">Contracts Reviewed</p>
                </>
              )}
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              {isLoadingStats ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900">{overviewStats.policiesGenerated}</p>
                  <p className="text-xs text-gray-500">Policies Generated</p>
                </>
              )}
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 text-center">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              {isLoadingStats ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900">{overviewStats.trainingModules}</p>
                  <p className="text-xs text-gray-500">Training Modules</p>
                </>
              )}
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}

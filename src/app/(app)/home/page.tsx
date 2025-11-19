"use client";

import React from "react";
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
import { useOverviewStats } from "@/lib/queries/useHome";
import { formatGlobalDate } from "@/utils/date.util";
import RecentActivity from "@/components/recent-activity";


interface OverviewStats {
  complianceChecks: number;
  contractsReviewed: number;
  policiesGenerated: number;
  trainingModules: number;
}

export default function HomePage() {
  const { userData } = useUserStore();
  const { data: overviewStats = { complianceChecks: 0, contractsReviewed: 0, policiesGenerated: 0, trainingModules: 0 }, isLoading: isLoadingStats, error: statsError } = useOverviewStats();
  // Page visit tracking intentionally disabled; only result events are recorded
  
  // Get current time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get current date
  const getCurrentDate = () => {
    const date = new Date();
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const globalDate = formatGlobalDate(date);
    return `${weekday}, ${globalDate}`;
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
    // {
    //   title: "Policy Generator",
    //   description: "Generate comprehensive policies tailored to your organization's needs",
    //   icon: BookOpen,
    //   href: "/policy-generator",
    //   color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    //   badge: "Auto-Generate"
    // },
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
      iconBg: "bg-blue-100 dark:bg-blue-500/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      description: "Upload documents for comprehensive compliance analysis against HIPAA, GDPR, and ISO standards"
    },
    { 
      title: "Review Contracts", 
      icon: FileText, 
      href: "/contract-review", 
      iconBg: "bg-green-100 dark:bg-green-500/20",
      iconColor: "text-green-600 dark:text-green-400",
      description: "AI-powered document analysis with gap identification and improvement suggestions"
    },
    // { 
    //   title: "Generate Policy", 
    //   icon: BookOpen, 
    //   href: "/policy-generator", 
    //   iconBg: "bg-purple-100 dark:bg-purple-500/20",
    //   iconColor: "text-purple-600 dark:text-purple-400",
    //   description: "Create comprehensive policies tailored to your organization's specific needs and requirements"
    // },
    { 
      title: "Learn Modules", 
      icon: Users, 
      href: "/learn-modules", 
      iconBg: "bg-orange-100 dark:bg-orange-500/20",
      iconColor: "text-orange-600 dark:text-orange-400",
      description: "Access interactive training modules and educational resources for legal compliance"
    }
  ];


  return (
    <div className="min-h-screen bg-background dark:bg-background">
      <div className="max-w-6xl mx-auto px-8 md:px-16 py-6">
        {/* Header Section with Dynamic Greeting */}
        <div className="flex items-center justify-between mb-8 bg-card dark:bg-card rounded-2xl py-3 px-6 shadow-sm hover:shadow-md transition-shadow border-b border-border dark:border-border">
          <div>
            <h1 className="text-xl font-semibold text-foreground dark:text-foreground">
              Welcome to Poligap
            </h1>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              AI-Powered Legal Compliance Platform
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-foreground dark:text-foreground">
              {getGreeting()}{userData?.name ? `, ${userData.name.split(' ')[0]}` : ""}
            </h2>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-0.5">
              {getCurrentDate()}
            </p>
          </div>
        </div>

        {/* Quick Actions - 2x2 Grid */}
        <div className="mb-8">
          <h2 className="text-[15px] font-semibold text-foreground dark:text-foreground mb-6 leading-relaxed">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} prefetch={true}>
                <div className="bg-card dark:bg-card border border-border dark:border-border rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer p-6 h-full">
                  <div className="flex items-start gap-4">
                    <div className={`${action.iconBg} rounded-xl p-2 flex items-center justify-center flex-shrink-0`}>
                      <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                    </div>
                    <div className="flex-1 min-h-0">
                      <h3 className="text-foreground dark:text-foreground font-semibold text-sm mb-1.5">
                        {action.title}
                      </h3>
                      <p className="text-muted-foreground dark:text-muted-foreground text-xs leading-snug">
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
            <h2 className="text-[15px] font-semibold text-foreground dark:text-foreground leading-relaxed">Recent Activity</h2>
            <Link href="/history" className="text-xs text-primary dark:text-primary hover:text-primary/90 dark:hover:text-primary/90 font-medium">
              View All →
            </Link>
          </div>
          <RecentActivity limit={5} showHeader={false} compact={true} />
        </div>

        {/* Statistics Overview */}
        <div className="mb-8">
          <h2 className="text-[15px] font-semibold text-foreground dark:text-foreground mb-6 leading-relaxed">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card dark:bg-card border border-border dark:border-border rounded-2xl shadow-sm p-4 text-center">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              {isLoadingStats ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-accent dark:bg-accent rounded w-12 mx-auto mb-2"></div>
                  <div className="h-3 bg-accent dark:bg-accent rounded w-20 mx-auto"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground dark:text-foreground">
                    {overviewStats.complianceChecks || 0}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">Compliance Checks</p>
                </>
              )}
            </div>
            <div className="bg-card dark:bg-card border border-border dark:border-border rounded-2xl shadow-sm p-4 text-center">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              {isLoadingStats ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-accent dark:bg-accent rounded w-12 mx-auto mb-2"></div>
                  <div className="h-3 bg-accent dark:bg-accent rounded w-20 mx-auto"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground dark:text-foreground">
                    {overviewStats.contractsReviewed || 0}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">Contracts Reviewed</p>
                </>
              )}
            </div>
            <div className="bg-card dark:bg-card border border-border dark:border-border rounded-2xl shadow-sm p-4 text-center">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              {isLoadingStats ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-accent dark:bg-accent rounded w-12 mx-auto mb-2"></div>
                  <div className="h-3 bg-accent dark:bg-accent rounded w-20 mx-auto"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground dark:text-foreground">
                    {overviewStats.policiesGenerated || 0}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">Policies Generated</p>
                </>
              )}
            </div>
            <div className="bg-card dark:bg-card border border-border dark:border-border rounded-2xl shadow-sm p-4 text-center">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              {isLoadingStats ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-accent dark:bg-accent rounded w-12 mx-auto mb-2"></div>
                  <div className="h-3 bg-accent dark:bg-accent rounded w-20 mx-auto"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground dark:text-foreground">
                    {overviewStats.trainingModules || 5}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">Training Modules</p>
                </>
              )}
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}

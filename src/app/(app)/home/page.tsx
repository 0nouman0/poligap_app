"use client";

import React, { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  FileText, 
  Bot, 
  Upload, 
  Search, 
  CheckCircle, 
  ArrowRight,
  TrendingUp,
  Users,
  Clock,
  Star,
  Zap,
  Target,
  Award,
  BookOpen,
  Settings
} from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import Link from "next/link";
import { DashboardSkeleton } from "@/components/ui/page-loader";

export default function HomePage() {
  const { userData } = useUserStore();
  
  // Get current time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get current date
  const getCurrentDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    };
    return today.toLocaleDateString("en-US", options);
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
    { title: "Check Compliance", icon: Shield, href: "/compliance-check", color: "bg-blue-600" },
    { title: "Review Contracts", icon: FileText, href: "/contract-review", color: "bg-green-600" },
    { title: "Generate Policy", icon: BookOpen, href: "/policy-generator", color: "bg-purple-600" },
    { title: "Learn Modules", icon: Users, href: "/learn-modules", color: "bg-orange-600" }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get compliance results in seconds, not hours"
    },
    {
      icon: Target,
      title: "Highly Accurate",
      description: "AI-powered analysis with 99%+ accuracy rates"
    },
    {
      icon: Award,
      title: "Industry Standards",
      description: "Supports GDPR, HIPAA, ISO 27001, SOC 2, and more"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share results and collaborate with your team"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section with Greeting */}
        <div className="text-center mb-12">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground font-medium">
              {getCurrentDate()}
            </p>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {getGreeting()}{userData?.name ? `, ${userData.name}` : ""}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Welcome to Poligap - Your AI-powered legal compliance and contract analysis platform
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-center mb-8">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href} prefetch={true}>
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-medium text-sm">{action.title}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

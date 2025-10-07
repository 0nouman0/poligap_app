"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  FileText, 
  Users, 
  Clock, 
  BookOpen, 
  ArrowRight,
  CheckCircle,
  Play,
  Lock,
  Settings
} from "lucide-react";
import Link from "next/link";

export default function LearnModulesPage() {
  const modules = [
    {
      id: "gdpr",
      title: "GDPR (General Data Protection Regulation)",
      description: "Learn about EU's comprehensive data protection law and compliance requirements",
      icon: Shield,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      duration: "45 min",
      lessons: 5,
      difficulty: "Intermediate",
      category: "Data Protection"
    },
    {
      id: "ccpa",
      title: "CCPA (California Consumer Privacy Act)",
      description: "Understanding California's privacy law and consumer rights protection",
      icon: Users,
      color: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
      duration: "35 min",
      lessons: 5,
      difficulty: "Beginner",
      category: "Privacy Law"
    },
    {
      id: "hipaa",
      title: "HIPAA (Health Insurance Portability and Accountability Act)",
      description: "Healthcare data protection and patient privacy compliance standards",
      icon: FileText,
      color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
      duration: "50 min",
      lessons: 5,
      difficulty: "Advanced",
      category: "Healthcare"
    },
    {
      id: "iso27001",
      title: "ISO 27001 Information Security Management",
      description: "International standard for information security management systems",
      icon: Shield,
      color: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
      duration: "60 min",
      lessons: 5,
      difficulty: "Advanced",
      category: "Security"
    },
    {
      id: "soc2",
      title: "SOC 2 (Service Organization Control 2)",
      description: "Security, availability, and confidentiality audit framework",
      icon: CheckCircle,
      color: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
      duration: "40 min",
      lessons: 5,
      difficulty: "Intermediate",
      category: "Audit"
    },
    {
      id: "pci-dss",
      title: "PCI DSS (Payment Card Industry Data Security Standard)",
      description: "Credit card data protection and secure payment processing standards",
      icon: Lock,
      color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
      duration: "45 min",
      lessons: 5,
      difficulty: "Intermediate",
      category: "Payment Security"
    },
    {
      id: "ferpa",
      title: "FERPA (Family Educational Rights and Privacy Act)",
      description: "Educational records privacy and student information protection",
      icon: BookOpen,
      color: "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400",
      duration: "30 min",
      lessons: 5,
      difficulty: "Beginner",
      category: "Education"
    },
    {
      id: "coppa",
      title: "COPPA (Children's Online Privacy Protection Act)",
      description: "Children's online privacy protection and parental consent requirements",
      icon: Users,
      color: "bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400",
      duration: "25 min",
      lessons: 5,
      difficulty: "Beginner",
      category: "Privacy Law"
    },
    {
      id: "glba",
      title: "GLBA (Gramm-Leach-Bliley Act)",
      description: "Financial privacy protection and safeguards for consumer information",
      icon: Shield,
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
      duration: "40 min",
      lessons: 5,
      difficulty: "Intermediate",
      category: "Financial"
    },
    {
      id: "sox",
      title: "SOX (Sarbanes-Oxley Act)",
      description: "Corporate governance, financial reporting, and internal controls",
      icon: FileText,
      color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
      duration: "55 min",
      lessons: 5,
      difficulty: "Advanced",
      category: "Financial"
    },
    {
      id: "nist",
      title: "NIST Cybersecurity Framework",
      description: "National Institute of Standards cybersecurity risk management framework",
      icon: Shield,
      color: "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
      duration: "65 min",
      lessons: 5,
      difficulty: "Advanced",
      category: "Security"
    },
    {
      id: "pipeda",
      title: "PIPEDA (Personal Information Protection and Electronic Documents Act)",
      description: "Canadian federal privacy law for personal information protection",
      icon: Users,
      color: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400",
      duration: "35 min",
      lessons: 5,
      difficulty: "Intermediate",
      category: "Privacy Law"
    },
    {
      id: "fisma",
      title: "FISMA (Federal Information Security Management Act)",
      description: "US federal information security management and compliance requirements",
      icon: Lock,
      color: "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400",
      duration: "50 min",
      lessons: 5,
      difficulty: "Advanced",
      category: "Government"
    },
    {
      id: "coso",
      title: "COSO Internal Control Framework",
      description: "Enterprise risk management and internal control best practices",
      icon: CheckCircle,
      color: "bg-lime-50 text-lime-600 dark:bg-lime-900/20 dark:text-lime-400",
      duration: "45 min",
      lessons: 5,
      difficulty: "Intermediate",
      category: "Risk Management"
    },
    {
      id: "cobit",
      title: "COBIT (Control Objectives for Information and Related Technologies)",
      description: "IT governance framework for enterprise technology management",
      icon: Settings,
      color: "bg-slate-50 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400",
      duration: "55 min",
      lessons: 5,
      difficulty: "Advanced",
      category: "IT Governance"
    }
  ];

  const categories = ["All", "Data Protection", "Privacy Law", "Healthcare", "Security", "Audit", "Payment Security", "Education", "Financial", "Government", "Risk Management", "IT Governance"];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Learn Modules
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Master compliance standards with our comprehensive learning modules. Each module contains structured lessons to build your expertise.
        </p>
      </div>


      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {modules.map((module) => (
          <Link key={module.id} href={`/learn-modules/${module.id}`}>
            <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-lg ${module.color} group-hover:scale-110 transition-transform`}>
                    <module.icon className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {module.category}
                  </Badge>
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {module.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  {module.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{module.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    <span>{module.lessons} lessons</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge 
                    variant={module.difficulty === "Beginner" ? "default" : 
                            module.difficulty === "Intermediate" ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {module.difficulty}
                  </Badge>
                  <div className="flex items-center text-primary font-medium text-sm">
                    <span>Start Learning</span>
                    <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Users,
  Shield,
  FileText,
  Lock,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ModulePage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);

  const moduleData = {
    gdpr: {
      title: "GDPR (General Data Protection Regulation)",
      description: "Learn about EU's comprehensive data protection law and compliance requirements",
      icon: Shield,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      duration: "45 min",
      difficulty: "Intermediate",
      category: "Data Protection"
    },
    ccpa: {
      title: "CCPA (California Consumer Privacy Act)",
      description: "Understanding California's privacy law and consumer rights protection",
      icon: Users,
      color: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
      duration: "35 min",
      difficulty: "Beginner",
      category: "Privacy Law"
    },
    hipaa: {
      title: "HIPAA (Health Insurance Portability and Accountability Act)",
      description: "Healthcare data protection and patient privacy compliance standards",
      icon: FileText,
      color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
      duration: "50 min",
      difficulty: "Advanced",
      category: "Healthcare"
    },
    iso27001: {
      title: "ISO 27001 Information Security Management",
      description: "International standard for information security management systems",
      icon: Shield,
      color: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
      duration: "60 min",
      difficulty: "Advanced",
      category: "Security"
    },
    soc2: {
      title: "SOC 2 (Service Organization Control 2)",
      description: "Security, availability, and confidentiality audit framework",
      icon: CheckCircle,
      color: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
      duration: "40 min",
      difficulty: "Intermediate",
      category: "Audit"
    },
    "pci-dss": {
      title: "PCI DSS (Payment Card Industry Data Security Standard)",
      description: "Credit card data protection and secure payment processing standards",
      icon: Lock,
      color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
      duration: "45 min",
      difficulty: "Intermediate",
      category: "Payment Security"
    }
  };

  const lessons = [
    {
      id: 1,
      title: "Introduction",
      description: "Overview and fundamentals of the compliance standard",
      duration: "8 min",
      content: "Learn the basics and understand why this compliance standard exists"
    },
    {
      id: 2,
      title: "Applicable To",
      description: "Scope and coverage - who needs to comply",
      duration: "10 min",
      content: "Understand which organizations and scenarios this standard applies to"
    },
    {
      id: 3,
      title: "Considerations",
      description: "Key requirements and implementation guidelines",
      duration: "12 min",
      content: "Deep dive into the main requirements and how to implement them"
    },
    {
      id: 4,
      title: "Exceptions and Other Clauses",
      description: "Special cases, exemptions, and additional provisions",
      duration: "10 min",
      content: "Learn about exceptions, special circumstances, and additional clauses"
    },
    {
      id: 5,
      title: "Conclusion",
      description: "Summary and next steps for implementation",
      duration: "5 min",
      content: "Wrap up with key takeaways and actionable next steps"
    }
  ];

  const currentModule = moduleData[moduleId as keyof typeof moduleData];
  const progress = (completedLessons.length / lessons.length) * 100;

  const toggleLessonComplete = (lessonId: number) => {
    setCompletedLessons(prev => 
      prev.includes(lessonId) 
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  if (!currentModule) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Module Not Found</h1>
        <Link href="/learn-modules">
          <Button>Back to Modules</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/learn-modules">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Modules
          </Button>
        </Link>
        
        <div className="flex items-start gap-6 mb-6">
          <div className={`p-4 rounded-xl ${currentModule.color}`}>
            <currentModule.icon className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{currentModule.title}</h1>
              <Badge variant="secondary">{currentModule.category}</Badge>
            </div>
            <p className="text-lg text-muted-foreground mb-4">
              {currentModule.description}
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{currentModule.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{lessons.length} lessons</span>
              </div>
              <Badge 
                variant={currentModule.difficulty === "Beginner" ? "default" : 
                        currentModule.difficulty === "Intermediate" ? "secondary" : "destructive"}
              >
                {currentModule.difficulty}
              </Badge>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedLessons.length}/{lessons.length} lessons completed
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Lessons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {lessons.map((lesson, index) => {
          const isCompleted = completedLessons.includes(lesson.id);
          const isAccessible = index === 0 || completedLessons.includes(lessons[index - 1].id);
          
          return (
            <Card 
              key={lesson.id} 
              className={`transition-all duration-200 ${
                isAccessible ? 'hover:shadow-lg cursor-pointer' : 'opacity-60'
              } ${isCompleted ? 'border-green-500 bg-green-50/50' : ''}`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' : 
                      isAccessible ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : isAccessible ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <span className="text-sm font-bold">{lesson.id}</span>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{lesson.title}</CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{lesson.duration}</span>
                      </div>
                    </div>
                  </div>
                  {isAccessible && (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  {lesson.description}
                </p>
                <p className="text-sm mb-4">
                  {lesson.content}
                </p>
                {isAccessible && (
                  <div className="flex gap-2">
                    <Link href={`/learn-modules/${moduleId}/${lesson.id}`} className="flex-1">
                      <Button className="w-full" size="sm">
                        {isCompleted ? 'Review Lesson' : 'Start Lesson'}
                      </Button>
                    </Link>
                    {isCompleted && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleLessonComplete(lesson.id)}
                      >
                        Mark Incomplete
                      </Button>
                    )}
                  </div>
                )}
                {!isAccessible && (
                  <p className="text-xs text-muted-foreground">
                    Complete previous lesson to unlock
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Completion Certificate */}
      {completedLessons.length === lessons.length && (
        <Card className="mt-8 bg-gradient-to-r from-green-600 to-blue-600 text-white border-0">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
            <p className="text-lg mb-4 opacity-90">
              You've completed the {currentModule.title} module
            </p>
            <Button variant="secondary" size="lg">
              Download Certificate
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

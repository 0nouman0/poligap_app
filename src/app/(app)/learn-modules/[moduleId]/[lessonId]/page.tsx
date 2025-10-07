"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Users,
  Shield,
  FileText,
  Lock,
  Play,
  Pause
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.moduleId as string;
  const lessonId = parseInt(params.lessonId as string);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);

  const moduleData = {
    gdpr: { title: "GDPR", icon: Shield, color: "text-blue-600" },
    ccpa: { title: "CCPA", icon: Users, color: "text-green-600" },
    hipaa: { title: "HIPAA", icon: FileText, color: "text-purple-600" },
    iso27001: { title: "ISO 27001", icon: Shield, color: "text-orange-600" },
    soc2: { title: "SOC 2", icon: CheckCircle, color: "text-red-600" },
    "pci-dss": { title: "PCI DSS", icon: Lock, color: "text-indigo-600" }
  };

  const lessons = {
    1: {
      title: "Introduction",
      duration: "8 min",
      sections: [
        {
          title: "What is this standard?",
          content: "This compliance standard represents a comprehensive framework designed to protect sensitive information and ensure organizational accountability. Understanding its foundations is crucial for effective implementation."
        },
        {
          title: "Why was it created?",
          content: "The standard emerged from the need to address growing concerns about data protection, privacy rights, and security breaches. It provides a structured approach to managing compliance requirements."
        },
        {
          title: "Key benefits",
          content: "Organizations that implement this standard benefit from enhanced security posture, reduced risk of data breaches, improved customer trust, and regulatory compliance."
        }
      ]
    },
    2: {
      title: "Applicable To",
      duration: "10 min",
      sections: [
        {
          title: "Who must comply?",
          content: "This standard applies to organizations that handle specific types of data or operate in certain industries. The scope depends on factors such as data volume, geographic location, and business activities."
        },
        {
          title: "Geographic scope",
          content: "The territorial application of this standard extends beyond traditional boundaries, often applying to organizations that serve customers or process data from specific regions."
        },
        {
          title: "Industry sectors",
          content: "Various industry sectors are subject to this standard, including healthcare, finance, technology, and retail. Each sector may have specific requirements and implementation guidelines."
        }
      ]
    },
    3: {
      title: "Considerations",
      duration: "12 min",
      sections: [
        {
          title: "Core requirements",
          content: "The fundamental requirements include establishing appropriate technical and organizational measures, implementing data protection by design, and ensuring ongoing compliance monitoring."
        },
        {
          title: "Implementation steps",
          content: "Successful implementation requires a phased approach: assessment of current state, gap analysis, policy development, staff training, and continuous monitoring and improvement."
        },
        {
          title: "Best practices",
          content: "Industry best practices include regular risk assessments, employee training programs, incident response procedures, and maintaining comprehensive documentation of compliance efforts."
        }
      ]
    },
    4: {
      title: "Exceptions and Other Clauses",
      duration: "10 min",
      sections: [
        {
          title: "Common exceptions",
          content: "Certain activities or organizations may be exempt from specific requirements. These exceptions are typically limited and require careful evaluation to determine applicability."
        },
        {
          title: "Special circumstances",
          content: "Unique situations may require alternative compliance approaches. These include emergency procedures, cross-border data transfers, and third-party processing arrangements."
        },
        {
          title: "Additional provisions",
          content: "The standard includes various additional clauses covering topics such as data subject rights, breach notification requirements, and supervisory authority interactions."
        }
      ]
    },
    5: {
      title: "Conclusion",
      duration: "5 min",
      sections: [
        {
          title: "Key takeaways",
          content: "The most important points to remember include the importance of proactive compliance, the need for ongoing monitoring, and the benefits of treating compliance as a business enabler rather than just a requirement."
        },
        {
          title: "Next steps",
          content: "After completing this module, consider conducting a compliance assessment for your organization, developing an implementation roadmap, and establishing regular review processes."
        },
        {
          title: "Additional resources",
          content: "Continue your learning journey with official guidance documents, industry publications, professional certifications, and participation in relevant compliance communities."
        }
      ]
    }
  };

  const currentModule = moduleData[moduleId as keyof typeof moduleData];
  const currentLesson = lessons[lessonId as keyof typeof lessons];
  const progress = ((currentSection + 1) / currentLesson.sections.length) * 100;

  const handleNext = () => {
    if (currentSection < currentLesson.sections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleComplete = () => {
    // In a real app, you'd save completion status to backend
    router.push(`/learn-modules/${moduleId}`);
  };

  if (!currentModule || !currentLesson) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Lesson Not Found</h1>
        <Link href="/learn-modules">
          <Button>Back to Modules</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href={`/learn-modules/${moduleId}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {currentModule.title}
          </Button>
        </Link>
        
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3 rounded-lg bg-muted ${currentModule.color}`}>
            <currentModule.icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{currentLesson.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{currentLesson.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>Lesson {lessonId} of 5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Lesson Progress</span>
            <span className="text-sm text-muted-foreground">
              {currentSection + 1}/{currentLesson.sections.length} sections
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Lesson Content */}
      {!isCompleted ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">
              {currentLesson.sections[currentSection].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-base leading-relaxed mb-6">
                {currentLesson.sections[currentSection].content}
              </p>
            </div>

            {/* Section Navigation */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentSection === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <div className="flex gap-2">
                {currentLesson.sections.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index <= currentSection ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

              <Button onClick={handleNext}>
                {currentSection === currentLesson.sections.length - 1 ? 'Complete' : 'Next'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Completion Screen */
        <Card className="mb-8 bg-gradient-to-r from-green-600 to-blue-600 text-white border-0">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Lesson Complete!</h2>
            <p className="text-lg mb-6 opacity-90">
              You've successfully completed "{currentLesson.title}"
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="secondary" onClick={handleComplete}>
                Continue to Next Lesson
              </Button>
              <Button variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                Review Lesson
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lesson Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lessonId > 1 && (
          <Link href={`/learn-modules/${moduleId}/${lessonId - 1}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Previous Lesson</p>
                    <p className="font-medium">Lesson {lessonId - 1}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
        
        {lessonId < 5 && (
          <Link href={`/learn-modules/${moduleId}/${lessonId + 1}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer md:ml-auto">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 md:flex-row-reverse">
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="md:text-right">
                    <p className="text-sm text-muted-foreground">Next Lesson</p>
                    <p className="font-medium">Lesson {lessonId + 1}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}

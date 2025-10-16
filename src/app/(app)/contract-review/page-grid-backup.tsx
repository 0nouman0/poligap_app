"use client";

import React, { useState, useRef, useEffect } from "react";
import { Shield, BookOpen, Award, ChevronLeft, ChevronRight, CheckCircle, Upload, FileText, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/stores/user-store";
import { toastSuccess, toastError } from "@/components/toast-varients";

interface ContractTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  sections: number;
  sources: string[];
  isBaseline: boolean;
  requiredSections: Array<{
    title: string;
    priority: "critical" | "high" | "medium" | "low";
  }>;
}

const knowledgeBaseTemplates: ContractTemplate[] = [
  {
    id: "service-agreement",
    name: "Service Agreement Template",
    type: "service",
    description: "Baseline template for service agreements",
    sections: 5,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Definitions", priority: "high" },
      { title: "Scope of Services", priority: "high" },
      { title: "Fees & Payment", priority: "medium" },
      { title: "Term & Termination", priority: "critical" },
      { title: "Limitation of Liability", priority: "medium" }
    ]
  },
  {
    id: "msa",
    name: "Master Services Agreement",
    type: "service",
    description: "Baseline template for service agreements",
    sections: 5,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Definitions", priority: "high" },
      { title: "Scope of Services", priority: "high" },
      { title: "Fees & Payment", priority: "medium" },
      { title: "Term & Termination", priority: "critical" },
      { title: "Limitation of Liability", priority: "medium" }
    ]
  },
  {
    id: "nda",
    name: "Non-Disclosure Agreement",
    type: "legal",
    description: "Baseline template for service agreements",
    sections: 5,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Definitions", priority: "high" },
      { title: "Scope of Services", priority: "high" },
      { title: "Fees & Payment", priority: "medium" },
      { title: "Term & Termination", priority: "critical" },
      { title: "Limitation of Liability", priority: "medium" }
    ]
  },
  {
    id: "dpa",
    name: "Data Processing Agreement",
    type: "technology",
    description: "Baseline template for service agreements",
    sections: 5,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Definitions", priority: "high" },
      { title: "Scope of Services", priority: "high" },
      { title: "Fees & Payment", priority: "medium" },
      { title: "Term & Termination", priority: "critical" },
      { title: "Limitation of Liability", priority: "medium" }
    ]
  },
  {
    id: "sla",
    name: "Service Level Agreement",
    type: "technology",
    description: "Baseline template for service agreements",
    sections: 5,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Definitions", priority: "high" },
      { title: "Scope of Services", priority: "high" },
      { title: "Fees & Payment", priority: "medium" },
      { title: "Term & Termination", priority: "critical" },
      { title: "Limitation of Liability", priority: "medium" }
    ]
  },
  {
    id: "employment",
    name: "Employment Agreement",
    type: "hr",
    description: "Standard employment contract template",
    sections: 8,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Position & Duties", priority: "high" },
      { title: "Compensation", priority: "critical" },
      { title: "Benefits", priority: "medium" },
      { title: "Confidentiality", priority: "high" },
      { title: "Termination", priority: "critical" }
    ]
  },
  {
    id: "consulting",
    name: "Consulting Agreement",
    type: "service",
    description: "Independent contractor consulting template",
    sections: 6,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Scope of Work", priority: "high" },
      { title: "Compensation", priority: "high" },
      { title: "IP Ownership", priority: "critical" },
      { title: "Term & Termination", priority: "medium" },
      { title: "Confidentiality", priority: "high" }
    ]
  },
  {
    id: "vendor",
    name: "Vendor Agreement",
    type: "procurement",
    description: "Standard vendor/supplier contract",
    sections: 7,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Products & Services", priority: "high" },
      { title: "Pricing & Payment", priority: "high" },
      { title: "Delivery Terms", priority: "medium" },
      { title: "Warranties", priority: "medium" },
      { title: "Liability", priority: "high" }
    ]
  },
  {
    id: "partnership",
    name: "Partnership Agreement",
    type: "corporate",
    description: "Business partnership contract template",
    sections: 9,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Business Purpose", priority: "high" },
      { title: "Capital Contributions", priority: "critical" },
      { title: "Profit Distribution", priority: "critical" },
      { title: "Decision Making", priority: "high" },
      { title: "Dissolution", priority: "medium" }
    ]
  },
  {
    id: "licensing",
    name: "Software Licensing Agreement",
    type: "technology",
    description: "Software license and usage rights",
    sections: 6,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "License Grant", priority: "critical" },
      { title: "Restrictions", priority: "high" },
      { title: "Fees", priority: "high" },
      { title: "Support & Maintenance", priority: "medium" },
      { title: "Termination", priority: "high" }
    ]
  },
  {
    id: "saas",
    name: "SaaS Agreement",
    type: "technology",
    description: "Software as a Service subscription",
    sections: 7,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Service Description", priority: "high" },
      { title: "Subscription Terms", priority: "critical" },
      { title: "Data Security", priority: "critical" },
      { title: "SLA", priority: "high" },
      { title: "Liability", priority: "medium" }
    ]
  },
  {
    id: "reseller",
    name: "Reseller Agreement",
    type: "sales",
    description: "Product resale and distribution rights",
    sections: 8,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Territory", priority: "high" },
      { title: "Products", priority: "high" },
      { title: "Pricing & Discounts", priority: "critical" },
      { title: "Marketing", priority: "medium" },
      { title: "Termination", priority: "medium" }
    ]
  },
  {
    id: "franchise",
    name: "Franchise Agreement",
    type: "business",
    description: "Franchise operation and licensing",
    sections: 12,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Franchise Grant", priority: "critical" },
      { title: "Territory", priority: "high" },
      { title: "Fees & Royalties", priority: "critical" },
      { title: "Operations Manual", priority: "high" },
      { title: "Training", priority: "medium" }
    ]
  },
  {
    id: "distribution",
    name: "Distribution Agreement",
    type: "sales",
    description: "Product distribution rights",
    sections: 8,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Distribution Rights", priority: "critical" },
      { title: "Territory", priority: "high" },
      { title: "Minimum Orders", priority: "medium" },
      { title: "Pricing", priority: "high" },
      { title: "Term", priority: "medium" }
    ]
  },
  {
    id: "lease-commercial",
    name: "Commercial Lease Agreement",
    type: "real-estate",
    description: "Commercial property lease",
    sections: 10,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Premises", priority: "critical" },
      { title: "Rent", priority: "critical" },
      { title: "Term", priority: "high" },
      { title: "Maintenance", priority: "medium" },
      { title: "Insurance", priority: "medium" }
    ]
  },
  {
    id: "lease-equipment",
    name: "Equipment Lease Agreement",
    type: "finance",
    description: "Equipment rental and lease",
    sections: 7,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Equipment Description", priority: "high" },
      { title: "Lease Payments", priority: "critical" },
      { title: "Maintenance", priority: "medium" },
      { title: "Insurance", priority: "medium" },
      { title: "Return Conditions", priority: "high" }
    ]
  },
  {
    id: "loan",
    name: "Loan Agreement",
    type: "finance",
    description: "Business or personal loan contract",
    sections: 8,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Loan Amount", priority: "critical" },
      { title: "Interest Rate", priority: "critical" },
      { title: "Repayment Terms", priority: "critical" },
      { title: "Collateral", priority: "high" },
      { title: "Default", priority: "high" }
    ]
  },
  {
    id: "agency",
    name: "Agency Agreement",
    type: "service",
    description: "Sales or service agency representation",
    sections: 7,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Appointment", priority: "critical" },
      { title: "Territory", priority: "high" },
      { title: "Commission", priority: "critical" },
      { title: "Obligations", priority: "high" },
      { title: "Termination", priority: "medium" }
    ]
  },
  {
    id: "joint-venture",
    name: "Joint Venture Agreement",
    type: "corporate",
    description: "Collaborative business venture",
    sections: 10,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Purpose", priority: "high" },
      { title: "Contributions", priority: "critical" },
      { title: "Management", priority: "high" },
      { title: "Profit Sharing", priority: "critical" },
      { title: "Exit Strategy", priority: "medium" }
    ]
  },
  {
    id: "merger",
    name: "Merger Agreement",
    type: "corporate",
    description: "Company merger and acquisition",
    sections: 15,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Transaction Structure", priority: "critical" },
      { title: "Consideration", priority: "critical" },
      { title: "Representations", priority: "high" },
      { title: "Conditions", priority: "high" },
      { title: "Indemnification", priority: "high" }
    ]
  },
  {
    id: "shareholder",
    name: "Shareholders Agreement",
    type: "corporate",
    description: "Rights and obligations of shareholders",
    sections: 11,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Share Ownership", priority: "critical" },
      { title: "Voting Rights", priority: "high" },
      { title: "Dividends", priority: "medium" },
      { title: "Transfer Restrictions", priority: "high" },
      { title: "Dispute Resolution", priority: "medium" }
    ]
  },
  {
    id: "ip-assignment",
    name: "IP Assignment Agreement",
    type: "legal",
    description: "Intellectual property rights transfer",
    sections: 6,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "IP Description", priority: "critical" },
      { title: "Assignment", priority: "critical" },
      { title: "Consideration", priority: "high" },
      { title: "Warranties", priority: "high" },
      { title: "Indemnification", priority: "medium" }
    ]
  },
  {
    id: "trademark-license",
    name: "Trademark License Agreement",
    type: "legal",
    description: "Trademark usage rights",
    sections: 7,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Licensed Marks", priority: "critical" },
      { title: "Scope", priority: "high" },
      { title: "Quality Control", priority: "high" },
      { title: "Royalties", priority: "critical" },
      { title: "Term", priority: "medium" }
    ]
  },
  {
    id: "manufacturing",
    name: "Manufacturing Agreement",
    type: "operations",
    description: "Product manufacturing contract",
    sections: 9,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Products", priority: "critical" },
      { title: "Specifications", priority: "critical" },
      { title: "Pricing", priority: "high" },
      { title: "Quality Standards", priority: "high" },
      { title: "Delivery", priority: "medium" }
    ]
  },
  {
    id: "supply",
    name: "Supply Agreement",
    type: "procurement",
    description: "Raw materials or goods supply",
    sections: 8,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Products", priority: "high" },
      { title: "Pricing", priority: "critical" },
      { title: "Delivery Schedule", priority: "high" },
      { title: "Quality Assurance", priority: "high" },
      { title: "Payment Terms", priority: "critical" }
    ]
  },
  {
    id: "purchase",
    name: "Purchase Agreement",
    type: "procurement",
    description: "Asset or business purchase",
    sections: 10,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Purchase Price", priority: "critical" },
      { title: "Assets Included", priority: "critical" },
      { title: "Closing Conditions", priority: "high" },
      { title: "Representations", priority: "high" },
      { title: "Indemnification", priority: "medium" }
    ]
  },
  {
    id: "maintenance",
    name: "Maintenance Agreement",
    type: "service",
    description: "Equipment or software maintenance",
    sections: 6,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Services", priority: "high" },
      { title: "Response Time", priority: "high" },
      { title: "Fees", priority: "critical" },
      { title: "Term", priority: "medium" },
      { title: "Liability", priority: "medium" }
    ]
  },
  {
    id: "escrow",
    name: "Escrow Agreement",
    type: "finance",
    description: "Third-party escrow arrangement",
    sections: 7,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Escrowed Property", priority: "critical" },
      { title: "Release Conditions", priority: "critical" },
      { title: "Escrow Agent Duties", priority: "high" },
      { title: "Fees", priority: "medium" },
      { title: "Term", priority: "medium" }
    ]
  },
  {
    id: "indemnity",
    name: "Indemnity Agreement",
    type: "legal",
    description: "Liability protection and indemnification",
    sections: 5,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Indemnification Scope", priority: "critical" },
      { title: "Covered Losses", priority: "high" },
      { title: "Limitations", priority: "high" },
      { title: "Defense", priority: "medium" },
      { title: "Insurance", priority: "medium" }
    ]
  },
  {
    id: "settlement",
    name: "Settlement Agreement",
    type: "legal",
    description: "Dispute resolution and settlement",
    sections: 6,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Settlement Terms", priority: "critical" },
      { title: "Payment", priority: "critical" },
      { title: "Release", priority: "high" },
      { title: "Confidentiality", priority: "high" },
      { title: "Non-Admission", priority: "medium" }
    ]
  },
  {
    id: "sponsorship",
    name: "Sponsorship Agreement",
    type: "marketing",
    description: "Event or program sponsorship",
    sections: 7,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Sponsorship Benefits", priority: "high" },
      { title: "Fees", priority: "critical" },
      { title: "Marketing Rights", priority: "high" },
      { title: "Deliverables", priority: "medium" },
      { title: "Term", priority: "medium" }
    ]
  },
  {
    id: "advertising",
    name: "Advertising Agreement",
    type: "marketing",
    description: "Advertising services contract",
    sections: 6,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Ad Placement", priority: "high" },
      { title: "Fees", priority: "critical" },
      { title: "Content Approval", priority: "high" },
      { title: "Performance Metrics", priority: "medium" },
      { title: "Term", priority: "medium" }
    ]
  },
  {
    id: "hosting",
    name: "Hosting Agreement",
    type: "technology",
    description: "Web or server hosting services",
    sections: 7,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Services", priority: "high" },
      { title: "Uptime SLA", priority: "critical" },
      { title: "Fees", priority: "high" },
      { title: "Data Security", priority: "critical" },
      { title: "Support", priority: "medium" }
    ]
  },
  {
    id: "api",
    name: "API License Agreement",
    type: "technology",
    description: "API access and usage rights",
    sections: 6,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "API Access", priority: "critical" },
      { title: "Usage Limits", priority: "high" },
      { title: "Fees", priority: "high" },
      { title: "Data Rights", priority: "critical" },
      { title: "Support", priority: "medium" }
    ]
  },
  {
    id: "referral",
    name: "Referral Agreement",
    type: "sales",
    description: "Customer referral compensation",
    sections: 5,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Referral Terms", priority: "high" },
      { title: "Commission", priority: "critical" },
      { title: "Qualified Referrals", priority: "high" },
      { title: "Payment Terms", priority: "high" },
      { title: "Term", priority: "medium" }
    ]
  },
  {
    id: "influencer",
    name: "Influencer Agreement",
    type: "marketing",
    description: "Social media influencer partnership",
    sections: 6,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Content Requirements", priority: "high" },
      { title: "Compensation", priority: "critical" },
      { title: "Exclusivity", priority: "medium" },
      { title: "IP Rights", priority: "high" },
      { title: "FTC Compliance", priority: "high" }
    ]
  },
  {
    id: "coaching",
    name: "Coaching Agreement",
    type: "service",
    description: "Professional coaching services",
    sections: 5,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Services", priority: "high" },
      { title: "Fees", priority: "critical" },
      { title: "Schedule", priority: "medium" },
      { title: "Confidentiality", priority: "high" },
      { title: "Termination", priority: "medium" }
    ]
  },
  {
    id: "training",
    name: "Training Agreement",
    type: "service",
    description: "Corporate or professional training",
    sections: 6,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Training Program", priority: "high" },
      { title: "Fees", priority: "critical" },
      { title: "Materials", priority: "medium" },
      { title: "Certification", priority: "medium" },
      { title: "IP Rights", priority: "high" }
    ]
  },
  {
    id: "subscription",
    name: "Subscription Agreement",
    type: "service",
    description: "Recurring service subscription",
    sections: 5,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Services", priority: "high" },
      { title: "Subscription Fee", priority: "critical" },
      { title: "Auto-Renewal", priority: "high" },
      { title: "Cancellation", priority: "high" },
      { title: "Refund Policy", priority: "medium" }
    ]
  }
];

export default function ContractReviewNew() {
  const userData = useUserStore((state) => state.userData);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredTemplates = knowledgeBaseTemplates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to get userId with fallbacks
  const getUserId = (): string | null => {
    if (userData?.userId) return userData.userId;
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('user_id');
      if (storedId) return storedId;
    }
    return process.env.NEXT_PUBLIC_FALLBACK_USER_ID || null;
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-[#EDDBDB] text-[#BA0003]";
      case "high":
        return "bg-[#FFE7E0] text-[#E55400]";
      case "medium":
        return "bg-[#FFF8CB] text-[#BF6D0A]";
      default:
        return "bg-[#E8E9FF] text-[#6E72FF]";
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toastSuccess('File Selected', `${file.name} is ready for analysis`);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile || !selectedTemplate) return;
    
    setIsAnalyzing(true);
    try {
      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      toastSuccess('Analysis Complete', 'Contract has been analyzed successfully');
      setCurrentStep(4);
    } catch (error) {
      toastError('Analysis Failed', 'Failed to analyze contract');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scrollTemplates = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = 243; // 240px card + 3px gap
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background select-none overflow-x-hidden">
      {/* Header */}
      <div className="px-6 py-3 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center">
            <Shield className="h-5 w-5 text-[#3B43D6]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">Contract Review</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">Upload contracts and get AI-powered analysis against reference templates</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="px-6 mb-3 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5 leading-tight">
              {currentStep === 1 && "Choose a baseline template from knowledge base"}
              {currentStep === 2 && "Upload Contract Document"}
              {currentStep === 3 && "Review Before Analysis"}
              {currentStep === 4 && "Analysis Results"}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {currentStep === 1 && "40 templates"}
              {currentStep === 2 && "Upload your contract file"}
              {currentStep === 3 && "Verify details before analysis"}
              {currentStep === 4 && "View your analysis results"}
            </p>
          </div>
          
          {/* Step Indicators */}
          <div className="flex items-center gap-3">
            {/* Step 01 */}
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === 1 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
              }`}>
                01
              </div>
              <div className="w-12 h-px bg-gray-300 dark:bg-gray-600 border-t border-dashed border-gray-300 dark:border-gray-600" />
            </div>
            
            {/* Step 02 */}
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === 2 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
              }`}>
                02
              </div>
              <div className="w-12 h-px bg-gray-300 dark:bg-gray-600 border-t border-dashed border-gray-300 dark:border-gray-600" />
            </div>
            
            {/* Step 03 */}
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === 3 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
              }`}>
                03
              </div>
              <div className="w-12 h-px bg-gray-300 dark:bg-gray-600 border-t border-dashed border-gray-300 dark:border-gray-600" />
            </div>
            
            {/* Step 04 */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentStep === 4 
                ? 'bg-blue-600 text-white' 
                : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
            }`}>
              04
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-32 max-w-[1600px] mx-auto">
        {currentStep === 1 && (
        <div className="space-y-3 overflow-x-hidden">
          {/* Search and Navigation - Moved Above */}
          <div className="flex items-center gap-3">
            <div className="relative w-[280px]">
              <Input
                placeholder="Search Template..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 text-xs pl-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-[5px] select-text text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
              <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path d="M5.5 9.5C7.70914 9.5 9.5 7.70914 9.5 5.5C9.5 3.29086 7.70914 1.5 5.5 1.5C3.29086 1.5 1.5 3.29086 1.5 5.5C1.5 7.70914 3.29086 9.5 5.5 9.5Z" stroke="#8D8D8D" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.5 10.5L8.5 8.5" stroke="#8D8D8D" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-hidden">
          {/* Left Side - Template Selection */}
          <div className="flex-1 min-w-0">
            {/* Contract Templates Card */}
            <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100">Contract Templates</h3>
              </div>
              
              <div className="text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-2 leading-tight">
                Select a baseline template that has been reviewed and approved by legal experts. Your uploaded contract will be compared against this template to identify gaps and weaknesses.
              </div>
              
              {/* Template Cards Grid with Vertical Scroll */}
              <div 
                ref={scrollContainerRef}
                className="max-h-[500px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pr-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-2">
                  {filteredTemplates.map((template) => {
                    const isSelected = selectedTemplate?.id === template.id;
                    return (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`bg-white dark:bg-gray-800 rounded-[10px] shadow-sm cursor-pointer transition-all ${
                          isSelected ? 'border-2 border-[#3B43D6] ring-1 ring-[#3B43D6]' : 'border border-transparent hover:border-[#3B43D6]/50'
                        }`}
                      >
                        <div className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="w-9 h-9 rounded-full bg-[#EFF1F6] dark:bg-gray-700 flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-[#3B43D6]" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="bg-[#EDFFDE] dark:bg-green-900/30 rounded-[35px] px-1.5 py-0.5 flex items-center gap-1">
                                <Award className="h-2.5 w-2.5 text-[#47AF47]" />
                                <span className="text-[9px] font-medium text-[#47AF47]">Baseline</span>
                              </div>
                              <CheckCircle className="h-4 w-4 text-[#DADADA] dark:text-gray-600" />
                            </div>
                          </div>
                          
                          <div className="mb-2">
                            <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-0.5 leading-tight">{template.name}</h4>
                            <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">{template.description}</p>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">
                              Sections: {template.sections}
                            </div>
                            <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                              Sources: {template.sources.join(", ")}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <div className="bg-gray-100 dark:bg-gray-700 rounded-[40px] px-1.5 py-0.5">
                                <span className="text-[9px] font-medium text-gray-700 dark:text-gray-300">Parties</span>
                              </div>
                              <div className="bg-gray-100 dark:bg-gray-700 rounded-[40px] px-1.5 py-0.5">
                                <span className="text-[9px] font-medium text-gray-700 dark:text-gray-300">Scope</span>
                              </div>
                              <div className="bg-gray-100 dark:bg-gray-700 rounded-[40px] px-1.5 py-0.5">
                                <span className="text-[9px] font-medium text-gray-700 dark:text-gray-300">Payment</span>
                              </div>
                              <div className="bg-gray-100 dark:bg-gray-700 rounded-[40px] px-1.5 py-0.5">
                                <span className="text-[9px] font-medium text-gray-700 dark:text-gray-300">+2 more</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Selected Template Details */}
          {selectedTemplate && (
            <div className="w-[280px] flex-shrink-0 space-y-3">
              {/* Template Details Card */}
              <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-sm p-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 leading-tight">
                  Selected: {selectedTemplate.name}
                </h3>
                
                {/* Required Sections */}
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">Required Sections:</h4>
                  <div className="space-y-2">
                    {selectedTemplate.requiredSections.map((section, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-500 flex-shrink-0" />
                        <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 flex-1 leading-tight">{section.title}</span>
                        <span className={`rounded-[35px] px-1.5 py-0.5 text-[9px] font-medium ${getPriorityBadgeColor(section.priority)}`}>
                          {section.priority.charAt(0).toUpperCase() + section.priority.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What We'll Check */}
                <div className="mb-0">
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">What We'll Check:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-500 flex-shrink-0" />
                      <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 leading-tight">Missing required sections</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-500 flex-shrink-0" />
                      <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 leading-tight">Weak or incomplete clauses</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-500 flex-shrink-0" />
                      <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 leading-tight">Non-compliant language</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-500 flex-shrink-0" />
                      <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 leading-tight">Risk exposure areas</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Logs Card */}
              <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-sm p-3">
                <div className="mb-2">
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-0.5">Audit Logs</h4>
                  <p className="text-[9px] text-gray-600 dark:text-gray-400 leading-tight">Recent activity</p>
                </div>
                
                <div className="h-[50px] flex items-center justify-center">
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">No logs yet</div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
        )}

        {/* Step 2: Upload Contract */}
        {currentStep === 2 && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-sm p-8">
              <div className="text-center mb-8">
                <Upload className="h-16 w-16 text-blue-600 dark:text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Upload Contract Document</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upload your contract to analyze against the selected template</p>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-[10px] p-12 text-center cursor-pointer hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all"
              >
                <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {uploadedFile ? uploadedFile.name : 'Click to browse or drag and drop'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Supported formats: PDF, DOC, DOCX</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-sm p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Review Before Analysis</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-[5px]">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Selected Template</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{selectedTemplate?.name}</p>
                  </div>
                  <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{selectedTemplate?.sections} sections</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-[5px]">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Uploaded Contract</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{uploadedFile?.name}</p>
                  </div>
                  <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-500">Ready</Badge>
                </div>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white h-10"
              >
                {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {currentStep === 4 && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-sm p-8">
              <div className="text-center mb-8">
                <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Analysis Complete</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your contract has been analyzed successfully</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-[5px]">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Overall Score</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div className="h-full bg-green-600 dark:bg-green-500" style={{ width: '85%' }} />
                    </div>
                    <span className="text-lg font-bold text-green-600 dark:text-green-500">85%</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-[5px]">
                    <p className="text-xs text-yellow-700 dark:text-yellow-500 mb-1">Issues Found</p>
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-500">3</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-[5px]">
                    <p className="text-xs text-green-700 dark:text-green-500 mb-1">Compliant Sections</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-500">4</p>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-[5px]">
                    <p className="text-xs text-orange-700 dark:text-orange-500 mb-1">Suggestions</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-500">7</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-8 right-8 flex gap-4 z-10">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="h-9 px-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-400 dark:border-gray-600 rounded-[5px] flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
          Previous
        </button>
        
        <button
          onClick={nextStep}
          disabled={
            (currentStep === 1 && !selectedTemplate) ||
            (currentStep === 2 && !uploadedFile) ||
            currentStep === 4
          }
          className="h-9 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-[5px] flex items-center gap-1 text-xs font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === 4 ? 'Complete' : 'Next'}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

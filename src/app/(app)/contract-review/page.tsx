"use client";

import React, { useState, useMemo, useRef, useCallback, useDeferredValue, useEffect } from "react";
import { Shield, ChevronRight, ChevronLeft, BookOpen, Award, CheckCircle, RotateCcw, Upload, FolderOpen, FileText, Info, Trash2, AlertTriangle, Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AssetPicker } from "@/components/AssetPicker";
import { ContractCanvas } from "@/components/contract-review/ContractCanvas";
import { toastError, toastSuccess } from "@/components/toast-varients";
import { useUserStore } from "@/stores/user-store";
import { useAuditLogsStore } from "@/stores/audit-logs-store";
import { useContractReviewStore } from "@/store/contractReview";
import { Skeleton } from "@/components/ui/skeleton";

interface RequiredSection {
  title: string;
  priority: "critical" | "high" | "medium" | "low";
}

interface ContractTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  sections: number;
  sources: string[];
  isBaseline: boolean;
  requiredSections: RequiredSection[];
}

interface TemplatePreviewSection {
  title: string;
  content: string;
}

interface DocumentGap {
  id: string;
  sectionTitle: string;
  gapType: "missing" | "weak" | "incomplete" | "non-compliant";
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  recommendation: string;
  startIndex: number;
  endIndex: number;
  originalText?: string;
  suggestedText?: string;
}

interface ExtractedDocument {
  id: string;
  fileName: string;
  fullText: string;
  sections: DocumentSection[];
  gaps: DocumentGap[];
  overallScore: number;
  templateId: string;
}

interface DocumentSection {
  id: string;
  title: string;
  content: string;
  startIndex: number;
  endIndex: number;
  hasGaps: boolean;
  gapIds: string[];
}

// Knowledge base templates
const knowledgeBaseTemplates: ContractTemplate[] = [
  {
    id: "msa",
    name: "Master Services Agreement",
    type: "service",
    description: "Comprehensive framework for ongoing business relationships",
    sections: 12,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Parties Involved", priority: "critical" },
      { title: "Scope of Services", priority: "critical" },
      { title: "Payment Terms", priority: "high" },
      { title: "Confidentiality Clause", priority: "high" },
      { title: "Termination Conditions", priority: "medium" },
      { title: "Liability Limitations", priority: "medium" },
      { title: "Dispute Resolution", priority: "low" }
    ]
  },
  {
    id: "service-agreement",
    name: "Service Agreement Template",
    type: "service",
    description: "Standard template for service-based contracts",
    sections: 8,
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
    description: "Protect confidential information shared between parties",
    sections: 7,
    sources: ["Internal Legal KB", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Definition of Confidential Information", priority: "critical" },
      { title: "Obligations of Receiving Party", priority: "high" },
      { title: "Time Period", priority: "medium" },
      { title: "Exclusions from Confidentiality", priority: "medium" },
      { title: "Return of Materials", priority: "low" }
    ]
  },
  {
    id: "dpa",
    name: "Data Processing Agreement",
    type: "legal",
    description: "GDPR-compliant data processing terms",
    sections: 10,
    sources: ["Internal Legal KB"],
    isBaseline: true,
    requiredSections: [
      { title: "Data Processing Details", priority: "critical" },
      { title: "Security Measures", priority: "critical" },
      { title: "Sub-processors", priority: "high" },
      { title: "Data Subject Rights", priority: "high" },
      { title: "Breach Notification", priority: "medium" }
    ]
  },
  {
    id: "sla",
    name: "Service Level Agreement",
    type: "service",
    description: "Define service performance standards and metrics",
    sections: 9,
    sources: ["Internal Legal KB"],
    isBaseline: true,
    requiredSections: [
      { title: "Service Availability", priority: "critical" },
      { title: "Performance Metrics", priority: "high" },
      { title: "Response Times", priority: "high" },
      { title: "Remedies and Credits", priority: "medium" },
      { title: "Escalation Procedures", priority: "low" }
    ]
  },
  {
    id: "employment",
    name: "Employment Agreement",
    type: "hr",
    description: "Standard employment contract template",
    sections: 11,
    sources: ["Internal Legal KB"],
    isBaseline: true,
    requiredSections: [
      { title: "Position and Duties", priority: "critical" },
      { title: "Compensation and Benefits", priority: "critical" },
      { title: "Working Hours", priority: "high" },
      { title: "Confidentiality Obligations", priority: "high" },
      { title: "Termination Provisions", priority: "medium" }
    ]
  },
  {
    id: "sow",
    name: "Statement of Work (SOW)",
    type: "service",
    description: "Detailed work scope and deliverables",
    sections: 8,
    sources: ["Internal Legal KB"],
    isBaseline: false,
    requiredSections: [
      { title: "Deliverables", priority: "high" },
      { title: "Milestones", priority: "medium" },
      { title: "Acceptance Criteria", priority: "high" }
    ]
  },
  {
    id: "nda-mutual",
    name: "Mutual NDA",
    type: "legal",
    description: "Mutual confidentiality obligations",
    sections: 7,
    sources: ["Cornell LII", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Definitions", priority: "high" },
      { title: "Confidential Information", priority: "critical" },
      { title: "Term", priority: "medium" },
      { title: "Exclusions", priority: "medium" },
      { title: "Remedies", priority: "low" }
    ]
  },
  {
    id: "nda-oneway",
    name: "One-way NDA",
    type: "legal",
    description: "Disclosing party protections",
    sections: 6,
    sources: ["Cornell LII"],
    isBaseline: false,
    requiredSections: [
      { title: "Definitions", priority: "high" },
      { title: "Recipient Obligations", priority: "high" },
      { title: "Term & Return", priority: "medium" }
    ]
  },
  {
    id: "eula",
    name: "End User License Agreement",
    type: "technology",
    description: "Software licensing terms",
    sections: 9,
    sources: ["Open Source Templates", "Law Insider"],
    isBaseline: false,
    requiredSections: [
      { title: "License Grant", priority: "high" },
      { title: "Restrictions", priority: "high" },
      { title: "Disclaimer/Warranty", priority: "medium" }
    ]
  },
  {
    id: "reseller",
    name: "Reseller Agreement",
    type: "commercial",
    description: "Channel partner terms",
    sections: 10,
    sources: ["Law Insider"],
    isBaseline: false,
    requiredSections: [
      { title: "Territory", priority: "medium" },
      { title: "Sales Targets", priority: "low" },
      { title: "Branding & Compliance", priority: "low" }
    ]
  },
  {
    id: "distribution",
    name: "Distribution Agreement",
    type: "commercial",
    description: "Territories and quotas",
    sections: 11,
    sources: ["Law Insider"],
    isBaseline: false,
    requiredSections: [
      { title: "Territory & Exclusivity", priority: "medium" },
      { title: "Minimum Commitments", priority: "high" }
    ]
  },
  {
    id: "license-ip",
    name: "IP License Agreement",
    type: "legal",
    description: "Scope and exclusivity",
    sections: 9,
    sources: ["WIPO", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Scope of License", priority: "high" },
      { title: "Royalties", priority: "low" }
    ]
  },
  {
    id: "subprocessing",
    name: "Sub-processor Agreement",
    type: "technology",
    description: "Downstream obligations",
    sections: 7,
    sources: ["Internal Legal KB"],
    isBaseline: false,
    requiredSections: [
      { title: "Contractual Flowdown", priority: "high" }
    ]
  },
  {
    id: "consulting",
    name: "Consulting Agreement",
    type: "service",
    description: "Professional consulting services",
    sections: 10,
    sources: ["Internal Legal KB"],
    isBaseline: true,
    requiredSections: [
      { title: "Scope of Consulting", priority: "high" },
      { title: "Deliverables", priority: "high" },
      { title: "Fees & Expenses", priority: "medium" }
    ]
  },
  {
    id: "software-license",
    name: "Software License Agreement",
    type: "technology",
    description: "Grant & restrictions",
    sections: 12,
    sources: ["Open Source Templates", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Grant & Restrictions", priority: "high" }
    ]
  },
  {
    id: "saas",
    name: "SaaS Subscription",
    type: "technology",
    description: "Cloud subscription terms",
    sections: 11,
    sources: ["Internal Legal KB"],
    isBaseline: true,
    requiredSections: [
      { title: "Subscription & Term", priority: "high" },
      { title: "Data & Privacy", priority: "high" }
    ]
  },
  {
    id: "hosting",
    name: "Hosting Agreement",
    type: "technology",
    description: "Hosting obligations",
    sections: 8,
    sources: ["Internal Legal KB"],
    isBaseline: false,
    requiredSections: [
      { title: "Availability & Support", priority: "medium" }
    ]
  },
  {
    id: "api",
    name: "API Terms",
    type: "technology",
    description: "API usage and limits",
    sections: 6,
    sources: ["Developer Docs Samples"],
    isBaseline: false,
    requiredSections: [
      { title: "API Keys & Limits", priority: "medium" }
    ]
  },
  {
    id: "privacy",
    name: "Privacy Policy",
    type: "legal",
    description: "Data privacy disclosures",
    sections: 9,
    sources: ["ICO", "OECD"],
    isBaseline: true,
    requiredSections: [
      { title: "Collection & Use", priority: "medium" }
    ]
  },
  {
    id: "terms",
    name: "Terms of Service",
    type: "legal",
    description: "Website/app terms",
    sections: 10,
    sources: ["Internal Legal KB"],
    isBaseline: true,
    requiredSections: [
      { title: "Acceptable Use", priority: "medium" }
    ]
  },
  {
    id: "affiliate",
    name: "Affiliate Agreement",
    type: "commercial",
    description: "Affiliate payouts",
    sections: 7,
    sources: ["Marketing Templates"],
    isBaseline: false,
    requiredSections: [
      { title: "Payouts & Tracking", priority: "low" }
    ]
  },
  {
    id: "influencer",
    name: "Influencer Agreement",
    type: "commercial",
    description: "Creator campaigns",
    sections: 8,
    sources: ["Marketing Templates"],
    isBaseline: false,
    requiredSections: [
      { title: "Deliverables & IP", priority: "medium" }
    ]
  },
  {
    id: "sponsorship",
    name: "Sponsorship Agreement",
    type: "commercial",
    description: "Event sponsorship",
    sections: 7,
    sources: ["Event Templates"],
    isBaseline: false,
    requiredSections: [
      { title: "Sponsorship Rights", priority: "medium" }
    ]
  },
  {
    id: "merger",
    name: "Merger Agreement",
    type: "business",
    description: "M&A transaction doc",
    sections: 15,
    sources: ["ABA Model Docs"],
    isBaseline: false,
    requiredSections: [
      { title: "Reps & Warranties", priority: "high" }
    ]
  },
  {
    id: "asset-sale",
    name: "Asset Purchase Agreement",
    type: "business",
    description: "Asset transfer terms",
    sections: 14,
    sources: ["ABA Model Docs"],
    isBaseline: false,
    requiredSections: [
      { title: "Assets & Liabilities", priority: "high" }
    ]
  },
  {
    id: "shareholders",
    name: "Shareholders Agreement",
    type: "business",
    description: "Shareholder rights",
    sections: 12,
    sources: ["Internal Legal KB"],
    isBaseline: true,
    requiredSections: [
      { title: "Rights & Restrictions", priority: "high" }
    ]
  },
  {
    id: "bylaws",
    name: "Company Bylaws",
    type: "business",
    description: "Corporate governance",
    sections: 10,
    sources: ["Internal Legal KB"],
    isBaseline: false,
    requiredSections: [
      { title: "Board & Meetings", priority: "medium" }
    ]
  },
  {
    id: "gdpr",
    name: "GDPR Addendum",
    type: "technology",
    description: "EU data compliance",
    sections: 8,
    sources: ["EDPB", "ICO"],
    isBaseline: true,
    requiredSections: [
      { title: "Legal Basis", priority: "high" }
    ]
  },
  {
    id: "hipaa",
    name: "HIPAA BAA",
    type: "healthcare",
    description: "Protected health info",
    sections: 9,
    sources: ["HHS"],
    isBaseline: true,
    requiredSections: [
      { title: "Safeguards & PHI", priority: "high" }
    ]
  },
  {
    id: "vendor",
    name: "Vendor Agreement",
    type: "commercial",
    description: "Vendor supply terms",
    sections: 10,
    sources: ["Internal Legal KB"],
    isBaseline: false,
    requiredSections: [
      { title: "Supply Terms", priority: "high" },
      { title: "Quality Standards", priority: "medium" }
    ]
  },
  {
    id: "procurement",
    name: "Procurement Contract",
    type: "commercial",
    description: "Purchasing agreement",
    sections: 9,
    sources: ["Internal Legal KB"],
    isBaseline: false,
    requiredSections: [
      { title: "Delivery Terms", priority: "high" },
      { title: "Payment Schedule", priority: "medium" }
    ]
  },
  {
    id: "franchise",
    name: "Franchise Agreement",
    type: "commercial",
    description: "Franchise operation terms",
    sections: 13,
    sources: ["Law Insider"],
    isBaseline: false,
    requiredSections: [
      { title: "Franchise Rights", priority: "critical" },
      { title: "Royalty Fees", priority: "high" }
    ]
  },
  {
    id: "lease-commercial",
    name: "Commercial Lease",
    type: "real-estate",
    description: "Commercial property lease",
    sections: 11,
    sources: ["Internal Legal KB"],
    isBaseline: true,
    requiredSections: [
      { title: "Lease Terms", priority: "critical" },
      { title: "Rent & Utilities", priority: "high" }
    ]
  },
  {
    id: "lease-residential",
    name: "Residential Lease",
    type: "real-estate",
    description: "Residential property lease",
    sections: 9,
    sources: ["Internal Legal KB"],
    isBaseline: false,
    requiredSections: [
      { title: "Occupancy Terms", priority: "high" },
      { title: "Security Deposit", priority: "medium" }
    ]
  },
  {
    id: "partnership",
    name: "Partnership Agreement",
    type: "business",
    description: "Business partnership terms",
    sections: 12,
    sources: ["Internal Legal KB"],
    isBaseline: true,
    requiredSections: [
      { title: "Partner Contributions", priority: "critical" },
      { title: "Profit Sharing", priority: "high" }
    ]
  },
  {
    id: "jv",
    name: "Joint Venture Agreement",
    type: "business",
    description: "Joint venture collaboration",
    sections: 13,
    sources: ["Law Insider"],
    isBaseline: false,
    requiredSections: [
      { title: "JV Structure", priority: "critical" },
      { title: "Governance", priority: "high" }
    ]
  },
  {
    id: "licensing-brand",
    name: "Brand Licensing Agreement",
    type: "commercial",
    description: "Brand usage rights",
    sections: 10,
    sources: ["Law Insider"],
    isBaseline: false,
    requiredSections: [
      { title: "Brand Usage Rights", priority: "high" },
      { title: "Quality Control", priority: "medium" }
    ]
  },
  {
    id: "manufacturing",
    name: "Manufacturing Agreement",
    type: "commercial",
    description: "Product manufacturing terms",
    sections: 12,
    sources: ["Internal Legal KB"],
    isBaseline: false,
    requiredSections: [
      { title: "Manufacturing Specs", priority: "critical" },
      { title: "Quality Assurance", priority: "high" }
    ]
  },
  {
    id: "logistics",
    name: "Logistics Agreement",
    type: "commercial",
    description: "Transportation and logistics",
    sections: 9,
    sources: ["Internal Legal KB"],
    isBaseline: false,
    requiredSections: [
      { title: "Delivery Terms", priority: "high" },
      { title: "Insurance Coverage", priority: "medium" }
    ]
  },
  {
    id: "maintenance",
    name: "Maintenance Agreement",
    type: "service",
    description: "Equipment/software maintenance",
    sections: 8,
    sources: ["Internal Legal KB"],
    isBaseline: false,
    requiredSections: [
      { title: "Maintenance Schedule", priority: "medium" },
      { title: "Response Times", priority: "high" }
    ]
  },
  {
    id: "warranty",
    name: "Warranty Agreement",
    type: "service",
    description: "Product/service warranty",
    sections: 7,
    sources: ["Internal Legal KB"],
    isBaseline: false,
    requiredSections: [
      { title: "Warranty Coverage", priority: "high" },
      { title: "Exclusions", priority: "medium" }
    ]
  },
  {
    id: "indemnity",
    name: "Indemnity Agreement",
    type: "legal",
    description: "Indemnification terms",
    sections: 6,
    sources: ["Law Insider"],
    isBaseline: false,
    requiredSections: [
      { title: "Indemnification Scope", priority: "critical" },
      { title: "Defense Obligations", priority: "high" }
    ]
  },
  {
    id: "settlement",
    name: "Settlement Agreement",
    type: "legal",
    description: "Dispute settlement terms",
    sections: 8,
    sources: ["Law Insider"],
    isBaseline: false,
    requiredSections: [
      { title: "Settlement Terms", priority: "critical" },
      { title: "Release of Claims", priority: "high" }
    ]
  },
  {
    id: "arbitration",
    name: "Arbitration Agreement",
    type: "legal",
    description: "Binding arbitration terms",
    sections: 7,
    sources: ["AAA", "Law Insider"],
    isBaseline: true,
    requiredSections: [
      { title: "Arbitration Process", priority: "high" },
      { title: "Governing Rules", priority: "medium" }
    ]
  }
];

const templatePreviewSections: TemplatePreviewSection[] = [
  {
    title: "Parties",
    content: "This agreement is entered into between [Company Name] and [Client Name] on [Date]."
  },
  {
    title: "Scope of Services",
    content: "The service provider agrees to deliver [specific services] in accordance with the terms outlined herein."
  },
  {
    title: "Payment Terms",
    content: "Payment shall be made within [number] days of invoice date. Late payments may incur interest charges."
  }
];

export default function ContractReview() {
  const { userData } = useUserStore();
  const { logs: allAuditLogs, isLoading: logsLoading, addLog, fetchLogs } = useAuditLogsStore();
  const crStore = useContractReviewStore();

  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadSource, setUploadSource] = useState<"device" | "asset" | null>(null);
  const [extractedDocument, setExtractedDocument] = useState<ExtractedDocument | null>(null);
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"template" | "custom">("template");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [applyRuleBase, setApplyRuleBase] = useState(false);

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const filteredTemplates = useMemo(() => {
    const term = deferredSearchTerm.trim().toLowerCase();
    if (!term) return knowledgeBaseTemplates;
    return knowledgeBaseTemplates.filter((t) =>
      t.name.toLowerCase().includes(term) ||
      t.description?.toLowerCase().includes(term)
    );
  }, [deferredSearchTerm]);
  const [finalInstructions, setFinalInstructions] = useState<string>("");
  const deviceFileInputRef = useRef<HTMLInputElement | null>(null);
  const [deviceInputKey, setDeviceInputKey] = useState(0);
  const customTemplateInputRef = useRef<HTMLInputElement | null>(null);
  const [customTemplateInputKey, setCustomTemplateInputKey] = useState(0);
  const [customTemplateFile, setCustomTemplateFile] = useState<File | null>(null);

  // Fetch audit logs on mount
  useEffect(() => {
    if (userData?.userId) {
      fetchLogs(userData.userId);
    }
  }, [userData?.userId, fetchLogs]);

  // Filter template logs based on selected template
  const templateLogs = useMemo(() => {
    if (!selectedTemplate?.name) return [];
    
    // Filter by template name in standards array OR templateId in snapshot
    return allAuditLogs.filter(log => {
      const standards = (log as any).standards || [];
      const templateId = (log as any).snapshot?.templateId;
      const templateName = (log as any).snapshot?.templateName;
      const analysisMethod = (log as any).analysisMethod;
      
      // Only show contract review logs
      if (analysisMethod !== 'contract_review') return false;
      
      // Match by template name in standards or snapshot
      return standards.includes(selectedTemplate.name) || 
             templateName === selectedTemplate.name ||
             templateId === selectedTemplate.id;
    }).slice(0, 20);
  }, [allAuditLogs, selectedTemplate]);

  const steps = [
    { id: 1, title: "Select Template" },
    { id: 2, title: "Review Template" },
    { id: 3, title: "Upload Contract" },
    { id: 4, title: "Contract Analysis" },
    { id: 5, title: "Make Corrections" }
  ];

  const handleTemplateSelect = useCallback((template: ContractTemplate) => {
    setSelectedTemplate((prev) => {
      if (prev?.id === template.id) return null;
      return template;
    });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setUploadSource("device");
      setExtractedDocument(null);
      crStore.setExtractedDocument(null);
      crStore.setSuggestions([]);
    }
  };

  const handleCustomTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomTemplateFile(file);
      toastSuccess('Template Uploaded', `Custom template "${file.name}" has been uploaded successfully.`);
    }
  };

  const handleAssetSelect = async (assets: any[]) => {
    if (!assets || assets.length === 0) {
      return;
    }

    const asset = assets[0];
    
    try {
      const response = await fetch(asset.url);
      if (!response.ok) {
        throw new Error('Failed to fetch asset: ' + response.statusText);
      }
      
      const blob = await response.blob();
      const file = new File([blob], asset.originalName || asset.filename, {
        type: asset.mimetype || blob.type || 'application/pdf',
        lastModified: new Date(asset.uploadDate).getTime()
      });
      
      setUploadedFile(file);
      setUploadSource("asset");
      setIsAssetPickerOpen(false);
      setExtractedDocument(null);
      crStore.setExtractedDocument(null);
      crStore.setSuggestions([]);
    } catch (error) {
      toastError('Asset Load Failed', error instanceof Error ? error.message : 'Failed to load selected asset');
    }
  };

  const handleDocumentExtraction = async () => {
    if (!uploadedFile || !selectedTemplate) {
      toastError('Missing Information', 'Please select a template and upload a file');
      return;
    }
    
    // Clear any existing data and reset error state
    setExtractedDocument(null);
    crStore.setExtractedDocument(null);
    crStore.setSuggestions([]);
    
    setIsAnalyzing(true);
    try {
      // Extract text from uploaded file
      let extractedText = '';
      
      extractedText = await extractFileText(uploadedFile);
      if (!extractedText.trim()) {
        throw new Error('Could not extract text from the uploaded file. Please try a different PDF or contact support.');
      }

      // Build template clauses for analysis
      const clauses = selectedTemplate?.requiredSections?.map(s => ({
        title: s.title,
        content: '',
        isRequired: true,
        priority: s.priority,
        guidelines: []
      })) || [];

      // Call Gemini API for analysis
      const response = await fetch('/api/contract-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: extractedText, 
          templateClauses: clauses, 
          contractType: selectedTemplate?.name || 'Contract',
          instructions: finalInstructions || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Analysis failed');
      }

      const analysisData = await response.json();
      
      // Create document with real analysis results
      const document: ExtractedDocument = {
        id: `doc-${Date.now()}`,
        fileName: uploadedFile.name,
        fullText: extractedText,
        sections: [],
        gaps: (analysisData.suggestions || []).map((s: any, idx: number) => ({
          id: s.id || `gap_${idx}`,
          sectionTitle: s.section || 'General',
          gapType: s.type === 'addition' ? 'missing' : (s.type === 'deletion' ? 'non-compliant' : 'weak'),
          severity: s.severity || 'medium',
          description: s.reasoning || 'Suggested improvement',
          recommendation: s.legalImplications || s.reasoning || '',
          startIndex: s.startIndex || 0,
          endIndex: s.endIndex || 0,
          originalText: s.originalText || '',
          suggestedText: s.suggestedText || '',
        })),
        overallScore: Math.round((analysisData.overallScore || 0.7) * 100),
        templateId: selectedTemplate?.id || 'custom'
      };

      setExtractedDocument(document);

      // Sync with canvas store for interactive editing
      crStore.setExtractedDocument({
        id: document.id,
        fileName: document.fileName,
        fullText: extractedText,
        sections: document.sections as any,
        gaps: document.gaps as any,
        overallScore: document.overallScore,
        templateId: document.templateId,
        metadata: { pageCount: 1, extractedAt: new Date(), fileSize: uploadedFile.size }
      } as any);

      // Map suggestions for canvas interactions
      const suggestions = (analysisData.suggestions || []).map((s: any, idx: number) => ({
        id: s.id || `sug_${idx}`,
        type: s.type || 'modification',
        severity: s.severity || 'medium',
        category: s.category || 'clarity',
        confidence: s.confidence || 0.7,
        originalText: s.originalText || '',
        suggestedText: s.suggestedText || '',
        startIndex: Math.max(0, s.startIndex || 0),
        endIndex: Math.max(s.startIndex || 0, s.endIndex || 0),
        reasoning: s.reasoning || '',
        legalImplications: s.legalImplications || '',
        riskLevel: s.riskLevel || 'medium',
        section: s.section || 'General',
        timestamp: new Date(),
        status: 'pending' as const,
        clauseType: s.clauseType || ''
      }));
      
      crStore.setSuggestions(suggestions as any);

      // Save to audit logs
      try {
        const auditLogPayload = {
          fileName: uploadedFile.name,
          standards: [selectedTemplate?.name || 'Custom Template'],
          score: document.overallScore,
          status: 'success',
          gapsCount: document.gaps?.length || 0,
          fileSize: uploadedFile.size || 0,
          analysisMethod: 'contract_review',
          userId: userData?.userId,
          sessionId: document.id,
          snapshot: {
            templateName: selectedTemplate?.name || 'Custom Template',
            templateId: selectedTemplate?.id,
            totalIssues: document.gaps?.length || 0,
            criticalIssues: document.gaps?.filter(g => g.severity === 'critical').length || 0,
            highIssues: document.gaps?.filter(g => g.severity === 'high').length || 0,
            mediumIssues: document.gaps?.filter(g => g.severity === 'medium').length || 0,
            lowIssues: document.gaps?.filter(g => g.severity === 'low').length || 0,
            analysisDate: new Date().toISOString(),
            applyRuleBase: applyRuleBase,
          }
        };

        const logResponse = await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditLogPayload)
        });

        if (logResponse.ok) {
          const logData = await logResponse.json();
          if (logData.log) {
            addLog(logData.log);
          }
        }
      } catch (logError) {
        console.error('Failed to save audit log:', logError);
        // Don't block the main flow if audit log fails
      }

      toastSuccess('Analysis Complete', 'Your contract has been analyzed successfully');
    } catch (error) {
      console.error('Document extraction and analysis failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toastError('Analysis Failed', `Document processing failed: ${errorMessage}`);
      
      // Log the failure to audit logs
      try {
        const errorLogPayload = {
          fileName: uploadedFile?.name || 'Unknown file',
          standards: [selectedTemplate?.name || 'Custom Template'],
          score: 0,
          status: 'error',
          gapsCount: 0,
          fileSize: uploadedFile?.size || 0,
          analysisMethod: 'contract_review',
          userId: userData?.userId,
          sessionId: `error-${Date.now()}`,
          snapshot: {
            error: errorMessage,
            templateName: selectedTemplate?.name || 'Custom Template',
            templateId: selectedTemplate?.id,
            analysisDate: new Date().toISOString(),
          }
        };

        const errorLogResponse = await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorLogPayload)
        });

        if (errorLogResponse.ok) {
          const logData = await errorLogResponse.json();
          if (logData.log) {
            addLog(logData.log);
          }
        }
      } catch (logError) {
        console.error('Failed to save error audit log:', logError);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Download contract review results as JSON
  const handleDownloadResults = () => {
    if (!extractedDocument) {
      toastError('No Data', 'No analysis results to download');
      return;
    }

    const results = {
      fileName: extractedDocument.fileName,
      analysisDate: new Date().toISOString(),
      overallScore: extractedDocument.overallScore,
      template: selectedTemplate?.name || 'Custom Template',
      sections: extractedDocument.sections,
      gaps: extractedDocument.gaps,
      summary: {
        totalIssues: extractedDocument.gaps?.length || 0,
        criticalIssues: extractedDocument.gaps?.filter(g => g.severity === 'critical').length || 0,
        highIssues: extractedDocument.gaps?.filter(g => g.severity === 'high').length || 0,
        mediumIssues: extractedDocument.gaps?.filter(g => g.severity === 'medium').length || 0,
        lowIssues: extractedDocument.gaps?.filter(g => g.severity === 'low').length || 0,
      }
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-review-${extractedDocument.fileName}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toastSuccess('Downloaded', 'Contract review results downloaded successfully');
  };

  // Download detailed report as text
  const handleDownloadReport = () => {
    if (!extractedDocument) {
      toastError('No Data', 'No analysis results to download');
      return;
    }

    let reportText = `CONTRACT REVIEW REPORT\n`;
    reportText += `${'='.repeat(80)}\n\n`;
    reportText += `File Name: ${extractedDocument.fileName}\n`;
    reportText += `Analysis Date: ${new Date().toLocaleDateString()}\n`;
    reportText += `Template: ${selectedTemplate?.name || 'Custom Template'}\n`;
    reportText += `Overall Score: ${extractedDocument.overallScore}%\n\n`;
    
    reportText += `SUMMARY\n`;
    reportText += `${'-'.repeat(80)}\n`;
    reportText += `Total Issues: ${extractedDocument.gaps?.length || 0}\n`;
    reportText += `  • Critical: ${extractedDocument.gaps?.filter(g => g.severity === 'critical').length || 0}\n`;
    reportText += `  • High: ${extractedDocument.gaps?.filter(g => g.severity === 'high').length || 0}\n`;
    reportText += `  • Medium: ${extractedDocument.gaps?.filter(g => g.severity === 'medium').length || 0}\n`;
    reportText += `  • Low: ${extractedDocument.gaps?.filter(g => g.severity === 'low').length || 0}\n\n`;

    if (extractedDocument.gaps && extractedDocument.gaps.length > 0) {
      reportText += `DETAILED FINDINGS\n`;
      reportText += `${'-'.repeat(80)}\n\n`;
      
      extractedDocument.gaps.forEach((gap, idx) => {
        reportText += `${idx + 1}. ${gap.sectionTitle} [${gap.severity.toUpperCase()}]\n`;
        reportText += `   Type: ${gap.gapType.replace('-', ' ')}\n`;
        reportText += `   Description: ${gap.description}\n`;
        if (gap.recommendation) {
          reportText += `   Recommendation: ${gap.recommendation}\n`;
        }
        reportText += `\n`;
      });
    }

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-review-report-${extractedDocument.fileName}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toastSuccess('Downloaded', 'Detailed report downloaded successfully');
  };

  // Start a new review - reset everything
  const handleStartNewReview = () => {
    // Reset all state
    setCurrentStep(1);
    setSelectedTemplate(null);
    setUploadedFile(null);
    setUploadSource(null);
    setCustomTemplateFile(null);
    setExtractedDocument(null);
    setFinalInstructions('');
    setApplyRuleBase(true);
    setSearchTerm('');
    setActiveTab('template');
    
    // Reset input keys to clear file inputs
    setDeviceInputKey(Date.now());
    setCustomTemplateInputKey(Date.now() + 1);
    
    // Clear store state
    crStore.setExtractedDocument(null);
    crStore.setSuggestions([]);
    
    toastSuccess('Ready for New Review', 'All data cleared. You can start a new contract review.');
  };

  // Server-side text extraction for uploaded files
  const extractFileText = async (file: File): Promise<string> => {
    if (!file) {
      throw new Error('No file provided for text extraction');
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/extract-document', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Text extraction failed');
      }
      
      const data = await response.json();
      return data.text || '';
    } catch (error) {
      console.error('Text extraction failed:', error);
      
      // Fallback to basic client-side extraction for text files
      const fileName = file.name || '';
      const fileType = file.type || '';
      
      if (fileType.includes('text') || fileName.endsWith('.txt')) {
        try {
          return await file.text();
        } catch {
          return '';
        }
      }
      
      // For PDFs, provide a helpful error message
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        throw new Error('Gemini AI could not parse this PDF. Please try a different PDF file or use the manual text input option.');
      }
      
      // For Word documents
      if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        throw new Error('Document processing failed. Please try uploading the file again or use a different format.');
      }
      
      throw error;
    }
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToStep2 = !!selectedTemplate;
  const canProceedToStep3 = currentStep === 2 && (selectedTemplate !== null || (activeTab === "custom" && customTemplateFile !== null));
  const canProceedToStep4 = currentStep === 3 && uploadedFile !== null;

  return (
    <div className="w-full h-screen bg-[#FAFAFB] dark:bg-gray-900 overflow-hidden flex flex-col">
      {/* Top Header Section */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
            <Shield className="h-5 w-5 text-[#3B43D6]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[#2D2F34] dark:text-gray-100">Contract Review</h1>
            <p className="text-xs text-[#6A707C] dark:text-gray-400 mt-0.5 leading-tight">
              Upload contracts and get AI-powered analysis against reference templates
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator and Title Section */}
      <div className="px-6 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#2D2F34] dark:text-gray-100">
              {currentStep === 1 ? "Choose a baseline template from knowledge base" : 
               currentStep === 2 ? "Review template format or provide your own" : 
               steps[currentStep - 1]?.title}
            </h2>
            <p className="text-xs text-[#6A707C] dark:text-gray-400 mt-0.5">
              {currentStep === 1 ? `${knowledgeBaseTemplates.length} templates` : 
               currentStep === 2 ? "Verify required sections and preview format" : 
               ""}
            </p>
          </div>
          
          {/* Stepper */}
          <div className="flex items-center gap-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={"flex items-center justify-center w-9 h-9 rounded-full transition-all " + (
                  currentStep >= step.id
                    ? 'bg-[#3B43D6] text-white'
                    : 'bg-white dark:bg-gray-800 border border-[#D9D9D9] dark:border-gray-600 text-[#717171] dark:text-gray-400'
                )}>
                  <span className="text-sm font-semibold">
                    {String(step.id).padStart(2, '0')}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <svg className="w-14 h-9 mx-0" viewBox="0 0 56 36">
                    <line x1="0" y1="18" x2="56" y2="18" stroke={currentStep > step.id ? '#3B43D6' : '#A0A8C2'} strokeWidth="1" strokeDasharray="2 2" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-6 pb-4 overflow-hidden flex flex-col">
        {/* Step 1: Select Template */}
        {currentStep === 1 && (
          <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between">
              <div className="relative w-[280px]">
                <Input
                  placeholder="Search Template..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 text-xs pl-8 bg-white dark:bg-gray-800 border-[#DEE3ED] dark:border-gray-600 rounded-[5px] select-text text-[#717171] dark:text-gray-100 placeholder:text-[#8D8D8D] dark:placeholder:text-gray-400"
                />
                <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3 h-3" viewBox="0 0 12 12" fill="none">
                  <path d="M5.5 9.5C7.70914 9.5 9.5 7.70914 9.5 5.5C9.5 3.29086 7.70914 1.5 5.5 1.5C3.29086 1.5 1.5 3.29086 1.5 5.5C1.5 7.70914 3.29086 9.5 5.5 9.5Z" stroke="#8D8D8D" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10.5 10.5L8.5 8.5" stroke="#8D8D8D" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 flex gap-4 overflow-hidden">
              {/* Left Side - Templates Grid */}
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] p-4 overflow-hidden flex flex-col">
                <div className="mb-3">
                  <h3 className="text-xs font-semibold text-[#2D2F34] dark:text-gray-100 mb-1.5">Contract Templates</h3>
                  <p className="text-xs text-[#6A707C] dark:text-gray-400 leading-[14px]">
                    Select a baseline template that has been reviewed and approved by legal experts. Your uploaded contract will be compared against this template to identify gaps and weaknesses.
                  </p>
                </div>
                
                {/* Template Cards Grid */}
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  {filteredTemplates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-20">
                      <div className="w-16 h-16 rounded-full bg-[#EFF1F6] dark:bg-gray-700 flex items-center justify-center mb-4">
                        <BookOpen className="h-8 w-8 text-[#6A707C] dark:text-gray-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-[#2D2F34] dark:text-gray-100 mb-2">No templates found</h3>
                      <p className="text-xs text-[#6A707C] dark:text-gray-400 text-center max-w-xs">
                        No templates match your search "{searchTerm}". Try different keywords or clear your search.
                      </p>
                    </div>
                  ) : (
                    <div className={"grid " + (selectedTemplate ? 'grid-cols-3' : 'grid-cols-4') + " gap-4 p-1"}>
                      {filteredTemplates.map((template) => {
                        const isSelected = selectedTemplate?.id === template.id;
                        return (
                          <div
                            key={template.id}
                            onClick={() => handleTemplateSelect(template)}
                            className={"bg-white dark:bg-gray-800 rounded-[8px] shadow-sm cursor-pointer transition-all hover:shadow-md " + (
                              isSelected ? 'ring-2 ring-[#3B43D6] shadow-md' : 'border border-gray-100 dark:border-gray-700 hover:border-[#3B43D6]/50'
                            )}
                          >
                            <div className="p-3">
                              <div className="flex items-start justify-between mb-2.5">
                                <div className="w-10 h-10 rounded-full bg-[#EFF1F6] dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                  <BookOpen className="h-5 w-5 text-[#3B43D6]" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="bg-[#EDFFDE] dark:bg-green-900/30 rounded-full px-2 py-0.5 flex items-center gap-1">
                                    <Award className="h-2.5 w-2.5 text-[#47AF47]" />
                                    <span className="text-xs font-medium text-[#47AF47]">Baseline</span>
                                  </div>
                                  <CheckCircle className={"h-4 w-4 transition-colors " + (isSelected ? 'text-[#3B43D6]' : 'text-[#DADADA] dark:text-gray-600')} />
                                </div>
                              </div>
                              
                              <div className="mb-2.5">
                                <h4 className="text-sm font-semibold text-[#2D2F34] dark:text-gray-100 mb-1 leading-tight line-clamp-2">{template.name}</h4>
                                <p className="text-xs text-[#6A707C] dark:text-gray-400 leading-tight line-clamp-2">{template.description}</p>
                              </div>
                              
                              <div className="space-y-1.5">
                                <div className="text-xs font-semibold text-[#2D2F34] dark:text-gray-300">
                                  Sections: {template.sections}
                                </div>
                                <div className="text-xs font-semibold text-[#2D2F34] dark:text-gray-300 truncate">
                                  Sources: {template.sources.join(", ")}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  <div className="bg-[#EFF1F6] dark:bg-gray-700 rounded-full px-2 py-0.5">
                                    <span className="text-xs font-medium text-[#2D2F34] dark:text-gray-300">Parties</span>
                                  </div>
                                  <div className="bg-[#EFF1F6] dark:bg-gray-700 rounded-full px-2 py-0.5">
                                    <span className="text-xs font-medium text-[#2D2F34] dark:text-gray-300">+{template.requiredSections.length - 1} more</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Selected Template Details */}
              {selectedTemplate && (
                <div className="w-[320px] flex-shrink-0 flex flex-col gap-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  {/* Template Details Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] p-4">
                    <h3 className="text-sm font-semibold text-[#2D2F34] dark:text-gray-100 mb-4 leading-tight">
                      Selected Template: {selectedTemplate.name}
                    </h3>
                    
                    {/* Required Sections */}
                    <div className="mb-5">
                      <h4 className="text-xs font-semibold text-[#2D2F34] dark:text-gray-100 mb-3">Required Sections:</h4>
                      <div className="space-y-2.5">
                        {selectedTemplate.requiredSections.map((section, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-[#47AF47] flex-shrink-0" />
                            <span className="text-xs font-medium text-[#2D2F34] dark:text-gray-300 flex-1 leading-tight">{section.title}</span>
                            <span className={"rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap " + (
                              section.priority === 'critical' ? 'bg-[#EDDBDB] text-[#BA0003]' :
                              section.priority === 'high' ? 'bg-[#FFE7E0] text-[#E55400]' :
                              section.priority === 'medium' ? 'bg-[#FFF8CB] text-[#BF6D0A]' :
                              'bg-[#E8E9FF] text-[#6E72FF]'
                            )}>
                              {section.priority.charAt(0).toUpperCase() + section.priority.slice(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* What We'll Check */}
                    <div>
                      <h4 className="text-xs font-semibold text-[#2D2F34] dark:text-gray-100 mb-3">What We'll Check:</h4>
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-[#47AF47] flex-shrink-0" />
                          <span className="text-xs font-medium text-[#2D2F34] dark:text-gray-300 leading-tight">Missing required sections</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-[#47AF47] flex-shrink-0" />
                          <span className="text-xs font-medium text-[#2D2F34] dark:text-gray-300 leading-tight">Weak or incomplete clauses</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-[#47AF47] flex-shrink-0" />
                          <span className="text-xs font-medium text-[#2D2F34] dark:text-gray-300 leading-tight">Non-compliant language</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-[#47AF47] flex-shrink-0" />
                          <span className="text-xs font-medium text-[#2D2F34] dark:text-gray-300 leading-tight">Risk exposure areas</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Audit Logs Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] p-4">
                    <div className="flex items-start gap-2 mb-4">
                      <RotateCcw className="h-4 w-4 text-[#717171] dark:text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-[#2D2F34] dark:text-gray-100 mb-0.5">Audit Logs</h4>
                        <p className="text-xs text-[#6A707C] dark:text-gray-400 leading-tight">Recent activity for template</p>
                      </div>
                    </div>
                    
                    {logsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-3 w-1/2" />
                              <Skeleton className="h-5 w-20" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : templateLogs.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <p className="text-xs text-center text-[#6A707C] dark:text-gray-400">No logs yet for this template.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                        {templateLogs.map((log: any, idx: number) => (
                          <div key={idx} className="pb-3 border-b border-[#DEE3ED] dark:border-gray-700 last:border-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-xs font-medium text-[#2D2F34] dark:text-gray-100 line-clamp-2">
                                {log.fileName || 'Contract Review'}
                              </p>
                              <span className="text-xs text-[#6A707C] dark:text-gray-400 whitespace-nowrap">
                                {new Date(log.analysisDate || log.timestamp || log.createdAt).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="text-xs text-[#6A707C] dark:text-gray-400">
                                Score: {log.score}% • Issues: {log.gapsCount || 0}
                              </p>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  log.status === 'success' 
                                    ? 'border-green-300 text-green-700 dark:text-green-400' 
                                    : 'border-red-300 text-red-700 dark:text-red-400'
                                }`}
                              >
                                {log.status}
                              </Badge>
                            </div>
                            {log.snapshot?.criticalIssues > 0 && (
                              <p className="text-xs text-red-600 dark:text-red-400">
                                ⚠️ {log.snapshot.criticalIssues} critical issue{log.snapshot.criticalIssues > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Step 1 Footer Navigation */}
            <div className="sticky bottom-0 left-0 right-0 pt-1 mt-1">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="px-3 hover:bg-[#E8E9FF]"
                  style={{ borderColor: '#3B43D6', color: '#3B43D6' }}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!canProceedToStep2}
                  className="px-4 text-white hover:bg-[#2F36B0]"
                  style={{ backgroundColor: '#3B43D6' }}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Review Template - Exact Figma Match */}
        {currentStep === 2 && selectedTemplate && (
          <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
            {/* Button Tabs - matches Figma design exactly */}
            <div className="flex items-center gap-10 border-b border-[#DEE3ED] dark:border-gray-700">
              <button
                onClick={() => setActiveTab("template")}
                className={"relative pb-3 text-xs font-semibold transition-colors " + (
                  activeTab === "template"
                    ? "text-[#2D2F34]"
                    : "text-[#6E72FF] dark:text-gray-100 hover:text-[#2D2F34]"
                )}
              >
                Use Contract Template
                {activeTab === "template" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#605BFF]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                className={"relative pb-3 text-xs font-semibold transition-colors " + (
                  activeTab === "custom"
                    ? "text-[#2D2F34]"
                    : "text-[#6E72FF] dark:text-gray-100 hover:text-[#2D2F34]"
                )}
              >
                Use Custom Template
                {activeTab === "custom" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#605BFF]" />
                )}
              </button>
            </div>

            {/* Content based on active tab */}
            {activeTab === "template" ? (
              /* Three Column Layout for Use Contract Template */
              <div className="flex-1 flex gap-5 overflow-hidden">
              {/* Left Column - Selected Template (240px) */}
              <div className="w-[240px] flex-shrink-0 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] p-4 overflow-y-auto scrollbar-thin">
                <h3 className="text-base font-semibold text-[#2D2F34] dark:text-gray-100 mb-4 leading-tight">
                  Selected Template: {selectedTemplate.name}
                </h3>

                {/* Required Sections List */}
                <div>
                  <h4 className="text-sm font-semibold text-[#2D2F34] dark:text-gray-100 mb-3">Required Sections:</h4>
                  <div className="space-y-2.5">
                    {selectedTemplate.requiredSections.map((section, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[#47AF47] flex-shrink-0" />
                        <span className="text-xs font-medium text-[#2D2F34] dark:text-gray-300 flex-1 leading-tight">
                          {section.title}
                        </span>
                        <span className={"rounded-full px-2 py-0.5 text-[9px] font-medium whitespace-nowrap " + (
                          section.priority === 'critical' ? 'bg-[#EDDBDB] text-[#BA0003]' :
                          section.priority === 'high' ? 'bg-[#FFE7E0] text-[#E55400]' :
                          section.priority === 'medium' ? 'bg-[#FFF8CB] text-[#BF6D0A]' :
                          'bg-[#E8E9FF] text-[#6E72FF]'
                        )}>
                          {section.priority.charAt(0).toUpperCase() + section.priority.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Center Column - Template Preview (flex-1 to take remaining space) */}
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] p-4 overflow-y-auto scrollbar-thin">
                <h3 className="text-base font-semibold text-[#2D2F34] dark:text-gray-100 mb-2 leading-tight">
                  Template format preview (brief)
                </h3>
                <p className="text-xs text-[#6A707C] dark:text-gray-400 mb-5">
                  This is a preview of the template structure. The actual contract will be uploaded in the next step.
                </p>

                {/* Preview Sections */}
                <div className="space-y-5">
                  {templatePreviewSections.map((section, index) => (
                    <div key={index}>
                      <h4 className="text-sm font-semibold text-[#2D2F34] dark:text-gray-100 mb-1.5">
                        {section.title}
                      </h4>
                      <p className="text-xs text-[#6A707C] dark:text-gray-400 leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Sources (240px) */}
              <div className="w-[240px] flex-shrink-0 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] p-4 overflow-y-auto scrollbar-thin">
                <h3 className="text-base font-semibold text-[#2D2F34] dark:text-gray-100 mb-5 leading-tight">
                  Sources
                </h3>

                {/* Empty State - SVG from Figma */}
                <div className="flex flex-col items-center justify-center py-10">
                  <svg width="140" height="64" viewBox="0 0 168 77" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M83.9999 76.5C130.392 76.5 167.5 59.5538 167.5 38.5C167.5 17.4462 130.392 0.5 83.9999 0.5C37.6078 0.5 0.5 17.4462 0.5 38.5C0.5 59.5538 37.6078 76.5 83.9999 76.5Z" fill="#F5F5F5" stroke="#E0E0E0"/>
                    <rect x="34" y="20" width="100" height="37" rx="4" fill="white" stroke="#E0E0E0"/>
                    <circle cx="84" cy="38.5" r="8" fill="#F0F0F0"/>
                    <line x1="60" y1="32" x2="75" y2="32" stroke="#E0E0E0" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="60" y1="38" x2="70" y2="38" stroke="#E0E0E0" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="93" y1="32" x2="108" y2="32" stroke="#E0E0E0" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="93" y1="38" x2="103" y2="38" stroke="#E0E0E0" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <p className="text-xs text-[#6A707C] dark:text-gray-400 mt-5 text-center">
                    No sources available
                  </p>
                </div>
              </div>
            </div>
            ) : (
              /* Custom Template Upload */
              <div className="flex-1 flex flex-col overflow-hidden items-center pt-8">
                <div className="bg-white dark:bg-gray-800 rounded-[10px] border border-[#DEE3ED] dark:border-gray-600 border-dashed p-5 flex flex-col gap-4 w-full max-w-3xl">
                  <h3 className="text-base font-semibold text-[#202020] dark:text-gray-100">
                    Provide a custom template
                  </h3>
                  
                  {/* Upload Area */}
                  <div className="border border-[#DEE3ED] dark:border-gray-700 rounded-[5px] bg-[#FAFAFA] dark:bg-gray-800 p-8">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <svg className="w-16 h-16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.75 7.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm4.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" className="text-gray-400 dark:text-gray-500"/>
                        <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2Zm2.354 5.146a.5.5 0 0 1-.708.708L8.5 6.707V10.5a.5.5 0 0 1-1 0V6.707L6.354 7.854a.5.5 0 1 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2Z" className="text-gray-400 dark:text-gray-500"/>
                      </svg>
                      
                      <label className="text-white hover:bg-[#2F36B0] text-xs font-semibold h-9 px-4 rounded-[5px] cursor-pointer flex items-center justify-center" style={{ backgroundColor: '#3B43D6' }}>
                        Drag & drop your template here or click to browse
                        <Input 
                          key={customTemplateInputKey}
                          ref={customTemplateInputRef}
                          type="file" 
                          accept=".pdf,.doc,.docx,.txt" 
                          onChange={handleCustomTemplateUpload}
                          className="hidden"
                        />
                      </label>
                      
                      <p className="text-xs font-medium text-[#595959] dark:text-gray-400">
                        Accepted: .pdf, .doc, .docx, .txt
                      </p>

                      {customTemplateFile && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <FileText className="h-4 w-4 text-[#3B43D6]" />
                          <span className="text-[#202020] dark:text-gray-100 truncate max-w-[260px]" title={customTemplateFile.name}>
                            Selected: {customTemplateFile.name}
                          </span>
                          <button
                            onClick={() => {
                              setCustomTemplateFile(null);
                              if (customTemplateInputRef.current) {
                                customTemplateInputRef.current.value = "";
                              }
                              setCustomTemplateInputKey((k) => k + 1);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 Footer Navigation */}
            <div className="sticky bottom-0 left-0 right-0 pt-1 mt-1">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="px-3 hover:bg-[#E8E9FF]"
                  style={{ borderColor: '#3B43D6', color: '#3B43D6' }}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!canProceedToStep3}
                  className="px-4 text-white hover:bg-[#2F36B0]"
                  style={{ backgroundColor: '#3B43D6' }}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Upload Contract */}
        {currentStep === 3 && (
          <div className="flex-1 flex flex-col gap-[30px] overflow-y-auto scrollbar-thin items-end pr-4">
            {/* Upload Options */}
            <div className="flex gap-[25px] w-full max-w-[1648px]">
              {/* Upload from Device */}
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-[10px] border border-[#DEE3ED] dark:border-gray-600 border-dashed p-5 flex flex-col gap-[15px]">
                <h3 className="text-base font-semibold text-[#202020] dark:text-gray-100">
                  Upload from Device
                </h3>
                
                <div className="flex flex-col gap-[18px]">
                  <p className="text-xs font-medium text-[#595959] dark:text-gray-400 w-[370px]">
                    Upload a contract document from your computer
                  </p>
                </div>
                
                {/* Upload Area */}
                <div className="border border-[#DEE3ED] dark:border-gray-700 rounded-[5px] bg-[#FAFAFA] dark:bg-gray-800 px-5 py-[15px] flex justify-center items-center">
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <svg className="w-16 h-16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5.75 7.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm4.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" className="text-gray-400 dark:text-gray-500"/>
                      <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2Zm2.354 5.146a.5.5 0 0 1-.708.708L8.5 6.707V10.5a.5.5 0 0 1-1 0V6.707L6.354 7.854a.5.5 0 1 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2Z" className="text-gray-400 dark:text-gray-500"/>
                    </svg>
                    
                    <label className="bg-[#3B43D6] text-white hover:bg-[#2F36B0] text-xs font-semibold h-9 px-4 rounded-[5px] cursor-pointer flex items-center justify-center">
                      Choose File
                      <Input 
                        key={deviceInputKey} 
                        ref={deviceFileInputRef} 
                        type="file" 
                        accept=".pdf,.doc,.docx,.txt" 
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    
                    <p className="text-xs font-medium text-[#595959] dark:text-gray-400">
                      Supported formats: PDF, DOC, DOCX, TXT
                    </p>
                    
                    {uploadedFile && uploadSource === "device" && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-[#202020] dark:text-gray-100 truncate max-w-[260px]" title={uploadedFile.name}>
                          Selected: {uploadedFile.name}
                        </span>
                        <button
                          onClick={() => {
                            setUploadedFile(null);
                            setUploadSource(null);
                            setExtractedDocument(null);
                            crStore.setExtractedDocument(null);
                            crStore.setSuggestions([]);
                            if (deviceFileInputRef.current) {
                              deviceFileInputRef.current.value = "";
                            }
                            setDeviceInputKey((k) => k + 1);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Use Existing Asset */}
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-[10px] border border-[#DEE3ED] dark:border-gray-600 border-dashed p-5 flex flex-col gap-[15px]">
                <h3 className="text-base font-semibold text-[#202020] dark:text-gray-100">
                  Use Existing Asset
                </h3>
                
                <div className="flex flex-col gap-[18px]">
                  <p className="text-xs font-medium text-[#595959] dark:text-gray-400 w-[370px]">
                    Select a file from your assets
                  </p>
                </div>
                
                {/* Browse Area */}
                <div className="border border-[#DEE3ED] dark:border-gray-700 rounded-[5px] bg-[#FAFAFA] dark:bg-gray-800 px-5 py-[15px] flex justify-center items-center">
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <svg className="w-16 h-16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5.75 7.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm4.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" className="text-gray-400 dark:text-gray-500"/>
                      <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2Zm2.354 5.146a.5.5 0 0 1-.708.708L8.5 6.707V10.5a.5.5 0 0 1-1 0V6.707L6.354 7.854a.5.5 0 1 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2Z" className="text-gray-400 dark:text-gray-500"/>
                    </svg>
                    
                    <Button 
                      onClick={() => setIsAssetPickerOpen(true)}
                      className="bg-[#3B43D6] text-white hover:bg-[#2F36B0] text-xs font-semibold h-9 px-4 rounded-[5px]"
                    >
                      Browse Assets
                    </Button>
                    
                    <p className="text-xs font-medium text-[#595959] dark:text-gray-400">
                      Select from your uploaded documents
                    </p>
                    
                    {uploadedFile && uploadSource === "asset" && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-[#202020] dark:text-gray-100 truncate max-w-[260px]" title={uploadedFile.name}>
                          Selected: {uploadedFile.name}
                        </span>
                        <button
                          onClick={() => {
                            setUploadedFile(null);
                            setUploadSource(null);
                            setExtractedDocument(null);
                            crStore.setExtractedDocument(null);
                            crStore.setSuggestions([]);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Rules Section */}
            <div className="flex flex-col gap-[30px] w-full max-w-[1648px]">
              {/* Rules Configuration with Toggle */}
              <div className="border border-[#DEE3ED] dark:border-gray-700 rounded-[5px] bg-white dark:bg-gray-800 px-5 py-[15px] flex items-center self-stretch">
                <div className="flex gap-[15px] w-full justify-between items-center">
                  <div className="flex-1 flex flex-col justify-center gap-[7px]">
                    <h4 className="text-base font-semibold text-[#202020] dark:text-gray-100">
                      Rules
                    </h4>
                    <p className="text-xs font-medium text-[#595959] dark:text-gray-400">
                      Use your custom company rules during analysis
                    </p>
                  </div>
                  <Switch checked={applyRuleBase} onCheckedChange={setApplyRuleBase} />
                </div>
              </div>
            </div>

            {/* Upload Tips */}
            <div className="border border-[#DEE3ED] dark:border-gray-700 rounded-[5px] bg-white dark:bg-gray-800 px-5 py-[15px] flex w-full max-w-[1648px] self-stretch">
              <div className="flex gap-[15px] w-full">
                <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#000000" strokeWidth="2"/>
                  <path d="M12 16V12" stroke="#000000" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="8" r="1" fill="#000000"/>
                </svg>
                <div className="flex-1 flex flex-col justify-center gap-[7px]">
                  <h4 className="text-base font-semibold text-[#202020] dark:text-gray-100">
                    Tip
                  </h4>
                  <p className="text-xs font-medium text-[#595959] dark:text-gray-400">
                    For best results, upload clear, text-based documents. Scanned PDFs may require OCR.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 Footer Navigation */}
            <div className="w-full max-w-[1648px] flex justify-end">
              <div className="flex items-center gap-[15px]">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-[5px] px-2.5 h-9 bg-[#FAFAFA] dark:bg-gray-800 border border-[#DEE3ED] dark:border-gray-600 rounded-[5px] text-xs font-semibold text-[#717171] dark:text-gray-400 hover:bg-gray-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  onClick={nextStep}
                  disabled={!canProceedToStep4}
                  className="flex items-center gap-[5px] px-4 h-9 bg-[#3B43D6] text-white rounded-[5px] text-xs font-semibold hover:bg-[#2F36B0] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Canvas Review */}
        {currentStep === 4 && (
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto scrollbar-thin items-end pr-4">
            {/* Reviewer notes textarea before analysis */}
            {!extractedDocument && (
              <Textarea
                placeholder="Any final instructions for contract review..."
                value={finalInstructions}
                onChange={(e) => setFinalInstructions(e.target.value)}
                className="min-h-[120px] w-full max-w-[1648px]"
              />
            )}

            {/* Canvas after analysis */}
            {extractedDocument && (
              <div className="flex-1 overflow-y-auto scrollbar-thin w-full max-w-[1648px]">
                <ContractCanvas />
              </div>
            )}

            {/* Bottom Right Navigation */}
            <div className="w-full max-w-[1648px] flex justify-end">
              <div className="flex items-center gap-[15px]">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-[5px] px-2.5 h-9 bg-[#FAFAFA] dark:bg-gray-800 border border-[#DEE3ED] dark:border-gray-600 rounded-[5px] text-xs font-semibold text-[#717171] dark:text-gray-400 hover:bg-gray-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                
                {!extractedDocument && (
                  <button
                    onClick={handleDocumentExtraction}
                    disabled={!uploadedFile || isAnalyzing || !selectedTemplate}
                    className="flex items-center gap-[5px] px-4 h-9 bg-[#3B43D6] text-white rounded-[5px] text-xs font-semibold hover:bg-[#2F36B0] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Extract & Analyze with AI
                      </>
                    )}
                  </button>
                )}
                
                {extractedDocument && (
                  <button
                    onClick={nextStep}
                    className="flex items-center gap-[5px] px-4 h-9 bg-[#3B43D6] text-white rounded-[5px] text-xs font-semibold hover:bg-[#2F36B0]"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Results */}
        {currentStep === 5 && (
          <div className="flex-1 flex flex-col space-y-6 overflow-y-auto scrollbar-thin pr-4">
            {/* Step 5 Subtitle */}
            <div className="text-center -mt-4">
              <p className="text-sm text-muted-foreground">
                Contract Assessment — Based on the conducted analysis and review
              </p>
            </div>

            {/* Completion Status Banner */}
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 dark:text-green-200">Analysis Complete!</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your contract has been successfully analyzed. Review the results below and use the action buttons to proceed.
                  </p>
                </div>
                {extractedDocument && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleDownloadReport}
                      className="flex items-center gap-2 h-9 px-4 bg-[#3B43D6] text-white hover:bg-[#2F36B0] text-xs font-semibold rounded-[5px]"
                    >
                      <Download className="h-4 w-4" />
                      Download Report
                    </Button>
                    <Button
                      onClick={handleDownloadResults}
                      variant="outline"
                      className="flex items-center gap-2 h-9 px-4 border-[#DEE3ED] text-xs font-semibold rounded-[5px]"
                    >
                      <Download className="h-4 w-4" />
                      Download JSON
                    </Button>
                    <Button
                      onClick={handleStartNewReview}
                      variant="outline"
                      className="flex items-center gap-2 h-9 px-4 border-[#DEE3ED] text-xs font-semibold rounded-[5px] hover:bg-[#3B43D6] hover:text-white hover:border-[#3B43D6]"
                    >
                      <RotateCcw className="h-4 w-4" />
                      New Review
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {!extractedDocument ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">No analysis results</h3>
                <p className="text-sm text-muted-foreground">
                  Complete the analysis to see contract review results
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {extractedDocument.fileName}
                      </h3>
                      <p className="text-muted-foreground">
                        {selectedTemplate?.name || 'Contract Analysis'} • Analyzed on {formatDateShort(new Date())}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground mr-2 uppercase">Assessed</span>
                      <Badge className={extractedDocument.overallScore >= 90 ? 'bg-green-100 text-green-800' : extractedDocument.overallScore >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                        {extractedDocument.overallScore >= 90 ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                        <span className="ml-1">{extractedDocument.overallScore >= 90 ? 'compliant' : extractedDocument.overallScore >= 70 ? 'partial' : 'non-compliant'}</span>
                      </Badge>
                      <Badge className={extractedDocument.gaps.length > 5 ? 'bg-red-100 text-red-800' : extractedDocument.gaps.length > 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                        Risk: {extractedDocument.gaps.length > 5 ? 'high' : extractedDocument.gaps.length > 2 ? 'medium' : 'low'}
                      </Badge>
                      <Badge variant="outline">{extractedDocument.overallScore}% Score</Badge>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Contract Quality Score</span>
                      <span>{extractedDocument.overallScore}%</span>
                    </div>
                    <Progress value={extractedDocument.overallScore} className="h-3" />
                  </div>

                  {/* Severity Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                      const counts = { critical: 0, high: 0, medium: 0, low: 0 } as Record<string, number>;
                      if (extractedDocument?.gaps) {
                        extractedDocument.gaps.forEach(g => counts[g.severity] = (counts[g.severity] || 0) + 1);
                      }
                      const tiles = [
                        { key: 'critical', label: 'Critical', icon: AlertTriangle },
                        { key: 'high', label: 'High', icon: AlertTriangle },
                        { key: 'medium', label: 'Medium', icon: FileText },
                        { key: 'low', label: 'Low', icon: CheckCircle },
                      ];
                      return tiles.map(({ key, label, icon: Icon }) => (
                        <Card key={key} className="border-muted">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-2xl font-bold leading-none">{counts[key] || 0}</div>
                                <div className="text-sm text-muted-foreground mt-1">{label} issues</div>
                              </div>
                              <Badge variant="outline" className="capitalize flex items-center gap-1">
                                <Icon className="h-3 w-3" /> {label}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ));
                    })()}
                  </div>

                  {/* Issues and Suggestions */}
                  <div className="space-y-6 mt-4">
                    {extractedDocument.gaps && extractedDocument.gaps.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Issues Found ({extractedDocument.gaps.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3">
                            {extractedDocument.gaps.map((g) => (
                              <li key={g.id} className="rounded-md border p-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={`text-xs capitalize ${
                                    g.severity === 'critical' ? 'border-red-300 text-red-700' :
                                    g.severity === 'high' ? 'border-orange-300 text-orange-700' :
                                    g.severity === 'medium' ? 'border-yellow-300 text-yellow-700' :
                                    'border-blue-300 text-blue-700'
                                  }`}>{g.severity}</Badge>
                                  <div className="text-sm font-medium">{g.sectionTitle}</div>
                                  <span className="text-xs text-muted-foreground">• {g.gapType.replace('-', ' ')}</span>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">{g.description}</div>
                                {g.recommendation && (
                                  <div className="text-sm text-green-700 dark:text-green-400 mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded">
                                    <strong>Recommendation:</strong> {g.recommendation}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {extractedDocument.sections && extractedDocument.sections.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Document Sections ({extractedDocument.sections.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {extractedDocument.sections.map((section) => (
                              <li key={section.id} className="text-sm flex items-start gap-2 p-2 rounded border">
                                <span className={`mt-1 ${section.hasGaps ? 'text-red-600' : 'text-green-600'}`}>
                                  {section.hasGaps ? '⚠️' : '✅'}
                                </span>
                                <div className="flex-1">
                                  <div className="font-medium">{section.title}</div>
                                  <div className="text-muted-foreground text-xs mt-1">
                                    {section.content.substring(0, 100)}...
                                  </div>
                                  {section.hasGaps && (
                                    <div className="text-red-600 text-xs mt-1">
                                      {section.gapIds.length} issue(s) found
                                    </div>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Asset Picker Modal */}
      <AssetPicker
        isOpen={isAssetPickerOpen}
        onClose={() => setIsAssetPickerOpen(false)}
        onSelect={handleAssetSelect}
        title="Select Contract Document"
        description="Choose a document from your assets to review"
      />
    </div>
  );
}

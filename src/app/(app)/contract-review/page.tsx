"use client";

import React, { useEffect, useRef, useState } from "react";
import { FileText, Upload, Eye, Download, AlertTriangle, CheckCircle, Clock, User, ChevronRight, ChevronLeft, Building, Users, Shield, Handshake, Award, Home, TrendingUp, Car, ShoppingCart, Truck, Crown, Network, Search, Filter, Briefcase, Globe, Heart, Zap, Wifi, Database, Code, Palette, Music, Camera, Plane, Ship, Factory, Hammer, Wrench, Cog, Book, GraduationCap, Stethoscope, Scale, Gavel, DollarSign, CreditCard, PiggyBank, Landmark, Info, FolderOpen, BookOpen, Library, Edit3, RotateCcw, Save, X, NotebookPen, FileUp, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AssetPicker } from "@/components/AssetPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { ContractCanvas } from "@/components/contract-review/ContractCanvas";
import { toastSuccess, toastError } from "@/components/toast-varients";
import { useContractReviewStore } from "@/store/contractReview";

interface ContractTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  sections: TemplateSection[];
  lastUpdated: string;
  isBaseline: boolean;
  sources: string[];
}

interface TemplateSection {
  id: string;
  title: string;
  content: string;
  isRequired: boolean;
  priority: "critical" | "high" | "medium" | "low";
  guidelines: string[];
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

interface ContractReview {
  id: string;
  fileName: string;
  contractType: string;
  status: "pending" | "in-review" | "completed" | "requires-attention";
  riskLevel: "low" | "medium" | "high";
  score: number;
  gaps: string[];
  suggestions: string[];
  reviewer: string;
  uploadDate: string;
  reviewDate?: string;
}

// Dynamic reviews will be loaded from API or user uploads
const initialReviews: ContractReview[] = [];

// Knowledge base templates
const knowledgeBaseTemplates: ContractTemplate[] = [
  {
    id: "service-agreement",
    name: "Service Agreement Template",
    type: "service",
    description: "Baseline template for service agreements with all required clauses",
    sections: [
      {
        id: "parties",
        title: "Parties",
        content: "This Agreement is entered between [Company Name] and [Service Provider]",
        isRequired: true,
        priority: "critical",
        guidelines: ["Must clearly identify all parties", "Include legal entity names and addresses"]
      },
      {
        id: "scope",
        title: "Scope of Services",
        content: "Detailed description of services to be provided",
        isRequired: true,
        priority: "critical",
        guidelines: ["Must be specific and measurable", "Include deliverables and timelines"]
      },
      {
        id: "payment",
        title: "Payment Terms",
        content: "Payment schedule, amounts, and terms",
        isRequired: true,
        priority: "high",
        guidelines: ["Clear payment schedule", "Late payment penalties", "Currency specification"]
      },
      {
        id: "termination",
        title: "Termination Clause",
        content: "Conditions under which agreement can be terminated",
        isRequired: true,
        priority: "high",
        guidelines: ["Notice period requirements", "Termination for cause", "Post-termination obligations"]
      },
      {
        id: "liability",
        title: "Limitation of Liability",
        content: "Liability limitations and indemnification clauses",
        isRequired: true,
        priority: "critical",
        guidelines: ["Cap on damages", "Mutual indemnification", "Insurance requirements"]
      }
    ],
    lastUpdated: "2024-01-15",
    isBaseline: true,
    sources: ["Internal Legal KB", "Law Insider"]
  },
  { id: "msa", name: "Master Services Agreement", type: "service", description: "Standard MSA with SOWs", sections: [
      { id: "msa-def", title: "Definitions", content: "", isRequired: true, priority: "high", guidelines: [] },
      { id: "msa-scope", title: "Scope of Services", content: "", isRequired: true, priority: "high", guidelines: [] },
      { id: "msa-fees", title: "Fees & Payment", content: "", isRequired: true, priority: "medium", guidelines: [] },
      { id: "msa-term", title: "Term & Termination", content: "", isRequired: true, priority: "medium", guidelines: [] },
      { id: "msa-liability", title: "Limitation of Liability", content: "", isRequired: true, priority: "critical", guidelines: [] }
    ], lastUpdated: "2024-02-10", isBaseline: true, sources: ["Internal Legal KB", "Law Insider"] },
  { id: "sow", name: "Statement of Work (SOW)", type: "service", description: "Detailed work scope", sections: [
      { id: "sow-deliverables", title: "Deliverables", content: "", isRequired: true, priority: "high", guidelines: [] },
      { id: "sow-milestones", title: "Milestones", content: "", isRequired: false, priority: "medium", guidelines: [] },
      { id: "sow-acceptance", title: "Acceptance Criteria", content: "", isRequired: true, priority: "high", guidelines: [] }
    ], lastUpdated: "2024-03-12", isBaseline: false, sources: ["Internal Legal KB"] },
  { id: "nda-mutual", name: "Mutual NDA", type: "legal", description: "Mutual confidentiality obligations", sections: [
      { id: "nda-def", title: "Definitions", content: "", isRequired: true, priority: "high", guidelines: [] },
      { id: "nda-conf", title: "Confidential Information", content: "", isRequired: true, priority: "critical", guidelines: [] },
      { id: "nda-term", title: "Term", content: "", isRequired: true, priority: "medium", guidelines: [] },
      { id: "nda-excl", title: "Exclusions", content: "", isRequired: true, priority: "medium", guidelines: [] },
      { id: "nda-rem", title: "Remedies", content: "", isRequired: false, priority: "low", guidelines: [] }
    ], lastUpdated: "2024-01-28", isBaseline: true, sources: ["Cornell LII", "Law Insider"] },
  { id: "nda-oneway", name: "One-way NDA", type: "legal", description: "Disclosing party protections", sections: [
      { id: "ondadef", title: "Definitions", content: "", isRequired: true, priority: "high", guidelines: [] },
      { id: "ondarecip", title: "Recipient Obligations", content: "", isRequired: true, priority: "high", guidelines: [] },
      { id: "ondaterm", title: "Term & Return", content: "", isRequired: true, priority: "medium", guidelines: [] }
    ], lastUpdated: "2023-12-05", isBaseline: false, sources: ["Cornell LII"] },
  { id: "dpa", name: "Data Processing Addendum", type: "technology", description: "GDPR/CCPA aligned DPA", sections: [
      { id: "dpa-roles", title: "Roles & Responsibilities", content: "", isRequired: true, priority: "high", guidelines: [] },
      { id: "dpa-security", title: "Security Measures", content: "", isRequired: true, priority: "critical", guidelines: [] },
      { id: "dpa-sub", title: "Subprocessors", content: "", isRequired: true, priority: "high", guidelines: [] },
      { id: "dpa-xfer", title: "Data Transfers", content: "", isRequired: true, priority: "medium", guidelines: [] },
      { id: "dpa-breach", title: "Breach Notification", content: "", isRequired: true, priority: "high", guidelines: [] }
    ], lastUpdated: "2024-04-02", isBaseline: true, sources: ["EDPB", "ICO"] },
  { id: "sla", name: "Service Level Agreement", type: "technology", description: "Uptime and remedies", sections: [
      { id: "sla-uptime", title: "Uptime Commitment", content: "", isRequired: true, priority: "high", guidelines: [] },
      { id: "sla-credits", title: "Service Credits", content: "", isRequired: true, priority: "medium", guidelines: [] },
      { id: "sla-support", title: "Support Tiers", content: "", isRequired: false, priority: "low", guidelines: [] }
    ], lastUpdated: "2024-03-20", isBaseline: true, sources: ["Internal Legal KB"] },
  { id: "eula", name: "End User License Agreement", type: "technology", description: "Software licensing terms", sections: [
      { id: "eula-license", title: "License Grant", content: "", isRequired: true, priority: "high", guidelines: [] },
      { id: "eula-restrict", title: "Restrictions", content: "", isRequired: true, priority: "high", guidelines: [] },
      { id: "eula-warranty", title: "Disclaimer/Warranty", content: "", isRequired: true, priority: "medium", guidelines: [] }
    ], lastUpdated: "2024-01-06", isBaseline: false, sources: ["Open Source Templates", "Law Insider"] },
  { id: "reseller", name: "Reseller Agreement", type: "commercial", description: "Channel partner terms", sections: [
      { id: "reseller-territory", title: "Territory", content: "", isRequired: true, priority: "medium", guidelines: [] },
      { id: "reseller-targets", title: "Sales Targets", content: "", isRequired: false, priority: "low", guidelines: [] },
      { id: "reseller-brand", title: "Branding & Compliance", content: "", isRequired: false, priority: "low", guidelines: [] }
    ], lastUpdated: "2024-02-14", isBaseline: false, sources: ["Law Insider"] },
  { id: "distribution", name: "Distribution Agreement", type: "commercial", description: "Territories and quotas", sections: [
      { id: "dist-territory", title: "Territory & Exclusivity", content: "", isRequired: true, priority: "medium", guidelines: [] },
      { id: "dist-min", title: "Minimum Commitments", content: "", isRequired: true, priority: "high", guidelines: [] }
    ], lastUpdated: "2024-03-01", isBaseline: false, sources: ["Law Insider"] },
  { id: "license-ip", name: "IP License Agreement", type: "legal", description: "Scope and exclusivity", sections: [
      { id: "ip-scope", title: "Scope of License", content: "", isRequired: true, priority: "high", guidelines: [] },
      { id: "ip-royalty", title: "Royalties", content: "", isRequired: false, priority: "low", guidelines: [] }
    ], lastUpdated: "2024-01-19", isBaseline: true, sources: ["WIPO", "Law Insider"] },
  { id: "subprocessing", name: "Sub-processor Agreement", type: "technology", description: "Downstream obligations", sections: [
      { id: "sub-contract", title: "Contractual Flowdown", content: "", isRequired: true, priority: "high", guidelines: [] }
    ], lastUpdated: "2024-02-27", isBaseline: false, sources: ["EDPB"] },
  { id: "consulting", name: "Consulting Agreement", type: "business", description: "Advisory scope and fees", sections: [
      { id: "consult-scope", title: "Scope", content: "", isRequired: true, priority: "high", guidelines: [] },
      { id: "consult-fees", title: "Fees", content: "", isRequired: true, priority: "medium", guidelines: [] }
    ], lastUpdated: "2024-02-08", isBaseline: false, sources: ["Internal Legal KB"] },
  { id: "employment", name: "Employment Agreement", type: "legal", description: "Employee terms and IP", sections: [
      { id: "emp-role", title: "Role & Duties", content: "", isRequired: true, priority: "medium", guidelines: [] },
      { id: "emp-comp", title: "Compensation", content: "", isRequired: true, priority: "high", guidelines: [] },
      { id: "emp-ip", title: "IP Assignment", content: "", isRequired: true, priority: "high", guidelines: [] }
    ], lastUpdated: "2024-03-11", isBaseline: true, sources: ["SHRM", "Law Insider"] },
  { id: "contractor", name: "Independent Contractor", type: "legal", description: "Contractor engagement terms", sections: [
      { id: "ctr-scope", title: "Scope", content: "", isRequired: true, priority: "high", guidelines: [] },
      { id: "ctr-ip", title: "IP & Ownership", content: "", isRequired: true, priority: "high", guidelines: [] }
    ], lastUpdated: "2024-03-05", isBaseline: true, sources: ["SHRM"] },
  { id: "partners", name: "Partnership Agreement", type: "business", description: "Governance and capital", sections: [
      { id: "part-cap", title: "Capital Contributions", content: "", isRequired: true, priority: "medium", guidelines: [] },
      { id: "part-govern", title: "Governance", content: "", isRequired: true, priority: "high", guidelines: [] }
    ], lastUpdated: "2024-02-01", isBaseline: false, sources: ["Law Insider"] },
  { id: "jv", name: "Joint Venture Agreement", type: "business", description: "JV structure and exits", sections: [
      { id: "jv-structure", title: "Structure", content: "", isRequired: true, priority: "medium", guidelines: [] }
    ], lastUpdated: "2024-01-30", isBaseline: false, sources: ["Law Insider"] },
  { id: "franchise", name: "Franchise Agreement", type: "business", description: "Franchise operations", sections: [
      { id: "fran-fees", title: "Fees", content: "", isRequired: true, priority: "medium", guidelines: [] }
    ], lastUpdated: "2024-01-22", isBaseline: false, sources: ["FTC Franchise Guide"] },
  { id: "lease-commercial", name: "Commercial Lease", type: "property", description: "Premises and rent", sections: [
      { id: "lease-term", title: "Term", content: "", isRequired: true, priority: "medium", guidelines: [] },
      { id: "lease-rent", title: "Rent & Escalation", content: "", isRequired: true, priority: "high", guidelines: [] }
    ], lastUpdated: "2024-03-25", isBaseline: true, sources: ["Law Insider"] },
  { id: "lease-equipment", name: "Equipment Lease", type: "property", description: "Equipment rental terms", sections: [
      { id: "el-term", title: "Term & Ownership", content: "", isRequired: true, priority: "medium", guidelines: [] }
    ], lastUpdated: "2024-01-18", isBaseline: false, sources: ["Law Insider"] },
  { id: "purchase", name: "Purchase Agreement", type: "commercial", description: "Sale of goods terms", sections: [
      { id: "po-goods", title: "Goods & Delivery", content: "", isRequired: true, priority: "high", guidelines: [] },
      { id: "po-inspect", title: "Inspection & Acceptance", content: "", isRequired: true, priority: "medium", guidelines: [] }
    ], lastUpdated: "2024-02-21", isBaseline: true, sources: ["UCC", "Law Insider"] },
  { id: "supply", name: "Supply Agreement", type: "commercial", description: "Supply commitments", sections: [
      { id: "supply-forecast", title: "Forecast & Orders", content: "", isRequired: true, priority: "medium", guidelines: [] }
    ], lastUpdated: "2024-02-26", isBaseline: false, sources: ["Law Insider"] },
  { id: "manufacturing", name: "Manufacturing Agreement", type: "commercial", description: "Production and quality", sections: [
      { id: "mfg-quality", title: "Quality & Audits", content: "", isRequired: true, priority: "high", guidelines: [] }
    ], lastUpdated: "2024-03-02", isBaseline: false, sources: ["ISO", "Law Insider"] },
  { id: "maintenance", name: "Maintenance Agreement", type: "service", description: "Support and repairs", sections: [
      { id: "maint-scope", title: "Scope & SLAs", content: "", isRequired: true, priority: "medium", guidelines: [] }
    ], lastUpdated: "2024-03-08", isBaseline: false, sources: ["Internal Legal KB"] },
  { id: "warranty", name: "Warranty Agreement", type: "commercial", description: "Warranty scope/limits", sections: [
      { id: "warr-scope", title: "Scope & Duration", content: "", isRequired: true, priority: "medium", guidelines: [] }
    ], lastUpdated: "2024-01-26", isBaseline: false, sources: ["Manufacturing Templates"] },
  { id: "software-license", name: "Software License", type: "technology", description: "On-prem license terms", sections: [
      { id: "swl-grant", title: "Grant & Restrictions", content: "", isRequired: true, priority: "high", guidelines: [] }
    ], lastUpdated: "2024-02-02", isBaseline: true, sources: ["Open Source Templates", "Law Insider"] },
  { id: "saas", name: "SaaS Subscription", type: "technology", description: "Cloud subscription terms", sections: [
      { id: "saas-sub", title: "Subscription & Term", content: "", isRequired: true, priority: "high", guidelines: [] },
      { id: "saas-data", title: "Data & Privacy", content: "", isRequired: true, priority: "high", guidelines: [] }
    ], lastUpdated: "2024-02-12", isBaseline: true, sources: ["Internal Legal KB"] },
  { id: "hosting", name: "Hosting Agreement", type: "technology", description: "Hosting obligations", sections: [
      { id: "host-availability", title: "Availability & Support", content: "", isRequired: true, priority: "medium", guidelines: [] }
    ], lastUpdated: "2024-02-18", isBaseline: false, sources: ["Internal Legal KB"] },
  { id: "api", name: "API Terms", type: "technology", description: "API usage and limits", sections: [
      { id: "api-keys", title: "API Keys & Limits", content: "", isRequired: true, priority: "medium", guidelines: [] }
    ], lastUpdated: "2024-02-24", isBaseline: false, sources: ["Developer Docs Samples"] },
  { id: "privacy", name: "Privacy Policy", type: "legal", description: "Data privacy disclosures", sections: [
      { id: "pp-collect", title: "Collection & Use", content: "", isRequired: true, priority: "medium", guidelines: [] }
    ], lastUpdated: "2024-03-14", isBaseline: true, sources: ["ICO", "OECD"] },
  { id: "terms", name: "Terms of Service", type: "legal", description: "Website/app terms", sections: [
      { id: "tos-use", title: "Acceptable Use", content: "", isRequired: true, priority: "medium", guidelines: [] }
    ], lastUpdated: "2024-03-19", isBaseline: true, sources: ["Internal Legal KB"] },
  { id: "affiliate", name: "Affiliate Agreement", type: "commercial", description: "Affiliate payouts", sections: [
      { id: "aff-payouts", title: "Payouts & Tracking", content: "", isRequired: false, priority: "low", guidelines: [] }
    ], lastUpdated: "2024-03-23", isBaseline: false, sources: ["Marketing Templates"] },
  { id: "influencer", name: "Influencer Agreement", type: "commercial", description: "Creator campaigns", sections: [
      { id: "inf-deliverables", title: "Deliverables & IP", content: "", isRequired: true, priority: "medium", guidelines: [] }
    ], lastUpdated: "2024-03-28", isBaseline: false, sources: ["Marketing Templates"] },
  { id: "sponsorship", name: "Sponsorship Agreement", type: "commercial", description: "Event sponsorship", sections: [
      { id: "spon-rights", title: "Sponsorship Rights", content: "", isRequired: true, priority: "medium", guidelines: [] }
    ], lastUpdated: "2024-04-03", isBaseline: false, sources: ["Event Templates"] },
  { id: "merger", name: "Merger Agreement", type: "business", description: "M&A transaction doc", sections: [
      { id: "mna-reps", title: "Reps & Warranties", content: "", isRequired: true, priority: "high", guidelines: [] }
    ], lastUpdated: "2024-04-06", isBaseline: false, sources: ["ABA Model Docs"] },
  { id: "asset-sale", name: "Asset Purchase Agreement", type: "business", description: "Asset transfer terms", sections: [
      { id: "apa-assets", title: "Assets & Liabilities", content: "", isRequired: true, priority: "high", guidelines: [] }
    ], lastUpdated: "2024-04-09", isBaseline: false, sources: ["ABA Model Docs"] },
  { id: "shareholders", name: "Shareholders Agreement", type: "business", description: "Shareholder rights", sections: [
      { id: "sha-rights", title: "Rights & Restrictions", content: "", isRequired: true, priority: "high", guidelines: [] }
    ], lastUpdated: "2024-04-12", isBaseline: true, sources: ["Internal Legal KB"] },
  { id: "bylaws", name: "Company Bylaws", type: "business", description: "Corporate governance", sections: [
      { id: "bylaws-board", title: "Board & Meetings", content: "", isRequired: true, priority: "medium", guidelines: [] }
    ], lastUpdated: "2024-04-15", isBaseline: false, sources: ["Internal Legal KB"] },
  { id: "gdpr", name: "GDPR Addendum", type: "technology", description: "EU data compliance", sections: [
      { id: "gdpr-basis", title: "Legal Basis", content: "", isRequired: true, priority: "high", guidelines: [] }
    ], lastUpdated: "2024-04-18", isBaseline: true, sources: ["EDPB", "ICO"] },
  { id: "hipaa", name: "HIPAA BAA", type: "healthcare", description: "Protected health info", sections: [
      { id: "hipaa-safeguards", title: "Safeguards & PHI", content: "", isRequired: true, priority: "high", guidelines: [] }
    ], lastUpdated: "2024-04-20", isBaseline: true, sources: ["HHS"] }
];

// Severity color configuration
const severityConfig = {
  critical: {
    bg: "bg-red-100 dark:bg-red-950",
    border: "border-red-300 dark:border-red-700",
    text: "text-red-900 dark:text-red-100",
    highlight: "bg-red-200 dark:bg-red-800"
  },
  high: {
    bg: "bg-orange-100 dark:bg-orange-950",
    border: "border-orange-300 dark:border-orange-700",
    text: "text-orange-900 dark:text-orange-100",
    highlight: "bg-orange-200 dark:bg-orange-800"
  },
  medium: {
    bg: "bg-yellow-100 dark:bg-yellow-950",
    border: "border-yellow-300 dark:border-yellow-700",
    text: "text-yellow-900 dark:text-yellow-100",
    highlight: "bg-yellow-200 dark:bg-yellow-800"
  },
  low: {
    bg: "bg-blue-100 dark:bg-blue-950",
    border: "border-blue-300 dark:border-blue-700",
    text: "text-blue-900 dark:text-blue-100",
    highlight: "bg-blue-200 dark:bg-blue-800"
  }
};

export default function ContractReview() {
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedDocument, setExtractedDocument] = useState<ExtractedDocument | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editedText, setEditedText] = useState("");
  // Editor modes for extracted text panel
  const [editorMode, setEditorMode] = useState<'highlight' | 'edit' | 'diff'>("highlight");
  // Model tabs to view inline diffs against generated drafts
  const [selectedModelId, setSelectedModelId] = useState<string>("extracted");
  const [modelDrafts, setModelDrafts] = useState<Record<string, string>>({});
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [reviews, setReviews] = useState<ContractReview[]>(initialReviews);
  const [selectedContractTypes, setSelectedContractTypes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  // New: template boilerplate mode and custom template upload state
  const [templateMode, setTemplateMode] = useState<'standard' | 'knowledge'>('standard');
  const [customTemplateName, setCustomTemplateName] = useState<string>("");
  // New: allow free-form custom template text via notepad
  const [customTemplateText, setCustomTemplateText] = useState<string>("");
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Step 3 device upload input ref (separate from custom template ref used in Step 2)
  const deviceFileInputRef = useRef<HTMLInputElement | null>(null);
  // Force re-mount of the device file input to clear browser-retained filenames
  const [deviceInputKey, setDeviceInputKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [applyRuleBase, setApplyRuleBase] = useState(false);
  // Step 4: optional reviewer notes before analysis
  const [finalInstructions, setFinalInstructions] = useState<string>("");
  // Removed manual input - using only AI-powered document parsing
  // Bridge to canvas store
  const crStore = useContractReviewStore();
  
  // Audit logs state for selected template
  const [templateLogs, setTemplateLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  
  const templatesContainerRef = useRef<HTMLDivElement>(null);
  // Track any ongoing analysis timer to allow cleanup/cancel
  const analyzeTimerRef = useRef<number | null>(null);

  const scrollTemplates = (direction: 'left' | 'right') => {
    const el = templatesContainerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  // Also write a template-scoped audit log so the right-side history updates
  const saveTemplateAuditLog = async (doc: ExtractedDocument, sug: any[]) => {
    try {
      if (!selectedTemplate?.id) return; // only when a template is selected
      const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
      const status = doc.overallScore >= 90 ? 'compliant' : doc.overallScore >= 70 ? 'partial' : 'non-compliant';
      const suggestionsText: string[] = (sug || [])
        .map((s: any) => s.suggestedText || s.reasoning || s.originalText || s.description)
        .filter(Boolean);

      const payload = {
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        action: 'analyzed',
        fileName: doc.fileName,
        score: doc.overallScore,
        status,
        gapsCount: (doc.gaps || []).length,
        fileSize: uploadedFile?.size || 0,
        analysisMethod: 'contract-review',
        userId: userId || undefined,
        snapshot: {
          gaps: (doc.gaps || []).map(g => ({
            id: g.id,
            title: g.sectionTitle,
            description: g.description,
            priority: (g.severity as any) || 'medium',
            category: selectedTemplate?.name || 'Contract',
            recommendation: g.recommendation || '',
            section: g.sectionTitle,
          })),
          suggestions: suggestionsText,
          fullResult: { document: doc, suggestions: sug }
        }
      };

      const resp = await fetch('/api/template-audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        console.error('Failed to save template audit log', err);
        toastError('Template Log Save Failed', err?.error || 'Could not save template audit log');
      } else {
        console.debug('Saved template audit log');
        toastSuccess('Template Audit Updated', 'Template history updated with this analysis.');
      }
    } catch (e) {
      console.error('Error saving template audit log:', e);
    }
  };

  // Save Contract Review analysis to shared audit logs (used by Compliance too)
  const saveContractAuditLog = async (doc: ExtractedDocument, sug: any[]) => {
    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
      const status = doc.overallScore >= 90 ? 'compliant' : doc.overallScore >= 70 ? 'partial' : 'non-compliant';
      const suggestionsText: string[] = (sug || [])
        .map((s: any) => s.suggestedText || s.reasoning || s.originalText || s.description)
        .filter(Boolean);

      const auditLogData = {
        fileName: doc.fileName,
        standards: [selectedTemplate?.name || 'Contract Review'],
        score: doc.overallScore,
        status,
        gapsCount: (doc.gaps || []).length,
        fileSize: uploadedFile?.size || 0,
        analysisMethod: 'contract-review',
        userId: userId || undefined,
        snapshot: {
          gaps: (doc.gaps || []).map(g => ({
            id: g.id,
            title: g.sectionTitle,
            description: g.description,
            priority: (g.severity as any) || 'medium',
            category: selectedTemplate?.name || 'Contract',
            recommendation: g.recommendation || '',
            section: g.sectionTitle,
          })),
          suggestions: suggestionsText,
          fullResult: { document: doc, suggestions: sug }
        }
      };

      const resp = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditLogData)
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        console.error('Failed to save contract audit log', err);
        toastError('Audit Log Save Failed', err?.error || 'Could not save contract audit log');
      } else {
        const json = await resp.json().catch(() => null);
        console.debug('Saved contract review audit log', {
          gaps: auditLogData.snapshot?.gaps?.length || 0,
          suggestions: auditLogData.snapshot?.suggestions?.length || 0,
          id: json?.id
        });
        toastSuccess('Audit Log Saved', 'Contract analysis saved to audit history.');
      }
    } catch (e) {
      console.error('Error saving contract audit log:', e);
    }
  };

  // Server-side text extraction for uploaded files
  const extractFileText = async (file: File): Promise<string> => {
    // Validate file parameter
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

  // Consistent short date formatter e.g., "Sep 10, 2025"
  const formatDateShort = (iso: string | number | Date) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // Compute inline diff HTML between original extracted text and editedText
  const inlineDiffHtml = (original: string, revised: string) => {
    const esc = (s: string) => s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    // Tokenize by words with whitespace preserved
    const origTokens = original.split(/(\s+)/);
    const revTokens = revised.split(/(\s+)/);
    // LCS dynamic programming
    const m = origTokens.length, n = revTokens.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--) {
      for (let j = n - 1; j >= 0; j--) {
        dp[i][j] = origTokens[i] === revTokens[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    // Backtrack to produce diff spans
    let i = 0, j = 0;
    const out: string[] = [];
    while (i < m && j < n) {
      if (origTokens[i] === revTokens[j]) {
        out.push(esc(origTokens[i]));
        i++; j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        // deletion
        const chunk = esc(origTokens[i]);
        if (chunk.trim()) out.push(`<span class="bg-red-200/70 dark:bg-red-800/70 line-through">${chunk}</span>`); else out.push(chunk);
        i++;
      } else {
        // insertion
        const chunk = esc(revTokens[j]);
        if (chunk.trim()) out.push(`<span class="bg-emerald-200/70 dark:bg-emerald-800/70">${chunk}</span>`); else out.push(chunk);
        j++;
      }
    }
    while (i < m) {
      const chunk = esc(origTokens[i++]);
      if (chunk.trim()) out.push(`<span class="bg-red-200/70 dark:bg-red-800/70 line-through">${chunk}</span>`); else out.push(chunk);
    }
    while (j < n) {
      const chunk = esc(revTokens[j++]);
      if (chunk.trim()) out.push(`<span class="bg-emerald-200/70 dark:bg-emerald-800/70">${chunk}</span>`); else out.push(chunk);
    }
    return out.join("");
  };

  // Generate simple drafts for each model by applying gap suggestions differently
  const generateModelDrafts = () => {
    if (!extractedDocument) return;
    const base = extractedDocument.fullText;
    const gaps = extractedDocument.gaps || [];

    const applyGaps = (predicate: (g: DocumentGap) => boolean) => {
      let out = base;
      const applicable = gaps
        .filter(predicate)
        .filter((g) => g.suggestedText)
        .sort((a, b) => (b.startIndex ?? 0) - (a.startIndex ?? 0));
      for (const g of applicable) {
        if ((g.startIndex ?? -1) >= 0 && (g.endIndex ?? -1) >= (g.startIndex ?? 0)) {
          out = out.slice(0, g.startIndex) + (g.suggestedText || "") + out.slice(g.endIndex);
        } else if (g.suggestedText) {
          out = out + (out.endsWith("\n") ? "\n\n" : "\n\n") + g.suggestedText;
        }
      }
      return out;
    };

    const drafts: Record<string, string> = {
      extracted: base,
      chatgpt: applyGaps(() => true),
      claude: applyGaps((g) => g.severity === "critical" || g.gapType === "missing"),
      grok: applyGaps((g) => g.gapType !== "missing"),
    };

    setModelDrafts(drafts);
    setEditorMode("diff");
  };

  // New: custom template upload handler for Knowledge Base Templates mode
  const handleCustomTemplateUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCustomTemplateName(file.name);
    }
  };

  // Drag & Drop handlers for custom template
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setCustomTemplateName(file.name);
    }
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const openFilePicker = () => fileInputRef.current?.click();

  // Fetch audit logs helper and effect on template change
  const reloadTemplateLogs = async () => {
    if (!selectedTemplate) {
      setTemplateLogs([]);
      return;
    }
    setLogsLoading(true);
    setLogsError(null);
    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
      if (!userId) {
        setTemplateLogs([]);
        setLogsError('Sign in required to view audit logs (missing user_id).');
        return;
      }
      const params = new URLSearchParams();
      params.set('templateId', selectedTemplate.id);
      params.set('limit', '20');
      params.set('userId', userId);
      const res = await fetch(`/api/template-audit-logs?${params.toString()}`);
      const data = await res.json();
      if (data?.success) {
        setTemplateLogs(data.logs || []);
      } else {
        setLogsError(data?.error || 'Failed to load logs');
      }
    } catch (err) {
      setLogsError('Failed to load logs');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    reloadTemplateLogs();
  }, [selectedTemplate]);

  // Log template selection event (for history analytics)
  const saveTemplateSelectedLog = async (template: ContractTemplate) => {
    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
      if (!userId) return;
      await fetch('/api/template-audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          templateName: template.name,
          action: 'selected',
          userId
        })
      });
    } catch (e) {
      console.error('Failed to log template selection', e);
    }
  };

  // Cleanup on unmount: clear any pending timers and reset analyzing flag
  useEffect(() => {
    return () => {
      if (analyzeTimerRef.current) {
        clearTimeout(analyzeTimerRef.current);
        analyzeTimerRef.current = null;
      }
    };
  }, []);

  // Clear any ongoing analysis when navigating away from Step 4
  useEffect(() => {
    if (currentStep !== 4) {
      if (analyzeTimerRef.current) {
        clearTimeout(analyzeTimerRef.current);
        analyzeTimerRef.current = null;
      }
      // Always reset analyzing state when leaving Step 4 to prevent stuck UI
      setIsAnalyzing(false);
    }
  }, [currentStep]);


  const contractTypes = [
    // Business Contracts
    { id: "vendor", name: "Vendor Agreement", icon: Building, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
    { id: "partnership", name: "Partnership Agreement", icon: Network, color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
    { id: "consulting", name: "Consulting Agreement", icon: TrendingUp, color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300" },
    { id: "franchise", name: "Franchise Agreement", icon: Crown, color: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300" },
    { id: "joint-venture", name: "Joint Venture Agreement", icon: Handshake, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300" },
    { id: "merger", name: "Merger Agreement", icon: Briefcase, color: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300" },
    { id: "acquisition", name: "Acquisition Agreement", icon: Building, color: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300" },
    { id: "outsourcing", name: "Outsourcing Agreement", icon: Globe, color: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300" },
    { id: "supply-chain", name: "Supply Chain Agreement", icon: Truck, color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300" },
    { id: "manufacturing", name: "Manufacturing Agreement", icon: Factory, color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300" },

    // Legal Contracts
    { id: "employment", name: "Employment Contract", icon: Users, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
    { id: "nda", name: "Non-Disclosure Agreement", icon: Shield, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
    { id: "license", name: "License Agreement", icon: Award, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
    { id: "confidentiality", name: "Confidentiality Agreement", icon: Shield, color: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300" },
    { id: "non-compete", name: "Non-Compete Agreement", icon: Scale, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
    { id: "settlement", name: "Settlement Agreement", icon: Gavel, color: "bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-300" },
    { id: "arbitration", name: "Arbitration Agreement", icon: Scale, color: "bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-300" },
    { id: "power-attorney", name: "Power of Attorney", icon: Gavel, color: "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300" },

    // Property & Real Estate
    { id: "lease", name: "Lease Agreement", icon: Home, color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300" },
    { id: "rental", name: "Rental Agreement", icon: Home, color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300" },
    { id: "property-sale", name: "Property Sale Agreement", icon: Home, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300" },
    { id: "mortgage", name: "Mortgage Agreement", icon: Landmark, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
    { id: "construction", name: "Construction Contract", icon: Hammer, color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
    { id: "maintenance", name: "Maintenance Agreement", icon: Wrench, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },

    // Commercial & Sales
    { id: "service", name: "Service Agreement", icon: Handshake, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
    { id: "purchase", name: "Purchase Agreement", icon: ShoppingCart, color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300" },
    { id: "distribution", name: "Distribution Agreement", icon: Truck, color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300" },
    { id: "sales", name: "Sales Agreement", icon: DollarSign, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
    { id: "subscription", name: "Subscription Agreement", icon: CreditCard, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
    { id: "warranty", name: "Warranty Agreement", icon: Shield, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },

    // Technology & IP
    { id: "software", name: "Software License Agreement", icon: Code, color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300" },
    { id: "saas", name: "SaaS Agreement", icon: Wifi, color: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300" },
    { id: "data-processing", name: "Data Processing Agreement", icon: Database, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
    { id: "hosting", name: "Hosting Agreement", icon: Zap, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
    { id: "development", name: "Development Agreement", icon: Code, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
    { id: "api", name: "API Agreement", icon: Cog, color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300" },

    // Specialized Services
    { id: "healthcare", name: "Healthcare Service Agreement", icon: Heart, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
    { id: "education", name: "Education Service Agreement", icon: GraduationCap, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
    { id: "transportation", name: "Transportation Agreement", icon: Car, color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
    { id: "logistics", name: "Logistics Agreement", icon: Plane, color: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300" },
    { id: "insurance", name: "Insurance Agreement", icon: Shield, color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300" },
    { id: "financial", name: "Financial Services Agreement", icon: PiggyBank, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Clear any existing extracted data when new file is uploaded
      setExtractedDocument(null);
      setEditedText('');
      crStore.setExtractedDocument(null);
      crStore.setSuggestions([]);
      setCurrentStep(3); // Reset to upload step
      
      setUploadedFile(file);
    }
  };

  // Apply suggestion for a single gap into editedText
  const applyGapSuggestion = (gap: DocumentGap) => {
    if (!gap.suggestedText) return;
    if (gap.startIndex >= 0 && gap.endIndex >= gap.startIndex) {
      const before = editedText.substring(0, gap.startIndex);
      const after = editedText.substring(gap.endIndex);
      setEditedText(`${before}${gap.suggestedText}${after}`);
    } else {
      // Missing clause: append to end with spacing
      const sep = editedText.endsWith("\n") ? "\n\n" : "\n\n";
      setEditedText(`${editedText}${sep}${gap.suggestedText}`);
    }
  };

  // Render fullText with gap highlights as HTML for Step 4 preview
  const highlightGaps = (fullText: string, gaps: DocumentGap[]) => {
    const escapeHtml = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

    if (!gaps || gaps.length === 0) {
      return escapeHtml(fullText).replace(/\n/g, "<br/>");
    }

    const sorted = [...gaps]
      .filter(g => g.startIndex >= 0 && g.endIndex >= g.startIndex)
      .sort((a, b) => a.startIndex - b.startIndex);

    let cursor = 0;
    let html = "";
    const safe = escapeHtml(fullText);

    for (const g of sorted) {
      const start = Math.max(0, Math.min(g.startIndex, fullText.length));
      const end = Math.max(start, Math.min(g.endIndex, fullText.length));
      // Append non-highlighted segment
      html += safe.substring(cursor, start).replace(/\n/g, "<br/>");
      // Highlighted segment
      const seg = safe.substring(start, end).replace(/\n/g, "<br/>");
      const sev = g.severity;
      const bg = sev === 'critical' ? 'bg-red-200 dark:bg-red-800' : sev === 'high' ? 'bg-orange-200 dark:bg-orange-800' : sev === 'medium' ? 'bg-amber-200 dark:bg-amber-800' : 'bg-blue-200 dark:bg-blue-800';
      html += `<span class="px-1 rounded ${bg}" title="${escapeHtml(g.sectionTitle)}: ${escapeHtml(g.description)}">${seg}</span>`;
      cursor = end;
    }
    // Append remaining tail
    html += safe.substring(cursor).replace(/\n/g, "<br/>");

    // Append any missing-clause suggestions at the end for visibility
    const missing = gaps.filter(g => g.startIndex < 0 || g.endIndex < 0);
    if (missing.length) {
      html += '<div class="mt-4 p-3 border rounded bg-muted">';
      html += '<div class="font-bold mb-2">Missing Clauses</div>';
      for (const m of missing) {
        const sev = m.severity;
        const color = sev === 'critical' ? 'text-red-700' : sev === 'high' ? 'text-orange-700' : sev === 'medium' ? 'text-amber-700' : 'text-blue-700';
        html += `<div class="text-sm ${color}"><strong>${escapeHtml(m.sectionTitle)}</strong>: ${escapeHtml(m.description)}</div>`;
      }
      html += '</div>';
    }

    return html;
  };

  // Save on Step 4 and generate results -> triggers analyze flow
  const handleSaveDocument = () => {
    if (isAnalyzing) return;
    void handleAnalyze();
  };

  // Apply all suggestions
  const acceptAllSuggestions = () => {
    if (!extractedDocument) return;
    let updated = editedText;
    // Apply in reverse order of startIndex to keep indices valid
    const ordered = [...extractedDocument.gaps].sort((a, b) => (a.startIndex ?? -1) - (b.startIndex ?? -1));
    for (let i = ordered.length - 1; i >= 0; i--) {
      const gap = ordered[i];
      if (!gap.suggestedText) continue;
      if (gap.startIndex >= 0 && gap.endIndex >= gap.startIndex) {
        const before = updated.substring(0, gap.startIndex);
        const after = updated.substring(gap.endIndex);
        updated = `${before}${gap.suggestedText}${after}`;
      } else {
        const sep = updated.endsWith("\n") ? "\n\n" : "\n\n";
        updated = `${updated}${sep}${gap.suggestedText}`;
      }
    }
    setEditedText(updated);
  };

  const handleAssetSelect = (asset: any) => {
    // Convert asset to File-like object for consistency with file upload
    const assetFile = {
      name: asset.name,
      size: asset.size || 0,
      type: asset.type || 'application/pdf',
      lastModified: asset.lastModified || Date.now()
    } as File;
    
    setUploadedFile(assetFile);
    setIsAssetPickerOpen(false);
  };

  const steps = [
    { id: 1, title: "Select Template", description: "Choose a baseline template from knowledge base" },
    { id: 2, title: "Review Template", description: "Review format or provide your own template" },
    { id: 3, title: "Upload Contract", description: "Upload your contract document" },
    { id: 4, title: "Contract Analysis", description: "Review suggested changes by Kroolo AI" },
    { id: 5, title: "Make Corrections", description: "Edit and finalize the document" }
  ];

  const handleTemplateSelect = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    // Log selection and let the effect reload the history
    void saveTemplateSelectedLog(template);
  };

  const handleDocumentExtraction = async () => {
    const hasTemplateContext = templateMode === 'standard'
      ? !!selectedTemplate
      : (!!customTemplateName || !!customTemplateText);
    if (!uploadedFile || !hasTemplateContext) return;
    
    // Clear any existing data and reset error state
    setExtractedDocument(null);
    setEditedText('');
    crStore.setExtractedDocument(null);
    crStore.setSuggestions([]);
    crStore.setError(null);
    
    // Ensure no stale analysis timers are running
    if (analyzeTimerRef.current) {
      clearTimeout(analyzeTimerRef.current);
      analyzeTimerRef.current = null;
    }
    
    setIsAnalyzing(true);
    try {
      // Extract text from uploaded file or use manual input
      let extractedText = '';
      
      // Double-check that uploadedFile is still valid
      if (!uploadedFile) {
        throw new Error('No file selected for analysis');
      }
      
      extractedText = await extractFileText(uploadedFile);
      if (!extractedText.trim()) {
        throw new Error('Could not extract text from the uploaded file. Please try a different PDF or contact support.');
      }

      // Build template clauses for analysis
      const clauses = selectedTemplate?.sections?.map(s => ({
        title: s.title,
        content: s.content || '',
        isRequired: s.isRequired,
        priority: s.priority,
        guidelines: s.guidelines || []
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
        sections: [], // Could be enhanced to detect sections
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
      setEditedText(extractedText);
      setCurrentStep(4);

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

      // Save to audit logs (similar to Compliance)
      await saveContractAuditLog(document, suggestions);
      // Save to template-specific audit logs and refresh sidebar history
      await saveTemplateAuditLog(document, suggestions);
      await reloadTemplateLogs();
    } catch (error) {
      console.error('Document extraction and analysis failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Set error in store instead of alert to prevent async issues
      crStore.setError(`Document processing failed: ${errorMessage}`);
      console.error('Document processing failed:', errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;
    
    setIsAnalyzing(true);
    // Simulate analysis
    if (analyzeTimerRef.current) {
      clearTimeout(analyzeTimerRef.current);
      analyzeTimerRef.current = null;
    }
    analyzeTimerRef.current = window.setTimeout(() => {
      const newReview: ContractReview = {
        id: `rev-${Date.now()}`,
        fileName: uploadedFile!.name,
        contractType: selectedTemplate?.type || 'custom',
        status: "in-review",
        riskLevel: (extractedDocument && extractedDocument.overallScore < 50) ? "high" : "medium",
        score: extractedDocument?.overallScore ?? 45,
        gaps: extractedDocument?.gaps.map(g => g.id) ?? [],
        suggestions: extractedDocument?.gaps.map(g => g.recommendation) ?? [],
        reviewer: "Auto Analyzer",
        uploadDate: new Date().toISOString(),
        reviewDate: new Date().toISOString()
      };

      setReviews(prev => [newReview, ...prev]);
      try {
        // Optional: log analysis event
        void fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'analyze', file: uploadedFile!.name, template: selectedTemplate?.id || 'custom' })
        });
      } catch (_) {
        // ignore logging errors
      }
      setIsAnalyzing(false);
      setCurrentStep(5);
      analyzeTimerRef.current = null;
    }, 3000);
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

  const downloadContract = async () => {
    if (!uploadedFile) return;
    
    try {
      // Create a download link for the original file with track changes
      const blob = new Blob([uploadedFile], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${uploadedFile.name.replace(/\.[^/.]+$/, '')}_tracked.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading contract:', error);
    }
  };

  const viewContractDetails = () => {
    if (!extractedDocument) return;
    
    // Create a detailed view of the contract analysis
    const detailsWindow = window.open('', '_blank', 'width=800,height=600');
    if (detailsWindow) {
      detailsWindow.document.write(`
        <html>
          <head>
            <title>Contract Analysis Details</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { color: #dc2626; font-size: 24px; margin-bottom: 20px; }
              .section { margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
              .critical { border-left: 4px solid #dc2626; }
              .high { border-left: 4px solid #f59e0b; }
              .medium { border-left: 4px solid #3b82f6; }
              .low { border-left: 4px solid #10b981; }
            </style>
          </head>
          <body>
            <div class="header">Contract Analysis Details</div>
            <div class="section">
              <h3>Overall Score: ${extractedDocument.overallScore}%</h3>
              <p>File: ${uploadedFile?.name}</p>
              <p>Analysis Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
            </div>
            <div class="section">
              <h3>Issues Found (${extractedDocument.gaps.length})</h3>
              ${extractedDocument.gaps.map(gap => `
                <div class="section ${gap.severity}">
                  <h4>${gap.sectionTitle}</h4>
                  <p><strong>Severity:</strong> ${gap.severity}</p>
                  <p><strong>Description:</strong> ${gap.description}</p>
                  <p><strong>Recommendation:</strong> ${gap.recommendation}</p>
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `);
      detailsWindow.document.close();
    }
  };

  const exportContractReport = async (format: 'text' | 'pdf' = 'text') => {
    if (!extractedDocument || !uploadedFile) return;
    
    try {
      // Generate a comprehensive text report
      const analysisDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const criticalIssues = extractedDocument.gaps.filter(g => g.severity === 'critical').length;
      const highIssues = extractedDocument.gaps.filter(g => g.severity === 'high').length;
      const mediumIssues = extractedDocument.gaps.filter(g => g.severity === 'medium').length;
      const lowIssues = extractedDocument.gaps.filter(g => g.severity === 'low').length;

      const reportText = `CONTRACT REVIEW ANALYSIS REPORT
===============================

Document Information:
- File Name: ${uploadedFile.name}
- Analysis Date: ${analysisDate}
- Template Used: ${selectedTemplate?.name || 'Custom Analysis'}
- Overall Score: ${extractedDocument.overallScore}%

Summary:
- Total Issues Found: ${extractedDocument.gaps.length}
- Critical Issues: ${criticalIssues}
- High Priority Issues: ${highIssues}
- Medium Priority Issues: ${mediumIssues}
- Low Priority Issues: ${lowIssues}

DETAILED FINDINGS:
==================

${extractedDocument.gaps.map((gap, index) => `
${index + 1}. ${gap.sectionTitle}
   Severity: ${gap.severity.toUpperCase()}
   Type: ${gap.gapType}
   
   Issue Description:
   ${gap.description}
   
   Recommendation:
   ${gap.recommendation}
   
   ${gap.originalText ? `Original Text: "${gap.originalText}"` : ''}
   ${gap.suggestedText ? `Suggested Text: "${gap.suggestedText}"` : ''}
   
   ---
`).join('')}

DOCUMENT SECTIONS ANALYZED:
===========================

${extractedDocument.sections.map((section, index) => `
${index + 1}. ${section.title}
   Status: ${section.hasGaps ? `${section.gapIds.length} issue(s) found` : 'No issues found'}
   Content Preview: ${section.content.substring(0, 200)}${section.content.length > 200 ? '...' : ''}
   
`).join('')}

END OF REPORT
=============

Generated by Poligap AI Contract Review System
Report ID: ${Date.now()}
`;

      if (format === 'pdf') {
        // Generate PDF using browser's print functionality
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Contract Analysis Report</title>
                <style>
                  body { 
                    font-family: 'Courier New', monospace; 
                    line-height: 1.6; 
                    margin: 40px; 
                    color: #333;
                  }
                  h1 { 
                    color: #2563eb; 
                    border-bottom: 2px solid #2563eb; 
                    padding-bottom: 10px; 
                  }
                  h2 { 
                    color: #1e40af; 
                    margin-top: 30px; 
                  }
                  .severity-critical { color: #dc2626; font-weight: bold; }
                  .severity-high { color: #ea580c; font-weight: bold; }
                  .severity-medium { color: #d97706; font-weight: bold; }
                  .severity-low { color: #2563eb; font-weight: bold; }
                  .issue-block { 
                    margin: 20px 0; 
                    padding: 15px; 
                    border-left: 4px solid #e5e7eb; 
                    background-color: #f9fafb; 
                  }
                  .original-text { 
                    background-color: #fef2f2; 
                    padding: 10px; 
                    border-radius: 4px; 
                    margin: 10px 0; 
                  }
                  .suggested-text { 
                    background-color: #f0fdf4; 
                    padding: 10px; 
                    border-radius: 4px; 
                    margin: 10px 0; 
                  }
                  @media print {
                    body { margin: 20px; }
                    .issue-block { break-inside: avoid; }
                  }
                </style>
              </head>
              <body>
                <pre style="white-space: pre-wrap;">${reportText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                <script>
                  window.onload = function() {
                    setTimeout(function() {
                      window.print();
                      window.close();
                    }, 1000);
                  }
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
        toastSuccess('PDF Generated', 'Contract analysis report opened for printing/saving as PDF.');
      } else {
        // Create and download text report
        const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${uploadedFile.name.replace(/\.[^/.]+$/, '')}_analysis_report.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toastSuccess('Report Downloaded', 'Contract analysis report downloaded as text file.');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toastError('Export Failed', 'Failed to export contract analysis report.');
    }
  };

  const analyzeNewContract = () => {
    // Reset the entire analysis process
    setCurrentStep(1);
    setReviews([]);
    setSelectedContractTypes([]);
    setUploadedFile(null);
    setExtractedDocument(null);
    setSelectedTemplate(null);
    setIsAnalyzing(false);
  };

  const handleContractTypeToggle = (typeId: string) => {
    setSelectedContractTypes(prev => {
      if (prev.includes(typeId)) {
        return prev.filter(id => id !== typeId);
      } else {
        return [...prev, typeId];
      }
    });
  };

  const filterCategories = [
    { id: "all", name: "All Categories" },
    { id: "business", name: "Business" },
    { id: "legal", name: "Legal" },
    { id: "property", name: "Property & Real Estate" },
    { id: "commercial", name: "Commercial & Sales" },
    { id: "technology", name: "Technology & IP" },
    { id: "specialized", name: "Specialized Services" }
  ];

  const getContractCategory = (contractId: string) => {
    const businessTypes = ["vendor", "partnership", "consulting", "franchise", "joint-venture", "merger", "acquisition", "outsourcing", "supply-chain", "manufacturing"];
    const legalTypes = ["employment", "nda", "license", "confidentiality", "non-compete", "settlement", "arbitration", "power-attorney"];
    const propertyTypes = ["lease", "rental", "property-sale", "mortgage", "construction", "maintenance"];
    const commercialTypes = ["service", "purchase", "distribution", "sales", "subscription", "warranty"];
    const technologyTypes = ["software", "saas", "data-processing", "hosting", "development", "api"];
    const specializedTypes = ["healthcare", "education", "transportation", "logistics", "insurance", "financial"];

    if (businessTypes.includes(contractId)) return "business";
    if (legalTypes.includes(contractId)) return "legal";
    if (propertyTypes.includes(contractId)) return "property";
    if (commercialTypes.includes(contractId)) return "commercial";
    if (technologyTypes.includes(contractId)) return "technology";
    if (specializedTypes.includes(contractId)) return "specialized";
    return "business";
  };

  const filteredContractTypes = contractTypes.filter(type => {
    const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === "all" || getContractCategory(type.id) === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const canProceedToStep2 = !!selectedTemplate || selectedContractTypes.length > 0;
  // From new Step 2 -> Step 3
  const canProceedToStep3 = templateMode === 'standard' ? !!selectedTemplate : (!!customTemplateName || !!customTemplateText);
  // From Step 3 -> Step 4 (must have a document uploaded)
  const canProceedToStep4 = uploadedFile !== null;
  const canAnalyze = (templateMode === 'standard' ? !!selectedTemplate : (!!customTemplateName || !!customTemplateText)) && uploadedFile !== null;
  const canExtract = (templateMode === 'standard' ? !!selectedTemplate : (!!customTemplateName || !!customTemplateText)) && uploadedFile !== null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "in-review": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "requires-attention": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "in-review": return <Clock className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "requires-attention": return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          <FileText className="h-8 w-8" />
          Contract Review
        </h1>
        <p className="text-muted-foreground">
          Upload contracts and get AI-powered analysis against reference templates
        </p>
      </div>

      {/* Stepper Indicator */}
      <div className="flex items-center justify-center space-x-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${currentStep >= step.id
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-muted-foreground text-muted-foreground'
              }`}>
              {currentStep > step.id ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">{step.id}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 transition-all ${currentStep > step.id ? 'bg-primary' : 'bg-muted-foreground/30'
                }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">{steps[currentStep - 1]?.title}</h2>
        <p className="text-muted-foreground text-lg">{steps[currentStep - 1]?.description}</p>
      </div>

      {/* Step Content */}
      <Card className="min-h-[600px]">
        <CardContent className="p-10">
          {/* In-box navigation (top of panel) - hidden on step 4 to avoid duplicate Previous */}
          {currentStep !== 4 && (
          <div className="flex items-center justify-between -mt-4 mb-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-3"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            {currentStep < 5 && (
              <Button
                onClick={nextStep}
                disabled={
                  (currentStep === 1 && !canProceedToStep2) ||
                  (currentStep === 2 && !canProceedToStep3) ||
                  (currentStep === 3 && !canProceedToStep4) ||
                  (currentStep === 4 && !extractedDocument)
                }
                className="px-3"
              >
                {currentStep === 4 ? 'Proceed to Download' : 'Next'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {currentStep === 5 && (
              <div className="flex gap-2">
                <Button
                  onClick={analyzeNewContract}
                  variant="outline"
                  className="px-4"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Analyze New Contract
                </Button>
                <Button
                  onClick={() => exportContractReport('text')}
                  disabled={!extractedDocument || !uploadedFile}
                  className="px-4"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report (Text)
                </Button>
                <Button
                  onClick={() => exportContractReport('pdf')}
                  disabled={!extractedDocument || !uploadedFile}
                  className="px-4 bg-red-600 hover:bg-red-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report (PDF)
                </Button>
                <Button
                  onClick={downloadContract}
                  disabled={!uploadedFile}
                  className="px-4 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete & Download
                </Button>
              </div>
            )}
          </div>
          )}

          {/* Step 1: Select Template from Knowledge Base */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <Library className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Contract Templates</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Select a baseline template that has been reviewed and approved by legal experts. 
                  Your uploaded contract will be compared against this template to identify gaps and weaknesses.
                </p>
                <div className="mt-4 max-w-md mx-auto">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search template"
                  />
                </div>
              </div>

              <div className="relative">
                {(() => {
                  const filteredTemplates = knowledgeBaseTemplates.filter(t =>
                    t.name.toLowerCase().includes(searchTerm.toLowerCase())
                  );
                  return (
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-muted-foreground">{filteredTemplates.length} templates</div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => scrollTemplates('left')} aria-label="Scroll left">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => scrollTemplates('right')} aria-label="Scroll right">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })()}
                

                <div
                  ref={templatesContainerRef}
                  className="overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  <div className="flex gap-4 pr-2">
                    {knowledgeBaseTemplates
                      .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((template) => {
                      const selected = selectedTemplate?.id === template.id;
                      const dimNonSelected = !!selectedTemplate && !selected;
                      return (
                        <Card
                          key={template.id}
                          className={`min-w-[300px] max-w-[300px] cursor-pointer transition-all border-2 ${
                            selected ? 'border-primary bg-primary/5 shadow-lg' : 'border-muted hover:border-primary/50'
                          } ${dimNonSelected ? 'opacity-80' : ''}`}
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <BookOpen className="h-8 w-8 text-primary" />
                              {template.isBaseline && (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                  <Award className="h-3 w-3 mr-1" />
                                  Baseline
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg truncate" title={template.name}>{template.name}</CardTitle>
                            <CardDescription className="overflow-hidden text-ellipsis whitespace-nowrap" title={template.description}>{template.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="text-sm text-muted-foreground">
                                <strong>Sections:</strong> {template.sections.length}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <strong>Sources:</strong> {template.sources.join(', ')}
                              </div>
                              {template.sections.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {template.sections.slice(0, 3).map((section) => (
                                    <Badge key={section.id} variant="outline" className="text-xs">
                                      {section.title}
                                    </Badge>
                                  ))}
                                  {template.sections.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{template.sections.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>

              {selectedTemplate && (
                <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                      <Info className="h-5 w-5" />
                      Selected Template: {selectedTemplate.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Required Sections:</h4>
                        <ul className="space-y-1">
                          {selectedTemplate.sections.filter(s => s.isRequired).map((section) => (
                            <li key={section.id} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>{section.title}</span>
                              <Badge className={`text-xs ${
                                section.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                section.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                              }`}>
                                {section.priority}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">What We'll Check:</h4>
                        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                          <li>• Missing required sections</li>
                          <li>• Weak or incomplete clauses</li>
                          <li>• Non-compliant language</li>
                          <li>• Risk exposure areas</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedTemplate && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Audit Logs
                    </CardTitle>
                    <CardDescription>
                      Recent activity for template "{selectedTemplate.name}"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {logsLoading && (
                      <div className="text-sm text-muted-foreground">Loading logs…</div>
                    )}
                    {!logsLoading && logsError && (
                      <div className="text-sm text-red-600 dark:text-red-400">{logsError}</div>
                    )}
                    {!logsLoading && !logsError && templateLogs.filter(l => l.action !== 'selected').length === 0 && (
                      <div className="text-sm text-muted-foreground">No logs yet for this template.</div>
                    )}
                    {!logsLoading && !logsError && templateLogs.filter(l => l.action !== 'selected').length > 0 && (
                      <div className="space-y-3">
                        {templateLogs.filter(l => l.action !== 'selected').map((log) => (
                          <div
                            key={log._id}
                            className="flex items-center justify-between border rounded-md p-3 bg-muted/40 dark:bg-muted/30 hover:bg-muted/60 transition-colors border-border dark:border-slate-700"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {log.status ? `Result: ${log.status}` : (log.action === 'analyzed' ? 'Analysis completed' : 'Event')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(log.analysisDate).toLocaleString()} {log.fileName ? `• ${log.fileName}` : ''}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {typeof log.score === 'number' && (
                                <Badge variant="outline" className="text-xs border-primary/40 text-primary">Score: {log.score}</Badge>
                              )}
                              {typeof log.gapsCount === 'number' && (
                                <Badge variant="outline" className="text-xs border-blue-400/40 text-blue-700 dark:text-blue-300">Gaps: {log.gapsCount}</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Template Boilerplate or Custom Template */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <Card>
                <CardContent>
                  {/* Mode toggle centered */}
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <Button
                      variant={templateMode === 'standard' ? 'default' : 'outline'}
                      onClick={() => {
                        setTemplateMode('standard');
                      }}
                    >
                      Use Contract Template
                    </Button>
                    <Button
                      variant={templateMode !== 'standard' ? 'default' : 'outline'}
                      onClick={() => {
                        setTemplateMode('knowledge');
                      }}
                    >
                      Upload Custom Template
                    </Button>
                  </div>
                  {templateMode === 'standard' ? (
                    <div className="space-y-6">
                      {selectedTemplate ? (
                        <>
                            <h4 className="text-base font-semibold mb-2">Key sections that will be checked</h4>
                            <ul className="space-y-2 text-sm">
                              {selectedTemplate.sections.slice(0, 6).map((s) => (
                                <li key={s.id} className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span>{s.title}</span>
                                  <Badge variant="outline" className="ml-auto text-xs">{s.priority}</Badge>
                                </li>
                              ))}
                              {selectedTemplate.sections.length > 6 && (
                                <li className="text-muted-foreground">+{selectedTemplate.sections.length - 6} more…</li>
                              )}
                            </ul>

                          {/* Brief template format preview */}
                          <div className="space-y-2">
                            <h4 className="text-base font-semibold">Template format preview (brief)</h4>
                            <div className="prose dark:prose-invert max-w-none border rounded-md p-4 text-sm">
                              {selectedTemplate.sections.slice(0, 3).map((s) => {
                                const sec: any = s as any;
                                const preview = sec?.snippet ?? sec?.content ?? '';
                                return (
                                <div key={s.id} className="mb-3">
                                  <div className="font-semibold">{s.title}</div>
                                  <div className="text-muted-foreground">{preview || '—'}</div>
                                </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Sources */}
                          {(() => {
                            const sources = (selectedTemplate as any)?.sources as string[] | undefined;
                            return sources && sources.length > 0;
                          })() && (
                            <div className="space-y-2">
                              <h4 className="text-base font-semibold">Sources</h4>
                              <div className="flex flex-wrap gap-2">
                                {((selectedTemplate as any)?.sources as string[]).map((src) => (
                                  <Badge key={src} variant="outline">{src}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">No template selected. Go back to Step 1 to choose a template.</div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">Provide a custom template</div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsNotepadOpen(true)}
                                className="gap-2"
                                aria-label="Open Notepad"
                              >
                                <NotebookPen className="h-4 w-4" /> Notepad
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Paste your own template
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {/* Animated Dropzone */}
                      <div
                        onClick={openFilePicker}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        className={`group relative w-full rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${isDragging ? 'border-primary bg-primary/5 shadow-lg' : 'border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/30'} ${customTemplateName ? 'border-green-500/60 bg-green-50 dark:bg-green-950/20' : ''}`}
                      >
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className={`rounded-full p-3 ${isDragging ? 'bg-primary/10' : 'bg-muted'} transition-colors`}>
                            <FileUp className={`h-6 w-6 ${isDragging ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Drag & drop</span> your template here
                            <span className="text-muted-foreground"> or click to browse</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Accepted: .pdf, .doc, .docx, .txt</div>
                          {(customTemplateName || customTemplateText) && (
                            <div className="mt-2 text-sm">
                              {customTemplateName ? (
                                <>Selected file: <span className="font-medium">{customTemplateName}</span></>
                              ) : (
                                <span className="font-medium text-emerald-600">Typed template provided</span>
                              )}
                            </div>
                          )}
                        </div>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          className="hidden"
                          onChange={handleCustomTemplateUpload}
                        />
                      </div>

                      {/* Notepad Modal */}
                      {isNotepadOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                          <div className="absolute inset-0 bg-black/50" onClick={() => setIsNotepadOpen(false)} />
                          <div className="relative z-10 w-full max-w-3xl">
                            <Card className="shadow-xl bg-white dark:bg-neutral-900">
                              <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                  <CardTitle>Custom Template Notepad</CardTitle>
                                  <CardDescription>Paste or type your template text</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsNotepadOpen(false)}>
                                  <X className="h-5 w-5" />
                                </Button>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <Textarea
                                  value={customTemplateText}
                                  onChange={(e) => setCustomTemplateText(e.target.value)}
                                  placeholder="e.g., Parties, Scope, Payment Terms, Termination..."
                                  className="min-h-[280px] font-mono text-sm"
                                />
                                <div className="flex items-center justify-between">
                                  <div className="text-xs text-muted-foreground">Tip: You can provide headings and clauses in your preferred format.</div>
                                  <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setCustomTemplateText("")}>Clear</Button>
                                    <Button onClick={() => setIsNotepadOpen(false)}>
                                      <Save className="h-4 w-4 mr-2" /> Save
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Upload Contract */}
          {currentStep === 3 && (
            <div className="space-y-8">
              {/* Upload Options */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload from Device</CardTitle>
                    <CardDescription>Upload a contract document from your computer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-8">
                      <div className="text-center">
                        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                        <Input key={deviceInputKey} ref={deviceFileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} />
                        {uploadedFile && (
                          <div className="mt-2 flex items-center justify-center gap-2 text-sm">
                            <span className="text-muted-foreground truncate max-w-[260px]" title={uploadedFile.name}>
                              Selected: {uploadedFile.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Remove file"
                              onClick={() => {
                                setUploadedFile(null);
                                setExtractedDocument(null);
                                setEditedText('');
                                crStore.setExtractedDocument(null);
                                crStore.setSuggestions([]);
                                if (deviceFileInputRef.current) {
                                  deviceFileInputRef.current.value = "";
                                }
                                // re-mount the <input type="file"> so the browser does not show the old filename
                                setDeviceInputKey((k) => k + 1);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Use Existing Asset</CardTitle>
                    <CardDescription>Select a file from your assets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-8">
                      <div className="text-center">
                        <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                        <Button variant="secondary" onClick={() => setIsAssetPickerOpen(true)}>
                          Open Collections
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Analysis Configuration */}
              {uploadedFile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Rules</CardTitle>
                    <CardDescription>Configure how your contract will be analyzed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Rules</div>
                        <div className="text-sm text-muted-foreground">Use your custom company rules during analysis</div>
                      </div>
                      <Switch checked={applyRuleBase} onCheckedChange={setApplyRuleBase} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Upload Tips */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Tip</AlertTitle>
                <AlertDescription>
                  For best results, upload clear, text-based documents. Scanned PDFs may require OCR.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 4: Canvas Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Top inline controls */}
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <div className="flex gap-2">
                  {!extractedDocument && (
                    <Button
                      onClick={handleDocumentExtraction}
                      disabled={!uploadedFile || isAnalyzing || !(templateMode === 'standard' ? !!selectedTemplate : (!!customTemplateName || !!customTemplateText))}
                      className="flex items-center gap-2"
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
                    </Button>
                  )}
                  {extractedDocument && (
                    <Button
                      onClick={nextStep}
                      className="flex items-center gap-2"
                    >
                      Proceed to Download
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Reviewer notes textarea before analysis */}
              {!extractedDocument && (
                <Textarea
                  placeholder="Any final instructions for contract review.."
                  value={finalInstructions}
                  onChange={(e) => setFinalInstructions(e.target.value)}
                  className="min-h-[120px]"
                />
              )}

              {/* Canvas after analysis */}
              {extractedDocument && <ContractCanvas />}
            </div>
          )}

          {/* Step 5: Results */}
          {currentStep === 5 && (
            <div className="space-y-6">
              {/* Step 5 Subtitle under main title */}
              <div className="text-center -mt-4">
                <p className="text-sm text-muted-foreground">
                  Contract Assessment — Based on the conducted analysis and review
                </p>
              </div>
              {/* Completion Status Banner */}
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800 dark:text-green-200">Analysis Complete!</h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your contract has been successfully analyzed. Review the results below and use the action buttons to proceed.
                    </p>
                  </div>
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

                      {/* Issues and Suggestions stacked vertically */}
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
        </CardContent>
      </Card>

      {/* Bottom navigation removed: controls are now at top of the panel */}

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

"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
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
import { useUserStore } from "@/stores/user-store";
import { useAuditLogsStore } from "@/stores/audit-logs-store";

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
  // User store for userId
  const { userData } = useUserStore();
  
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
  
  // Use Zustand store for audit logs
  const { logs: allAuditLogs, isLoading: logsLoading, fetchLogs: fetchAuditLogs, addLog } = useAuditLogsStore();
  const [logsError, setLogsError] = useState<string | null>(null);
  
  // Filter template logs based on selected template
  const templateLogs = useMemo(() => {
    if (!selectedTemplate?.id) return [];
    // Filter logs that match the selected template
    return allAuditLogs.filter(log => 
      (log as any).templateId === selectedTemplate.id
    ).slice(0, 20);
  }, [allAuditLogs, selectedTemplate]);
  
  const templatesContainerRef = useRef<HTMLDivElement>(null);
  // Track any ongoing analysis timer to allow cleanup/cancel
  const analyzeTimerRef = useRef<number | null>(null);
  
  // Helper to get userId with fallbacks
  const getUserId = (): string | null => {
    if (userData?.userId) return userData.userId;
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('user_id');
      if (storedId) return storedId;
    }
    return process.env.NEXT_PUBLIC_FALLBACK_USER_ID || null;
  };

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
      
      const userId = getUserId();
      if (!userId) {
        console.warn('Cannot save template audit log: userId is not available');
        toastError('Save Failed', 'User ID is required to save template audit log');
        return;
      }
      
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
        userId,
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
        const json = await resp.json().catch(() => null);
        console.debug('Saved template audit log');
        toastSuccess('Template Audit Updated', 'Template history updated with this analysis.');
        
        // Add to store for instant UI update
        if (json?.log) {
          addLog(json.log);
        }
      }
    } catch (e) {
      console.error('Error saving template audit log:', e);
    }
  };

  // Save Contract Review analysis to shared audit logs (used by Compliance too)
  const saveContractAuditLog = async (doc: ExtractedDocument, sug: any[]) => {
    try {
      const userId = getUserId();
      if (!userId) {
        console.warn('Cannot save audit log: userId is not available');
        toastError('Save Failed', 'User ID is required to save audit log');
        return;
      }
      
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
        userId,
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
        
        // Add to store for instant UI update
        if (json?.log) {
          addLog(json.log);
        }
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

  // Fetch audit logs from store when component mounts or template changes
  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      setLogsError('Sign in required to view audit logs (missing user_id).');
      return;
    }
    setLogsError(null);
    fetchAuditLogs(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleAssetSelect = async (assets: any[]) => {
    if (!assets || assets.length === 0) {
      console.warn('No assets selected');
      return;
    }

    const asset = assets[0]; // Get first asset (single selection)
    console.log('📥 Asset selected:', asset.originalName, asset.url);
    
    try {
      // Fetch the actual file from Supabase Storage URL
      const response = await fetch(asset.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch asset: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create a proper File object from the blob
      const file = new File([blob], asset.originalName || asset.filename, {
        type: asset.mimetype || blob.type || 'application/pdf',
        lastModified: new Date(asset.uploadDate).getTime()
      });
      
      console.log('✅ File created from asset:', file.name, file.type, file.size);
      setUploadedFile(file);
      setIsAssetPickerOpen(false);
    } catch (error) {
      console.error('❌ Error loading asset:', error);
      toastError('Asset Load Failed', error instanceof Error ? error.message : 'Failed to load selected asset');
    }
  };

  const steps = [
    { id: 1, title: "Select Template", description: "Choose a baseline template from knowledge base" },
    { id: 2, title: "Review Template", description: "Review format or provide your own template" },
    { id: 3, title: "Upload Contract", description: "Upload your contract document" },
    { id: 4, title: "Contract Analysis", description: "Review suggested changes by Kroolo AI" },
    { id: 5, title: "Make Corrections", description: "Edit and finalize the document" }
  ];

  const handleTemplateSelect = (template: ContractTemplate) => {
    // Toggle selection: clicking the same tile again will deselect and hide sidebar
    if (selectedTemplate?.id === template.id) {
      setSelectedTemplate(null);
      return;
    }
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
      // Save to template-specific audit logs (store will be updated via addLog)
      await saveTemplateAuditLog(document, suggestions);
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
    <div className="w-full h-screen bg-[#FAFAFB] dark:bg-gray-900 overflow-hidden flex flex-col">
      {/* Top Header Section - matches Figma */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
            <Shield className="h-5 w-5 text-[#3B43D6]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[#2D2F34] dark:text-gray-100">Contract Review</h1>
            <p className="text-[11px] text-[#6A707C] dark:text-gray-400 mt-0.5 leading-tight">
              Upload contracts and get AI-powered analysis against reference templates
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator and Title Section - matches Figma */}
      <div className="px-6 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#2D2F34] dark:text-gray-100">
              {currentStep === 1 ? "Choose a baseline template from knowledge base" : steps[currentStep - 1]?.title}
            </h2>
            <p className="text-[11px] text-[#6A707C] dark:text-gray-400 mt-0.5">
              {currentStep === 1 ? "40 templates" : steps[currentStep - 1]?.description}
            </p>
          </div>
          
          {/* Stepper */}
          <div className="flex items-center gap-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-9 h-9 rounded-full transition-all ${
                  currentStep >= step.id
                    ? 'bg-[#3B43D6] text-white'
                    : 'bg-white dark:bg-gray-800 border border-[#D9D9D9] dark:border-gray-600 text-[#717171] dark:text-gray-400'
                }`}>
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
                  className="h-8 text-xs pl-8 bg-white dark:bg-gray-800 border-[#E4E4E4] dark:border-gray-600 rounded-[5px] select-text text-[#717171] dark:text-gray-100 placeholder:text-[#8D8D8D] dark:placeholder:text-gray-400"
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
                  <p className="text-[11px] text-[#6A707C] dark:text-gray-400 leading-[14px]">
                    Select a baseline template that has been reviewed and approved by legal experts. Your uploaded contract will be compared against this template to identify gaps and weaknesses.
                  </p>
                </div>
                
                {/* Template Cards Grid */}
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <div className={`grid ${selectedTemplate ? 'grid-cols-3' : 'grid-cols-4'} gap-4 p-1`}>
                    {knowledgeBaseTemplates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map((template) => {
                      const isSelected = selectedTemplate?.id === template.id;
                      return (
                        <div
                          key={template.id}
                          onClick={() => handleTemplateSelect(template)}
                          className={`bg-white dark:bg-gray-800 rounded-[8px] shadow-sm cursor-pointer transition-all hover:shadow-md ${
                            isSelected ? 'ring-2 ring-[#3B43D6] shadow-md' : 'border border-gray-100 dark:border-gray-700 hover:border-[#3B43D6]/50'
                          }`}
                        >
                          <div className="p-3">
                            <div className="flex items-start justify-between mb-2.5">
                              <div className="w-10 h-10 rounded-full bg-[#EFF1F6] dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <BookOpen className="h-5 w-5 text-[#3B43D6]" />
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="bg-[#EDFFDE] dark:bg-green-900/30 rounded-full px-2 py-0.5 flex items-center gap-1">
                                  <Award className="h-2.5 w-2.5 text-[#47AF47]" />
                                  <span className="text-[9px] font-medium text-[#47AF47]">Baseline</span>
                                </div>
                                <CheckCircle className="h-4 w-4 text-[#DADADA] dark:text-gray-600" />
                              </div>
                            </div>
                            
                            <div className="mb-2.5">
                              <h4 className="text-sm font-semibold text-[#2D2F34] dark:text-gray-100 mb-1 leading-tight line-clamp-2">{template.name}</h4>
                              <p className="text-[10px] text-[#6A707C] dark:text-gray-400 leading-tight line-clamp-2">{template.description}</p>
                            </div>
                            
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-semibold text-[#2D2F34] dark:text-gray-300">
                                Sections: {template.sections}
                              </div>
                              <div className="text-[10px] font-semibold text-[#2D2F34] dark:text-gray-300 truncate">
                                Sources: {template.sources.join(", ")}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                <div className="bg-[#EFF1F6] dark:bg-gray-700 rounded-full px-2 py-0.5">
                                  <span className="text-[9px] font-medium text-[#2D2F34] dark:text-gray-300">Parties</span>
                                </div>
                                <div className="bg-[#EFF1F6] dark:bg-gray-700 rounded-full px-2 py-0.5">
                                  <span className="text-[9px] font-medium text-[#2D2F34] dark:text-gray-300">+{template.requiredSections.length - 1} more</span>
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
                        {selectedTemplate.requiredSections.slice(0, 5).map((section, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-[#47AF47] flex-shrink-0" />
                            <span className="text-xs font-medium text-[#2D2F34] dark:text-gray-300 flex-1 leading-tight">{section.title}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium whitespace-nowrap ${
                              section.priority === 'critical' ? 'bg-[#EDDBDB] text-[#BA0003]' :
                              section.priority === 'high' ? 'bg-[#FFE7E0] text-[#E55400]' :
                              section.priority === 'medium' ? 'bg-[#FFF8CB] text-[#BF6D0A]' :
                              'bg-[#E8E9FF] text-[#6E72FF]'
                            }`}>
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
                        <p className="text-[10px] text-[#6A707C] dark:text-gray-400 leading-tight">Recent activity for template</p>
                      </div>
                    </div>
                    
                    {logsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <p className="text-[10px] text-center text-[#6A707C] dark:text-gray-400">Loading logs...</p>
                      </div>
                    ) : templateLogs.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <p className="text-[10px] text-center text-[#6A707C] dark:text-gray-400">No logs yet for this template.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                        {templateLogs.map((log: any, idx: number) => (
                          <div key={idx} className="pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-[11px] font-medium text-[#2D2F34] dark:text-gray-100 line-clamp-2">
                                {log.action || 'Contract Review'}
                              </p>
                              <span className="text-[9px] text-[#6A707C] dark:text-gray-400 whitespace-nowrap">
                                {new Date(log.timestamp || log.createdAt).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#6A707C] dark:text-gray-400 line-clamp-2 mb-1">
                              {log.details || log.description || 'Contract analysis completed'}
                            </p>
                            {log.userName && (
                              <p className="text-[9px] text-[#8D8D8D] dark:text-gray-500">
                                By: {log.userName}
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
            {/* Step 1 Footer Navigation (sticky bottom-right) */}
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


        {/* Steps 2-5: Use Card Layout */}
        {currentStep >= 2 && (
          <Card className="flex-1 overflow-auto">
            <CardContent className="p-10">
              {/* Step 2: Template Boilerplate or Custom Template */}
              {currentStep === 2 && (
                <div className="space-y-8">
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Left: Selected Template details */}
                          <div className="bg-card dark:bg-card rounded-[10px] border border-border dark:border-border p-5">
                            <h4 className="text-sm font-semibold text-foreground dark:text-foreground mb-4 leading-tight">
                              Selected Template: {selectedTemplate.name}
                            </h4>
                            <div className="mb-3">
                              <h5 className="text-xs font-semibold text-foreground dark:text-foreground mb-2">Required Sections:</h5>
                              <div className="space-y-2.5">
                                {selectedTemplate.requiredSections.slice(0, 5).map((section, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-[#47AF47] flex-shrink-0" />
                                    <span className="text-xs font-medium text-foreground dark:text-foreground flex-1 leading-tight">{section.title}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium whitespace-nowrap ${
                                      section.priority === 'critical' ? 'bg-[#EDDBDB] text-[#BA0003]' :
                                      section.priority === 'high' ? 'bg-[#FFE7E0] text-[#E55400]' :
                                      section.priority === 'medium' ? 'bg-[#FFF8CB] text-[#BF6D0A]' :
                                      'bg-[#E8E9FF] text-[#6E72FF]'
                                    }`}>
                                      {section.priority.charAt(0).toUpperCase() + section.priority.slice(1)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Center: Template format preview (brief) */}
                          <div className="bg-card dark:bg-card rounded-[10px] border border-border dark:border-border p-5">
                            <h4 className="text-sm font-semibold text-foreground dark:text-foreground mb-4 leading-tight">Template format preview (brief)</h4>
                            <div className="space-y-4 text-sm">
                              <div>
                                <div className="font-semibold text-foreground dark:text-foreground mb-1">Parties</div>
                                <div className="text-[13px] text-muted-foreground dark:text-muted-foreground">This Agreement is entered between [Company Name] and [Service Provider].</div>
                              </div>
                              <div>
                                <div className="font-semibold text-foreground dark:text-foreground mb-1">Scope of Services</div>
                                <div className="text-[13px] text-muted-foreground dark:text-muted-foreground">Detailed description of services to be provided.</div>
                              </div>
                              <div>
                                <div className="font-semibold text-foreground dark:text-foreground mb-1">Payment Terms</div>
                                <div className="text-[13px] text-muted-foreground dark:text-muted-foreground">Payment schedules, amounts, and terms.</div>
                              </div>
                            </div>
                          </div>

                          {/* Right: Sources */}
                          <div className="bg-card dark:bg-card rounded-[10px] border border-border dark:border-border p-5">
                            <h4 className="text-sm font-semibold text-foreground dark:text-foreground mb-4 leading-tight">Sources</h4>
                            {Array.isArray((selectedTemplate as any)?.sources) && (selectedTemplate as any).sources.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {((selectedTemplate as any).sources as string[]).map((src) => (
                                  <Badge key={src} variant="outline">{src}</Badge>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-[180px] gap-3 text-center">
                                <svg width="120" height="60" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                                  <rect x="10" y="20" width="70" height="30" rx="6" fill="#EAEAFB" />
                                  <rect x="120" y="15" width="68" height="35" rx="8" fill="#D9D8FF" />
                                  <circle cx="55" cy="70" r="4" fill="#C8C6FF" />
                                  <circle cx="150" cy="75" r="4" fill="#BDBBFF" />
                                </svg>
                                <div className="text-xs text-muted-foreground dark:text-muted-foreground">No sources available.</div>
                              </div>
                            )}
                          </div>
                        </div>
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
                            <span
                              className="truncate max-w-[260px] text-blue-700 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded px-2 py-0.5"
                              title={uploadedFile.name}
                            >
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
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">Apply your company rulebase during analysis</div>
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

              {/* Footer nav for Steps 2 & 3 (consistent bottom-right) */}
              {(currentStep === 2 || currentStep === 3) && (
                <div className="sticky bottom-0 left-0 right-0 pt-1 mt-1">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      className="px-3 hover:bg-[#E8E9FF]"
                      style={{ borderColor: '#3B43D6', color: '#3B43D6' }}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      onClick={nextStep}
                      disabled={(currentStep === 2 && !canProceedToStep3) || (currentStep === 3 && !canProceedToStep4)}
                      className="px-4 text-white hover:bg-[#2F36B0]"
                      style={{ backgroundColor: '#3B43D6' }}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Canvas Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
              {/* Top inline controls */}
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={prevStep} className="hover:bg-[#E8E9FF]" style={{ borderColor: '#3B43D6', color: '#3B43D6' }}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <div className="flex gap-2">
                  {!extractedDocument && (
                    <Button
                      onClick={handleDocumentExtraction}
                      disabled={!uploadedFile || isAnalyzing || !(templateMode === 'standard' ? !!selectedTemplate : (!!customTemplateName || !!customTemplateText))}
                      className="flex items-center gap-2 text-white hover:bg-[#2F36B0]"
                      style={{ backgroundColor: '#3B43D6' }}
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
                      className="flex items-center gap-2 text-white hover:bg-[#2F36B0]"
                      style={{ backgroundColor: '#3B43D6' }}
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

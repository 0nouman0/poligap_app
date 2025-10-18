"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Shield, Upload, FileText, AlertTriangle, CheckCircle, Eye, Download, Heart, Globe, MapPin, TrendingUp, CreditCard, Lock, Award, Building, GraduationCap, Landmark, Users, Plane, Factory, Zap, Car, Pill, Database, Radio, Flag, Star, Crown, Network, Cpu, ChevronRight, ChevronLeft, FolderOpen, Filter, X, AlertCircle, Info, Minus, History, Calendar, TrendingDown, TrendingUp as TrendingUpIcon, Plus, Loader2, BookOpen, BarChart2, XOctagon, Coffee, Meh, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AssetPicker } from "@/components/AssetPicker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toastSuccess, toastError } from "@/components/toast-varients";
import { useUserStore } from "@/stores/user-store";
import { useAuditLogsStore } from "@/stores/audit-logs-store";
import { useRulebaseStore } from "@/stores/rulebase-store";
import { Skeleton } from "@/components/ui/skeleton";

interface ComplianceStandard {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

interface ComplianceGap {
  id: string;
  title: string;
  description: string; // concise one-liner
  priority: "critical" | "high" | "medium" | "low";
  category: string;
  recommendation: string; // kept for history compatibility
  justification?: string; // evidence citation or excerpt from the document
  section?: string;
}

interface ComplianceResult {
  id: string;
  fileName: string;
  standard: string;
  status: "compliant" | "non-compliant" | "partial" | "failed";
  score: number;
  gaps: ComplianceGap[];
  suggestions: string[];
  uploadDate: string;
  detailedAnalysis?: any;
  failureReason?: string;
  relevanceAssessment?: {
    isRelevant: boolean;
    reason: string;
    confidence: number;
  };
  errorDetails?: {
    type: string;
    message: string;
    reason: string;
    confidence: number;
  };
  summary?: {
    totalGaps: number;
    criticalIssues: number;
    recommendedActions: string[];
  };
}

interface AuditLog {
  _id: string;
  fileName: string;
  standards: string[];
  score: number;
  status: 'compliant' | 'non-compliant' | 'partial';
  gapsCount: number;
  analysisDate: string;
  fileSize: number;
  analysisMethod?: string;
  snapshot?: {
    gaps?: ComplianceGap[];
    suggestions?: string[];
    rulebase?: { applied: boolean; ruleCount: number; method?: string };
  };
}

const complianceStandards: ComplianceStandard[] = [
  {
    id: "hipaa",
    name: "HIPAA",
    description: "Health Insurance Portability and Accountability Act",
    icon: Heart,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
  },
  {
    id: "gdpr",
    name: "GDPR",
    description: "General Data Protection Regulation",
    icon: Globe,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
  },
  {
    id: "ccpa",
    name: "CCPA",
    description: "California Consumer Privacy Act",
    icon: MapPin,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
  },
  {
    id: "sox",
    name: "SOX",
    description: "Sarbanes-Oxley Act",
    icon: TrendingUp,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
  },
  {
    id: "pci-dss",
    name: "PCI DSS",
    description: "Payment Card Industry Data Security Standard",
    icon: CreditCard,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
  },
  {
    id: "iso-27001",
    name: "ISO 27001",
    description: "Information Security Management Systems",
    icon: Lock,
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
  },
  {
    id: "iso-9001",
    name: "ISO 9001",
    description: "Quality Management Systems",
    icon: Award,
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
  },
  {
    id: "nist",
    name: "NIST",
    description: "National Institute of Standards and Technology",
    icon: Building,
    color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300"
  },
  {
    id: "fisma",
    name: "FISMA",
    description: "Federal Information Security Management Act",
    icon: Shield,
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
  },
  {
    id: "ferpa",
    name: "FERPA",
    description: "Family Educational Rights and Privacy Act",
    icon: GraduationCap,
    color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300"
  },
  {
    id: "glba",
    name: "GLBA",
    description: "Gramm-Leach-Bliley Act",
    icon: Landmark,
    color: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300"
  },
  {
    id: "soc2",
    name: "SOC 2",
    description: "Service Organization Control 2",
    icon: Users,
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
  },
  {
    id: "faa",
    name: "FAA",
    description: "Federal Aviation Administration Regulations",
    icon: Plane,
    color: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300"
  },
  {
    id: "osha",
    name: "OSHA",
    description: "Occupational Safety and Health Administration",
    icon: Factory,
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
  },
  {
    id: "nerc-cip",
    name: "NERC CIP",
    description: "North American Electric Reliability Corporation",
    icon: Zap,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
  },
  {
    id: "dot",
    name: "DOT",
    description: "Department of Transportation Regulations",
    icon: Car,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
  },
  {
    id: "fda",
    name: "FDA",
    description: "Food and Drug Administration Regulations",
    icon: Pill,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
  },
  {
    id: "iso-14001",
    name: "ISO 14001",
    description: "Environmental Management Systems",
    icon: Globe,
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
  },
  {
    id: "cobit",
    name: "COBIT",
    description: "Control Objectives for Information Technologies",
    icon: Database,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
  },
  {
    id: "iso-22301",
    name: "ISO 22301",
    description: "Business Continuity Management Systems",
    icon: Shield,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
  },
  {
    id: "fcc",
    name: "FCC",
    description: "Federal Communications Commission Regulations",
    icon: Radio,
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
  },
  {
    id: "itar",
    name: "ITAR",
    description: "International Traffic in Arms Regulations",
    icon: Shield,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  },
  {
    id: "coso",
    name: "COSO",
    description: "Committee of Sponsoring Organizations Framework",
    icon: Building,
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
  },
  {
    id: "iso-45001",
    name: "ISO 45001",
    description: "Occupational Health and Safety Management",
    icon: Heart,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
  },
  {
    id: "coppa",
    name: "COPPA",
    description: "Children's Online Privacy Protection Act",
    icon: Users,
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
  },
  {
    id: "pipeda",
    name: "PIPEDA",
    description: "Personal Information Protection and Electronic Documents Act",
    icon: MapPin,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
  },
  {
    id: "basel-iii",
    name: "Basel III",
    description: "International Banking Regulatory Framework",
    icon: Landmark,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
  },
  {
    id: "mifid-ii",
    name: "MiFID II",
    description: "Markets in Financial Instruments Directive",
    icon: TrendingUp,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
  },
  {
    id: "iec-62304",
    name: "IEC 62304",
    description: "Medical Device Software Life Cycle Processes",
    icon: Heart,
    color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300"
  },
  {
    id: "iso-13485",
    name: "ISO 13485",
    description: "Medical Devices Quality Management Systems",
    icon: Award,
    color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300"
  },
  {
    id: "dpdp-act",
    name: "DPDP Act",
    description: "Digital Personal Data Protection Act (India)",
    icon: Flag,
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
  },
  {
    id: "it-act-2000",
    name: "IT Act 2000",
    description: "Information Technology Act (India)",
    icon: Cpu,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
  },
  {
    id: "rbi-guidelines",
    name: "RBI Guidelines",
    description: "Reserve Bank of India Cybersecurity Framework",
    icon: Landmark,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
  },
  {
    id: "pdpa-singapore",
    name: "PDPA Singapore",
    description: "Personal Data Protection Act (Singapore)",
    icon: Star,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
  },
  {
    id: "mas-trmg",
    name: "MAS TRMG",
    description: "Monetary Authority of Singapore Technology Risk Management",
    icon: Building,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
  },
  {
    id: "difc-dpl",
    name: "DIFC DPL",
    description: "Dubai International Financial Centre Data Protection Law",
    icon: Crown,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
  },
  {
    id: "uae-dpl",
    name: "UAE DPL",
    description: "United Arab Emirates Data Protection Law",
    icon: MapPin,
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
  },
  {
    id: "nis2-directive",
    name: "NIS2 Directive",
    description: "Network and Information Systems Security Directive (EU)",
    icon: Network,
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
  },
  {
    id: "dora-regulation",
    name: "DORA",
    description: "Digital Operational Resilience Act (EU)",
    icon: Shield,
    color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300"
  },
  {
    id: "ai-act-eu",
    name: "EU AI Act",
    description: "European Union Artificial Intelligence Act",
    icon: Cpu,
    color: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300"
  }
];

// Priority configuration with colors and icons
const priorityConfig = {
  critical: {
    label: "Critical",
    color: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100",
    badgeColor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    icon: AlertTriangle,
    iconColor: "text-red-600 dark:text-red-400"
  },
  high: {
    label: "High",
    color: "bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-100",
    badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    icon: AlertCircle,
    iconColor: "text-orange-600 dark:text-orange-400"
  },
  medium: {
    label: "Medium",
    color: "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-100",
    badgeColor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    icon: Info,
    iconColor: "text-yellow-600 dark:text-yellow-400"
  },
  low: {
    label: "Low",
    color: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    icon: Minus,
    iconColor: "text-blue-600 dark:text-blue-400"
  }
};

const initialResults: ComplianceResult[] = [];

export default function ComplianceCheckPage() {
  const router = useRouter();
  const { userData } = useUserStore();
  
  // Get userId with proper fallbacks
  const getUserId = () => {
    if (typeof window === 'undefined') return null;
    
    // Priority: userData from store > localStorage > fallback
    if (userData?.userId && userData.userId !== "undefined" && userData.userId !== "null") {
      return userData.userId;
    }
    
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId && storedUserId !== "undefined" && storedUserId !== "null") {
      return storedUserId;
    }
    
    // Fallback for testing - replace with your actual test user ID
    return process.env.NEXT_PUBLIC_FALLBACK_USER_ID || null;
  };
  
  // Use Zustand stores for caching
  const { logs: auditLogs, isLoading: isLoadingLogs, fetchLogs: fetchAuditLogsFromStore, addLog } = useAuditLogsStore();
  const { rules, fetchRules } = useRulebaseStore();
  
  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [applyRuleBase, setApplyRuleBase] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<ComplianceResult[]>([]);
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  const [analysisMethod, setAnalysisMethod] = useState<string>("");
  const [appliedRuleBase, setAppliedRuleBase] = useState<boolean>(false);
  const [rulebaseCount, setRulebaseCount] = useState<number>(0);
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>("all");
  const [showIssues, setShowIssues] = useState(true);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
  const [addedTaskKeys, setAddedTaskKeys] = useState<Set<string>>(new Set());
  const [addingTaskKeys, setAddingTaskKeys] = useState<Set<string>>(new Set());
  const [isLogsCollapsed, setIsLogsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter standards based on search query
  const filteredStandards = useMemo(() => {
    if (!searchQuery.trim()) {
      return complianceStandards;
    }
    const query = searchQuery.toLowerCase();
    return complianceStandards.filter(standard => 
      standard.name.toLowerCase().includes(query) ||
      standard.description.toLowerCase().includes(query) ||
      standard.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Fetch audit logs and rules from stores on mount
  useEffect(() => {
    const userId = getUserId();
    if (userId) {
      fetchAuditLogsFromStore(userId);
    }
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter audit logs based on selected standards
  const filteredAuditLogs = useMemo(() => {
    if (selectedStandards.length === 0) {
      return [];
    }
    return auditLogs.filter(log => 
      selectedStandards.some(std => log.standards?.includes(std))
    ).slice(0, 20); // Limit to 20 most recent
  }, [auditLogs, selectedStandards]);

  const steps = [
    { id: 1, title: "Select Standards", description: "Choose compliance standards" },
    { id: 2, title: "Upload Document", description: "Upload your policy document" },
    { id: 3, title: "Review & Analyze", description: "Review selections and analyze" },
    { id: 4, title: "Results", description: "View compliance analysis" }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
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

  // Save current results to MongoDB and return to first step
  const handleSaveAndExit = async () => {
    try {
      if (results && results.length > 0) {
        // Save all results to MongoDB
        for (const r of results) {
          await saveAuditLog(r);
        }
        
        // Show success notification
        toastSuccess(
          'Analysis Saved Successfully', 
          `${results.length} compliance ${results.length === 1 ? 'result' : 'results'} saved to your audit history.`
        );
      } else {
        // Show info message if no results to save
        toastSuccess('Session Reset', 'Compliance check has been reset to start a new analysis.');
      }
      
      // Reset the compliance check to the first step
      setCurrentStep(1);
      setSelectedStandards([]);
      setUploadedFile(null);
      setResults([]);
      setIsAnalyzing(false);
      setApplyRuleBase(false);
      
    } catch (e) {
      console.error('Save & Exit failed to save some logs', e);
      
      // Show error notification
      toastError(
        'Save Failed', 
        'There was an error saving your analysis. Please try again or contact support.'
      );
      
      // Still reset to first step even if saving fails
      setCurrentStep(1);
      setSelectedStandards([]);
      setUploadedFile(null);
      setResults([]);
      setIsAnalyzing(false);
      setApplyRuleBase(false);
    }
  };

  const handleStandardToggle = (standardId: string) => {
    setSelectedStandards(prev => {
      const newStandards = prev.includes(standardId)
        ? prev.filter(id => id !== standardId)
        : [...prev, standardId];
      
      // Auto-open audit logs when a standard is selected
      if (newStandards.length > 0 && isLogsCollapsed) {
        setIsLogsCollapsed(false);
      }
      
      return newStandards;
    });
  };

  const saveAuditLog = async (result: ComplianceResult) => {
    try {
      const userId = getUserId();
      console.log('💾 Saving audit log with userId:', userId, 'fileName:', result.fileName);
      
      if (!userId) {
        console.error('❌ Cannot save audit log: userId is null');
        toastError('Save Failed', 'User ID not found. Please log in again.');
        return;
      }
      
      const auditLogData = {
        fileName: result.fileName,
        standards: selectedStandards,
        score: result.score,
        status: result.status,
        gapsCount: result.gaps.length,
        fileSize: uploadedFile?.size || 0,
        analysisMethod: analysisMethod || 'standard',
        userId: userId,
        snapshot: {
          gaps: result.gaps,
          suggestions: result.suggestions,
          fullResult: result,
          rulebase: { applied: appliedRuleBase, ruleCount: rulebaseCount, method: analysisMethod }
        }
      };

      const resp = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditLogData)
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        console.error('Failed to save audit log', err);
      } else {
        const json = await resp.json().catch(() => null);
        console.debug('Saved audit log snapshot', {
          gaps: auditLogData.snapshot?.gaps?.length || 0,
          suggestions: auditLogData.snapshot?.suggestions?.length || 0,
          id: json?.id
        });
        
        // Add to store for instant UI update
        if (json?.log) {
          addLog(json.log);
        }
      }
      
      // Refresh audit logs from store (will use cache or fetch if needed)
      fetchAuditLogsFromStore(userId, true);
    } catch (error) {
      console.error('Error saving audit log:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile || !uploadedFile.name || selectedStandards.length === 0) {
      console.error('Missing required data for analysis:', { uploadedFile: !!uploadedFile, fileName: uploadedFile?.name, standardsCount: selectedStandards.length });
      return;
    }

    setIsAnalyzing(true);
    setResults([]);

    try {
      if (!uploadedFile.name.endsWith('.pdf') && !uploadedFile.name.endsWith('.doc') && !uploadedFile.name.endsWith('.docx') && !uploadedFile.name.endsWith('.txt')) {
        throw new Error('Unsupported file format. Please upload PDF, DOC, DOCX, or TXT files.');
      }

      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('selectedStandards', JSON.stringify(selectedStandards));
      formData.append('applyRuleBase', String(applyRuleBase));

      const response = await fetch('/api/compliance-analysis', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      console.log('Analysis completed using:', data.method || 'unknown method');
      setAnalysisMethod(data.method || 'unknown');
      if (typeof data.appliedRuleBase !== 'undefined') setAppliedRuleBase(!!data.appliedRuleBase);
      if (typeof data.ruleCount !== 'undefined') setRulebaseCount(Number(data.ruleCount) || 0);

      const analysis = data.analysis;
      const overallScore = analysis.overallScore || 75;
      const status = overallScore >= 90 ? 'compliant' : overallScore >= 70 ? 'partial' : 'non-compliant';

      const allGaps: ComplianceGap[] = [];
      const allSuggestions: string[] = [];

      analysis.standardsAnalysis?.forEach((standardAnalysis: any, index: number) => {
        if (Array.isArray(standardAnalysis.gaps) && standardAnalysis.gaps.length > 0) {
          const gapsWithPriority: ComplianceGap[] = standardAnalysis.gaps.map((gap: any, gapIndex: number) => {
            const isString = typeof gap === 'string';
            const text = isString ? (gap as string) : `${gap?.title || ''} ${gap?.description || ''}`.trim();

            let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
            const gapLower = (text || '').toLowerCase();
            if (gapLower.includes('complete absence') || gapLower.includes('lacks any mention') || gapLower.includes('no procedures') || gapLower.includes('critical') || standardAnalysis.score === 0) {
              priority = 'critical';
            } else if (gapLower.includes('insufficient') || gapLower.includes('inadequate') || gapLower.includes('missing') || standardAnalysis.score < 30) {
              priority = 'high';
            } else if (gapLower.includes('limited') || gapLower.includes('unclear') || standardAnalysis.score < 70) {
              priority = 'medium';
            } else {
              priority = 'low';
            }

            const oneLiner = (text.replace(/\s+/g, ' ').split(/[\.!?]/)[0].trim()).slice(0, 140);
            const jSrc = (standardAnalysis.justifications && standardAnalysis.justifications[gapIndex]) ||
                         (standardAnalysis.evidence && standardAnalysis.evidence[gapIndex]) ||
                         (standardAnalysis.citations && standardAnalysis.citations[gapIndex]) ||
                         (standardAnalysis.quotes && standardAnalysis.quotes[gapIndex]) ||
                         null;
            const evidence = isString ? undefined : (gap?.evidence || null);
            const regulationRef = isString ? undefined : (gap?.regulationReference || null);
            const baseJust = evidence
              ? `The document states: "${evidence}"`
              : typeof jSrc === 'string'
                ? `The document states: "${jSrc}"`
                : jSrc?.text
                  ? `The document states: "${jSrc.text}"`
                  : `The document indicates: ${oneLiner}.`;
            const justification = regulationRef ? `${baseJust} [Ref: ${regulationRef}]` : baseJust;

            return {
              id: `gap-${index}-${gapIndex}`,
              title: isString ? (gap as string).split('.')[0]?.trim() || (gap as string).substring(0, 80).trim() : (gap?.title || oneLiner || 'Compliance Gap'),
              description: isString ? oneLiner : (gap?.description || oneLiner),
              priority: (isString ? priority : (gap?.severity || priority)) as 'critical' | 'high' | 'medium' | 'low',
              category: (isString ? (standardAnalysis.standard || 'General') : (gap?.category || standardAnalysis.standard || 'General')),
              recommendation: isString ? `Address this ${priority} priority gap by implementing proper compliance measures for ${standardAnalysis.standard}.` : (gap?.recommendedAction || `Address this ${priority} priority gap by implementing proper compliance measures for ${standardAnalysis.standard}.`),
              justification,
              section: (isString ? `${standardAnalysis.standard} Analysis` : (gap?.section || `${standardAnalysis.standard} Analysis`))
            };
          });
          allGaps.push(...gapsWithPriority);
        }

        if (Array.isArray(standardAnalysis.criticalIssues) && standardAnalysis.criticalIssues.length > 0) {
          const criticalGaps: ComplianceGap[] = standardAnalysis.criticalIssues.map((issue: any, issueIndex: number) => {
            const isString = typeof issue === 'string';
            const text = isString ? (issue as string) : `${issue?.title || ''} ${issue?.description || ''}`.trim();
            const oneLiner = (text.replace(/•$/, '').trim().split(/[\.!?]/)[0] || text).slice(0, 140);
            const ev = isString ? (standardAnalysis?.criticalEvidence && (standardAnalysis.criticalEvidence[issueIndex]?.text || standardAnalysis.criticalEvidence[issueIndex])) : (issue?.evidence || null);
            const regulationRef = isString ? undefined : (issue?.regulationReference || null);
            const baseJust = ev ? `The document states: "${ev}"` : `The document indicates: ${oneLiner}.`;
            const justification = regulationRef ? `${baseJust} [Ref: ${regulationRef}]` : baseJust;
            return {
              id: `critical-${index}-${issueIndex}`,
              title: isString ? (issue as string).split('.')[0]?.trim() || (issue as string).substring(0, 80).trim() : (issue?.title || oneLiner || 'Critical Issue'),
              description: isString ? oneLiner : (issue?.description || oneLiner),
              priority: 'critical',
              category: standardAnalysis.standard || 'General',
              recommendation: isString ? `This critical issue requires immediate attention and comprehensive remediation for ${standardAnalysis.standard} compliance.` : (issue?.recommendedAction || `This critical issue requires immediate attention and comprehensive remediation for ${standardAnalysis.standard} compliance.`),
              justification,
              section: isString ? `${standardAnalysis.standard} Critical Issues` : (issue?.section || `${standardAnalysis.standard} Critical Issues`)
            } as ComplianceGap;
          });
          allGaps.push(...criticalGaps);
        }

        if (Array.isArray(standardAnalysis.suggestions) && standardAnalysis.suggestions.length > 0) {
          allSuggestions.push(...standardAnalysis.suggestions);
        }
      });

      const newResult: ComplianceResult = {
        id: Date.now().toString(),
        fileName: uploadedFile.name,
        standard: selectedStandards.map(s => s.toUpperCase()).join(', '),
        status,
        score: overallScore,
        gaps: allGaps.length > 0 ? allGaps : [{
          id: 'no-gaps',
          title: 'No Gaps Identified',
          description: 'Analysis completed but no specific compliance gaps were identified.',
          priority: 'low',
          category: 'General',
          recommendation: 'Continue monitoring compliance status.',
          section: 'Overall'
        }],
        suggestions: allSuggestions.length > 0 ? allSuggestions : ['No specific improvement suggestions were generated.'],
        uploadDate: new Date().toISOString().split('T')[0],
        detailedAnalysis: analysis
      };

      setResults([newResult]);
      await saveAuditLog(newResult);
      setCurrentStep(4);
    } catch (error) {
      console.error('Analysis error:', error);
      const errorResult: ComplianceResult = {
        id: Date.now().toString(),
        fileName: uploadedFile?.name || 'Unknown File',
        standard: selectedStandards.map(s => s.toUpperCase()).join(', '),
        status: 'non-compliant',
        score: 0,
        gaps: [{
          id: 'analysis-error',
          title: 'Analysis Error',
          description: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          priority: 'critical',
          category: 'System',
          recommendation: 'Please try again or contact support',
          section: 'Error'
        }],
        suggestions: ['Please try again or contact support'],
        uploadDate: new Date().toISOString().split('T')[0]
      };
      setResults([errorResult]);
      setCurrentStep(4);
    } finally {
      setIsAnalyzing(false);
    }
  };
  // Status helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'partial': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'non-compliant': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-4 w-4" />;
      case 'partial': return <AlertTriangle className="h-4 w-4" />;
      case 'non-compliant': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Step navigation
  const nextStep = () => {
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Step guards
  const canProceedToStep2 = selectedStandards.length > 0;
  const canProceedToStep3 = uploadedFile !== null;
  const canAnalyze = selectedStandards.length > 0 && uploadedFile !== null;

  // Create a task in backend tasks collection with client-side dedupe
  const addTask = async (
    payload: {
      title: string;
      description?: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      category?: string;
      sourceRef?: { resultId?: string; gapId?: string; fileName?: string; standard?: string; analyzedAt?: string };
    },
    options?: { dedupeKey?: string }
  ) => {
    try {
      const key = options?.dedupeKey;
      if (key && addedTaskKeys.has(key)) {
        return { success: true, deduped: true } as const;
      }
      if (key) {
        setAddingTaskKeys(prev => new Set(prev).add(key));
      }
      const userId = getUserId();
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          status: 'pending',
          priority: payload.priority,
          category: payload.category,
          source: 'compliance',
          userId: userId || undefined,
          sourceRef: {
            ...payload.sourceRef,
            analyzedAt: payload.sourceRef?.analyzedAt || new Date().toISOString(),
          },
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        console.error('Failed to create task', e);
      } else {
        if (key) {
          setAddedTaskKeys(prev => new Set(prev).add(key));
        }
        console.debug('Task created');
      }
    } catch (err) {
      console.error('Error creating task', err);
    } finally {
      const key = options?.dedupeKey;
      if (key) {
        setAddingTaskKeys(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    }
  };

  return (
    <div className="w-full h-full flex relative">
      <a href="/how-to-use#compliance-check" className="absolute top-2 right-4 text-xs text-[var(--url-color)] hover:underline z-10">
        How to Use
      </a>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Center Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Fixed Header Section */}
          <div className="flex-shrink-0 px-6 pt-5 pb-3">
            {/* Header Section */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                <Shield className="h-5 w-5 text-[#3B43D6]" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-[#2D2F34] dark:text-gray-100">Compliance Check</h1>
                <p className="text-xs text-[#6A707C] dark:text-gray-400 mt-0.5 leading-tight">
                  Analyze your documents against compliance standards using AI
                </p>
              </div>
            </div>
          </div>

          {/* Step Indicator and Title Section */}
          <div className="flex-shrink-0 px-6 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#2D2F34] dark:text-gray-100">
                  {steps[currentStep - 1]?.title}
                </h2>
                <p className="text-xs text-[#6A707C] dark:text-gray-400 mt-0.5">
                  {currentStep === 1 ? `${selectedStandards.length} of ${complianceStandards.length} standards selected` : steps[currentStep - 1]?.description}
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

          {/* Fixed Search Bar - Only visible on Step 1 */}
          {currentStep === 1 && (
            <div className="flex-shrink-0 px-6 pb-3 border-b border-border dark:border-border">
              <div className="space-y-2">
                {/* Search Bar */}
                <div className="relative w-[280px]">
                  <Input
                    type="text"
                    placeholder="Search Template..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 text-xs pl-8 bg-white dark:bg-gray-800 border-[#E4E4E4] dark:border-gray-600 rounded-[5px] select-text text-[#717171] dark:text-gray-100 placeholder:text-[#8D8D8D] dark:placeholder:text-gray-400"
                  />
                  <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path d="M5.5 9.5C7.70914 9.5 9.5 7.70914 9.5 5.5C9.5 3.29086 7.70914 1.5 5.5 1.5C3.29086 1.5 1.5 3.29086 1.5 5.5C1.5 7.70914 3.29086 9.5 5.5 9.5Z" stroke="#8D8D8D" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10.5 10.5L8.5 8.5" stroke="#8D8D8D" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Results count */}
                {searchQuery && filteredStandards.length > 0 && (
                  <p className="text-xs text-[#6A707C] dark:text-gray-400">
                    Found {filteredStandards.length} standard{filteredStandards.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-6 pb-4 scrollbar-thin">{/* Step Content */}
          {/* Step 1: Select Compliance Standards */}
          {currentStep === 1 && (
            <div className="pt-3">

              {/* Standards Grid - Responsive based on audit logs state */}
              <div className={`grid gap-4 ${
                selectedStandards.length > 0 && !isLogsCollapsed
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3' 
                  : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4'
              }`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {filteredStandards.length > 0 ? (
                  filteredStandards.map((standard) => (
                  <div
                    key={standard.id}
                    className={`relative bg-card dark:bg-card rounded-[10px] p-4 cursor-pointer transition-all duration-200 hover:shadow-lg border ${
                      selectedStandards.includes(standard.id) 
                        ? "border-primary dark:border-primary shadow-md" 
                        : "border-border dark:border-border hover:border-primary dark:hover:border-primary"
                    }`}
                    style={{ minHeight: '116px' }}
                    onClick={() => handleStandardToggle(standard.id)}
                  >
                    {/* Checkmark - Top Right */}
                    {selectedStandards.includes(standard.id) && (
                      <div className="absolute top-3 right-3">
                        <svg 
                          className="h-6 w-6 text-primary" 
                          fill="none" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth="2.5" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                    )}
                    
                    {/* Icon and Content */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className={`w-[50px] h-[50px] rounded-lg flex items-center justify-center ${standard.color}`}>
                          <standard.icon className="w-6 h-6" strokeWidth={1.5} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <h3 className="font-semibold text-foreground dark:text-foreground text-base mb-1 truncate" title={standard.name}>{standard.name}</h3>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground line-clamp-2 break-words" title={standard.description}>{standard.description}</p>
                      </div>
                    </div>
                  </div>
                ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-foreground mb-2">No standards found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your search query</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Upload Document */}
          {currentStep === 2 && (
            <div className="space-y-8">
              {/* Two Column Upload Options */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Upload New Document */}
                <div className="bg-card dark:bg-card border border-dashed border-border dark:border-border rounded-[10px] p-5 space-y-4">
                  <h3 className="text-foreground dark:text-foreground font-semibold text-base">Upload New Document</h3>
                  <p className="text-muted-foreground dark:text-muted-foreground text-xs font-medium">Upload a policy document for compliance analysis</p>
                  
                  {/* Upload Area */}
                  <div className="bg-[#FAFAFA] dark:bg-gray-800 border border-[#E6E6E6] dark:border-gray-700 rounded-[5px] p-4 flex flex-col items-center justify-center gap-3">
                    <div className="w-6 h-6 text-black dark:text-gray-300">
                      <Upload className="w-full h-full" strokeWidth={2} />
                    </div>
                    <div>
                      <Input
                        type="file"
                        onChange={handleFileUpload}
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        id="file-upload"
                      />
                      <Button 
                        asChild 
                        className="bg-[#3B43D6] hover:bg-[#2F36B0] text-white h-9 px-4 rounded-[5px] text-xs font-semibold"
                      >
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Choose File
                        </label>
                      </Button>
                    </div>
                    <p className="text-[#595959] dark:text-gray-400 text-xs font-medium text-center">
                      Supported formats: PDF, DOC, DOCX, TXT
                    </p>
                  </div>
                </div>

                {/* Select from Assets */}
                <div className="bg-card dark:bg-card border border-dashed border-border dark:border-border rounded-[10px] p-5 space-y-4">
                  <h3 className="text-foreground dark:text-foreground font-semibold text-base">Select from Assets</h3>
                  <p className="text-muted-foreground dark:text-muted-foreground text-xs font-medium">Choose from your previously uploaded documents</p>
                  
                  {/* Browse Area */}
                  <div className="bg-[#FAFAFA] dark:bg-gray-800 border border-[#E6E6E6] dark:border-gray-700 rounded-[5px] p-4 flex flex-col items-center justify-center gap-3">
                    <div className="w-6 h-6 text-black dark:text-gray-300">
                      <FolderOpen className="w-full h-full" strokeWidth={2} />
                    </div>
                    <Button 
                      onClick={() => setIsAssetPickerOpen(true)}
                      className="bg-[#3B43D6] hover:bg-[#2F36B0] text-white h-9 px-4 rounded-[5px] text-xs font-semibold"
                    >
                      Browse Assets
                    </Button>
                    <p className="text-[#595959] dark:text-gray-400 text-xs font-medium text-center">
                      Select from your uploaded documents
                    </p>
                  </div>
                </div>
              </div>

              {/* File Selected Display */}
              {uploadedFile && (
                <div className="bg-card dark:bg-card border border-border dark:border-border rounded-[5px] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-6 h-6 text-foreground dark:text-foreground flex-shrink-0">
                      <FileText className="w-full h-full" strokeWidth={2} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-foreground dark:text-foreground font-semibold text-base">File Selected Successfully</h3>
                        <CheckCircle className="w-[18px] h-[18px] text-green-600 dark:text-green-400" strokeWidth={1.5} />
                      </div>
                      <p className="text-muted-foreground dark:text-muted-foreground text-xs font-medium">
                        {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setUploadedFile(null)}
                    className="bg-[#3B43D6] hover:bg-[#2F36B0] text-white h-9 px-4 rounded-[5px] text-xs font-semibold"
                  >
                    Choose File
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review & Analyze */}
          {currentStep === 3 && (
            <div className="space-y-[30px]">
              {/* Analysis Options Card */}
              <div className="w-full flex items-start gap-[15px] py-[15px] px-5 bg-card dark:bg-card border border-border dark:border-border rounded-[5px]">
                <BarChart2 className="w-6 h-6 flex-shrink-0 mt-1" strokeWidth={2} />
                <div className="flex flex-col gap-[7px] flex-1">
                  <span className="text-[16px] font-semibold leading-[19.36px] text-foreground dark:text-foreground">
                    Analysis Options
                  </span>
                  <span className="text-[12px] font-medium leading-[14.52px] text-muted-foreground dark:text-muted-foreground">
                    Apply RuleBase  |  Use your custom company rules during analysis
                  </span>
                </div>
                <Switch checked={applyRuleBase} onCheckedChange={setApplyRuleBase} className="flex-shrink-0" />
              </div>

              {/* Selected Standards Card */}
              <div className="w-full bg-card dark:bg-card border border-border dark:border-border rounded-[5px]">
                <div className="flex items-center gap-[15px] py-[15px] px-[15px] flex-wrap">
                  <div className="flex items-center justify-center px-2.5 h-[34px] bg-accent dark:bg-accent rounded-[3px]">
                    <span className="text-[16px] font-semibold leading-[19.36px] text-foreground dark:text-foreground">
                      Selected Standards
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 min-h-[34px]">
                    {selectedStandards.length > 0 ? (
                      selectedStandards.map(standardId => {
                        const standard = complianceStandards.find(s => s.id === standardId);
                        return standard ? (
                          <div key={standardId} className="flex items-center gap-1.5">
                            <standard.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.33} />
                            <span className="text-[14px] font-semibold leading-[16.94px] text-foreground dark:text-foreground">
                              {standard.name}
                            </span>
                          </div>
                        ) : null;
                      })
                    ) : (
                      <span className="text-[12px] font-medium leading-[14.52px] text-muted-foreground dark:text-muted-foreground">None selected</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Card */}
              <div className="w-full bg-card dark:bg-card border border-border dark:border-border rounded-[5px]">
                <div className="flex items-center gap-[15px] py-[15px] px-[15px] flex-wrap">
                  <div className="flex items-center justify-center px-2.5 h-[34px] bg-accent dark:bg-accent rounded-[3px]">
                    <span className="text-[16px] font-semibold leading-[19.36px] text-foreground dark:text-foreground">
                      Document
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 min-h-[34px]">
                    {uploadedFile ? (
                      <>
                        <Globe className="w-4 h-4 flex-shrink-0" strokeWidth={1.33} />
                        <span className="text-[16px] font-semibold leading-[19.36px] text-foreground dark:text-foreground truncate max-w-[50vw]">
                          {uploadedFile.name}
                        </span>
                        <div className="flex items-center gap-2.5 px-2.5 py-[5px] bg-accent dark:bg-accent rounded-[30px]">
                          <span className="text-[14px] font-semibold leading-[16.94px] text-foreground dark:text-foreground">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="text-[12px] font-medium leading-[14.52px] text-muted-foreground dark:text-muted-foreground">No file selected</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Analysis Progress */}
              {isAnalyzing && (
                <div className="w-full space-y-6">
                  {/* Header indicator */}
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-violet-500/15 via-fuchsia-500/15 to-indigo-500/15">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-fuchsia-400 border-t-transparent" />
                      <span className="font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Analyzing Document...</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Parsing file, extracting sections and scanning for compliance gaps…</p>
                  </div>

                  {/* Document parsing skeleton */}
                  <div className="max-w-2xl mx-auto w-full">
                    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                      {/* Title */}
                      <div className="h-5 w-2/3 rounded mb-4 bg-gradient-to-r from-sky-200/60 via-fuchsia-200/60 to-emerald-200/60 dark:from-sky-300/20 dark:via-fuchsia-300/20 dark:to-emerald-300/20 animate-pulse"></div>
                      {/* Meta row */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-3 w-20 rounded bg-gradient-to-r from-indigo-200/60 to-purple-200/60 dark:from-indigo-300/20 dark:to-purple-300/20 animate-pulse"></div>
                        <div className="h-3 w-16 rounded bg-gradient-to-r from-fuchsia-200/60 to-pink-200/60 dark:from-fuchsia-300/20 dark:to-pink-300/20 animate-pulse"></div>
                        <div className="h-3 w-24 rounded bg-gradient-to-r from-cyan-200/60 to-sky-200/60 dark:from-cyan-300/20 dark:to-sky-300/20 animate-pulse"></div>
                      </div>
                      {/* Paragraph lines */}
                      <div className="space-y-2 mb-6">
                        <div className="h-3 w-full rounded bg-gradient-to-r from-slate-200/70 via-slate-300/70 to-slate-200/70 dark:from-slate-500/20 dark:via-slate-600/20 dark:to-slate-500/20 animate-pulse"></div>
                        <div className="h-3 w-11/12 rounded bg-gradient-to-r from-slate-200/70 via-slate-300/70 to-slate-200/70 dark:from-slate-500/20 dark:via-slate-600/20 dark:to-slate-500/20 animate-pulse"></div>
                        <div className="h-3 w-10/12 rounded bg-gradient-to-r from-slate-200/70 via-slate-300/70 to-slate-200/70 dark:from-slate-500/20 dark:via-slate-600/20 dark:to-slate-500/20 animate-pulse"></div>
                        <div className="h-3 w-9/12 rounded bg-gradient-to-r from-slate-200/70 via-slate-300/70 to-slate-200/70 dark:from-slate-500/20 dark:via-slate-600/20 dark:to-slate-500/20 animate-pulse"></div>
                      </div>
                      {/* Section heading */}
                      <div className="h-4 w-1/3 rounded mb-3 bg-gradient-to-r from-amber-200/60 to-orange-200/60 dark:from-amber-300/20 dark:to-orange-300/20 animate-pulse"></div>
                      {/* Bulleted-ish lines */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-fuchsia-300/60 dark:bg-fuchsia-400/30 animate-pulse"></div>
                          <div className="h-3 w-10/12 rounded bg-gradient-to-r from-fuchsia-200/60 to-purple-200/60 dark:from-fuchsia-300/20 dark:to-purple-300/20 animate-pulse"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-sky-300/60 dark:bg-sky-400/30 animate-pulse"></div>
                          <div className="h-3 w-9/12 rounded bg-gradient-to-r from-sky-200/60 to-indigo-200/60 dark:from-sky-300/20 dark:to-indigo-300/20 animate-pulse"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-300/60 dark:bg-emerald-400/30 animate-pulse"></div>
                          <div className="h-3 w-8/12 rounded bg-gradient-to-r from-emerald-200/60 to-teal-200/60 dark:from-emerald-300/20 dark:to-teal-300/20 animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    {/* Subtle indeterminate bar */}
                    <div className="mt-5">
                      <div className="w-full h-2 rounded-full overflow-hidden bg-gradient-to-r from-slate-200/70 via-slate-300/70 to-slate-200/70 dark:from-slate-600/30 dark:via-slate-700/30 dark:to-slate-600/30">
                        <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 animate-pulse"></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        AI is reviewing your document against selected compliance standards
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Results */}
          {currentStep === 4 && (
            <div className="space-y-[30px]">
              {results.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground">No analysis results</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete the analysis to see compliance results
                  </p>
                </div>
              ) : (
                <div className="space-y-[30px]">
                  {results.map((result) => (
                    <div key={result.id} className="space-y-[30px]">
                      {/* Document Header Card */}
                      <div className="bg-card dark:bg-card border border-border dark:border-border rounded-[5px] py-[15px] px-5">
                        <div className="flex items-start gap-[15px]">
                          <FileText className="w-6 h-6 flex-shrink-0" strokeWidth={2} />
                          <div className="flex-1 space-y-[7px]">
                            <h3 className="text-[16px] font-semibold leading-[19.36px] text-foreground dark:text-foreground">
                              {result.fileName}
                            </h3>
                            <p className="text-[12px] font-semibold leading-[14.52px] text-muted-foreground dark:text-muted-foreground">
                              Analyzed against {result.standard} on {new Date(result.uploadDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {/* Status and Score Badges */}
                        <div className="mt-[15px] flex flex-col gap-[15px]">
                          <div className="flex items-center justify-end gap-[7px]">
                            <div className="flex items-center gap-[7px]">
                              <div className="flex items-center justify-center gap-2.5 px-2.5 py-[5px] bg-[#FFEAED] dark:bg-red-900/30 rounded-[5px]">
                                <span className="text-[12px] font-medium leading-[14.52px] text-[#FF0004] dark:text-red-400">
                                  {result.status === 'non-compliant' ? 'Non Compliant' : result.status === 'compliant' ? 'Compliant' : result.status === 'partial' ? 'Partially Compliant' : 'Failed'}
                                </span>
                              </div>
                              <div className="flex items-center justify-center gap-2.5 px-2.5 py-[5px] bg-[#E8ECF4] dark:bg-gray-700 rounded-[5px]">
                                <span className="text-[12px] font-medium leading-[14.52px] text-[#2D2F34] dark:text-gray-200">
                                  {result.score}% Compliant
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Compliance Score Bar */}
                          <div className="flex items-center gap-[7px]">
                            <span className="text-[12px] font-normal leading-[14.52px] text-muted-foreground dark:text-muted-foreground">
                              Compliance Score
                            </span>
                            <div className="flex-1 h-[5px] bg-muted dark:bg-muted rounded-[30px] overflow-hidden">
                              <div 
                                className="h-full bg-green-600 dark:bg-green-400 rounded-[30px]" 
                                style={{ width: `${result.score}%` }}
                              />
                            </div>
                            <span className="text-[12px] font-bold leading-[14.52px] text-muted-foreground dark:text-muted-foreground">
                              {result.score}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Compliance Issues Overview */}
                      <div>
                        <h4 className="text-[16px] font-semibold leading-[19.36px] text-foreground dark:text-foreground mb-[30px]">
                          Compliance Issues Overview
                        </h4>
                        
                        {(() => {
                          const issueCounts = result.gaps.reduce((acc, gap) => {
                            acc[gap.priority] = (acc[gap.priority] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>);
                          
                          const issueCards = [
                            {
                              priority: 'critical',
                              label: 'Critical Issue',
                              count: issueCounts['critical'] || 0,
                              bgColor: '#FFEAE4',
                              borderColor: '#BA0003',
                              textColor: '#BA0003',
                              icon: XOctagon,
                              iconBg: 'rgba(255, 143, 107, 0.1)'
                            },
                            {
                              priority: 'high',
                              label: 'High Issue',
                              count: issueCounts['high'] || 0,
                              bgColor: '#FFFFFF',
                              borderColor: '#FF5E00',
                              textColor: '#FF5E00',
                              icon: Info,
                              iconBg: 'rgba(255, 143, 107, 0.1)'
                            },
                            {
                              priority: 'medium',
                              label: 'Medium Issue',
                              count: issueCounts['medium'] || 0,
                              bgColor: '#FFFFFF',
                              borderColor: '#FFD66B',
                              textColor: '#F99100',
                              icon: Coffee,
                              iconBg: 'rgba(255, 214, 107, 0.1)'
                            },
                            {
                              priority: 'low',
                              label: 'Low Issue',
                              count: issueCounts['low'] || 0,
                              bgColor: '#FFFFFF',
                              borderColor: '#7DCE61',
                              textColor: '#5AC736',
                              icon: Meh,
                              iconBg: 'rgba(168, 245, 141, 0.1)'
                            }
                          ];
                          
                          return (
                            <div className="flex flex-wrap gap-[20px] mb-[30px]">
                              {issueCards.map((card) => {
                                const IconComponent = card.icon;
                                const darkBgColor = card.priority === 'critical' ? 'dark:bg-red-900/20' : 
                                                   card.priority === 'high' ? 'dark:bg-orange-900/20' : 
                                                   card.priority === 'medium' ? 'dark:bg-yellow-900/20' : 
                                                   'dark:bg-green-900/20';
                                const darkBorderColor = card.priority === 'critical' ? 'dark:border-red-500' : 
                                                       card.priority === 'high' ? 'dark:border-orange-500' : 
                                                       card.priority === 'medium' ? 'dark:border-yellow-500' : 
                                                       'dark:border-green-500';
                                return (
                                  <div
                                    key={card.priority}
                                    className={`relative rounded-[10px] border-2 ${darkBgColor} ${darkBorderColor}`}
                                    style={{ 
                                      backgroundColor: card.bgColor,
                                      borderColor: card.borderColor,
                                      flex: '1 1 0',
                                      minWidth: '260px',
                                      height: '68px'
                                    }}
                                  >
                                    {/* Icon Circle */}
                                    <div 
                                      className="absolute left-[12px] top-[14px] w-[36px] h-[36px] rounded-[36px] flex items-center justify-center"
                                      style={{ backgroundColor: card.iconBg }}
                                    >
                                      <IconComponent className="w-5 h-5" strokeWidth={2} style={{ color: card.borderColor }} />
                                    </div>
                                    
                                    {/* Text Content */}
                                    <div className="absolute left-[58px] top-[10px]">
                                      <div className="text-[16px] font-semibold leading-[19px] dark:text-white" style={{ color: card.textColor, opacity: 0.7 }}>
                                        {String(card.count).padStart(2, '0')}
                                      </div>
                                      <div className="text-[12px] font-medium leading-[15px] opacity-70 text-[#030229] dark:text-gray-300">
                                        {card.label}
                                      </div>
                                    </div>
                                    
                                    {/* Chevron */}
                                    <div className="absolute right-[12px] top-[22px]">
                                      <ChevronRight className="w-5 h-5 text-white dark:text-gray-400" strokeWidth={1.5} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()
                        }
                        
                        {/* Priority Filter */}
                        <div className="flex items-center justify-between mb-[30px]">
                          <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                            Total Issues: {result.gaps.length}
                          </span>
                          <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                            <Select value={selectedPriorityFilter} onValueChange={setSelectedPriorityFilter}>
                              <SelectTrigger className="w-40 h-9 text-sm">
                                <SelectValue placeholder="Filter by priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Priorities</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                            {selectedPriorityFilter !== "all" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedPriorityFilter("all")}
                                className="h-8 px-2"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Issues organized by priority with Figma styling */}
                      <div className="space-y-[30px]">
                        {result.gaps.length > 0 ? (
                          (() => {
                            const filteredGaps = selectedPriorityFilter === "all" 
                              ? result.gaps 
                              : result.gaps.filter(gap => gap.priority === selectedPriorityFilter);
                            
                            const gapsByPriority = filteredGaps.reduce((acc, gap) => {
                              if (!acc[gap.priority]) acc[gap.priority] = [];
                              acc[gap.priority].push(gap);
                              return acc;
                            }, {} as Record<string, ComplianceGap[]>);
                            
                            const priorityOrder = ['critical', 'high', 'medium', 'low'];
                            
                            // Figma priority styling config
                            const figmaPriorityStyles = {
                              critical: {
                                bgColor: '#FFEAED',
                                borderColor: '#BA0003',
                                textColor: '#BA0003',
                                icon: XOctagon
                              },
                              high: {
                                bgColor: '#FFF5EB',
                                borderColor: '#FF5E00',
                                textColor: '#FF5E00',
                                icon: Info
                              },
                              medium: {
                                bgColor: '#FFFBEB',
                                borderColor: '#F99100',
                                textColor: '#F99100',
                                icon: Coffee
                              },
                              low: {
                                bgColor: '#F0FDF4',
                                borderColor: '#7DCE61',
                                textColor: '#5AC736',
                                icon: Meh
                              }
                            };
                            
                            return (
                              <div className="space-y-[30px]">
                                {priorityOrder.map(priority => {
                                  const gaps = gapsByPriority[priority];
                                  if (!gaps || gaps.length === 0) return null;
                                  
                                  const config = priorityConfig[priority as keyof typeof priorityConfig];
                                  const figmaStyle = figmaPriorityStyles[priority as keyof typeof figmaPriorityStyles];
                                  const IconComponent = figmaStyle.icon;
                                  
                                  return (
                                    <div key={priority} className="bg-card dark:bg-card border border-border dark:border-border rounded-[5px] p-[15px]">
                                      {/* Priority Header */}
                                      <div className="flex items-center gap-2.5 mb-2.5 px-2.5 py-0 bg-accent dark:bg-accent rounded-[3px] h-[34px]">
                                        <span className="text-[16px] font-semibold leading-[19.36px] text-foreground dark:text-foreground">
                                          {config.label} Priority Issues
                                        </span>
                                      </div>
                                      
                                      {/* Errors/Issues Header Row */}
                                      {result.failureReason && priority === 'critical' && (
                                        <div className="flex items-center gap-2.5 mb-2.5 px-2.5 py-0 bg-[#FFEAED] dark:bg-red-900/30 rounded-[3px] h-auto py-2">
                                          <div className="flex items-center gap-2.5 flex-1">
                                            <span className="text-[14px] font-semibold leading-[16.94px] text-[#202020] dark:text-gray-200">
                                              Analysis failed: {result.failureReason}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2.5">
                                            <div className="flex items-center justify-center gap-2.5 px-2.5 py-[7px] bg-[#E8ECF4] dark:bg-gray-700 rounded-[5px]">
                                              <span className="text-[12px] font-medium leading-[14.52px] text-[#2D2F34] dark:text-gray-200">
                                                System
                                              </span>
                                            </div>
                                            <button className="flex items-center justify-center gap-2.5 px-[15px] py-0 h-[30px] bg-[#3B43D6] rounded-[5px]">
                                              <span className="text-[12px] font-semibold leading-[14.52px] text-center text-white">
                                                + Add Task
                                              </span>
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Error/Issue Items */}
                                      <div className="flex items-center gap-2.5">
                                        <div className="flex gap-2.5 flex-1">
                                          <div className="flex items-center gap-2.5">
                                            <Info className="w-4 h-4 text-orange-600 dark:text-orange-400" strokeWidth={1.33} />
                                            <span className="text-[16px] font-semibold leading-[19.36px] text-[#202020] dark:text-gray-200">
                                              Error
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex gap-2.5">
                                          <div className="flex items-center gap-2.5">
                                            <XOctagon className="w-4 h-4 text-red-600 dark:text-red-400" strokeWidth={1.33} />
                                            <span className="text-[16px] font-semibold leading-[19.36px] text-[#202020] dark:text-gray-200">
                                              Critical Priority
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Issue Cards */}
                                      <div className="space-y-3 mt-4">
                                        {gaps.map((gap) => {
                                          const darkBgClass = priority === 'critical' ? 'dark:bg-red-900/20' : 
                                                             priority === 'high' ? 'dark:bg-orange-900/20' : 
                                                             priority === 'medium' ? 'dark:bg-yellow-900/20' : 
                                                             'dark:bg-green-900/20';
                                          const darkBorderClass = priority === 'critical' ? 'dark:border-l-red-500' : 
                                                                  priority === 'high' ? 'dark:border-l-orange-500' : 
                                                                  priority === 'medium' ? 'dark:border-l-yellow-500' : 
                                                                  'dark:border-l-green-500';
                                          return (
                                          <div 
                                            key={gap.id} 
                                            className={`border-l-4 shadow-sm p-4 rounded ${darkBgClass} ${darkBorderClass}`}
                                            style={{ 
                                              borderLeftColor: figmaStyle.borderColor,
                                              backgroundColor: figmaStyle.bgColor 
                                            }}
                                          >
                                            <div className="space-y-3">
                                              <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                  <p className="text-sm leading-relaxed text-foreground dark:text-foreground">{gap.description}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                                                    {gap.category}
                                                  </Badge>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-1"
                                                    title="Add to My Tasks"
                                                    disabled={addingTaskKeys.has(`gap:${result.id}:${gap.id}`) || addedTaskKeys.has(`gap:${result.id}:${gap.id}`)}
                                                    onClick={() => addTask({
                                                      title: gap.description.substring(0, 60),
                                                      description: gap.description,
                                                      priority: gap.priority,
                                                      category: gap.category,
                                                      sourceRef: { resultId: result.id, gapId: gap.id, fileName: result.fileName, standard: result.standard }
                                                    }, { dedupeKey: `gap:${result.id}:${gap.id}` })}
                                                  >
                                                    {addingTaskKeys.has(`gap:${result.id}:${gap.id}`) ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                      ) : addedTaskKeys.has(`gap:${result.id}:${gap.id}`) ? (
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                      ) : (
                                                        <Plus className="h-4 w-4" />
                                                      )}
                                                      <span className="hidden md:inline">
                                                        {addingTaskKeys.has(`gap:${result.id}:${gap.id}`) ? 'Adding…' : addedTaskKeys.has(`gap:${result.id}:${gap.id}`) ? 'Added' : 'Add Task'}
                                                      </span>
                                                    </Button>
                                                  </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-6 text-xs opacity-80 text-muted-foreground dark:text-muted-foreground">
                                                  <span className="flex items-center gap-1">
                                                    <FileText className="h-3 w-3" />
                                                    {gap.section}
                                                  </span>
                                                  <span className="flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    {config.label} Priority
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()
                        ) : (
                          <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                            <CardContent className="p-8 text-center">
                              <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                              <h4 className="font-bold text-green-900 dark:text-green-100 mb-2 text-lg">No Compliance Issues Found</h4>
                              <p className="text-green-700 dark:text-green-300">Your document appears to be fully compliant with the selected standards.</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {/* General Suggestions Section - Moved Below Issues */}
                      {result.suggestions.length > 0 && (
                        <div className="mt-8">
                          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                            <CardContent>
                              {/* Compact suggestions list: only description items */}
                              <ul className="space-y-2">
                                {result.suggestions.map((suggestion, index) => (
                                  <li key={index} className="flex items-start justify-between gap-3 p-3 bg-white/60 dark:bg-black/30 rounded-lg border">
                                    <p className="text-sm leading-relaxed">{suggestion}</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center gap-1"
                                      title="Add suggestion as task"
                                      disabled={addingTaskKeys.has(`suggestion:${result.id}:${index}`) || addedTaskKeys.has(`suggestion:${result.id}:${index}`)}
                                      onClick={() => addTask({
                                        title: suggestion.substring(0, 60),
                                        description: suggestion,
                                        priority: 'low',
                                        category: 'General Improvement',
                                        sourceRef: { resultId: result.id, fileName: result.fileName, standard: result.standard }
                                      }, { dedupeKey: `suggestion:${result.id}:${index}` })}
                                    >
                                      {addingTaskKeys.has(`suggestion:${result.id}:${index}`) ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : addedTaskKeys.has(`suggestion:${result.id}:${index}`) ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <Plus className="h-4 w-4" />
                                      )}
                                      <span className="hidden md:inline">{addingTaskKeys.has(`suggestion:${result.id}:${index}`) ? 'Adding…' : addedTaskKeys.has(`suggestion:${result.id}:${index}`) ? 'Added' : 'Add Task'}</span>
                                    </Button>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>

          {/* Fixed Navigation Buttons - Bottom Right */}
          {currentStep === 4 ? (
            <div className="flex-shrink-0 p-8 pt-0">
              <div className="flex justify-end gap-[15px]">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-[5px] px-2.5 py-0 h-9 bg-[#FAFAFA] dark:bg-gray-800 border border-[#717171] dark:border-gray-600 rounded-[5px] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-[#717171] dark:text-gray-400" strokeWidth={1.33} />
                  <span className="text-[12px] font-semibold leading-[14.52px] text-center text-[#717171] dark:text-gray-400">
                    Previous
                  </span>
                </button>
                <button
                  onClick={handleSaveAndExit}
                  disabled={isAnalyzing || results.length === 0}
                  className="flex items-center gap-[5px] px-[15px] py-0 h-9 bg-[#3B43D6] rounded-[5px] hover:bg-[#2F36B0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-[12px] font-semibold leading-[14.52px] text-center text-white">
                    Save & Exit
                  </span>
                  <ChevronRight className="w-4 h-4 text-white" strokeWidth={1.33} />
                </button>
              </div>
            </div>
          ) : currentStep !== 4 && (
            <div className="flex-shrink-0 p-8 pt-0">
              <div className="flex justify-end gap-[15px]">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1 || isAnalyzing}
                  className="flex items-center gap-[5px] px-[10px] py-0 h-9 bg-[#FAFAFA] dark:bg-gray-800 border border-[#717171] dark:border-gray-600 rounded-[5px] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 text-[#717171] dark:text-gray-400" strokeWidth={1.33} />
                  <span className="text-xs font-semibold text-[#717171] dark:text-gray-400">
                    Previous
                  </span>
                </button>
                <button
                  onClick={() => {
                    if (currentStep === 3) {
                      if (canAnalyze) {
                        handleAnalyze();
                      }
                    } else {
                      nextStep();
                    }
                  }}
                  disabled={
                    (currentStep === 1 && !canProceedToStep2) ||
                    (currentStep === 2 && !canProceedToStep3) ||
                    (currentStep === 3 && !canAnalyze) ||
                    currentStep === 5 ||
                    isAnalyzing
                  }
                  className="flex items-center gap-[5px] px-[15px] py-0 h-9 rounded-[5px] transition-colors text-white shadow-sm bg-[#585CFF] hover:bg-[#4B50E6] disabled:bg-[#C8CAF9] disabled:text-white disabled:shadow-none disabled:cursor-not-allowed"
                >
                  <span className="text-xs font-semibold">
                    {currentStep === 3 ? 'Analyze' : 'Next'}
                  </span>
                  <ChevronRight className="w-4 h-4" strokeWidth={1.33} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Audit Logs Sidebar */}
        {selectedStandards.length > 0 && (
          <div className={`relative ${isLogsCollapsed ? 'w-6' : 'w-[322px]'} flex-shrink-0 transition-all duration-300`}>
            {/* Drawer Toggle */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full shadow"
              title={isLogsCollapsed ? 'Show Audit Logs' : 'Hide Audit Logs'}
              aria-label={isLogsCollapsed ? 'Show Audit Logs' : 'Hide Audit Logs'}
              onClick={() => setIsLogsCollapsed((v) => !v)}
            >
              {isLogsCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>

            {!isLogsCollapsed && (
            <Card className="bg-white dark:bg-card rounded-[10px] shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] border-0 h-[675px] flex flex-col sticky top-6">
              <CardHeader className="pb-3 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 h-5 w-5 hover:bg-transparent"
                  onClick={() => setIsLogsCollapsed(true)}
                  title="Close panel"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
                <div className="flex items-start gap-2">
                  <button 
                    className="p-0 hover:opacity-70 transition-opacity"
                    onClick={() => {
                      const userId = getUserId();
                      if (userId) {
                        fetchAuditLogsFromStore(userId, true);
                      }
                    }}
                    title="Refresh"
                  >
                    <History className="h-5 w-5 text-[#717171]" strokeWidth={1.67} />
                  </button>
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold text-[#2D2F34] dark:text-foreground mb-1">
                      Audit Logs
                    </CardTitle>
                    <CardDescription className="text-xs font-normal text-[#6A707C] dark:text-muted-foreground">
                      Historical analyses for selected standards
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col p-4">
                {isLoadingLogs ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="p-3">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-5 w-3/4" />
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-4 w-16" />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t">
                            <Skeleton className="h-4 w-32" />
                            {i === 0 && <Skeleton className="h-6 w-16 rounded-full" />}
                          </div>
                          {i === 0 && (
                            <div className="flex items-center justify-between pt-2">
                              <Skeleton className="h-4 w-40" />
                              <Skeleton className="h-6 w-24" />
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : filteredAuditLogs.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center py-16">
                    <p className="text-xs font-normal text-[#6A707C] dark:text-muted-foreground max-w-[184px]">
                      No previous analyses found for selected standards
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2">
                    {filteredAuditLogs.map((log) => {
                      const logDate = new Date(log.analysisDate);
                      const isRecent = Date.now() - logDate.getTime() < 24 * 60 * 60 * 1000;
                      
                      return (
                        <Card
                          key={log._id}
                          className={`p-3 cursor-pointer hover:shadow-md transition-all duration-200 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-primary rounded-lg ${
                            isRecent
                              ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                              : 'hover:bg-accent dark:hover:bg-accent border-border dark:border-border hover:border-primary dark:hover:border-primary'
                          }`}
                          onClick={() => { setSelectedAuditLog(log); setIsLogDialogOpen(true); }}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-body-14-medium truncate text-foreground dark:text-foreground mb-2" title={log.fileName}>
                                  {log.fileName}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge className={`${getStatusColor(log.status)} font-body-12-medium`} variant="secondary">
                                    {log.status}
                                  </Badge>
                                  <span className={`font-body-12-medium ${
                                    log.score < 50 ? 'text-red-600' : 
                                    log.score < 80 ? 'text-orange-600' : 
                                    'text-green-600'
                                  }`}>
                                    {log.score}% {log.score < 80 ? 'non-compliant' : 'compliant'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 ml-2">
                                {isRecent && (
                                  <Badge variant="outline" className="font-body-12 border-primary text-primary">New</Badge>
                                )}
                                <Link href={`/history?logId=${log._id}`} onClick={(e)=>e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 p-0 hover:bg-teal-100 hover:text-teal-700 transition-colors" title="Open full report in History">
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 font-body-12 text-muted-foreground dark:text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {logDate.toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {log.gapsCount} issues
                              </span>
                              {log?.analysisMethod?.includes('+rulebase') && (
                                <span className="flex items-center gap-1" title="RuleBase applied">
                                  <BookOpen className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                                  RB
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-1">
                              {log.standards.slice(0, 2).map((standard) => (
                                <Badge key={standard} variant="outline" className="font-body-12">
                                  {standard.toUpperCase()}
                                </Badge>
                              ))}
                              {log.standards.length > 2 && (
                                <Badge variant="outline" className="font-body-12">
                                  +{log.standards.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
                
                {filteredAuditLogs.length > 0 && (
                  <div className="pt-3 border-t border-border dark:border-border">
                    <Link href="/history">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-sm font-medium px-4 py-2 border border-primary dark:border-primary text-primary dark:text-primary hover:bg-primary dark:hover:bg-primary hover:text-primary-foreground dark:hover:text-primary-foreground transition-all duration-200 rounded-lg"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View All History
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
            )}
          </div>
        )}
      </div>
      
      {/* Asset Picker Modal */}
      <AssetPicker
        isOpen={isAssetPickerOpen}
        onClose={() => setIsAssetPickerOpen(false)}
        onSelect={handleAssetSelect}
        allowedTypes={['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']}
        title="Select Document"
        description="Choose a document from your assets for compliance analysis"
      />

      {/* Audit Log Details Dialog */}
      <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
        <DialogContent className="max-w-6xl w-[96vw] md:w-[90vw] lg:w-[85vw] xl:w-[80vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Audit Details
            </DialogTitle>
            <DialogDescription className="flex items-center justify-between gap-4">
              <span>Review the historical compliance result snapshot</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${showIssues ? 'font-semibold' : ''}`}>Issues</span>
                <Switch checked={!showIssues} onCheckedChange={(val)=> setShowIssues(!val)} />
                <span className={`text-xs ${!showIssues ? 'font-semibold' : ''}`}>Suggestions</span>
              </div>
            </DialogDescription>
          </DialogHeader>

          {selectedAuditLog && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{selectedAuditLog.fileName}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(selectedAuditLog.analysisDate).toLocaleString()} • {selectedAuditLog.standards.map(s => s.toUpperCase()).join(', ')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(selectedAuditLog.status)}>{selectedAuditLog.status}</Badge>
                  <Badge variant="outline">{selectedAuditLog.score}%</Badge>
                  {(selectedAuditLog.snapshot?.rulebase?.applied || selectedAuditLog.analysisMethod?.includes('+rulebase')) && (
                    <Badge variant="outline" className="flex items-center gap-1" title={`RuleBase ${selectedAuditLog.snapshot?.rulebase?.applied ? 'applied' : 'detected from method'}`}>
                      <BookOpen className="h-3 w-3" />
                      RuleBase
                      {typeof selectedAuditLog.snapshot?.rulebase?.ruleCount === 'number' && selectedAuditLog.snapshot.rulebase.ruleCount > 0 && (
                        <span>({selectedAuditLog.snapshot.rulebase.ruleCount})</span>
                      )}
                    </Badge>
                  )}
                </div>
              </div>

              {showIssues ? (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Issues ({selectedAuditLog.gapsCount})
                  </h4>
                  {selectedAuditLog.snapshot?.gaps && selectedAuditLog.snapshot.gaps.length > 0 ? (
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                      {selectedAuditLog.snapshot.gaps.map((gap) => {
                        const cfg = priorityConfig[gap.priority as keyof typeof priorityConfig];
                        const IconComponent = cfg.icon;
                        return (
                          <Card key={gap.id} className={`${cfg.color}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <IconComponent className={`h-5 w-5 ${cfg.iconColor} mt-0.5 flex-shrink-0`} />
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold break-words whitespace-normal">{gap.title}</div>
                                  <div className="text-xs text-muted-foreground break-words whitespace-normal">{gap.description}</div>
                                </div>
                                <div className="ml-auto">
                                  <Badge className={`${cfg.badgeColor} text-xs`}>{cfg.label}</Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No snapshot of issues stored for this audit.</p>
                  )}
                </div>
              ) : (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Suggestions
                  </h4>
                  {selectedAuditLog.snapshot?.suggestions && selectedAuditLog.snapshot.suggestions.length > 0 ? (
                    <ul className="list-disc list-inside space-y-2 text-sm max-h-[60vh] overflow-y-auto pr-1 break-words whitespace-normal">
                      {selectedAuditLog.snapshot.suggestions.map((s, idx) => (
                        <li key={idx} className="break-words whitespace-normal">{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No suggestions snapshot stored.</p>
                  )}
                </div>
              )}

          </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
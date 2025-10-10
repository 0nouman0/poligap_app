"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Shield, Upload, FileText, AlertTriangle, CheckCircle, Eye, Download, Heart, Globe, MapPin, TrendingUp, CreditCard, Lock, Award, Building, GraduationCap, Landmark, Users, Plane, Factory, Zap, Car, Pill, Database, Radio, Flag, Star, Crown, Network, Cpu, ChevronRight, ChevronLeft, FolderOpen, Filter, X, AlertCircle, Info, Minus, History, Calendar, TrendingDown, TrendingUp as TrendingUpIcon, Plus, Loader2, BookOpen } from "lucide-react";
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
  status: "compliant" | "non-compliant" | "partial";
  score: number;
  gaps: ComplianceGap[];
  suggestions: string[];
  uploadDate: string;
  detailedAnalysis?: any;
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
      // Additional validation
      if (!uploadedFile.name.endsWith('.pdf') && !uploadedFile.name.endsWith('.doc') && !uploadedFile.name.endsWith('.docx') && !uploadedFile.name.endsWith('.txt')) {
        throw new Error('Unsupported file format. Please upload PDF, DOC, DOCX, or TXT files.');
      }

      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('selectedStandards', JSON.stringify(selectedStandards));
      formData.append('applyRuleBase', String(applyRuleBase));

      const response = await fetch('/api/compliance-analysis', {
        method: 'POST',
        body: formData,
      });

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
      const status = overallScore >= 90 ? "compliant" : overallScore >= 70 ? "partial" : "non-compliant";

      const allGaps: ComplianceGap[] = [];
      const allSuggestions: string[] = [];

      analysis.standardsAnalysis?.forEach((standardAnalysis: any, index: number) => {
        // Process regular gaps
        if (standardAnalysis.gaps && standardAnalysis.gaps.length > 0) {
          const gapsWithPriority = standardAnalysis.gaps.map((gap: string, gapIndex: number) => {
            // Determine priority based on content and context
            let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
            const gapLower = gap.toLowerCase();
            
            if (gapLower.includes('complete absence') || gapLower.includes('lacks any mention') || 
                gapLower.includes('no procedures') || gapLower.includes('critical') ||
                standardAnalysis.score === 0) {
              priority = 'critical';
            } else if (gapLower.includes('insufficient') || gapLower.includes('inadequate') || 
                      gapLower.includes('missing') || standardAnalysis.score < 30) {
              priority = 'high';
            } else if (gapLower.includes('limited') || gapLower.includes('unclear') || 
                      standardAnalysis.score < 70) {
              priority = 'medium';
            } else {
              priority = 'low';
            }
            
            // Build concise one-liner description (keep header/title as-is)
            const oneLiner = (gap
              .replace(/\s+/g, ' ')
              .split(/[\.!?]/)[0]
              .trim()
            ).slice(0, 140);

            // Try to extract justification/evidence from analysis if present
            const jSrc =
              (standardAnalysis.justifications && standardAnalysis.justifications[gapIndex]) ||
              (standardAnalysis.evidence && standardAnalysis.evidence[gapIndex]) ||
              (standardAnalysis.citations && standardAnalysis.citations[gapIndex]) ||
              (standardAnalysis.quotes && standardAnalysis.quotes[gapIndex]) ||
              null;
            const justification = typeof jSrc === 'string'
              ? `The document states: "${jSrc}"`
              : jSrc?.text
                ? `The document states: "${jSrc.text}"`
                : `The document indicates: ${oneLiner}.`;

            return {
              id: `gap-${index}-${gapIndex}`,
              title: gap.split('.')[0]?.trim() || gap.substring(0, 80).trim(),
              description: oneLiner,
              priority,
              category: standardAnalysis.standard || 'General',
              recommendation: `Address this ${priority} priority gap by implementing proper compliance measures for ${standardAnalysis.standard}.`,
              justification,
              section: `${standardAnalysis.standard} Analysis`
            };
          });
          allGaps.push(...gapsWithPriority);
        }
        
        // Process critical issues as critical priority gaps
        if (standardAnalysis.criticalIssues && standardAnalysis.criticalIssues.length > 0) {
          const criticalGaps = standardAnalysis.criticalIssues.map((issue: string, issueIndex: number) => {
            const oneLiner = (issue.replace(/•$/, '').trim().split(/[\.!?]/)[0] || issue).slice(0, 140);
            const ev = standardAnalysis?.criticalEvidence && (standardAnalysis.criticalEvidence[issueIndex]?.text || standardAnalysis.criticalEvidence[issueIndex]);
            const justification = ev ? `The document states: "${ev}"` : `The document indicates: ${oneLiner}.`;
            return ({
              id: `critical-${index}-${issueIndex}`,
              title: issue.split('.')[0]?.trim() || issue.substring(0, 80).trim(),
              description: oneLiner,
              priority: 'critical' as const,
              category: standardAnalysis.standard || 'General',
              recommendation: `This critical issue requires immediate attention and comprehensive remediation for ${standardAnalysis.standard} compliance.`,
              justification,
              section: `${standardAnalysis.standard} Critical Issues`
            });
          });
          allGaps.push(...criticalGaps);
        }
        
        if (standardAnalysis.suggestions && standardAnalysis.suggestions.length > 0) {
          allSuggestions.push(...standardAnalysis.suggestions);
        }
      });

      if (allGaps.length === 0 && allSuggestions.length === 0 && overallScore === 75) {
        throw new Error('Analysis did not produce meaningful results.');
      }

      const newResult: ComplianceResult = {
        id: Date.now().toString(),
        fileName: uploadedFile?.name || 'Unknown File',
        standard: selectedStandards.map(s => s.toUpperCase()).join(", "),
        status: status,
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
        suggestions: allSuggestions.length > 0 ? allSuggestions : ["No specific improvement suggestions were generated."],
        uploadDate: new Date().toISOString().split('T')[0],
        detailedAnalysis: analysis
      };

      setResults([newResult]);
      
      // Save audit log
      await saveAuditLog(newResult);
      
      setCurrentStep(4);
    } catch (error) {
      console.error('Analysis error:', error);
      const errorResult: ComplianceResult = {
        id: Date.now().toString(),
        fileName: uploadedFile?.name || 'Unknown File',
        standard: selectedStandards.map(s => s.toUpperCase()).join(", "),
        status: "non-compliant",
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
        suggestions: ["Please try again or contact support"],
        uploadDate: new Date().toISOString().split('T')[0]
      };
      setResults([errorResult]);
      setCurrentStep(4);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "partial": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "non-compliant": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant": return <CheckCircle className="h-4 w-4" />;
      case "partial": return <AlertTriangle className="h-4 w-4" />;
      case "non-compliant": return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Create a task in backend tasks collection with client-side dedupe
  const addTask = async (payload: {
    title: string;
    description?: string;
    priority: "critical" | "high" | "medium" | "low";
    category?: string;
    sourceRef?: { resultId?: string; gapId?: string; fileName?: string; standard?: string; analyzedAt?: string };
  }, options?: { dedupeKey?: string }) => {
    try {
      const key = options?.dedupeKey;
      if (key && addedTaskKeys.has(key)) {
        return { success: true, deduped: true };
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
          // include analysis timestamp for better task context
          sourceRef: {
            ...payload.sourceRef,
            analyzedAt: payload.sourceRef?.analyzedAt || new Date().toISOString(),
          },
        })
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

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToStep2 = selectedStandards.length > 0;
  const canProceedToStep3 = uploadedFile !== null;
  const canAnalyze = selectedStandards.length > 0 && uploadedFile !== null;

  return (
    <div className="w-full mx-auto p-6 space-y-8 relative">
      <a href="/how-to-use#compliance-check" className="absolute top-2 right-4 text-xs text-[var(--url-color)] hover:underline">
        How to Use
      </a>
      <div className={`flex gap-6 ${selectedStandards.length > 0 ? 'max-w-none' : 'max-w-6xl mx-auto'}`}>
        {/* Main Content */}
        <div className={`${selectedStandards.length > 0 ? 'flex-1' : 'w-full'} space-y-8`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          <Shield className="h-8 w-8" />
          Compliance Check
        </h1>
        <p className="text-muted-foreground">
          Analyze your documents against compliance standards using AI
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
      <Card>
        <CardContent className="p-10">
          {/* In-box navigation for all steps (hidden on Results page) */}
          {currentStep !== 4 && (
          <div className="flex justify-end gap-2 -mt-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 1 || isAnalyzing}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              size="sm"
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
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          )}
          {/* Step 1: Select Compliance Standards */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedStandards.length} of {complianceStandards.length} standards selected
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedStandards(complianceStandards.map(s => s.id))}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedStandards([])}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[450px] overflow-y-auto p-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {complianceStandards.map((standard) => (
                  <Card
                    key={standard.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedStandards.includes(standard.id) ? "ring-2 ring-primary bg-primary/5" : ""
                      }`}
                    onClick={() => handleStandardToggle(standard.id)}
                  >
                    <CardContent className="p-4 text-center relative min-h-[120px] flex flex-col justify-center">
                      {selectedStandards.includes(standard.id) && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <standard.icon className="h-7 w-7 mx-auto mb-3 text-primary" />
                      <h3 className="font-medium text-sm mb-1">{standard.name}</h3>
                      <p className="text-xs text-muted-foreground leading-tight">{standard.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Upload Document */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Upload New File */}
                <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <Upload className="h-5 w-5" />
                      Upload New Document
                    </CardTitle>
                    <CardDescription>
                      Upload a policy document for compliance analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <Input
                        type="file"
                        onChange={handleFileUpload}
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        id="file-upload"
                      />
                      <Button asChild variant="outline" className="w-full">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Choose File
                        </label>
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: PDF, DOC, DOCX, TXT
                    </p>
                  </CardContent>
                </Card>

                {/* Select from Assets */}
                <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <FolderOpen className="h-5 w-5" />
                      Select from Assets
                    </CardTitle>
                    <CardDescription>
                      Choose from your previously uploaded documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <FolderOpen className="h-8 w-8 text-primary" />
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setIsAssetPickerOpen(true)}
                    >
                      Browse Assets
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Select from your uploaded documents
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* File Selected Display */}
              {uploadedFile && (
                <div className="mt-6">
                  <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                            <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-900 dark:text-green-100">File Selected Successfully</h3>
                          <p className="text-green-700 dark:text-green-300 mt-1">
                            <span className="font-medium">{uploadedFile.name}</span>
                            <span className="text-sm ml-2">({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUploadedFile(null)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-100"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Change File
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review & Analyze */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Analysis Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Apply RuleBase</div>
                      <div className="text-sm text-muted-foreground">Use your custom company rules during analysis</div>
                    </div>
                    <Switch checked={applyRuleBase} onCheckedChange={setApplyRuleBase} />
                  </div>
                </CardContent>
              </Card>
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Selected Standards</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedStandards.map(standardId => {
                        const standard = complianceStandards.find(s => s.id === standardId);
                        return standard ? (
                          <div key={standardId} className="flex items-center gap-2">
                            <standard.icon className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{standard.name}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Document</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {uploadedFile ? (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{uploadedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No file selected</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Analysis Progress */}
              {isAnalyzing && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/10 rounded-full">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                      <span className="text-primary font-medium">Analyzing Document...</span>
                    </div>
                  </div>
                  <div className="max-w-md mx-auto">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Analysis Progress</span>
                      <span>Processing...</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      AI is reviewing your document against selected compliance standards
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Results */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {results.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground">No analysis results</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete the analysis to see compliance results
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {results.map((result) => (
                    <div key={result.id} className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xl font-semibold flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {result.fileName}
                          </h3>
                          <p className="text-muted-foreground">
                            Analyzed against {result.standard} on {new Date(result.uploadDate).toLocaleDateString()}
                            {analysisMethod && (
                              <span className="text-xs ml-2">
                                • Powered by {analysisMethod.includes('kroolo') ? 'Poligap AI' : 'Gemini AI'}
                              </span>
                            )}
                            {appliedRuleBase && (
                              <span className="inline-flex items-center gap-1 text-xs ml-2 px-2 py-0.5 rounded-full border border-primary/40 text-primary bg-primary/5" title={`RuleBase applied (${rulebaseCount} rules)`}>
                                <BookOpen className="h-3 w-3" /> RuleBase
                                {typeof rulebaseCount === 'number' && rulebaseCount > 0 && (
                                  <span className="opacity-80">({rulebaseCount})</span>
                                )}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(result.status)}>
                            {getStatusIcon(result.status)}
                            <span className="ml-1">{result.status.replace("-", " ")}</span>
                          </Badge>
                          <Badge variant="outline">{result.score}% Compliant</Badge>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Compliance Score</span>
                          <span>{result.score}%</span>
                        </div>
                        <Progress value={result.score} className="h-3" />
                      </div>

                      {/* Issues Summary with Counts */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold flex items-center gap-2 mb-4">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                          Compliance Issues Overview
                        </h4>
                        
                        {(() => {
                          const issueCounts = result.gaps.reduce((acc, gap) => {
                            acc[gap.priority] = (acc[gap.priority] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>);
                          
                          return (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                              {Object.entries(priorityConfig).map(([priority, config]) => {
                                const count = issueCounts[priority] || 0;
                                const IconComponent = config.icon;
                                
                                return (
                                  <Card key={priority} className={`${config.color} border-2`}>
                                    <CardContent className="p-4 text-center">
                                      <div className="flex items-center justify-center gap-2 mb-2">
                                        <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
                                        <span className="text-2xl font-bold">{count}</span>
                                      </div>
                                      <h5 className="font-semibold text-sm">{config.label}</h5>
                                      <p className="text-xs opacity-75 mt-1">
                                        {count === 1 ? 'Issue' : 'Issues'}
                                      </p>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          );
                        })()
                        }
                        
                        {/* Priority Filter */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Total Issues: {result.gaps.length}
                          </span>
                          <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <Select value={selectedPriorityFilter} onValueChange={setSelectedPriorityFilter}>
                              <SelectTrigger className="w-40">
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

                      {/* Issues organized by priority */}
                      <div className="space-y-6">
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
                            
                            return (
                              <div className="space-y-6">
                                {priorityOrder.map(priority => {
                                  const gaps = gapsByPriority[priority];
                                  if (!gaps || gaps.length === 0) return null;
                                  
                                  const config = priorityConfig[priority as keyof typeof priorityConfig];
                                  const IconComponent = config.icon;
                                  
                                  return (
                                    <div key={priority} className="space-y-4">
                                      <div className="flex items-center gap-3 mb-4">
                                        <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
                                        <h5 className="font-bold text-xl">{config.label} Priority Issues</h5>
                                        <Badge className={`${config.badgeColor} text-sm px-3 py-1`}>{gaps.length}</Badge>
                                      </div>
                                      
                                      <div className="space-y-3">
                                        {gaps.map((gap) => (
                                          <Card key={gap.id} className={`${config.color} border-l-8 shadow-sm hover:shadow-md transition-shadow`}>
                                            <CardContent className="p-6">
                                              <div className="space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                  <div className="flex-1">
                                                    {/* Compact: only show description as the item */}
                                                    <p className="text-sm leading-relaxed">{gap.description}</p>
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
                                                
                                                <div className="flex items-center gap-6 text-xs opacity-80">
                                                  <span className="flex items-center gap-1">
                                                    <FileText className="h-3 w-3" />
                                                    {gap.section}
                                                  </span>
                                                  <span className="flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    {config.label} Priority
                                                  </span>
                                                </div>
                                                
                                                {/* Justification box removed per requirement: avoid hypothetical data */}
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                }).filter(Boolean)}
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
                  {/* Save & Exit CTA */}
                  <div className="pt-6 mt-4 border-t flex justify-end">
                    <Button size="lg" onClick={handleSaveAndExit} disabled={isAnalyzing || results.length === 0}>
                      Save & Exit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom navigation removed per design: navigation is now at the top controls */}

        </div>

        {/* Audit Logs Sidebar */}
        {selectedStandards.length > 0 && (
          <div className={`relative ${isLogsCollapsed ? 'w-6' : 'w-80'} flex-shrink-0 transition-all duration-300`}>
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
            <Card className="h-fit sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Audit Logs
                </CardTitle>
                <CardDescription>
                  Historical analyses for selected standards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingLogs ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : filteredAuditLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No previous analyses found for selected standards</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredAuditLogs.map((log) => {
                      const logDate = new Date(log.analysisDate);
                      const isRecent = Date.now() - logDate.getTime() < 24 * 60 * 60 * 1000;
                      
                      return (
                        <Card
                          key={log._id}
                          className={`p-3 cursor-pointer hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            isRecent
                              ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => { setSelectedAuditLog(log); setIsLogDialogOpen(true); }}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-foreground" title={log.fileName}>
                                  {log.fileName}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={getStatusColor(log.status)} variant="secondary">
                                    {log.status}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {log.score}%
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 ml-2">
                                {isRecent && (
                                  <Badge variant="outline" className="text-xs border-primary text-primary">New</Badge>
                                )}
                                <Link href={`/history?logId=${log._id}`} onClick={(e)=>e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0" title="Open full report in History">
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                                  <BookOpen className="h-3 w-3 text-primary" />
                                  RB
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-1">
                              {log.standards.slice(0, 2).map((standard) => (
                                <Badge key={standard} variant="outline" className="text-xs border-muted-300 text-muted-700 dark:border-muted-700 dark:text-muted-300">
                                  {standard.toUpperCase()}
                                </Badge>
                              ))}
                              {log.standards.length > 2 && (
                                <Badge variant="outline" className="text-xs border-muted-300 text-muted-700 dark:border-muted-700 dark:text-muted-300">
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
                  <div className="pt-3 border-t">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View All History
                    </Button>
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
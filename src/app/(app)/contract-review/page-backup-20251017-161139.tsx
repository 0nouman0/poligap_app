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
  }
];

export default function ContractReview() {
  // User store for userId
  const { userData } = useUserStore();
  
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Use Zustand store for audit logs
  const { logs: allAuditLogs, isLoading: logsLoading, fetchLogs: fetchAuditLogs } = useAuditLogsStore();
  
  // Filter template logs based on selected template
  const templateLogs = useMemo(() => {
    if (!selectedTemplate?.id) return [];
    return allAuditLogs.filter(log => 
      (log as any).templateId === selectedTemplate.id
    ).slice(0, 20);
  }, [allAuditLogs, selectedTemplate]);

  const steps = [
    { id: 1, title: "Select Template", description: "Choose a baseline template from knowledge base" },
    { id: 2, title: "Review Template", description: "Review format or provide your own template" },
    { id: 3, title: "Upload Contract", description: "Upload your contract document" },
    { id: 4, title: "Contract Analysis", description: "Review suggested changes by Kroolo AI" },
    { id: 5, title: "Make Corrections", description: "Edit and finalize the document" }
  ];

  const handleTemplateSelect = (template: ContractTemplate) => {
    if (selectedTemplate?.id === template.id) {
      setSelectedTemplate(null);
      return;
    }
    setSelectedTemplate(template);
  };

  const handleAssetSelect = async (assets: any[]) => {
    if (!assets || assets.length === 0) {
      console.warn('No assets selected');
      return;
    }

    const asset = assets[0];
    console.log('📥 Asset selected:', asset.originalName, asset.url);
    
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
      
      console.log('✅ File created from asset:', file.name, file.type, file.size);
      setUploadedFile(file);
      setIsAssetPickerOpen(false);
    } catch (error) {
      console.error('❌ Error loading asset:', error);
      toastError('Asset Load Failed', error instanceof Error ? error.message : 'Failed to load selected asset');
    }
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
                  <div className={"grid " + (selectedTemplate ? 'grid-cols-3' : 'grid-cols-4') + " gap-4 p-1"}>
                    {knowledgeBaseTemplates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map((template) => {
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

        {/* Placeholder for other steps */}
        {currentStep !== 1 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Step {currentStep}</h2>
              <p className="text-gray-600">Content for this step will be implemented</p>
            </div>
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

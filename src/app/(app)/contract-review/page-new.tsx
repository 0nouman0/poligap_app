"use client";

import React, { useState } from "react";
import { Shield, BookOpen, Award, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
    id: "nda",
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
    id: "dpa",
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
    id: "sla",
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
  }
];

export default function ContractReviewNew() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTemplates = knowledgeBaseTemplates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="min-h-screen bg-[#FAFAFB] select-none">
      {/* Header */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
            <Shield className="h-6 w-6 text-[#3B43D6]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-[#2D2F34]">Contract Review</h1>
            <p className="text-xs text-[#6A707C]">Upload contracts and get AI-powered analysis against reference templates</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between max-w-[800px]">
          <div className="text-left">
            <h2 className="text-base font-semibold text-[#2D2F34] mb-1">Choose a baseline template from knowledge base</h2>
            <p className="text-xs text-[#6A707C]">40 templates</p>
          </div>
          
          {/* Step Indicators */}
          <div className="flex items-center gap-4">
            {/* Step 01 - Active */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#3B43D6] flex items-center justify-center text-white text-base font-semibold">
                01
              </div>
              <div className="w-16 h-px bg-[#A0A8C2] border-t border-dashed border-[#A0A8C2]" />
            </div>
            
            {/* Step 02 */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white border border-[#D9D9D9] flex items-center justify-center text-[#717171] text-base font-semibold">
                02
              </div>
              <div className="w-16 h-px bg-[#A0A8C2] border-t border-dashed border-[#A0A8C2]" />
            </div>
            
            {/* Step 03 */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white border border-[#D9D9D9] flex items-center justify-center text-[#717171] text-base font-semibold">
                03
              </div>
              <div className="w-16 h-px bg-[#A0A8C2] border-t border-dashed border-[#A0A8C2]" />
            </div>
            
            {/* Step 04 */}
            <div className="w-10 h-10 rounded-full bg-white border border-[#D9D9D9] flex items-center justify-center text-[#717171] text-base font-semibold">
              04
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6">
        <div className="flex gap-6">
          {/* Left Side - Template Selection */}
          <div className="flex-1">
            {/* Contract Templates Card */}
            <div className="bg-white rounded-[10px] shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-[#000000]">Contract Templates</h3>
                <div className="relative">
                  <Input
                    placeholder="Search Template..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-[279px] h-8 text-xs pl-8 bg-white border-[#E4E4E4] rounded-[5px] select-text"
                  />
                  <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path d="M5.5 9.5C7.70914 9.5 9.5 7.70914 9.5 5.5C9.5 3.29086 7.70914 1.5 5.5 1.5C3.29086 1.5 1.5 3.29086 1.5 5.5C1.5 7.70914 3.29086 9.5 5.5 9.5Z" stroke="#8D8D8D" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10.5 10.5L8.5 8.5" stroke="#8D8D8D" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              
              <div className="text-xs font-medium text-[#000000] mb-2">
                Select a baseline template that has been reviewed and approved by legal experts. Your uploaded contract will be compared against this template to identify gaps and weaknesses.
              </div>
              
              {/* Template Cards Horizontal Scroll */}
              <div className="overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="flex gap-[30px]">
                  {filteredTemplates.map((template) => {
                    const isSelected = selectedTemplate?.id === template.id;
                    return (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`min-w-[330px] max-w-[330px] bg-white rounded-[10px] shadow-sm cursor-pointer transition-all ${
                          isSelected ? 'border-2 border-[#3B43D6] ring-1 ring-[#3B43D6]' : 'border border-transparent hover:border-[#3B43D6]/50'
                        }`}
                      >
                        <div className="p-[18px]">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-full bg-[#EFF1F6] flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-[#3B43D6]" />
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="bg-[#EDFFDE] rounded-[35px] px-2.5 py-1 flex items-center gap-1">
                                <Award className="h-3.5 w-3.5 text-[#47AF47]" />
                                <span className="text-xs font-medium text-[#47AF47]">Baseline</span>
                              </div>
                              <CheckCircle className="h-6 w-6 text-[#DADADA]" />
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <h4 className="text-base font-semibold text-[#000000] mb-1 opacity-70">{template.name}</h4>
                            <p className="text-xs text-[#030229] opacity-70">{template.description}</p>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="text-xs font-semibold text-[#000000] opacity-70">
                              Sections: {template.sections}
                            </div>
                            <div className="text-xs font-semibold text-[#000000] opacity-70">
                              Sources: {template.sources.join(", ")}
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <div className="bg-[#EFF1F6] rounded-[40px] px-2.5 py-1">
                                <span className="text-xs font-medium text-[#000000] opacity-70">Parties</span>
                              </div>
                              <div className="bg-[#EFF1F6] rounded-[40px] px-2.5 py-1">
                                <span className="text-xs font-medium text-[#000000] opacity-70">Scope of Services</span>
                              </div>
                              <div className="bg-[#EFF1F6] rounded-[40px] px-2.5 py-1">
                                <span className="text-xs font-medium text-[#000000] opacity-70">Parties</span>
                              </div>
                              <div className="bg-[#EFF1F6] rounded-[40px] px-2.5 py-1">
                                <span className="text-xs font-medium text-[#000000] opacity-70">Payment Terms</span>
                              </div>
                              <div className="bg-[#EFF1F6] rounded-[40px] px-2.5 py-1">
                                <span className="text-xs font-medium text-[#000000] opacity-70">+2 more</span>
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
            <div className="w-[380px] space-y-6">
              {/* Template Details Card */}
              <div className="bg-white rounded-[10px] shadow-sm p-6">
                <h3 className="text-lg font-semibold text-[#2D2F34] mb-2">
                  Selected Template: Master Services Agreement
                </h3>
                
                {/* Required Sections */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-[#2D2F34] mb-4">Required Sections:</h4>
                  <div className="space-y-5">
                    {selectedTemplate.requiredSections.map((section, index) => (
                      <div key={index} className="flex items-center gap-3.5">
                        <CheckCircle className="h-[18px] w-[18px] text-[#47AF47] flex-shrink-0" />
                        <span className="text-base font-medium text-[#2D2F34]">{section.title}</span>
                        <span className={`ml-auto rounded-[35px] px-2.5 py-1 text-xs font-medium ${getPriorityBadgeColor(section.priority)}`}>
                          {section.priority.charAt(0).toUpperCase() + section.priority.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What We'll Check */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-[#2D2F34] mb-4">What We'll Check:</h4>
                  <div className="space-y-5">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="h-[18px] w-[18px] text-[#47AF47] flex-shrink-0" />
                      <span className="text-base font-medium text-[#2D2F34]">Missing required sections</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="h-[18px] w-[18px] text-[#47AF47] flex-shrink-0" />
                      <span className="text-base font-medium text-[#2D2F34]">Weak or incomplete clauses</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="h-[18px] w-[18px] text-[#47AF47] flex-shrink-0" />
                      <span className="text-base font-medium text-[#2D2F34]">Non-compliant language</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="h-[18px] w-[18px] text-[#47AF47] flex-shrink-0" />
                      <span className="text-base font-medium text-[#2D2F34]">Risk exposure areas</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Logs Card */}
              <div className="bg-white rounded-[10px] shadow-sm p-6">
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-[#2D2F34] mb-1">Audit Logs</h4>
                  <p className="text-xs text-[#6A707C]">Recent activity for template "Master Services Agreement"</p>
                </div>
                
                <div className="h-[76.82px] flex items-center justify-center">
                  <div className="text-xs text-[#6A707C]">No logs yet for this template.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-8 right-8 flex gap-4">
        <button
          className="h-9 px-2.5 bg-[#FAFAFA] border border-[#717171] rounded-[5px] flex items-center gap-1 text-xs font-semibold text-[#717171] hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
          Previous
        </button>
        
        <button
          disabled={!selectedTemplate}
          className="h-9 px-4 bg-[#3B43D6] rounded-[5px] flex items-center gap-1 text-xs font-semibold text-white hover:bg-[#2F36B0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Horizontal Line Separator */}
      <div className="absolute bottom-20 left-6 right-6">
        <div className="h-px bg-[#DADADA]" />
      </div>
    </div>
  );
}

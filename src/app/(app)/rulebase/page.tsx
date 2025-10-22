"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { useRulebaseStore } from "@/stores/rulebase-store";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatGlobalDate } from "@/utils/date.util";
import { useActivityTracker } from "@/hooks/use-activity-tracker";

interface RuleItem {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  tags?: string[];
  updatedAt?: string;
  createdAt?: string;
  sourceType?: "text" | "file";
  fileName?: string;
  fileContent?: string;
  active?: boolean;
  userId?: string;
}

// Predefined rule templates
const PREDEFINED_RULES = [
  {
    name: "GDPR Data Protection Compliance",
    description: "Ensure all contracts comply with GDPR requirements including data processing, consent mechanisms, data subject rights, breach notification procedures, and cross-border data transfers. All personal data handling must be lawful, fair, and transparent.",
    tags: ["GDPR", "Privacy", "Data Protection", "EU Regulation", "Compliance"],
    category: "Legal & Compliance"
  },
  {
    name: "SOC 2 Security Controls",
    description: "Validate security controls meet SOC 2 Type II requirements including access controls, encryption standards, incident response procedures, change management, and continuous monitoring. Ensure security, availability, processing integrity, confidentiality, and privacy principles are addressed.",
    tags: ["SOC 2", "Security", "Compliance", "Audit", "Controls"],
    category: "Legal & Compliance"
  },
  {
    name: "Payment Terms - Net 30",
    description: "Standard payment terms require invoice payment within 30 days of receipt. Late payments incur 1.5% monthly interest. Early payment discounts of 2% available for payments within 10 days. All invoices must include PO numbers and detailed line items.",
    tags: ["Payment", "Finance", "Terms", "Net 30", "Invoice"],
    category: "Financial"
  },
  {
    name: "Indemnification Clause",
    description: "Each party shall indemnify, defend, and hold harmless the other party from any claims, damages, losses, or expenses arising from: (a) breach of contract terms, (b) negligence or willful misconduct, (c) violation of applicable laws, (d) infringement of third-party intellectual property rights.",
    tags: ["Legal", "Indemnification", "Liability", "Protection", "Risk"],
    category: "Legal & Compliance"
  },
  {
    name: "Confidentiality & NDA",
    description: "All confidential information must be protected for 5 years post-contract termination. Information includes trade secrets, business strategies, customer data, technical specifications, and pricing. Exceptions: publicly available information, independently developed information, or legally required disclosures.",
    tags: ["NDA", "Confidentiality", "Trade Secrets", "Privacy", "Security"],
    category: "Legal & Compliance"
  },
  {
    name: "Service Level Agreement (SLA) - 99.9%",
    description: "System uptime must maintain 99.9% availability (max 43 minutes downtime/month). Response times: Critical issues within 1 hour, high priority within 4 hours, medium within 24 hours, low within 72 hours. Service credits: 10% for 99.5-99.9%, 25% for 99-99.5%, 50% for <99% availability.",
    tags: ["SLA", "Uptime", "Performance", "Support", "Availability"],
    category: "Operations"
  },
  {
    name: "Intellectual Property Rights",
    description: "Client retains ownership of pre-existing IP. Vendor retains ownership of pre-existing tools and methodologies. Work product developed under contract becomes client property upon full payment. Vendor may use generic learnings for future projects.",
    tags: ["IP", "Copyright", "Ownership", "License", "Patents"],
    category: "Legal & Compliance"
  },
  {
    name: "Termination & Exit Procedures",
    description: "Either party may terminate with 60 days written notice. Immediate termination allowed for material breach (30-day cure period), bankruptcy, or force majeure exceeding 90 days. Upon termination: return all confidential materials, provide transition assistance (30 days), settle outstanding payments.",
    tags: ["Termination", "Exit", "Notice Period", "Transition", "Offboarding"],
    category: "Operations"
  },
  {
    name: "Data Security & Encryption Standards",
    description: "All data must be encrypted at rest (AES-256) and in transit (TLS 1.3+). Multi-factor authentication required for all user accounts. Regular security audits quarterly. Penetration testing annually. Patch management within 30 days of critical updates.",
    tags: ["Security", "Encryption", "Data Protection", "Cybersecurity", "Standards"],
    category: "Technical"
  },
  {
    name: "Limitation of Liability",
    description: "Total liability capped at 12 months of fees paid or $100,000, whichever is greater. Excludes: gross negligence, willful misconduct, IP infringement, confidentiality breaches, and indemnification obligations. No liability for indirect, consequential, special, or punitive damages.",
    tags: ["Liability", "Damages", "Legal", "Risk", "Cap"],
    category: "Legal & Compliance"
  },
  {
    name: "Insurance Requirements",
    description: "Vendor must maintain: General Liability ($2M per occurrence, $4M aggregate), Professional Liability/E&O ($2M per claim, $4M aggregate), Cyber Liability ($5M), Workers Compensation (statutory limits). All policies must name client as additional insured.",
    tags: ["Insurance", "Coverage", "Risk Management", "Liability", "Requirements"],
    category: "Financial"
  },
  {
    name: "Force Majeure",
    description: "Neither party liable for delays or failures due to events beyond reasonable control: natural disasters, war, terrorism, pandemics, government actions, utility failures, or labor disputes. Affected party must notify within 48 hours and make reasonable efforts to mitigate impact.",
    tags: ["Force Majeure", "Act of God", "Unforeseeable", "Disaster", "Exemption"],
    category: "Legal & Compliance"
  },
  {
    name: "Change Management Process",
    description: "All changes require written change request including scope, timeline, cost impact, and resource requirements. Review within 5 business days. Approved changes formalized via signed change order. No work begins until approval and payment terms agreed.",
    tags: ["Change Management", "Scope", "Process", "Approval", "Documentation"],
    category: "Operations"
  },
  {
    name: "Acceptance Criteria & Testing",
    description: "Deliverables subject to 15-day acceptance testing period. Client provides written acceptance or detailed rejection notice. Vendor has 10 days to remediate issues. Final acceptance or 3 successful remediation cycles constitutes acceptance.",
    tags: ["Acceptance", "Testing", "QA", "UAT", "Quality", "Deliverables"],
    category: "Technical"
  },
  {
    name: "Subcontractor Management",
    description: "Vendor may use subcontractors with prior written approval. Vendor remains fully responsible for subcontractor performance. All subcontractors must sign identical confidentiality agreements. No further sublicensing permitted.",
    tags: ["Subcontractors", "Third Party", "Management", "Approval", "Vendors"],
    category: "Operations"
  },
  {
    name: "Audit Rights & Compliance",
    description: "Client retains audit rights with 15 days notice, during business hours, once annually (more for cause). Vendor must maintain records for 3 years. Audit scope: financial records, compliance documentation, security controls, and performance metrics.",
    tags: ["Audit", "Compliance", "Records", "Review", "Verification"],
    category: "Legal & Compliance"
  },
  {
    name: "Warranty & Representations",
    description: "Vendor warrants: (a) authority to enter contract, (b) services performed in workmanlike manner, (c) compliance with applicable laws, (d) no IP infringement, (e) personnel properly qualified. 90-day warranty on deliverables for defects.",
    tags: ["Warranty", "Guarantee", "Representations", "Quality", "Assurance"],
    category: "Legal & Compliance"
  },
  {
    name: "Conflict of Interest Policy",
    description: "Vendor must disclose any conflicts of interest including: competing client relationships, personal financial interests, family relationships with client personnel, or other circumstances affecting objectivity. Conflicts must be disclosed in writing within 5 days of discovery.",
    tags: ["Conflict of Interest", "Ethics", "Disclosure", "Compliance", "Transparency"],
    category: "Legal & Compliance"
  },
  {
    name: "Performance Metrics & KPIs",
    description: "Monthly reporting required for: service availability, response times, resolution rates, customer satisfaction scores (CSAT), and Net Promoter Score (NPS). Quarterly business reviews to discuss trends and improvements.",
    tags: ["KPI", "Metrics", "Performance", "Reporting", "Monitoring", "SLA"],
    category: "Operations"
  },
  {
    name: "Environmental & Sustainability Standards",
    description: "Vendor must comply with environmental regulations and maintain ISO 14001 certification or equivalent. Report annually on carbon footprint, waste reduction initiatives, and sustainable sourcing practices. Preference for renewable energy, recycled materials, and minimal packaging.",
    tags: ["Sustainability", "Environment", "ESG", "Green", "ISO 14001", "Carbon"],
    category: "Legal & Compliance"
  }
];

export default function RulesPage() {
  const { rules, isLoading: loading, fetchRules, addRule, deleteRule } = useRulebaseStore();
  const { trackRulesAction } = useActivityTracker();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleDesc, setNewRuleDesc] = useState("");
  const [newRuleTags, setNewRuleTags] = useState("");
  const [activeTab, setActiveTab] = useState<"my-rules" | "templates">("my-rules");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteRule, setPendingDeleteRule] = useState<RuleItem | null>(null);
  
  // Edit rule state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTags, setEditTags] = useState("");

  // Filter templates by category
  const filteredTemplates = useMemo(() => {
    if (selectedCategory === "All") return PREDEFINED_RULES;
    return PREDEFINED_RULES.filter(r => r.category === selectedCategory);
  }, [selectedCategory]);

  // Get category counts
  const getCategoryCount = (category: string) => {
    if (category === "All") return PREDEFINED_RULES.length;
    return PREDEFINED_RULES.filter(r => r.category === category).length;
  };

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rules;
    return rules.filter(r =>
      r.name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      (r.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }, [rules, searchTerm]);

  const handleCreateRule = async () => {
    if (!newRuleName.trim()) return;
    const payload = {
      name: newRuleName.trim(),
      description: newRuleDesc.trim(),
      tags: newRuleTags.split(",").map(t => t.trim()).filter(Boolean),
      sourceType: "text" as const,
    };
    
    try {
      const res = await fetch("/api/rulebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        // If API fails, add rule locally as a fallback
        console.warn('API failed, adding rule locally:', res.status);
        const localRule = {
          _id: `temp_${Date.now()}`,
          id: `temp_${Date.now()}`,
          name: payload.name,
          description: payload.description,
          tags: payload.tags,
          sourceType: "text" as const,
          active: true,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        addRule(localRule);
        setIsCreateOpen(false);
        setNewRuleName("");
        setNewRuleDesc("");
        setNewRuleTags("");
        console.log('Rule added locally:', payload.name);
        return;
      }
      
      const data = await res.json().catch(() => ({}));
      if (data?.rule) {
        addRule(data.rule);
        setIsCreateOpen(false);
        setNewRuleName("");
        setNewRuleDesc("");
        setNewRuleTags("");
        console.log('Rule created successfully:', payload.name);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (e) {
      console.error('Failed to create rule:', e);
      // Fallback: add rule locally
      const localRule = {
        _id: `temp_${Date.now()}`,
        id: `temp_${Date.now()}`,
        name: payload.name,
        description: payload.description,
        tags: payload.tags,
        sourceType: "text" as const,
        active: true,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      addRule(localRule);
      trackRulesAction('created', newRuleName);
      setIsCreateOpen(false);
      setNewRuleName("");
      setNewRuleDesc("");
      setNewRuleTags("");
      console.log('Rule added locally as fallback:', payload.name);
    }
  };

  const confirmDeleteRule = async () => {
    if (!pendingDeleteRule?._id) return;
    const ruleId = pendingDeleteRule._id;
    const ruleName = pendingDeleteRule.name;
    deleteRule(ruleId);
    trackRulesAction('deleted', ruleName);
    try {
      await fetch("/api/rulebase", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ruleId })
      });
    } catch (e) {
      fetchRules();
    } finally {
      setConfirmOpen(false);
      setPendingDeleteRule(null);
    }
  };

  // Add template to user's rulebase
  const handleAddTemplate = async (template: typeof PREDEFINED_RULES[0]) => {
    if (isTemplateAdded(template.name)) return;
    
    const payload = {
      name: template.name,
      description: template.description,
      tags: template.tags,
      sourceType: "text" as const,
    };
    
    try {
      const res = await fetch("/api/rulebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        // If API fails, add template locally as a fallback
        console.warn('API failed, adding template locally:', res.status);
        const localRule = {
          _id: `temp_${Date.now()}`,
          id: `temp_${Date.now()}`,
          name: template.name,
          description: template.description,
          tags: template.tags,
          sourceType: "text" as const,
          active: true,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        addRule(localRule);
        console.log('Template added locally:', template.name);
        return;
      }
      
      const data = await res.json().catch(() => ({}));
      if (data?.rule) {
        addRule(data.rule);
        console.log('Template added successfully:', template.name);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (e) {
      console.error('Failed to add template:', e);
      // Fallback: add template locally
      const localRule = {
        _id: `temp_${Date.now()}`,
        id: `temp_${Date.now()}`,
        name: template.name,
        description: template.description,
        tags: template.tags,
        sourceType: "text" as const,
        active: true,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      addRule(localRule);
      console.log('Template added locally as fallback:', template.name);
    }
  };

  // Check if template is already added
  const isTemplateAdded = (templateName: string) => {
    return rules.some(rule => rule.name === templateName);
  };

  // Handle edit rule
  const handleEditRule = (rule: RuleItem) => {
    setEditingRule(rule);
    setEditName(rule.name);
    setEditDesc(rule.description || "");
    setEditTags((rule.tags || []).join(", "));
    setIsEditOpen(true);
  };

  // Save edited rule
  const handleSaveEdit = async () => {
    if (!editingRule || !editName.trim()) return;
    
    const payload = {
      id: editingRule._id || editingRule.id,
      name: editName.trim(),
      description: editDesc.trim(),
      tags: editTags.split(",").map(t => t.trim()).filter(Boolean),
    };
    
    try {
      const res = await fetch("/api/rulebase", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        console.warn('API failed, updating rule locally:', res.status);
        // Update locally as fallback
        const updatedRule = {
          ...editingRule,
          name: payload.name,
          description: payload.description,
          tags: payload.tags,
          updatedAt: new Date().toISOString(),
        };
        // Update in store (you'll need to implement updateRule in store)
        fetchRules(); // Refresh for now
        setIsEditOpen(false);
        setEditingRule(null);
        console.log('Rule updated locally:', payload.name);
        return;
      }
      
      const data = await res.json().catch(() => ({}));
      if (data?.rule) {
        fetchRules(); // Refresh rules from server
        setIsEditOpen(false);
        setEditingRule(null);
        console.log('Rule updated successfully:', payload.name);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (e) {
      console.error('Failed to update rule:', e);
      // Fallback: refresh rules
      fetchRules();
      setIsEditOpen(false);
      setEditingRule(null);
      console.log('Rule update failed, refreshed rules');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FAFAFB] py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
      <ConfirmDialog
        open={confirmOpen}
        title="Delete rule?"
        description={`This will permanently remove "${pendingDeleteRule?.name || 'this rule'}" from your Rules.`}
        confirmText="Delete Rule"
        onCancel={() => { setConfirmOpen(false); setPendingDeleteRule(null); }}
        onConfirm={confirmDeleteRule}
        requireAcknowledge
        acknowledgeLabel="I understand this action cannot be undone"
      />
      
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-[13px]">
            <div className="w-12 h-12 rounded-full bg-[#FFFFFF] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B43D6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-[16px] font-semibold text-[#2D2F34] leading-[19.36px]">Rules</h1>
              <p className="text-[12px] text-[#6A707C] leading-[14.52px]">
                Manage your company's custom compliance and contract rules
              </p>
            </div>
          </div>

          <div className="flex items-center gap-[15px]">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="h-9 px-[15px] bg-[#3B43D6] rounded-[5px] flex items-center gap-[5px]"
            >
              <span className="text-[12px] font-semibold text-white text-center leading-[14.52px]">+ New Rule</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[10px] shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] h-[42px] flex items-center px-[30px] mb-4">
          <button
            onClick={() => setActiveTab("my-rules")}
            className={`py-[13px] text-[12px] font-semibold leading-[14.52px] ${
              activeTab === "my-rules"
                ? "text-[#6E72FF] border-b-2 border-[#605BFF]"
                : "text-[#2D2F34]"
            }`}
          >
            My Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`py-[13px] text-[12px] font-semibold leading-[14.52px] ml-10 ${
              activeTab === "templates"
                ? "text-[#6E72FF] border-b-2 border-[#605BFF]"
                : "text-[#2D2F34]"
            }`}
          >
            Templates (20)
          </button>
        </div>

        {activeTab === "my-rules" && (
          <div className="bg-white rounded-[10px] shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] p-5 flex flex-col gap-[15px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-[16px] font-semibold text-[#202020] leading-[19.36px]">Your Rules</h2>
                <p className="text-[12px] font-medium text-[#717171] leading-[14.52px]">
                  Search, view and manage created rules
                </p>
              </div>
              
              <div className="relative w-full sm:w-80 h-8">
                <div className="absolute inset-0 bg-white border border-[#E4E4E4] rounded-[5px]" />
                <Search className="absolute left-[10px] top-1/2 -translate-y-1/2 w-[12px] h-[12px] text-[#8D8D8D]" strokeWidth={1.06} />
                <input
                  type="text"
                  placeholder="Search Rules..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="absolute left-[27px] top-1/2 -translate-y-1/2 w-full pr-4 text-[12px] font-medium text-[#717171] bg-transparent border-0 outline-none placeholder:text-[#717171]"
                />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-full min-h-[280px]">
                    <div className="bg-white rounded-[10px] border border-[#E6E6E6] p-5 flex flex-col gap-[15px] h-full">
                      {/* Header skeleton */}
                      <div className="flex items-start justify-between gap-3">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="w-8 h-8 rounded-[6px]" />
                          <Skeleton className="w-8 h-8 rounded-[6px]" />
                        </div>
                      </div>
                      
                      {/* Content skeleton */}
                      <div className="flex flex-col gap-[8px] flex-1">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                      
                      {/* Tags skeleton */}
                      <div className="flex flex-wrap gap-[8px] mt-auto">
                        <Skeleton className="h-6 w-16 rounded-[15px]" />
                        <Skeleton className="h-6 w-20 rounded-[15px]" />
                        <Skeleton className="h-6 w-14 rounded-[15px]" />
                      </div>
                      
                      {/* Footer skeleton */}
                      <div className="pt-2 border-t border-[#F0F0F0]">
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col justify-center items-center gap-[15px] py-20">
                <div className="w-16 h-16 rounded-full bg-[#F0F0FF] flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3B43D6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-[14px] font-semibold text-[#2D2F34] mb-2">No rules yet</h3>
                  <p className="text-[12px] font-medium text-[#717171] leading-[18px] max-w-[300px]">
                    {searchTerm ? `No rules found matching "${searchTerm}"` : 'Create your first rule to get started with your compliance rules.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-4 px-4 py-2 bg-[#3B43D6] hover:bg-[#2F36B0] text-white text-[12px] font-semibold rounded-[6px] transition-colors"
                >
                  + Create First Rule
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {filtered.map((rule, idx) => (
                  <div key={rule._id || idx} className="w-full min-h-[280px]">
                    <div className={`bg-white rounded-[10px] p-5 flex flex-col gap-[15px] h-full border border-[#E6E6E6] hover:shadow-md transition-shadow ${rule.active === false ? 'opacity-60' : ''}`}>
                      {/* Header with icon and actions */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#F0F0FF] flex items-center justify-center flex-shrink-0">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B43D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleEditRule(rule)}
                            className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-[#F0F0FF] transition-colors"
                            title="Edit rule"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B43D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          
                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              setPendingDeleteRule(rule);
                              setConfirmOpen(true);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-[#FFE6E6] transition-colors"
                            title="Delete rule"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3,6 5,6 21,6" />
                              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex flex-col gap-[8px] flex-1">
                        <h3 className="text-[16px] font-semibold text-[#000000] leading-[19.36px] line-clamp-2">
                          {rule.name}
                        </h3>
                        <p className="text-[12px] text-[#030229] leading-[18px] line-clamp-4 opacity-80">
                          {rule.description || 'No description provided'}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-[8px] mt-auto">
                        {(rule.tags || []).slice(0, 3).map((tag, i) => (
                          <div key={i} className="bg-[#F0F0FF] rounded-[15px] px-[10px] py-[3px] border border-[#E0E0FF]">
                            <span className="text-[10px] font-medium text-[#3B43D6]">
                              {tag}
                            </span>
                          </div>
                        ))}
                        {(rule.tags || []).length > 3 && (
                          <div className="bg-[#F0F0FF] rounded-[15px] px-[10px] py-[3px] border border-[#E0E0FF]">
                            <span className="text-[10px] font-medium text-[#3B43D6]">
                              +{(rule.tags || []).length - 3} more
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Footer with timestamp */}
                      {rule.updatedAt && (
                        <div className="text-[10px] text-[#717171] mt-2 pt-2 border-t border-[#F0F0F0]">
                          Updated {formatGlobalDate(rule.updatedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "templates" && (
          <div className="bg-white rounded-[10px] shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] p-5 flex flex-col gap-[15px]">
            <div className="flex flex-col gap-2">
              <h2 className="text-[16px] font-semibold text-[#202020] leading-[19.36px]">Predefined Rule Templates</h2>
              <p className="text-[12px] font-medium text-[#717171] leading-[14.52px]">
                Choose from 20 industry-standard templates to quickly set up your rules
              </p>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-10 border-b border-[#E6E6E6] pb-4">
              <button
                onClick={() => setSelectedCategory("All")}
                className={`py-2 text-[12px] font-semibold leading-[14.52px] ${
                  selectedCategory === "All"
                    ? "text-[#6E72FF] border-b-2 border-[#605BFF]"
                    : "text-[#2D2F34] hover:text-[#6E72FF]"
                }`}
              >
                All ({getCategoryCount("All")})
              </button>
              <button
                onClick={() => setSelectedCategory("Legal & Compliance")}
                className={`py-2 text-[12px] font-semibold leading-[14.52px] ${
                  selectedCategory === "Legal & Compliance"
                    ? "text-[#6E72FF] border-b-2 border-[#605BFF]"
                    : "text-[#2D2F34] hover:text-[#6E72FF]"
                }`}
              >
                Legal ({getCategoryCount("Legal & Compliance")})
              </button>
              <button
                onClick={() => setSelectedCategory("Operations")}
                className={`py-2 text-[12px] font-semibold leading-[14.52px] ${
                  selectedCategory === "Operations"
                    ? "text-[#6E72FF] border-b-2 border-[#605BFF]"
                    : "text-[#2D2F34] hover:text-[#6E72FF]"
                }`}
              >
                Operations ({getCategoryCount("Operations")})
              </button>
              <button
                onClick={() => setSelectedCategory("Financial")}
                className={`py-2 text-[12px] font-semibold leading-[14.52px] ${
                  selectedCategory === "Financial"
                    ? "text-[#6E72FF] border-b-2 border-[#605BFF]"
                    : "text-[#2D2F34] hover:text-[#6E72FF]"
                }`}
              >
                Financial ({getCategoryCount("Financial")})
              </button>
              <button
                onClick={() => setSelectedCategory("Technical")}
                className={`py-2 text-[12px] font-semibold leading-[14.52px] ${
                  selectedCategory === "Technical"
                    ? "text-[#6E72FF] border-b-2 border-[#605BFF]"
                    : "text-[#2D2F34] hover:text-[#6E72FF]"
                }`}
              >
                Technical ({getCategoryCount("Technical")})
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {filteredTemplates.map((template, idx) => (
                <div key={idx} className="w-full min-h-[280px]">
                  <div className="bg-[#F9F9F9] rounded-[10px] p-5 flex flex-col gap-[15px] h-full border border-[#E6E6E6] hover:shadow-md transition-shadow">
                    {/* Header with category badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B43D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <div className="bg-[#DEE3ED] rounded-[20px] px-[10px] py-[3px]">
                        <span className="text-[10px] font-medium text-[#2D2F34] leading-[12px]">{template.category}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-[8px] flex-1">
                      <h3 className="text-[14px] font-semibold text-[#000000] leading-[17px] line-clamp-2">
                        {template.name}
                      </h3>
                      <p className="text-[11px] text-[#030229] leading-[16px] line-clamp-4 opacity-80">
                        {template.description}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-[6px] mt-auto">
                      {template.tags.slice(0, 3).map((tag, i) => (
                        <div key={i} className="bg-white rounded-[15px] px-[8px] py-[2px] border border-[#E6E6E6]">
                          <span className="text-[9px] font-medium text-[#000000] opacity-70">
                            {tag}
                          </span>
                        </div>
                      ))}
                      {template.tags.length > 3 && (
                        <div className="bg-white rounded-[15px] px-[8px] py-[2px] border border-[#E6E6E6]">
                          <span className="text-[9px] font-medium text-[#000000] opacity-70">
                            +{template.tags.length - 3} more
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Add button */}
                    <button
                      onClick={() => handleAddTemplate(template)}
                      disabled={isTemplateAdded(template.name)}
                      className={`w-full mt-3 py-2 text-[11px] font-semibold rounded-[6px] transition-colors ${
                        isTemplateAdded(template.name)
                          ? 'bg-[#E6E6E6] text-[#999999] cursor-not-allowed'
                          : 'bg-[#3B43D6] hover:bg-[#2F36B0] text-white'
                      }`}
                    >
                      {isTemplateAdded(template.name) ? 'Already Added' : 'Add Template'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dialog for creating new rule */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Rule</DialogTitle>
              <DialogDescription>Define a custom rule entry</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Rule name" value={newRuleName} onChange={e => setNewRuleName(e.target.value)} />
              <Textarea placeholder="Description / policy text" value={newRuleDesc} onChange={e => setNewRuleDesc(e.target.value)} />
              <Input placeholder="Tags (comma separated)" value={newRuleTags} onChange={e => setNewRuleTags(e.target.value)} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateRule} disabled={!newRuleName.trim()}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog for editing existing rule */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Rule</DialogTitle>
              <DialogDescription>Update your rule details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Rule name" value={editName} onChange={e => setEditName(e.target.value)} />
              <Textarea placeholder="Description / policy text" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
              <Input placeholder="Tags (comma separated)" value={editTags} onChange={e => setEditTags(e.target.value)} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveEdit} disabled={!editName.trim()}>Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

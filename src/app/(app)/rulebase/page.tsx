"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Plus, FileText, Tag, Trash2, Download, Search, Pencil, Sparkles, BookOpen, Loader2, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useRulebaseStore } from "@/stores/rulebase-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";

interface RuleItem {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  tags?: string[];
  updatedAt?: string;
  createdAt?: string;
  sourceType?: "manual" | "file" | "api" | "text";
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
    description: "Each party shall indemnify, defend, and hold harmless the other party from any claims, damages, losses, or expenses arising from: (a) breach of contract terms, (b) negligence or willful misconduct, (c) violation of applicable laws, (d) infringement of third-party intellectual property rights. Indemnification excludes claims resulting from the indemnified party's own negligence.",
    tags: ["Legal", "Indemnification", "Liability", "Protection", "Risk"],
    category: "Legal & Compliance"
  },
  {
    name: "Confidentiality & NDA",
    description: "All confidential information must be protected for 5 years post-contract termination. Information includes trade secrets, business strategies, customer data, technical specifications, and pricing. Exceptions: publicly available information, independently developed information, or legally required disclosures. Breaches may result in immediate termination and legal action.",
    tags: ["NDA", "Confidentiality", "Trade Secrets", "Privacy", "Security"],
    category: "Legal & Compliance"
  },
  {
    name: "Service Level Agreement (SLA) - 99.9%",
    description: "System uptime must maintain 99.9% availability (max 43 minutes downtime/month). Response times: Critical issues within 1 hour, high priority within 4 hours, medium within 24 hours, low within 72 hours. Service credits: 10% for 99.5-99.9%, 25% for 99-99.5%, 50% for <99% availability. Excludes scheduled maintenance and force majeure events.",
    tags: ["SLA", "Uptime", "Performance", "Support", "Availability"],
    category: "Operations"
  },
  {
    name: "Intellectual Property Rights",
    description: "Client retains ownership of pre-existing IP. Vendor retains ownership of pre-existing tools and methodologies. Work product developed under contract becomes client property upon full payment. Vendor may use generic learnings for future projects. Each party grants necessary licenses for contract performance. No sublicensing without written consent.",
    tags: ["IP", "Copyright", "Ownership", "License", "Patents"],
    category: "Legal & Compliance"
  },
  {
    name: "Termination & Exit Procedures",
    description: "Either party may terminate with 60 days written notice. Immediate termination allowed for material breach (30-day cure period), bankruptcy, or force majeure exceeding 90 days. Upon termination: return all confidential materials, provide transition assistance (30 days), settle outstanding payments, and grant data export capabilities. Survival clauses: confidentiality, indemnification, payment obligations.",
    tags: ["Termination", "Exit", "Notice Period", "Transition", "Offboarding"],
    category: "Operations"
  },
  {
    name: "Data Security & Encryption Standards",
    description: "All data must be encrypted at rest (AES-256) and in transit (TLS 1.3+). Multi-factor authentication required for all user accounts. Regular security audits quarterly. Penetration testing annually. Patch management within 30 days of critical updates. Security incident notification within 24 hours. Annual security awareness training for all personnel.",
    tags: ["Security", "Encryption", "Data Protection", "Cybersecurity", "Standards"],
    category: "Technical"
  },
  {
    name: "Limitation of Liability",
    description: "Total liability capped at 12 months of fees paid or $100,000, whichever is greater. Excludes: gross negligence, willful misconduct, IP infringement, confidentiality breaches, and indemnification obligations. No liability for indirect, consequential, special, or punitive damages including lost profits, data loss, or business interruption.",
    tags: ["Liability", "Damages", "Legal", "Risk", "Cap"],
    category: "Legal & Compliance"
  },
  {
    name: "Insurance Requirements",
    description: "Vendor must maintain: General Liability ($2M per occurrence, $4M aggregate), Professional Liability/E&O ($2M per claim, $4M aggregate), Cyber Liability ($5M), Workers Compensation (statutory limits). All policies must name client as additional insured. Certificates of insurance due within 10 days of contract execution and annually thereafter.",
    tags: ["Insurance", "Coverage", "Risk Management", "Liability", "Requirements"],
    category: "Financial"
  },
  {
    name: "Force Majeure",
    description: "Neither party liable for delays or failures due to events beyond reasonable control: natural disasters, war, terrorism, pandemics, government actions, utility failures, or labor disputes. Affected party must notify within 48 hours and make reasonable efforts to mitigate impact. Performance obligations suspended during force majeure. If exceeding 90 days, either party may terminate without penalty.",
    tags: ["Force Majeure", "Act of God", "Unforeseeable", "Disaster", "Exemption"],
    category: "Legal & Compliance"
  },
  {
    name: "Change Management Process",
    description: "All changes require written change request including scope, timeline, cost impact, and resource requirements. Review within 5 business days. Approved changes formalized via signed change order. No work begins until approval and payment terms agreed. Changes may affect delivery dates and costs. Emergency changes require verbal approval with written confirmation within 24 hours.",
    tags: ["Change Management", "Scope", "Process", "Approval", "Documentation"],
    category: "Operations"
  },
  {
    name: "Acceptance Criteria & Testing",
    description: "Deliverables subject to 15-day acceptance testing period. Client provides written acceptance or detailed rejection notice. Vendor has 10 days to remediate issues. Final acceptance or 3 successful remediation cycles constitutes acceptance. Payment tied to acceptance milestones. Testing environments must mirror production. User acceptance testing (UAT) includes functionality, performance, and security validation.",
    tags: ["Acceptance", "Testing", "QA", "UAT", "Quality", "Deliverables"],
    category: "Technical"
  },
  {
    name: "Subcontractor Management",
    description: "Vendor may use subcontractors with prior written approval. Vendor remains fully responsible for subcontractor performance. All subcontractors must sign identical confidentiality agreements. No further sublicensing permitted. Vendor liable for subcontractor compliance with contract terms. Client may reject specific subcontractors with reasonable cause.",
    tags: ["Subcontractors", "Third Party", "Management", "Approval", "Vendors"],
    category: "Operations"
  },
  {
    name: "Audit Rights & Compliance",
    description: "Client retains audit rights with 15 days notice, during business hours, once annually (more for cause). Vendor must maintain records for 3 years. Audit scope: financial records, compliance documentation, security controls, and performance metrics. If audit reveals >5% overcharges, vendor pays audit costs. Vendor must remediate findings within 30 days.",
    tags: ["Audit", "Compliance", "Records", "Review", "Verification"],
    category: "Legal & Compliance"
  },
  {
    name: "Warranty & Representations",
    description: "Vendor warrants: (a) authority to enter contract, (b) services performed in workmanlike manner, (c) compliance with applicable laws, (d) no IP infringement, (e) personnel properly qualified. 90-day warranty on deliverables for defects. Warranty excludes issues from client modifications, misuse, or unauthorized changes. Sole remedy: repair or replace defective services.",
    tags: ["Warranty", "Guarantee", "Representations", "Quality", "Assurance"],
    category: "Legal & Compliance"
  },
  {
    name: "Conflict of Interest Policy",
    description: "Vendor must disclose any conflicts of interest including: competing client relationships, personal financial interests, family relationships with client personnel, or other circumstances affecting objectivity. Conflicts must be disclosed in writing within 5 days of discovery. Client may waive or require mitigation measures. Material undisclosed conflicts grounds for immediate termination.",
    tags: ["Conflict of Interest", "Ethics", "Disclosure", "Compliance", "Transparency"],
    category: "Legal & Compliance"
  },
  {
    name: "Performance Metrics & KPIs",
    description: "Monthly reporting required for: service availability, response times, resolution rates, customer satisfaction scores (CSAT), and Net Promoter Score (NPS). Quarterly business reviews to discuss trends and improvements. Performance below agreed thresholds triggers improvement plans. Persistent underperformance may result in service credits or contract termination.",
    tags: ["KPI", "Metrics", "Performance", "Reporting", "Monitoring", "SLA"],
    category: "Operations"
  },
  {
    name: "Environmental & Sustainability Standards",
    description: "Vendor must comply with environmental regulations and maintain ISO 14001 certification or equivalent. Report annually on carbon footprint, waste reduction initiatives, and sustainable sourcing practices. Preference for renewable energy, recycled materials, and minimal packaging. E-waste disposal following local regulations. Support client's sustainability goals and reporting requirements.",
    tags: ["Sustainability", "Environment", "ESG", "Green", "ISO 14001", "Carbon"],
    category: "Legal & Compliance"
  }
];

// Group rules by category
const RULE_CATEGORIES = Array.from(new Set(PREDEFINED_RULES.map(r => r.category)));

export default function RuleBasePage() {
  // Use Zustand store for rulebase with caching
  const { rules, isLoading: loading, fetchRules, updateRule: updateRuleInStore, addRule: addRuleToStore, deleteRule: deleteRuleFromStore } = useRulebaseStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleDesc, setNewRuleDesc] = useState("");
  const [newRuleTags, setNewRuleTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editRuleId, setEditRuleId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTags, setEditTags] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [addingTemplates, setAddingTemplates] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"my-rules" | "templates">("my-rules");
  // Dual-check delete dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteRule, setPendingDeleteRule] = useState<RuleItem | null>(null);

  // Fetch rules using Zustand store (with caching)
  useEffect(() => {
    fetchRules(); // Will use cache if valid
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

  const toggleActive = async (rule: RuleItem, next: boolean) => {
    if (!rule._id) return;
    const prev = rule.active !== false;
    // optimistic update in store
    updateRuleInStore(rule._id, { active: next });
    try {
      const res = await fetch("/api/rulebase", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule._id, active: next })
      });
      if (!res.ok) throw new Error("patch failed");
      const data = await res.json().catch(() => ({}));
      if (!data?.rule) throw new Error("no rule in response");
      updateRuleInStore(rule._id, data.rule);
    } catch (e) {
      // revert on failure
      updateRuleInStore(rule._id, { active: prev });
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", files[0]);
      const res = await fetch("/api/rulebase/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.rule) {
        addRuleToStore(data.rule);
      }
    } catch (e) {
      // swallow errors for now
    } finally {
      setUploading(false);
    }
  };

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
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.rule) {
        addRuleToStore(data.rule);
        setIsCreateOpen(false);
        setNewRuleName("");
        setNewRuleDesc("");
        setNewRuleTags("");
      }
    } catch {}
  };

  // Edit/Delete helpers
  const openEdit = (rule: RuleItem) => {
    setEditRuleId(rule._id || null);
    setEditName(rule.name || "");
    setEditDesc(rule.description || "");
    setEditTags((rule.tags || []).join(", "));
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editRuleId) return;
    const payload: any = {
      id: editRuleId,
      name: editName.trim(),
      description: editDesc.trim(),
      tags: editTags.split(",").map(t => t.trim()).filter(Boolean),
    };
    try {
      const res = await fetch("/api/rulebase", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.rule) {
        updateRuleInStore(editRuleId, data.rule);
        setIsEditOpen(false);
      }
    } catch {}
  };

  const requestDelete = (rule: RuleItem) => {
    if (!rule?._id) return;
    setPendingDeleteRule(rule);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteRule?._id) return;
    const ruleId = pendingDeleteRule._id;
    // Optimistic remove
    deleteRuleFromStore(ruleId);
    try {
      const res = await fetch("/api/rulebase", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ruleId })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Delete failed');
      }
    } catch (e) {
      console.error('❌ Delete failed:', e);
      fetchRules(true);
    } finally {
      setConfirmOpen(false);
      setPendingDeleteRule(null);
    }
  };

  // Add predefined template to user's rulebase
  const handleAddTemplate = async (template: typeof PREDEFINED_RULES[0]) => {
    const templateKey = template.name;
    setAddingTemplates(prev => new Set(prev).add(templateKey));
    
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
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.rule) {
        addRuleToStore(data.rule);
        // Remove from adding state after a short delay for visual feedback
        setTimeout(() => {
          setAddingTemplates(prev => {
            const next = new Set(prev);
            next.delete(templateKey);
            return next;
          });
        }, 1000);
      } else {
        throw new Error('Failed to add template');
      }
    } catch (e) {
      console.error('Failed to add template:', e);
      setAddingTemplates(prev => {
        const next = new Set(prev);
        next.delete(templateKey);
        return next;
      });
      alert('Failed to add template. Please try again.');
    }
  };

  // Filter templates by category
  const filteredTemplates = useMemo(() => {
    if (selectedCategory === "All") return PREDEFINED_RULES;
    return PREDEFINED_RULES.filter(r => r.category === selectedCategory);
  }, [selectedCategory]);

  // Check if template is already added
  const isTemplateAdded = (templateName: string) => {
    return rules.some(rule => rule.name === templateName);
  };

  return (
    <div className="w-full min-h-screen bg-[#FAFAFB] py-6 px-4">
      <ConfirmDialog
        open={confirmOpen}
        title="Delete rule?"
        description={`This will permanently remove "${pendingDeleteRule?.name || 'this rule'}" from your RuleBase.`}
        confirmText="Delete Rule"
        onCancel={() => { setConfirmOpen(false); setPendingDeleteRule(null); }}
        onConfirm={confirmDelete}
        requireAcknowledge
        acknowledgeLabel="I understand this action cannot be undone"
      />
      <div className="max-w-[1646px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-[13px]">
            <div className="w-12 h-12 rounded-full bg-[#FFFFFF] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B43D6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-[16px] font-semibold text-[#2D2F34] leading-[19.36px]">RuleBase</h1>
              <p className="text-[12px] text-[#6A707C] leading-[14.52px]">
                Upload and manage your company's custom compliance and contract rules
              </p>
            </div>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-[15px]">
            <label className="h-9 px-[10px] border border-[#717171] rounded-[5px] bg-[#FAFAFA] cursor-pointer flex items-center gap-[5px]">
              <Upload className="w-[14px] h-[14px] text-[#717171]" strokeWidth={1.17} />
              <span className="text-[12px] font-semibold text-[#717171] leading-[14.52px]">Upload File</span>
              <input
                type="file"
                className="hidden"
                accept=".txt,.md,.json,.csv,.yaml,.yml,.pdf,.doc,.docx"
                onChange={e => e.target.files && handleFileUpload(e.target.files)}
              />
            </label>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="h-9 px-[15px] bg-[#3B43D6] rounded-[5px] flex items-center gap-[5px]"
            >
              <span className="text-[12px] font-semibold text-white text-center leading-[14.52px]">+ New Task</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
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

        {/* My Rules Tab Content */}
        {activeTab === "my-rules" && (
          <div className="bg-white rounded-[10px] shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] p-5 flex flex-col gap-[15px]">
            {/* Header */}
            <div className="flex items-center gap-[15px]">
              <div className="flex flex-col gap-[15px] w-[1211px]">
                <h2 className="text-[16px] font-semibold text-[#202020] leading-[19.36px]">Your Rules</h2>
                <p className="text-[12px] font-medium text-[#717171] leading-[14.52px]">
                  Search, view and manage uploaded or created rules
                </p>
              </div>
              
              {/* Search Box */}
              <div className="relative w-[380px] h-8">
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

            {/* Rules Grid - Same design as Templates */}
            {loading ? (
              <div className="flex flex-col justify-center items-center gap-[10px] py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#595959]" />
                <p className="text-[12px] font-medium text-[#595959] leading-[14.52px]">
                  Loading rules...
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col justify-center items-center gap-[10px] py-20">
                <svg width="199" height="159" viewBox="0 0 199 159" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g opacity="0.5">
                    <path d="M99.5 79.5C99.5 109.928 74.928 134.5 44.5 134.5C14.072 134.5 0 109.928 0 79.5C0 49.072 14.072 24.5 44.5 24.5C74.928 24.5 99.5 49.072 99.5 79.5Z" fill="#DFDFEB" fillOpacity="0.3"/>
                    <path d="M199 79.5C199 109.928 174.428 134.5 144 134.5C113.572 134.5 99.5 109.928 99.5 79.5C99.5 49.072 113.572 24.5 144 24.5C174.428 24.5 199 49.072 199 79.5Z" fill="#DFDFEB" fillOpacity="0.3"/>
                    <rect x="28" y="53" width="143" height="69" rx="5" fill="#333969"/>
                    <rect x="28" y="35" width="115" height="86" rx="5" fill="url(#paint0_linear)"/>
                    <path d="M62 100L78 85L93 100" stroke="#000" strokeWidth="0.32"/>
                    <circle cx="70" cy="75" r="5" fill="#DB9C7F"/>
                    <path d="M46 82L62 67L77 82" stroke="#000" strokeWidth="0.32"/>
                  </g>
                  <defs>
                    <linearGradient id="paint0_linear" x1="28" y1="78" x2="143" y2="78" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#3B43D6"/>
                      <stop offset="1" stopColor="#695CFF"/>
                    </linearGradient>
                  </defs>
                </svg>
                <p className="text-[12px] font-medium text-[#595959] leading-[14.52px]">
                  No rules yet. Upload a file or create your first rule.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-[35px]">
                {filtered.map((rule, idx) => (
                  <div key={rule._id || idx} className="w-[373px] h-[286px]">
                    <div className={`bg-[#F9F9F9] rounded-[10px] p-5 flex flex-col gap-[15px] h-full ${rule.active === false ? 'opacity-60' : ''}`}>
                      {/* Top section with icon and actions */}
                      <div className="flex items-start justify-between gap-[13px]">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B43D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        </div>
                        
                        <div className="flex items-center gap-[13px]">
                          {/* Active/Inactive Switch */}
                          <Switch
                            checked={rule.active !== false}
                            onCheckedChange={(val) => toggleActive(rule, !!val)}
                            aria-label={`Toggle active for ${rule.name}`}
                          />
                          
                          {/* Edit Button */}
                          <button
                            onClick={() => openEdit(rule)}
                            className="w-6 h-6 flex items-center justify-center"
                            aria-label="Edit rule"
                          >
                            <Pencil className="w-5 h-5 text-[#3B43D6]" strokeWidth={2} />
                          </button>
                          
                          {/* Delete Button */}
                          <button
                            onClick={() => requestDelete(rule)}
                            className="w-6 h-6 flex items-center justify-center"
                            aria-label="Delete rule"
                          >
                            <Trash2 className="w-5 h-5 text-red-600" strokeWidth={2} />
                          </button>
                        </div>
                      </div>

                      {/* Text content */}
                      <div className="flex flex-col gap-[5px] opacity-70">
                        <h3 className="text-[16px] font-semibold text-[#000000] leading-[19.36px]">
                          {rule.name}
                        </h3>
                        <p className="text-[12px] text-[#030229] leading-[18px] line-clamp-3">
                          {rule.description || 'No description provided'}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-[13px]">
                        {(rule.tags || []).slice(0, 4).map((tag, i) => (
                          <div key={i} className="bg-white rounded-[40px] px-[10px] py-[3px]">
                            <span className="text-[12px] font-medium text-[#000000] leading-[14.52px] opacity-70">
                              {tag}
                            </span>
                          </div>
                        ))}
                        {(rule.tags || []).length > 4 && (
                          <div className="bg-white rounded-[40px] px-[10px] py-[3px]">
                            <span className="text-[12px] font-medium text-[#000000] leading-[14.52px] opacity-70">
                              +{(rule.tags || []).length - 4} more
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Updated timestamp */}
                      {rule.updatedAt && (
                        <div className="text-[10px] text-[#717171] mt-auto">
                          Updated {new Date(rule.updatedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Templates Tab Content */}
        {activeTab === "templates" && (
          <div className="bg-white rounded-[10px] shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] p-5 flex flex-col gap-[15px]">
            {/* Header */}
            <div className="flex items-center gap-[15px]">
              <div className="flex flex-col gap-[15px] w-[1211px]">
                <h2 className="text-[16px] font-semibold text-[#202020] leading-[19.36px]">Predefined Rule Templates</h2>
                <p className="text-[12px] font-medium text-[#717171] leading-[14.52px]">
                  Choose from 20 industry-standard templates to quickly set up your rulebase
                </p>
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-10">
              <button
                onClick={() => setSelectedCategory("All")}
                className={`py-[13px] text-[12px] font-semibold leading-[14.52px] ${
                  selectedCategory === "All"
                    ? "text-[#6E72FF] border-b-2 border-[#605BFF]"
                    : "text-[#2D2F34]"
                }`}
              >
                All (20)
              </button>
              <button
                onClick={() => setSelectedCategory("Legal & Compliance")}
                className={`py-[13px] text-[12px] font-semibold leading-[14.52px] ${
                  selectedCategory === "Legal & Compliance"
                    ? "text-[#6E72FF] border-b-2 border-[#605BFF]"
                    : "text-[#2D2F34]"
                }`}
              >
                Legal (11)
              </button>
              <button
                onClick={() => setSelectedCategory("Financial")}
                className={`py-[13px] text-[12px] font-semibold leading-[14.52px] ${
                  selectedCategory === "Financial"
                    ? "text-[#6E72FF] border-b-2 border-[#605BFF]"
                    : "text-[#2D2F34]"
                }`}
              >
                Financial (2)
              </button>
              <button
                onClick={() => setSelectedCategory("Operations")}
                className={`py-[13px] text-[12px] font-semibold leading-[14.52px] ${
                  selectedCategory === "Operations"
                    ? "text-[#6E72FF] border-b-2 border-[#605BFF]"
                    : "text-[#2D2F34]"
                }`}
              >
                Operations (5)
              </button>
              <button
                onClick={() => setSelectedCategory("Technical")}
                className={`py-[13px] text-[12px] font-semibold leading-[14.52px] ${
                  selectedCategory === "Technical"
                    ? "text-[#6E72FF] border-b-2 border-[#605BFF]"
                    : "text-[#2D2F34]"
                }`}
              >
                Technical (2)
              </button>
            </div>

            {/* Templates Grid - 3 columns */}
            <div className="grid grid-cols-3 gap-[35px]">
              {filteredTemplates.map((template, idx) => {
                const isAdded = isTemplateAdded(template.name);
                const isAdding = addingTemplates.has(template.name);
                return (
                  <div key={idx} className="w-[373px] h-[286px]">
                    <div className="bg-[#F9F9F9] rounded-[10px] p-5 flex flex-col gap-[15px] h-full">
                      {/* Top section with icon and badge */}
                      <div className="flex items-start justify-between gap-[13px]">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        </div>
                        
                        <div className="flex items-center gap-[13px]">
                          <div className="bg-[#DEE3ED] rounded-[35px] px-[10px] py-[5px]">
                            <span className="text-[12px] font-medium text-[#2D2F34] leading-[14.52px]">Legal & Compliance</span>
                          </div>
                          <button
                            onClick={() => handleAddTemplate(template)}
                            disabled={isAdded || isAdding}
                            className="w-6 h-6 flex items-center justify-center"
                          >
                            {isAdding ? (
                              <Loader2 className="w-6 h-6 text-[#3B43D6] animate-spin" strokeWidth={2} />
                            ) : (
                              <Plus className="w-6 h-6 text-[#3B43D6]" strokeWidth={2} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Text content */}
                      <div className="flex flex-col gap-[5px] opacity-70">
                        <h3 className="text-[16px] font-semibold text-[#000000] leading-[19.36px]">
                          {template.name}
                        </h3>
                        <p className="text-[12px] text-[#030229] leading-[18px] line-clamp-3">
                          {template.description}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-[13px]">
                        {template.tags.slice(0, 4).map((tag, i) => (
                          <div key={i} className="bg-white rounded-[40px] px-[10px] py-[3px]">
                            <span className="text-[12px] font-medium text-[#000000] leading-[14.52px] opacity-70">
                              {tag}
                            </span>
                          </div>
                        ))}
                        {template.tags.length > 4 && (
                          <div className="bg-white rounded-[40px] px-[10px] py-[3px]">
                            <span className="text-[12px] font-medium text-[#000000] leading-[14.52px] opacity-70">
                              +{template.tags.length - 4} more
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
              <div className="flex justify-end">
                <Button onClick={handleCreateRule} disabled={!newRuleName.trim()}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Rule</DialogTitle>
              <DialogDescription>Update rule details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Rule name" value={editName} onChange={e => setEditName(e.target.value)} />
              <Textarea placeholder="Description / policy text" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
              <Input placeholder="Tags (comma separated)" value={editTags} onChange={e => setEditTags(e.target.value)} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button onClick={saveEdit} disabled={!editName.trim()}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

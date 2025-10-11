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

  const handleDelete = async (rule: RuleItem) => {
    if (!rule._id) return;
    const ok = window.confirm(`Delete rule "${rule.name}"? This cannot be undone.`);
    if (!ok) return;
    
    // Optimistically remove from UI
    const ruleId = rule._id;
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
      
      const data = await res.json();
      console.log('✅ Rule deleted successfully:', data);
    } catch (e) {
      console.error('❌ Delete failed:', e);
      // Revert by refetching all rules
      fetchRules(true);
      alert(e instanceof Error ? e.message : 'Failed to delete rule. Please try again.');
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RuleBase</h1>
          <p className="text-muted-foreground mt-2">
            Upload and manage your company's custom compliance and contract rules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-accent">
            <Upload className="h-4 w-4" />
            <span className="text-sm">Upload File</span>
            <input
              type="file"
              className="hidden"
              accept=".txt,.md,.json,.csv,.yaml,.yml,.pdf,.doc,.docx"
              onChange={e => e.target.files && handleFileUpload(e.target.files)}
            />
          </label>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> New Rule
              </Button>
            </DialogTrigger>
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
        </div>
      </div>

      {/* Main Tabs for My Rules and Templates */}
      <Tabs defaultValue="my-rules" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-rules">
            <FileText className="h-4 w-4 mr-2" />
            My Rules ({rules.length})
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Sparkles className="h-4 w-4 mr-2" />
            Templates ({PREDEFINED_RULES.length})
          </TabsTrigger>
        </TabsList>

        {/* My Rules Tab */}
        <TabsContent value="my-rules" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Rules</CardTitle>
              <CardDescription>Search, view and manage uploaded or created rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search rules..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>

              {loading ? (
                <div className="text-center text-muted-foreground py-10">Loading rules...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">No rules yet. Upload a file or create your first rule.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filtered.map((rule, idx) => (
                    <Card key={rule._id || idx} className={rule.active === false ? "opacity-60" : ""}>
                      <CardContent className="p-2 space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="text-sm font-semibold leading-tight -mt-0.5 mb-1.5">{rule.name}</div>
                            {rule.description && (
                              <div className="text-xs text-muted-foreground leading-tight line-clamp-2">{rule.description}</div>
                            )}
                            <div className="flex flex-wrap gap-0.5">
                              {(rule.tags || []).slice(0, 5).map((t, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px]">{t}</Badge>
                              ))}
                              {(rule.tags || []).length > 5 && (
                                <Badge variant="outline" className="text-[10px]">+{(rule.tags || []).length - 5}</Badge>
                              )}
                            </div>
                            {rule.updatedAt && (
                              <div className="text-[10px] text-muted-foreground">Updated {new Date(rule.updatedAt).toLocaleString()}</div>
                            )}
                            <div className="flex items-center gap-1 pt-0">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(rule)} aria-label="Edit rule">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700" onClick={() => handleDelete(rule)} aria-label="Delete rule">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 pt-0">
                            <Switch
                              checked={rule.active !== false}
                              onCheckedChange={(val) => toggleActive(rule, !!val)}
                              aria-label={`Toggle active for ${rule.name}`}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                    Predefined Rule Templates
                  </CardTitle>
                  <CardDescription>
                    Choose from {PREDEFINED_RULES.length} industry-standard templates to quickly set up your rulebase
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-4">
                  <TabsTrigger value="All">All ({PREDEFINED_RULES.length})</TabsTrigger>
                  {RULE_CATEGORIES.map(cat => (
                    <TabsTrigger key={cat} value={cat}>
                      {cat.split(" ")[0]} ({PREDEFINED_RULES.filter(r => r.category === cat).length})
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value={selectedCategory} className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {filteredTemplates.map((template, idx) => {
                    const isAdded = isTemplateAdded(template.name);
                    const isAdding = addingTemplates.has(template.name);
                    return (
                      <Card key={idx} className={isAdded ? "opacity-50 border-green-200" : ""}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold text-base leading-tight">{template.name}</h4>
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  {template.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {template.description}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {template.tags.map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAddTemplate(template)}
                              disabled={isAdded || isAdding}
                              className="flex-shrink-0"
                            >
                              {isAdding ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Adding...
                                </>
                              ) : isAdded ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Added
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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
  );
}

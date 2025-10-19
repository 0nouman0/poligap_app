"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText, Tag, Trash2, Download, Search, Pencil, Sparkles, BookOpen, Loader2, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useRulebaseStore } from "@/stores/rulebase-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function RuleBasePage() {
  const {
    rules,
    isLoading: loading,
    fetchRules,
    addRule: addRuleToStore,
    updateRule: updateRuleInStore,
    deleteRule: deleteRuleFromStore,
  } = useRulebaseStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"my-rules" | "templates">("my-rules");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [addingTemplates, setAddingTemplates] = useState<Set<string>>(new Set());

  // Create rule states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleDesc, setNewRuleDesc] = useState("");
  const [newRuleTags, setNewRuleTags] = useState("");

  // Edit rule states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editRuleId, setEditRuleId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTags, setEditTags] = useState("");

  // Delete confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteRule, setPendingDeleteRule] = useState<RuleItem | null>(null);

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
      sourceType: "manual" as const,
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

  return (
    <div className="w-full min-h-screen bg-[#FAFAFB] py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
      <ConfirmDialog
        open={confirmOpen}
        title="Delete rule?"
        description={`This will permanently remove "${pendingDeleteRule?.name || 'this rule'}" from your RuleBase.`}
        confirmText="Delete Rule"
        onCancel={() => { setConfirmOpen(false); setPendingDeleteRule(null); }}
        onConfirm={() => {}}
        requireAcknowledge
        acknowledgeLabel="I understand this action cannot be undone"
      />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-[13px]">
            <div className="w-12 h-12 rounded-full bg-[#FFFFFF] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B43D6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-[16px] font-semibold text-[#2D2F34] leading-[19.36px]">RuleBase</h1>
              <p className="text-[12px] text-[#6A707C] leading-[14.52px]">
                Manage your company's custom compliance and contract rules
              </p>
            </div>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-[15px]">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="h-9 px-[15px] bg-[#3B43D6] rounded-[5px] flex items-center gap-[5px]"
            >
              <span className="text-[12px] font-semibold text-white text-center leading-[14.52px]">+ New Rule</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-[16px] font-semibold text-[#202020] leading-[19.36px]">Your Rules</h2>
                <p className="text-[12px] font-medium text-[#717171] leading-[14.52px]">
                  Search, view and manage created rules
                </p>
              </div>
              
              {/* Search Box */}
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

            {/* Rules Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-[10px] border border-[#DEE3ED] shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] p-5">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <Skeleton className="h-6 w-6 rounded" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col justify-center items-center gap-[10px] py-20">
                <p className="text-[12px] font-medium text-[#595959] leading-[14.52px]">
                  No rules yet. Create your first rule to get started.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {filtered.map((rule, idx) => (
                  <div key={rule._id || idx} className="w-full min-h-[286px]">
                    <div className={`bg-[#F9F9F9] rounded-[10px] p-5 flex flex-col gap-[15px] h-full ${rule.active === false ? 'opacity-60' : ''}`}>
                      {/* Rule content */}
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
                      </div>
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
            <div className="flex flex-col gap-2">
              <h2 className="text-[16px] font-semibold text-[#202020] leading-[19.36px]">Predefined Rule Templates</h2>
              <p className="text-[12px] font-medium text-[#717171] leading-[14.52px]">
                Choose from industry-standard templates to quickly set up your rulebase
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="w-full min-h-[286px]">
                <div className="bg-[#F9F9F9] rounded-[10px] p-5 flex flex-col gap-[15px] h-full">
                  <div className="flex flex-col gap-[5px] opacity-70">
                    <h3 className="text-[16px] font-semibold text-[#000000] leading-[19.36px]">
                      GDPR Data Protection
                    </h3>
                    <p className="text-[12px] text-[#030229] leading-[18px] line-clamp-3">
                      Ensure all contracts comply with GDPR requirements including data processing and consent mechanisms.
                    </p>
                  </div>
                </div>
              </div>
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
      </div>
    </div>
  );
}

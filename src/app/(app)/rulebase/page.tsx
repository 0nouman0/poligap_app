"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Plus, FileText, Tag, Trash2, Download, Search, Pencil } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface RuleItem {
  _id?: string;
  name: string;
  description?: string;
  tags?: string[];
  updatedAt?: string;
  sourceType?: "text" | "file";
  fileName?: string;
  active?: boolean;
}

export default function RuleBasePage() {
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res = await fetch("/api/rulebase");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setRules(Array.isArray(data?.rules) ? data.rules : []);
      } catch (e) {
        setRules([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

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
    // optimistic update
    setRules(list => list.map(r => r._id === rule._id ? { ...r, active: next } : r));
    try {
      const res = await fetch("/api/rulebase", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule._id, active: next })
      });
      if (!res.ok) throw new Error("patch failed");
      const data = await res.json().catch(() => ({}));
      if (!data?.rule) throw new Error("no rule in response");
      setRules(list => list.map(r => r._id === rule._id ? data.rule : r));
    } catch (e) {
      // revert on failure
      setRules(list => list.map(r => r._id === rule._id ? { ...r, active: prev } : r));
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
        setRules(prev => [data.rule, ...prev]);
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
        setRules(prev => [data.rule, ...prev]);
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
        setRules(list => list.map(r => r._id === editRuleId ? data.rule : r));
        setIsEditOpen(false);
      }
    } catch {}
  };

  const handleDelete = async (rule: RuleItem) => {
    if (!rule._id) return;
    const ok = window.confirm(`Delete rule "${rule.name}"? This cannot be undone.`);
    if (!ok) return;
    const prev = rules;
    setRules(list => list.filter(r => r._id !== rule._id));
    try {
      const res = await fetch("/api/rulebase", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule._id })
      });
      if (!res.ok) throw new Error('delete failed');
    } catch {
      // revert on failure
      setRules(prev);
    }
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
          <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer">
            <Upload className="h-4 w-4" />
            <span className="text-sm">Upload Rules File</span>
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

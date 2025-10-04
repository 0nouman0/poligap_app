"use client";

import React, { useMemo, useState } from "react";
import { triggerN8NEmailWorkflow, EMAIL_TEMPLATES, EmailTemplateType } from "@/lib/utils/n8n-webhook";
import { 
  Mail, 
  Scale, 
  Bot, 
  Sparkles, 
  Zap, 
  Upload,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  Construction
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AIAgentsPage() {
  const [open, setOpen] = useState(false);
  const [activeAgent, setActiveAgent] = useState<
    "Email Notifier" | "Law Scanner" | null
  >(null);
  const [activeTab, setActiveTab] = useState<"Actions">("Actions");

  const tabs: Array<{
    key: "Actions";
    label: string;
  }> = useMemo(
    () => [
      { key: "Actions", label: "Actions" },
    ],
    []
  );

  const openAgent = (agent: "Email Notifier" | "Law Scanner") => {
    setActiveAgent(agent);
    setActiveTab("Actions");
    setOpen(true);
  };

  // Law Scanner: state and helpers
  type LawUpdate = { id: string; title: string; url: string; date: string; source: string; summary?: string };
  const [lawIndustry, setLawIndustry] = useState("");
  const [lawRegion, setLawRegion] = useState("");
  const [lawOrgType, setLawOrgType] = useState("");
  const [lawMonths, setLawMonths] = useState<number>(3);
  const [lawKeywords, setLawKeywords] = useState("");
  const [lawLoading, setLawLoading] = useState(false);
  const [lawResults, setLawResults] = useState<LawUpdate[]>([]);
  const [lawCount, setLawCount] = useState<number | null>(null);

  const scanUpdates = async () => {
    setLawLoading(true);
    setLawResults([]);
    setLawCount(null);
    try {
      const res = await fetch("/api/law-scanner/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: lawIndustry,
          region: lawRegion,
          orgType: lawOrgType,
          monthsBack: lawMonths,
          keywords: lawKeywords,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data?.items)) {
        setLawResults(data.items as LawUpdate[]);
        setLawCount(data.items.length);
      } else {
        setLawResults([]);
        setLawCount(0);
      }
    } catch (e) {
      setLawResults([]);
      setLawCount(0);
    } finally {
      setLawLoading(false);
    }
  };

  const closeModal = () => setOpen(false);
  // Email Notifier: state and helpers
  const emailActions = useMemo(
    () => [
      { value: "policy_changes", label: "Notify Policy Changes" },
      { value: "terms_updates", label: "Notify T&C Updates" },
      { value: "feature_launch", label: "Notify New Feature Launch" },
      { value: "maintenance", label: "Scheduled Maintenance" },
      { value: "downtime", label: "Unexpected Downtime" },
      { value: "security", label: "Security Advisory" },
      { value: "newsletter", label: "Monthly Newsletter" },
      { value: "promotion", label: "Product Promotion" },
      { value: "survey", label: "Customer Survey" },
      { value: "webinar", label: "Webinar Invitation" },
      { value: "billing", label: "Billing Update" },
    ],
    []
  );
  const [emailsText, setEmailsText] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>(emailActions[0].value);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<null | { sent: number; failed: number }>(null);

  const parseEmails = (text: string) => {
    return Array.from(
      new Set(
        text
          .split(/\s|,|;|\n|\r/)
          .map((e) => e.trim())
          .filter((e) => /.+@.+\..+/.test(e))
      )
    );
  };

  const onUploadEmails = async (file: File) => {
    const text = await file.text();
    setEmailsText((prev) => (prev ? prev + "\n" : "") + text);
  };

  const getPreview = () => {
    return EMAIL_TEMPLATES[selectedAction as EmailTemplateType] || EMAIL_TEMPLATES.policy_changes;
  };

  const sendNotifications = async () => {
    setSending(true);
    setSendResult(null);
    try {
      const recipients = parseEmails(emailsText);
      const preview = getPreview();
      
      // Call the n8n webhook using utility function
      const result = await triggerN8NEmailWorkflow({
        recipients, 
        actionType: selectedAction,
        subject: preview.subject,
        message: preview.body,
        notificationType: selectedAction
      });
      
      if (result.success) {
        setSendResult({ sent: recipients.length, failed: 0 });
      } else {
        setSendResult({ sent: 0, failed: recipients.length });
      }
    } catch (e) {
      setSendResult({ sent: 0, failed: parseEmails(emailsText).length });
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">AI Agents</h1>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <p className="text-muted-foreground text-lg">
              Curated, task-specific agents to accelerate your workflows. Choose an agent below to get started.
            </p>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center max-w-5xl mx-auto">
            {/* Email Notifier Agent */}
            <Card className="cursor-pointer transition-all hover:shadow-lg group w-full max-w-sm h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <CardTitle className="text-lg font-semibold">Email Notifier</CardTitle>
                <CardDescription className="text-sm text-muted-foreground min-h-[3rem]">
                  Automate email alerts and notifications for key events and policy changes.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  onClick={() => openAgent("Email Notifier")} 
                  className="w-full"
                  size="sm"
                >
                  Use Agent
                </Button>
              </CardContent>
            </Card>

            {/* Law Scanner Agent */}
            <Card className="cursor-pointer transition-all hover:shadow-lg group w-full max-w-sm h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <Scale className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <CardTitle className="text-lg font-semibold">Law Scanner</CardTitle>
                <CardDescription className="text-sm text-muted-foreground min-h-[3rem]">
                  Scan documents for legal clauses, risks, and compliance issues.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  onClick={() => openAgent("Law Scanner")} 
                  className="w-full"
                  size="sm"
                >
                  Use Agent
                </Button>
              </CardContent>
            </Card>


            {/* Coming Soon Card */}
            <Card className="border-dashed opacity-60 w-full max-w-sm h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Construction className="h-6 w-6 text-gray-500" />
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
                <CardTitle className="text-lg font-semibold">More Agents</CardTitle>
                <CardDescription className="text-sm text-muted-foreground min-h-[3rem]">
                  New specialized agents are in development. Stay tuned for updates!
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  disabled 
                  className="w-full"
                  size="sm"
                  variant="outline"
                >
                  In Development
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal: Agent Workspace */}
      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-none w-[98vw] h-[95vh] p-0">
            <DialogHeader className="px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                {activeAgent === "Email Notifier" && <Mail className="h-5 w-5 text-blue-600" />}
                {activeAgent === "Law Scanner" && <Scale className="h-5 w-5 text-purple-600" />}
                <DialogTitle className="text-xl font-semibold">{activeAgent} Agent</DialogTitle>
              </div>
            </DialogHeader>
            {/* Content - Full Width */}
            <div className="h-[calc(95vh-80px)] overflow-y-auto">
              <section className="p-12">
                {/* Actions Content - Always Visible */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Actions</h3>
                    </div>
                    
                    {activeAgent === "Email Notifier" ? (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-1 gap-12">
                          <Card className="lg:col-span-1">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-base">
                                <Mail className="h-4 w-4" />
                                Recipients
                              </CardTitle>
                              <CardDescription>
                                Enter email addresses separated by commas, spaces, or new lines
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <Textarea
                                value={emailsText}
                                onChange={(e) => setEmailsText(e.target.value)}
                                rows={10}
                                placeholder="alice@example.com, bob@example.com&#10;or paste from a spreadsheet"
                                className="resize-y min-h-[250px]"
                              />
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary">
                                  {parseEmails(emailsText).length} emails parsed
                                </Badge>
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    accept=".csv,.txt,.tsv"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) onUploadEmails(f);
                                      e.currentTarget.value = "";
                                    }}
                                  />
                                  <Button variant="outline" size="sm" asChild>
                                    <span className="flex items-center gap-2">
                                      <Upload className="h-4 w-4" />
                                      Upload CSV/TXT
                                    </span>
                                  </Button>
                                </label>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="xl:col-span-2">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-base">
                                <Sparkles className="h-4 w-4" />
                                Notification Type
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <Select value={selectedAction} onValueChange={setSelectedAction}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {emailActions.map((a) => (
                                    <SelectItem key={a.value} value={a.value}>
                                      {a.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <Card className="bg-muted/50">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm flex items-center gap-2">
                                    👁️ Preview
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div className="font-medium text-sm">{getPreview().subject}</div>
                                  <div className="text-sm text-muted-foreground">{getPreview().body}</div>
                                </CardContent>
                              </Card>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="flex items-center gap-4">
                          <Button
                            onClick={sendNotifications}
                            disabled={sending || parseEmails(emailsText).length === 0}
                            className="flex items-center gap-2"
                          >
                            {sending ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                Send Notifications
                              </>
                            )}
                          </Button>
                          
                          {sendResult && (
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-green-700">{sendResult.sent} sent</span>
                              </div>
                              {sendResult.failed > 0 && (
                                <div className="flex items-center gap-1">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  <span className="font-medium text-red-700">{sendResult.failed} failed</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : activeAgent === "Law Scanner" ? (
                      <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                          <div className="lg:col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">Industry / Domain</label>
                            <input type="text" value={lawIndustry} onChange={(e)=>setLawIndustry(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g., FinTech, Healthcare" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Region / Country</label>
                            <input type="text" value={lawRegion} onChange={(e)=>setLawRegion(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g., US, EU, India" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Org Type</label>
                            <select value={lawOrgType} onChange={(e)=>setLawOrgType(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                              <option value="">Select…</option>
                              <option value="startup">Startup</option>
                              <option value="smb">SMB</option>
                              <option value="enterprise">Enterprise</option>
                              <option value="public">Public Sector</option>
                              <option value="nonprofit">Non-profit</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Months Back</label>
                            <select value={lawMonths} onChange={(e)=>setLawMonths(parseInt(e.target.value||"3"))} className="w-full border rounded-md px-3 py-2 text-sm">
                              {[1,2,3,6,12].map(m=> (<option key={m} value={m}>{m}</option>))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Additional Keywords (optional)</label>
                          <input type="text" value={lawKeywords} onChange={(e)=>setLawKeywords(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g., privacy, payments, aml" />
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={scanUpdates} disabled={lawLoading} className="px-4 py-2 rounded-md text-sm text-white bg-black disabled:opacity-50">{lawLoading? 'Scanning…' : 'Scan Updates'}</button>
                          {lawCount != null && (
                            <div className="text-xs text-gray-600">Found <span className="font-semibold">{lawCount}</span> recent updates</div>
                          )}
                        </div>
                        <div className="border rounded-lg divide-y max-h-72 overflow-y-auto bg-white">
                          {lawLoading && (
                            <div className="p-4 text-sm text-gray-600">Loading latest updates…</div>
                          )}
                          {!lawLoading && lawResults.length === 0 && (
                            <div className="p-4 text-sm text-gray-500">No results yet. Adjust filters and click Scan Updates.</div>
                          )}
                          {lawResults.map((r: LawUpdate) => (
                            <div key={r.id} className="p-3">
                              <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                                <span className="inline-block px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-800">{r.source}</span>
                                <a href={r.url} target="_blank" rel="noreferrer" className="hover:underline">{r.title}</a>
                              </div>
                              <div className="text-xs text-gray-600 mt-1 line-clamp-2">{r.summary}</div>
                              <div className="text-xs text-gray-500 mt-1">{r.date}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 mt-1">Placeholder: Configure and invoke the agent's tasks and automations.</p>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button className="border rounded-lg p-4 text-left hover:bg-gray-50 flex items-center gap-3">
                            <span>📊</span>
                            <p className="text-sm font-medium text-gray-800">Run Analysis</p>
                            <p className="text-xs text-gray-500 ml-auto">Execute a one-off job</p>
                          </button>
                          <button className="border rounded-lg p-4 text-left hover:bg-gray-50 flex items-center gap-3">
                            <span>⏰</span>
                            <p className="text-sm font-medium text-gray-800">Schedule</p>
                            <p className="text-xs text-gray-500 ml-auto">Set up recurring operations</p>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
              </section>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

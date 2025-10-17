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
  Construction,
  Shield
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
    <div className="w-full min-h-screen bg-[#FAFAFB] py-6 px-4">
      <div className="max-w-[1646px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-[13px] mb-8">
          <div className="w-12 h-12 rounded-full bg-[#EFF1F6] flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#3B43D6]" strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[16px] font-semibold text-[#2D2F34] leading-[19.36px]">AI Agents</h1>
            <p className="text-[12px] text-[#6A707C] leading-[14.52px]">
              Curated, task-specific agents to accelerate your workflows. Choose an agent below to get started.
            </p>
          </div>
        </div>

        {/* Agents Grid */}
        <div className="flex flex-wrap gap-[30px] px-[15px] py-5">
          {/* Email Notifier - Active */}
          <div className="w-[380px] bg-white rounded-[10px] shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] p-5 flex flex-col gap-[15px]">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-full bg-[#EFF1F6] flex items-center justify-center">
                <Mail className="w-6 h-6 text-[#3B43D6]" strokeWidth={2} />
              </div>
              <div className="px-[10px] py-[5px] bg-[#EDFFDE] rounded-[35px]">
                <span className="text-[12px] font-medium text-[#47AF47] leading-[14.52px] text-center">Active</span>
              </div>
            </div>
            <div className="flex flex-col gap-[5px]">
              <h3 className="text-[16px] font-semibold text-[#000000] opacity-70 leading-[19.36px]">Email Notifier</h3>
              <p className="text-[12px] text-[#030229] opacity-70 leading-[14.52px]">
                Automate email alerts and notifications for key events and policy changes.
              </p>
            </div>
            <button
              onClick={() => openAgent("Email Notifier")}
              className="w-full py-[7px] bg-[#3B43D6] rounded-[5px] text-[12px] font-semibold text-white text-center leading-[14.52px]"
            >
              Use Agent
            </button>
          </div>

          {/* Law Scanner - Active */}
          <div className="w-[380px] bg-white rounded-[10px] shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] p-5 flex flex-col gap-[15px]">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-full bg-[#EFF1F6] flex items-center justify-center">
                <Scale className="w-6 h-6 text-[#3B43D6]" strokeWidth={2} />
              </div>
              <div className="px-[10px] py-[5px] bg-[#EDFFDE] rounded-[35px]">
                <span className="text-[12px] font-medium text-[#47AF47] leading-[14.52px] text-center">Active</span>
              </div>
            </div>
            <div className="flex flex-col gap-[5px]">
              <h3 className="text-[16px] font-semibold text-[#000000] opacity-70 leading-[19.36px]">Law Scanner</h3>
              <p className="text-[12px] text-[#030229] opacity-70 leading-[14.52px]">
                Scan documents for legal clauses, risks, and compliance issues.
              </p>
            </div>
            <button
              onClick={() => openAgent("Law Scanner")}
              className="w-full py-[7px] bg-[#3B43D6] rounded-[5px] text-[12px] font-semibold text-white text-center leading-[14.52px]"
            >
              Use Agent
            </button>
          </div>

          {/* Coming Soon */}
          <div className="w-[380px] bg-white rounded-[10px] shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] p-5 flex flex-col gap-[15px]">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-full bg-[#EFF1F6] flex items-center justify-center">
                <Construction className="w-6 h-6 text-[#717171]" strokeWidth={2} />
              </div>
              <div className="px-[10px] py-[5px] bg-[#F5F5F5] rounded-[35px]">
                <span className="text-[12px] font-medium text-[#717171] leading-[14.52px] text-center">Coming Soon</span>
              </div>
            </div>
            <div className="flex flex-col gap-[5px]">
              <h3 className="text-[16px] font-semibold text-[#000000] opacity-70 leading-[19.36px]">More Agents</h3>
              <p className="text-[12px] text-[#030229] opacity-70 leading-[14.52px]">
                New specialized agents are in development. Stay tuned for updates!
              </p>
            </div>
            <button
              disabled
              className="w-full py-[7px] bg-[#DADADA] rounded-[5px] text-[12px] font-semibold text-white text-center leading-[14.52px] cursor-not-allowed"
            >
              In Development
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Agent Workspace */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[rgba(216,216,216,0.5)] backdrop-blur-[20px]"
            onClick={closeModal}
          />
          
          {/* Modal Content */}
          <div className="relative w-[675px] bg-white rounded-[20px] shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center px-[21px] py-[26px]">
              {activeAgent === "Email Notifier" && (
                <Mail className="w-6 h-6 text-[#000000]" strokeWidth={2} />
              )}
              {activeAgent === "Law Scanner" && (
                <Scale className="w-6 h-6 text-[#000000]" strokeWidth={2} />
              )}
              <h2 className="ml-[31px] text-[16px] font-semibold text-[#2D2F34] leading-[19.36px]">
                {activeAgent} Agent
              </h2>
              <button
                onClick={closeModal}
                className="ml-auto w-6 h-6 flex items-center justify-center"
              >
                <XCircle className="w-6 h-6 text-[#000000]" strokeWidth={2} />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="max-h-[600px] overflow-y-auto px-[21px] pb-[21px]">
              <section>
                {activeAgent === "Email Notifier" ? (
                      <div className="flex flex-col gap-5">
                        {/* Actions Section */}
                        <div className="border border-dashed border-[#A0A8C2] rounded-[10px] p-5 flex flex-col gap-[15px]">
                          <h3 className="text-[16px] font-semibold text-[#202020] leading-[19.36px]">Actions</h3>
                          
                          {/* Email Input */}
                          <div className="border border-[#E6E6E6] rounded-[5px] p-[15px]">
                            <Textarea
                              value={emailsText}
                              onChange={(e) => setEmailsText(e.target.value)}
                              placeholder="Enter email addresses separated by commas, spaces, or new lines"
                              className="w-full min-h-[100px] border-0 p-0 text-[12px] font-medium text-[#595959] leading-[14.52px] resize-none focus:ring-0 focus-visible:ring-0"
                            />
                          </div>

                          {/* Upload Section */}
                          <div className="border border-[#E6E6E6] rounded-[5px] p-[15px_20px] bg-[#FAFAFA] flex justify-center items-center gap-[10px]">
                            <div className="flex items-center gap-[10px]">
                              <Upload className="w-6 h-6 text-[#595959]" strokeWidth={2} />
                              <span className="text-[12px] font-medium text-[#595959] leading-[14.52px]">
                                Upload SCV/TXT
                              </span>
                            </div>
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
                              <div className="h-9 px-[15px] bg-[#3B43D6] rounded-[5px] flex items-center justify-center">
                                <span className="text-[12px] font-semibold text-white leading-[14.52px]">
                                  Choose File
                                </span>
                              </div>
                            </label>
                          </div>

                          {/* Parsed Count */}
                          <div className="text-[12px] font-medium text-[#717171] leading-[14.52px]">
                            {parseEmails(emailsText).length} emails parsed
                          </div>
                        </div>

                        {/* Notification Type Section */}
                        <div className="border border-dashed border-[#A0A8C2] rounded-[10px] p-5 flex flex-col gap-[15px]">
                          <h3 className="text-[16px] font-semibold text-[#202020] leading-[19.36px]">Notification Type</h3>
                          
                          {/* Dropdown */}
                          <div className="border border-[#E6E6E6] rounded-[5px] p-[15px] flex items-center gap-[10px]">
                            <Select value={selectedAction} onValueChange={setSelectedAction}>
                              <SelectTrigger className="w-full border-0 p-0 h-auto focus:ring-0">
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
                          </div>

                          {/* Preview Label */}
                          <h3 className="text-[16px] font-semibold text-[#202020] leading-[19.36px]">Preview</h3>

                          {/* Preview Content */}
                          <div className="border border-[#E6E6E6] rounded-[5px] p-[15px] flex items-center gap-[10px]">
                            <div className="text-[12px] font-medium text-[#595959] leading-[18px]">
                              <div className="font-semibold mb-2">{getPreview().subject}</div>
                              <div className="whitespace-pre-line">{getPreview().body}</div>
                            </div>
                          </div>
                        </div>

                        {/* Send Button */}
                        <div className="flex justify-end items-center gap-[15px]">
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
                          <button
                            onClick={sendNotifications}
                            disabled={sending || parseEmails(emailsText).length === 0}
                            className="h-9 px-[15px] bg-[#3B43D6] rounded-[5px] text-[12px] font-semibold text-white text-right leading-[14.52px] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sending ? "Sending..." : "Send Notifications"}
                          </button>
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
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

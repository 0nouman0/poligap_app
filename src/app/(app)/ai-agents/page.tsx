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
    "Email Notifier" | "Law Scanner" | "Compliance Monitor" | "Copyright Detector" | null
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

  const openAgent = (
    agent: "Email Notifier" | "Law Scanner" | "Compliance Monitor" | "Copyright Detector"
  ) => {
    setActiveAgent(agent);
    setActiveTab("Actions");
    setOpen(true);
  };

  // Copyright Detector: state and helpers
  const [cdAction, setCdAction] = useState<string>("monitor");
  const [cdSearchTerms, setCdSearchTerms] = useState<string>("brand name, product name");
  const [cdFrom, setCdFrom] = useState<string>("");
  const [cdTo, setCdTo] = useState<string>("");
  const [cdOriginalId, setCdOriginalId] = useState<string>("");
  const [cdSuspect, setCdSuspect] = useState<string>("");
  const [cdLoading, setCdLoading] = useState<boolean>(false);
  const [cdResult, setCdResult] = useState<any>(null);
  const [cdItems, setCdItems] = useState<any[]>([]);

  const runCopyright = async () => {
    setCdLoading(true);
    setCdResult(null);
    setCdItems([]);
    try {
      const data: any = {};
      if (cdAction === "monitor") {
        const terms = cdSearchTerms
          .split(/,|\n|;/)
          .map((s) => s.trim())
          .filter(Boolean);
        data.search_terms = terms;
        if (cdFrom || cdTo) data.date_range = { from: cdFrom || undefined, to: cdTo || undefined };
      } else if (cdAction === "analyze") {
        data.original_content_id = cdOriginalId;
        data.suspect_content = cdSuspect;
      }

      const resp = await fetch("/api/copyright-detector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: cdAction, data }),
      });
      const output = await resp.json();
      setCdResult(output);

      const plan = output?.plan;
      if (plan?.decision === "tool") {
        if (plan.tool_name === "scrapegraph_search") {
          const proxy = await fetch("/api/tools/scrapegraph_search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(plan.params || data),
          });
          const pData = await proxy.json();
          const items = Array.isArray(pData?.data?.items)
            ? pData.data.items
            : Array.isArray(pData?.items)
            ? pData.items
            : Array.isArray(pData?.data)
            ? pData.data
            : [];
          setCdItems(items);
        }
        if (plan.tool_name === "content_similarity_analysis") {
          const proxy = await fetch("/api/tools/content_similarity_analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(plan.params || data),
          });
          const pData = await proxy.json();
          setCdItems(Array.isArray(pData?.data) ? pData.data : pData?.data ? [pData.data] : []);
        }
      }
    } catch (e) {
      setCdResult({ error: "Request failed" });
    } finally {
      setCdLoading(false);
    }
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
  // Compliance Monitor: state and helpers
  const [cmAction, setCmAction] = useState<string>(
    "Fetch new regulatory changes in EU and US for data protection"
  );
  const [cmJurisdictionsText, setCmJurisdictionsText] = useState<string>("EU, US");
  const [cmTopicsText, setCmTopicsText] = useState<string>("data_protection");
  const [cmSince, setCmSince] = useState<string>("2025-01-01");
  const [cmLoading, setCmLoading] = useState(false);
  const [cmResult, setCmResult] = useState<any>(null);
  const [cmItems, setCmItems] = useState<any[]>([]);

  const checkCompliance = async () => {
    setCmLoading(true);
    setCmResult(null);
    setCmItems([]);
    try {
      const jurisdictions = cmJurisdictionsText
        .split(/,|\n|;/)
        .map((s) => s.trim())
        .filter(Boolean);
      const topics = cmTopicsText
        .split(/,|\n|;/)
        .map((s) => s.trim())
        .filter(Boolean);
      const sinceISO = cmSince && cmSince.length === 10 ? `${cmSince}T00:00:00Z` : cmSince;

      const res = await fetch("/api/compliance-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: cmAction,
          data: {
            jurisdictions,
            topics,
            since_timestamp: sinceISO,
          },
        }),
      });
      const output = await res.json();
      setCmResult(output);
      // If the agent proposes to fetch regulation changes, call our proxy
      const plan = output?.plan;
      if (plan?.decision === "tool" && plan?.tool_name === "fetch_regulation_changes") {
        const proxy = await fetch("/api/regulations/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(plan?.params || { jurisdictions, topics, since_timestamp: sinceISO }),
        });
        const data = await proxy.json();
        if (Array.isArray(data?.items)) setCmItems(data.items);
      }
    } catch (e) {
      setCmResult({ error: "Request failed" });
    } finally {
      setCmLoading(false);
    }
  };
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 py-5">
          {/* Email Notifier - Active */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4 h-full">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-full bg-[#EFF1F6] flex items-center justify-center">
                <Mail className="w-6 h-6 text-[#3B43D6]" strokeWidth={2} />
              </div>
              <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-[#EDFFDE] text-[#47AF47]">Active</span>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <h3 className="text-[16px] font-semibold text-gray-900">Email Notifier</h3>
              <p className="text-[12px] text-gray-600 line-clamp-2">
                Automate email alerts and notifications for key events and policy changes.
              </p>
            </div>
            <button
              onClick={() => openAgent("Email Notifier")}
              className="mt-auto w-full h-9 bg-[#3B43D6] hover:bg-[#2f36b4] rounded-md text-[12px] font-semibold text-white"
            >
              Use Agent
            </button>
          </div>

          {/* Law Scanner - Active */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4 h-full">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-full bg-[#EFF1F6] flex items-center justify-center">
                <Scale className="w-6 h-6 text-[#3B43D6]" strokeWidth={2} />
              </div>
              <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-[#EDFFDE] text-[#47AF47]">Active</span>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <h3 className="text-[16px] font-semibold text-gray-900">Law Scanner</h3>
              <p className="text-[12px] text-gray-600 line-clamp-2">
                Scan documents for legal clauses, risks, and compliance issues.
              </p>
            </div>
            <button
              onClick={() => openAgent("Law Scanner")}
              className="mt-auto w-full h-9 bg-[#3B43D6] hover:bg-[#2f36b4] rounded-md text-[12px] font-semibold text-white"
            >
              Use Agent
            </button>
          </div>

          {/* Compliance Monitor - Active */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4 h-full">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-full bg-[#EFF1F6] flex items-center justify-center">
                <Bot className="w-6 h-6 text-[#3B43D6]" strokeWidth={2} />
              </div>
              <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-[#EDFFDE] text-[#47AF47]">Active</span>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <h3 className="text-[16px] font-semibold text-gray-900">Compliance Monitor</h3>
              <p className="text-[12px] text-gray-600 line-clamp-2">
                Track regulatory changes, analyze contracts, and send alerts for risks.
              </p>
            </div>
            <button
              onClick={() => openAgent("Compliance Monitor")}
              className="mt-auto w-full h-9 bg-[#3B43D6] hover:bg-[#2f36b4] rounded-md text-[12px] font-semibold text-white"
            >
              Use Agent
            </button>
          </div>

          {/* Copyright Detector - Active */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4 h-full">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-full bg-[#EFF1F6] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#3B43D6]" strokeWidth={2} />
              </div>
              <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-[#EDFFDE] text-[#47AF47]">Active</span>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <h3 className="text-[16px] font-semibold text-gray-900">Copyright Detector</h3>
              <p className="text-[12px] text-gray-600 line-clamp-2">
                Monitor, analyze, and act on potential copyright infringements.
              </p>
            </div>
            <button
              onClick={() => openAgent("Copyright Detector")}
              className="mt-auto w-full h-9 bg-[#3B43D6] hover:bg-[#2f36b4] rounded-md text-[12px] font-semibold text-white"
            >
              Use Agent
            </button>
          </div>

          {/* Coming Soon */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4 h-full opacity-95">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-full bg-[#EFF1F6] flex items-center justify-center">
                <Construction className="w-6 h-6 text-[#717171]" strokeWidth={2} />
              </div>
              <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-[#F5F5F5] text-[#717171]">Coming Soon</span>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <h3 className="text-[16px] font-semibold text-gray-900">More Agents</h3>
              <p className="text-[12px] text-gray-600 line-clamp-2">
                New specialized agents are in development. Stay tuned for updates!
              </p>
            </div>
            <button
              disabled
              className="mt-auto w-full h-9 bg-[#DADADA] rounded-md text-[12px] font-semibold text-white cursor-not-allowed"
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
              {activeAgent === "Compliance Monitor" && (
                <Bot className="w-6 h-6 text-[#000000]" strokeWidth={2} />
              )}
              {activeAgent === "Copyright Detector" && (
                <Sparkles className="w-6 h-6 text-[#000000]" strokeWidth={2} />
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
                          <button onClick={scanUpdates} disabled={lawLoading} className="px-4 py-2 rounded-md text-sm text-white bg-[#3B43D6] disabled:opacity-50 disabled:cursor-not-allowed">{lawLoading? 'Scanning…' : 'Scan Updates'}</button>
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
                    ) : activeAgent === "Compliance Monitor" ? (
                      <div className="flex flex-col gap-5">
                        {/* Action Section */}
                        <div className="border border-dashed border-[#A0A8C2] rounded-[10px] p-5 flex flex-col gap-[10px]">
                          <h3 className="text-[16px] font-semibold text-[#202020] leading-[19.36px]">Action</h3>
                          <input
                            type="text"
                            value={cmAction}
                            onChange={(e) => setCmAction(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            placeholder="Describe what to do"
                          />
                        </div>

                        {/* Parameters Section */}
                        <div className="border border-dashed border-[#A0A8C2] rounded-[10px] p-5 flex flex-col gap-[12px]">
                          <h3 className="text-[16px] font-semibold text-[#202020] leading-[19.36px]">Parameters</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-1">
                              <label className="block text-xs text-gray-500 mb-1">Jurisdictions</label>
                              <input
                                type="text"
                                value={cmJurisdictionsText}
                                onChange={(e) => setCmJurisdictionsText(e.target.value)}
                                className="w-full border rounded-md px-3 py-2 text-sm"
                                placeholder="e.g., EU, US"
                              />
                              <div className="text-[10px] text-gray-500 mt-1">Comma or newline separated</div>
                            </div>
                            <div className="md:col-span-1">
                              <label className="block text-xs text-gray-500 mb-1">Topics</label>
                              <input
                                type="text"
                                value={cmTopicsText}
                                onChange={(e) => setCmTopicsText(e.target.value)}
                                className="w-full border rounded-md px-3 py-2 text-sm"
                                placeholder="e.g., data_protection, privacy"
                              />
                              <div className="text-[10px] text-gray-500 mt-1">Comma or newline separated</div>
                            </div>
                            <div className="md:col-span-1">
                              <label className="block text-xs text-gray-500 mb-1">Since</label>
                              <input
                                type="date"
                                value={cmSince}
                                onChange={(e) => setCmSince(e.target.value)}
                                className="w-full border rounded-md px-3 py-2 text-sm"
                              />
                              <div className="text-[10px] text-gray-500 mt-1">ISO date; time set 00:00Z</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end items-center gap-[15px]">
                          <button
                            onClick={checkCompliance}
                            disabled={cmLoading}
                            className="h-9 px-[15px] bg-[#3B43D6] rounded-[5px] text-[12px] font-semibold text-white text-right leading-[14.52px] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cmLoading ? "Running..." : "Run"}
                          </button>
                        </div>

                        {cmResult && (
                          <div className="mt-2 border rounded-lg p-4 bg-white space-y-3">
                            {/* Summary */}
                            <div>
                              <div className="text-xs font-semibold text-gray-700 mb-1">Summary</div>
                              <div className="text-sm text-gray-800">
                                {cmResult?.plan?.ui_summary || cmResult?.content || "No summary returned."}
                              </div>
                            </div>

                            {/* Tool selection */}
                            {cmResult?.plan?.decision === "tool" && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-700">Selected Tool:</span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {cmResult?.plan?.tool_name}
                                </span>
                              </div>
                            )}

                            {/* Params */}
                            {cmResult?.plan?.params && (
                              <div>
                                <div className="text-xs font-semibold text-gray-700 mb-1">Parameters</div>
                                <div className="text-xs text-gray-700 bg-gray-50 border rounded p-3 overflow-auto max-h-48">
                                  <pre>{JSON.stringify(cmResult?.plan?.params, null, 2)}</pre>
                                </div>
                              </div>
                            )}

                            {/* Next Steps */}
                            {Array.isArray(cmResult?.plan?.next_steps) && cmResult.plan.next_steps.length > 0 && (
                              <div>
                                <div className="text-xs font-semibold text-gray-700 mb-1">Next steps</div>
                                <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                                  {cmResult.plan.next_steps.map((s: string, i: number) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Results */}
                            {cmItems.length > 0 && (
                              <div>
                                <div className="text-xs font-semibold text-gray-700 mb-2">Results</div>
                                <div className="divide-y border rounded-md bg-gray-50">
                                  {cmItems.map((r: any, idx: number) => (
                                    <div key={idx} className="p-3">
                                      <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                                        {r.source && (
                                          <span className="inline-block px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-800">{r.source}</span>
                                        )}
                                        {r.url ? (
                                          <a href={r.url} target="_blank" rel="noreferrer" className="hover:underline">{r.title || r.url}</a>
                                        ) : (
                                          <span>{r.title || "Untitled"}</span>
                                        )}
                                      </div>
                                      {r.summary && (
                                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">{r.summary}</div>
                                      )}
                                      {r.date && (
                                        <div className="text-xs text-gray-500 mt-1">{r.date}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : activeAgent === "Copyright Detector" ? (
                      <div className="flex flex-col gap-5">
                        {/* Action Select */}
                        <div className="border border-dashed border-[#A0A8C2] rounded-[10px] p-5 flex flex-col gap-[10px]">
                          <h3 className="text-[16px] font-semibold text-[#202020] leading-[19.36px]">Action</h3>
                          <select
                            value={cdAction}
                            onChange={(e) => setCdAction(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                          >
                            <option value="monitor">Monitor</option>
                            <option value="analyze">Analyze</option>
                            <option value="trigger_legal">Trigger Legal</option>
                            <option value="alert">Alert</option>
                          </select>
                        </div>

                        {/* Parameters */}
                        <div className="border border-dashed border-[#A0A8C2] rounded-[10px] p-5 flex flex-col gap-[12px]">
                          <h3 className="text-[16px] font-semibold text-[#202020] leading-[19.36px]">Parameters</h3>
                          {cdAction === "monitor" && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="md:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">Search Terms</label>
                                <input
                                  type="text"
                                  value={cdSearchTerms}
                                  onChange={(e) => setCdSearchTerms(e.target.value)}
                                  className="w-full border rounded-md px-3 py-2 text-sm"
                                  placeholder="e.g., brand name, product name"
                                />
                                <div className="text-[10px] text-gray-500 mt-1">Comma or newline separated</div>
                              </div>
                              <div className="md:col-span-1 grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">From</label>
                                  <input type="date" value={cdFrom} onChange={(e)=>setCdFrom(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">To</label>
                                  <input type="date" value={cdTo} onChange={(e)=>setCdTo(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
                                </div>
                              </div>
                            </div>
                          )}
                          {cdAction === "analyze" && (
                            <div className="grid grid-cols-1 gap-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Original Content ID</label>
                                <input type="text" value={cdOriginalId} onChange={(e)=>setCdOriginalId(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Suspect Content</label>
                                <Textarea value={cdSuspect} onChange={(e)=>setCdSuspect(e.target.value)} className="w-full min-h-[120px] text-[12px]" />
                              </div>
                            </div>
                          )}
                          {(cdAction === "trigger_legal" || cdAction === "alert") && (
                            <div className="text-[12px] text-gray-500">Submit to generate a plan with required fields and next steps.</div>
                          )}
                        </div>

                        <div className="flex justify-end items-center gap-[15px]">
                          <button
                            onClick={runCopyright}
                            disabled={cdLoading}
                            className="h-9 px-[15px] bg-[#3B43D6] rounded-[5px] text-[12px] font-semibold text-white text-right leading-[14.52px] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cdLoading ? "Running..." : "Run"}
                          </button>
                        </div>

                        {cdResult && (
                          <div className="mt-2 border rounded-lg p-4 bg-white space-y-3">
                            <div>
                              <div className="text-xs font-semibold text-gray-700 mb-1">Summary</div>
                              <div className="text-sm text-gray-800">{cdResult?.plan?.ui_summary || cdResult?.content || "No summary returned."}</div>
                            </div>
                            {cdResult?.plan?.decision === "tool" && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-700">Selected Tool:</span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{cdResult?.plan?.tool_name}</span>
                              </div>
                            )}
                            {cdResult?.plan?.params && (
                              <div>
                                <div className="text-xs font-semibold text-gray-700 mb-1">Parameters</div>
                                <div className="text-xs text-gray-700 bg-gray-50 border rounded p-3 overflow-auto max-h-48">
                                  <pre>{JSON.stringify(cdResult?.plan?.params, null, 2)}</pre>
                                </div>
                              </div>
                            )}
                            {Array.isArray(cdResult?.plan?.next_steps) && cdResult.plan.next_steps.length > 0 && (
                              <div>
                                <div className="text-xs font-semibold text-gray-700 mb-1">Next steps</div>
                                <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                                  {cdResult.plan.next_steps.map((s: string, i: number) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {cdItems.length > 0 && (
                              <div>
                                <div className="text-xs font-semibold text-gray-700 mb-2">Results</div>
                                <div className="divide-y border rounded-md bg-gray-50">
                                  {cdItems.map((r: any, idx: number) => (
                                    <div key={idx} className="p-3">
                                      <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                                        {r.source && (<span className="inline-block px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-800">{r.source}</span>)}
                                        {r.url ? (
                                          <a href={r.url} target="_blank" rel="noreferrer" className="hover:underline">{r.title || r.url}</a>
                                        ) : (
                                          <span>{r.title || "Untitled"}</span>
                                        )}
                                      </div>
                                      {r.summary && (<div className="text-xs text-gray-600 mt-1 line-clamp-2">{r.summary}</div>)}
                                      {r.date && (<div className="text-xs text-gray-500 mt-1">{r.date}</div>)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
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

"use client";

import React, { useMemo, useState } from "react";

export default function AIAgentsPage() {
  const [open, setOpen] = useState(false);
  const [activeAgent, setActiveAgent] = useState<
    "Email Notifier" | "Law Scanner" | "IP Verification" | null
  >(null);
  const [activeTab, setActiveTab] = useState<
    "Database" | "Knowledge Base" | "Actions" | "Settings"
  >("Database");

  const tabs: Array<{
    key: "Database" | "Knowledge Base" | "Actions" | "Settings";
    label: string;
  }> = useMemo(
    () => [
      { key: "Database", label: "Database" },
      { key: "Knowledge Base", label: "Knowledge Base" },
      { key: "Actions", label: "Actions" },
      { key: "Settings", label: "Settings" },
    ],
    []
  );

  const openAgent = (agent: "Email Notifier" | "Law Scanner" | "IP Verification") => {
    setActiveAgent(agent);
    setActiveTab("Database");
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
    const map: Record<string, { subject: string; body: string }> = {
      policy_changes: {
        subject: "Important: Policy Changes",
        body: "We have updated our policies. Please review the changes at your earliest convenience.",
      },
      terms_updates: {
        subject: "Update: Terms & Conditions",
        body: "Our Terms & Conditions have been updated. Visit your account to read the new terms.",
      },
      feature_launch: {
        subject: "New Feature Launch 🚀",
        body: "We're excited to announce a new feature now available in your workspace.",
      },
      maintenance: { subject: "Scheduled Maintenance", body: "We will perform scheduled maintenance during the listed window." },
      downtime: { subject: "Incident: Service Downtime", body: "We experienced downtime. The issue has been resolved. Details inside." },
      security: { subject: "Security Advisory", body: "A security-related update requires your attention." },
      newsletter: { subject: "Monthly Newsletter", body: "Catch up on product updates, tips, and resources." },
      promotion: { subject: "Limited-time Promotion", body: "Unlock special discounts available for a short time." },
      survey: { subject: "We value your feedback", body: "Please take a quick survey to help us improve." },
      webinar: { subject: "You're invited: Webinar", body: "Join our upcoming webinar. Save your seat now!" },
      billing: { subject: "Billing Update", body: "There has been an update to your billing information or invoice." },
    };
    return map[selectedAction];
  };

  const sendNotifications = async () => {
    setSending(true);
    setSendResult(null);
    try {
      const recipients = parseEmails(emailsText);
      const res = await fetch("/api/email-notifier/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients, actionType: selectedAction }),
      });
      const data = await res.json();
      setSendResult({ sent: data?.sent || 0, failed: data?.failed || 0 });
    } catch (e) {
      setSendResult({ sent: 0, failed: 0 });
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="h-full min-h-0 overflow-hidden bg-gray-50 flex flex-col items-center px-1 sm:px-2">
      {/* Header */}
      <div className="text-center w-full max-w-screen-2xl pt-4 pb-3">
        <h1 className="text-2xl font-semibold text-purple-600 flex items-center justify-center gap-2">
          AI Agents<span className="text-yellow-400">✨</span>
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          Curated, task-specific agents to accelerate your workflows. Choose an agent below to get started.
        </p>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 w-full max-w-screen-2xl overflow-y-auto">
        {/* Agents Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-3 w-full">
        {/* Email Notifier Agent */}
        <div className="bg-purple-50 border border-purple-100 p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
          <div className="bg-purple-200/70 p-3 rounded-full mb-3">
            <span className="text-purple-700 text-xl">✉️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Email Notifier</h3>
          <p className="text-sm text-gray-600 mt-1">Automate email alerts and notifications for key events.</p>
          <button onClick={() => openAgent("Email Notifier")} className="mt-4 bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition">Use Agent</button>
        </div>

        {/* Law Scanner Agent */}
        <div className="bg-purple-50 border border-purple-100 p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
          <div className="bg-purple-200/70 p-3 rounded-full mb-3">
            <span className="text-purple-700 text-xl">⚖️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Law Scanner</h3>
          <p className="text-sm text-gray-600 mt-1">Scan documents for legal clauses, risks, and compliance.</p>
          <button onClick={() => openAgent("Law Scanner")} className="mt-4 bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition">Use Agent</button>
        </div>

        {/* IP Verification Agent (Intellectual Property) */}
        <div className="bg-purple-50 border border-purple-100 p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
          <div className="bg-purple-200/70 p-3 rounded-full mb-3">
            <span className="text-purple-700 text-xl">🛡️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">IP Verification</h3>
          <p className="text-sm text-gray-600 mt-1">Verify Intellectual Property (IP) ownership, conflicts, and prior art signals.</p>
          <button onClick={() => openAgent("IP Verification")} className="mt-4 bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition">Use Agent</button>
        </div>

        {/* More to come (In Development) */}
        <div className="bg-white border border-dashed border-purple-200 p-6 rounded-xl flex flex-col items-center text-center">
          <div className="bg-purple-50 p-3 rounded-full mb-3">
            <span className="text-purple-600 text-xl">🚧</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">More Coming Soon</h3>
          <p className="text-sm text-gray-600 mt-1">New specialized agents are in development. Stay tuned!</p>
          <button className="mt-4 bg-gray-900/80 text-white px-4 py-2 rounded-md text-sm cursor-not-allowed opacity-70">In Development</button>
        </div>
        </div>
      </div>

      {/* Footer with Input */}
      <div className="w-full max-w-screen-2xl py-3">
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex items-center justify-between">
          <input
            type="text"
            placeholder="Ask anything..."
            className="flex-1 text-sm text-gray-600 outline-none"
          />
          <div className="flex items-center space-x-2">
            <button className="text-gray-400 hover:text-gray-600">
              <span>📎</span>
            </button>
            <button className="text-gray-400 hover:text-gray-600">
              <span>📩</span>
            </button>
            <button className="text-gray-400 hover:text-gray-600">
              <span>🔗</span>
            </button>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-green-600">Gpt-4.1</span>
            <span className="text-xs text-gray-400">•</span>
            <select className="text-xs text-gray-600 bg-transparent border-none outline-none">
              <option>Output in - English</option>
            </select>
            <button className="text-gray-400 hover:text-gray-600">
              <span>🎙️</span>
            </button>
            <button className="text-gray-400 hover:text-gray-600">
              <span>🔍</span>
            </button>
          </div>
        </div>
      </div>
      {/* Modal: Agent Workspace */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white w-[95vw] max-w-5xl h-[46vh] max-h-[46vh] rounded-xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 sm:px-5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-purple-600">🤖</span>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">{activeAgent} Agent</h2>
              </div>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            {/* Body */}
            <div className="flex h-[calc(46vh-48px)]">
              {/* Sidebar */}
              <aside className="w-36 sm:w-48 border-r bg-gray-50/60 p-2">
                <nav className="space-y-1">
                  {tabs.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setActiveTab(t.key)}
                      className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-md text-sm transition ${
                        activeTab === t.key
                          ? "bg-purple-100 text-purple-800"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <span className="text-base">
                        {t.key === "Database" && "🗄️"}
                        {t.key === "Knowledge Base" && "🧠"}
                        {t.key === "Actions" && "⚡"}
                        {t.key === "Settings" && "⚙️"}
                      </span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </nav>
              </aside>
              {/* Content */}
              <section className="flex-1 p-3 sm:p-5 overflow-y-auto">
                {activeTab === "Database" && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><span>🗄️</span> Database</h3>
                    <p className="text-sm text-gray-600 mt-1">Placeholder: Connect and manage this agent's structured data sources.</p>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="border rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-800">Tables</p>
                        <p className="text-xs text-gray-500">0 connected</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-800">Integrations</p>
                        <p className="text-xs text-gray-500">Add Postgres, MySQL, etc.</p>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === "Knowledge Base" && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><span>🧠</span> Knowledge Base</h3>
                    <p className="text-sm text-gray-600 mt-1">Placeholder: Upload documents, URLs, and media for the agent to learn from.</p>
                    <div className="mt-4 border-dashed border-2 border-purple-200 rounded-lg p-6 text-center text-sm text-gray-600">Drop files or click to upload</div>
                  </div>
                )}
                {activeTab === "Actions" && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><span>⚡</span> Actions</h3>
                    {activeAgent === "Email Notifier" ? (
                      <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                          <div className="lg:col-span-2 border rounded-lg p-3">
                            <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><span>📧</span> Recipients (comma, space or newline separated)</label>
                            <textarea
                              value={emailsText}
                              onChange={(e) => setEmailsText(e.target.value)}
                              rows={6}
                              className="w-full border rounded-md px-3 py-2 text-sm resize-y"
                              placeholder="alice@example.com, bob@example.com\nor paste from a spreadsheet"
                            />
                            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                              <div>Parsed: {parseEmails(emailsText).length} emails</div>
                              <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                  type="file"
                                  accept=".csv,.txt,.tsv"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) onUploadEmails(f);
                                    // reset input so same file can be reselected
                                    e.currentTarget.value = "";
                                  }}
                                />
                                <span className="px-2 py-1 border rounded-md bg-gray-50">Upload CSV/TXT</span>
                              </label>
                            </div>
                          </div>
                          <div className="border rounded-lg p-3">
                            <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><span>🪄</span> Notification type</label>
                            <select
                              value={selectedAction}
                              onChange={(e) => setSelectedAction(e.target.value)}
                              className="w-full border rounded-md px-3 py-2 text-sm"
                            >
                              {emailActions.map((a) => (
                                <option key={a.value} value={a.value}>{a.label}</option>
                              ))}
                            </select>
                            <div className="mt-4 border rounded-md p-3 bg-purple-50/40">
                              <div className="text-xs uppercase tracking-wide text-purple-700 mb-1 flex items-center gap-1"><span>👁️</span> Preview</div>
                              <div className="text-sm font-medium text-gray-800">{getPreview().subject}</div>
                              <div className="text-sm text-gray-600 mt-1">{getPreview().body}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={sendNotifications}
                            disabled={sending || parseEmails(emailsText).length === 0}
                            className="px-4 py-2 rounded-md text-sm text-white bg-black disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sending ? "Sending..." : "Send Notifications"}
                          </button>
                          {sendResult && (
                            <div className="text-xs text-gray-600">
                              Sent: <span className="font-semibold text-green-700">{sendResult.sent}</span> • Failed: <span className="font-semibold text-red-700">{sendResult.failed}</span>
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
                )}
                {activeTab === "Settings" && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><span>⚙️</span> Settings</h3>
                    <p className="text-sm text-gray-600 mt-1">Placeholder: Configure model, permissions, and notifications.</p>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between border rounded-lg p-3">
                        <span className="text-sm text-gray-700">Enable notifications</span>
                        <input type="checkbox" className="toggle toggle-sm" />
                      </div>
                      <div className="border rounded-lg p-3">
                        <label className="block text-xs text-gray-500 mb-1">Model</label>
                        <select className="w-full border rounded-md px-3 py-2 text-sm">
                          <option>Default</option>
                          <option>Advanced</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

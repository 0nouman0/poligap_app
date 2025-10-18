"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Shield, FileText, CheckCircle, AlertTriangle, Download, Copy, Settings, Database, Info, BookOpen, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuditLogsStore } from "@/stores/audit-logs-store";
import { useUserStore } from "@/stores/user-store";
import { Skeleton } from "@/components/ui/skeleton";

// Lightweight UI primitives (searchable multi-select and searchable select)
function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
}: { options: string[]; value: string[]; onChange: (next: string[]) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt));
    else onChange([...value, opt]);
  };

  const clearAll = () => onChange([]);
  const selectAll = () => onChange([...options]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border border-input rounded-md px-3 py-2 text-sm flex justify-between items-center hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
      >
        <span className="truncate">
          {value.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="flex flex-wrap gap-1">
                {value.slice(0, 3).map(v => (
                  <span key={v} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs border border-primary/20">{v}</span>
                ))}
              </span>
              {value.length > 3 && (
                <span className="text-xs text-muted-foreground">+{value.length - 3} more</span>
              )}
            </span>
          )}
        </span>
        <span className="text-xs text-muted-foreground mr-2">{value.length} selected</span>
        <svg className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"/></svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full bg-popover border border-border rounded-md shadow-lg">
          <div className="p-2 border-b border-border flex gap-2 items-center">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search frameworks..." className="flex-1 border border-input rounded px-2 py-1 text-sm bg-background text-foreground"/>
            <button type="button" onClick={selectAll} className="text-xs px-2 py-1 border border-input rounded hover:bg-accent bg-background text-foreground">All</button>
            <button type="button" onClick={clearAll} className="text-xs px-2 py-1 border border-input rounded hover:bg-accent bg-background text-foreground">Clear</button>
          </div>
          <div className="px-2 pt-2 text-[11px] text-muted-foreground">Quick select:</div>
          <div className="px-2 pb-1 flex gap-1 flex-wrap">
            {['GDPR','ISO 27001','SOC 2','NIST CSF','PCI DSS'].map(q => (
              <button key={q} type="button" onClick={()=>toggle(q)} className="px-2 py-0.5 rounded-full bg-muted hover:bg-accent text-foreground border border-border text-[11px]">{q}</button>
            ))}
          </div>
          <div className="max-h-56 overflow-y-auto p-2 space-y-1">
            {filtered.map(opt => (
              <label key={opt} className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-accent cursor-pointer text-foreground">
                <input type="checkbox" className="accent-primary" checked={value.includes(opt)} onChange={()=>toggle(opt)} />
                <span>{opt}</span>
              </label>
            ))}
            {filtered.length === 0 && <div className="text-xs text-muted-foreground px-2 py-1">No results</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Select",
}: { options: string[]; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));
  const current = value || "";
  return (
    <div className="relative">
      <button 
        type="button" 
        onClick={()=>setOpen(!open)} 
        className="w-full h-[40px] bg-white border border-[#E6E6E6] rounded-[5px] px-5 text-[14px] font-medium text-[#595959] flex items-center justify-between"
      >
        <span className={current ? '' : 'text-[#595959]'}>{current || placeholder}</span>
        <ChevronDown className="w-[18px] h-[18px]" />
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-[#E6E6E6] rounded-[5px] shadow-lg">
          <div className="p-2 border-b border-[#E6E6E6]">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search..." className="w-full border border-[#E6E6E6] rounded px-2 py-1 text-sm bg-white text-[#595959]"/>
          </div>
          <div className="max-h-56 overflow-y-auto p-2">
            {filtered.map(opt => (
              <button key={opt} type="button" className="w-full text-left px-2 py-1 text-sm rounded hover:bg-[#EFF1F6] text-[#595959]" onClick={()=>{ onChange(opt); setOpen(false); }}>
                {opt}
              </button>
            ))}
            {filtered.length === 0 && <div className="text-xs text-[#6A707C] px-2 py-1">No results</div>}
          </div>
        </div>
      )}
    </div>
  );
}

type GenInputs = {
  policyType: string;
  industry: string;
  region: string;
  orgType: string;
  frameworks: string[];
  applyRuleBase: boolean;
  customRules: string;
  kbNotes: string;
};

export default function PolicyGeneratorPage() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [result, setResult] = useState<string>("");

  // Use Zustand store for audit logs
  const { logs: allAuditLogs, isLoading: logsLoading, fetchLogs: fetchAuditLogs, addLog } = useAuditLogsStore();
  const [logsError, setLogsError] = useState<string | null>(null);
  
  // Get user data from store
  const { userData } = useUserStore();

  // Helper to get userId with fallback
  const getUserId = (): string | null => {
    // 1. Try user store
    if (userData?.userId) return userData.userId;
    
    // 2. Try localStorage
    if (typeof window !== 'undefined') {
      const localUserId = localStorage.getItem('user_id');
      if (localUserId) return localUserId;
      
      // 3. Try userData stored in localStorage
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        try {
          const parsed = JSON.parse(userDataStr);
          if (parsed?.userId) return parsed.userId;
        } catch (e) {
          console.error('Failed to parse userData from localStorage', e);
        }
      }
    }
    
    // 4. Try environment variable
    return process.env.NEXT_PUBLIC_DEFAULT_USER_ID || null;
  };

  const [inputs, setInputs] = useState<GenInputs>({
    policyType: "Privacy Policy",
    industry: "",
    region: "",
    orgType: "",
    frameworks: [],
    applyRuleBase: false,
    customRules: "",
    kbNotes: "",
  });

  // Filter policy logs based on selected policy type
  const policyLogs = useMemo(() => {
    if (!inputs.policyType) return [];
    return allAuditLogs.filter(log => 
      log.standards?.includes(inputs.policyType)
    ).slice(0, 20);
  }, [allAuditLogs, inputs.policyType]);

  const steps = [
    { id: 1, title: "Select Inputs", description: "Choose policy type and context" },
    { id: 2, title: "Knowledge & Rules", description: "Provide knowledge base and custom rules" },
    { id: 3, title: "Review & Generate", description: "Confirm and generate policy" },
    { id: 4, title: "Results", description: "Preview and export" },
  ];

  const canProceed1 = inputs.policyType.length > 0;
  const canProceed2 = true;
  const canGenerate = canProceed1 && canProceed2 && !isGenerating;

  // Predefined lists
  const AVAILABLE_FRAMEWORKS: string[] = [
    'GDPR',
    'ISO 27001',
    'SOC 2',
    'CCPA',
    'DPDP Act',
    'HIPAA',
    'PCI DSS',
    'NIST CSF',
    'NIST 800-53',
    'NIS2',
    'DORA',
    'ISO 22301',
    'ISO 27701',
    'ISO 9001',
    'COBIT 2019',
    'SOX',
    'GLBA',
    'FERPA',
    'ITAR',
    'FedRAMP',
    'CSA CCM',
    'CIS Controls',
    'MAS TRMG',
    'PDPA (Singapore)',
    'UAE DPL',
    'DIFC DPL',
  ];

  const AVAILABLE_REGIONS: string[] = [
    'Global',
    'India',
    'United States',
    'European Union',
    'United Kingdom',
    'Canada',
    'Australia',
    'Singapore',
    'United Arab Emirates',
    'Saudi Arabia',
    'Qatar',
    'Japan',
    'South Korea',
    'Brazil',
  ];

  const generatePolicy = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setResult("");
    try {
      const res = await fetch("/api/policy-generator/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs }),
      });
      const data = await res.json();
      setResult(data?.content || "");
      setCurrentStep(4);

      // Save audit log for policy generation (store will be updated via addLog)
      await savePolicyAuditLog(data?.content || "");
      console.log("Policy generation saved to history.");
    } catch (e) {
      setResult("Generation failed. Please try again.");
      setCurrentStep(4);
      console.error("Generation Failed", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Save to shared audit logs collection
  const savePolicyAuditLog = async (content: string) => {
    try {
      const userId = getUserId();
      if (!userId) {
        console.error('Failed to save policy audit log: User ID not found');
        return;
      }

      const payload = {
        fileName: `${inputs.policyType.replace(/\s+/g,'-').toLowerCase()}.md`,
        standards: [inputs.policyType, ...(inputs.frameworks || [])],
        score: 75, // neutral score placeholder for generator
        status: 'partial',
        gapsCount: 0,
        fileSize: content ? content.length : 0,
        analysisMethod: 'policy-generator',
        userId: userId,
        snapshot: {
          inputs,
          content,
        },
      };
      const resp = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        console.error('Failed to save policy audit log', err);
      } else {
        const json = await resp.json().catch(() => null);
        // Add to store for instant UI update
        if (json?.log) {
          addLog(json.log);
        }
      }
    } catch (e) {
      console.error('Error saving policy audit log', e);
    }
  };

  // Fetch audit logs from store when component mounts or policy type changes
  useEffect(() => {
    const userId = getUserId();
    if (userId) {
      setLogsError(null);
      fetchAuditLogs(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs.policyType]);

  return (
    <div className="w-full h-screen bg-[#FAFAFB] py-4 md:py-6 px-3 md:px-4 overflow-x-hidden overflow-y-hidden flex flex-col">
      <div className="w-full max-w-[1648px] mx-auto overflow-x-hidden flex-1 flex flex-col overflow-y-hidden">
        {/* Header Section */}
        <div className="w-full max-w-[1648px] flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-[32px] gap-4 md:gap-0">
          {/* Left: Title and Description */}
          <div className="flex items-center gap-3 md:gap-[15px]">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#3B43D6] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2.57} />
            </div>
            <div>
              <h1 className="text-sm md:text-[16px] font-semibold text-[#2D2F34] leading-tight">
                Policy Generator
              </h1>
              <p className="text-xs md:text-[12px] text-[#6A707C] leading-tight mt-1 md:mt-[5px]">
                Generate organization-ready policies with your knowledge base, custom rules, and optional RuleBase.
              </p>
            </div>
          </div>

          {/* Right: Step Indicators */}
          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {/* Step 01 */}
            <div className={`w-8 h-8 md:w-[39px] md:h-[39px] rounded-full flex items-center justify-center flex-shrink-0 ${currentStep >= 1 ? 'bg-[#3B43D6]' : 'bg-white border border-[#D9D9D9]'}`}>
              <span className={`text-sm md:text-[16px] font-semibold ${currentStep >= 1 ? 'text-white' : 'text-[#717171]'}`}>01</span>
            </div>
            
            {/* Connector 1 */}
            <div className="w-12 md:w-[62px] h-0 border-t border-dashed border-[#A0A8C2] flex-shrink-0" />
            
            {/* Step 02 */}
            <div className={`w-8 h-8 md:w-[39px] md:h-[39px] rounded-full flex items-center justify-center flex-shrink-0 ${currentStep >= 2 ? 'bg-[#3B43D6]' : 'bg-white border border-[#D9D9D9]'}`}>
              <span className={`text-sm md:text-[16px] font-semibold ${currentStep >= 2 ? 'text-white' : 'text-[#717171]'}`}>02</span>
            </div>
            
            {/* Connector 2 */}
            <div className="w-12 md:w-[62px] h-0 border-t border-dashed border-[#A0A8C2] flex-shrink-0" />
            
            {/* Step 03 */}
            <div className={`w-8 h-8 md:w-[39px] md:h-[39px] rounded-full flex items-center justify-center flex-shrink-0 ${currentStep >= 3 ? 'bg-[#3B43D6]' : 'bg-white border border-[#D9D9D9]'}`}>
              <span className={`text-sm md:text-[16px] font-semibold ${currentStep >= 3 ? 'text-white' : 'text-[#717171]'}`}>03</span>
            </div>
            
            {/* Connector 3 */}
            <div className="w-12 md:w-[62px] h-0 border-t border-dashed border-[#A0A8C2] flex-shrink-0" />
            
            {/* Step 04 */}
            <div className={`w-8 h-8 md:w-[39px] md:h-[39px] rounded-full flex items-center justify-center flex-shrink-0 ${currentStep >= 4 ? 'bg-[#3B43D6]' : 'bg-white border border-[#D9D9D9]'}`}>
              <span className={`text-sm md:text-[16px] font-semibold ${currentStep >= 4 ? 'text-white' : 'text-[#717171]'}`}>04</span>
            </div>
          </div>
        </div>

        {/* Main Content Area with Right Sidebar */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-[25px] overflow-x-hidden flex-1 overflow-y-hidden">
          {/* Main Form Area */}
          <div className={`flex-1 w-full max-w-[1648px] min-w-0 ${currentStep === 4 ? 'overflow-y-auto' : 'overflow-y-hidden'}`}>
          {currentStep === 1 && (
            <div className="flex flex-col gap-4 md:gap-[25px]">
              {/* Input Fields Card */}
              <div className="bg-white rounded-[10px] border border-[#DEE3ED] p-5 shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)]">
              {/* First Row */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-[25px] mb-4 md:mb-[25px]">
                {/* Policy Type */}
                <div className="flex-1 flex flex-col gap-3 md:gap-[18px]">
                  <label className="text-xs md:text-[14px] font-medium text-[#595959]">Policy Type</label>
                  <div className="relative">
                    <select 
                      value={inputs.policyType} 
                      onChange={(e)=>setInputs({...inputs, policyType:e.target.value})} 
                      className="w-full h-[40px] bg-white border border-[#E6E6E6] rounded-[5px] px-5 text-[14px] font-medium text-[#595959] appearance-none cursor-pointer"
                    >
                      {[
                        "Privacy Policy",
                        "Cookie Policy",
                        "Information Security Policy",
                        "Data Retention Policy",
                        "Acceptable Use Policy",
                        "Vendor Management Policy",
                      ].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#595959] pointer-events-none" />
                  </div>
                </div>

                {/* Industry / Domain */}
                <div className="flex-1 flex flex-col gap-3 md:gap-[18px]">
                  <label className="text-xs md:text-[14px] font-medium text-[#595959]">Industry / Domain</label>
                  <input 
                    className="w-full h-[40px] bg-white border border-[#E6E6E6] rounded-[5px] px-5 text-[14px] font-medium text-[#595959] placeholder:text-[#595959]" 
                    value={inputs.industry} 
                    onChange={(e)=>setInputs({...inputs, industry:e.target.value})} 
                    placeholder="e.g. SaaS, FinTech" 
                  />
                </div>
              </div>

              {/* Second Row */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-[25px] mb-4 md:mb-[25px]">
                {/* Region / Country */}
                <div className="flex-1 flex flex-col gap-3 md:gap-[18px]">
                  <label className="text-xs md:text-[14px] font-medium text-[#595959]">Region / Country</label>
                  <div className="relative">
                    <SearchSelect
                      options={AVAILABLE_REGIONS}
                      value={inputs.region}
                      onChange={(v)=>setInputs({...inputs, region: v})}
                      placeholder="Select"
                    />
                  </div>
                </div>

                {/* Organization Type */}
                <div className="flex-1 flex flex-col gap-3 md:gap-[18px]">
                  <label className="text-xs md:text-[14px] font-medium text-[#595959]">Organization Type</label>
                  <div className="relative">
                    <select 
                      value={inputs.orgType} 
                      onChange={(e)=>setInputs({...inputs, orgType:e.target.value})} 
                      className="w-full h-[40px] bg-white border border-[#E6E6E6] rounded-[5px] px-5 text-[14px] font-medium text-[#595959] appearance-none cursor-pointer"
                    >
                      <option value="">Select</option>
                      <option value="startup">Startup</option>
                      <option value="smb">SMB</option>
                      <option value="enterprise">Enterprise</option>
                      <option value="public">Public Sector</option>
                      <option value="nonprofit">Non-profit</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#595959] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Frameworks */}
              <div className="flex flex-col gap-3 md:gap-[18px] mb-4 md:mb-[25px]">
                <label className="text-xs md:text-[14px] font-medium text-[#595959]">Frameworks</label>
                <div className="bg-white border border-[#E6E6E6] rounded-[5px] p-[10px] flex flex-wrap gap-[8px]">
                  {['GDPR', 'ISO 27001', 'SOC 2', 'CCPA', 'DPDP Act', 'HIPAA'].map(fw => (
                    <button
                      key={fw}
                      type="button"
                      onClick={() => {
                        if (inputs.frameworks.includes(fw)) {
                          setInputs({...inputs, frameworks: inputs.frameworks.filter(f => f !== fw)});
                        } else {
                          setInputs({...inputs, frameworks: [...inputs.frameworks, fw]});
                        }
                      }}
                      className={`px-[7px] py-[5px] rounded-[20px] text-[14px] font-medium transition-colors ${
                        inputs.frameworks.includes(fw) 
                          ? 'bg-[#3B43D6] text-white' 
                          : 'bg-[#EFF1F6] text-[#595959]'
                      }`}
                    >
                      {fw}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply RuleBase */}
              <div className="flex items-center gap-[10px] mb-4 md:mb-[25px]">
                <input 
                  type="checkbox" 
                  id="applyRuleBase"
                  checked={inputs.applyRuleBase} 
                  onChange={(e)=>setInputs({...inputs, applyRuleBase:e.target.checked})}
                  className="w-5 h-5 border-2 border-black rounded cursor-pointer accent-[#3B43D6]"
                />
                <div>
                  <label htmlFor="applyRuleBase" className="text-[14px] font-semibold text-[#2D2F34] cursor-pointer">
                    Apply RuleBase during generation
                  </label>
                  <p className="text-[11px] text-[#6A707C] mt-[3px]">
                    RuleBase guides clause selection and phrasing to your compliance profile.
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-end gap-[15px]">
                <button
                  onClick={()=> setCurrentStep(Math.max(1, currentStep-1))}
                  disabled={currentStep === 1}
                  className="h-9 px-[10px] rounded-[5px] bg-[#FAFAFA] border border-[#717171] text-[12px] font-semibold text-[#717171] flex items-center gap-[5px] disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Previous
                </button>
                <button
                  onClick={()=> setCurrentStep(currentStep+1)}
                  disabled={!canProceed1 || isGenerating}
                  className="h-9 px-[15px] rounded-[5px] bg-[#3B43D6] text-white text-[12px] font-semibold flex items-center gap-[5px] disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col gap-4 md:gap-[25px]">
              {/* Knowledge Base & Custom Rules Card */}
              <div className="bg-white rounded-[10px] border border-[#DEE3ED] p-5 shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)]">
              {/* Knowledge Base Notes */}
              <div className="flex flex-col gap-3 md:gap-[18px] mb-4 md:mb-[25px]">
                <label className="text-sm md:text-[16px] font-semibold text-[#2D2F34]">Knowledge Base Notes</label>
                <textarea 
                  rows={5} 
                  className="w-full bg-white border border-[#E6E6E6] rounded-[5px] px-5 py-4 text-[14px] text-[#595959] placeholder:text-[#595959] resize-none" 
                  value={inputs.kbNotes} 
                  onChange={(e)=>setInputs({...inputs, kbNotes:e.target.value})} 
                  placeholder="Describe your data types, processing activities, retention needs, etc." 
                />
              </div>

              {/* Custom Rules */}
              <div className="flex flex-col gap-3 md:gap-[18px] mb-4 md:mb-[25px]">
                <label className="text-sm md:text-[16px] font-semibold text-[#2D2F34]">Custom Rules</label>
                <textarea 
                  rows={5} 
                  className="w-full bg-white border border-[#E6E6E6] rounded-[5px] px-5 py-4 text-[14px] text-[#595959] placeholder:text-[#595959] resize-none" 
                  value={inputs.customRules} 
                  onChange={(e)=>setInputs({...inputs, customRules:e.target.value})} 
                  placeholder="Enter any specific clauses, exclusions, or constraints you want enforced" 
                />
              </div>

              <div className="text-[12px] text-[#6A707C] mb-4 md:mb-[25px]">
                Tip: You can later move your notes to a proper Knowledge Base page and select assets for reuse.
              </div>

              {/* Navigation */}
              <div className="flex justify-end gap-3 md:gap-[15px]">
                <button
                  onClick={()=> setCurrentStep(Math.max(1, currentStep-1))}
                  className="h-10 md:h-9 px-4 md:px-[10px] rounded-[5px] bg-[#FAFAFA] border border-[#717171] text-xs md:text-[12px] font-semibold text-[#717171] flex items-center gap-[5px]"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Previous
                </button>
                <button
                  onClick={()=> setCurrentStep(currentStep+1)}
                  disabled={!canProceed1 || isGenerating}
                  className="h-10 md:h-9 px-4 md:px-[15px] rounded-[5px] bg-[#3B43D6] text-white text-xs md:text-[12px] font-semibold flex items-center gap-[5px] disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col gap-4 md:gap-[20px]">
              {/* Statutory Warning */}
              <div className="bg-[#FFFCE9] border border-[#FFBF71] rounded-[10px] p-3 md:p-4 shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)]">
                <div className="flex gap-2 md:gap-[10px]">
                  <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-[#E55400] flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <div className="flex flex-col gap-1 md:gap-[8px]">
                    <div className="text-xs md:text-[14px] font-semibold text-[#E55400]">Statutory Warning</div>
                    <div className="text-[11px] md:text-[12px] text-[#2D2F34] leading-relaxed">
                      This Policy Generator produces draft content for reference only. It is not legal advice and should not be used as-is in real-world scenarios. Use responsibly and have your organization's legal/compliance team review before any adoption.
                    </div>
                  </div>
                </div>
              </div>

              {/* Context and Configuration */}
              <div className="bg-white rounded-[10px] border border-[#DEE3ED] p-4 md:p-5 shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] flex flex-col gap-3 md:gap-4">
                {/* Context Section */}
                <div className="text-sm md:text-[14px] font-semibold text-[#2D2F34]">Context</div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-[24px]">
                  <div className="min-w-0">
                    <div className="text-xs md:text-[14px] font-semibold text-[#2D2F34]">Type</div>
                    <div className="text-[11px] md:text-[12px] text-[#6A707C] mt-1 md:mt-[8px] break-words">{inputs.policyType || 'Cookie Policy'}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs md:text-[14px] font-semibold text-[#2D2F34]">Industry</div>
                    <div className="text-[11px] md:text-[12px] text-[#6A707C] mt-1 md:mt-[8px] break-words">{inputs.industry || 'SaaS'}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs md:text-[14px] font-semibold text-[#2D2F34]">Region</div>
                    <div className="text-[11px] md:text-[12px] text-[#6A707C] mt-1 md:mt-[8px] break-words">{inputs.region || 'United State'}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs md:text-[14px] font-semibold text-[#2D2F34]">ORG</div>
                    <div className="text-[11px] md:text-[12px] text-[#6A707C] mt-1 md:mt-[8px] break-words">{inputs.orgType || 'smb'}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs md:text-[14px] font-semibold text-[#2D2F34]">Generated On</div>
                    <div className="text-[11px] md:text-[12px] text-[#6A707C] mt-1 md:mt-[8px] break-words">{new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs md:text-[14px] font-semibold text-[#2D2F34]">RuleBase</div>
                    <div className="text-[11px] md:text-[12px] text-[#6A707C] mt-1 md:mt-[8px] break-words">{inputs.applyRuleBase ? 'Enabled' : 'Disabled'}</div>
                  </div>
                </div>

                {/* Configuration Section */}
                <div className="text-sm md:text-[14px] font-semibold text-[#2D2F34]">Configuration</div>
                <div className="flex flex-wrap gap-[8px] py-[10px]">
                  {inputs.frameworks.length > 0 ? (
                    inputs.frameworks.map(fw => (
                      <div key={fw} className="px-[7px] py-[5px] bg-[#EFF1F6] rounded-[20px] text-xs md:text-[14px] font-medium text-[#595959]">
                        {fw}
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="px-[7px] py-[5px] bg-[#EFF1F6] rounded-[20px] text-xs md:text-[14px] font-medium text-[#595959]">GDPR</div>
                      <div className="px-[7px] py-[5px] bg-[#EFF1F6] rounded-[20px] text-xs md:text-[14px] font-medium text-[#595959]">ISO 27001</div>
                      <div className="px-[7px] py-[5px] bg-[#EFF1F6] rounded-[20px] text-xs md:text-[14px] font-medium text-[#595959]">SOC 2</div>
                      <div className="px-[7px] py-[5px] bg-[#EFF1F6] rounded-[20px] text-xs md:text-[14px] font-medium text-[#595959]">CCPA</div>
                      <div className="px-[7px] py-[5px] bg-[#EFF1F6] rounded-[20px] text-xs md:text-[14px] font-medium text-[#595959]">DPDP Act</div>
                      <div className="px-[7px] py-[5px] bg-[#EFF1F6] rounded-[20px] text-[14px] font-medium text-[#595959]">HIPAA</div>
                    </>
                  )}
                </div>

                {/* Knowledge Notes */}
                <div className="text-sm md:text-[14px] font-semibold text-[#2D2F34]">Knowledge Notes</div>
                <div className="text-[11px] md:text-[12px] text-[#6A707C]">
                  {inputs.kbNotes || 'Generate organization-ready policies with your knowledge base, custom rules, and optional RuleBase.'}
                </div>

                {/* Custom Rules */}
                <div className="text-sm md:text-[14px] font-semibold text-[#2D2F34]">Custom Rules</div>
                <div className="text-[11px] md:text-[12px] text-[#6A707C]">
                  {inputs.customRules || 'Generate organization-ready policies with your knowledge base, custom rules, and optional RuleBase.'}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-end gap-3 md:gap-[15px]">
                <button
                  onClick={()=> setCurrentStep(Math.max(1, currentStep-1))}
                  className="h-10 md:h-9 px-4 md:px-[10px] rounded-[5px] bg-[#FAFAFA] border border-[#717171] text-xs md:text-[12px] font-semibold text-[#717171] flex items-center gap-[5px]"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Previous
                </button>
                <button
                  onClick={generatePolicy}
                  disabled={!canGenerate}
                  className="h-10 md:h-9 px-4 md:px-[15px] rounded-[5px] bg-[#3B43D6] text-white text-xs md:text-[12px] font-semibold flex items-center gap-[5px] disabled:opacity-50 transition-opacity"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate Policy'
                  )}
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="flex flex-col gap-4 md:gap-[25px]">
              {/* Info Header */}
              <div className="flex items-center gap-2 text-xs md:text-[12px] text-[#6A707C]">
                <Info className="h-4 w-4"/> 
                Generated for: {inputs.policyType} ({inputs.region || 'Global'})
              </div>

              {/* Content Card */}
              <div className="bg-white border border-[#DEE3ED] rounded-[10px] p-4 md:p-6 max-h-[500px] overflow-y-auto shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)]">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result || 'No content.'}</ReactMarkdown>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button 
                  onClick={() => navigator.clipboard.writeText(result)} 
                  className="h-10 md:h-9 px-4 md:px-[15px] rounded-[5px] bg-white border border-[#E6E6E6] text-xs md:text-[12px] font-semibold text-[#595959] flex items-center justify-center gap-2 hover:bg-[#FAFAFB] transition-colors"
                >
                  <Copy className="h-4 w-4"/> Copy
                </button>
                <a
                  href={`data:text/markdown;charset=utf-8,${encodeURIComponent(result)}`}
                  download={`${inputs.policyType.replace(/\s+/g,'-').toLowerCase()}-draft.md`}
                  className="h-10 md:h-9 px-4 md:px-[15px] rounded-[5px] bg-white border border-[#E6E6E6] text-xs md:text-[12px] font-semibold text-[#595959] flex items-center justify-center gap-2 hover:bg-[#FAFAFB] transition-colors"
                >
                  <Download className="h-4 w-4"/> Export .md
                </a>
              </div>

              {/* Navigation */}
              <div className="flex justify-end gap-3 md:gap-[15px] mt-4 md:mt-[25px]">
                <button
                  onClick={()=> { setCurrentStep(1); setResult(""); }}
                  className="h-10 md:h-9 px-4 md:px-[15px] rounded-[5px] bg-[#3B43D6] text-white text-xs md:text-[12px] font-semibold flex items-center gap-[5px] hover:bg-[#2D35B8] transition-colors"
                >
                  New Policy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Audit Logs Sidebar */}
        <div className="w-full lg:w-[322px] lg:max-w-[322px] lg:h-[500px] bg-white rounded-[10px] border border-[#DEE3ED] p-6 flex-shrink-0 min-w-0 overflow-y-hidden flex flex-col shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)]">
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="w-5 h-5 text-[#717171]" strokeWidth={1.67} />
            <div className="text-[16px] font-semibold text-[#2D2F34]">Audit Logs</div>
          </div>
          <div className="text-[12px] text-[#6A707C] mb-6">
            Historical generations for "{inputs.policyType}".
          </div>

          {logsLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-[10px] border border-[#DEE3ED] p-4 shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!logsLoading && logsError && (
            <div className="text-sm text-red-600 dark:text-red-400">{logsError}</div>
          )}

          {!logsLoading && !logsError && policyLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-16">
              <svg width="169" height="77" viewBox="0 0 169 77" fill="none" className="mb-4">
                <rect x="7.25" y="17.11" width="66.29" height="42.6" fill="rgba(246, 247, 251, 0.7)" />
                <rect y="32.89" width="33.21" height="9.7" fill="#605BFF" />
                <rect y="0" width="45.53" height="8.32" fill="#C0CADE" />
                <rect y="13.03" width="66.29" height="5.54" fill="#DEE3ED" />
                <rect y="21.81" width="56.24" height="5.54" fill="#DEE3ED" />
                <rect x="90.08" y="12.66" width="69.3" height="51.51" fill="rgba(246, 247, 251, 0.7)" />
                <rect x="104.32" y="22.58" width="36.45" height="41.59" fill="#D4DEEE" />
                <rect x="104.32" y="22.58" width="33.69" height="36.08" fill="#695CFF" />
                <rect x="140.93" y="41.3" width="32.69" height="29.66" fill="#AE8FF7" />
              </svg>
              <div className="text-[12px] text-[#6A707C] text-center">No logs yet for this policy.</div>
            </div>
          )}

          {!logsLoading && !logsError && policyLogs.length > 0 && (
            <div className="space-y-2 max-h-[370px] overflow-y-auto pr-1">
              {policyLogs.map((log: any, index: number) => (
                <div key={log._id ? `${log._id}-${index}` : `log-${index}`} className="border border-border rounded-md p-3 hover:bg-accent/50 transition-colors bg-card">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium truncate text-foreground">
                      {log.fileName || inputs.policyType}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        log.status === 'compliant'
                          ? 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400'
                          : log.status === 'non-compliant'
                          ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                    <span>
                      {new Date(log.analysisDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {typeof log.gapsCount === 'number' && <span>• {log.gapsCount} issues</span>}
                    {typeof log.score === 'number' && <span>• {log.score}%</span>}
                  </div>
                  {Array.isArray(log.standards) && log.standards.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {log.standards.slice(0, 3).map((s: string, idx: number) => (
                        <span key={`${s}-${idx}`} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {s}
                        </span>
                      ))}
                      {log.standards.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{log.standards.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

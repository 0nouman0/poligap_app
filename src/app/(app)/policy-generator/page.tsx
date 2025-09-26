"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Shield, FileText, CheckCircle, AlertTriangle, Download, Copy, BookOpen, Settings, Database, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

  const steps = [
    { id: 1, title: "Select Inputs", description: "Choose policy type and context" },
    { id: 2, title: "Knowledge & Rules", description: "Provide knowledge base and custom rules" },
    { id: 3, title: "Review & Generate", description: "Confirm and generate policy" },
    { id: 4, title: "Results", description: "Preview and export" },
  ];

  const canProceed1 = inputs.policyType.length > 0;
  const canProceed2 = true;
  const canGenerate = canProceed1 && canProceed2 && !isGenerating;

  const toggleFramework = (fw: string) => {
    setInputs((prev) => ({
      ...prev,
      frameworks: prev.frameworks.includes(fw)
        ? prev.frameworks.filter((x) => x !== fw)
        : [...prev.frameworks, fw],
    }));
  };

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
    } catch (e) {
      setResult("Generation failed. Please try again.");
      setCurrentStep(4);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          <FileText className="h-8 w-8" />
          Policy Generator
        </h1>
        <p className="text-muted-foreground">Generate organization-ready policies with your knowledge base, custom rules, and optional RuleBase.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center space-x-4">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${currentStep >= step.id ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground text-muted-foreground'}`}>
              {currentStep > step.id ? <CheckCircle className="h-5 w-5" /> : <span className="text-sm font-medium">{step.id}</span>}
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 transition-all ${currentStep > step.id ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="text-center">
        <h2 className="text-xl font-semibold">{steps[currentStep - 1]?.title}</h2>
        <p className="text-muted-foreground text-sm">{steps[currentStep - 1]?.description}</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6">
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Policy Type</label>
                <select value={inputs.policyType} onChange={(e)=>setInputs({...inputs, policyType:e.target.value})} className="w-full border rounded-md px-3 py-2 text-sm">
                  {[
                    "Privacy Policy",
                    "Cookie Policy",
                    "Information Security Policy",
                    "Data Retention Policy",
                    "Acceptable Use Policy",
                    "Vendor Management Policy",
                  ].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Industry / Domain</label>
                <input className="w-full border rounded-md px-3 py-2 text-sm" value={inputs.industry} onChange={(e)=>setInputs({...inputs, industry:e.target.value})} placeholder="e.g., SaaS, FinTech" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Region / Country</label>
                <input className="w-full border rounded-md px-3 py-2 text-sm" value={inputs.region} onChange={(e)=>setInputs({...inputs, region:e.target.value})} placeholder="e.g., EU, US, India" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Organization Type</label>
                <select value={inputs.orgType} onChange={(e)=>setInputs({...inputs, orgType:e.target.value})} className="w-full border rounded-md px-3 py-2 text-sm">
                  <option value="">Select…</option>
                  <option value="startup">Startup</option>
                  <option value="smb">SMB</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="public">Public Sector</option>
                  <option value="nonprofit">Non-profit</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Frameworks</label>
                <div className="flex flex-wrap gap-2 text-sm">
                  {['GDPR','ISO 27001','SOC 2','CCPA','DPDP Act','HIPAA'].map(fw => (
                    <button type="button" key={fw} onClick={()=>toggleFramework(fw)} className={`px-3 py-1 rounded border ${inputs.frameworks.includes(fw)?'bg-purple-100 text-purple-800 border-purple-300':'hover:bg-gray-50'}`}>{fw}</button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={inputs.applyRuleBase} onChange={(e)=>setInputs({...inputs, applyRuleBase:e.target.checked})} />
                  Apply RuleBase during generation
                </label>
                <div className="text-xs text-gray-500 mt-1">RuleBase guides clause selection and phrasing to your compliance profile.</div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><Database className="h-3 w-3"/> Knowledge Base Notes</label>
                <textarea rows={5} className="w-full border rounded-md px-3 py-2 text-sm" value={inputs.kbNotes} onChange={(e)=>setInputs({...inputs, kbNotes:e.target.value})} placeholder="Describe your data types, processing activities, retention needs, etc." />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><Settings className="h-3 w-3"/> Custom Rules</label>
                <textarea rows={5} className="w-full border rounded-md px-3 py-2 text-sm" value={inputs.customRules} onChange={(e)=>setInputs({...inputs, customRules:e.target.value})} placeholder="Enter any specific clauses, exclusions, or constraints you want enforced" />
              </div>
              <div className="text-xs text-gray-500">Tip: You can later move your notes to a proper Knowledge Base page and select assets for reuse.</div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              {/* Statutory warning */}
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-700"/>
                <div>
                  <div className="font-semibold text-yellow-800">Statutory Warning</div>
                  <div className="text-yellow-700">
                    This Policy Generator produces draft content for reference only. It is not legal advice and should not be used as-is in real-world scenarios. Use responsibly and have your organization’s legal/compliance team review before any adoption.
                  </div>
                </div>
              </div>
              {/* Metadata summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Context</div>
                  <div className="text-gray-600">Type: {inputs.policyType}</div>
                  <div className="text-gray-600">Industry: {inputs.industry || '-'} | Region: {inputs.region || '-'} | Org: {inputs.orgType || '-'}</div>
                  <div className="text-gray-600">Generated On: {new Date().toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-medium">Configuration</div>
                  <div className="text-gray-600">Frameworks ({inputs.frameworks.length}): {inputs.frameworks.join(', ') || '-'}</div>
                  <div className="text-gray-600">RuleBase: {inputs.applyRuleBase ? 'Enabled' : 'Disabled'}</div>
                  <div className="text-gray-600">Knowledge Notes: {inputs.kbNotes.trim().length > 0 ? `${inputs.kbNotes.trim().length} chars` : 'None'}</div>
                  <div className="text-gray-600">Custom Rules: {inputs.customRules.trim().length > 0 ? `${inputs.customRules.trim().length} chars` : 'None'}</div>
                </div>
              </div>
              {/* Note: Generate action moved to bottom navigation. */}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600"><Info className="h-4 w-4"/> Generated for: {inputs.policyType} ({inputs.region || 'Global'})</div>
              <div className="border rounded-lg p-4 bg-white max-h-[60vh] overflow-y-auto prose prose-sm dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result || 'No content.'}</ReactMarkdown>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => navigator.clipboard.writeText(result)} className="px-3 py-2 rounded-md border text-sm flex items-center gap-2"><Copy className="h-4 w-4"/> Copy</button>
                <a
                  href={`data:text/markdown;charset=utf-8,${encodeURIComponent(result)}`}
                  download={`${inputs.policyType.replace(/\s+/g,'-').toLowerCase()}-draft.md`}
                  className="px-3 py-2 rounded-md border text-sm flex items-center gap-2"
                >
                  <Download className="h-4 w-4"/> Export .md
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav Buttons */}
      {currentStep < 4 && (
        <div className="flex justify-between">
          <button onClick={()=> setCurrentStep(Math.max(1, currentStep-1))} className="px-3 py-2 rounded-md border text-sm">Previous</button>
          {currentStep === 3 ? (
            <button
              onClick={generatePolicy}
              disabled={!canGenerate}
              className="px-4 py-2 rounded-md text-sm text-white bg-black disabled:opacity-50"
            >
              {isGenerating ? 'Generating…' : 'Generate Policy'}
            </button>
          ) : (
            <button
              onClick={()=> setCurrentStep(currentStep+1)}
              disabled={(currentStep===1 && !canProceed1) || isGenerating}
              className="px-3 py-2 rounded-md border text-sm"
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}

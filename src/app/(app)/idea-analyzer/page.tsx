"use client";
import React, { useState } from "react";
import Link from "next/link";

type IdeaInputs = {
  companyName: string;
  domain: string;
  usp: string;
  idea: string;
  targetMarket: string;
  serviceType: string;
  phase: string;
  keywords: string;
  region: string;
  companySize: string;
  foundingYear: string;
  marketType: string; // B2B/B2C/B2B2C
  monetization: string; // subscriptions, ads, usage-based, one-time
  pricing: string; // free, freemium, paid tiers, enterprise
  deliveryPlatforms: string; // web, mobile, desktop, api
  techStack: string;
  distribution: string; // channels/gtm
  budgetRange: string;
  timeline: string;
  objectives: string;
  risks: string;
  competitorsKnown: string;
};

export default function IdeaAnalyzerPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [sections, setSections] = useState<any | null>(null);
  const [sources, setSources] = useState<{ title: string; url: string }[] | null>(null);
  const [activeTab, setActiveTab] = useState<'SWOT' | 'Competitors' | 'Market Stats' | 'Best Demographics' | 'Suggestions'>('SWOT');
  const [inputs, setInputs] = useState<IdeaInputs>({
    companyName: "",
    domain: "",
    usp: "",
    idea: "",
    targetMarket: "",
    serviceType: "SaaS",
    phase: "concept",
    keywords: "",
    region: "",
    companySize: "1-10",
    foundingYear: "",
    marketType: "B2B",
    monetization: "subscriptions",
    pricing: "freemium",
    deliveryPlatforms: "web",
    techStack: "",
    distribution: "",
    budgetRange: "<$50k",
    timeline: "0-3 months",
    objectives: "",
    risks: "",
    competitorsKnown: "",
  });
  // Quick badge classifier for market stats
  const statBadges = (label: string, value: string) => {
    const L = `${label} ${value}`.toLowerCase();
    const badges: string[] = [];
    if (/\btam\b|total addressable|market size/.test(L)) badges.push('TAM');
    if (/cagr|growth rate|yoy/.test(L)) badges.push('CAGR');
    if (/\barpu\b|per user revenue/.test(L)) badges.push('ARPU');
    if (/\bmaus?\b|monthly active/.test(L)) badges.push('MAU');
    if (/\bcac\b|acquisition cost/.test(L)) badges.push('CAC');
    if (/\bltv\b|lifetime value/.test(L)) badges.push('LTV');
    return badges;
  };

  const analyze = async () => {
    setLoading(true);
    setResult("");
    try {
      const r = await fetch("/api/idea-analyzer/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs }),
      });
      const j = await r.json();
      if (j?.sections) {
        setSections(j.sections);
        setSources(j.sources || null);
        setResult("");
      } else {
        setSections(null);
        setResult(j?.content || "No analysis.");
      }
    } catch {
      setResult("Failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Idea Analyzer</h1>
        <p className="text-sm text-gray-600">Single-page, detailed intake for precise AI-based competitive and execution insights.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          analyze();
        }}
        className="bg-white border rounded-lg p-6 space-y-6"
      >
        {/* Basic Details (Core) */}
        <section>
          <div className="text-sm font-medium mb-2">Basic Details</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2 text-sm" placeholder="Company Name" value={inputs.companyName} onChange={(e)=>setInputs({...inputs, companyName:e.target.value})} />
            <input className="border rounded px-3 py-2 text-sm" placeholder="Domain / Vertical (e.g., FinTech, EdTech)" value={inputs.domain} onChange={(e)=>setInputs({...inputs, domain:e.target.value})} />
            <input className="border rounded px-3 py-2 text-sm md:col-span-2" placeholder="Unique Selling Proposition (USP)" value={inputs.usp} onChange={(e)=>setInputs({...inputs, usp:e.target.value})} />
          </div>
        </section>

        {/* Core Context */}
        <section>
          <div className="text-sm font-medium mb-2">Context</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select className="border rounded px-3 py-2 text-sm" value={inputs.serviceType} onChange={(e)=>setInputs({...inputs, serviceType:e.target.value})}>
              {["SaaS","App","Website","IaaS","PaaS","Consulting","API"].map(o=> <option key={o}>{o}</option>)}
            </select>
            <select className="border rounded px-3 py-2 text-sm" value={inputs.phase} onChange={(e)=>setInputs({...inputs, phase:e.target.value})}>
              {["concept","prototype","beta","launched","growth"].map(o=> <option key={o}>{o}</option>)}
            </select>
            <select className="border rounded px-3 py-2 text-sm" value={inputs.marketType} onChange={(e)=>setInputs({...inputs, marketType:e.target.value})}>
              {["B2B","B2C","B2B2C","Marketplace"].map(o=> <option key={o}>{o}</option>)}
            </select>
            <select className="border rounded px-3 py-2 text-sm" value={inputs.region} onChange={(e)=>setInputs({...inputs, region:e.target.value})}>
              {["","US","EU","UK","India","APAC","Global"].map(o=> <option key={o}>{o || 'Region'}</option>)}
            </select>
          </div>

          {/* Advanced Context (collapsible) */}
          <details className="mt-3 group">
            <summary className="cursor-pointer text-xs text-gray-600 select-none">Advanced context</summary>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-2">
              <select className="border rounded px-3 py-2 text-sm" value={inputs.companySize} onChange={(e)=>setInputs({...inputs, companySize:e.target.value})}>
                {["1-10","11-50","51-200","201-1000","1000+"].map(o=> <option key={o}>{o}</option>)}
              </select>
              <input className="border rounded px-3 py-2 text-sm" placeholder="Founding Year" value={inputs.foundingYear} onChange={(e)=>setInputs({...inputs, foundingYear:e.target.value})} />
              <input className="border rounded px-3 py-2 text-sm md:col-span-2" placeholder="Target market / demographics" value={inputs.targetMarket} onChange={(e)=>setInputs({...inputs, targetMarket:e.target.value})} />
            </div>
          </details>
        </section>

        {/* Business Model (collapsible) */}
        <section>
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium select-none">Business Model (optional)</summary>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-3">
              <select className="border rounded px-3 py-2 text-sm" value={inputs.monetization} onChange={(e)=>setInputs({...inputs, monetization:e.target.value})}>
                {["subscriptions","ads","usage-based","one-time","hybrid"].map(o=> <option key={o}>{o}</option>)}
              </select>
              <select className="border rounded px-3 py-2 text-sm" value={inputs.pricing} onChange={(e)=>setInputs({...inputs, pricing:e.target.value})}>
                {["free","freemium","paid tiers","enterprise","custom"].map(o=> <option key={o}>{o}</option>)}
              </select>
              <select className="border rounded px-3 py-2 text-sm" value={inputs.deliveryPlatforms} onChange={(e)=>setInputs({...inputs, deliveryPlatforms:e.target.value})}>
                {["web","mobile","desktop","api","multi-platform"].map(o=> <option key={o}>{o}</option>)}
              </select>
              <input className="border rounded px-3 py-2 text-sm" placeholder="Known competitors (comma-separated)" value={inputs.competitorsKnown} onChange={(e)=>setInputs({...inputs, competitorsKnown:e.target.value})} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="Tech stack (optional)" value={inputs.techStack} onChange={(e)=>setInputs({...inputs, techStack:e.target.value})} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="Distribution channels / GTM" value={inputs.distribution} onChange={(e)=>setInputs({...inputs, distribution:e.target.value})} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="Budget range" value={inputs.budgetRange} onChange={(e)=>setInputs({...inputs, budgetRange:e.target.value})} />
            </div>
          </details>
        </section>

        {/* Idea & Goals */}
        <section>
          <div className="text-sm font-medium mb-2">Idea & Goals</div>
          <textarea className="w-full border rounded px-3 py-2 text-sm" rows={5} placeholder="Describe the idea in detail" value={inputs.idea} onChange={(e)=>setInputs({...inputs, idea:e.target.value})} />
          <details className="mt-3 group">
            <summary className="cursor-pointer text-xs text-gray-600 select-none">Execution preferences (optional)</summary>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              <input className="border rounded px-3 py-2 text-sm" placeholder="Timeline (e.g., 0-3 months)" value={inputs.timeline} onChange={(e)=>setInputs({...inputs, timeline:e.target.value})} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="Objectives / KPIs" value={inputs.objectives} onChange={(e)=>setInputs({...inputs, objectives:e.target.value})} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="Known risks" value={inputs.risks} onChange={(e)=>setInputs({...inputs, risks:e.target.value})} />
            </div>
          </details>
          <input className="border rounded px-3 py-2 text-sm mt-3 w-full" placeholder="Optional keywords (comma-separated)" value={inputs.keywords} onChange={(e)=>setInputs({...inputs, keywords:e.target.value})} />
        </section>

        <div className="flex items-center justify-between">
          <Link className="text-sm text-gray-600 hover:underline" href="/ai-agents">Back to Agents</Link>
          <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-black text-white text-sm disabled:opacity-50">{loading? 'Analyzing…' : 'Analyze Idea'}</button>
        </div>

        {loading && (
          <div className="mt-4 border rounded-lg p-4 bg-gray-50">
            {/* Subtle computer browsing animation */}
            <div className="mx-auto w-full max-w-md h-40 bg-white border rounded-lg shadow-sm overflow-hidden relative">
              <div className="h-6 bg-gray-100 flex items-center gap-1 px-2">
                <span className="w-3 h-3 rounded-full bg-red-300"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-300"></span>
                <span className="w-3 h-3 rounded-full bg-green-300"></span>
                <div className="ml-2 text-[11px] text-gray-500">Searching the web…</div>
              </div>
              <div className="p-3 space-y-2 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                <div className="h-3 bg-gray-200 rounded w-3/5"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="absolute bottom-0 left-0 h-1 bg-purple-300 animate-[progress_2s_ease-in-out_infinite]" style={{width:'30%'}}></div>
            </div>
            <style jsx>{`
              @keyframes progress { 0% { transform: translateX(-100%); } 50% { transform: translateX(50%);} 100% { transform: translateX(200%);} }
            `}</style>
          </div>
        )}
      </form>

      {/* Structured Results */}
      {sections && (
        <div className="bg-white border rounded-lg p-6 space-y-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {(['SWOT','Competitors','Market Stats','Best Demographics','Suggestions'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-full text-sm border ${activeTab===tab?'bg-black text-white border-black':'hover:bg-gray-50'}`}
              >{tab}</button>
            ))}
          </div>

          {/* Content */}
          <div className="min-h-[200px]">
            {activeTab === 'SWOT' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                  <div className="font-semibold text-green-800 mb-2">Strengths</div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-green-900">
                    {(sections?.swot?.strengths || []).map((s: string, i: number)=>(<li key={i}>{s}</li>))}
                  </ul>
                </div>
                {/* Weaknesses */}
                <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                  <div className="font-semibold text-red-800 mb-2">Weaknesses</div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-900">
                    {(sections?.swot?.weaknesses || []).map((s: string, i: number)=>(<li key={i}>{s}</li>))}
                  </ul>
                </div>
                {/* Opportunities */}
                <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                  <div className="font-semibold text-blue-800 mb-2">Opportunities</div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-900">
                    {(sections?.swot?.opportunities || []).map((s: string, i: number)=>(<li key={i}>{s}</li>))}
                  </ul>
                </div>
                {/* Threats */}
                <div className="border rounded-lg p-4 bg-amber-50 border-amber-200">
                  <div className="font-semibold text-amber-800 mb-2">Threats</div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-amber-900">
                    {(sections?.swot?.threats || []).map((s: string, i: number)=>(<li key={i}>{s}</li>))}
                  </ul>
                </div>

                {/* Simple bar viz for balance */}
                <div className="md:col-span-2">
                  <div className="text-xs text-gray-600 mb-1">Balance Overview</div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {['strengths','weaknesses','opportunities','threats'].map((k) => {
                      const n = (sections?.swot?.[k] || []).length as number;
                      return (
                        <div key={k} className="space-y-1">
                          <div className="capitalize">{k}</div>
                          <div className="h-2 bg-gray-100 rounded">
                            <div className="h-full bg-black rounded" style={{width: `${Math.min(100, n*20)}%`}}></div>
                          </div>
                          <div>{n} pts</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Competitors' && (
              <div className="space-y-3">
                {(sections?.competitors || []).length === 0 && (
                  <div className="text-sm text-gray-600">No competitors detected.</div>
                )}
                {(sections?.competitors || []).map((c: any, i: number)=> (
                  <div key={i} className="border rounded p-3 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">{i+1}</div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">
                        {c.url ? <a href={c.url} target="_blank" rel="noreferrer" className="hover:underline">{c.name || 'Competitor'}</a> : (c.name || 'Competitor')}
                      </div>
                      {c.summary && <div className="text-xs text-gray-600">{c.summary}</div>}
                    </div>
                  </div>
                ))}
                {/* Sources */}
                {sources && sources.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="text-xs text-gray-600 mb-1">Sources</div>
                    <ul className="list-disc list-inside text-xs">
                      {sources.map((s, idx)=> (
                        <li key={idx}><a href={s.url} target="_blank" rel="noreferrer" className="hover:underline">{s.title}</a></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Market Stats' && (
              <div className="space-y-2">
                {(sections?.marketStats || []).length === 0 && (
                  <div className="text-sm text-gray-600">No market stats available.</div>
                )}
                {(sections?.marketStats || []).map((m: any, i: number)=> (
                  <div key={i} className="border rounded p-3 flex items-start gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                        <span>{m.label}</span>
                        {statBadges(m.label || '', m.value || '').map((b) => (
                          <span key={b} className="inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] bg-gray-50">{b}</span>
                        ))}
                      </div>
                      <div className="text-sm text-gray-700">{m.value}</div>
                      {m.url && <a href={m.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">{m.source || 'Source'}</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'Best Demographics' && (
              <ul className="list-disc list-inside space-y-1 text-sm">
                {(sections?.bestDemographics || []).map((s: string, i: number)=>(<li key={i}>{s}</li>))}
              </ul>
            )}
            {activeTab === 'Suggestions' && (
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {(sections?.suggestions || []).map((s: string, i: number)=>(<li key={i}>{s}</li>))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckSquare, MessageCircle, Shield, FileText, BookOpen, Lightbulb, Bot, NotebookPen, Upload, History, ExternalLink, ChevronRight } from "lucide-react";

export default function HowToUsePage() {
  const sections = [
    { id: "overview", title: "Overview" },
    { id: "chat", title: "Chat (Poligap AI)" },
    { id: "compliance-check", title: "Compliance Check" },
    { id: "contract-review", title: "Contract Review" },
    { id: "policy-generator", title: "Policy Generator" },
    { id: "idea-analyzer", title: "Idea Analyzer (Beta)" },
    { id: "ai-agents", title: "AI Agents" },
    { id: "rulebase", title: "RuleBase" },
    { id: "upload-assets", title: "Upload Assets" },
    { id: "history", title: "History & Audit Logs" },
    { id: "tips", title: "Tips & Best Practices" },
    { id: "support", title: "Support & Feedback" },
  ];

  return (
    <div className="w-full mx-auto p-6 space-y-8">
      {/* Title and Intro */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          How to Use Poligap AI
        </h1>
        <p className="text-muted-foreground">
          A professional guide to help you get the most out of Poligap AI. Explore feature-specific instructions, workflows, and tips.
        </p>
      </div>

      {/* Table of Contents */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Navigation</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-foreground hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-foreground transition-colors cursor-pointer shadow-sm hover:shadow flex items-center justify-between"
            >
              <span className="truncate pr-2">{s.title}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </a>
          ))}
        </CardContent>
      </Card>

      {/* Overview */}
      <Card id="overview">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Poligap AI streamlines compliance, analysis, and productivity with a suite of features. Use the sidebar to navigate
            between features and the top-right controls for theme and account settings.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>All features share a consistent design and keyboard-friendly forms.</li>
            <li>Results pages provide clear summaries, actionable insights, and export options where applicable.</li>
            <li>Use the <span className="font-medium">History</span> section to review previous analyses and actions.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Chat */}
      <Card id="chat">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5"/> Chat (Poligap AI)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">What this tool is</p>
            <p>Conversational workspace to ideate, research, and draft. Supports references, tool calls, and media.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Why you need it</p>
            <p>Central place to ask ad‑hoc questions, refine drafts, and gather sources without switching contexts.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Poligap USP</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Structured tabs for <span className="font-medium">Sources</span>, <span className="font-medium">Tasks</span>, and <span className="font-medium">Media</span>.</li>
              <li>Streaming outputs with tool-call visualization.</li>
              <li>Conversation titling and history organization.</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground">Steps</p>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Open Chat and type your question or paste context.</li>
              <li>Attach files if needed; submit to generate.</li>
              <li>Review tabs for sources, media, and tasks while it streams.</li>
              <li>Rename conversation and continue iterating.</li>
            </ol>
          </div>
          <div>
            <p className="font-medium text-foreground">Output & interpretation</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><span className="font-medium">Content</span>: the response with inline structure.</li>
              <li><span className="font-medium">Sources</span>: links and citations; check credibility.</li>
              <li><span className="font-medium">Tasks</span>: actionable items inferred by the agent.</li>
            </ul>
          </div>
          <Link href="/chat"><Button variant="outline" className="mt-2 cursor-pointer">Open Chat</Button></Link>
        </CardContent>
      </Card>

      {/* Compliance Check */}
      <Card id="compliance-check">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5"/> Compliance Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">What this tool is</p>
            <p>Guided 4‑step workflow to evaluate a document against chosen standards.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Why you need it</p>
            <p>Quickly surfaces gaps and priorities to reduce audit time and manual review.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Poligap USP</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Stepper UX with rulebase augmentation.</li>
              <li>Clear gap severity and suggestions with exportable summaries.</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground">Steps</p>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Select standards relevant to your domain.</li>
              <li>Upload the policy or document (PDF/DOC/TXT).</li>
              <li>Optionally enable RuleBase and run analysis.</li>
              <li>Review scored results and suggested remediations.</li>
            </ol>
          </div>
          <div>
            <p className="font-medium text-foreground">Output & interpretation</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><span className="font-medium">Gaps</span>: severity-tagged issues with justifications.</li>
              <li><span className="font-medium">Suggestions</span>: recommended remediations by priority.</li>
              <li><span className="font-medium">Score & status</span>: compliant/partial/non‑compliant snapshot.</li>
            </ul>
          </div>
          <Link href="/compliance-check"><Button variant="outline" className="mt-2 cursor-pointer">Open Compliance Check</Button></Link>
        </CardContent>
      </Card>

      {/* Contract Review */}
      <Card id="contract-review">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/> Contract Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">What this tool is</p>
            <p>Guided review of contracts to detect risky clauses and compliance gaps.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Why you need it</p>
            <p>Reduces legal review cycles and surfaces negotiation focus areas.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Poligap USP</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Clause-level detection with severity and rationale.</li>
              <li>Exportable, stakeholder-friendly summaries.</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground">Steps</p>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Upload the contract and define review goals.</li>
              <li>Select relevant standards or rulebases.</li>
              <li>Run analysis and review flagged clauses.</li>
              <li>Export the summary and assign follow-ups.</li>
            </ol>
          </div>
          <div>
            <p className="font-medium text-foreground">Output & interpretation</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>List of risky clauses with rationale and severity.</li>
              <li>Recommended edits and negotiation talking points.</li>
            </ul>
          </div>
          <Link href="/contract-review"><Button variant="outline" className="mt-2 cursor-pointer">Open Contract Review</Button></Link>
        </CardContent>
      </Card>

      {/* Policy Generator */}
      <Card id="policy-generator">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5"/> Policy Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">What this tool is</p>
            <p>Generates policy drafts aligned to standards, audience, and tone.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Why you need it</p>
            <p>Accelerates first drafts and ensures consistency across documents.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Poligap USP</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Standards-aware prompts and structure.</li>
              <li>Seamless refinement in Chat.</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground">Steps</p>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Choose policy type and industry.</li>
              <li>Set tone, audience, and constraints.</li>
              <li>Generate draft and review sections.</li>
              <li>Refine in Chat; export final.</li>
            </ol>
          </div>
          <div>
            <p className="font-medium text-foreground">Output & interpretation</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Structured policy with headings and required clauses.</li>
              <li>Checklist of standards alignment.</li>
            </ul>
          </div>
          <Link href="/policy-generator"><Button variant="outline" className="mt-2 cursor-pointer">Open Policy Generator</Button></Link>
        </CardContent>
      </Card>

      {/* Idea Analyzer */}
      <Card id="idea-analyzer">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5"/> Idea Analyzer (Beta)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">What this tool is</p>
            <p>Evaluation assistant for business ideas covering market, competitors, and demographics.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Why you need it</p>
            <p>Transforms raw ideas into validated views with quick, comparable metrics.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Poligap USP</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Structured sections (SWOT, Competitors, Market Stats, Demographics, Suggestions).</li>
              <li>Badges for TAM, CAGR, ARPU, MAU, CAC, LTV at a glance.</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground">Steps</p>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Describe the idea and target audience.</li>
              <li>Add differentiators, region, and industry (optional).</li>
              <li>Run analysis; review each section tab.</li>
              <li>Capture suggestions into tasks or backlog.</li>
            </ol>
          </div>
          <div>
            <p className="font-medium text-foreground">Output & interpretation</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><span className="font-medium">Market Stats</span>: quantify market size and growth.</li>
              <li><span className="font-medium">Best Demographics</span>: primary segments to prioritize.</li>
              <li><span className="font-medium">SWOT & Competitors</span>: position your edge.</li>
            </ul>
          </div>
          <Link href="/idea-analyzer"><Button variant="outline" className="mt-2 cursor-pointer">Open Idea Analyzer</Button></Link>
        </CardContent>
      </Card>

      {/* AI Agents */}
      <Card id="ai-agents">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5"/> AI Agents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">What this tool is</p>
            <p>Pre‑configured assistants optimized for specific workflows.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Why you need it</p>
            <p>Faster, repeatable outputs for common tasks with less prompt engineering.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Poligap USP</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Role-adaptive UI and tool access.</li>
              <li>Traceable references and streaming status.</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground">Steps</p>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Pick an agent and provide the task brief.</li>
              <li>Optionally attach files or links.</li>
              <li>Review outputs and iterate or export.</li>
            </ol>
          </div>
          <div>
            <p className="font-medium text-foreground">Output & interpretation</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Task artifacts (drafts, lists, suggestions) and references.</li>
              <li>Use History to compare across runs.</li>
            </ul>
          </div>
          <Link href="/ai-agents"><Button variant="outline" className="mt-2 cursor-pointer">Open AI Agents</Button></Link>
        </CardContent>
      </Card>

      {/* RuleBase */}
      <Card id="rulebase">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><NotebookPen className="h-5 w-5"/> RuleBase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">What this tool is</p>
            <p>Central registry of custom checks to enforce during analyses.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Why you need it</p>
            <p>Ensures consistency and auditability across teams and time.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Poligap USP</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Attach rulebases to specific runs for augmented results.</li>
              <li>Track coverage and impact over iterations.</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground">Steps</p>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Create a rulebase and define checks.</li>
              <li>Apply during Compliance/Contract analyses.</li>
              <li>Review enriched gaps and refine rules.</li>
            </ol>
          </div>
          <div>
            <p className="font-medium text-foreground">Output & interpretation</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Which rules triggered; severity and examples.</li>
              <li>Use insights to tighten internal policies.</li>
            </ul>
          </div>
          <Link href="/rulebase"><Button variant="outline" className="mt-2 cursor-pointer">Open RuleBase</Button></Link>
        </CardContent>
      </Card>

      {/* Upload Assets */}
      <Card id="upload-assets">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5"/> Upload Assets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">What this tool is</p>
            <p>Library for documents and media used across analyses.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Why you need it</p>
            <p>Keeps your context in one place and re-usable by any feature.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Poligap USP</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Direct linking into Chat and analyzers.</li>
              <li>Uniform parsing and fallback strategies.</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground">Steps</p>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Upload files (PDF/DOC/DOCX/TXT).</li>
              <li>Tag and organize by project or standard.</li>
              <li>Reference them in Chat or analyses.</li>
            </ol>
          </div>
          <div>
            <p className="font-medium text-foreground">Output & interpretation</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Processes status and metadata for each asset.</li>
              <li>Troubleshoot failed parses via status notes.</li>
            </ul>
          </div>
          <Link href="/upload-assets"><Button variant="outline" className="mt-2 cursor-pointer">Open Upload Assets</Button></Link>
        </CardContent>
      </Card>

      {/* History */}
      <Card id="history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="h-5 w-5"/> History & Audit Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">What this tool is</p>
            <p>Central timeline of your analyses and changes for traceability.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Why you need it</p>
            <p>Provides audit trails and supports reporting and governance.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Poligap USP</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Snapshotting of results and rulebase usage.</li>
              <li>Quick links back into the original context.</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground">Steps</p>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Open History and filter by feature/date/user.</li>
              <li>Inspect snapshots and drill into gaps/suggestions.</li>
              <li>Re-run or export for stakeholders.</li>
            </ol>
          </div>
          <div>
            <p className="font-medium text-foreground">Output & interpretation</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Timeline of runs, scores, and artifacts.</li>
              <li>Use comparisons to track improvements over time.</li>
            </ul>
          </div>
          <Link href="/history"><Button variant="outline" className="mt-2 cursor-pointer">Open History</Button></Link>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card id="tips">
        <CardHeader>
          <CardTitle>Tips & Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc pl-6 space-y-1">
            <li><span className="font-medium">Provide context</span>: clearer prompts and document metadata improve results.</li>
            <li><span className="font-medium">Iterate</span>: refine outputs in Chat by asking focused follow-ups.</li>
            <li><span className="font-medium">Leverage rulebases</span> for repeatable, auditable analyses.</li>
            <li><span className="font-medium">Use History</span> to track progress and share summaries.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Support */}
      <Card id="support">
        <CardHeader>
          <CardTitle>Support & Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Need help or want to suggest improvements? Reach out to our team.
          </p>
          <div className="flex items-center gap-3">
            <Link href="mailto:support@poligap.ai" className="text-[var(--url-color)] hover:underline">support@poligap.ai</Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/chat" className="text-[var(--url-color)] hover:underline flex items-center gap-1">Ask in Chat <ExternalLink className="h-3 w-3"/></Link>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground pt-2 pb-6">
        © {new Date().getFullYear()} Poligap AI — All rights reserved.
      </div>
    </div>
  );
}

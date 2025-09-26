import { NextRequest, NextResponse } from 'next/server';
import { getCompliancePrompt } from '@/lib/compliance-prompt';
import { promises as fs } from 'fs';
import path from 'path';

// Gemini AI with direct file upload (Primary)
async function analyzeWithGemini(file: File, selectedStandards: string[]): Promise<any> {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Try a list of model IDs to avoid regional/version issues (prefer newest first)
    const candidateModels = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash-002',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];

    // Convert file to base64 for Gemini
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    // Determine MIME type
    let mimeType = file.type;
    if (!mimeType && file.name.endsWith('.pdf')) {
      mimeType = 'application/pdf';
    }

    console.log(`Sending file to Gemini: ${file.name} (${mimeType}, ${file.size} bytes)`);

    const prompt = getCompliancePrompt(selectedStandards, 'ANALYZE_UPLOADED_FILE');

    let lastErr: unknown = null;
    for (const modelId of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelId });
        const result = await model.generateContent([
          { inlineData: { data: base64Data, mimeType } },
          { text: prompt }
        ]);
        const response = await result.response;
        const text = response.text();

        console.log(`Gemini response received from ${modelId}:`, text.substring(0, 200) + '...');

        // Try to parse JSON response
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysisResult = JSON.parse(jsonMatch[0]);
            return analysisResult;
          } else {
            throw new Error('No JSON found in Gemini response');
          }
        } catch (parseError) {
          console.warn(`Failed to parse Gemini JSON response from ${modelId}:`, parseError);
          // Create structured response from the text
          return createStructuredResponseFromText(text);
        }
      } catch (err) {
        lastErr = err;
        // Try next model on 404 or model errors
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Gemini model ${modelId} failed, trying next if available. Reason: ${msg}`);
        continue;
      }
    }
    // If none of the Gemini models succeeded, throw to allow caller to try fallback
    throw lastErr instanceof Error
      ? new Error(lastErr.message)
      : new Error('All Gemini models failed');

  } catch (error) {
    console.error('Gemini AI analysis failed:', error);
    throw new Error(`Gemini AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// OpenAI (fallback, text-based)
async function analyzeWithOpenAI(file: File, selectedStandards: string[]): Promise<any> {
  try {
    const documentContent = await extractTextFromFile(file);
    // Proceed even if text appears low-quality; include hint in the prompt
    const readable = isReadable(documentContent);
    const baseContent = readable && documentContent ? documentContent : (documentContent || '');
    const decorated = readable ? baseContent : `The extracted text may be low-quality or partial. Still analyze for compliance and produce your best-effort findings.\n\n${baseContent}`;
    const prompt = getCompliancePrompt(selectedStandards, decorated);
    const { createOpenAIAnalyzer } = await import('@/lib/openai-api');
    const analyzer = createOpenAIAnalyzer();
    const analysis = await analyzer.analyzeCompliance(prompt);
    return analysis;
  } catch (error) {
    console.error('OpenAI analysis failed:', error);
    throw new Error(`OpenAI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Simple text extraction for Kroolo AI fallback
async function extractTextFromFile(file: File): Promise<string> {
  try {
    if (file.type.includes('text') || file.name.endsWith('.txt')) {
      return await file.text();
    }

    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const content = decoder.decode(arrayBuffer);

    // Basic text extraction - in production you'd want proper PDF/DOC parsers
    if (file.type === 'application/pdf') {
      // Very basic PDF text extraction
      const textMatches = content.match(/\([^)]{10,}\)/g);
      if (textMatches) {
        return textMatches
          .map(match => match.replace(/^\(|\)$/g, ''))
          .filter(t => t.length > 5)
          .join(' ');
      }
    }

    // Extract readable text sequences
    const readableText = content.match(/[a-zA-Z\s.,!?;:'"()-]{20,}/g);
    if (readableText) {
      return readableText.join(' ').replace(/\s+/g, ' ').trim();
    }

    throw new Error('Could not extract readable text from file');

  } catch (error) {
    throw new Error(`Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Heuristic to detect poor/garbled extraction (module scope)
function isReadable(text: string): boolean {
  if (!text) return false;
  const length = text.length;
  const wordCount = (text.match(/\b\w+\b/g) || []).length;
  const letters = (text.match(/[A-Za-z]/g) || []).length;
  const letterRatio = letters / Math.max(1, length);
  const uniqueChars = new Set(text.split('')).size;
  const uniqueRatio = uniqueChars / Math.max(1, length);
  const avgWordLen = length / Math.max(1, wordCount);

  // Minimum thresholds indicating likely readable prose
  const longEnough = length >= 500 || wordCount >= 80;
  const sufficientLetters = letterRatio >= 0.4; // avoid mostly-binary/garbage
  const reasonableUniqueness = uniqueRatio >= 0.05; // avoid repeated same chars
  const reasonableAvgWord = avgWordLen >= 3 && avgWordLen <= 12;

  return longEnough && sufficientLetters && reasonableUniqueness && reasonableAvgWord;
}

// Create structured response from unstructured text
function createStructuredResponseFromText(text: string): any {
  const score = extractScoreFromText(text);
  const gaps = extractListFromText(text, ['gap', 'issue', 'missing', 'lacking', 'absent', 'insufficient']);
  const suggestions = extractListFromText(text, ['suggest', 'recommend', 'should', 'improve', 'add', 'include']);
  const criticalIssues = extractListFromText(text, ['critical', 'urgent', 'important', 'risk', 'violation', 'non-compliant']);

  // If we can't extract meaningful analysis, indicate this clearly
  if (!score && gaps.length === 0 && suggestions.length === 0) {
    return {
      overallScore: 0,
      standardsAnalysis: [{
        standard: "Analysis Failed",
        score: 0,
        status: "non-compliant",
        gaps: ["Unable to perform meaningful compliance analysis. The document content may be unclear, incomplete, or the AI service may be experiencing issues."],
        suggestions: ["Please ensure the document is readable and contains policy content, then try again."],
        criticalIssues: ["Analysis could not be completed"]
      }],
      summary: {
        totalGaps: 1,
        criticalIssues: 1,
        recommendedActions: ['Verify document content and retry analysis']
      },
      detailedFindings: {
        strengths: [],
        weaknesses: ["Analysis could not be completed"],
        riskAreas: ["Unable to assess compliance risks"]
      }
    };
  }

  const finalScore = score || (gaps.length > 0 ? Math.max(20, 60 - (gaps.length * 10)) : 50);
  const status = finalScore >= 90 ? "compliant" : finalScore >= 70 ? "partial" : "non-compliant";

  return {
    overallScore: finalScore,
    standardsAnalysis: [{
      standard: "Compliance Analysis",
      score: finalScore,
      status: status,
      gaps: gaps.length > 0 ? gaps : ["Analysis completed but specific gaps could not be clearly identified from the AI response."],
      suggestions: suggestions.length > 0 ? suggestions : ["Review the document manually for compliance requirements."],
      criticalIssues: criticalIssues
    }],
    summary: {
      totalGaps: gaps.length,
      criticalIssues: criticalIssues.length,
      recommendedActions: suggestions.length > 0 ? suggestions.slice(0, 3) : ['Manual review recommended']
    },
    detailedFindings: {
      strengths: extractListFromText(text, ['strength', 'good', 'compliant', 'adequate', 'meets']),
      weaknesses: extractListFromText(text, ['weakness', 'weak', 'insufficient', 'inadequate', 'lacks']),
      riskAreas: extractListFromText(text, ['risk', 'danger', 'threat', 'vulnerability', 'violation'])
    }
  };
}

function extractScoreFromText(text: string): number | null {
  const scoreMatch = text.match(/(\d+)%|\bscore[:\s]*(\d+)|(\d+)\s*out\s*of\s*100/i);
  if (scoreMatch) {
    return parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]);
  }
  return null;
}

function extractListFromText(text: string, keywords: string[]): string[] {
  const sentences = text.split(/[.!?]+/);
  const relevantSentences: string[] = [];

  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    if (keywords.some(keyword => lowerSentence.includes(keyword))) {
      const cleanSentence = sentence.trim();
      if (cleanSentence.length > 10) {
        relevantSentences.push(cleanSentence);
      }
    }
  });

  return relevantSentences.slice(0, 5);
}

async function readRulebaseRules(): Promise<any[]> {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    const filePath = path.join(dataDir, 'rulebase.json');
    try { await fs.access(filePath); } catch { await fs.writeFile(filePath, JSON.stringify({ rules: [] }, null, 2), 'utf-8'); }
    const fileContent = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(fileContent);
    return Array.isArray(parsed?.rules) ? parsed.rules : [];
  } catch {
    return [];
  }
}

function applyRulebaseToAnalysis(analysis: any, rules: any[], selectedStandards: string[]): { analysis: any, applied: boolean, ruleCount: number } {
  if (!analysis) return { analysis, applied: false, ruleCount: 0 };
  // Only apply active rules. Treat missing 'active' as true for backwards compatibility
  const list = Array.isArray(rules) ? rules.filter((r: any) => r?.active !== false) : [];
  if (list.length === 0) return { analysis, applied: false, ruleCount: 0 };

  const updated = { ...analysis };
  updated.standardsAnalysis = Array.isArray(updated.standardsAnalysis) ? updated.standardsAnalysis : [];
  if (updated.standardsAnalysis.length === 0) {
    updated.standardsAnalysis.push({
      standard: selectedStandards?.join(', ') || 'General',
      score: typeof updated.overallScore === 'number' ? updated.overallScore : 70,
      status: 'partial',
      gaps: [],
      suggestions: [],
      criticalIssues: []
    });
  }

  const primary = { ...updated.standardsAnalysis[0] };
  const suggestions: string[] = Array.isArray(primary.suggestions) ? [...primary.suggestions] : [];
  const gaps: string[] = Array.isArray(primary.gaps) ? [...primary.gaps] : [];
  const standardLabel = selectedStandards?.map(s => s.toUpperCase()).join(', ');

  for (const r of list) {
    const rName = r?.name || 'Unnamed Rule';
    const rDesc = r?.description ? `: ${r.description}` : '';
    const sug = `Ensure rule "${rName}" is addressed for ${standardLabel || 'selected standards'}${rDesc}.`;
    if (!suggestions.some(s => s.includes(rName))) suggestions.push(sug);
    if (rDesc && !gaps.some(g => g.includes(rName))) gaps.push(`Document may not explicitly cover "${rName}"${rDesc}.`);
  }

  primary.suggestions = suggestions;
  primary.gaps = gaps;

  const baseBefore = typeof updated.overallScore === 'number' ? updated.overallScore : (primary.score || 70);
  const inducedCount = Math.max(0, gaps.length - (analysis?.standardsAnalysis?.[0]?.gaps?.length || 0));
  const penalty = Math.min(10, inducedCount);
  const newScore = Math.max(0, baseBefore - penalty);
  updated.overallScore = newScore;
  primary.score = newScore;
  primary.status = newScore >= 90 ? 'compliant' : newScore >= 70 ? 'partial' : 'non-compliant';
  updated.standardsAnalysis[0] = primary;

  if (updated.summary) {
    updated.summary = {
      ...updated.summary,
      totalGaps: Array.isArray(primary.gaps) ? primary.gaps.length : updated.summary.totalGaps,
      recommendedActions: Array.isArray(primary.suggestions) ? primary.suggestions.slice(0, 5) : updated.summary.recommendedActions,
    };
  }

  return { analysis: updated, applied: true, ruleCount: list.length };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const selectedStandards = JSON.parse(formData.get('selectedStandards') as string);
    const applyRuleBase = String(formData.get('applyRuleBase') || 'false') === 'true';

    console.log('Received compliance analysis request');
    console.log('File info:', { name: file?.name, type: file?.type, size: file?.size });
    console.log('Selected standards:', selectedStandards);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!selectedStandards || selectedStandards.length === 0) {
      return NextResponse.json({ error: 'No compliance standards selected' }, { status: 400 });
    }

    // Validate file type
    const supportedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const isSupported = supportedTypes.includes(file.type) ||
      file.name.endsWith('.pdf') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.doc') ||
      file.name.endsWith('.docx');

    if (!isSupported) {
      return NextResponse.json({
        error: `Unsupported file type: ${file.type}. Please upload PDF, DOC, DOCX, or TXT files.`
      }, { status: 400 });
    }

    // Try Gemini first (primary), then fall back to OpenAI
    let analysisResult;
    let method = 'unknown';

    try {
      console.log('Attempting Gemini AI analysis with direct file upload (primary)...');
      analysisResult = await analyzeWithGemini(file, selectedStandards);
      method = 'gemini-primary';
      console.log('Gemini AI analysis completed successfully');

    } catch (geminiError) {
      console.error('Gemini AI analysis failed, falling back to OpenAI:', geminiError);

      try {
        console.log('Attempting OpenAI analysis (fallback, text-based)...');
        analysisResult = await analyzeWithOpenAI(file, selectedStandards);
        method = 'openai-fallback';
        console.log('OpenAI analysis completed successfully');

      } catch (openaiError) {
        console.error('Both Gemini and OpenAI failed:', openaiError);
        return NextResponse.json({
          error: `Analysis failed with both AI services. Gemini: ${geminiError instanceof Error ? geminiError.message : 'Unknown error'}. OpenAI: ${openaiError instanceof Error ? openaiError.message : 'Unknown error'}`
        }, { status: 500 });
      }
    }

    // Optionally apply RuleBase
    let appliedRuleBase = false;
    let ruleCount = 0;
    if (applyRuleBase) {
      const rules = await readRulebaseRules();
      const applied = applyRulebaseToAnalysis(analysisResult, rules, selectedStandards);
      analysisResult = applied.analysis;
      appliedRuleBase = applied.applied;
      ruleCount = applied.ruleCount;
      method = `${method}+rulebase`;
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      selectedStandards,
      analysis: analysisResult,
      method,
      appliedRuleBase,
      ruleCount
    });

  } catch (error) {
    console.error('Compliance analysis error:', error);
    return NextResponse.json({
      error: `Failed to analyze document: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
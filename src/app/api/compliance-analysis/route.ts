import { NextRequest, NextResponse } from 'next/server';
import { getCompliancePrompt } from '@/lib/compliance-prompt';
import { createClient } from '@/lib/supabase/server';
import { createPortkeyClient, getAvailableModels } from '@/lib/portkey/client';
import { extractTextFromDocument } from '@/lib/parsers/document-parser';

// Force dynamic rendering to avoid build-time errors with pdf-parse
export const dynamic = 'force-dynamic';

// AI analysis with Portkey ONLY - uses robust pdf-parse + mammoth parsers
async function analyzeWithAI(file: File, selectedStandards: string[]): Promise<any> {
  try {
    // Get available models (Portkey only, skip Gemini)
    const availableModels = getAvailableModels().filter(m => m.provider !== 'gemini');
    console.log('Available Portkey models:', availableModels.map(m => `${m.provider}/${m.model}`));

    if (availableModels.length === 0) {
      throw new Error('No Portkey models available. Please configure PORTKEY_API_KEY.');
    }

    // Extract text using robust parser (pdf-parse for PDF, mammoth for DOCX)
    console.log(`Extracting text from ${file.name} (${file.type})...`);
    const fileText = await extractTextFromDocument(file);
    console.log(`✅ Extracted ${fileText.length} characters from ${file.name}`);

    if (!fileText || fileText.trim().length === 0) {
      throw new Error('Could not extract text from document. The file may be scanned, corrupted, or empty.');
    }

    const prompt = getCompliancePrompt(selectedStandards, 'ANALYZE_UPLOADED_FILE');
    const fullPrompt = `${prompt}\n\nDocument Content:\n${fileText.substring(0, 50000)}`;

    let lastErr: unknown = null;

    // Try each Portkey model
    for (const modelConfig of availableModels) {
      try {
        console.log(`Attempting compliance analysis with ${modelConfig.provider}/${modelConfig.model}`);
        
        const portkey = createPortkeyClient(modelConfig.provider);
        
        if (!portkey) {
          console.log(`Portkey client unavailable for ${modelConfig.provider}`);
          continue;
        }

        const response = await portkey.chat.completions.create({
          model: modelConfig.model,
          messages: [
            { role: 'system', content: 'You are an expert compliance analyst. Analyze documents and return valid JSON responses.' },
            { role: 'user', content: fullPrompt }
          ],
          temperature: 0.1,
          max_tokens: 8192,
          response_format: { type: 'json_object' }
        });

        const responseText = response.choices[0]?.message?.content || '';
        const textStr = typeof responseText === 'string' ? responseText : JSON.stringify(responseText);
        
        console.log(`✅ Success with ${modelConfig.provider}/${modelConfig.model}`);
        console.log('Response preview:', textStr.substring(0, 200) + '...');

        // Parse JSON response
        try {
          const jsonMatch = textStr.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysisResult = JSON.parse(jsonMatch[0]);
            return analysisResult;
          } else {
            throw new Error('No JSON found in AI response');
          }
        } catch (parseError) {
          console.warn(`Failed to parse JSON response from ${modelConfig.provider}:`, parseError);
          return createStructuredResponseFromText(textStr);
        }
        
      } catch (err) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Model ${modelConfig.provider}/${modelConfig.model} failed: ${msg}`);
        continue;
      }
    }
    
    // If all Portkey models failed, throw error
    throw lastErr instanceof Error
      ? new Error(lastErr.message)
      : new Error('All Portkey models failed');

  } catch (error) {
    console.error('AI analysis failed:', error);
    throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Removed unnecessary text extraction helpers
// Portkey models (GPT-4, Claude) can handle document text directly

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
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const supportedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const isSupported = supportedTypes.includes(file.type) ||
      file.name.endsWith('.pdf') ||
      file.name.endsWith('.docx');

    if (!isSupported) {
      return NextResponse.json({
        error: `Unsupported file type: ${file.type}. Please upload PDF or DOCX files.`
      }, { status: 400 });
    }

    // Try AI analysis with Portkey multi-provider support
    let analysisResult;
    let method = 'portkey';

    try {
      console.log('Attempting AI analysis with multi-provider support...');
      analysisResult = await analyzeWithAI(file, selectedStandards);
      console.log('✅ AI analysis completed successfully');

    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
      return NextResponse.json({
        error: `Analysis failed: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`
      }, { status: 500 });
    }

    // Optionally apply RuleBase from Supabase
    let appliedRuleBase = false;
    let ruleCount = 0;
    if (applyRuleBase) {
      try {
        // Fetch rules from Supabase using Postgrest API
        const { data: rules, error: rulesError } = await supabase
          .from('rulebase')
          .select('*')
          .eq('user_id', user.id)
          .eq('active', true);

        if (rulesError) {
          console.error('Failed to fetch rulebase:', rulesError);
        } else if (rules && rules.length > 0) {
          console.log(`📚 Applying ${rules.length} rules from rulebase`);
          const applied = applyRulebaseToAnalysis(analysisResult, rules, selectedStandards);
          analysisResult = applied.analysis;
          appliedRuleBase = applied.applied;
          ruleCount = applied.ruleCount;
          method = `${method}+rulebase`;
        } else {
          console.log('ℹ️ No active rules found in rulebase');
        }
      } catch (error) {
        console.error('Failed to apply rulebase:', error);
        // Continue without rulebase
      }
    }

    // Save analysis to Supabase
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Save to Supabase using Postgrest API
        const { error: insertError } = await supabase
          .from('document_analysis')
          .insert({
            user_id: user.id,
            document_id: `doc_${Date.now()}`,
            title: file.name,
            compliance_standard: selectedStandards[0] || 'general',
            score: analysisResult.overallScore || 0,
            metrics: { 
              ...analysisResult, 
              analysisMethod: 'policy-analysis', 
              standards: selectedStandards 
            },
          });

        if (insertError) {
          console.error('Failed to save analysis to document_analysis:', insertError);
        } else {
          console.log('✅ Analysis saved to document_analysis table');
        }
      }
    } catch (error) {
      console.error('Failed to save analysis to Supabase:', error);
      // Continue even if saving fails
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      selectedStandards,
      analysis: analysisResult,
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
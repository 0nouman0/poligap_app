import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { createPortkeyClient, getAvailableModels, getBestAvailableModel, type ModelConfig } from "@/lib/portkey/client";

export async function POST(req: NextRequest) {
  let text = "";
  let templateClauses: any[] = [];
  let contractType = "";
  
  try {
    console.log("Contract analyze API called");
    
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const requestData = await req.json();
    text = requestData.text;
    templateClauses = requestData.templateClauses;
    contractType = requestData.contractType;
    
    console.log("Request data:", { 
      textLength: text?.length, 
      clausesCount: templateClauses?.length, 
      contractType 
    });

    if (!text || !Array.isArray(templateClauses)) {
      console.log("Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: text, templateClauses" },
        { status: 400 }
      );
    }

    // Get available AI models
    const availableModels = getAvailableModels();
    console.log("Available AI models:", availableModels.map(m => `${m.provider}/${m.model}`));

    if (availableModels.length === 0) {
      console.log("No API keys configured");
      return NextResponse.json(
        { error: "No AI models available. Please configure API keys." },
        { status: 500 }
      );
    }

    const prompt = createAnalysisPrompt(text, templateClauses, contractType || "contract");
    console.log("Generated prompt length:", prompt.length);

    // Retry with exponential backoff and model fallback
    let lastError: any = null;
    let modelUsed = "";
    let providerUsed = "";
    
    for (let attempt = 0; attempt < 2; attempt++) {
      for (const modelConfig of availableModels) {
        try {
          console.log(`Attempt ${attempt + 1}: Trying ${modelConfig.provider}/${modelConfig.model}`);
          
          let analysisText = "";
          
          // Use Portkey for supported providers
          if (modelConfig.provider !== 'gemini') {
            const portkey = createPortkeyClient(modelConfig.provider);
            
            if (!portkey) {
              console.log(`Portkey client unavailable for ${modelConfig.provider}`);
              continue;
            }

            const response = await portkey.chat.completions.create({
              model: modelConfig.model,
              messages: [
                { role: "system", content: "You are an expert legal AI assistant specializing in contract analysis." },
                { role: "user", content: prompt }
              ],
              temperature: 0.1,
              max_tokens: 8192,
              response_format: { type: "json_object" }
            });

            const content = response.choices[0]?.message?.content;
            analysisText = Array.isArray(content) ? content.join('') : (content || "");
            modelUsed = modelConfig.model;
            providerUsed = modelConfig.provider;
            
          } else {
            // Direct Gemini API for Gemini models
            const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            if (!apiKey) {
              console.log("Gemini API key not found");
              continue;
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelConfig.model });
            
            const result = await model.generateContent({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1,
                topK: 1,
                topP: 0.8,
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
              },
            });
            
            const response = await result.response;
            analysisText = response.text();
            modelUsed = modelConfig.model;
            providerUsed = "gemini";
          }
          
          console.log(`✅ Success with ${providerUsed}/${modelUsed}`);
          console.log("AI response received, length:", analysisText.length);
          
          const parsed = parseAnalysisResult(analysisText, text);
          console.log("Analysis parsed successfully, suggestions count:", parsed.suggestions.length);

          // Save to Supabase
          try {
            const { data: analysisRecord, error: insertError } = await supabase
              .from('document_analysis')
              .insert({
                user_id: user.id,
                document_id: `contract_${Date.now()}`,
                title: `${contractType || 'Contract'} Analysis`,
                compliance_standard: 'Contract Review',
                score: parsed.overallScore * 100, // Convert to percentage
                metrics: { ...parsed, analysisMethod: 'contract-review' },
              })
              .select()
              .single();

            if (insertError) {
              console.error('Failed to save contract analysis to Supabase:', insertError);
            } else {
              console.log('Contract analysis saved successfully:', analysisRecord?.id);
            }
          } catch (saveError) {
            console.error('Failed to save contract analysis to Supabase:', saveError);
          }
          
          return NextResponse.json({ 
            success: true, 
            modelUsed, 
            providerUsed,
            ...parsed 
          });
          
        } catch (error: any) {
          lastError = error;
          console.log(`❌ Model ${modelConfig.model} failed:`, error.message);
          
          // Check if it's a quota/rate limit error
          if (error.message?.includes('quota') || error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
            console.log(`⏳ Quota exceeded for ${modelConfig.model}, trying next model...`);
            continue; // Try next model immediately
          }
          
          // Check if it's a service unavailable error
          if (error.message?.includes('503') || error.message?.includes('overloaded')) {
            console.log(`🔄 Service overloaded for ${modelConfig.model}, trying next model...`);
            continue; // Try next model immediately
          }
          
          // For other errors, continue to next model
          continue;
        }
      }
      
      // If all models failed in this attempt, wait before retrying
      if (attempt < 2) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s exponential backoff
        console.log(`⏳ All models failed, waiting ${waitTime}ms before retry ${attempt + 2}...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // If all attempts failed, throw the last error
    console.error("All Gemini models and retry attempts failed");
    throw lastError || new Error("All Gemini models are currently unavailable");
  } catch (error) {
    console.error("contract-analyze error:", error);
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "AI analysis failed. Please try again.",
      suggestions: [],
      overallScore: 0.5,
      riskAssessment: { level: 'medium', factors: ['AI analysis unavailable'] },
      missingClauses: [],
      complianceIssues: []
    }, { status: 500 });
  }
}

function createAnalysisPrompt(contractText: string, templateClauses: any[], contractType: string): string {
  const textLength = contractText.length;
  const wordCount = contractText.split(/\s+/).length;
  
  return `You are an expert legal AI assistant. You MUST provide MINIMUM 20-25 suggestions. Analyze this ENTIRE contract document and provide comprehensive suggestions throughout. DO NOT PROVIDE FEWER THAN 20 SUGGESTIONS.

**DOCUMENT TO ANALYZE (${textLength} characters, ${wordCount} words):**
${contractText}

**IMPORTANT**: This document has ${textLength} characters. You MUST analyze from character 0 to character ${textLength}. Do NOT stop at the beginning - read the ENTIRE document.

**COMPREHENSIVE ANALYSIS REQUIREMENTS:**
1. **SCAN ENTIRE DOCUMENT** - Analyze from character 0 to character ${textLength} (${wordCount} words)
2. **PROVIDE MINIMUM 20-25 SUGGESTIONS** - Spread suggestions across the beginning, middle, and end
3. **FIND REAL ISSUES** - Identify actual problems in the text, not generic advice
4. **EXACT POSITIONS** - Use precise startIndex and endIndex from the actual text
5. **MULTIPLE TYPES** - Include additions, deletions, and modifications
6. **LEGAL FOCUS** - Improve clarity, completeness, and legal protection
7. **THOROUGH ANALYSIS** - Analyze every paragraph and clause for improvements

**ANALYSIS STRATEGY - YOU MUST FOLLOW THIS EXACTLY:**
- **SECTION 1 (MANDATORY)**: Characters 0 to ${Math.floor(textLength/3)} - Find EXACTLY 6-8 suggestions
- **SECTION 2 (MANDATORY)**: Characters ${Math.floor(textLength/3)} to ${Math.floor(2*textLength/3)} - Find EXACTLY 6-8 suggestions  
- **SECTION 3 (MANDATORY)**: Characters ${Math.floor(2*textLength/3)} to ${textLength} - Find EXACTLY 6-8 suggestions
- **MISSING CLAUSES (MANDATORY)**: Find EXACTLY 3-5 additional missing clause suggestions
- **ABSOLUTE MINIMUM**: 20 suggestions total - DO NOT PROVIDE FEWER
- **CRITICAL**: Analyze EVERY single paragraph and sentence
- **CRITICAL**: Look for ANY possible improvement in EVERY line of text
- **CRITICAL**: Find issues with wording, clarity, legal protection, completeness
- TOTAL REQUIREMENT: MINIMUM 20-25 suggestions across ENTIRE document

**TEMPLATE REFERENCE (for comparison):**
${templateClauses.map((clause: any) => `
- ${clause.title}: ${clause.content || 'Standard clause expected'}
`).join('\n')}

**CRITICAL INSTRUCTIONS:**
- **SCAN ENTIRE DOCUMENT**: Read from first character to last character
- **DISTRIBUTE SUGGESTIONS**: Must have suggestions in beginning, middle, AND end sections
- **NO CLUSTERING**: Do not put all suggestions in one section of the document
- **EXACT POSITIONS**: Use precise startIndex/endIndex from actual contract text
- **REAL TEXT ANALYSIS**: Base suggestions on actual contract content, not generic advice
- **FULL COVERAGE**: Analyze every paragraph, clause, and section thoroughly
- **BALANCED DISTRIBUTION**: Ensure suggestions appear throughout entire document length
- **CHARACTER RANGES**: Include suggestions from 0-33%, 33%-66%, and 66%-100% of document
- **ABSOLUTE REQUIREMENT**: Provide MINIMUM 20-25 suggestions spread across ENTIRE document
- **DO NOT PROVIDE FEWER THAN 20 SUGGESTIONS** - This is mandatory
- Focus on: ambiguous language, missing definitions, weak clauses, unclear terms, grammar, punctuation
- Target: termination provisions, payment terms, liability, dispute resolution, definitions, formatting
- **MINIMUM DISTRIBUTION**: At least 6 suggestions in each third of the document
- **COMPREHENSIVE COVERAGE**: Analyze every clause, paragraph, sentence, and word thoroughly
- **FIND MORE ISSUES**: Look for minor improvements, word choices, clarity issues, formatting problems
- **BE THOROUGH**: Even small improvements count as valid suggestions

Return ONLY valid JSON with comprehensive suggestions for the entire document:

{
  "suggestions": [
    {
      "id": "suggestion_1",
      "type": "addition|deletion|modification|replacement",
      "severity": "low|medium|high|critical", 
      "category": "legal_compliance|clarity|risk_mitigation|completeness|formatting",
      "confidence": 0.9,
      "originalText": "exact text from contract (empty for additions)",
      "suggestedText": "specific text to add or replace with (empty for deletions)",
      "startIndex": 0,
      "endIndex": 50,
      "reasoning": "detailed explanation of why this change is needed",
      "legalImplications": "specific legal risk if not addressed",
      "riskLevel": "low|medium|high|critical",
      "section": "section name where change is needed",
      "clauseType": "type of clause (e.g., 'Liability', 'Termination', 'Payment')",
      "highlightColor": "green|red|yellow",
      "actionLabel": "Add|Remove|Modify"
    }
  ],
  "documentAnalysis": {
    "totalSuggestions": 5,
    "additionsCount": 2,
    "deletionsCount": 1,
    "modificationsCount": 2,
    "criticalIssues": 1,
    "overallScore": 0.75
  },
  "riskAssessment": {
    "level": "medium",
    "factors": ["specific risks found in this contract"],
    "criticalRisks": ["high-priority legal vulnerabilities"]
  },
  "missingClauses": ["essential clauses not found in document"],
  "redundantClauses": ["clauses that should be removed or consolidated"],
  "complianceIssues": ["specific compliance problems identified"]
}`;
}

function parseAnalysisResult(analysisText: string, contractText: string) {
  let jsonStr = '';
  
  try {
    console.log('Raw Gemini response:', analysisText.substring(0, 500) + '...');
    
    // Method 1: Look for complete JSON object
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    } else {
      // Method 2: Look for JSON between code blocks
      const codeBlockMatch = analysisText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      } else {
        // Method 3: Extract everything between first { and last }
        const firstBrace = analysisText.indexOf('{');
        const lastBrace = analysisText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = analysisText.substring(firstBrace, lastBrace + 1);
        }
      }
    }
    
    if (jsonStr) {
      // Clean up common JSON issues
      jsonStr = jsonStr
        .replace(/,\s*}/g, '}') // Remove trailing commas
        .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .trim();
      
      console.log('Attempting to parse JSON:', jsonStr.substring(0, 200) + '...');
      
      const parsed = JSON.parse(jsonStr);
      const suggestions = (parsed.suggestions || []).map((s: any, index: number) => ({
        ...s,
        id: s.id || `suggestion_${Date.now()}_${index}`,
        timestamp: new Date(),
        status: 'pending',
        startIndex: Math.max(0, s.startIndex || 0),
        endIndex: Math.min(contractText.length, s.endIndex || (s.startIndex || 0) + (s.originalText?.length || 0))
      }));

      // Validate distribution across document
      const textLength = contractText.length;
      const firstThird = textLength / 3;
      const secondThird = (2 * textLength) / 3;
      
      const firstThirdSuggestions = suggestions.filter(s => s.startIndex < firstThird).length;
      const middleThirdSuggestions = suggestions.filter(s => s.startIndex >= firstThird && s.startIndex < secondThird).length;
      const lastThirdSuggestions = suggestions.filter(s => s.startIndex >= secondThird).length;
      
      console.log(`Suggestion distribution: First third: ${firstThirdSuggestions}, Middle third: ${middleThirdSuggestions}, Last third: ${lastThirdSuggestions}`);
      console.log(`Document sections: 0-${Math.floor(firstThird)}, ${Math.floor(firstThird)}-${Math.floor(secondThird)}, ${Math.floor(secondThird)}-${textLength}`);
      
      return {
        suggestions,
        overallScore: parsed.overallScore || 0.7,
        riskAssessment: parsed.riskAssessment || { level: 'medium', factors: [] },
        missingClauses: parsed.missingClauses || [],
        complianceIssues: parsed.complianceIssues || []
      };
    }
  } catch (e) {
    console.error('JSON parsing error:', e);
    console.error('Failed to parse:', jsonStr?.substring(0, 200));
  }
  
  // No fallback analysis - return empty result if parsing fails
  console.log('AI analysis parsing failed - returning empty suggestions');
  return {
    suggestions: [],
    overallScore: 0.5,
    riskAssessment: { level: 'medium', factors: ['AI parsing failed'] },
    missingClauses: [],
    complianceIssues: []
  };
}

// Removed fallback analysis - only real AI suggestions are used

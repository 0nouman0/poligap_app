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

            analysisText = response.choices[0]?.message?.content || "";
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
          console.log(`❌ Model ${modelName} failed:`, error.message);
          
          // Check if it's a quota/rate limit error
          if (error.message?.includes('quota') || error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
            console.log(`⏳ Quota exceeded for ${modelName}, trying next model...`);
            continue; // Try next model immediately
          }
          
          // Check if it's a service unavailable error
          if (error.message?.includes('503') || error.message?.includes('overloaded')) {
            console.log(`🔄 Service overloaded for ${modelName}, trying next model...`);
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
  
  return `You are an expert legal AI assistant. Analyze this ENTIRE contract document and provide comprehensive suggestions throughout.

**DOCUMENT TO ANALYZE:**
${contractText}

**COMPREHENSIVE ANALYSIS REQUIREMENTS:**
1. **SCAN ENTIRE DOCUMENT** - Analyze from character 0 to character ${textLength} (${wordCount} words)
2. **PROVIDE 10-15 SUGGESTIONS MINIMUM** - Spread suggestions across the beginning, middle, and end
3. **FIND REAL ISSUES** - Identify actual problems in the text, not generic advice
4. **EXACT POSITIONS** - Use precise startIndex and endIndex from the actual text
5. **MULTIPLE TYPES** - Include additions, deletions, and modifications
6. **LEGAL FOCUS** - Improve clarity, completeness, and legal protection

**ANALYSIS STRATEGY:**
- First third (0-${Math.floor(textLength/3)}): Find 3-5 suggestions
- Middle third (${Math.floor(textLength/3)}-${Math.floor(2*textLength/3)}): Find 3-5 suggestions  
- Final third (${Math.floor(2*textLength/3)}-${textLength}): Find 3-5 suggestions
- Document-wide: Find missing clauses to add

**TEMPLATE REFERENCE (for comparison):**
${templateClauses.map((clause: any) => `
- ${clause.title}: ${clause.content || 'Standard clause expected'}
`).join('\n')}

**CRITICAL INSTRUCTIONS:**
- Analyze EVERY sentence in the contract text above
- Provide AT LEAST 5-10 suggestions spread throughout the document
- Find issues in the beginning, middle, and end of the document
- Give REAL suggestions based on the actual text, not generic advice
- Use exact character positions from the contract text
- Focus on legal improvements, clarity, and completeness

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

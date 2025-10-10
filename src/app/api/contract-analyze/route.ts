import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { queries } from "@/lib/supabase/graphql";
import { GraphQLClient } from "graphql-request";

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

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.log("No API key found");
      return NextResponse.json(
        { error: "Gemini API key not configured on server" },
        { status: 500 }
      );
    }

    console.log("Initializing Gemini...");
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use latest Gemini Flash 2.0/2.5 models for advanced contract analysis
    const models = [
      "gemini-2.0-flash-exp",
      "gemini-exp-1206", 
      "gemini-2.0-flash-thinking-exp-1219",
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash-002",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ];
    let model;
    let modelUsed = "";
    
    for (const modelName of models) {
      try {
        model = genAI.getGenerativeModel({ model: modelName });
        modelUsed = modelName;
        console.log(`Using model: ${modelName}`);
        break;
      } catch (e) {
        console.log(`Model ${modelName} not available, trying next...`);
        continue;
      }
    }
    
    if (!model) {
      throw new Error("No available Gemini models");
    }

    const prompt = createAnalysisPrompt(text, templateClauses, contractType || "contract");
    console.log("Generated prompt length:", prompt.length);

    console.log("Calling Gemini API...");
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
    const analysisText = response.text();
    console.log("Gemini response received, length:", analysisText.length);
    const parsed = parseAnalysisResult(analysisText, text);
    console.log("Analysis parsed successfully, suggestions count:", parsed.suggestions.length);

    // Save contract analysis to Supabase
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const graphQLClient = new GraphQLClient(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`,
          {
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        await graphQLClient.request<any>(queries.createDocumentAnalysis, {
          user_id: user.id,
          document_id: `contract_${Date.now()}`,
          title: `${contractType || 'Contract'} Analysis`,
          compliance_standard: 'Contract Review',
          score: parsed.overallScore * 100, // Convert to percentage
          metrics: { ...parsed, analysisMethod: 'contract-review' },
        });
      }
    } catch (error) {
      console.error('Failed to save contract analysis to Supabase:', error);
      // Continue even if saving fails
    }

    return NextResponse.json({ success: true, modelUsed, ...parsed });
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

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { text, templateClauses, contractType } = await req.json();

    if (!text || !Array.isArray(templateClauses)) {
      return NextResponse.json(
        { error: "Missing required fields: text, templateClauses" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured on server" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = createAnalysisPrompt(text, templateClauses, contractType || "contract");

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 8192,
      },
    } as any);

    const response = await result.response;
    const analysisText = response.text();

    const parsed = parseAnalysisResult(analysisText, text);

    return NextResponse.json({ success: true, ...parsed });
  } catch (error) {
    console.error("contract-analyze error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function createAnalysisPrompt(contractText: string, templateClauses: any[], contractType: string): string {
  return `You are a legal contract analysis expert. Analyze the following ${contractType} contract against the provided template clauses and identify specific improvements.

CONTRACT TEXT:
${contractText}

TEMPLATE CLAUSES TO CHECK:
${templateClauses.map((clause: any) => `- ${clause.title} (Priority: ${clause.priority}, Required: ${clause.isRequired})\n  Content: ${clause.content}\n  Guidelines: ${(clause.guidelines || []).join(', ')}`).join('\n')}

Return ONLY valid JSON matching this schema:
{
  "suggestions": [
    {
      "id": "unique_id",
      "type": "addition|deletion|modification|replacement",
      "severity": "low|medium|high|critical",
      "category": "legal_compliance|clarity|completeness|risk_mitigation|formatting",
      "confidence": 0.95,
      "originalText": "text from contract (empty for additions)",
      "suggestedText": "improved text",
      "startIndex": 100,
      "endIndex": 200,
      "reasoning": "why change is needed",
      "legalImplications": "impact",
      "riskLevel": "low|medium|high|critical",
      "section": "section name",
      "clauseType": "clause type from template"
    }
  ],
  "overallScore": 0.85,
  "riskAssessment": { "level": "medium", "factors": ["..."] },
  "missingClauses": ["..."],
  "complianceIssues": ["..."]
}
`;
}

function parseAnalysisResult(analysisText: string, contractText: string) {
  try {
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
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
    console.error('parseAnalysisResult error', e);
  }
  // Fallback minimal structure
  return {
    suggestions: [],
    overallScore: 0.6,
    riskAssessment: { level: 'medium', factors: [] },
    missingClauses: [],
    complianceIssues: []
  };
}

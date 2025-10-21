import { TemplateClause, AISuggestion } from '@/store/contractReview';

export interface ContractAnalysisResult {
  suggestions: AISuggestion[];
  overallScore: number;
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
  };
  missingClauses: string[];
  complianceIssues: string[];
}

class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  }

  async analyzeContract(
    contractText: string,
    templateClauses: TemplateClause[],
    contractType: string
  ): Promise<ContractAnalysisResult> {
    // First try server-side route to avoid exposing keys client-side
    try {
      const serverResp = await fetch('/api/contract-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: contractText, templateClauses, contractType })
      });
      if (serverResp.ok) {
        const json = await serverResp.json();
        return {
          suggestions: json.suggestions || [],
          overallScore: json.overallScore ?? 0.7,
          riskAssessment: json.riskAssessment || { level: 'medium', factors: [] },
          missingClauses: json.missingClauses || [],
          complianceIssues: json.complianceIssues || [],
        };
      }
      // If server route fails, fall through to client direct call
      console.warn('Server /api/contract-analyze failed, falling back to direct Gemini:', await serverResp.text());
    } catch (err) {
      console.warn('Failed calling /api/contract-analyze, falling back to direct Gemini', err);
    }

    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = this.createAnalysisPrompt(contractText, templateClauses, contractType);

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const analysisText = data.candidates[0].content.parts[0].text;

      return this.parseAnalysisResult(analysisText, contractText);
    } catch (error) {
      console.error('Gemini analysis failed:', error);
      throw new Error(`Contract analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createAnalysisPrompt(
    contractText: string,
    templateClauses: TemplateClause[],
    contractType: string
  ): string {
    return `
You are a legal contract analysis expert. Analyze the following ${contractType} contract against the provided template clauses and identify specific improvements.

CONTRACT TEXT:
${contractText}

TEMPLATE CLAUSES TO CHECK:
${templateClauses.map(clause => `
- ${clause.title} (Priority: ${clause.priority}, Required: ${clause.isRequired})
  Content: ${clause.content}
  Guidelines: ${clause.guidelines.join(', ')}
`).join('\n')}

Please provide a detailed analysis in the following JSON format:

{
  "suggestions": [
    {
      "id": "unique_id",
      "type": "addition|deletion|modification|replacement",
      "severity": "low|medium|high|critical",
      "category": "legal_compliance|clarity|completeness|risk_mitigation|formatting",
      "confidence": 0.95,
      "originalText": "text from contract",
      "suggestedText": "improved text",
      "startIndex": 100,
      "endIndex": 200,
      "reasoning": "explanation of why this change is needed",
      "legalImplications": "potential legal impact",
      "riskLevel": "low|medium|high|critical",
      "section": "section name",
      "clauseType": "clause type from template"
    }
  ],
  "overallScore": 0.85,
  "riskAssessment": {
    "level": "medium",
    "factors": ["list of risk factors"]
  },
  "missingClauses": ["list of missing important clauses"],
  "complianceIssues": ["list of compliance problems"]
}

Focus on:
1. Missing critical clauses from the template
2. Weak or incomplete existing clauses
3. Legal compliance issues
4. Risk mitigation opportunities
5. Clarity and enforceability improvements

Provide specific text suggestions with exact positions in the contract.
`;
  }

  private parseAnalysisResult(analysisText: string, contractText: string): ContractAnalysisResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Add timestamps and IDs to suggestions
        const suggestions: AISuggestion[] = parsed.suggestions.map((s: any, index: number) => ({
          ...s,
          id: s.id || `suggestion_${Date.now()}_${index}`,
          timestamp: new Date(),
          status: 'pending' as const,
          startIndex: Math.max(0, s.startIndex || 0),
          endIndex: Math.min(contractText.length, s.endIndex || s.startIndex + (s.originalText?.length || 0))
        }));

        return {
          suggestions,
          overallScore: parsed.overallScore || 0.7,
          riskAssessment: parsed.riskAssessment || { level: 'medium', factors: [] },
          missingClauses: parsed.missingClauses || [],
          complianceIssues: parsed.complianceIssues || []
        };
      }
    } catch (error) {
      console.error('Failed to parse Gemini analysis result:', error);
    }

    // Fallback: create basic suggestions from text analysis
    return this.createFallbackAnalysis(analysisText, contractText);
  }

  private createFallbackAnalysis(analysisText: string, contractText: string): ContractAnalysisResult {
    const suggestions: AISuggestion[] = [];
    
    // Create some basic suggestions based on common contract issues
    if (!contractText.toLowerCase().includes('liability')) {
      suggestions.push({
        id: `fallback_${Date.now()}_1`,
        type: 'addition',
        severity: 'high',
        category: 'legal_compliance',
        confidence: 0.8,
        originalText: '',
        suggestedText: '\n\nLIMITATION OF LIABILITY: Neither party shall be liable for any indirect, incidental, special, or consequential damages arising out of this agreement.',
        startIndex: contractText.length,
        endIndex: contractText.length,
        reasoning: 'Missing liability limitation clause',
        legalImplications: 'Without liability limitations, parties may be exposed to unlimited damages',
        riskLevel: 'high',
        section: 'Legal Protection',
        timestamp: new Date(),
        status: 'pending',
        clauseType: 'Limitation of Liability'
      });
    }

    if (!contractText.toLowerCase().includes('termination')) {
      suggestions.push({
        id: `fallback_${Date.now()}_2`,
        type: 'addition',
        severity: 'high',
        category: 'completeness',
        confidence: 0.8,
        originalText: '',
        suggestedText: '\n\nTERMINATION: Either party may terminate this agreement with 30 days written notice.',
        startIndex: contractText.length,
        endIndex: contractText.length,
        reasoning: 'Missing termination clause',
        legalImplications: 'Without clear termination terms, ending the agreement may be difficult',
        riskLevel: 'medium',
        section: 'Agreement Terms',
        timestamp: new Date(),
        status: 'pending',
        clauseType: 'Termination'
      });
    }

    return {
      suggestions,
      overallScore: 0.6,
      riskAssessment: {
        level: 'medium',
        factors: ['Missing standard clauses', 'Limited legal protections']
      },
      missingClauses: ['Limitation of Liability', 'Termination Clause'],
      complianceIssues: ['Incomplete legal framework']
    };
  }
}

export const geminiService = new GeminiService();

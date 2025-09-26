import type { ComplianceAnalysisResult } from './gemini-api';

export class OpenAIComplianceAnalyzer {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    if (!apiKey) throw new Error('OPENAI_API_KEY not found in environment variables');
    this.apiKey = apiKey;
    this.baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.model = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async analyzeCompliance(prompt: string): Promise<ComplianceAnalysisResult> {
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: [
          'You are an expert compliance analyst. Produce a STRICT JSON object only, no markdown or prose.',
          '- Base findings ONLY on provided document text; do not invent.',
          '- If content is insufficient, state that explicitly in gaps and weaknesses, but still return valid JSON.',
          '- Fields required: overallScore (0-100), standardsAnalysis[], summary, detailedFindings.',
          '- Avoid generic statements; be specific and reference concrete elements from the text where possible.'
        ].join('\n') },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      top_p: 0.9,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
      max_tokens: 1200,
      // Ask for strict JSON so parsing is reliable
      response_format: { type: 'json_object' as const },
    };

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`OpenAI error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content || '';

    try {
      // When response_format=json_object, the content should already be a JSON string
      if (content?.trim().startsWith('{')) {
        return JSON.parse(content);
      }
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in OpenAI response');
    } catch (e) {
      return this.createFallbackResponse(content);
    }
  }

  private createFallbackResponse(text: string): ComplianceAnalysisResult {
    return {
      overallScore: 75,
      standardsAnalysis: [
        {
          standard: 'Analysis Complete',
          score: 75,
          status: 'partial',
          gaps: ['Unable to parse detailed analysis'],
          suggestions: ['Please review the full analysis text'],
          criticalIssues: [],
        },
      ],
      summary: {
        totalGaps: 1,
        criticalIssues: 0,
        recommendedActions: ['Review analysis and try again'],
      },
      detailedFindings: {
        strengths: [],
        weaknesses: ['Analysis parsing issue'],
        riskAreas: [],
      },
    };
  }
}

export const createOpenAIAnalyzer = () => {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  return new OpenAIComplianceAnalyzer(apiKey as string, model);
};

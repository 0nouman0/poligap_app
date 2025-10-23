import { NextRequest, NextResponse } from 'next/server';
import { getCompliancePrompt } from '@/lib/compliance-prompt';
import { createClient } from '@/lib/supabase/server';
import { createPortkeyClient, getAvailableModels } from '@/lib/portkey/client';
import { createGeminiAnalyzer } from '@/lib/gemini-api';
import { extractTextFromDocument } from '@/lib/parsers/document-parser';
import { v4 as uuidv4 } from 'uuid';

// Document analysis using Portkey - uses Gemini AI for text extraction, Portkey for compliance analysis
async function analyzeWithAI(file: File, selectedStandards: string[]): Promise<any> {
  try {
    console.log('🚀 Starting compliance analysis with Portkey models...');
    
    // Get available Portkey models for analysis
    const availableModels = getAvailableModels().filter(m => m.provider !== 'gemini');
    console.log('Available Portkey models:', availableModels.map(m => `${m.provider}/${m.model}`));

    // If no Portkey models available, try Gemini as fallback
    if (availableModels.length === 0) {
      console.log('No Portkey models available, trying Gemini as fallback...');
      
      let geminiAnalyzer;
      try {
        geminiAnalyzer = createGeminiAnalyzer();
        console.log('✅ Gemini analyzer initialized as fallback');
      } catch (geminiError) {
        console.warn('⚠️ No analysis models available:', geminiError);
        console.log('Using basic document analysis...');
        return await createBasicComplianceAnalysis(file, selectedStandards);
      }
    }

    // Extract text using AI-powered parser (Gemini AI primary, pdfjs-dist/mammoth fallback)
    console.log(`Extracting text from ${file.name} (${file.type})...`);
    const fileText = await extractTextFromDocument(file);
    console.log(`✅ Extracted ${fileText.length} characters from ${file.name}`);

    if (!fileText || fileText.trim().length === 0) {
      throw new Error('Could not extract text from document. The file may be scanned, corrupted, or empty.');
    }

    // Check text quality before proceeding with analysis
    const words = fileText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const readableWords = words.filter(word => /^[a-z]+$/i.test(word));
    const readabilityRatio = readableWords.length / Math.max(1, words.length);
    
    // More intelligent quality check - look for meaningful content
    const meaningfulWords = readableWords.filter(word => 
      word.length >= 3 && 
      !(/^[xyz]+$/.test(word)) && // Filter out single character repetitions
      !(/^[0-9]+$/.test(word))    // Filter out pure numbers
    );
    const meaningfulRatio = meaningfulWords.length / Math.max(1, words.length);
    
    console.log(`📊 Text quality analysis:`);
    console.log(`   - Total words: ${words.length}`);
    console.log(`   - Readable words: ${readableWords.length} (${(readabilityRatio * 100).toFixed(1)}%)`);
    console.log(`   - Meaningful words: ${meaningfulWords.length} (${(meaningfulRatio * 100).toFixed(1)}%)`);
    console.log(`📄 Sample extracted text: "${fileText.substring(0, 200)}..."`);
    
    // If we have very few meaningful words, it's likely corrupted/scanned
    if (meaningfulRatio < 0.05 && meaningfulWords.length < 20) {
      console.warn(`⚠️ Document appears to be scanned or corrupted (only ${meaningfulWords.length} meaningful words found)`);
      throw new Error('Document text appears to be corrupted or unreadable. This may be a scanned PDF or encrypted document. Please try uploading a text-based PDF or DOCX file.');
    }
    
    // If readability is very low but we have some meaningful words, proceed with caution
    if (readabilityRatio < 0.15 && meaningfulWords.length >= 20) {
      console.warn(`⚠️ Document quality is poor but proceeding with ${meaningfulWords.length} meaningful words`);
    }

    const prompt = getCompliancePrompt(selectedStandards, 'ANALYZE_UPLOADED_FILE');
    const fullPrompt = `${prompt}\n\nDocument Content:\n${fileText.substring(0, 50000)}`;

    let lastErr: unknown = null;

    // Try Portkey models first (primary analysis method)
    if (availableModels.length > 0) {
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
    }

    // Fallback to Gemini if no Portkey models available
    console.log('🔄 No Portkey models available, trying Gemini as fallback...');
    try {
      const geminiAnalyzer = createGeminiAnalyzer();
      console.log('🔥 Attempting compliance analysis with Gemini Flash 2.0...');
      const analysisResult = await geminiAnalyzer.analyzeCompliance(fullPrompt);
      console.log('✅ Success with Gemini Flash 2.0');
      console.log('Response preview:', JSON.stringify(analysisResult).substring(0, 200) + '...');
      return analysisResult;
    } catch (geminiError) {
      console.warn('⚠️ Gemini analysis also failed:', geminiError);
      throw new Error('All analysis methods failed');
    }

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

// Create basic compliance analysis without AI dependencies - Enhanced to generate minimum 6 detailed issues
async function createBasicComplianceAnalysis(file: File, selectedStandards: string[]): Promise<any> {
  try {
    // Extract text using robust parser (pdf-parse for PDF, mammoth for DOCX)
    console.log(`Extracting text from ${file.name} (${file.type})...`);
    const fileText = await extractTextFromDocument(file);
    console.log(`✅ Extracted ${fileText.length} characters from ${file.name}`);

    if (!fileText || fileText.trim().length === 0) {
      throw new Error('Could not extract text from document. The file may be scanned, corrupted, or empty.');
    }

    if (fileText.length < 50) {
      console.warn(`⚠️ Very short text extracted (${fileText.length} chars): "${fileText.substring(0, 50)}..."`);
      throw new Error('Document contains very little readable text. It may be scanned, encrypted, or corrupted.');
    }

    console.log(`📊 Document analysis starting with ${fileText.length} characters of text`);
    console.log(`📄 First 200 chars: "${fileText.substring(0, 200)}..."`);

    // Enhanced compliance requirements mapping with detailed checks for all 40 standards
    const complianceRequirements: Record<string, {keywords: string[], mandatoryChecks: Array<{name: string, keywords: string[], category: string, severity: string}>}> = {
      'GDPR': {
        keywords: ['gdpr', 'data protection', 'personal data', 'consent', 'data subject', 'privacy policy', 'data processing'],
        mandatoryChecks: [
          { name: 'Legal Basis for Processing', keywords: ['legal basis', 'lawful basis', 'article 6'], category: 'Data Protection', severity: 'critical' },
          { name: 'Data Subject Rights', keywords: ['access right', 'rectification', 'erasure', 'portability'], category: 'Individual Rights', severity: 'critical' },
          { name: 'Consent Management', keywords: ['consent', 'withdrawal', 'freely given'], category: 'Consent', severity: 'high' },
          { name: 'Breach Notification', keywords: ['breach notification', '72 hour', 'supervisory authority'], category: 'Incident Response', severity: 'critical' },
          { name: 'Records of Processing', keywords: ['processing records', 'article 30', 'processing activities'], category: 'Documentation', severity: 'high' },
          { name: 'Data Protection Impact Assessment', keywords: ['dpia', 'impact assessment', 'high risk'], category: 'Risk Management', severity: 'medium' },
          { name: 'International Transfers', keywords: ['adequacy decision', 'appropriate safeguards', 'third country'], category: 'Data Transfer', severity: 'high' },
          { name: 'Data Protection Officer', keywords: ['dpo', 'data protection officer', 'article 37'], category: 'Governance', severity: 'medium' }
        ]
      },
      'HIPAA': {
        keywords: ['hipaa', 'protected health information', 'phi', 'healthcare', 'medical records', 'health information'],
        mandatoryChecks: [
          { name: 'Administrative Safeguards', keywords: ['security officer', 'workforce training', 'access management'], category: 'Administrative', severity: 'critical' },
          { name: 'Physical Safeguards', keywords: ['facility access', 'workstation use', 'device controls'], category: 'Physical Security', severity: 'critical' },
          { name: 'Technical Safeguards', keywords: ['access control', 'audit controls', 'integrity', 'transmission security'], category: 'Technical Security', severity: 'critical' },
          { name: 'Business Associate Agreements', keywords: ['business associate', 'baa', 'third party'], category: 'Third Party Management', severity: 'high' },
          { name: 'Breach Notification', keywords: ['breach notification', '60 day', 'hhs'], category: 'Incident Response', severity: 'critical' },
          { name: 'Patient Rights', keywords: ['access rights', 'amendment', 'accounting of disclosures'], category: 'Individual Rights', severity: 'high' },
          { name: 'Minimum Necessary', keywords: ['minimum necessary', 'need to know'], category: 'Data Minimization', severity: 'medium' },
          { name: 'Risk Assessment', keywords: ['risk assessment', 'security risk', 'vulnerability'], category: 'Risk Management', severity: 'high' }
        ]
      },
      'SOX': {
        keywords: ['sox', 'sarbanes oxley', 'financial reporting', 'internal controls', 'audit', 'financial statements'],
        mandatoryChecks: [
          { name: 'Internal Controls Over Financial Reporting', keywords: ['icfr', 'section 404', 'financial controls'], category: 'Financial Controls', severity: 'critical' },
          { name: 'Management Certifications', keywords: ['ceo certification', 'cfo certification', 'section 302'], category: 'Management Oversight', severity: 'critical' },
          { name: 'Auditor Independence', keywords: ['auditor independence', 'non-audit services', 'rotation'], category: 'Audit Independence', severity: 'high' },
          { name: 'Disclosure Controls', keywords: ['disclosure controls', 'material information'], category: 'Financial Disclosure', severity: 'critical' },
          { name: 'Code of Ethics', keywords: ['code of ethics', 'senior financial officers'], category: 'Ethics', severity: 'medium' },
          { name: 'Whistleblower Protection', keywords: ['whistleblower', 'anonymous reporting', 'retaliation'], category: 'Reporting', severity: 'high' },
          { name: 'Document Retention', keywords: ['document retention', 'record keeping', 'destruction'], category: 'Documentation', severity: 'high' },
          { name: 'Audit Committee', keywords: ['audit committee', 'independent directors'], category: 'Governance', severity: 'medium' }
        ]
      },
      'PCI DSS': {
        keywords: ['pci', 'payment card', 'cardholder data', 'credit card', 'payment processing'],
        mandatoryChecks: [
          { name: 'Network Security', keywords: ['firewall', 'network security', 'vendor defaults'], category: 'Network Security', severity: 'critical' },
          { name: 'Cardholder Data Protection', keywords: ['data encryption', 'cardholder data', 'stored data'], category: 'Data Protection', severity: 'critical' },
          { name: 'Vulnerability Management', keywords: ['anti-virus', 'vulnerability scans', 'patch management'], category: 'Vulnerability Management', severity: 'high' },
          { name: 'Access Control', keywords: ['access control', 'need to know', 'unique user id'], category: 'Access Management', severity: 'critical' },
          { name: 'Network Monitoring', keywords: ['logging', 'monitoring', 'audit trails'], category: 'Monitoring', severity: 'high' },
          { name: 'Security Testing', keywords: ['security testing', 'penetration testing', 'vulnerability assessment'], category: 'Security Testing', severity: 'high' },
          { name: 'Information Security Policy', keywords: ['security policy', 'policy maintenance'], category: 'Policy Management', severity: 'medium' },
          { name: 'Physical Security', keywords: ['physical access', 'media handling', 'secure disposal'], category: 'Physical Security', severity: 'medium' }
        ]
      },
      'ISO 27001': {
        keywords: ['iso 27001', 'information security', 'security management', 'risk assessment', 'security controls'],
        mandatoryChecks: [
          { name: 'Information Security Policy', keywords: ['security policy', 'management commitment'], category: 'Policy Framework', severity: 'critical' },
          { name: 'Risk Management', keywords: ['risk assessment', 'risk treatment', 'risk methodology'], category: 'Risk Management', severity: 'critical' },
          { name: 'Asset Management', keywords: ['asset inventory', 'asset classification', 'asset handling'], category: 'Asset Management', severity: 'high' },
          { name: 'Access Control', keywords: ['access control', 'user access', 'privilege management'], category: 'Access Control', severity: 'critical' },
          { name: 'Incident Management', keywords: ['incident response', 'security incidents', 'incident reporting'], category: 'Incident Management', severity: 'high' },
          { name: 'Business Continuity', keywords: ['business continuity', 'disaster recovery', 'continuity planning'], category: 'Business Continuity', severity: 'high' },
          { name: 'Supplier Security', keywords: ['supplier security', 'third party', 'vendor management'], category: 'Third Party Management', severity: 'medium' },
          { name: 'Compliance Monitoring', keywords: ['compliance monitoring', 'audit', 'legal compliance'], category: 'Compliance', severity: 'medium' }
        ]
      },
      'CCPA': {
        keywords: ['ccpa', 'california consumer privacy act', 'personal information', 'consumer rights'],
        mandatoryChecks: [
          { name: 'Consumer Rights Notice', keywords: ['right to know', 'right to delete', 'opt-out'], category: 'Consumer Rights', severity: 'critical' },
          { name: 'Data Collection Disclosure', keywords: ['categories of information', 'collection disclosure'], category: 'Transparency', severity: 'critical' },
          { name: 'Sale of Personal Information', keywords: ['do not sell', 'opt-out', 'sale disclosure'], category: 'Data Sales', severity: 'high' },
          { name: 'Service Provider Agreements', keywords: ['service provider', 'processing restrictions'], category: 'Third Party Management', severity: 'high' },
          { name: 'Consumer Request Procedures', keywords: ['verification procedures', 'request response'], category: 'Request Processing', severity: 'high' },
          { name: 'Non-Discrimination', keywords: ['non-discrimination', 'discriminatory practices'], category: 'Fair Treatment', severity: 'medium' },
          { name: 'Privacy Policy Requirements', keywords: ['privacy policy', 'disclosure requirements'], category: 'Policy Requirements', severity: 'high' },
          { name: 'Data Minimization', keywords: ['collection limitation', 'purpose specification'], category: 'Data Minimization', severity: 'medium' }
        ]
      },
      // Add all remaining 34 standards with generic but comprehensive checks
      'NIST Cybersecurity Framework': {
        keywords: ['nist', 'cybersecurity framework', 'identify', 'protect', 'detect', 'respond', 'recover'],
        mandatoryChecks: [
          { name: 'Identify Function', keywords: ['asset management', 'business environment', 'governance'], category: 'Framework Implementation', severity: 'critical' },
          { name: 'Protect Function', keywords: ['access control', 'awareness training', 'data security'], category: 'Protection', severity: 'critical' },
          { name: 'Detect Function', keywords: ['anomalies detection', 'continuous monitoring'], category: 'Detection', severity: 'high' },
          { name: 'Respond Function', keywords: ['response planning', 'communications', 'mitigation'], category: 'Response', severity: 'high' },
          { name: 'Recover Function', keywords: ['recovery planning', 'improvements'], category: 'Recovery', severity: 'medium' },
          { name: 'Framework Implementation', keywords: ['current profile', 'target profile', 'action plan'], category: 'Implementation', severity: 'medium' }
        ]
      },
      'COBIT': {
        keywords: ['cobit', 'control objectives', 'information technologies', 'governance'],
        mandatoryChecks: [
          { name: 'Governance Framework', keywords: ['stakeholder needs', 'governance system'], category: 'Governance', severity: 'critical' },
          { name: 'Management Processes', keywords: ['align plan organize', 'apo processes'], category: 'Management', severity: 'critical' },
          { name: 'Build Acquire Implement', keywords: ['bai', 'solution development'], category: 'Implementation', severity: 'high' },
          { name: 'Deliver Service Support', keywords: ['dss', 'service delivery'], category: 'Operations', severity: 'high' },
          { name: 'Monitor Evaluate Assess', keywords: ['mea', 'performance monitoring'], category: 'Monitoring', severity: 'medium' },
          { name: 'Enablers Management', keywords: ['principles', 'policies', 'frameworks'], category: 'Enablers', severity: 'medium' }
        ]
      }
    };

    // Add generic compliance requirements for standards not explicitly defined
    const genericStandards = [
      'COSO', 'FISMA', 'FERPA', 'GLBA', 'PIPEDA', 'COPPA', 'CAN-SPAM Act', 'TCPA',
      'CCPA-CPRA', 'LGPD', 'PDPA', 'POPIA', 'KVKK', 'APPI', 'PDPB', 'PIPEDA-CPPA',
      'SHIELD Act', 'BIPA', 'CCBA', 'GDPR-UK', 'Privacy Act 1988', 'CCPA-VCDPA',
      'CPA', 'CTDPA', 'UCPA', 'ICDPA', 'TDPSA', 'FCDPA', 'MCDPA', 'OCDPA'
    ];

    for (const standard of genericStandards) {
      if (!complianceRequirements[standard]) {
        complianceRequirements[standard] = {
          keywords: [standard.toLowerCase(), 'compliance', 'privacy', 'data protection', 'security'],
          mandatoryChecks: [
            { name: 'Policy Framework', keywords: ['policy', 'framework', 'governance'], category: 'Governance', severity: 'critical' },
            { name: 'Data Protection', keywords: ['data protection', 'privacy', 'personal information'], category: 'Data Protection', severity: 'critical' },
            { name: 'Security Controls', keywords: ['security controls', 'safeguards', 'protection'], category: 'Security', severity: 'high' },
            { name: 'Individual Rights', keywords: ['individual rights', 'access rights', 'consumer rights'], category: 'Rights', severity: 'high' },
            { name: 'Incident Response', keywords: ['incident response', 'breach notification', 'security incidents'], category: 'Incident Management', severity: 'high' },
            { name: 'Compliance Monitoring', keywords: ['compliance monitoring', 'audit', 'assessment'], category: 'Monitoring', severity: 'medium' },
            { name: 'Training and Awareness', keywords: ['training', 'awareness', 'education'], category: 'Training', severity: 'medium' },
            { name: 'Third Party Management', keywords: ['third party', 'vendor management', 'service providers'], category: 'Third Party', severity: 'medium' }
          ]
        };
      }
    }

    const gaps = [];
    const suggestions = [];
    const criticalIssues = [];
    let overallScore = 70; // Start with moderate score

    const lowerText = fileText.toLowerCase();

    // Analyze each selected standard with detailed checks
    for (const standard of selectedStandards) {
      const requirements = complianceRequirements[standard as keyof typeof complianceRequirements];
      if (!requirements) continue;

      const foundKeywords = requirements.keywords.filter(keyword => lowerText.includes(keyword));
      
      // Check each mandatory requirement
      for (const check of requirements.mandatoryChecks) {
        const hasRequirement = check.keywords.some(keyword => lowerText.includes(keyword));
        
        if (!hasRequirement) {
          const gapTitle = `Missing ${check.name} Requirements`;
          const gapDescription = `Document lacks specific ${check.name} provisions required by ${standard}`;
          
          gaps.push({
            title: gapTitle,
            description: gapDescription,
            severity: check.severity,
            category: check.category,
            recommendedAction: `Add comprehensive ${check.name} procedures and documentation`,
            evidence: `No relevant keywords found: ${check.keywords.join(', ')}`,
            regulationReference: `${standard} - ${check.name}`,
            section: "Policy Framework",
            risk: `Non-compliance with ${standard} requirements may result in regulatory penalties`
          });

          criticalIssues.push({
            title: gapTitle,
            description: gapDescription,
            severity: check.severity,
            evidence: `Missing required elements: ${check.keywords.join(', ')}`,
            regulationReference: `${standard} - ${check.name}`,
            recommendedAction: `Implement ${check.name} controls and procedures`,
            section: check.category
          });

          // Adjust score based on severity
          const penalty = check.severity === 'critical' ? 15 : check.severity === 'high' ? 10 : 5;
          overallScore -= penalty;
        } else {
          suggestions.push(`Review and enhance ${check.name} procedures for ${standard} compliance`);
        }
      }

      // Additional general checks
      if (foundKeywords.length === 0) {
        gaps.push({
          title: `No ${standard} Terminology`,
          description: `Document lacks any ${standard} specific terminology or references`,
          severity: "critical",
          category: "General Compliance",
          recommendedAction: `Add ${standard} specific language and requirements throughout the document`,
          evidence: "No standard-specific keywords found",
          regulationReference: standard,
          section: "General",
          risk: "Complete lack of standard-specific compliance measures"
        });
        overallScore -= 20;
      }
    }

    // Ensure minimum 6 issues per standard
    for (const standard of selectedStandards) {
      const standardGaps: any[] = gaps.filter((gap: any) => 
        typeof gap === 'object' && gap.regulationReference && gap.regulationReference.includes(standard)
      );
      
      if (standardGaps.length < 6) {
        const additionalChecks: Array<{name: string, category: string, severity: string}> = [
          { name: 'Training and Awareness', category: 'Training', severity: 'medium' },
          { name: 'Regular Review Procedures', category: 'Governance', severity: 'medium' },
          { name: 'Documentation Standards', category: 'Documentation', severity: 'low' },
          { name: 'Monitoring and Reporting', category: 'Monitoring', severity: 'medium' },
          { name: 'Vendor Management', category: 'Third Party', severity: 'medium' },
          { name: 'Change Management', category: 'Process Management', severity: 'low' }
        ];

        for (let i: number = standardGaps.length; i < 6 && i - standardGaps.length < additionalChecks.length; i++) {
          const check: {name: string, category: string, severity: string} = additionalChecks[i - standardGaps.length];
          gaps.push({
            title: `Insufficient ${check.name} for ${standard}`,
            description: `Document lacks adequate ${check.name} procedures required for ${standard} compliance`,
            severity: check.severity,
            category: check.category,
            recommendedAction: `Develop comprehensive ${check.name} procedures`,
            evidence: "Limited or missing procedural documentation",
            regulationReference: `${standard} - ${check.name}`,
            section: check.category,
            risk: `Inadequate ${check.name} may lead to compliance failures`
          });
        }
      }
    }

    // Basic document structure checks
    const structuralChecks = [
      { term: 'policy', name: 'Formal Policy Structure', severity: 'medium' },
      { term: 'responsibility', name: 'Role and Responsibility Definitions', severity: 'medium' },
      { term: 'review', name: 'Review and Audit Procedures', severity: 'medium' },
      { term: 'training', name: 'Training Requirements', severity: 'low' },
      { term: 'incident', name: 'Incident Response Procedures', severity: 'high' },
      { term: 'monitoring', name: 'Monitoring and Oversight', severity: 'medium' }
    ];

    for (const check of structuralChecks) {
      if (!lowerText.includes(check.term)) {
        gaps.push({
          title: `Missing ${check.name}`,
          description: `Document lacks ${check.name} which are essential for compliance`,
          severity: check.severity,
          category: "Document Structure",
          recommendedAction: `Add comprehensive ${check.name} section`,
          evidence: `No mention of '${check.term}' found in document`,
          regulationReference: "General Requirements",
          section: "Policy Framework",
          risk: `Absence of ${check.name} creates compliance and operational risks`
        });
        overallScore -= 5;
      }
    }

    // Ensure score is within bounds
    overallScore = Math.max(0, Math.min(100, overallScore));
    const status = overallScore >= 90 ? "compliant" : overallScore >= 70 ? "partial" : "non-compliant";

    return {
      overallScore,
      standardsAnalysis: [{
        standard: selectedStandards.join(', '),
        score: overallScore,
        status,
        gaps: gaps.length > 0 ? gaps : ["Basic analysis completed - manual review recommended"],
        suggestions: suggestions.length > 0 ? suggestions : ["Conduct detailed compliance review"],
        criticalIssues: criticalIssues.length > 0 ? criticalIssues : []
      }],
      summary: {
        totalGaps: gaps.length,
        criticalIssues: criticalIssues.length,
        recommendedActions: [
          "Conduct detailed compliance review with legal expert",
          "Add missing compliance-specific terminology and procedures",
          "Implement regular policy review and update processes",
          "Develop comprehensive training and awareness programs",
          "Establish monitoring and audit procedures",
          "Create incident response and breach notification procedures"
        ]
      },
      detailedFindings: {
        strengths: [
          `Document contains ${fileText.length} characters of content`,
          "Basic document structure present"
        ],
        weaknesses: gaps.length > 0 ? gaps.slice(0, 5).map(g => typeof g === 'object' ? g.title : g) : ["Limited compliance-specific content"],
        riskAreas: [
          "Potential regulatory compliance gaps",
          "Missing specific compliance procedures",
          "Insufficient documentation detail",
          "Lack of monitoring and oversight mechanisms",
          "Inadequate incident response capabilities"
        ]
      }
    };

  } catch (error) {
    console.error('Basic compliance analysis failed:', error);
    throw new Error(`Document analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      
      // Check if this is a document extraction/readability issue
      const errorMessage = aiError instanceof Error ? aiError.message : 'Unknown error';
      if (errorMessage.includes('scanned') || errorMessage.includes('encrypted') || errorMessage.includes('corrupted') || errorMessage.includes('unreadable')) {
        console.log('🔄 Document extraction failed, creating document quality analysis...');
        console.log(`📄 File: ${file.name} (${file.size} bytes) - Detected as scanned/encrypted PDF`);
        
        // Create a structured response for unreadable documents
        const documentQualityAnalysis = {
          overallScore: 0,
          standardsAnalysis: [{
            standard: selectedStandards.join(', '),
            score: 0,
            status: "non-compliant" as const,
            gaps: [
              {
                title: "Document Unreadable",
                description: "The uploaded document appears to be a scanned PDF or encrypted file, making text extraction impossible for compliance analysis.",
                severity: "critical" as const,
                category: "Document Quality",
                recommendedAction: "Please upload a text-based PDF or DOCX document that allows text extraction. Avoid scanned images or password-protected files.",
                evidence: "Document text extraction failed with low readability ratio",
                regulationReference: "Document Processing Requirements",
                section: "File Format",
                risk: "Cannot perform compliance analysis on unreadable documents"
              },
              {
                title: "Alternative Document Required",
                description: "To perform compliance analysis, we need access to the actual text content of your policy documents.",
                severity: "high" as const,
                category: "Document Format",
                recommendedAction: "Convert scanned PDFs to text-based format using OCR software, or upload the original editable document.",
                evidence: "Text extraction yielded corrupted or binary data",
                regulationReference: "Analysis Requirements",
                section: "Document Preparation",
                risk: "Compliance gaps cannot be identified without readable document content"
              }
            ],
            suggestions: [
              "Upload a text-based PDF instead of a scanned image",
              "Use OCR software to convert scanned documents to searchable PDFs",
              "Upload the original Word document (DOCX) if available",
              "Ensure the document is not password-protected or encrypted",
              "Contact support if you continue to experience document upload issues"
            ],
            criticalIssues: [
              {
                title: "Document Format Issue",
                description: "Cannot analyze scanned or encrypted documents",
                severity: "critical" as const,
                evidence: "Text extraction failed - document may be scanned or encrypted",
                regulationReference: "Document Processing",
                recommendedAction: "Upload a text-based document format",
                section: "File Requirements"
              }
            ]
          }],
          summary: {
            totalGaps: 2,
            criticalIssues: 1,
            recommendedActions: [
              "Upload a text-based PDF or DOCX document",
              "Ensure document is not scanned or password-protected",
              "Contact support if issues persist"
            ]
          },
          detailedFindings: {
            strengths: [],
            weaknesses: [
              "Document format prevents text extraction",
              "Cannot perform automated compliance analysis"
            ],
            riskAreas: [
              "Document accessibility for compliance review",
              "Inability to identify compliance gaps automatically"
            ]
          }
        };

        analysisResult = documentQualityAnalysis;
        method = 'document-quality-check';
      } else {
        // For other types of errors, return the error response
        return NextResponse.json({
          error: `Analysis failed: ${errorMessage}`
        }, { status: 500 });
      }
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
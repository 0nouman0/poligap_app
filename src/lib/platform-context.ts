/**
 * Platform Context System for RAG-like Chat Enhancement
 * 
 * Provides intelligent context injection for platform-specific queries
 * to prevent AI hallucination and ensure accurate responses.
 */

import fs from 'fs';
import path from 'path';

// Cached platform documentation
let platformDocsCache: string | null = null;

/**
 * Load platform documentation from docs/platform.md
 * Cached after first load for performance
 */
function loadPlatformDocs(): string {
  if (platformDocsCache) {
    return platformDocsCache;
  }

  try {
    const docsPath = path.join(process.cwd(), 'docs', 'platform.md');
    platformDocsCache = fs.readFileSync(docsPath, 'utf-8');
    console.log('✅ Platform documentation loaded and cached');
    return platformDocsCache;
  } catch (error) {
    console.error('❌ Failed to load platform documentation:', error);
    return '';
  }
}

/**
 * Platform-related keywords for query detection
 */
const PLATFORM_KEYWORDS = {
  // Platform identifiers
  platform: ['poligap', 'polygap', 'platform', 'this app', 'this application', 'this system'],
  
  // Core features
  features: [
    'contract review', 'contract analysis', 'analyze contract',
    'compliance analysis', 'compliance check', 'compliance score',
    'document extraction', 'extract document', 'upload document',
    'audit log', 'audit trail', 'rulebase', 'rule base',
    'policy generator', 'copyright detector', 'idea analyzer',
  ],
  
  // Standards
  standards: ['gdpr', 'hipaa', 'soc 2', 'iso 27001', 'pci dss', 'ccpa'],
  
  // Technical
  technical: [
    'portkey', 'supabase', 'ai model', 'gpt-4o', 'claude', 'llama',
    'chat assistant', 'streaming', 'api', 'endpoint',
  ],
  
  // Actions
  actions: [
    'how to', 'how do i', 'how can i', 'what is', 'what are',
    'where is', 'where can i', 'can i', 'does it support',
    'upload', 'analyze', 'review', 'check', 'generate',
  ],
  
  // Attributes
  attributes: [
    'feature', 'capability', 'support', 'available',
    'limitation', 'maximum', 'file size', 'format',
    'rate limit', 'supported format',
  ],
};

/**
 * Detect if a query is about the Poligap platform
 */
export function isPlatformQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  // Direct platform mention
  if (PLATFORM_KEYWORDS.platform.some(keyword => lowerQuery.includes(keyword))) {
    return true;
  }
  
  // Count keyword matches across all categories
  let matchCount = 0;
  
  for (const category of Object.values(PLATFORM_KEYWORDS)) {
    for (const keyword of category) {
      if (lowerQuery.includes(keyword)) {
        matchCount++;
      }
    }
  }
  
  // Require at least 2 keyword matches for confidence
  return matchCount >= 2;
}

/**
 * Extract relevant sections from platform documentation
 */
function extractRelevantSections(query: string, fullDocs: string): string {
  const lowerQuery = query.toLowerCase();
  const sections = fullDocs.split(/\n## /);
  
  // Always include overview (first section)
  const relevantSections: string[] = [sections[0]];
  
  // Section keyword mapping for intelligent extraction
  const sectionMap: Record<string, string[]> = {
    'Contract Review': ['contract', 'review', 'nda', 'sla', 'agreement', 'analyze contract'],
    'Compliance Analysis': ['compliance', 'gdpr', 'hipaa', 'soc', 'iso', 'pci', 'ccpa', 'standard', 'policy'],
    'AI Chat Assistant': ['chat', 'conversation', 'assistant', 'model', 'gpt', 'claude', 'llama', 'ask'],
    'Document Extraction': ['extract', 'upload', 'document', 'pdf', 'docx', 'file', 'format'],
    'Audit Logs': ['audit', 'log', 'history', 'track', 'activity'],
    'Additional Features': ['policy generator', 'copyright', 'idea analyzer'],
    'Technical Stack': ['technical', 'architecture', 'technology', 'stack', 'backend', 'frontend'],
    'API Endpoints': ['api', 'endpoint', 'integration', 'route'],
    'File Size and Format Limits': ['file size', 'format', 'limit', 'maximum', 'supported format'],
    'Rate Limits': ['rate limit', 'request limit', 'quota'],
    'Configuration': ['config', 'setup', 'environment', 'api key', 'variable'],
    'User Workflows': ['workflow', 'how to', 'step', 'process'],
    'Best Practices': ['best practice', 'recommendation', 'should'],
    'Known Limitations': ['limitation', 'limit', 'not support', 'cannot'],
    'Security & Privacy': ['security', 'privacy', 'encryption', 'secure'],
    'Support & Help': ['help', 'support', 'question', 'common question'],
  };
  
  // Find matching sections
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const sectionTitle = section.split('\n')[0].trim();
    
    // Check if section keywords match query
    const keywords = sectionMap[sectionTitle] || [];
    const isRelevant = keywords.some(keyword => lowerQuery.includes(keyword)) ||
                      lowerQuery.includes(sectionTitle.toLowerCase());
    
    if (isRelevant) {
      relevantSections.push('## ' + section);
    }
  }
  
  // If no specific matches, include core features
  if (relevantSections.length === 1) {
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];
      const sectionTitle = section.split('\n')[0].trim();
      if (sectionTitle.includes('Core Features') || sectionTitle.includes('Platform Overview')) {
        relevantSections.push('## ' + section);
      }
    }
  }
  
  // Combine and limit size (max ~4000 tokens / 16000 chars)
  const combined = relevantSections.join('\n\n');
  return combined.length > 16000 
    ? combined.substring(0, 16000) + '\n\n[Context truncated for length...]'
    : combined;
}

/**
 * Create enhanced system prompt with platform context
 */
function createContextPrompt(query: string, context: string): string {
  return `You are an AI assistant for the Poligap platform. You have access to the official platform documentation below.

CRITICAL INSTRUCTIONS:
1. Answer questions about Poligap features ONLY using the provided documentation
2. Be specific and accurate - cite exact features, limits, and workflows
3. If information is not in the documentation, say "I don't have that information in the platform documentation"
4. Do NOT make up features, capabilities, or specifications
5. For general questions unrelated to Poligap, you may use your general knowledge

PLATFORM DOCUMENTATION:
${context}

Now answer the user's question based on this documentation. If it's about Poligap, use ONLY the information above.`;
}

/**
 * Get platform context if query is platform-related
 * Returns system prompt with context, or null if not needed
 */
export function getPlatformContext(query: string): string | null {
  try {
    // Check if this is a platform query
    if (!isPlatformQuery(query)) {
      return null;
    }
    
    // Load documentation
    const docs = loadPlatformDocs();
    if (!docs) {
      console.warn('⚠️ Platform documentation not available');
      return null;
    }
    
    // Extract relevant sections
    const relevantContext = extractRelevantSections(query, docs);
    
    // Create enhanced prompt
    const contextPrompt = createContextPrompt(query, relevantContext);
    
    console.log('🎯 Platform query detected - injecting context');
    console.log(`📄 Context size: ${relevantContext.length} characters`);
    
    return contextPrompt;
    
  } catch (error) {
    console.error('❌ Error getting platform context:', error);
    return null;
  }
}

/**
 * Get lightweight platform summary for general awareness
 * Used when full context is not needed
 */
export function getPlatformSummary(): string {
  return `You are an AI assistant for Poligap, an enterprise compliance and contract management platform.

Core capabilities:
- Contract Review & Analysis (NDA, SLA, Employment contracts)
- Compliance Analysis (GDPR, HIPAA, SOC 2, ISO 27001, PCI DSS, CCPA)
- AI Chat with multiple models (GPT-4o, Claude, Llama)
- Document Extraction (PDF, DOCX, TXT - max 20MB)
- Audit Logs and Activity Tracking
- Policy Generator, Copyright Detection, Idea Analysis

If users ask about these features, provide helpful information. For detailed platform questions, you have access to comprehensive documentation.`;
}

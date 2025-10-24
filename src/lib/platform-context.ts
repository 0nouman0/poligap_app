/**
 * Platform Context Utility
 * Provides platform-specific context for AI chat responses
 */

import fs from 'fs';
import path from 'path';

// Cache the platform documentation
let platformContext: string | null = null;

/**
 * Load platform documentation from platform.md
 */
export function loadPlatformContext(): string {
  if (platformContext) {
    return platformContext;
  }

  try {
    const platformMdPath = path.join(process.cwd(), 'docs', 'platform.md');
    platformContext = fs.readFileSync(platformMdPath, 'utf-8');
    console.log('✅ Platform context loaded successfully');
    return platformContext;
  } catch (error) {
    console.error('❌ Failed to load platform context:', error);
    return '';
  }
}

/**
 * Platform-related keywords that indicate user is asking about the platform
 */
const PLATFORM_KEYWORDS = [
  // Platform name
  'poligap', 'polygap', 'platform',
  
  // Features
  'contract review', 'contract analysis', 'contract analyzer',
  'compliance check', 'compliance analysis', 'compliance checker',
  'policy generator', 'policy generation',
  'copyright detector', 'copyright detection',
  'idea analyzer', 'idea analysis',
  'knowledge base',
  'rulebase', 'rule base', 'custom rules',
  'audit log', 'audit trail', 'audit history',
  
  // Functionality
  'how to use', 'how do i', 'how can i',
  'what features', 'what can you do', 'what does this do',
  'navigate to', 'where is', 'where can i find',
  'upload document', 'analyze document', 'extract text',
  'chat assistant', 'ai assistant',
  
  // Technical
  'api endpoint', 'api route',
  'supported format', 'file format', 'file type',
  'model selection', 'ai model', 'llm model',
  
  // Standards
  'gdpr', 'hipaa', 'soc2', 'iso 27001', 'pci dss',
  'compliance standard', 'regulatory standard',
  
  // Workflows
  'workflow', 'process', 'step by step',
  'getting started', 'tutorial', 'guide',
  
  // Troubleshooting
  'error', 'issue', 'problem', 'not working',
  'troubleshoot', 'fix', 'help',
];

/**
 * Determine if the user query is about the platform
 * @param query - User's question
 * @returns true if query is platform-related
 */
export function isPlatformQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  // Check for explicit platform mentions
  if (lowerQuery.includes('this platform') || 
      lowerQuery.includes('your platform') ||
      lowerQuery.includes('this app') ||
      lowerQuery.includes('this application') ||
      lowerQuery.includes('this system')) {
    return true;
  }
  
  // Check for platform keywords
  return PLATFORM_KEYWORDS.some(keyword => lowerQuery.includes(keyword));
}

/**
 * Extract relevant sections from platform context based on query
 * @param query - User's question
 * @param fullContext - Full platform documentation
 * @returns Relevant context sections
 */
export function extractRelevantContext(query: string, fullContext: string): string {
  const lowerQuery = query.toLowerCase();
  const sections: string[] = [];
  
  // Split context into sections (by ## headers)
  const contextSections = fullContext.split(/\n## /);
  
  // Always include overview
  if (contextSections[0]) {
    sections.push(contextSections[0]);
  }
  
  // Extract relevant sections based on query keywords
  contextSections.forEach((section, index) => {
    if (index === 0) return; // Skip overview (already added)
    
    const sectionLower = section.toLowerCase();
    const sectionTitle = section.split('\n')[0].toLowerCase();
    
    // Check if query mentions this section
    if (lowerQuery.includes(sectionTitle) || 
        PLATFORM_KEYWORDS.some(keyword => 
          lowerQuery.includes(keyword) && sectionLower.includes(keyword)
        )) {
      sections.push('## ' + section);
    }
  });
  
  // If no specific sections found, include core features and common use cases
  if (sections.length === 1) {
    contextSections.forEach((section, index) => {
      if (index === 0) return;
      const sectionTitle = section.split('\n')[0].toLowerCase();
      if (sectionTitle.includes('core features') || 
          sectionTitle.includes('common use cases') ||
          sectionTitle.includes('api endpoints')) {
        sections.push('## ' + section);
      }
    });
  }
  
  // Limit context size (max ~8000 characters to leave room for query and response)
  const combinedContext = sections.join('\n\n');
  if (combinedContext.length > 8000) {
    return combinedContext.substring(0, 8000) + '\n\n[... context truncated for length ...]';
  }
  
  return combinedContext;
}

/**
 * Create system message with platform context
 * @param query - User's question
 * @returns System message with relevant context
 */
export function createPlatformSystemMessage(query: string): string {
  const fullContext = loadPlatformContext();
  
  if (!fullContext) {
    return `You are a helpful AI assistant for the Poligap compliance platform. 
Answer questions accurately and concisely. If you don't know something about the platform, say so.`;
  }
  
  const relevantContext = extractRelevantContext(query, fullContext);
  
  return `You are a helpful AI assistant for the Poligap enterprise compliance platform.

IMPORTANT INSTRUCTIONS:
1. Use the platform documentation below to answer questions about Poligap features, workflows, and capabilities
2. Be specific and accurate when referencing platform features
3. If asked about platform functionality, cite the relevant sections from the documentation
4. If the question is NOT about the platform (e.g., general knowledge questions), answer normally without forcing platform context
5. Be concise but comprehensive
6. Use examples from the documentation when helpful

PLATFORM DOCUMENTATION:
${relevantContext}

Now answer the user's question based on this context. If the question is about the platform, use the documentation above. If it's a general question, answer using your general knowledge.`;
}

/**
 * Determine optimal strategy for handling the query
 * @param query - User's question
 * @returns Strategy object with context and model preferences
 */
export function determineQueryStrategy(query: string): {
  isPlatformRelated: boolean;
  useContext: boolean;
  systemMessage: string;
  suggestedModel?: string;
} {
  const isPlatformRelated = isPlatformQuery(query);
  
  if (isPlatformRelated) {
    return {
      isPlatformRelated: true,
      useContext: true,
      systemMessage: createPlatformSystemMessage(query),
      suggestedModel: 'gpt-4o', // Use best model for platform queries
    };
  }
  
  // General query - use standard system message
  return {
    isPlatformRelated: false,
    useContext: false,
    systemMessage: `You are a helpful AI assistant specializing in compliance, legal matters, and contract analysis. 
Provide accurate, professional, and well-structured responses. 
When discussing compliance standards (GDPR, HIPAA, SOC2, ISO 27001, PCI DSS), be specific and cite requirements when possible.`,
  };
}

/**
 * Query Key Factory
 * 
 * Centralized query keys for TanStack Query.
 * This ensures consistency and makes cache invalidation easier.
 * 
 * Pattern: [domain, ...filters/params]
 * Example: ['users', userId] or ['tasks', { status: 'active' }]
 */

export const queryKeys = {
  // User related queries
  user: {
    all: ['users'] as const,
    detail: (userId: string) => [...queryKeys.user.all, userId] as const,
    profile: (userId: string) => [...queryKeys.user.all, userId, 'profile'] as const,
    settings: (userId: string) => [...queryKeys.user.all, userId, 'settings'] as const,
  },

  // Company related queries
  company: {
    all: ['companies'] as const,
    detail: (companyId: string) => [...queryKeys.company.all, companyId] as const,
    users: (companyId: string) => [...queryKeys.company.all, companyId, 'users'] as const,
  },

  // Search related queries
  search: {
    all: ['search'] as const,
    results: (query: string, filters?: Record<string, any>) => 
      [...queryKeys.search.all, 'results', query, filters] as const,
    suggested: ['search', 'suggested'] as const,
    trending: ['search', 'trending'] as const,
    recent: (userId: string) => ['search', 'recent', userId] as const,
  },

  // Tasks related queries
  tasks: {
    all: ['tasks'] as const,
    list: (filters?: { status?: string; priority?: string }) => 
      [...queryKeys.tasks.all, 'list', filters] as const,
    detail: (taskId: string) => [...queryKeys.tasks.all, taskId] as const,
  },

  // Compliance related queries
  compliance: {
    all: ['compliance'] as const,
    checks: ['compliance', 'checks'] as const,
    check: (checkId: string) => [...queryKeys.compliance.checks, checkId] as const,
    history: (userId: string) => ['compliance', 'history', userId] as const,
    analytics: ['compliance', 'analytics'] as const,
  },

  // Analytics related queries
  analytics: {
    all: ['analytics'] as const,
    dashboard: (userId: string, companyId: string, timeRange: string) =>
      [...queryKeys.analytics.all, 'dashboard', userId, companyId, timeRange] as const,
    searches: (timeRange: string) => 
      [...queryKeys.analytics.all, 'searches', timeRange] as const,
    compliance: (timeRange: string) => 
      [...queryKeys.analytics.all, 'compliance', timeRange] as const,
    topSearches: (limit?: number) => 
      [...queryKeys.analytics.all, 'top-searches', limit] as const,
  },

  // Assets related queries
  assets: {
    all: ['assets'] as const,
    list: (filters?: { type?: string; search?: string }) => 
      [...queryKeys.assets.all, 'list', filters] as const,
    detail: (assetId: string) => [...queryKeys.assets.all, assetId] as const,
  },

  // Rulebase related queries
  rulebase: {
    all: ['rulebase'] as const,
    rules: ['rulebase', 'rules'] as const,
    rule: (ruleId: string) => [...queryKeys.rulebase.rules, ruleId] as const,
  },

  // Contract related queries
  contracts: {
    all: ['contracts'] as const,
    list: ['contracts', 'list'] as const,
    detail: (contractId: string) => [...queryKeys.contracts.all, contractId] as const,
    review: (contractId: string) => [...queryKeys.contracts.all, contractId, 'review'] as const,
  },

  // Chat related queries
  chat: {
    all: ['chat'] as const,
    conversations: (userId: string) => ['chat', 'conversations', userId] as const,
    conversation: (conversationId: string) => 
      ['chat', 'conversation', conversationId] as const,
    messages: (conversationId: string) => 
      ['chat', 'messages', conversationId] as const,
    history: (userId: string, companyId?: string) => 
      ['chat', 'history', userId, companyId] as const,
  },

  // Knowledge base related queries
  knowledge: {
    all: ['knowledge'] as const,
    list: ['knowledge', 'list'] as const,
    detail: (itemId: string) => [...queryKeys.knowledge.all, itemId] as const,
    apps: (accountId: string) => ['knowledge', 'apps', accountId] as const,
    files: (appId: string, accountId: string) => 
      ['knowledge', 'files', appId, accountId] as const,
  },

  // Policy related queries
  policy: {
    all: ['policy'] as const,
    generator: ['policy', 'generator'] as const,
    list: ['policy', 'list'] as const,
    detail: (policyId: string) => [...queryKeys.policy.all, policyId] as const,
  },

  // Audit logs
  audit: {
    all: ['audit'] as const,
    logs: (filters?: { userId?: string; action?: string }) => 
      [...queryKeys.audit.all, 'logs', filters] as const,
    detail: (logId: string) => [...queryKeys.audit.all, logId] as const,
  },

  // Flagged issues
  flaggedIssues: {
    all: ['flagged-issues'] as const,
    list: (filters?: { status?: string; userId?: string }) => 
      [...queryKeys.flaggedIssues.all, 'list', filters] as const,
    detail: (issueId: string) => [...queryKeys.flaggedIssues.all, issueId] as const,
  },
} as const;

// Type helper to extract query key type
export type QueryKeys = typeof queryKeys;

// Helper to invalidate all queries for a domain
export const invalidateQueries = {
  user: () => queryKeys.user.all,
  company: () => queryKeys.company.all,
  search: () => queryKeys.search.all,
  tasks: () => queryKeys.tasks.all,
  compliance: () => queryKeys.compliance.all,
  analytics: () => queryKeys.analytics.all,
  assets: () => queryKeys.assets.all,
  rulebase: () => queryKeys.rulebase.all,
  contracts: () => queryKeys.contracts.all,
  chat: () => queryKeys.chat.all,
  knowledge: () => queryKeys.knowledge.all,
  policy: () => queryKeys.policy.all,
  audit: () => queryKeys.audit.all,
  flaggedIssues: () => queryKeys.flaggedIssues.all,
} as const;

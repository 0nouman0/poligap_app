import { create } from 'zustand';

export interface Rule {
  _id: string;
  id: string;
  name: string;
  description: string;
  tags: string[];
  sourceType: 'manual' | 'file' | 'api';
  fileName?: string;
  fileContent?: string;
  active: boolean;
  updatedAt: string;
  createdAt?: string;
  userId?: string;
}

interface RulebaseState {
  // Data
  rules: Rule[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  
  // Cache settings
  cacheTimeout: number; // 5 minutes default
  
  // Actions
  fetchRules: (force?: boolean) => Promise<void>;
  addRule: (rule: Rule) => void;
  updateRule: (id: string, updates: Partial<Rule>) => void;
  deleteRule: (id: string) => void;
  clearRules: () => void;
  isCacheValid: () => boolean;
  
  // Filters
  getRulesByTag: (tag: string) => Rule[];
  getActiveRules: () => Rule[];
  searchRules: (query: string) => Rule[];
}

export const useRulebaseStore = create<RulebaseState>((set, get) => ({
  // Initial state
  rules: [],
  isLoading: false,
  error: null,
  lastFetched: null,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes

  // Check if cache is still valid
  isCacheValid: () => {
    const { lastFetched, cacheTimeout } = get();
    if (!lastFetched) return false;
    return Date.now() - lastFetched < cacheTimeout;
  },

  // Fetch rules from API
  fetchRules: async (force = false) => {
    const { isCacheValid, rules } = get();
    
    // Return cached data if valid and not forcing refresh
    if (!force && isCacheValid() && rules.length > 0) {
      console.log('✅ Using cached rulebase');
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      console.log('🔄 Fetching rulebase from API...');
      const response = await fetch('/api/rulebase');
      
      if (!response.ok) {
        throw new Error('Failed to fetch rulebase');
      }
      
      const data = await response.json();
      
      if (Array.isArray(data.rules)) {
        set({
          rules: data.rules,
          isLoading: false,
          error: null,
          lastFetched: Date.now()
        });
        console.log(`✅ Cached ${data.rules.length} rules`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch rulebase';
      set({ isLoading: false, error: errorMessage });
      console.error('❌ Error fetching rulebase:', error);
    }
  },

  // Add a new rule to the cache
  addRule: (rule: Rule) => {
    set((state) => ({
      rules: [rule, ...state.rules]
    }));
  },

  // Update an existing rule in the cache
  updateRule: (id: string, updates: Partial<Rule>) => {
    set((state) => ({
      rules: state.rules.map(rule =>
        rule._id === id || rule.id === id ? { ...rule, ...updates } : rule
      )
    }));
  },

  // Delete a rule from the cache (soft delete)
  deleteRule: (id: string) => {
    set((state) => ({
      rules: state.rules.map(rule =>
        rule._id === id || rule.id === id ? { ...rule, active: false } : rule
      )
    }));
  },

  // Clear cache
  clearRules: () => {
    set({ rules: [], lastFetched: null, error: null });
  },

  // Filter rules by tag
  getRulesByTag: (tag: string) => {
    const { rules } = get();
    return rules.filter(rule => rule.tags?.includes(tag));
  },

  // Get only active rules
  getActiveRules: () => {
    const { rules } = get();
    return rules.filter(rule => rule.active !== false);
  },

  // Search rules by name or description
  searchRules: (query: string) => {
    const { rules } = get();
    const lowerQuery = query.toLowerCase();
    return rules.filter(rule =>
      rule.name?.toLowerCase().includes(lowerQuery) ||
      rule.description?.toLowerCase().includes(lowerQuery)
    );
  }
}));

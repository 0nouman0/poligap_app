import { create } from 'zustand';
import { cacheManager } from '@/lib/cache-manager';

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
    const cacheKey = 'all-rules';
    
    // Try to get from cache first
    if (!force) {
      const cached = cacheManager.get<Rule[]>(cacheKey, { prefix: 'rulebase' });
      if (cached) {
        console.log('✅ Using cached rulebase from cache manager');
        set({ rules: cached, isLoading: false, error: null, lastFetched: Date.now() });
        return;
      }
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
        // Cache the results with 10 minute TTL (rulebase changes less frequently)
        cacheManager.set(cacheKey, data.rules, {
          ttl: 10 * 60 * 1000,
          prefix: 'rulebase'
        });
        
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
    set((state) => {
      const newRules = [rule, ...state.rules];
      // Update cache
      cacheManager.set('all-rules', newRules, {
        ttl: 10 * 60 * 1000,
        prefix: 'rulebase'
      });
      return { rules: newRules };
    });
  },

  // Update an existing rule in the cache
  updateRule: (id: string, updates: Partial<Rule>) => {
    set((state) => {
      const updatedRules = state.rules.map(rule =>
        rule._id === id || rule.id === id ? { ...rule, ...updates } : rule
      );
      // Update cache
      cacheManager.set('all-rules', updatedRules, {
        ttl: 10 * 60 * 1000,
        prefix: 'rulebase'
      });
      return { rules: updatedRules };
    });
  },

  // Delete a rule from the cache (hard delete - remove from list)
  deleteRule: (id: string) => {
    set((state) => {
      const filteredRules = state.rules.filter(rule => rule._id !== id && rule.id !== id);
      // Update cache
      cacheManager.set('all-rules', filteredRules, {
        ttl: 10 * 60 * 1000,
        prefix: 'rulebase'
      });
      return { rules: filteredRules };
    });
  },

  // Clear cache
  clearRules: () => {
    cacheManager.clearPrefix('rulebase');
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

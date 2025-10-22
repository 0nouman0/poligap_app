import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { formatGlobalDate } from '@/utils/date.util';

export interface ActivityItem {
  id: string;
  type: 'compliance-check' | 'contract-review' | 'policy-generator' | 'rules' | 'chat' | 'search' | 'knowledge-base' | 'history' | 'profile' | 'users';
  action: string; // Human-readable action description
  details: {
    fileName?: string;
    standards?: string[];
    score?: number;
    status?: string;
    industry?: string;
    policyType?: string;
    searchQuery?: string;
    ruleName?: string;
    chatMessage?: string;
    pageVisited?: string;
  };
  timestamp: string;
  userId?: string;
}

interface ActivityState {
  activities: ActivityItem[];
  addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
  getRecentActivities: (limit?: number) => ActivityItem[];
  clearActivities: () => void;
  getActivitiesByType: (type: ActivityItem['type']) => ActivityItem[];
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      activities: [],

      addActivity: (activity) => {
        const newActivity: ActivityItem = {
          ...activity,
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          activities: [newActivity, ...state.activities].slice(0, 100) // Keep only last 100 activities
        }));
      },

      getRecentActivities: (limit = 10) => {
        return get().activities.slice(0, limit);
      },

      clearActivities: () => {
        set({ activities: [] });
      },

      getActivitiesByType: (type) => {
        return get().activities.filter(activity => activity.type === type);
      },
    }),
    {
      name: 'user-activity-store',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return {
            activities: persistedState?.activities || [],
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        activities: state.activities,
      }),
    }
  )
);

// Helper functions to generate activity descriptions
export const ActivityHelpers = {
  complianceCheck: (fileName: string, standards: string[], score?: number, status?: string) => {
    const standardsList = standards.length > 2 
      ? `${standards.slice(0, 2).join(', ')} and ${standards.length - 2} more`
      : standards.join(', ');
    
    const scoreText = score ? ` (${score}% ${status || 'compliance'})` : '';
    return `Analyzed "${fileName}" for ${standardsList} compliance${scoreText}`;
  },

  contractReview: (fileName: string, template?: string, score?: number) => {
    const templateText = template ? ` using ${template} template` : '';
    const scoreText = score ? ` (${score}% compliant)` : '';
    return `Reviewed contract "${fileName}"${templateText}${scoreText}`;
  },

  policyGenerator: (policyType: string, industry?: string, frameworks?: string[]) => {
    const industryText = industry ? ` for ${industry} industry` : '';
    const frameworkText = frameworks?.length ? ` with ${frameworks.join(', ')} frameworks` : '';
    return `Generated ${policyType}${industryText}${frameworkText}`;
  },

  rulesManagement: (action: 'created' | 'updated' | 'deleted', ruleName: string) => {
    return `${action.charAt(0).toUpperCase() + action.slice(1)} rule "${ruleName}"`;
  },

  search: (query: string, resultsCount?: number) => {
    const countText = resultsCount !== undefined ? ` (${resultsCount} results)` : '';
    return `Searched for "${query}"${countText}`;
  },

  chat: (message: string) => {
    const truncated = message.length > 50 ? `${message.substring(0, 50)}...` : message;
    return `Asked: "${truncated}"`;
  },

  knowledgeBase: (action: 'viewed' | 'uploaded' | 'synced', fileName?: string, integration?: string) => {
    if (action === 'viewed' && fileName) {
      return `Viewed document "${fileName}" in knowledge base`;
    }
    if (action === 'uploaded' && fileName) {
      return `Uploaded "${fileName}" to knowledge base`;
    }
    if (action === 'synced' && integration) {
      return `Synced ${integration} integration`;
    }
    return `Accessed knowledge base`;
  },

  historyView: (fileName: string, type: 'compliance' | 'contract' | 'policy') => {
    return `Viewed ${type} analysis history for "${fileName}"`;
  },

  pageVisit: (pageName: string) => {
    const pageNames: Record<string, string> = {
      'dashboard': 'Dashboard',
      'home': 'Home Page',
      'compliance-check': 'Compliance Check',
      'contract-review': 'Contract Review',
      'policy-generator': 'Policy Generator',
      'rulebase': 'Rules Management',
      'rules': 'Rules Management',
      'ai-agents': 'AI Agents',
      'chat': 'Chat with AI',
      'search': 'Search',
      'knowledge': 'Knowledge Base',
      'history': 'History & Audit Logs',
      'profile': 'Profile Settings',
      'users': 'User Management',
      'upload-assets': 'Asset Upload',
      'how-to-use': 'Help & Documentation',
    };
    return `Visited ${pageNames[pageName] || pageName}`;
  }
};

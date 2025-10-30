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
  removeActivitiesByType: (types: ActivityItem['type'][]) => void;
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

        set((state) => {
          // Check for duplicate activities within the last 30 seconds
          const now = new Date().getTime();
          const recentDuplicate = state.activities.find(existing => {
            const existingTime = new Date(existing.timestamp).getTime();
            const timeDiff = now - existingTime;
            return (
              timeDiff < 30000 && // Within 30 seconds
              existing.type === newActivity.type &&
              existing.action === newActivity.action &&
              existing.details.fileName === newActivity.details.fileName
            );
          });

          // If duplicate found, don't add the new activity
          if (recentDuplicate) {
            console.log('Duplicate activity prevented:', newActivity.action);
            return state;
          }

          return {
            activities: [newActivity, ...state.activities].slice(0, 100) // Keep only last 100 activities
          };
        });
      },

      getRecentActivities: (limit = 10) => {
        return get().activities.slice(0, limit);
      },

      clearActivities: () => {
        set({ activities: [] });
      },

      removeActivitiesByType: (types: ActivityItem['type'][]) => {
        set((state) => ({
          activities: state.activities.filter(a => !types.includes(a.type))
        }));
      },

      getActivitiesByType: (type) => {
        return get().activities.filter(activity => activity.type === type);
      },
    }),
    {
      name: 'user-activity-store',
      // bump version so we can run a one-time cleanup of noisy "Visited ..." entries
      version: 2,
      migrate: (persistedState: any, version: number) => {
        // If migrating from version 0 or 1, filter out page-visit entries which were
        // previously recorded as noisy "Visited ..." actions. We detect those by the
        // action string starting with 'Visited ' or by presence of details.pageVisited.
        if (version === 0 || version === 1) {
          // persistedState can have different shapes depending on zustand/persist version:
          // - { activities: [...] }
          // - { state: { activities: [...] }, ... }
          const rawActivities: any[] = persistedState?.state?.activities ?? persistedState?.activities ?? [];
          const cleaned = rawActivities.filter((a) => {
            if (!a) return false;
            const action: string = a.action || '';
            const hasPageVisited = !!(a.details && a.details.pageVisited);
            // drop entries that look like page visits
            if (action.startsWith('Visited ') || hasPageVisited) return false;
            return true;
          });

          // Preserve original persisted shape when returning
          if (persistedState?.state) {
            return {
              ...persistedState,
              state: {
                ...persistedState.state,
                activities: cleaned,
              },
            };
          }

          return {
            ...persistedState,
            activities: cleaned,
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
    // Removed page visit helper to prevent creation of noisy "Visited ..." activities.
    // This function intentionally returns an empty string to avoid producing activity text.
    return '';
  }
};

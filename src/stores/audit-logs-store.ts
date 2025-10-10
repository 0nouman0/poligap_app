import { create } from 'zustand';

export interface AuditLog {
  _id: string;
  id: string;
  fileName: string;
  standards: string[];
  score: number;
  status: 'compliant' | 'non-compliant' | 'partial';
  gapsCount: number;
  analysisDate: string;
  fileSize: number;
  analysisMethod?: string;
  userId: string;
  sessionId?: string;
  snapshot?: {
    gaps?: any[];
    suggestions?: string[];
    content?: string;
    inputs?: any;
  };
}

interface AuditLogsState {
  // Data
  logs: AuditLog[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  
  // Cache settings
  cacheTimeout: number; // 5 minutes default
  
  // Actions
  fetchLogs: (userId: string, force?: boolean) => Promise<void>;
  addLog: (log: AuditLog) => void;
  clearLogs: () => void;
  isCacheValid: () => boolean;
  
  // Filters (computed)
  getLogsByMethod: (method: string) => AuditLog[];
  getLogsByStandard: (standard: string) => AuditLog[];
  getLogsByStatus: (status: string) => AuditLog[];
}

export const useAuditLogsStore = create<AuditLogsState>((set, get) => ({
  // Initial state
  logs: [],
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

  // Fetch logs from API
  fetchLogs: async (userId: string, force = false) => {
    const { isCacheValid, logs } = get();
    
    // Return cached data if valid and not forcing refresh
    if (!force && isCacheValid() && logs.length > 0) {
      console.log('✅ Using cached audit logs');
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      console.log('🔄 Fetching audit logs from API...');
      const response = await fetch(`/api/audit-logs?userId=${encodeURIComponent(userId)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch' }));
        throw new Error(errorData.error || 'Failed to fetch audit logs');
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.logs)) {
        set({
          logs: data.logs,
          isLoading: false,
          error: null,
          lastFetched: Date.now()
        });
        console.log(`✅ Cached ${data.logs.length} audit logs`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch audit logs';
      set({ isLoading: false, error: errorMessage });
      console.error('❌ Error fetching audit logs:', error);
    }
  },

  // Add a new log to the cache
  addLog: (log: AuditLog) => {
    set((state) => ({
      logs: [log, ...state.logs]
    }));
  },

  // Clear cache
  clearLogs: () => {
    set({ logs: [], lastFetched: null, error: null });
  },

  // Filter logs by analysis method
  getLogsByMethod: (method: string) => {
    const { logs } = get();
    if (method === 'all') return logs;
    return logs.filter(log => log.analysisMethod === method);
  },

  // Filter logs by standard
  getLogsByStandard: (standard: string) => {
    const { logs } = get();
    return logs.filter(log => log.standards?.includes(standard));
  },

  // Filter logs by status
  getLogsByStatus: (status: string) => {
    const { logs } = get();
    if (status === 'all') return logs;
    return logs.filter(log => log.status === status);
  }
}));

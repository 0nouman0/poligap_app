// Simple in-memory cache for API responses
class SimpleCache {
  protected cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttlSeconds: number = 300) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  delete(key: string) {
    this.cache.delete(key);
  }
}

export const apiCache = new SimpleCache();

// Enhanced cache with localStorage persistence
class PersistentCache extends SimpleCache {
  private storageKey = 'poligap_cache';

  constructor() {
    super();
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([key, value]: [string, any]) => {
          if (value && typeof value === 'object' && value.data && value.timestamp && value.ttl) {
            this.cache.set(key, value);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const data = Object.fromEntries(this.cache.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  set(key: string, data: any, ttlSeconds: number = 300) {
    super.set(key, data, ttlSeconds);
    this.saveToStorage();
  }

  delete(key: string) {
    super.delete(key);
    this.saveToStorage();
  }

  clear() {
    super.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }
}

export const persistentCache = new PersistentCache();

// Cache keys
export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user_profile_${userId}`,
  TASKS: (userId: string) => `tasks_${userId}`,
  RULES: 'rules_list',
  CHAT_HISTORY: (userId: string) => `chat_history_${userId}`,
  AUDIT_LOGS: (userId: string) => `audit_logs_${userId}`,
  COMPANY_DATA: (companyId: string) => `company_${companyId}`,
};

// Cache utilities
export function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cached = persistentCache.get(key);
  if (cached) {
    return Promise.resolve(cached);
  }

  return fetchFn().then(data => {
    persistentCache.set(key, data, ttlSeconds);
    return data;
  });
}

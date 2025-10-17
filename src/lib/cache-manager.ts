/**
 * Client-Side Cache Manager
 * 
 * Provides a comprehensive caching system with:
 * - Time-based expiration (TTL)
 * - Memory-based caching with localStorage fallback
 * - Cache invalidation strategies
 * - Cache statistics and monitoring
 */

export interface CacheOptions {
  /** Time to live in milliseconds */
  ttl?: number;
  /** Whether to use localStorage for persistence */
  persistent?: boolean;
  /** Cache key prefix */
  prefix?: string;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

class CacheManager {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
  };

  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_MEMORY_SIZE = 100; // Maximum entries in memory

  /**
   * Set a value in the cache
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const {
      ttl = this.DEFAULT_TTL,
      persistent = false,
      prefix = 'cache',
    } = options;

    const fullKey = `${prefix}:${key}`;
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    // Store in memory
    this.memoryCache.set(fullKey, entry);

    // Clean up if memory is too large
    if (this.memoryCache.size > this.MAX_MEMORY_SIZE) {
      this.evictOldest();
    }

    // Optionally persist to localStorage
    if (persistent && typeof window !== 'undefined') {
      try {
        localStorage.setItem(fullKey, JSON.stringify(entry));
      } catch (error) {
        console.warn('Failed to persist cache to localStorage:', error);
      }
    }
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string, options: CacheOptions = {}): T | null {
    const { prefix = 'cache', persistent = false } = options;
    const fullKey = `${prefix}:${key}`;

    // Try memory cache first
    let entry = this.memoryCache.get(fullKey) as CacheEntry<T> | undefined;

    // Fallback to localStorage if persistent
    if (!entry && persistent && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(fullKey);
        if (stored) {
          entry = JSON.parse(stored) as CacheEntry<T>;
          // Restore to memory cache
          if (entry) {
            this.memoryCache.set(fullKey, entry);
          }
        }
      } catch (error) {
        console.warn('Failed to retrieve cache from localStorage:', error);
      }
    }

    // Check if entry exists and is not expired
    if (entry) {
      if (Date.now() < entry.expiresAt) {
        this.stats.hits++;
        return entry.data;
      } else {
        // Entry expired, remove it
        this.remove(key, { prefix, persistent });
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Check if a cache entry exists and is valid
   */
  has(key: string, options: CacheOptions = {}): boolean {
    const { prefix = 'cache' } = options;
    const fullKey = `${prefix}:${key}`;
    const entry = this.memoryCache.get(fullKey);
    
    if (entry && Date.now() < entry.expiresAt) {
      return true;
    }
    
    return false;
  }

  /**
   * Remove a specific cache entry
   */
  remove(key: string, options: CacheOptions = {}): void {
    const { prefix = 'cache', persistent = false } = options;
    const fullKey = `${prefix}:${key}`;

    this.memoryCache.delete(fullKey);

    if (persistent && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(fullKey);
      } catch (error) {
        console.warn('Failed to remove cache from localStorage:', error);
      }
    }
  }

  /**
   * Clear all cache entries matching a prefix
   */
  clearPrefix(prefix: string): void {
    // Clear from memory
    const keysToDelete: string[] = [];
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(`${prefix}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.memoryCache.delete(key));

    // Clear from localStorage
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`${prefix}:`)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      } catch (error) {
        console.warn('Failed to clear cache from localStorage:', error);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.memoryCache.clear();
    
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('cache:')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      } catch (error) {
        console.warn('Failed to clear cache from localStorage:', error);
      }
    }

    // Reset stats
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.memoryCache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now >= entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.memoryCache.delete(key));
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Run cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheManager.cleanup();
  }, 5 * 60 * 1000);
}

// Cache utility functions for common use cases
export const cache = {
  /**
   * Cache with default 5 minute TTL
   */
  short: <T>(key: string, value: T) => 
    cacheManager.set(key, value, { ttl: 5 * 60 * 1000 }),

  /**
   * Cache with 30 minute TTL
   */
  medium: <T>(key: string, value: T) => 
    cacheManager.set(key, value, { ttl: 30 * 60 * 1000 }),

  /**
   * Cache with 2 hour TTL
   */
  long: <T>(key: string, value: T) => 
    cacheManager.set(key, value, { ttl: 2 * 60 * 60 * 1000 }),

  /**
   * Persistent cache (survives page refresh)
   */
  persistent: <T>(key: string, value: T, ttl = 24 * 60 * 60 * 1000) =>
    cacheManager.set(key, value, { ttl, persistent: true }),

  /**
   * Get from cache
   */
  get: <T>(key: string, prefix = 'cache'): T | null =>
    cacheManager.get<T>(key, { prefix }),

  /**
   * Get from persistent cache
   */
  getPersistent: <T>(key: string, prefix = 'cache'): T | null =>
    cacheManager.get<T>(key, { prefix, persistent: true }),

  /**
   * Remove from cache
   */
  remove: (key: string, prefix = 'cache') =>
    cacheManager.remove(key, { prefix }),

  /**
   * Clear all cache with prefix
   */
  clearPrefix: (prefix: string) =>
    cacheManager.clearPrefix(prefix),

  /**
   * Check if cached
   */
  has: (key: string, prefix = 'cache') =>
    cacheManager.has(key, { prefix }),
};

export default cacheManager;

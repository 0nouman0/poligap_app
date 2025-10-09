"use client";

import { persistentCache, CACHE_KEYS, withCache } from './cache';

interface ApiOptions {
  useCache?: boolean;
  cacheTTL?: number;
  timeout?: number;
}

class ApiClient {
  private baseURL: string;
  private defaultTimeout: number = 10000;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  private async fetchWithTimeout(
    url: string, 
    options: RequestInit, 
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit & ApiOptions = {}
  ): Promise<T> {
    const {
      useCache = false,
      cacheTTL = 300,
      timeout = this.defaultTimeout,
      ...fetchOptions
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = `api_${endpoint}_${JSON.stringify(fetchOptions.body || {})}`;

    // Check cache first if enabled
    if (useCache && fetchOptions.method !== 'POST' && fetchOptions.method !== 'PUT' && fetchOptions.method !== 'DELETE') {
      const cached = persistentCache.get(cacheKey);
      if (cached) {
        console.log(`📦 Cache hit for ${endpoint}`);
        return cached;
      }
    }

    console.log(`🌐 API call to ${endpoint}`);
    
    try {
      const response = await this.fetchWithTimeout(url, {
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
        ...fetchOptions,
      }, timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache successful responses
      if (useCache && response.ok) {
        persistentCache.set(cacheKey, data, cacheTTL);
      }

      return data;
    } catch (error) {
      console.error(`❌ API error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, options?: ApiOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options?: ApiOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any, options?: ApiOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string, options?: ApiOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Batch requests
  async batch<T>(requests: Array<() => Promise<T>>): Promise<T[]> {
    console.log(`🔄 Batch processing ${requests.length} requests`);
    return Promise.all(requests.map(request => request()));
  }

  // Invalidate cache
  invalidateCache(pattern?: string) {
    if (pattern) {
      // Clear specific cache entries matching pattern
      console.log(`🗑️ Invalidating cache for pattern: ${pattern}`);
      // Implementation would depend on cache structure
    } else {
      persistentCache.clear();
      console.log('🗑️ Cleared all cache');
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Specific API functions with caching
export const userApi = {
  getProfile: (userId: string) =>
    apiClient.get(`/api/users/profile?userId=${userId}`, {
      useCache: true,
      cacheTTL: 600, // 10 minutes
    }),

  getProfileFallback: (userId: string) =>
    apiClient.get(`/api/users/profile-fallback?userId=${userId}`, {
      useCache: true,
      cacheTTL: 300, // 5 minutes
    }),

  updateProfile: (userId: string, profileData: any) =>
    apiClient.put('/api/users/update-profile', {
      userId,
      profileData,
    }),
};

export const auditApi = {
  getLogs: (userId: string) =>
    apiClient.get(`/api/audit-logs?userId=${userId}`, {
      useCache: true,
      cacheTTL: 180, // 3 minutes
    }),
};

export const chatApi = {
  getHistory: (userId: string) =>
    apiClient.get(`/api/chat-history?userId=${userId}`, {
      useCache: true,
      cacheTTL: 120, // 2 minutes
    }),

  createConversation: (data: any) =>
    apiClient.post('/api/ai-chat/create-chat', data),
};

// Preload critical data
export async function preloadCriticalData(userId: string) {
  console.log('🚀 Preloading critical data...');
  
  const preloadPromises = [
    userApi.getProfile(userId).catch(() => userApi.getProfileFallback(userId)),
    auditApi.getLogs(userId).catch(() => null),
    chatApi.getHistory(userId).catch(() => null),
  ];

  try {
    await Promise.allSettled(preloadPromises);
    console.log('✅ Critical data preloaded');
  } catch (error) {
    console.warn('⚠️ Some preload requests failed:', error);
  }
}

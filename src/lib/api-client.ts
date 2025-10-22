"use client";

import { persistentCache, CACHE_KEYS, withCache } from './cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { createGraphQLClient, queries } from '@/lib/supabase/graphql';

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
  async getProfile(userId: string) {
    const cacheKey = `gql_profile_${userId}`;
    const cached = persistentCache.get(cacheKey);
    if (cached) return cached;

    const supabase = createSupabaseClient();
    const { data } = await supabase.auth.getSession();
    const gql = createGraphQLClient(data.session?.access_token);
    const res: any = await gql.request(queries.getProfile, { id: userId });
    const node = res?.profilesCollection?.edges?.[0]?.node || null;
    if (node) persistentCache.set(cacheKey, node, 600);
    return node;
  },


  async updateProfile(userId: string, profileData: any) {
    const supabase = createSupabaseClient();
    const { data } = await supabase.auth.getSession();
    const gql = createGraphQLClient(data.session?.access_token);
    const res: any = await gql.request(queries.updateProfile, {
      id: userId,
      name: profileData?.name,
      mobile: profileData?.mobile,
      dob: profileData?.dob,
      country: profileData?.country,
      designation: profileData?.designation,
      about: profileData?.about,
      profile_image: profileData?.profile_image,
      banner: profileData?.banner,
      company_name: profileData?.company_name,
    });
    // Invalidate cache
    persistentCache.set(`gql_profile_${userId}`, res?.updateprofilesCollection?.records?.[0], 0);
    return res?.updateprofilesCollection?.records?.[0] || null;
  },
};

export const auditApi = {
  async getLogs(userId: string) {
    const cacheKey = `gql_audit_${userId}`;
    const cached = persistentCache.get(cacheKey);
    if (cached) return cached;

    const supabase = createSupabaseClient();
    const { data } = await supabase.auth.getSession();
    const gql = createGraphQLClient(data.session?.access_token);
    const res: any = await gql.request(queries.getAuditLogs, { userId });
    const logs = (res?.audit_logsCollection?.edges || []).map((e: any) => e.node);
    persistentCache.set(cacheKey, logs, 180);
    return logs;
  },
};

export const chatApi = {
  async getHistory(userId: string) {
    const cacheKey = `gql_conversations_${userId}`;
    const cached = persistentCache.get(cacheKey);
    if (cached) return cached;

    const supabase = createSupabaseClient();
    const { data } = await supabase.auth.getSession();
    const gql = createGraphQLClient(data.session?.access_token);
    const res: any = await gql.request(queries.getConversations, { userId });
    const conversations = (res?.agent_conversationsCollection?.edges || []).map((e: any) => e.node);
    persistentCache.set(cacheKey, conversations, 120);
    return conversations;
  },

  async createConversation(input: { chat_name: string; user_id: string; company_id?: string | null }) {
    const supabase = createSupabaseClient();
    const { data } = await supabase.auth.getSession();
    const gql = createGraphQLClient(data.session?.access_token);
    const res: any = await gql.request(queries.createConversation, {
      chat_name: input.chat_name,
      user_id: input.user_id,
      company_id: input.company_id ?? null,
    });
    // Invalidate cache
    persistentCache.set(`gql_conversations_${input.user_id}`, null as any, 0);
    return res?.insertIntoagent_conversationsCollection?.records?.[0] || null;
  },
};

// Preload critical data
export async function preloadCriticalData(userId: string) {
  console.log('🚀 Preloading critical data...');
  
  const preloadPromises = [
    userApi.getProfile(userId).catch(() => null),
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

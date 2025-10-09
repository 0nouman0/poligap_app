/**
 * Centralized Token Management Utility
 * Handles all authentication token operations with proper error handling
 */

const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';
const COMPANY_ID_KEY = 'company_id';
const TOKEN_EXPIRY_KEY = 'token_expiry';
const REFRESH_TOKEN_KEY = 'refresh_token';

export interface TokenData {
  token: string;
  userId: string;
  companyId?: string;
  expiresAt: number;
  refreshToken?: string;
}

/**
 * Token Manager Class
 */
class TokenManager {
  /**
   * Check if code is running in browser
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * Store authentication token and related data
   */
  setToken(data: TokenData): void {
    if (!this.isBrowser()) return;

    try {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_ID_KEY, data.userId);
      localStorage.setItem(TOKEN_EXPIRY_KEY, data.expiresAt.toString());
      
      if (data.companyId) {
        localStorage.setItem(COMPANY_ID_KEY, data.companyId);
      }
      
      if (data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      }
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    if (!this.isBrowser()) return null;

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      
      // Check if token is expired
      if (token && this.isTokenExpired()) {
        this.clearToken();
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  }

  /**
   * Get user ID
   */
  getUserId(): string | null {
    if (!this.isBrowser()) return null;

    try {
      const userId = localStorage.getItem(USER_ID_KEY);
      // Filter out invalid values
      if (userId === 'undefined' || userId === 'null' || !userId) {
        return null;
      }
      return userId;
    } catch (error) {
      console.error('Failed to retrieve user ID:', error);
      return null;
    }
  }

  /**
   * Get company ID
   */
  getCompanyId(): string | null {
    if (!this.isBrowser()) return null;

    try {
      const companyId = localStorage.getItem(COMPANY_ID_KEY);
      if (companyId === 'undefined' || companyId === 'null' || !companyId) {
        return null;
      }
      return companyId;
    } catch (error) {
      console.error('Failed to retrieve company ID:', error);
      return null;
    }
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    if (!this.isBrowser()) return null;

    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    if (!this.isBrowser()) return true;

    try {
      const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
      if (!expiryStr) return true;

      const expiry = parseInt(expiryStr, 10);
      const now = Date.now();
      
      // Add 5-minute buffer before actual expiry
      return now >= expiry - (5 * 60 * 1000);
    } catch (error) {
      console.error('Failed to check token expiry:', error);
      return true;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired();
  }

  /**
   * Clear all authentication data
   */
  clearToken(): void {
    if (!this.isBrowser()) return;

    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_ID_KEY);
      localStorage.removeItem(COMPANY_ID_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  /**
   * Get all token data
   */
  getTokenData(): TokenData | null {
    const token = this.getToken();
    const userId = this.getUserId();
    
    if (!token || !userId) return null;

    const expiryStr = this.isBrowser() ? localStorage.getItem(TOKEN_EXPIRY_KEY) : null;
    const expiry = expiryStr ? parseInt(expiryStr, 10) : Date.now() + (24 * 60 * 60 * 1000);

    return {
      token,
      userId,
      companyId: this.getCompanyId() || undefined,
      expiresAt: expiry,
      refreshToken: this.getRefreshToken() || undefined,
    };
  }

  /**
   * Refresh the authentication token
   */
  async refreshAuthToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.clearToken();
        return false;
      }

      const data = await response.json();
      
      if (data.success && data.token) {
        this.setToken({
          token: data.token,
          userId: data.userId,
          companyId: data.companyId,
          expiresAt: data.expiresAt || Date.now() + (24 * 60 * 60 * 1000),
          refreshToken: data.refreshToken || refreshToken,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      this.clearToken();
      return false;
    }
  }

  /**
   * Get auth headers for API requests
   */
  getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    
    if (!token) {
      return {};
    }

    return {
      'Authorization': `Bearer ${token}`,
      'X-User-Id': this.getUserId() || '',
      'X-Company-Id': this.getCompanyId() || '',
    };
  }

  /**
   * Make authenticated API request
   */
  async authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // Add auth headers
    const headers = {
      ...this.getAuthHeaders(),
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // If unauthorized, try to refresh token
      if (response.status === 401) {
        const refreshed = await this.refreshAuthToken();
        
        if (refreshed) {
          // Retry request with new token
          const newHeaders = {
            ...this.getAuthHeaders(),
            'Content-Type': 'application/json',
            ...options.headers,
          };
          
          return fetch(url, {
            ...options,
            headers: newHeaders,
          });
        } else {
          // Redirect to login
          if (this.isBrowser()) {
            window.location.href = '/auth/signin';
          }
        }
      }

      return response;
    } catch (error) {
      console.error('Authenticated fetch failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();

// Export convenience functions
export const setToken = (data: TokenData) => tokenManager.setToken(data);
export const getToken = () => tokenManager.getToken();
export const getUserId = () => tokenManager.getUserId();
export const getCompanyId = () => tokenManager.getCompanyId();
export const clearToken = () => tokenManager.clearToken();
export const isAuthenticated = () => tokenManager.isAuthenticated();
export const getAuthHeaders = () => tokenManager.getAuthHeaders();
export const authenticatedFetch = (url: string, options?: RequestInit) => 
  tokenManager.authenticatedFetch(url, options);

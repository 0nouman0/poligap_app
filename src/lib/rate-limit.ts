/**
 * Rate Limiting Utility for API Routes
 * 
 * Implements in-memory rate limiting with configurable windows and limits.
 * For production, consider using Redis or a dedicated rate limiting service.
 */

import { NextResponse } from 'next/server';

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per window
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production, use Redis or similar distributed cache
const rateLimitStore = new Map<string, RateLimitStore>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiter middleware
 * 
 * @param identifier - Unique identifier (usually IP address or user ID)
 * @param config - Rate limit configuration
 * @returns null if allowed, NextResponse with 429 if rate limited
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const now = Date.now();
  const key = identifier;

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    entry = {
      count: 1,
      resetTime: now + config.interval,
    };
    rateLimitStore.set(key, entry);
    return null; // Allow request
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.uniqueTokenPerInterval) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.uniqueTokenPerInterval.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
        },
      }
    );
  }

  // Update entry
  rateLimitStore.set(key, entry);
  return null; // Allow request
}

/**
 * Get identifier from request (IP address or user agent hash)
 */
export function getIdentifier(request: Request): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
  
  // Include user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return `${ip}-${hashString(userAgent)}`;
}

/**
 * Simple hash function for strings
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Predefined rate limit configurations
 */
export const RateLimits = {
  // Strict limits for authentication (5 requests per 15 minutes)
  AUTH_STRICT: {
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 5,
  },
  
  // Very strict for signup (3 requests per hour)
  SIGNUP_STRICT: {
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 3,
  },
  
  // Moderate limits for password reset (3 requests per 15 minutes)
  PASSWORD_RESET: {
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 3,
  },
  
  // Standard limits for API endpoints (100 requests per 15 minutes)
  API_STANDARD: {
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 100,
  },
  
  // Generous limits for read operations (1000 requests per 15 minutes)
  API_READ: {
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 1000,
  },
};

/**
 * Helper to apply rate limiting to a route handler
 * 
 * Usage:
 * ```typescript
 * export async function POST(request: Request) {
 *   const rateLimitResult = await applyRateLimit(request, RateLimits.AUTH_STRICT);
 *   if (rateLimitResult) return rateLimitResult;
 *   
 *   // Your route logic here
 * }
 * ```
 */
export async function applyRateLimit(
  request: Request,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const identifier = getIdentifier(request);
  return rateLimit(identifier, config);
}

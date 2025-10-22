import { useState, useEffect } from 'react';
import { useUserStore } from '@/stores/user-store';

/**
 * Custom hook for managing userId with proper fallbacks
 * 
 * Priority order:
 * 1. User store (Zustand)
 * 2. localStorage
 * 3. Environment variable fallback
 * 
 * @returns userId string or null if not available
 */
export function useUserId(): string | null {
  const { userData } = useUserStore();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUserId = (): string | null => {
      // Skip during SSR
      if (typeof window === 'undefined') {
        return null;
      }

      // Priority 1: Check Zustand store
      if (userData?.userId && isValidUserId(userData.userId)) {
        return userData.userId;
      }

      // Priority 2: Check localStorage
      const storedUserId = localStorage.getItem('user_id');
      if (storedUserId && isValidUserId(storedUserId)) {
        return storedUserId;
      }

      // Priority 3: Environment fallback
      const fallbackId = process.env.NEXT_PUBLIC_FALLBACK_USER_ID;
      if (fallbackId && isValidUserId(fallbackId)) {
        return fallbackId;
      }

      return null;
    };

    const id = getUserId();
    setUserId(id);
    setIsLoading(false);

    // Debug log only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[useUserId] Resolved userId:', id);
    }
  }, [userData?.userId]);

  return userId;
}

/**
 * Validate userId format
 * Rejects "undefined", "null", empty strings, and invalid formats
 */
function isValidUserId(id: string): boolean {
  if (!id || id === 'undefined' || id === 'null' || id.trim() === '') {
    return false;
  }
  
  // Optional: Add more validation (UUID, ObjectId, etc.)
  return true;
}

/**
 * Hook variant that includes loading state
 */
export function useUserIdWithLoading(): {
  userId: string | null;
  isLoading: boolean;
} {
  const { userData } = useUserStore();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUserId = (): string | null => {
      if (typeof window === 'undefined') return null;

      if (userData?.userId && isValidUserId(userData.userId)) {
        return userData.userId;
      }

      const storedUserId = localStorage.getItem('user_id');
      if (storedUserId && isValidUserId(storedUserId)) {
        return storedUserId;
      }

      const fallbackId = process.env.NEXT_PUBLIC_FALLBACK_USER_ID;
      if (fallbackId && isValidUserId(fallbackId)) {
        return fallbackId;
      }

      return null;
    };

    const id = getUserId();
    setUserId(id);
    setIsLoading(false);
  }, [userData?.userId]);

  return { userId, isLoading };
}

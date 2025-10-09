"use client";

import { useEffect, useRef } from 'react';
import { useUserStore } from '@/stores/user-store';
import { useCompanyStore } from '@/stores/company-store';
import { userApi } from '@/lib/api-client';

// Global flag to prevent multiple initializations across all instances
let globalInitializing = false;
let globalInitialized = false;

export function UserInitializer() {
  const { userData, setUserData } = useUserStore();
  const { selectedCompany } = useCompanyStore();
  const hasRunRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    
    const initializeUser = async () => {
      // Prevent multiple runs in the same component instance
      if (hasRunRef.current) {
        return;
      }
      hasRunRef.current = true;

      // Check if already globally initialized
      if (globalInitialized) {
        console.log('✅ User already globally initialized');
        return;
      }

      // Check if we already have user data in store
      if (userData?.userId) {
        console.log('✅ User already initialized:', userData.email);
        globalInitialized = true;
        return;
      }

      // Prevent multiple simultaneous initializations globally
      if (globalInitializing) {
        console.log('⏳ User initialization already in progress globally...');
        return;
      }

      // Get the actual user ID from localStorage (set by your auth system)
      const storedUserId = localStorage.getItem('user_id');
      if (!storedUserId) {
        console.log('No user_id found in localStorage - user may not be authenticated');
        return;
      }

      // Check if we've already initialized this user in this session
      const sessionKey = `user_initialized_${storedUserId}`;
      if (typeof window !== 'undefined' && sessionStorage.getItem(sessionKey)) {
        console.log('✅ User already initialized in this session');
        return;
      }

      globalInitializing = true;
      console.log('🔄 Initializing user with ID:', storedUserId);

      try {
        console.log('📡 Fetching user profile with caching...');

        // Try main profile API with caching
        const result = await userApi.getProfile(storedUserId) as any;

        if (result?.success && result?.data) {
          console.log('✅ User profile loaded successfully:', result.data.email);
          if (isMounted) {
            setUserData(result.data);
            globalInitialized = true;
            // Mark as initialized in session storage
            sessionStorage.setItem(sessionKey, 'true');
          }
        } else {
          console.warn('⚠️ Profile API returned error, trying fallback...', result?.error);
          if (isMounted) {
            await tryFallbackProfile(storedUserId);
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch user profile:', error);
        if (isMounted) {
          await tryFallbackProfile(storedUserId);
        }
      } finally {
        globalInitializing = false;
      }
    };

    const tryFallbackProfile = async (userId: string) => {
      try {
        console.log('🔄 Trying cached fallback profile API...');
        const fallbackResult = await userApi.getProfileFallback(userId) as any;

        if (fallbackResult?.success && fallbackResult?.data) {
          console.log('✅ Fallback profile loaded:', fallbackResult.data.email);
          if (isMounted) {
            setUserData(fallbackResult.data);
            globalInitialized = true;
            // Mark as initialized in session storage
            const sessionKey = `user_initialized_${userId}`;
            sessionStorage.setItem(sessionKey, 'true');
          }
          return;
        }

        // If fallback also fails, create a basic user profile
        console.log('🔧 Creating basic user profile...');
        const basicProfile = {
          _id: userId,
          userId: userId,
          name: process.env.NEXT_PUBLIC_FALLBACK_USER_NAME || 'User',
          email: process.env.NEXT_PUBLIC_FALLBACK_USER_EMAIL || 'user@example.com',
          profileImage: '',
          banner: null,
          dob: '',
          mobile: '',
          status: 'ACTIVE',
          memberStatus: 'ACTIVE',
          role: 'USER',
          designation: 'User',
          country: '',
          reportingManager: null,
          createdBy: null,
          companyName: 'Company',
          profileCreatedOn: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          about: ''
        };

        if (isMounted) {
          setUserData(basicProfile);
          globalInitialized = true;
          // Mark as initialized in session storage
          const sessionKey = `user_initialized_${userId}`;
          sessionStorage.setItem(sessionKey, 'true');
          console.log('✅ Basic profile created');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback profile also failed:', fallbackError);
      }
    };

    // Only run once when component mounts or when selectedCompany changes
    initializeUser();

    // Cleanup function
    return () => {
      isMounted = false;
      globalInitializing = false;
    };
  }, []); // Run only once on mount - no dependencies to prevent re-runs

  return null; // This component doesn't render anything
}

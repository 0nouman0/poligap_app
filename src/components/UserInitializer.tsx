"use client";

import { useEffect, useRef } from 'react';
import { useUserStore } from '@/stores/user-store';
import { createClient } from '@/lib/supabase/client';
import { clearOldCache } from '@/lib/utils/clear-old-cache';

// Global flag to prevent multiple initializations
let globalInitializing = false;
let globalInitialized = false;

export function UserInitializer() {
  const { userData, setUserData, clearUserData } = useUserStore();
  const hasRunRef = useRef(false);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;
    
    const initializeUser = async () => {
      if (hasRunRef.current) return;
      hasRunRef.current = true;

      // Clear old MongoDB-based cache if it exists
      clearOldCache();

      if (globalInitialized) {
        console.log('✅ User already globally initialized');
        return;
      }

      if (globalInitializing) {
        console.log('⏳ User initialization already in progress globally...');
        return;
      }

      globalInitializing = true;
      console.log('🔄 Initializing user with Supabase...');

      try {
        // Get current user from Supabase
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.warn('⚠️ No authenticated user found');
          // Clear any cached user data
          clearUserData();
          return;
        }

        console.log('📡 User authenticated:', user.id);
        
        // Check if cached userData has wrong ID format (MongoDB ObjectId instead of UUID)
        if (userData?.userId && userData.userId !== user.id) {
          console.warn('⚠️ Cached user ID mismatch, clearing cache...');
          clearUserData();
        }

        console.log('📡 Fetching user profile from Supabase...');
        
        // Fetch profile directly from Supabase
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('❌ Profile fetch error:', profileError);
          // If profile doesn't exist, we'll create a basic one below
        }

        if (profile && isMounted) {
          const profileData = {
            _id: profile.id,
            userId: profile.id,
            name: profile.name || user.user_metadata?.name || 'User',
            email: profile.email || user.email || '',
            profileImage: profile.profile_image || '',
            banner: profile.banner || null,
            dob: profile.dob || '',
            mobile: profile.mobile || '',
            status: profile.status || 'ACTIVE',
            memberStatus: profile.member_status || 'ACTIVE',
            role: profile.role || 'USER',
            designation: profile.designation || '',
            country: profile.country || '',
            reportingManager: profile.reporting_manager || null,
            createdBy: profile.created_by || null,
            companyName: profile.company_name || '',
            profileCreatedOn: profile.profile_created_on || profile.created_at || '',
            createdAt: profile.created_at || '',
            updatedAt: profile.updated_at || '',
            about: profile.about || '',
          };

          setUserData(profileData);
          globalInitialized = true;
          console.log('✅ User profile loaded successfully:', profileData.email);
        } else if (isMounted) {
          // Profile doesn't exist, create basic one from auth user
          console.log('🔧 Profile not found, using auth user data...');
          const basicProfile = {
            _id: user.id,
            userId: user.id,
            name: user.user_metadata?.name || 'User',
            email: user.email || '',
            profileImage: '',
            banner: null,
            dob: '',
            mobile: '',
            status: 'ACTIVE',
            memberStatus: 'ACTIVE',
            role: 'USER',
            designation: '',
            country: '',
            reportingManager: null,
            createdBy: null,
            companyName: '',
            profileCreatedOn: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            about: '',
          };
          setUserData(basicProfile);
          globalInitialized = true;
          console.log('✅ Basic profile created from auth data');
        }
      } catch (error) {
        console.error('❌ Failed to fetch user profile:', error);
      } finally {
        globalInitializing = false;
      }
    };

    initializeUser();

    return () => {
      isMounted = false;
      globalInitializing = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

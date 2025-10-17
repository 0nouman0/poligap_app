import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@/stores/user-store';
import { useCompanyStore } from '@/stores/company-store';
import { toastSuccess, toastError } from '@/components/toast-varients';
import { apiCache, CACHE_KEYS } from '@/lib/cache';

export interface UserProfile {
  _id: string;
  userId: string;
  email: string;
  name: string;
  uniqueId: string;
  country?: string;
  dob?: string;
  mobile?: string;
  profileImage?: string;
  profileCreatedOn?: string;
  banner?: {
    image?: string;
    color?: string;
    type?: string;
    yOffset?: number;
  };
  about?: string;
  status: string;
  designation?: string;
  role?: string;
  memberStatus?: string;
  companyName?: string;
  reportingManager?: {
    name: string;
    email: string;
  } | null;
  createdBy?: {
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface UseUserProfileReturn {
  // State
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProfile: (userId?: string, companyId?: string) => Promise<UserProfile | null>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile | null>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { userData, setUserData } = useUserStore();
  const { selectedCompany } = useCompanyStore();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchProfile = useCallback(async (
    userId?: string, 
    companyId?: string
  ): Promise<UserProfile | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Clear old localStorage user_id if it exists
      const oldUserId = localStorage.getItem('user_id');
      if (oldUserId && /^[0-9a-f]{24}$/i.test(oldUserId)) {
        console.log('🧹 Clearing old MongoDB user_id from localStorage');
        localStorage.removeItem('user_id');
      }

      // Use provided IDs or fall back to store values (but not localStorage)
      const targetUserId = userId || userData?.userId;
      const targetCompanyId = companyId || selectedCompany?.companyId;
      
      if (!targetUserId) {
        throw new Error('User ID is required to fetch profile');
      }

      // Validate that targetUserId is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(targetUserId)) {
        console.error('❌ Invalid user ID format (not a UUID):', targetUserId);
        throw new Error('Invalid user ID format. Please clear your cache and sign in again.');
      }

      // Check cache first
      const cacheKey = CACHE_KEYS.USER_PROFILE(targetUserId);
      const cachedProfile = apiCache.get(cacheKey);
      if (cachedProfile) {
        console.log('⚡ Using cached profile data');
        setProfile(cachedProfile);
        return cachedProfile;
      }

      const params = new URLSearchParams({
        userId: targetUserId,
      });
      
      if (targetCompanyId) {
        params.append('companyId', targetCompanyId);
      }


      const response = await fetch(`/api/users/profile?${params}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch profile');
      }

      if (!result.success) {
        throw new Error(result.error || 'Profile fetch was not successful');
      }

      const profileData = result.data as UserProfile;
      
      setProfile(profileData);
      
      // Cache the profile data
      apiCache.set(cacheKey, profileData, 300); // Cache for 5 minutes
      
      // Update the user store with fresh data
      if (setUserData && profileData) {
        setUserData({
          _id: profileData._id,
          userId: profileData.userId,
          email: profileData.email,
          name: profileData.name,
          profileImage: profileData.profileImage || '',
          banner: {
            image: profileData.banner?.image || '',
          },
          about: profileData.about || '',
          country: profileData.country || '',
          dob: profileData.dob || '',
          mobile: profileData.mobile || '',
          designation: profileData.designation || '',
          role: profileData.role || 'User',
          memberStatus: profileData.memberStatus || profileData.status || 'ACTIVE',
          companyName: profileData.companyName || '',
          reportingManager: profileData.reportingManager || null,
          createdBy: profileData.createdBy || null,
          createdAt: profileData.createdAt,
          updatedAt: profileData.updatedAt,
          status: profileData.status,
          profileCreatedOn: profileData.profileCreatedOn || '',
        });
      }
      
      return profileData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching profile:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userData?.userId, selectedCompany?.companyId, setUserData]);

  const updateProfile = useCallback(async (
    updates: Partial<UserProfile>
  ): Promise<UserProfile | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userId = updates.userId || profile?.userId || userData?.userId;
      
      if (!userId) {
        throw new Error('User ID is required to update profile');
      }

      // Validate that userId is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        console.error('❌ Invalid user ID format (not a UUID):', userId);
        throw new Error('Invalid user ID format. Please clear your cache and sign in again.');
      }

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...updates,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      if (!result.success) {
        throw new Error(result.error || 'Profile update was not successful');
      }

      const updatedProfile = result.data as UserProfile;
      
      // IMMEDIATELY clear the cache before setting new data
      const cacheKey = CACHE_KEYS.USER_PROFILE(userId);
      apiCache.delete(cacheKey);
      
      // Set the updated profile state
      setProfile(updatedProfile);
      
      // Set fresh cache with updated data
      apiCache.set(cacheKey, updatedProfile, 300);
      
      // Update the user store with fresh data IMMEDIATELY
      if (setUserData && updatedProfile) {
        const freshUserData = {
          _id: updatedProfile._id,
          userId: updatedProfile.userId,
          email: updatedProfile.email,
          name: updatedProfile.name,
          profileImage: updatedProfile.profileImage || '',
          banner: {
            image: updatedProfile.banner?.image || '',
            color: updatedProfile.banner?.color || '#FFFFFF',
            type: updatedProfile.banner?.type || 'image',
          },
          about: updatedProfile.about || '',
          country: updatedProfile.country || '',
          dob: updatedProfile.dob || '',
          mobile: updatedProfile.mobile || '',
          designation: updatedProfile.designation || '',
          role: updatedProfile.role || 'User',
          memberStatus: updatedProfile.memberStatus || updatedProfile.status || 'ACTIVE',
          companyName: updatedProfile.companyName || '',
          reportingManager: updatedProfile.reportingManager || null,
          createdBy: updatedProfile.createdBy || null,
          createdAt: updatedProfile.createdAt,
          updatedAt: updatedProfile.updatedAt,
          status: updatedProfile.status,
          profileCreatedOn: updatedProfile.profileCreatedOn || '',
        };
        
        setUserData(freshUserData);
        console.log('✅ User store updated immediately with fresh data');
      }
      
      toastSuccess('Profile Updated', 'Your profile has been updated successfully');
      return updatedProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error updating profile:', errorMessage);
      setError(errorMessage);
      toastError('Update Failed', errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [profile?.userId, userData?.userId, setUserData]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  // Auto-fetch profile on mount with caching optimization
  useEffect(() => {
    const userId = userData?.userId;
    if (userId && !profile) {
      // Validate UUID format before fetching
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(userId)) {
        fetchProfile(userId);
      } else {
        console.warn('⚠️ Invalid user ID in store, skipping profile fetch');
      }
    }
  }, [userData?.userId, fetchProfile, profile]); // Only fetch if no profile exists

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    refreshProfile,
    clearError,
  };
}

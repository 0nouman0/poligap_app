"use client";

import { useEffect } from 'react';
import { useUserStore } from '@/stores/user-store';
import { useCompanyStore } from '@/stores/company-store';

export function UserInitializer() {
  const { userData, setUserData } = useUserStore();
  const { selectedCompany } = useCompanyStore();

  useEffect(() => {
    const initializeUser = async () => {
      // Check if we already have user data in store
      if (userData?.userId) return;

      // Get the actual user ID from localStorage (set by your auth system)
      const storedUserId = localStorage.getItem('user_id');
      if (!storedUserId) {
        console.log('No user_id found in localStorage - user may not be authenticated');
        return;
      }

      try {
        // Build query parameters for real user data
        const params = new URLSearchParams();
        params.append('userId', storedUserId);
        
        // Add companyId if available for complete profile data
        if (selectedCompany?.companyId) {
          params.append('companyId', selectedCompany.companyId);
        }

        // Fetch real user data from MongoDB Atlas
        const response = await fetch(`/api/users/profile?${params.toString()}`);
        const result = await response.json();

        if (result.success && result.data) {
          // Set the real user data in the store
          setUserData(result.data);
          console.log('Real user data loaded from MongoDB:', result.data.name || result.data.email);
        } else {
          console.error('Failed to load user profile from MongoDB:', result.error);
        }
      } catch (error) {
        console.error('Failed to fetch user profile from MongoDB:', error);
      }
    };

    initializeUser();
  }, [userData, setUserData, selectedCompany?.companyId]);

  return null; // This component doesn't render anything
}

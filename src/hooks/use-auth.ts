import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { token, userData, setToken, setUserData } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      // Check for token in localStorage
      const storedToken = localStorage.getItem('accessToken') || localStorage.getItem('__LOGIN_SESSION__');
      const storedUserId = localStorage.getItem('user_id');

      if (storedToken && storedUserId) {
        // Update auth store if token exists but store is empty
        if (!token) {
          setToken(storedToken);
        }
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [token, setToken]);

  const login = (authToken: string, userId: string) => {
    // Store in localStorage
    localStorage.setItem('accessToken', authToken);
    localStorage.setItem('__LOGIN_SESSION__', authToken);
    localStorage.setItem('user_id', userId);
    
    // Update auth store
    setToken(authToken);
    setIsAuthenticated(true);
    
    // Redirect to home
    router.push('/home');
  };

  const logout = async () => {
    try {
      // Call logout API
      await fetch('/api/users/signout', { method: 'POST' });
    } catch (error) {
      console.error('Logout API error:', error);
    }

    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('__LOGIN_SESSION__');
    localStorage.removeItem('user_id');
    
    // Clear auth store
    useAuthStore.getState().logout();
    
    // Update local state
    setIsAuthenticated(false);
    
    // Redirect to signin
    router.push('/auth/signin');
  };

  return {
    isLoading,
    isAuthenticated,
    token,
    userData,
    login,
    logout,
  };
}

export function useRequireAuth() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isLoading, isAuthenticated, router]);

  return { isLoading, isAuthenticated };
}

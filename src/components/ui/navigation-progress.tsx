"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';

export function NavigationProgress() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    const handleStart = () => {
      setIsLoading(true);
      setProgress(0);
      
      // Simulate progress
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 100);
    };

    const handleComplete = () => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
      
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };

    // Listen for route changes
    const originalPush = router.push;
    const originalReplace = router.replace;

    router.push = (...args) => {
      handleStart();
      const result = originalPush.apply(router, args);
      // Handle completion after a short delay since router.push doesn't return a promise
      setTimeout(handleComplete, 500);
      return result;
    };

    router.replace = (...args) => {
      handleStart();
      const result = originalReplace.apply(router, args);
      // Handle completion after a short delay since router.replace doesn't return a promise
      setTimeout(handleComplete, 500);
      return result;
    };

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [router]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <Progress value={progress} className="h-1 rounded-none" />
    </div>
  );
}

// Alternative top-loading bar component
export function TopLoadingBar() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    // Listen for navigation events
    window.addEventListener('beforeunload', handleStart);
    
    return () => {
      window.removeEventListener('beforeunload', handleStart);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary/20">
      <div 
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{
          width: '100%',
          animation: 'loading-bar 2s ease-in-out infinite'
        }}
      />
      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FullPageLoader } from '@/components/ui/page-loader';

interface RouteTransitionProps {
  children: React.ReactNode;
  loadingMessage?: string;
  minLoadingTime?: number; // Minimum loading time in ms
}

export function RouteTransition({ 
  children, 
  loadingMessage = "Loading page...",
  minLoadingTime = 300 
}: RouteTransitionProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [showContent, setShowContent] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setShowContent(false);

    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowContent(true);
    }, minLoadingTime);

    return () => clearTimeout(timer);
  }, [pathname, minLoadingTime]);

  if (isLoading || !showContent) {
    return <FullPageLoader message={loadingMessage} />;
  }

  return (
    <div className="animate-in fade-in duration-300">
      {children}
    </div>
  );
}

// Hook for programmatic loading states
export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startTransition = (callback?: () => void) => {
    setIsTransitioning(true);
    if (callback) {
      setTimeout(() => {
        callback();
        setIsTransitioning(false);
      }, 100);
    }
  };

  const endTransition = () => {
    setIsTransitioning(false);
  };

  return {
    isTransitioning,
    startTransition,
    endTransition
  };
}

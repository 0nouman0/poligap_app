"use client";

import React, { Suspense, lazy } from 'react';
import { PageLoader } from '@/components/ui/page-loader';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function LazyWrapper({ 
  children, 
  fallback = <PageLoader />, 
  className = "" 
}: LazyWrapperProps) {
  return (
    <div className={className}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </div>
  );
}

// Higher-order component for lazy loading
export function withLazyLoading<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));
  
  return function WrappedComponent(props: T) {
    return (
      <Suspense fallback={fallback || <PageLoader />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Intersection Observer based lazy loading
export function LazyOnView({ 
  children, 
  fallback = <PageLoader />,
  rootMargin = "50px",
  threshold = 0.1,
  className = ""
}: LazyWrapperProps & {
  rootMargin?: string;
  threshold?: number;
}) {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
}

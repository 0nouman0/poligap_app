"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Hook for prefetching routes
export function usePrefetch() {
  const router = useRouter();

  const prefetchRoute = useCallback((href: string) => {
    router.prefetch(href);
  }, [router]);

  const prefetchMultiple = useCallback((routes: string[]) => {
    routes.forEach(route => router.prefetch(route));
  }, [router]);

  return { prefetchRoute, prefetchMultiple };
}

// Hook for debouncing functions
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// Hook for throttling functions
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay]
  ) as T;

  return throttledCallback;
}

// Hook for measuring performance
export function usePerformance(name: string) {
  const startTime = useRef<number | undefined>(undefined);

  const start = useCallback(() => {
    startTime.current = performance.now();
    console.log(`🚀 Performance: ${name} started`);
  }, [name]);

  const end = useCallback(() => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current;
      console.log(`✅ Performance: ${name} completed in ${duration.toFixed(2)}ms`);
      return duration;
    }
    return 0;
  }, [name]);

  const measure = useCallback((fn: () => void | Promise<void>) => {
    start();
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => end());
    } else {
      end();
      return result;
    }
  }, [start, end]);

  return { start, end, measure };
}

// Hook for intersection observer (lazy loading)
export function useIntersectionObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
) {
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      callback(entry);
    }, options);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return targetRef;
}

// Hook for preloading images
export function useImagePreloader(imageUrls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const preloadImages = useCallback(async () => {
    setIsLoading(true);
    
    const promises = imageUrls.map(url => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = reject;
        img.src = url;
      });
    });

    try {
      const loaded = await Promise.allSettled(promises);
      const successful = loaded
        .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
        .map(result => result.value);
      
      setLoadedImages(new Set(successful));
    } catch (error) {
      console.error('Error preloading images:', error);
    } finally {
      setIsLoading(false);
    }
  }, [imageUrls]);

  useEffect(() => {
    if (imageUrls.length > 0) {
      preloadImages();
    }
  }, [imageUrls, preloadImages]);

  return { loadedImages, isLoading, preloadImages };
}

// Import useState for the image preloader
import { useState } from 'react';

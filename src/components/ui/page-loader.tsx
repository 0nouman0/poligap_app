"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
  className?: string;
}

export function PageLoader({ message = "Loading...", className = "" }: PageLoaderProps) {
  return (
    <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function FullPageLoader({ message = "Loading page..." }: PageLoaderProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-primary/20"></div>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium">{message}</p>
          <p className="text-sm text-muted-foreground">Please wait...</p>
        </div>
      </div>
    </div>
  );
}

// Skeleton components for different page types
export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
      </div>
      
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
            <div className="h-8 bg-muted rounded w-1/2 animate-pulse"></div>
            <div className="h-3 bg-muted rounded w-full animate-pulse"></div>
          </div>
        ))}
      </div>
      
      {/* Chart skeleton */}
      <div className="h-64 bg-muted rounded animate-pulse"></div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        {/* Messages area skeleton */}
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-xs p-3 rounded-lg space-y-2 ${i % 2 === 0 ? 'bg-muted' : 'bg-primary/10'}`}>
                <div className="h-4 bg-muted-foreground/20 rounded animate-pulse"></div>
                <div className="h-4 bg-muted-foreground/20 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Input skeleton */}
        <div className="p-4 border-t">
          <div className="h-10 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
      
      {/* Sidebar skeleton */}
      <div className="w-80 border-l p-4 space-y-3">
        <div className="h-6 bg-muted rounded w-1/2 animate-pulse"></div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 border rounded">
          <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
          </div>
          <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}

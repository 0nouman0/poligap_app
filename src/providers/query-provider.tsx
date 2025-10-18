"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000, // 5 minutes
            // Keep unused data in cache for 10 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime in v4)
            // Retry failed requests once
            retry: 1,
            // Don't refetch on window focus (can be annoying during development)
            refetchOnWindowFocus: false,
            // Refetch when connection is restored
            refetchOnReconnect: true,
            // Refetch in background when data becomes stale
            refetchOnMount: true,
            // Network mode: online | always | offlineFirst
            networkMode: "online",
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
            // Network mode for mutations
            networkMode: "online",
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}

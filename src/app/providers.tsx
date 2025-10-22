"use client";

import type React from "react";
import { ThemeProvider } from "@/components/theme-provider";

/**
 * Root Providers Component
 * 
 * Note: Next-Auth SessionProvider was removed.
 * Authentication is handled by Supabase Auth.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

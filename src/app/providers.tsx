"use client";

import React, { useEffect } from "react";
import { ThemeProvider } from "@/components/theme-provider";

/**
 * Root Providers Component
 * 
 * Note: Next-Auth SessionProvider was removed.
 * Authentication is handled by Supabase Auth.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // One-time client-side cleanup: remove any persisted noisy "Visited ..." or
  // profile activities from the user's local activity store. This runs as soon
  // as the app mounts in the browser and prevents stale page-visit entries from
  // appearing in Recent Activity for users who haven't reloaded.
  useEffect(() => {
    try {
      const key = 'user-activity-store';
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const activities: any[] = parsed.state?.activities ?? parsed.activities ?? [];
      const cleaned = activities.filter((a: any) => {
        if (!a) return false;
        const action = a.action || '';
        const hasPageVisited = !!(a.details && a.details.pageVisited);
        if (action.startsWith('Visited ') || hasPageVisited) return false;
        if (a.type === 'profile') return false;
        return true;
      });
      if (parsed.state) parsed.state.activities = cleaned;
      else if (parsed.activities) parsed.activities = cleaned;
      else parsed.activities = cleaned;
      localStorage.setItem(key, JSON.stringify(parsed));
    } catch (e) {
      // ignore errors — don't block app mount
    }
  }, []);

  return <ThemeProvider>{children}</ThemeProvider>;
}

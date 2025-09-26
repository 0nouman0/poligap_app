"use client";

import type React from "react";
import { AuthProvider } from "@propelauth/react";
export const dynamic = "force-dynamic";

export default function SSO2Auth({ children }: { children: React.ReactNode }) {
  const authUrl = process.env.NEXT_PUBLIC_REACT_APP_AUTH_URL;
  // Guard against missing env during build/prerender to avoid Invalid URL error
  if (!authUrl) {
    // Render children directly without AuthProvider; no <html>/<body> in nested layout
    return <>{children}</>;
  }

  return <AuthProvider authUrl={authUrl}>{children}</AuthProvider>;
}

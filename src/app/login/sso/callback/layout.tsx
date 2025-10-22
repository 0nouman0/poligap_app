"use client";

import type React from "react";

export const dynamic = "force-dynamic";

/**
 * SSO Callback Layout
 * 
 * Note: PropelAuth provider removed. This project uses Supabase Auth.
 * This layout is kept for backward compatibility but does not provide
 * any authentication context.
 */
export default function SSO2Auth({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

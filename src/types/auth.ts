/**
 * Authentication Types
 * 
 * Note: This project uses Supabase Auth, not Next-Auth.
 * Next-Auth types have been removed.
 */

// Add custom auth types here if needed
export type AuthUser = {
  id: string;
  email: string;
  role?: string;
};

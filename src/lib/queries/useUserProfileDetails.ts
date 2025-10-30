import { useQuery } from "@tanstack/react-query";

// Simple user profile fetch function
async function fetchUserProfile(userId: string) {
  const response = await fetch(`/api/users/profile?userId=${userId}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || 'Failed to fetch user profile');
  }
  return response.json();
}

export function useUserProfileDetails(userId: string, companyId?: string) {
  return useQuery({
    // include companyId so switching org refetches
    queryKey: ["userProfileDetails", userId, companyId || null],
    queryFn: () => fetchUserProfile(userId),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

import { useQuery } from "@tanstack/react-query";

// Simple user profile fetch function
async function fetchUserProfile(userId: string) {
  const response = await fetch(`/api/users/profile?userId=${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return response.json();
}

export function useUserProfileDetails(userId: string, companyId?: string) {
  return useQuery({
    queryKey: ["userProfileDetails", userId],
    queryFn: () => fetchUserProfile(userId),
    enabled: !!userId,
  });
}

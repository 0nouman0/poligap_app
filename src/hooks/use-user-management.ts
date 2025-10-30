import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type {
  CreateInvitationRequest,
  CreateInvitationResponse,
  ListInvitationsResponse,
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  ResendInvitationRequest,
  RevokeInvitationRequest,
  ListMembersResponse,
  UpdateMemberRoleRequest,
  RemoveMemberRequest,
  GetMemberDetailsResponse,
  InvitationStatus,
  MembershipStatus,
  UserRole,
} from "@/types/user-management"

// Invitations Hooks

export function useCreateInvitation() {
  const queryClient = useQueryClient()

  return useMutation<CreateInvitationResponse, Error, CreateInvitationRequest>({
    mutationFn: async (data) => {
      const response = await fetch("/api/invitations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create invitation")
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["invitations", variables.company_id] 
      })
      toast.success("Invitation sent successfully")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invitation")
    },
  })
}

export function useListInvitations(companyId: string, status?: InvitationStatus) {
  return useQuery<ListInvitationsResponse, Error>({
    queryKey: ["invitations", companyId, status],
    queryFn: async () => {
      const params = new URLSearchParams({ company_id: companyId })
      if (status) params.append("status", status)

      const response = await fetch(`/api/invitations/list?${params}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch invitations")
      }
      return response.json()
    },
    enabled: !!companyId,
  })
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient()

  return useMutation<AcceptInvitationResponse, Error, AcceptInvitationRequest>({
    mutationFn: async (data) => {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to accept invitation")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-companies"] })
      queryClient.invalidateQueries({ queryKey: ["user-profile"] })
      toast.success("Successfully joined the company!")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to accept invitation")
    },
  })
}

export function useResendInvitation() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, ResendInvitationRequest>({
    mutationFn: async (data) => {
      const response = await fetch("/api/invitations/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to resend invitation")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] })
      toast.success("Invitation resent successfully")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resend invitation")
    },
  })
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, RevokeInvitationRequest>({
    mutationFn: async (data) => {
      const response = await fetch("/api/invitations/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to revoke invitation")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] })
      toast.success("Invitation revoked successfully")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to revoke invitation")
    },
  })
}

// Members Hooks

export function useListMembers(
  companyId: string,
  role?: UserRole,
  status: MembershipStatus = "active"
) {
  return useQuery<ListMembersResponse, Error>({
    queryKey: ["members", companyId, role, status],
    queryFn: async () => {
      const params = new URLSearchParams({ 
        company_id: companyId,
        status,
      })
      if (role) params.append("role", role)

      // Add cache-busting timestamp to ensure fresh data
      params.append("_t", Date.now().toString())

      const response = await fetch(`/api/members/list?${params}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch members")
      }
      return response.json()
    },
    enabled: !!companyId,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    gcTime: 0, // Don't cache results (TanStack v5)
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, UpdateMemberRoleRequest>({
    mutationFn: async (data) => {
      const response = await fetch("/api/members/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update member role")
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["members", variables.company_id] 
      })
      toast.success("Member role updated successfully")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update member role")
    },
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, RemoveMemberRequest>({
    mutationFn: async (data) => {
      const response = await fetch("/api/members/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to remove member")
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["members", variables.company_id] 
      })
      toast.success("Member removed successfully")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove member")
    },
  })
}

export function useGetMemberDetails(companyId: string, memberUserId: string) {
  return useQuery<GetMemberDetailsResponse, Error>({
    queryKey: ["member-details", companyId, memberUserId],
    queryFn: async () => {
      const params = new URLSearchParams({
        company_id: companyId,
        member_user_id: memberUserId,
      })

      const response = await fetch(`/api/members/details?${params}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch member details")
      }
      return response.json()
    },
    enabled: !!companyId && !!memberUserId,
  })
}

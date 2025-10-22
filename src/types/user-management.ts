// User Management Types

export type UserRole = "super_admin" | "company_admin" | "member" | "viewer"

export type InvitationStatus = "pending" | "sent" | "accepted" | "expired" | "revoked"

export type MembershipStatus = "active" | "suspended" | "removed"

export interface Company {
  id: string
  name: string
  slug?: string
  logo_url?: string
  enable_knowledge_base?: boolean
  is_active?: boolean
  max_users?: number
  settings?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface UserCompany {
  user_id: string
  company_id: string
  role: UserRole
  is_primary?: boolean
  status?: MembershipStatus
  joined_at?: string
  created_at?: string
  updated_at?: string
  company?: Company
  user?: UserProfile
}

export interface Invitation {
  id: string
  email: string
  role: UserRole
  company_id: string
  invited_by?: string
  status: InvitationStatus
  token: string
  expires_at?: string
  sent_at?: string
  accepted_at?: string
  created_at?: string
  updated_at?: string
  metadata?: Record<string, any>
  company?: Company
  inviter?: UserProfile
}

export interface UserProfile {
  id: string
  email: string
  name: string
  unique_id: string
  profile_image?: string
  country?: string
  mobile?: string
  dob?: string
  designation?: string
  about?: string
  status?: string
  company_id?: string
  system_role?: UserRole
  is_active?: boolean
  invited_by?: string
  last_active_at?: string
  created_at?: string
  updated_at?: string
}

export interface MemberWithActivity extends UserCompany {
  activity_stats?: {
    total_compliance_checks: number
    total_contract_reviews: number
    total_tasks_created: number
    total_tasks_completed: number
    last_activity_date?: string
  }
}

// API Request/Response Types

export interface CreateInvitationRequest {
  email: string
  role: UserRole
  company_id: string
}

export interface CreateInvitationResponse {
  success: boolean
  invitation?: Invitation
  message?: string
  error?: string
}

export interface ListInvitationsRequest {
  company_id: string
  status?: InvitationStatus
}

export interface ListInvitationsResponse {
  success: boolean
  invitations?: Invitation[]
  error?: string
}

export interface AcceptInvitationRequest {
  token: string
}

export interface AcceptInvitationResponse {
  success: boolean
  company_id?: string
  role?: UserRole
  message?: string
  error?: string
}

export interface ResendInvitationRequest {
  invitation_id: string
}

export interface RevokeInvitationRequest {
  invitation_id: string
}

export interface ListMembersRequest {
  company_id: string
  role?: UserRole
  status?: MembershipStatus
}

export interface ListMembersResponse {
  success: boolean
  members?: UserCompany[]
  total?: number
  error?: string
}

export interface UpdateMemberRoleRequest {
  company_id: string
  member_user_id: string
  new_role: UserRole
}

export interface RemoveMemberRequest {
  company_id: string
  member_user_id: string
}

export interface GetMemberDetailsRequest {
  company_id: string
  member_user_id: string
}

export interface GetMemberDetailsResponse {
  success: boolean
  member?: UserCompany
  activity_stats?: MemberWithActivity["activity_stats"]
  error?: string
}

// Helper type guards
export function isCompanyAdmin(role?: UserRole): boolean {
  return role === "company_admin" || role === "super_admin"
}

export function isSuperAdmin(role?: UserRole): boolean {
  return role === "super_admin"
}

export function canManageMembers(role?: UserRole): boolean {
  return isCompanyAdmin(role)
}

export function canManageInvitations(role?: UserRole): boolean {
  return isCompanyAdmin(role)
}

export function isInvitationValid(invitation: Invitation): boolean {
  if (invitation.status !== "pending" && invitation.status !== "sent") {
    return false
  }
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return false
  }
  return true
}

export function getMembershipStatusColor(status: MembershipStatus): string {
  switch (status) {
    case "active":
      return "green"
    case "suspended":
      return "yellow"
    case "removed":
      return "red"
    default:
      return "gray"
  }
}

export function getInvitationStatusColor(status: InvitationStatus): string {
  switch (status) {
    case "pending":
    case "sent":
      return "blue"
    case "accepted":
      return "green"
    case "expired":
      return "yellow"
    case "revoked":
      return "red"
    default:
      return "gray"
  }
}

export function getRoleBadgeVariant(role: UserRole): "default" | "secondary" | "destructive" | "outline" {
  switch (role) {
    case "super_admin":
      return "destructive"
    case "company_admin":
      return "default"
    case "member":
      return "secondary"
    case "viewer":
      return "outline"
    default:
      return "outline"
  }
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case "super_admin":
      return "Super Admin"
    case "company_admin":
      return "Admin"
    case "member":
      return "Member"
    case "viewer":
      return "Viewer"
    default:
      return role
  }
}

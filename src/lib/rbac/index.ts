/**
 * Enterprise-Level Role-Based Access Control (RBAC) System
 * 
 * This module provides comprehensive RBAC functionality including:
 * - Role hierarchy and permissions
 * - Resource-level access control
 * - Company-based data isolation
 * - GraphQL integration
 * - Audit logging
 */

import { createClient } from '@/lib/supabase/server';

// ============================================
// RBAC Types & Enums
// ============================================

export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  USER = 'user',
}

export enum Permission {
  // Company Management
  COMPANY_VIEW = 'company:view',
  COMPANY_UPDATE = 'company:update',
  COMPANY_DELETE = 'company:delete',
  
  // Member Management
  MEMBER_VIEW = 'member:view',
  MEMBER_CREATE = 'member:create',
  MEMBER_UPDATE = 'member:update',
  MEMBER_DELETE = 'member:delete',
  MEMBER_ROLE_CHANGE = 'member:role:change',
  
  // Media Management
  MEDIA_VIEW = 'media:view',
  MEDIA_CREATE = 'media:create',
  MEDIA_UPDATE = 'media:update',
  MEDIA_DELETE = 'media:delete',
  MEDIA_DELETE_ANY = 'media:delete:any',
  
  // Rulebase Management
  RULEBASE_VIEW = 'rulebase:view',
  RULEBASE_CREATE = 'rulebase:create',
  RULEBASE_UPDATE = 'rulebase:update',
  RULEBASE_DELETE = 'rulebase:delete',
  RULEBASE_DELETE_ANY = 'rulebase:delete:any',
  
  // Document Analysis
  ANALYSIS_VIEW = 'analysis:view',
  ANALYSIS_CREATE = 'analysis:create',
  ANALYSIS_UPDATE = 'analysis:update',
  ANALYSIS_DELETE = 'analysis:delete',
  
  // Conversations & Messages
  CONVERSATION_VIEW = 'conversation:view',
  CONVERSATION_CREATE = 'conversation:create',
  CONVERSATION_UPDATE = 'conversation:update',
  CONVERSATION_DELETE = 'conversation:delete',
  
  // Audit Logs
  AUDIT_VIEW_OWN = 'audit:view:own',
  AUDIT_VIEW_COMPANY = 'audit:view:company',
  
  // Search History
  SEARCH_VIEW = 'search:view',
  SEARCH_CREATE = 'search:create',
  SEARCH_DELETE = 'search:delete',
  
  // Feedback
  FEEDBACK_VIEW_OWN = 'feedback:view:own',
  FEEDBACK_VIEW_COMPANY = 'feedback:view:company',
  FEEDBACK_CREATE = 'feedback:create',
}

export interface UserContext {
  userId: string;
  email: string;
  companyId: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RBACCheckOptions {
  userId?: string;
  companyId?: string;
  resourceOwnerId?: string;
}

// ============================================
// Role Permissions Matrix
// ============================================

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    // Full access to everything
    Permission.COMPANY_VIEW,
    Permission.COMPANY_UPDATE,
    Permission.COMPANY_DELETE,
    
    Permission.MEMBER_VIEW,
    Permission.MEMBER_CREATE,
    Permission.MEMBER_UPDATE,
    Permission.MEMBER_DELETE,
    Permission.MEMBER_ROLE_CHANGE,
    
    Permission.MEDIA_VIEW,
    Permission.MEDIA_CREATE,
    Permission.MEDIA_UPDATE,
    Permission.MEDIA_DELETE,
    Permission.MEDIA_DELETE_ANY,
    
    Permission.RULEBASE_VIEW,
    Permission.RULEBASE_CREATE,
    Permission.RULEBASE_UPDATE,
    Permission.RULEBASE_DELETE,
    Permission.RULEBASE_DELETE_ANY,
    
    Permission.ANALYSIS_VIEW,
    Permission.ANALYSIS_CREATE,
    Permission.ANALYSIS_UPDATE,
    Permission.ANALYSIS_DELETE,
    
    Permission.CONVERSATION_VIEW,
    Permission.CONVERSATION_CREATE,
    Permission.CONVERSATION_UPDATE,
    Permission.CONVERSATION_DELETE,
    
    Permission.AUDIT_VIEW_OWN,
    Permission.AUDIT_VIEW_COMPANY,
    
    Permission.SEARCH_VIEW,
    Permission.SEARCH_CREATE,
    Permission.SEARCH_DELETE,
    
    Permission.FEEDBACK_VIEW_OWN,
    Permission.FEEDBACK_VIEW_COMPANY,
    Permission.FEEDBACK_CREATE,
  ],
  
  [Role.ADMIN]: [
    // Company - read only
    Permission.COMPANY_VIEW,
    
    // Member management
    Permission.MEMBER_VIEW,
    Permission.MEMBER_CREATE,
    Permission.MEMBER_UPDATE,
    Permission.MEMBER_DELETE,
    // Note: Cannot change roles
    
    // Media - full access including company media
    Permission.MEDIA_VIEW,
    Permission.MEDIA_CREATE,
    Permission.MEDIA_UPDATE,
    Permission.MEDIA_DELETE,
    Permission.MEDIA_DELETE_ANY,
    
    // Rulebase - full access
    Permission.RULEBASE_VIEW,
    Permission.RULEBASE_CREATE,
    Permission.RULEBASE_UPDATE,
    Permission.RULEBASE_DELETE,
    Permission.RULEBASE_DELETE_ANY,
    
    // Analysis - full access
    Permission.ANALYSIS_VIEW,
    Permission.ANALYSIS_CREATE,
    Permission.ANALYSIS_UPDATE,
    Permission.ANALYSIS_DELETE,
    
    // Conversations - own only
    Permission.CONVERSATION_VIEW,
    Permission.CONVERSATION_CREATE,
    Permission.CONVERSATION_UPDATE,
    Permission.CONVERSATION_DELETE,
    
    // Audit - company level
    Permission.AUDIT_VIEW_OWN,
    Permission.AUDIT_VIEW_COMPANY,
    
    // Search - own only
    Permission.SEARCH_VIEW,
    Permission.SEARCH_CREATE,
    Permission.SEARCH_DELETE,
    
    // Feedback - company level
    Permission.FEEDBACK_VIEW_OWN,
    Permission.FEEDBACK_VIEW_COMPANY,
    Permission.FEEDBACK_CREATE,
  ],
  
  [Role.USER]: [
    // Company - read only
    Permission.COMPANY_VIEW,
    
    // Members - view only
    Permission.MEMBER_VIEW,
    
    // Media - own resources only
    Permission.MEDIA_VIEW,
    Permission.MEDIA_CREATE,
    Permission.MEDIA_UPDATE,
    Permission.MEDIA_DELETE,
    
    // Rulebase - view company, manage own
    Permission.RULEBASE_VIEW,
    Permission.RULEBASE_CREATE,
    Permission.RULEBASE_UPDATE,
    Permission.RULEBASE_DELETE,
    
    // Analysis - view company, manage own
    Permission.ANALYSIS_VIEW,
    Permission.ANALYSIS_CREATE,
    Permission.ANALYSIS_UPDATE,
    Permission.ANALYSIS_DELETE,
    
    // Conversations - own only
    Permission.CONVERSATION_VIEW,
    Permission.CONVERSATION_CREATE,
    Permission.CONVERSATION_UPDATE,
    Permission.CONVERSATION_DELETE,
    
    // Audit - own only
    Permission.AUDIT_VIEW_OWN,
    
    // Search - own only
    Permission.SEARCH_VIEW,
    Permission.SEARCH_CREATE,
    Permission.SEARCH_DELETE,
    
    // Feedback - own only
    Permission.FEEDBACK_VIEW_OWN,
    Permission.FEEDBACK_CREATE,
  ],
};

// ============================================
// Core RBAC Functions
// ============================================

/**
 * Get user context from Supabase Auth
 */
export async function getUserContext(): Promise<UserContext | null> {
  const supabase = createClient();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return null;
  }
  
  // Get user's company membership and role
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('company_id, role, status')
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .single();
  
  if (memberError || !member) {
    return null;
  }
  
  return {
    userId: user.id,
    email: user.email!,
    companyId: member.company_id,
    role: member.role as Role,
    status: member.status,
  };
}

/**
 * Check if user has specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Check if user can access resource
 */
export function canAccessResource(
  context: UserContext,
  permission: Permission,
  options: RBACCheckOptions = {}
): boolean {
  // Check if user has the permission
  if (!hasPermission(context.role, permission)) {
    return false;
  }
  
  // If checking company resources, verify company match
  if (options.companyId && options.companyId !== context.companyId) {
    return false;
  }
  
  // If checking user-owned resources
  if (options.resourceOwnerId) {
    // Owner and Admin can access any company resource
    if (context.role === Role.OWNER || context.role === Role.ADMIN) {
      return true;
    }
    // Regular users can only access their own resources
    return options.resourceOwnerId === context.userId;
  }
  
  return true;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<UserContext> {
  const context = await getUserContext();
  
  if (!context) {
    throw new Error('Authentication required');
  }
  
  if (context.status !== 'ACTIVE') {
    throw new Error('User account is inactive');
  }
  
  return context;
}

/**
 * Require specific permission - throws if not authorized
 */
export async function requirePermission(permission: Permission): Promise<UserContext> {
  const context = await requireAuth();
  
  if (!hasPermission(context.role, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
  
  return context;
}

/**
 * Require any of specified permissions - throws if not authorized
 */
export async function requireAnyPermission(permissions: Permission[]): Promise<UserContext> {
  const context = await requireAuth();
  
  if (!hasAnyPermission(context.role, permissions)) {
    throw new Error(`Permission denied: requires one of ${permissions.join(', ')}`);
  }
  
  return context;
}

/**
 * Require specific role - throws if not authorized
 */
export async function requireRole(roles: Role | Role[]): Promise<UserContext> {
  const context = await requireAuth();
  
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  if (!allowedRoles.includes(context.role)) {
    throw new Error(`Role required: ${allowedRoles.join(' or ')}`);
  }
  
  return context;
}

/**
 * Check if user is owner
 */
export function isOwner(role: Role): boolean {
  return role === Role.OWNER;
}

/**
 * Check if user is admin or owner
 */
export function isAdminOrOwner(role: Role): boolean {
  return role === Role.ADMIN || role === Role.OWNER;
}

// ============================================
// GraphQL RBAC Helpers
// ============================================

/**
 * GraphQL context type
 */
export interface GraphQLContext {
  user: UserContext;
}

/**
 * Create GraphQL context with user info
 */
export async function createGraphQLContext(): Promise<GraphQLContext> {
  const user = await requireAuth();
  return { user };
}

/**
 * GraphQL field resolver wrapper with RBAC
 */
export function withPermission<T>(
  permission: Permission,
  resolver: (context: GraphQLContext, ...args: any[]) => Promise<T>
) {
  return async (context: GraphQLContext, ...args: any[]): Promise<T> => {
    if (!hasPermission(context.user.role, permission)) {
      throw new Error(`Permission denied: ${permission}`);
    }
    return resolver(context, ...args);
  };
}

/**
 * GraphQL field resolver wrapper requiring specific role
 */
export function withRole<T>(
  roles: Role | Role[],
  resolver: (context: GraphQLContext, ...args: any[]) => Promise<T>
) {
  return async (context: GraphQLContext, ...args: any[]): Promise<T> => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(context.user.role)) {
      throw new Error(`Role required: ${allowedRoles.join(' or ')}`);
    }
    
    return resolver(context, ...args);
  };
}

// ============================================
// Audit Logging
// ============================================

export interface AuditLogData {
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Create audit log entry
 */
export async function createAuditLog(
  context: UserContext,
  data: AuditLogData
): Promise<void> {
  const supabase = createClient();
  
  await supabase.from('audit_logs').insert({
    user_id: context.userId,
    company_id: context.companyId,
    action: data.action,
    entity_type: data.entity_type,
    entity_id: data.entity_id,
    metadata: data.metadata,
  });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if role has elevated privileges
 */
export function hasElevatedPrivileges(role: Role): boolean {
  return role === Role.OWNER || role === Role.ADMIN;
}

/**
 * Get role hierarchy level (higher = more permissions)
 */
export function getRoleLevel(role: Role): number {
  const levels = {
    [Role.USER]: 1,
    [Role.ADMIN]: 2,
    [Role.OWNER]: 3,
  };
  return levels[role];
}

/**
 * Check if role A has higher privileges than role B
 */
export function hasHigherRole(roleA: Role, roleB: Role): boolean {
  return getRoleLevel(roleA) > getRoleLevel(roleB);
}

// ============================================
// Export Everything
// ============================================

export {
  type UserContext,
  type RBACCheckOptions,
  type GraphQLContext,
  type AuditLogData,
};

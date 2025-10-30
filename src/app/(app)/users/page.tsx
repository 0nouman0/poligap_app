"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, UserPlus, MoreVertical, Edit, Trash2, Shield, ListFilter, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { useCompanyStore } from "@/stores/company-store";
import { useUserStore } from "@/stores/user-store";
import { useListMembers, useRemoveMember, useUpdateMemberRole } from "@/hooks/use-user-management";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { InviteUserModal } from "@/components/modals/InviteUserModal";
import type { UserRole } from "@/types/user-management";
import { EditUserModal } from "@/components/modals/EditUserModal";

// Separate component for action dots to ensure proper re-rendering
function ActionDotsCell({
  member,
  currentUserEmail,
  currentUserRole,
  onEdit,
  onChangeRole,
  onDelete,
}: {
  member: any;
  currentUserEmail: string | null | undefined;
  currentUserRole: string;
  onEdit: () => void;
  onChangeRole: () => void;
  onDelete: () => void;
}) {
  // CRITICAL: If we don't have currentUserEmail, don't show anything
  if (!currentUserEmail || typeof currentUserEmail !== 'string' || currentUserEmail.trim() === '') {
    console.log(`[ActionDotsCell] No currentUserEmail for ${member.user?.email}`, { currentUserEmail });
    return null;
  }
  
  // Normalize emails for comparison (case-insensitive, trimmed)
  const memberEmail = String(member.user?.email || "").toLowerCase().trim();
  const currentUserEmailNormalized = String(currentUserEmail || "").toLowerCase().trim();
  
  // Strict comparison - both emails must be non-empty and EXACTLY equal
  const isCurrentUser = memberEmail.length > 0 && 
                        currentUserEmailNormalized.length > 0 && 
                        memberEmail === currentUserEmailNormalized;
  
  // Explicitly check role - should be EXACTLY "super_admin" or "company_admin"
  // Use strict equality to avoid any type coercion issues
  // Convert to string and do exact comparison
  const roleString = String(currentUserRole || "").toLowerCase();
  const isAdmin = roleString === "super_admin" || roleString === "company_admin";
  const isCompanyAdminViewingSuperAdmin = roleString === "company_admin" && String(member?.role || "").toLowerCase() === "super_admin";
  
  // CRITICAL DEBUG: Log every single check to console (these MUST show up)
  const debugInfo = {
    memberEmail,
    currentUserEmailNormalized,
    emailsMatch: memberEmail === currentUserEmailNormalized,
    isCurrentUser: Boolean(isCurrentUser),
    isAdmin: Boolean(isAdmin),
    currentUserRole: String(currentUserRole),
    willShowDots: isAdmin || isCurrentUser
  };
  
  // THE CRITICAL CHECK: Only show if user is admin OR if this is the current user
  // If BOTH conditions are false, return null immediately
  // Using explicit boolean checks to avoid any truthy/falsy issues
  const shouldShowDots = Boolean(isAdmin) || Boolean(isCurrentUser);
  
  if (!shouldShowDots) {
    // NOT admin AND NOT current user = absolutely NO action dots
    return null;
  }
  
  // At this point, we know either:
  // 1. User IS an admin (can see actions for all users)
  // 2. User IS the current user (can see actions for themselves)
  
  // If company_admin hovers on a super_admin row, show disabled three-dots (no actions)
  if (isCompanyAdminViewingSuperAdmin) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-muted-foreground cursor-not-allowed opacity-60"
        disabled
        title="Actions disabled for Super Admin"
        aria-disabled="true"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Edit User - available for current user or if admin */}
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit User
        </DropdownMenuItem>
        
        {/* Change Role - only for admins editing other users and not targeting a super admin if current user is only company_admin */}
        {!isCurrentUser && isAdmin && !(String(currentUserRole).toLowerCase() === "company_admin" && String(member?.role).toLowerCase() === "super_admin") && (
          <DropdownMenuItem onClick={onChangeRole}>
            <Shield className="mr-2 h-4 w-4" />
            Change Role
          </DropdownMenuItem>
        )}
        
        {/* Remove Member - only for admins, never for current user */}
        {!isCurrentUser && isAdmin && (
          <DropdownMenuItem onClick={onDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Remove Member
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type MemberIntegration = {
  imageUrl: string;
  name: string;
  userStatus: string | null;
};

export type Member = {
  user_id: string;
  role: string;
  is_primary?: boolean;
  status?: string;
  joined_at?: string;
  user: {
    id: string;
    name: string;
    email: string;
    profile_image?: string;
    designation?: string;
    status?: string;
    last_active_at?: string;
  };
};

export default function Component() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy] = useState("relevance");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<typeof teamMembers[0] | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // New state for filter category and filter value
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<
    string | null
  >(null);
  const [selectedFilterValue, setSelectedFilterValue] = useState<string | null>(
    null
  );

  // New state for showing/hiding filter dropdown
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // State for user management modals
  const [memberToDelete, setMemberToDelete] = useState<typeof teamMembers[0] | null>(null);
  const [memberToChangeRole, setMemberToChangeRole] = useState<typeof teamMembers[0] | null>(null);
  const [newRole, setNewRole] = useState<UserRole | "">("");

  // Ref for filter dropdown
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch - only render dynamic content after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Click outside to close filter dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      // Check if click is on SelectContent (dropdown options)
      const selectContent = document.querySelector(
        "[data-radix-popper-content-wrapper]"
      );
      if (selectContent && selectContent.contains(target)) {
        return; // Don't close if clicking on dropdown options
      }

      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(target)
      ) {
        setShowFilterDropdown(false);
      }
    }

    if (showFilterDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterDropdown]);

  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const companyId = selectedCompany?.companyId;
  const { userData } = useUserStore();
  
  // Get current user email directly from Supabase auth (more reliable than userData)
  const [authUserEmail, setAuthUserEmail] = useState<string | null>(null);
  
  useEffect(() => {
    const getAuthUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error("❌ Error getting auth user:", error);
          console.error("Error details:", JSON.stringify(error, null, 2));
          return;
        }
        console.log("🔍 Auth user data:", { userId: user?.id, email: user?.email, hasUser: !!user });
        if (user?.email) {
          const normalizedEmail = user.email.toLowerCase().trim();
          setAuthUserEmail(normalizedEmail);
          console.log("✅ Got email from Supabase auth:", normalizedEmail);
        } else {
          console.warn("⚠️ No email in auth user:", user);
          // Try to get email from userData as immediate fallback
          if (userData?.email) {
            const fallbackEmail = userData.email.toLowerCase().trim();
            console.log("⚠️ Using userData email as fallback:", fallbackEmail);
            setAuthUserEmail(fallbackEmail);
          }
        }
      } catch (error) {
        console.error("❌ Failed to get auth user:", error);
      }
    };
    getAuthUser();
  }, [userData?.email]); // Re-run if userData.email becomes available
  
  // Track if userData has been loaded (not just null/undefined check)
  const userDataLoaded = !!userData?.email;

  // Debug: Log when userData loads/changes
  useEffect(() => {
    console.log("🔄 userData changed:", {
      hasEmail: !!userData?.email,
      email: userData?.email,
      userDataLoaded,
      authUserEmail
    });
  }, [userData?.email, userDataLoaded, authUserEmail]);

  const {
    data: membersResponse,
    error,
    isLoading,
  } = useListMembers(companyId || "");

  const removeMemberMutation = useRemoveMember();
  const updateRoleMutation = useUpdateMemberRole();

  // Tolerant access during build inference: some TS generics hide the response shape
  const teamMembers = useMemo(() => {
    return ((membersResponse as any)?.members || []) as any[];
  }, [membersResponse]);
  
  // Get current user's email - use authUserEmail first (most reliable), then fallback to userData
  const currentUserEmailNormalized = authUserEmail || userData?.email?.toLowerCase()?.trim() || null;
  
  // Get current user's actual role from teamMembers (from API) - more reliable than selectedCompany
  // Normalize emails for comparison (case-insensitive, trimmed)
  const currentUserMember = teamMembers.find((m: any) => {
    if (!currentUserEmailNormalized) return false;
    const memberEmail = m.user?.email?.toLowerCase()?.trim();
    return memberEmail === currentUserEmailNormalized && !!currentUserEmailNormalized;
  });
  const currentUserRole = currentUserMember?.role || selectedCompany?.role || "viewer";

  // Sync selectedCompany role with actual API role if it differs
  useEffect(() => {
    if (currentUserMember?.role && selectedCompany && currentUserMember.role !== selectedCompany.role) {
      console.log(`Role mismatch detected - updating selectedCompany role from "${selectedCompany.role}" to "${currentUserMember.role}"`);
      const { setSelectedCompany } = useCompanyStore.getState();
      setSelectedCompany({
        ...selectedCompany,
        role: currentUserMember.role,
      });
    }
  }, [currentUserMember, selectedCompany]);

  // Debug logging to verify role data
  useEffect(() => {
    if (currentUserMember) {
      console.log("Current user's role from API:", currentUserMember.role);
      console.log("Current user can perform admin actions:", 
        currentUserMember.role === "super_admin" || currentUserMember.role === "company_admin");
    }
  }, [currentUserMember]);

  console.log("teamMembers   ======> ", teamMembers);
  console.log("currentUserRole (from API)   ======> ", currentUserRole);
  console.log("selectedCompany   ======> ", selectedCompany);
  console.log("currentUserEmailNormalized   ======> ", currentUserEmailNormalized);
  console.log("currentUserMember found   ======> ", currentUserMember);
  console.log("userDataLoaded   ======> ", userDataLoaded);
  console.log("userData   ======> ", userData);
  console.log("userData?.email   ======> ", userData?.email);
  console.log("authUserEmail STATE   ======> ", authUserEmail); // ADDED
  
  // Use currentUserEmailNormalized (from auth or userData) or fallback to currentUserMember
  // Only use currentUserMember as fallback if we have teamMembers loaded
  const effectiveCurrentUserEmail = currentUserEmailNormalized || 
    (teamMembers.length > 0 ? currentUserMember?.user?.email?.toLowerCase()?.trim() : null);
  
  console.log("🔍 EMAIL SOURCES (FULL DEBUG):", {
    authUserEmail: authUserEmail || "NULL",
    userDataEmail: userData?.email || "NULL",
    currentUserEmailNormalized: currentUserEmailNormalized || "NULL",
    currentUserMemberEmail: currentUserMember?.user?.email || "NULL",
    effectiveCurrentUserEmail: effectiveCurrentUserEmail || "NULL", // This is the critical one
    teamMembersCount: teamMembers.length,
    hasCurrentUserMember: !!currentUserMember,
    typeOfEffective: typeof effectiveCurrentUserEmail
  });
  
  // CRITICAL: Log if effectiveCurrentUserEmail is missing
  if (!effectiveCurrentUserEmail && teamMembers.length > 0) {
    console.error("❌❌❌ CRITICAL: effectiveCurrentUserEmail is NULL/UNDEFINED when teamMembers are loaded!");
    console.error("This means action dots will NOT show properly!");
  }

  // Helper to get unique values for a given filter category
  function getUniqueFilterValues(category: string) {
    const values = new Set<string>();
    teamMembers.forEach((member: any) => {
      switch (category) {
        case "Status":
          if (member.status) values.add(member.status);
          break;
        case "Role":
          if (member.role) values.add(member.role);
          break;
        case "Created On":
          if (member.joined_at) {
            const dateStr = new Date(member.joined_at).toLocaleDateString(
              undefined,
              {
                year: "numeric",
                month: "short",
                day: "numeric",
              }
            );
            values.add(dateStr);
          }
          break;
        default:
          break;
      }
    });
    return Array.from(values);
  }

  // Filtered people based on search and filter dropdown
  const filteredPeople = useMemo(() => {
    if (!teamMembers || !Array.isArray(teamMembers)) return [];
    return teamMembers.filter((member: any) => {
      const matchesSearch = member.user?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ?? true;

    // Apply filter dropdown if selected
    let matchesFilter = true;
    if (selectedFilterCategory && selectedFilterValue) {
      switch (selectedFilterCategory) {
        case "Status":
          matchesFilter = member.status === selectedFilterValue;
          break;
        case "Role":
          matchesFilter = member.role === selectedFilterValue;
          break;
        case "Created On":
          const createdOnStr = member.joined_at
            ? new Date(member.joined_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "";
          matchesFilter = createdOnStr === selectedFilterValue;
          break;
        default:
          matchesFilter = true;
      }
    }

      return matchesSearch && matchesFilter;
    });
  }, [teamMembers, searchQuery, selectedFilterCategory, selectedFilterValue]);

  // Dynamic user counts
  const totalUsers = teamMembers.length;
  const activeUsers = teamMembers.filter((m: any) => m.status === "active").length;

  // Sorting logic
  const sortedPeople = useMemo(() => {
    if (!filteredPeople || filteredPeople.length === 0) return [];
    if (sortBy === "relevance") return filteredPeople;
    const sorted = [...filteredPeople];
    if (sortBy === "name") {
      sorted.sort((a, b) => (a.user?.name || "").localeCompare(b.user?.name || ""));
    } else if (sortBy === "designation") {
      sorted.sort((a, b) =>
        (a.user?.designation || "").localeCompare(b.user?.designation || "")
      );
    } else if (sortBy === "createdAt") {
      sorted.sort(
        (a, b) =>
          new Date(b.joined_at || 0).getTime() - new Date(a.joined_at || 0).getTime()
      );
    }
    return sorted;
  }, [filteredPeople, sortBy]);

  // Sort current user to the top, then admins, then others
  // IMPORTANT: Use currentUserMember email as fallback if userData.email not available
  const sortedAndFilteredPeople = useMemo(() => {
    if (!sortedPeople || sortedPeople.length === 0) return [];
    
    // Use currentUserMember email as fallback if userData.email is not available
    const currentUserEmail = effectiveCurrentUserEmail;
    
    // CRITICAL: Need teamMembers to be loaded to sort properly
    if (teamMembers.length === 0) {
      console.log("⏳ Waiting for teamMembers to load...");
      return [];
    }
    
    // If we don't have current user email from either source, just sort admins to top
    if (!currentUserEmail) {
      console.log("⏳ No current user email found, sorting admins to top only");
      return [...sortedPeople].sort((a, b) => {
        const aIsAdmin = a.role === "super_admin" || a.role === "company_admin";
        const bIsAdmin = b.role === "super_admin" || b.role === "company_admin";
        if (aIsAdmin && !bIsAdmin) return -1;
        if (!aIsAdmin && bIsAdmin) return 1;
        return 0;
      });
    }
    
    console.log("🔄 Sorting WITH current user email:", currentUserEmail, "Total users:", sortedPeople.length);
    
    const sorted = [...sortedPeople].sort((a, b) => {
      const aEmail = a.user?.email?.toLowerCase()?.trim();
      const bEmail = b.user?.email?.toLowerCase()?.trim();
      const aIsCurrentUser = aEmail === currentUserEmail;
      const bIsCurrentUser = bEmail === currentUserEmail;
      const aIsAdmin = a.role === "super_admin" || a.role === "company_admin";
      const bIsAdmin = b.role === "super_admin" || b.role === "company_admin";
      
      // Current user always at top
      if (aIsCurrentUser && !bIsCurrentUser) return -1;
      if (!aIsCurrentUser && bIsCurrentUser) return 1;
      
      // If both or neither are current user, then sort by admin status
      if (aIsCurrentUser && bIsCurrentUser) return 0; // Both are current user (shouldn't happen, but safe)
      
      // After current user, sort admins to top
      if (aIsAdmin && !bIsAdmin) return -1;
      if (!aIsAdmin && bIsAdmin) return 1;
      
      return 0; // Maintain original sort order for same priority items
    });
    
    // Verify current user is first
    const firstUser = sorted[0];
    const firstIsCurrentUser = firstUser?.user?.email?.toLowerCase()?.trim() === currentUserEmail;
    if (!firstIsCurrentUser && sorted.length > 0) {
      console.warn("⚠️ Sorting failed! Current user is NOT first:", {
        firstUserEmail: firstUser?.user?.email,
        currentUserEmail,
        firstUserRole: firstUser?.role,
        allEmails: sorted.map((m, idx) => `${idx + 1}. ${m.user?.email}`).join(", ")
      });
    } else {
      console.log("✅ Current user is FIRST in sorted list");
    }
    
    return sorted;
  }, [sortedPeople, effectiveCurrentUserEmail, teamMembers.length]);
  
  // Debug: Log the sorted order and verify current user is first
  useEffect(() => {
    if (sortedAndFilteredPeople.length > 0 && userDataLoaded && currentUserEmailNormalized) {
      const currentUserIndex = sortedAndFilteredPeople.findIndex(m => 
        m.user?.email?.toLowerCase()?.trim() === currentUserEmailNormalized
      );
      const isFirst = currentUserIndex === 0;
      console.log("🔍 Sorting Status:", {
        isFirst: isFirst ? "✅ YES" : "❌ NO",
        position: currentUserIndex + 1,
        totalUsers: sortedAndFilteredPeople.length,
        currentUserEmail: currentUserEmailNormalized,
        firstUserEmail: sortedAndFilteredPeople[0]?.user?.email
      });
      if (!isFirst) {
        console.warn("⚠️ Current user is NOT first! Expected position: 1, Actual:", currentUserIndex + 1);
      }
      console.log("🔍 First 3 users:", sortedAndFilteredPeople.slice(0, 3).map((m, idx) => ({
        position: idx + 1,
        name: m.user?.name,
        email: m.user?.email,
        isCurrentUser: m.user?.email?.toLowerCase()?.trim() === currentUserEmailNormalized,
        role: m.role
      })));
    } else {
      console.log("⏳ Waiting for data:", {
        hasUsers: sortedAndFilteredPeople.length > 0,
        userDataLoaded,
        hasCurrentUserEmail: !!currentUserEmailNormalized
      });
    }
  }, [sortedAndFilteredPeople, currentUserEmailNormalized, userDataLoaded]);

  function getInitials(name: string): string {
    if (!name) return "";

    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase();
  }

  // Handle remove member
  const handleRemoveMember = async () => {
    if (!companyId || !memberToDelete) {
      console.error("Missing companyId or memberToDelete", { companyId, memberToDelete });
      return;
    }

    removeMemberMutation.mutate(
      {
        company_id: companyId,
        member_user_id: memberToDelete.user_id,
      },
      {
        onSuccess: () => {
          setMemberToDelete(null);
        },
        onError: () => {
          setMemberToDelete(null);
        },
      }
    );
  };

  // Handle change role
  const handleChangeRole = async () => {
    if (!companyId || !memberToChangeRole || !newRole) return;

    updateRoleMutation.mutate(
      {
        company_id: companyId,
        member_user_id: memberToChangeRole.user_id,
        new_role: newRole as UserRole,
      },
      {
        onSuccess: () => {
          setMemberToChangeRole(null);
          setNewRole("");
        },
        onError: () => {
          setMemberToChangeRole(null);
          setNewRole("");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1" suppressHydrationWarning>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#3B43D6] flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
              <Badge
                variant="secondary"
                className="text-13 ml-2 relative"
                style={{ top: "-4px" }}
              >
                {isMounted && !isLoading ? filteredPeople.length.toLocaleString() : "0"}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {/* Only show "Add User" button if current user is admin or super admin */}
              {/* Wait for mount and ensure we have role data to prevent hydration mismatch */}
              {isMounted && teamMembers.length > 0 && (() => {
                // Get role from currentUserMember first (most reliable), then fallback to currentUserRole
                const roleToCheck = currentUserMember?.role || currentUserRole || "";
                const roleString = String(roleToCheck).toLowerCase().trim();
                const isAdmin = (roleString === "super_admin") || (roleString === "company_admin");
                
                // Debug log
                console.log("[Add User Button Check]:", {
                  roleToCheck,
                  roleString,
                  isAdmin,
                  currentUserMember: currentUserMember?.role,
                  currentUserRole,
                  shouldShow: isAdmin
                });
                
                // Only show button if user is admin or super admin
                if (!isAdmin) {
                  // NOT admin - hide button completely
                  return null;
                }
                
                // User IS admin - show button
                return (
                  <Button
                    onClick={() => setIsInviteModalOpen(true)}
                    variant="default"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white border-transparent"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                );
              })()}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search user"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-8 h-8 w-56 bg-white dark:bg-background border border-gray-200 dark:border-gray-600 rounded-sm text-sm focus:border-base-purple text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filter button with applied filter text */}
              <div className="relative flex items-center gap-2">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-1 h-8 px-3 bg-white dark:bg-background border border-gray-200 dark:border-gray-600 rounded-sm text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-accent"
                  aria-label="Filter"
                >
                  <ListFilter className="h-4 w-4" />
                  {selectedFilterCategory && selectedFilterValue ? (
                    <>
                      <span>Filter: {selectedFilterValue}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFilterCategory(null);
                          setSelectedFilterValue(null);
                          setShowFilterDropdown(false);
                        }}
                        className="ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        aria-label="Clear filter"
                      >
                        &times;
                      </button>
                    </>
                  ) : (
                    <span>Filter</span>
                  )}
                </button>

                {/* Filter dropdown panel */}
                {showFilterDropdown && (
                  <div
                    ref={filterDropdownRef}
                    className="absolute top-full right-0 mt-1 bg-white dark:bg-background border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50 p-1 popover-shadow"
                  >
                    <div className="flex gap-2">
                      <Select
                        value={selectedFilterCategory || ""}
                        onValueChange={(value) => {
                          setSelectedFilterCategory(value || null);
                          setSelectedFilterValue(null);
                        }}
                      >
                        <SelectTrigger className="h-7 w-48 bg-white dark:bg-background border border-gray-200 dark:border-gray-600 rounded-sm text-13 text-gray-900 dark:text-gray-100">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-background border border-gray-200 dark:border-gray-600 shadow-lg popover-shadow">
                          <SelectItem value="Status">Status</SelectItem>
                          <SelectItem value="Role">Role</SelectItem>
                          <SelectItem value="Created On">Created On</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={selectedFilterValue || ""}
                        onValueChange={(value) => {
                          setSelectedFilterValue(value || null);
                          setShowFilterDropdown(false);
                        }}
                        disabled={!selectedFilterCategory}
                      >
                        <SelectTrigger className="h-7 w-48 bg-white dark:bg-background border border-gray-200 dark:border-gray-600 rounded-sm text-13 text-gray-900 dark:text-gray-100">
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-background border border-gray-200 dark:border-gray-600 shadow-lg popover-shadow">
                          {selectedFilterCategory &&
                            getUniqueFilterValues(selectedFilterCategory).map(
                              (val) => (
                                <SelectItem key={val} value={val}>
                                  {val}
                                </SelectItem>
                              )
                            )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center gap-3 -mb-3">
            <div className="flex flex-row gap-4 items-center">
              <div className="flex items-center text-sm font-semibold">
                Account:&nbsp;
                <span className="inline-block text-sm font-normal text-ellipsis max-w-[70%] overflow-hidden whitespace-nowrap">
                  {selectedCompany?.name || "-"}
                </span>
                {(currentUserRole === "company_admin" ||
                  currentUserRole === "super_admin") && (
                  <span className="text-sm text-gray-500 dark:text-gray-300 font-normal">
                    &nbsp;(ID:{" "}
                    {selectedCompany?.companyId?.slice(-8) || "--------"})
                  </span>
                )}
              </div>

              <div className="flex flex-row gap-2">
                <div className="px-2 py-[2px] bg-sky-200 text-black text-xs font-normal rounded hover:bg-sky-200 cursor-pointer">
                  Total Users: {totalUsers}
                </div>
                <div className="px-2 py-[2px] bg-purple-200 text-black text-xs font-normal rounded hover:bg-purple-200 cursor-pointer">
                  Active Users: {activeUsers}
                </div>
                <div className="px-2 py-[2px] bg-red-300 text-black text-xs font-normal rounded hover:bg-red-300 cursor-pointer">
                  Paid Users: 0
                </div>
              </div>
            </div>

            {/* {["Owner"].includes("Owner") && 10 >= 10 && (
              <div className="flex items-center gap-2 pr-3">
                <div className="text-sm text-orange-500 flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-[18px] w-[18px] text-orange-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01M12 5.5C7.80558 5.5 4.5 8.80558 4.5 13C4.5 17.1944 7.80558 20.5 12 20.5C16.1944 20.5 19.5 17.1944 19.5 13C19.5 8.80558 16.1944 5.5 12 5.5Z"
                    />
                  </svg>
                  Reached maximum{" "}
                  <span className="font-semibold">Paid User</span> limit
                </div>
                <div className="relative group">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-500 cursor-pointer"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                    />
                  </svg>
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-white border border-gray-300 text-gray-800 text-xs px-2 py-1 rounded shadow w-64">
                    Active users is used to calculate user limit. You can either
                    delete or deactivate a user to stay within user limit.
                  </div>
                </div>
                <button
                  onClick={() => (window.location.href = "/settings/checkout")}
                  className="text-indigo-600 text-sm font-medium hover:underline"
                >
                  Add users
                </button>
              </div>
            )} */}
          </div>

          {/* Results Count and Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            {/* <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-auto min-w-[140px] h-9 bg-background text-foreground border-input [&>svg]:hidden">
                <div className="flex items-center gap-2">
                  <span>
                    Sort by:{" "}
                    {sortBy === "relevance"
                      ? "Relevance"
                      : sortBy === "name"
                      ? "Name"
                      : sortBy === "designation"
                      ? "Designation"
                      : sortBy === "createdAt"
                      ? "Created At"
                      : sortBy}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="designation">Designation</SelectItem>
                <SelectItem value="createdAt">Created At</SelectItem>
              </SelectContent>
            </Select> */}
          </div>
        </div>

        {/* People Table (replaces People Grid) */}
        {error ? (
          <div className="col-span-full">
            <div className="flex justify-center items-center gap-2 py-8">
              <span>Error:</span>
              <span className="text-sm text-error-red ">
                These is some problem in fetching members data
              </span>
            </div>
          </div>
        ) : (isLoading || (sortedAndFilteredPeople && sortedAndFilteredPeople.length > 0)) ? (
          <Table className="bg-background rounded-lg border-t border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400">
            <TableHeader className="text-13">
              <TableRow className="border-b border-gray-100 dark:border-gray-700 hover:bg-transparent h-7">
                <TableHead className="font-medium py-0 text-gray-500 dark:text-gray-100 h-7">
                  Name
                </TableHead>
                <TableHead className="font-medium py-0 text-gray-500 dark:text-gray-100 h-7">
                  Status
                </TableHead>
                <TableHead className="font-medium py-0 text-gray-500 dark:text-gray-100 h-7">
                  Role
                </TableHead>
                <TableHead className="font-medium py-0 text-gray-500 dark:text-gray-100 h-7">
                  Designation
                </TableHead>
                <TableHead className="font-medium py-0 text-gray-500 dark:text-gray-100 h-7">
                  Joined On
                </TableHead>
                <TableHead className="font-medium py-0 text-gray-500 dark:text-gray-100 h-7 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 3 }).map((_, idx) => (
                    <TableRow
                      key={"skeleton-" + idx}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-transparent"
                    >
                      <TableCell className="px-3 py-1">
                        <div className="flex items-center gap-3 min-w-0">
                          <Skeleton className="h-8 w-8" />
                          <div className="min-w-0 w-full">
                            <Skeleton className="h-4 w-24 mb-1" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-1">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell className="px-3 py-1">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell className="px-3 py-1">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="px-3 py-1">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="px-3 py-1 hidden lg:table-cell">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="px-3 py-1 hidden lg:table-cell">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                : (sortedAndFilteredPeople || []).map((member: any) => (
                    <TableRow
                      key={member.user_id}
                      className="text-13 border-b border-gray-100 dark:border-gray-700 hover:bg-transparent"
                    >
                      <TableCell className="px-3 py-1">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={member.user?.profile_image || "/placeholder.svg"}
                              alt={member.user?.name || "User"}
                            />
                            <AvatarFallback
                              className={`text-white font-medium bg-green-400`}
                            >
                              {getInitials(member.user?.name || "")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-900 dark:text-gray-100">
                                {member.user?.name || "-"}
                              </span>
                              {(() => {
                                // Check if this is the current user using the reliable email source
                                const memberEmail = String(member.user?.email || "").toLowerCase().trim();
                                const currentEmail = effectiveCurrentUserEmail ? String(effectiveCurrentUserEmail).toLowerCase().trim() : "";
                                const isCurrentUser = memberEmail === currentEmail && memberEmail !== "" && currentEmail !== "";
                                return isCurrentUser ? (
                                  <Badge className="bg-white dark:bg-background text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-[4px] px-1 py-0.5 text-xs font-medium card-border">
                                    You
                                  </Badge>
                                ) : null;
                              })()}
                            </div>
                            <p className="text-muted-foreground truncate">
                              {member.user?.email || "-"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-1">
                        <Badge
                          variant="secondary"
                          className="bg-[#acdc79] text-[#25301b] dark:bg-[#25301b] dark:text-[#acdc79]"
                        >
                          {member.status === "active" ? "Active" : member.status || "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-1">
                        <span className="text-gray-900 dark:text-gray-100">
                          {member.role === "company_admin"
                            ? "Admin"
                            : member.role === "super_admin"
                            ? "Super Admin"
                            : member.role === "member"
                            ? "Member"
                            : member.role === "viewer"
                            ? "Viewer"
                            : member.role}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-1">
                        <span className="text-gray-900 dark:text-gray-100">
                          {member.user?.designation || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-1 hidden lg:table-cell">
                        <span className="text-gray-900 dark:text-gray-100">
                          {member.joined_at
                            ? new Date(member.joined_at)
                                .toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                                .replace(/(\w+)\s+(\d+)/, "$1, $2")
                            : "-"}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-1 text-right">
                        {(() => {
                          // Only render ActionDotsCell if we have the current user's email
                          if (!effectiveCurrentUserEmail || teamMembers.length === 0) {
                            return null;
                          }
                          
                          // CRITICAL PRE-CHECK: Determine if we should show action dots BEFORE rendering component
                          // This prevents rendering the ActionDotsCell component entirely for users who shouldn't see dots
                          
                          // Normalize emails for strict comparison
                          const memberEmail = String(member.user?.email || "").toLowerCase().trim();
                          const currentUserEmailNormalized = String(effectiveCurrentUserEmail).toLowerCase().trim();
                          
                          // Both emails must be non-empty strings and exactly equal
                          const isCurrentUser = memberEmail !== "" && 
                                                currentUserEmailNormalized !== "" && 
                                                memberEmail === currentUserEmailNormalized;
                          
                          // Check role - must be exactly "super_admin" or "company_admin" (case-insensitive)
                          const roleString = String(currentUserRole || "").toLowerCase().trim();
                          const isAdmin = (roleString === "super_admin") || (roleString === "company_admin");
                          const isCompanyAdminViewingSuperAdmin = (roleString === "company_admin") && (String(member?.role || "").toLowerCase().trim() === "super_admin");

                          // Only show dots if: (current user is admin) OR (this is the current user)
                          // If BOTH are false, do NOT render component at all
                          // We still render for company_admin viewing super_admin so we can show a disabled button
                          const shouldShowDots = (isAdmin === true || isCurrentUser === true) || isCompanyAdminViewingSuperAdmin;
                          
                          // STRICT CHECK: If we shouldn't show dots, return null immediately (no component render)
                          if (!shouldShowDots) {
                            // NOT admin AND NOT current user = absolutely NO action dots
                            // Return null to prevent any rendering
                            return null;
                          }
                          
                          // At this point, we know:
                          // - Either current user is admin (can see dots for all)
                          // - Or this IS the current user (can see dots for themselves)
                          // Safe to render ActionDotsCell component
                          return (
                            <ActionDotsCell
                              key={`${member.user_id}-${effectiveCurrentUserEmail}-${currentUserRole}`}
                              member={member}
                              currentUserEmail={effectiveCurrentUserEmail}
                              currentUserRole={currentUserRole}
                              onEdit={() => {
                                setMemberToEdit(member);
                                setIsEditModalOpen(true);
                              }}
                              onChangeRole={() => {
                                setMemberToChangeRole(member);
                                setNewRole(member.role as UserRole);
                              }}
                              onDelete={() => setMemberToDelete(member)}
                            />
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        ) : null}

        {/* No Results - Only show if data has loaded, search/filter applied, and no results */}
        {!isLoading && !error && teamMembers.length > 0 && filteredPeople.length === 0 && (searchQuery || selectedFilterCategory) && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-13">
              No users found matching your search or filters.
            </p>
          </div>
        )}
        
        {/* Show when data has loaded but no users exist at all (only after loading completes) */}
        {!isLoading && !error && teamMembers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-13">
              No users found. Click "Add User" to invite team members.
            </p>
          </div>
        )}
      </div>

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        companyId={companyId || ""}
        companyName={selectedCompany?.name}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setMemberToEdit(null);
        }}
        member={memberToEdit}
        companyId={companyId || ""}
        currentUserEmail={effectiveCurrentUserEmail || userData?.email}
        isCurrentUserAdmin={currentUserRole === "super_admin" || currentUserRole === "company_admin"}
        currentUserRole={currentUserRole}
      />

      {/* Delete Member Confirmation Dialog */}
      <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{memberToDelete?.user?.name}</strong> from this organization? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Role Dialog */}
      <AlertDialog open={!!memberToChangeRole} onOpenChange={() => setMemberToChangeRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Member Role</AlertDialogTitle>
            <AlertDialogDescription>
              Change the role for <strong>{memberToChangeRole?.user?.name}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={(val) => setNewRole(val as UserRole)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="company_admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setMemberToChangeRole(null);
              setNewRole("");
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangeRole}>
              Update Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

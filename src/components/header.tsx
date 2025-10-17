"use client";
import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
// import { ThemeToggle } from "@/components/theme-toggle"; // Hidden for now

import { useAuthStore } from "@/stores/auth-store";
import { useAuth } from "@/hooks/use-auth";
import { useUserStore } from "@/stores/user-store";
import { useCompanyStore } from "@/stores/company-store";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { redirect, useRouter } from "next/navigation";
import { LogOut, User, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useUserProfileDetails } from "@/lib/queries/useUserProfileDetails";
import { getInitials } from "@/utils/user.util";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";


// Memoized CompanyDropdown component for better performance
const CompanyDropdown = memo(() => {
  const companies = useCompanyStore((s) => s.companies);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const setSelectedCompany = useCompanyStore((s) => s.setSelectedCompany);
  const [isOpen, setIsOpen] = useState(false);

  const handleCompanySelect = useCallback((company: any) => {
    setSelectedCompany(company);
  }, [setSelectedCompany]);

  const companiesList = useMemo(() => companies, [companies]);

  if (!companiesList.length) return null;

  return (
    <DropdownMenu onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button className="px-2 sm:px-3 py-1 h-[26px] rounded border bg-filter-menu dark:hover:bg-accent flex items-center gap-1.5 sm:gap-2 border-gray-200 dark:border-gray-600 cursor-pointer whitespace-nowrap">
          <div className="flex flex-col items-start min-w-0">
            <span className="text-xs sm:text-13 font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px] sm:max-w-none">
              {selectedCompany ? selectedCompany.name : "Select Company"}
            </span>
          </div>
          {isOpen ? (
            <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-[200px] p-0 popover-shadow bg-white dark:bg-background border border-gray-200 dark:border-gray-600"
      >
        {/* Header */}
        <div className="pl-2 pr-4 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
          Switch account
        </div>

        {/* Company List */}
        <div className="py-1">
          {companiesList.map((company) => (
            <DropdownMenuItem
              key={company.companyId}
              onClick={() => handleCompanySelect(company)}
              className="px-0 py-2 text-13 hover:bg-[var(--url-color)] focus:bg-gray-50 dark:focus:bg-accent focus:text-gray-900 dark:focus:text-gray-100 cursor-pointer flex items-center rounded-none justify-between w-full"
            >
              <div className="px-4 w-full flex items-center justify-between">
                <span
                  className={`text-gray-900 dark:text-gray-100 ${
                    selectedCompany &&
                    selectedCompany.companyId === company.companyId
                      ? "font-medium"
                      : ""
                  }`}
                >
                  {company.name}
                </span>
                {selectedCompany &&
                  selectedCompany.companyId === company.companyId && (
                    <svg
                      className="w-4 h-4 text-purple-600 dark:text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

CompanyDropdown.displayName = 'CompanyDropdown';

// Export memoized Header component for better performance
export const Header = memo(function Header() {
  const router = useRouter();
  const [storedId, setStoredId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const { setUserData, clearUserData } = useUserStore();
  const { logout } = useAuth();
  const { setCompanies, setSelectedCompany } = useCompanyStore();
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const [confirmSignOutOpen, setConfirmSignOutOpen] = useState(false);

  // Get user data from user store
  const { userData } = useUserStore();
  const profilePictureUrl = userData?.profileImage;

  useEffect(() => {
    // Access localStorage only on client side
    setStoredId(localStorage.getItem("user_id"));
  }, []);

  const { data } = useUserProfileDetails(
    storedId || "",
    selectedCompany?.companyId || ""
  );

  useEffect(() => {
    if (data?.data && storedId) {
      // Ensure userId is always a string before setting userData
      const fixedData = {
        ...data.data,
        userId:
          typeof data.data.userId === "string"
            ? data.data.userId
            : data.data.userId?.toString?.() ?? "",
        banner: {
          ...data.data.banner,
          image: data.data.banner?.image ?? "",
        },
        memberStatus: Array.isArray(data.data.memberStatus)
          ? data.data.memberStatus[0] ?? ""
          : data.data.memberStatus ?? "",
        // Ensure createdAt and updatedAt are strings
        createdAt:
          typeof data.data.createdAt === "string"
            ? data.data.createdAt
            : data.data.createdAt?.toISOString?.() ?? "",
        updatedAt:
          typeof data.data.updatedAt === "string"
            ? data.data.updatedAt
            : data.data.updatedAt?.toISOString?.() ?? "",
      };
      setUserData(fixedData);
    }
  }, [data, setUserData, storedId]);

  // Theme is handled via <ThemeToggle /> component

  const handleSignOutConfirm = useCallback(async () => {
    await logout();
    setConfirmSignOutOpen(false);
  }, [logout]);

  // Memoized values for performance
  const headerImageSrc = useMemo(() => 
    process.env.NEXT_PUBLIC_LOGO_URL || "/assets/poligap-logo.png",
    []
  );
  
  const searchEnabled = useMemo(() => false, []);
  
  const userInitials = useMemo(() => 
    getInitials(userData?.name) || "",
    [userData?.name]
  );

  const handleLogoClick = useCallback(() => {
    router.push('/home');
  }, [router]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const q = searchText.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchText("");
  }, [searchText, router]);

  return (
    <header className="bg-[#FAFAFB] dark:bg-background shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] sticky top-0 z-50 mx-[17px] mt-[15px] rounded-[10px]">
      <div className="w-full flex items-center justify-between h-14 px-3 sm:px-4 md:px-6 lg:px-8">
        <ConfirmDialog
          open={confirmSignOutOpen}
          title="Sign out?"
          description="You'll be signed out of Poligap and will need to log in again."
          confirmText="Sign Out"
          confirmVariant="destructive"
          onCancel={() => setConfirmSignOutOpen(false)}
          onConfirm={handleSignOutConfirm}
        />
        {/* Logo Section */}
        <div className="flex items-center flex-shrink-0 min-w-0">
          <img
            src={headerImageSrc}
            alt="Poligap"
            className="h-9 sm:h-10 md:h-11 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity select-none pointer-events-auto"
            onClick={handleLogoClick}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
        </div>

        {/* Center - Empty for now (matches Figma design) */}
        <div className="flex-1 min-w-0" />

        {/* Right Section - Profile */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
          {/* Companies Drop Down */}
          <div className="hidden sm:block">
            <CompanyDropdown />
          </div>

          {/* Theme Switcher - Hidden for now */}
          {/* <div className="flex-shrink-0">
            <ThemeToggle />
          </div> */}

          {/* Profile Picture */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full cursor-pointer p-0 hover:bg-transparent flex-shrink-0"
              >
                <Avatar className="h-full w-full ring-0 border-0">
                  <AvatarImage src={profilePictureUrl} alt="Profile" />
                  <AvatarFallback className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs sm:text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-80 popover-shadow text-13"
              align="end"
              forceMount
            >
              {/* User Info */}
              <div className="flex flex-col items-start px-4 py-3">
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={profilePictureUrl} alt="Profile" />
                    <AvatarFallback>
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-base">
                      {userData?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {userData?.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Full width separator */}
              <div className="w-full h-px bg-gray-200" />

              {/* Menu Options */}

              <DropdownMenuItem className="text-gray-500 pointer-events-none select-none px-0 rounded-none">
                <div className="px-4 w-full flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date()
                    .toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                    .replace(/\s?(am|pm)$/i, (match) => match.toUpperCase())}
                  &nbsp;local time
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem className="pointer-events-none select-none px-0 rounded-none">
                {selectedCompany?.name && (
                  <div className="px-4 w-full">
                    <span className="font-medium">Account:</span>{" "}
                    {selectedCompany.name}
                  </div>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer px-0 rounded-none hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-900"
                onClick={() => redirect("/profile")}
              >
                <div className="px-4 w-full flex items-center">
                  <User className="mr-2 h-4 w-4" /> My Profile
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer px-0 rounded-none hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-900"
                onClick={() => setConfirmSignOutOpen(true)}
              >
                <div className="px-4 w-full flex items-center">
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
});

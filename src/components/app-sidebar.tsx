"use client";

import * as React from "react";
import {
  ChevronLeft,
  CheckSquare,
  MessageCircle,
  Shield,
  FileText,
  Bot,
  Settings,
  Home,
  Upload,
  History,
  NotebookPen,
  BookOpen,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import Link from "next/link";
import { usePathname } from "next/navigation";
// import useGlobalChatStore from "@/app/(app)/chat/store/global-chat-store";
import { useCompanyStore } from "@/stores/company-store";

// Define page types for type safety
type PageType =
  | "dashboard"
  | "home"
  | "my-tasks"
  | "chat"
  | "compliance-check"
  | "contract-review"
  | "policy-generator"
  | "idea-analyzer"
  | "ai-agents"
  | "rulebase"
  | "upload-assets"
  | "history"
  | "how-to-use"
  | "settings";

const navigationItems = [
  {
    title: "Home",
    icon: Home,
    page: "/home" as PageType,
  },
  {
    title: "My Tasks",
    icon: CheckSquare,
    page: "/my-tasks" as PageType,
  },
  {
    title: "Chat",
    icon: MessageCircle,
    page: "/chat" as PageType,
  },
  {
    title: "Compliance Check",
    icon: Shield,
    page: "/compliance-check" as PageType,
  },
  {
    title: "Contract Review",
    icon: FileText,
    page: "/contract-review" as PageType,
  },
  {
    title: "Policy Generator",
    icon: BookOpen,
    page: "/policy-generator" as PageType,
  },
  // {
  //   title: "Idea Analyzer",
  //   icon: Lightbulb,
  //   page: "/idea-analyzer" as PageType,
  //   beta: true,
  // },
  {
    title: "AI Agents",
    icon: Bot,
    page: "/ai-agents" as PageType,
  },
  {
    title: "RuleBase",
    icon: NotebookPen,
    page: "/rulebase" as PageType,
  },
  {
    title: "Upload Assets",
    icon: Upload,
    page: "/upload-assets" as PageType,
  },
  {
    title: "History",
    icon: History,
    page: "/history" as PageType,
  },
];

const bottomNavigationItems = [
  {
    title: "How to Use",
    icon: HelpCircle,
    page: "/how-to-use" as PageType,
  },
  {
    title: "Settings",
    icon: Settings,
    page: "/settings" as PageType,
  },
];

// Main component that renders the appropriate page based on the active page state
export function AppSidebar() {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const pathname = usePathname();
  const currentPage = pathname ? `/${pathname.split("/")[1]}` : "/";

  // Get selected company role from the store
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const userRole = selectedCompany ? selectedCompany.role : "User";

  // Show all navigation items for Poligap interface
  const visibleNavigationItems = navigationItems;

  // Show all bottom navigation items for Poligap interface
  const visibleBottomNavigationItems = bottomNavigationItems;

  // console.log("visibleBottomNavigationItems =>", visibleBottomNavigationItems);

  // const setMessages = useGlobalChatStore((state) => state.setMessages);

  const MenuItemWithTooltip = ({
    title,
    href,
    icon: Icon,
    isActive,
    beta,
  }: {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    isActive: boolean;
    beta?: boolean;
  }) => {
    const buttonContent = (
      <div
        className={`group flex items-center gap-2.5 px-2.5 py-1.5 w-full rounded-md transition-all duration-200 cursor-pointer ${
          isActive
            ? "bg-gray-100 text-gray-900 font-medium rounded-md"
            : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100"
        }`}
      >
        <div className="flex items-center justify-center w-4 h-4 flex-shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <span
          className={`nav-text transition-opacity duration-300 whitespace-nowrap ${
            sidebarCollapsed
              ? "opacity-0 w-0 overflow-hidden"
              : "opacity-100"
          }`}
        >
          {title}
          {beta && !sidebarCollapsed && (
            <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full border text-[10px] leading-none bg-yellow-50 border-yellow-200 text-yellow-700">Beta</span>
          )}
        </span>
      </div>
    );

    if (sidebarCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={href} className="block" prefetch={true}>
              {buttonContent}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" className="font-normal">
            {title}
          </TooltipContent>
        </Tooltip>
      );
    }
    
    return (
      <Link href={href} className="block" prefetch={true}>
        {buttonContent}
      </Link>
    );
  };

  return (
    <div className="flex h-[calc(100vh-44px)] overflow-hidden">
      <TooltipProvider delayDuration={300}>
        <SidebarProvider>
          {/* Sidebar */}
          <div
            className={`border-r border-border ${
              sidebarCollapsed ? "w-[60px]" : "w-[200px]"
            } transition-all duration-300 flex flex-col h-[calc(100vh-44px)] overflow-hidden relative group`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Collapse Button - Always takes up space but only visible on hover */}
            <div className="flex justify-end p-1.5 h-6">
              {" "}
              {/* Fixed height to prevent layout shift */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className={`h-6 w-6 absolute top-0 right-0 cursor-pointer hover:bg-filter-menu rounded-bl-md rounded-tr-none rounded-tl-none rounded-br-none transition-opacity duration-200 ${
                      isHovered ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <ChevronLeft
                      className={`h-4 w-4 transition-transform ${
                        sidebarCollapsed ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  align="start"
                  className="font-normal"
                >
                  {sidebarCollapsed ? "Expand" : "Collapse"}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* New Chat Button */}
            {/* <div className="px-2">
              <MenuItemWithTooltip title="New Chat">
                <Button
                  className={`bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer flex items-center justify-center px-3 py-2 w-full ${
                    !sidebarCollapsed ? "gap-3" : ""
                  }`}
                  onClick={() => {
                    useGlobalChatStore.setState({
                      selectedConversation: {
                        _id: "",
                        chatName: "",
                        createdAt: new Date().toISOString(),
                      },
                      messages: [],
                    });
                  }}
                >
                  <div className="flex items-center justify-center w-4 h-4 flex-shrink-0">
                    <Plus className="h-4 w-4" />
                  </div>
                  {!sidebarCollapsed && (
                    <span className="text-13 transition-opacity duration-300">
                      <Link href={"/chat"} prefetch={true}>New Chat</Link>
                    </span>
                  )}
                </Button>
              </MenuItemWithTooltip>
            </div> */}

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto pt-2 pb-1">
              <div className="px-1 space-y-1">
                {visibleNavigationItems.map((item) => (
                  <MenuItemWithTooltip
                    key={item.title}
                    title={item.title}
                    href={item.page}
                    icon={item.icon}
                    isActive={currentPage === item.page}
                    beta={(item as any).beta}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Navigation Items */}
            <div className="mt-auto border-t border-gray-200 dark:border-slate-700 mt-4 pt-2">
              <div className="px-1 space-y-1">
                {visibleBottomNavigationItems.map((item) => (
                  <MenuItemWithTooltip
                    key={item.title}
                    title={item.title}
                    href={item.page}
                    icon={item.icon}
                    isActive={currentPage === item.page}
                  />
                ))}
              </div>
            </div>
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  );
}

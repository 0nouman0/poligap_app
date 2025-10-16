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
    const [isHovering, setIsHovering] = React.useState(false);
    
    const buttonContent = (
      <div
        className={`group flex items-center gap-1 w-full transition-all duration-300 cursor-pointer relative ${
          isActive ? "font-medium" : ""
        }`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className={`flex items-center justify-center w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
          isHovering && !isActive ? "scale-110" : ""
        }`}>
          <Icon 
            className={`w-5 h-5 transition-all duration-300 ${
              isActive 
                ? "text-[#3B43D6]" 
                : isHovering 
                  ? "text-[#5B5B5B]" 
                  : "text-[#717171]"
            }`}
          />
        </div>
        <span
          className={`nav-text transition-all duration-300 whitespace-nowrap text-sm ${
            sidebarCollapsed
              ? "opacity-0 w-0 overflow-hidden"
              : "opacity-100"
          } ${
            isActive 
              ? "text-[#3B43D6]" 
              : isHovering 
                ? "text-[#5B5B5B]" 
                : "text-[#717171]"
          }`}
        >
          {title}
          {beta && !sidebarCollapsed && (
            <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full border text-[10px] leading-none bg-yellow-50 border-yellow-200 text-yellow-700 animate-pulse">Beta</span>
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
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      <TooltipProvider delayDuration={300}>
        <SidebarProvider>
          {/* Sidebar */}
          <div
            className={`bg-[#FAFAFB] dark:bg-background shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)] hover:shadow-[0px_0px_20px_0px_rgba(19,43,76,0.15)] rounded-[10px] my-[15px] ml-[17px] border-r border-gray-200 ${
              sidebarCollapsed ? "w-[60px]" : "w-[218px]"
            } transition-all duration-500 ease-in-out flex flex-col h-[calc(100vh-86px)] overflow-hidden relative group`}
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
                    className={`h-6 w-6 absolute top-0 right-0 cursor-pointer hover:bg-gray-100 hover:scale-110 rounded-bl-md rounded-tr-[10px] rounded-tl-none rounded-br-none transition-all duration-300 ${
                      isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
                    }`}
                  >
                    <ChevronLeft
                      className={`h-4 w-4 transition-all duration-500 ease-in-out ${
                        sidebarCollapsed ? "rotate-180" : "rotate-0"
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
            <div className="flex-1 overflow-y-auto pt-[22px] pb-1 scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
              <div className={`px-5 flex flex-col gap-6 transition-all duration-300 ${sidebarCollapsed ? 'px-2' : 'px-5'}`}>
                {visibleNavigationItems.map((item, index) => (
                  <div
                    key={item.title}
                    className="transition-all duration-300 ease-out"
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    <MenuItemWithTooltip
                      title={item.title}
                      href={item.page}
                      icon={item.icon}
                      isActive={currentPage === item.page}
                      beta={(item as any).beta}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Navigation Items */}
            <div className="mt-auto border-t border-gray-200 dark:border-slate-700 pt-3 pb-4 transition-all duration-300">
              <div className={`flex flex-col gap-6 transition-all duration-300 ${sidebarCollapsed ? 'px-2' : 'px-5'}`}>
                {visibleBottomNavigationItems.map((item, index) => (
                  <div 
                    key={item.title} 
                    className="opacity-40 hover:opacity-100 transition-all duration-300 ease-in-out"
                    style={{
                      transitionDelay: `${index * 50}ms`
                    }}
                  >
                    <MenuItemWithTooltip
                      title={item.title}
                      href={item.page}
                      icon={item.icon}
                      isActive={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  );
}

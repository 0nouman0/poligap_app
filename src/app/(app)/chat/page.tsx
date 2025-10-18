"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChatArea } from "./components";
import ChatErrorBoundary from "./components/ChatErrorBoundary";
import type { SelectedLanguageType, MediaTypeProps } from "./types/agent";
import RecentChats from "./recent-chats";
import { Button } from "@/components/ui/button";
import RecentChatIcon from "@/assets/icons/doc-comment-icon.svg";
import useGlobalChatStore from "./store/global-chat-store";
import { useCompanyStore } from "@/stores/company-store";
import { useUserStore } from "@/stores/user-store";
import { ChatSkeleton } from "@/components/ui/page-loader";
import { Skeleton } from "@/components/ui/skeleton";

// Force dynamic rendering for real-time chat functionality
export const dynamic = 'force-dynamic';

const AgentChat = () => {
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const searchParams = useSearchParams();
  // Only use companyId if it's a valid UUID format, otherwise null
  const companyId = selectedCompany?.companyId && 
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedCompany.companyId)
    ? selectedCompany.companyId 
    : null;
  const { userData } = useUserStore();
  
  // Better user ID handling with proper fallbacks
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const getUserId = () => {
      if (typeof window === 'undefined') return "";
      
      const storedUserId = localStorage.getItem('user_id');
      
      // Priority: userData from store > localStorage > fallback
      if (userData?.userId && userData.userId !== "undefined" && userData.userId !== "null") {
        return userData.userId;
      } else if (storedUserId && storedUserId !== "undefined" && storedUserId !== "null") {
        return storedUserId;
      } else {
        // Use environment variable fallback or default
        return process.env.NEXT_PUBLIC_FALLBACK_USER_ID || "68da404605eeba8349fc9d10";
      }
    };

    const id = getUserId();
    setUserId(id);
    console.log("Chat page - userData?.userId:", userData?.userId, "localStorage:", localStorage.getItem('user_id'), "final userId:", id, "companyId:", companyId);
  }, [userData?.userId, companyId]);

  // recent chats
  const [isMobile, setIsMobile] = useState(false);

  // State and constants
  const [recentChatsOpen, setRecentChatsOpen] = useState(true);

  // Get messages and setMessages from global store
  const messages = useGlobalChatStore((state) => state.messages);
  const setMessages = useGlobalChatStore((state) => state.setMessages);

  const [inputMessage, setInputMessage] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4.1-mini");
  const [selectedLanguage, setSelectedLanguage] =
    useState<SelectedLanguageType>({ code: "en", name: "English" });

  const [medias] = useState<MediaTypeProps[] | undefined>(undefined);

  const {
    createConversationAPI,
    selectedConversation,
    generateConversationTitle,
  } = useGlobalChatStore();

  console.log("selectedConversation ==> ", selectedConversation);

  // Constants (customize as needed)
  const agent_id = "123";
  const agno_id = "Global_chat";
  const agent_name = undefined;
  const isTrained = false;
  const enabledKnowledge = false;
  const isPublic = false;
  const publicCompanyId = undefined;
  const publicUserId = undefined;
  const user_description = undefined;
  const user_instructions = undefined;
  const exportReactComponentAsPDF = undefined;

  // Handler stubs (customize as needed)
  const handleCreateChat = async () => {
    try {
      if (!userId) {
        console.warn("No userId available for creating conversation");
        return null;
      }
      
      const conversation = await createConversationAPI({ companyId, userId });
      setMessages([]);
      return conversation;
    } catch (error) {
      console.error("Failed to create conversation:", error);
      return null;
    }
  };

  const handleCreateProject = undefined;
  const handleCreateDoc = undefined;

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setRecentChatsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Prefill input from global header search (?q=...)
  useEffect(() => {
    const q = searchParams?.get("q");
    if (q) {
      setInputMessage(q);
    }
  }, [searchParams, setInputMessage]);

  const toggleRecentChats = () => {
    setRecentChatsOpen(!recentChatsOpen);
  };

  // Don't render until we have a userId
  if (!userId) {
    return (
      <main className="flex h-full items-center justify-center p-8">
        <div className="w-full max-w-4xl space-y-4">
          {/* Chat Header Skeleton */}
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>

          {/* Messages Skeleton */}
          <div className="space-y-4">
            {/* User message */}
            <div className="flex justify-end">
              <div className="max-w-[70%] space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5 ml-auto" />
              </div>
            </div>

            {/* Bot message */}
            <div className="flex justify-start">
              <div className="max-w-[70%] space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>

            {/* User message */}
            <div className="flex justify-end">
              <div className="max-w-[70%] space-y-2">
                <Skeleton className="h-4 w-full" />
              </div>
            </div>

            {/* Bot message */}
            <div className="flex justify-start">
              <div className="max-w-[70%] space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          </div>

          {/* Input Area Skeleton */}
          <div className="mt-6 pt-4 border-t">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background">
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {/* Toggle button for recent chats */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          {(!recentChatsOpen || isMobile) && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleRecentChats}
              className="shadow-lg cursor-pointer bg-card hover:bg-accent"
            >
              <RecentChatIcon className="dark:invert" />
            </Button>
          )}
        </div>
        <ChatErrorBoundary>
          <Suspense fallback={<ChatSkeleton />}>
            <ChatArea
              agent_id={agent_id}
              isTrained={isTrained}
              agno_id={agno_id}
              user_description={user_description}
              user_instructions={user_instructions}
              messages={messages}
              medias={medias}
              isPublic={isPublic}
              publicCompanyId={publicCompanyId}
              publicUserId={publicUserId}
              exportReactComponentAsPDF={exportReactComponentAsPDF}
              isGlobalAgent={true}
              generateTitle={generateConversationTitle}
              handleCreateProject={handleCreateProject}
              handleCreateDoc={handleCreateDoc}
              enabledKnowledge={enabledKnowledge}
              agent_name={agent_name}
              setMessages={setMessages}
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              selectedLanguage={selectedLanguage}
              selectedModel={selectedModel}
              setSelectedLanguage={setSelectedLanguage}
              setSelectedModel={setSelectedModel}
              handleCreateConversation={handleCreateChat}
              selectedConversation={selectedConversation}
            />
          </Suspense>
        </ChatErrorBoundary>
      </div>
      <RecentChats
        isMobile={isMobile}
        setRecentChatsOpen={setRecentChatsOpen}
        recentChatsOpen={recentChatsOpen}
        setMessages={setMessages}
      />
    </div>
  );
};

export default AgentChat;

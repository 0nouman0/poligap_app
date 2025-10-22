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
import { useUserIdWithLoading } from "@/hooks/useUserId";
import { ChatSkeleton } from "@/components/ui/page-loader";

// Force dynamic rendering for real-time chat functionality
export const dynamic = 'force-dynamic';

const AgentChat = () => {
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const searchParams = useSearchParams();
  
  // Simplified companyId validation
  const companyId = selectedCompany?.companyId && 
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedCompany.companyId)
    ? selectedCompany.companyId 
    : null;
  
  // Use clean userId hook
  const { userId, isLoading: userIdLoading } = useUserIdWithLoading();

  // recent chats
  const [isMobile, setIsMobile] = useState(false);

  // State and constants
  const [recentChatsOpen, setRecentChatsOpen] = useState(true);

  // Get messages and setMessages from global store
  const messages = useGlobalChatStore((state) => state.messages);
  const setMessages = useGlobalChatStore((state) => state.setMessages);

  const [inputMessage, setInputMessage] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("auto"); // Auto-routing via Portkey
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

  // Show loading skeleton while userId is being resolved
  if (userIdLoading) {
    return <ChatSkeleton />;
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

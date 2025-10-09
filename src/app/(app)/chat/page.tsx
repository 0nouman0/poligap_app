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

const AgentChat = () => {
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const searchParams = useSearchParams();
  const companyId = selectedCompany?.companyId || "60f1b2b3c4d5e6f7a8b9c0d1"; // Fallback company ID
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const toggleRecentChats = () => {
    setRecentChatsOpen(!recentChatsOpen);
  };

  // Don't render until we have a userId
  if (!userId) {
    return (
      <main className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing chat...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          {(!recentChatsOpen || isMobile) && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleRecentChats}
              className="shadow-lg cursor-pointer"
            >
              <RecentChatIcon />
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

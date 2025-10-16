import React, { useEffect } from "react";
import RecentChatIcon from "@/assets/icons/doc-comment-icon.svg";
import { Button } from "@/components/ui/button";
import { Trash2, X, MessageCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useGlobalChatStore from "./store/global-chat-store";
import { PlaygroundChatMessage } from "@/types/agent";
import { useCompanyStore } from "@/stores/company-store";
import { useUserStore } from "@/stores/user-store";

type Props = {
  isMobile: boolean;
  setRecentChatsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  recentChatsOpen: boolean;
  setMessages: React.Dispatch<React.SetStateAction<PlaygroundChatMessage[]>>;
};

interface ChatItem {
  _id: string;
  chatName: string;
  createdAt: string;
}

// Skeleton loader for chat card
const ChatSkeleton = () => (
  <div className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted animate-pulse mb-2">
    <div className="flex-1">
      <div className="h-4 bg-muted-foreground/20 dark:bg-muted-foreground/10 rounded w-3/4 mb-1"></div>
      <div className="h-3 bg-muted-foreground/10 dark:bg-muted-foreground/5 rounded w-1/2"></div>
    </div>
    <div className="h-4 w-4 bg-muted-foreground/20 dark:bg-muted-foreground/10 rounded"></div>
  </div>
);

const RecentChats = ({
  isMobile,
  setRecentChatsOpen,
  recentChatsOpen,
  setMessages,
}: Props) => {
  const getConversationListsAPI = useGlobalChatStore(
    (state) => state.getConversationListsAPI
  );
  const globalConversationList = useGlobalChatStore(
    (state) => state.globalConversationList
  );
  const deleteConversationAPI = useGlobalChatStore(
    (state) => state.deleteConversationAPI
  );
  const getSelectedConversation = useGlobalChatStore(
    (state) => state.getSelectedConversation
  );
  const selectedConversation = useGlobalChatStore(
    (state) => state.selectedConversation
  );
  const isLoadingFetchingConvoList = useGlobalChatStore(
    (state) => state.isLoadingFetchingConvoList
  );

  const userId = useUserStore((s) => s.userData?.userId);

  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const companyId = selectedCompany?.companyId;

  // Use fallback values if missing or "undefined"
  const storedUserId = localStorage.getItem('user_id');
  const actualUserId = (userId && userId !== "undefined") ? userId : 
                      (storedUserId && storedUserId !== "undefined") ? storedUserId : 
                      "68da404605eeba8349fc9d10";
  const actualCompanyId = (companyId && companyId !== "") ? companyId : "60f1b2b3c4d5e6f7a8b9c0d1";

  console.log("RecentChats - userId:", userId, "storedUserId:", storedUserId, "actualUserId:", actualUserId, "actualCompanyId:", actualCompanyId);

  const groupedChats = (globalConversationList || {}) as Record<
    string,
    ChatItem[]
  >;

  useEffect(() => {
    getConversationListsAPI(actualCompanyId, actualUserId);
  }, [actualCompanyId, actualUserId, getConversationListsAPI]);

  const handleDeleteConversation = async (
    e: React.MouseEvent<HTMLButtonElement>,
    chatdata_id: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🗑️ handleDeleteConversation called with ID:", chatdata_id);
    
    // Validate chatdata_id
    if (!chatdata_id || chatdata_id === "undefined") {
      console.error("❌ No valid chat ID provided to handleDeleteConversation");
      return;
    }
    
    await deleteConversationAPI({ conversationId: chatdata_id }); // pass as object with conversationId property
    getConversationListsAPI(actualCompanyId, actualUserId);
  };

  const handleGoToChat = async (chatData: ChatItem) => {
    // debugger;
    console.log("🔍 handleGoToChat called with:", chatData);
    
    // Validate chatData has a valid _id
    if (!chatData?._id) {
      console.error("❌ No valid chat ID provided to handleGoToChat");
      return;
    }
    
    useGlobalChatStore.setState({
      openModalView: true,
    });
    const resp = await getSelectedConversation({ conversationId: chatData._id }, chatData);
    if (resp) {
      console.log("resp message ===>", resp);
      
      // Load chat history from Supabase - this updates the store messages
      const loadChatHistory = useGlobalChatStore.getState().loadChatHistory;
      const messages = await loadChatHistory(chatData._id);
      
      console.log("📨 Loaded messages:", messages);
      
      // debugger;
      if (isMobile) setRecentChatsOpen(false);
      
      // Messages are already set in the store by loadChatHistory, no need to call setMessages
      // The store already has the messages, and the component will re-render automatically
    }
  };

  console.log("globalConversationList ==>", globalConversationList);
  return (
    <>
      {/* Mobile sidebar overlay */}
      {recentChatsOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setRecentChatsOpen(false)}
        />
      )}

      {/* Right Sidebar - Recent Chats - Figma Design */}
      <div
        className={`
          ${
            isMobile ? "fixed" : "sticky"
          } ${isMobile ? "inset-y-0" : "top-[15px]"} right-0 z-50 w-[280px] ${isMobile ? "h-full" : "max-h-[calc(100vh-100px)]"} bg-card dark:bg-card border border-border dark:border-border rounded-[20px] shadow-lg dark:shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${recentChatsOpen ? "translate-x-0" : "translate-x-full"}
          ${!isMobile && !recentChatsOpen ? "hidden" : ""}
        `}
      >
        <div className="flex flex-col h-full rounded-[20px] overflow-hidden">
          {/* Header with Recent Chats title */}
          <div className="px-3 py-2.5 border-b border-border rounded-t-[20px] select-none bg-card/50 dark:bg-card/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" strokeWidth={1.67} />
                <h2 className="text-foreground dark:text-foreground text-xs font-semibold">Recent Chats</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRecentChatsOpen(false)}
                className="cursor-pointer h-6 w-6 p-0 hover:bg-accent dark:hover:bg-accent"
              >
                <X className="h-3.5 w-3.5 text-foreground dark:text-foreground" />
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground dark:text-muted-foreground mt-0.5">Historical analyses for selected standards</p>
          </div>

          {/* Chat list with sections */}
          <div className="flex-1 overflow-y-auto px-3 pt-[15px] pb-2 space-y-3 scrollbar-hide">
            {isLoadingFetchingConvoList ? (
              // Show 5 skeletons as a placeholder
              <>
                {[...Array(5)].map((_, i) => (
                  <ChatSkeleton key={i} />
                ))}
              </>
            ) : (
              <>
                {Object.entries(groupedChats).map(([sectionTitle, chats]) => (
                  <div key={sectionTitle} className="space-y-1.5">
                    {/* Section header with Yesterday/Previous 7 days */}
                    <div className="flex items-center gap-1.5 mb-1.5 select-none">
                      <div className="px-1.5 py-0.5 bg-muted dark:bg-muted rounded-[3px]">
                        <span className="text-[9px] text-muted-foreground dark:text-muted-foreground font-normal">{sectionTitle}</span>
                      </div>
                      <div className="flex-1 h-[1px] bg-border dark:bg-border"></div>
                    </div>

                    {/* Chat items */}
                    <div className="space-y-1">
                      {chats.map((chat, idx) => (
                        <div key={chat._id || `chat-${idx}`} className="relative">
                          {/* Active indicator line */}
                          {selectedConversation?._id === chat._id && (
                            <div className="absolute left-[-12px] top-0 bottom-0 w-[2px] bg-primary dark:bg-primary rounded-r"></div>
                          )}
                          <div
                            onClick={() => handleGoToChat(chat)}
                            className={`flex items-start justify-between px-2 py-1.5 rounded-[4px] cursor-pointer transition-colors group select-none
                              ${
                                selectedConversation?._id === chat._id
                                  ? "bg-accent dark:bg-accent"
                                  : "hover:bg-accent/50 dark:hover:bg-accent/50"
                              }`}
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-semibold text-foreground dark:text-foreground truncate mb-0.5 select-none">
                                {chat.chatName}
                              </h4>
                              <p className="text-[9px] text-muted-foreground dark:text-muted-foreground font-normal leading-tight select-none">
                                {new Date(chat.createdAt).toLocaleString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={(event) =>
                                    handleDeleteConversation(event, chat._id)
                                  }
                                  className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive dark:hover:text-destructive ml-1.5 flex-shrink-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive dark:text-destructive" strokeWidth={1.33} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" sideOffset={5}>
                                <p>Delete</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RecentChats;

import React, { useEffect, useState } from "react";
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
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";

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
  const createConversationAPI = useGlobalChatStore(
    (state) => state.createConversationAPI
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

  // Confirm dialog state for delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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
    // Open confirm modal with pending id
    setPendingDeleteId(chatdata_id);
    setConfirmOpen(true);
  };

  const handleNewChat = async () => {
    try {
      const convo = await createConversationAPI({ companyId: actualCompanyId, userId: actualUserId });
      if (convo?._id) {
        await getConversationListsAPI(actualCompanyId, actualUserId);
        await getSelectedConversation({ conversationId: convo._id }, convo);
        const loadChatHistory = useGlobalChatStore.getState().loadChatHistory;
        await loadChatHistory(convo._id);
        if (isMobile) setRecentChatsOpen(false);
      }
    } catch (e) {
      console.error('Failed to create new chat', e);
    }
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
      <ConfirmDialog
        open={confirmOpen}
        title="Delete conversation?"
        description="This will permanently remove the conversation and its messages. This action cannot be undone."
        confirmText="Delete Conversation"
        onCancel={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
        onConfirm={async () => {
          if (!pendingDeleteId) return;
          await deleteConversationAPI({ conversationId: pendingDeleteId });
          setConfirmOpen(false);
          setPendingDeleteId(null);
          getConversationListsAPI(actualCompanyId, actualUserId);
        }}
        requireAcknowledge
        acknowledgeLabel="I understand this will permanently delete the conversation"
      />
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
                <MessageCircle className="w-4 h-4" strokeWidth={1.67} style={{ color: '#3B43D6' }} />
                <h2 className="text-xs font-semibold" style={{ color: '#3B43D6' }}>Recent Chats</h2>
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
            {/* Subheader removed per UX request */}
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
                      <div className="px-1.5 py-0.5 rounded-[3px] border" style={{ backgroundColor: 'rgba(59, 67, 214, 0.08)', borderColor: '#3B43D6' }}>
                        <span className="text-[9px] font-semibold" style={{ color: '#3B43D6' }}>{sectionTitle}</span>
                      </div>
                      <div className="flex-1 h-[1px] bg-border dark:bg-border"></div>
                    </div>

                    {/* Chat items */}
                    <div className="space-y-1">
                      {chats.map((chat, idx) => (
                        <div key={chat._id || `chat-${idx}`} className="relative">
                          {/* Active indicator line at extreme left */}
                          {selectedConversation?._id === chat._id && (
                            <div className="absolute left-0 top-0 bottom-0 w-[2px] rounded-r" style={{ backgroundColor: '#3B43D6' }}></div>
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
          {/* Footer new chat button (inside container) */}
          <div className="border-t border-border dark:border-border p-3">
            <div className="flex justify-center">
              <Button
                size="sm"
                className="h-8 px-3 rounded-[6px] text-white"
                style={{ backgroundColor: '#3B43D6' }}
                onClick={handleNewChat}
              >
                New Chat
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecentChats;

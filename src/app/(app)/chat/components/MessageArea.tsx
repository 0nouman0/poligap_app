"use client";

import { StickToBottom } from "use-stick-to-bottom";

import type { PlaygroundChatMessage } from "./../types/agent";
import Messages from "./Messages";
import ScrollToBottom from "./ScrollToBottom";

const MessageArea = ({
  messages,
  isGlobalAgent,
  exportReactComponentAsPDF,
  handleCreateProject,
  handleCreateDoc,
}: {
  handleCreateProject?: (content: PlaygroundChatMessage) => void;
  handleCreateDoc?: (content: PlaygroundChatMessage) => Promise<void>;
  messages: PlaygroundChatMessage[];
  isGlobalAgent: boolean;
  exportReactComponentAsPDF?: (
    component: React.ReactElement,
    options: {
      title: string;
      fileName: string;
      fileFormat: string;
    },
    
  ) => Promise<void>;
}) => {
  // Ensure messages is always an array
  const messagesArray = Array.isArray(messages) ? messages : [];
  
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
      <StickToBottom
        className='flex flex-1 flex-col min-h-0'
        resize='smooth'
        initial='smooth'>
        <StickToBottom.Content
          className={`flex flex-1 flex-col overflow-y-auto ${messagesArray.length === 0 ? "justify-start" : "justify-start"} `}>
          <div className='mx-auto w-full max-w-6xl px-6 py-4'>
          <Messages
            exportReactComponentAsPDF={exportReactComponentAsPDF}
            messages={messagesArray}
            isGlobalAgent={isGlobalAgent}
            handleCreateProject={handleCreateProject}
            handleCreateDoc={handleCreateDoc}
          />
        </div>
      </StickToBottom.Content>
      </StickToBottom>
    </div>
  );
};

export default MessageArea;

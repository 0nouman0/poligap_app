"use client";

import { useState, useCallback } from "react";
import type { AgentType } from "./../types/agent";
import ChatInput from "./ChatInput/ChatInput";
import MessageArea from "./MessageArea";
import { DragDropOverlay } from "./DragDropOverlay";
// Removed old file processing imports - now using direct Portkey API upload
import { toastSuccess, toastError } from "@/components/toast-varients";

const ChatArea = ({
  agent_id,
  selectedLanguage,
  exportReactComponentAsPDF,
  selectedModel,
  medias,
  publicCompanyId,
  publicUserId,
  isTrained,
  agno_id,
  messages,
  setMessages,
  agent_name,
  setSelectedModel,
  setSelectedLanguage,
  isPublic,
  handleCreateConversation,
  selectedConversation,
  handleCreateProject,
  handleCreateDoc,
  isGlobalAgent,
  enabledKnowledge,
  inputMessage,
  generateTitle,
  user_description,
  user_instructions,
  setInputMessage,
}: AgentType) => {
  // No longer need uploadedFiles state since we're using direct API upload
  // const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileDrop = useCallback(async (files: File[]) => {
    try {
      // Inform user to use the upload button for better control
      toastError('Please use the Upload button below to attach files. This allows you to add your own query before sending.');
      
    } catch (error) {
      console.error('Error processing dropped files:', error);
      toastError('Failed to process dropped files. Please try again.');
    }
  }, []);

  return (
    <DragDropOverlay
      onFileDrop={handleFileDrop}
      className="flex flex-col h-full bg-background"
      maxFiles={10}
      maxFileSize={50}
    >
      <MessageArea
        messages={messages}
        exportReactComponentAsPDF={exportReactComponentAsPDF}
        isGlobalAgent={isGlobalAgent ?? false}
        handleCreateProject={handleCreateProject}
        handleCreateDoc={handleCreateDoc}
      />
      <div className="flex-shrink-0 bg-background px-6 pb-4 pt-2">
        {/* <Separator className="mx-2 mb-3 w-screen" /> */}
        <ChatInput
          agent_name={agent_name}
          messages={messages}
          generateTitle={generateTitle}
          medias={medias}
          user_description={user_description}
          user_instructions={user_instructions}
          isGlobalAgent={isGlobalAgent}
          setMessages={setMessages}
          isPublic={isPublic}
          publicCompanyId={publicCompanyId}
          publicUserId={publicUserId}
          enabledKnowledge={enabledKnowledge}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          agent_id={agent_id}
          isTrained={isTrained}
          agno_id={agno_id}
          selectedLanguage={selectedLanguage}
          selectedModel={selectedModel}
          handleCreateConversation={handleCreateConversation}
          selectedConversation={selectedConversation}
          setSelectedLanguage={setSelectedLanguage}
          setSelectedModel={setSelectedModel}
        />
      </div>
    </DragDropOverlay>
  );
};

export default ChatArea;

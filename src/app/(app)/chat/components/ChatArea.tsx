"use client";

import { useState, useCallback } from "react";
import type { AgentType } from "./../types/agent";
import ChatInput from "./ChatInput/ChatInput";
import MessageArea from "./MessageArea";
import { DragDropOverlay } from "./DragDropOverlay";
import { processFiles, formatFilesForChat, ProcessedFile } from "../utils/fileProcessor";
import { processDocumentsWithAI, formatAnalyzedFilesForChat, EnhancedProcessedFile } from "../utils/documentProcessor";
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
  const [uploadedFiles, setUploadedFiles] = useState<EnhancedProcessedFile[]>([]);

  const handleFileDrop = useCallback(async (files: File[]) => {
    try {
      // Show loading toast
      toastSuccess(`Processing and analyzing ${files.length} file${files.length !== 1 ? 's' : ''} with AI...`);
      
      // Process the files with AI analysis
      const result = await processDocumentsWithAI(files);
      
      if (result.errors.length > 0) {
        result.errors.forEach(error => toastError('Upload Error', error));
      }
      
      if (result.files.length > 0) {
        setUploadedFiles(prev => [...prev, ...result.files]);
        
        // Format files for chat with AI analysis
        const fileContext = formatAnalyzedFilesForChat(result.files);
        console.log('Generated file context for AI:', fileContext);
        
        const currentMessage = inputMessage || '';
        const newMessage = currentMessage 
          ? `${fileContext}${currentMessage}`
          : `${fileContext}Please answer questions about the uploaded document${result.files.length !== 1 ? 's' : ''}.`;
        
        console.log('Final message with document context:', newMessage);
        setInputMessage(newMessage);
        
        const analyzedCount = result.files.filter((f: any) => f.isAnalyzed).length;
        toastSuccess(
          `Successfully uploaded and analyzed ${analyzedCount} of ${result.files.length} file${result.files.length !== 1 ? 's' : ''}!`
        );
      }
    } catch (error) {
      console.error('Error processing files:', error);
      toastError('Failed to process files. Please try again.');
    }
  }, [inputMessage, setInputMessage]);

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
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
        />
      </div>
    </DragDropOverlay>
  );
};

export default ChatArea;

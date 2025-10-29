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
      // For now, handle only single file uploads to Portkey via drag & drop
      if (files.length > 1) {
        toastError('Multiple file upload via drag & drop not supported yet. Please drop one file at a time.');
        return;
      }

      const file = files[0];
      console.log(`🚀 Drag & drop file upload to Portkey API: ${file.name}`);
      
      // Show loading toast
      toastSuccess(`Uploading ${file.name} directly to AI for analysis...`);
      
      // Send file directly to Portkey API - same as upload button
      await handleFileUploadToPortkey(file);
      
    } catch (error) {
      console.error('Error processing dropped files:', error);
      toastError('Failed to process dropped files. Please try again.');
    }
  }, []);

  const handleFileUploadToPortkey = async (file: File) => {
    try {
      const userQuery = inputMessage || 'Please analyze this file';
      console.log('📡 Sending dropped file to Portkey API via regular chat stream...');

      // Create a user message for the file upload
      const fileMessage = `[File Upload: ${file.name}] ${userQuery}`;
      
      // Clear input 
      setInputMessage('');

      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_query', userQuery);
      formData.append('conversation_id', selectedConversation?._id || '');

      // Send to our upload API endpoint
      const response = await fetch('/api/ai-chat/upload-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      // Handle streaming response through the existing chat system
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      console.log('📡 Receiving streaming response from Portkey for dropped file...');

      // Add user message to chat
      if (setMessages) {
        const userMessage = {
          id: Date.now().toString(),
          content: fileMessage,
          role: 'user',
          created_at: Date.now(),
          user_query: userQuery,
        };
        setMessages(prev => [...(prev || []), userMessage]);
      }

      // Process streaming response and add to chat
      await handleStreamingFileResponse(reader);

    } catch (error) {
      console.error('❌ Dropped file upload to Portkey failed:', error);
      toastError(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStreamingFileResponse = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    try {
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: 'assistant',
        created_at: Date.now() + 1,
        user_query: '',
      };

      // Add initial empty assistant message
      if (setMessages) {
        setMessages(prev => [...(prev || []), assistantMessage]);
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ Dropped file streaming completed');
          toastSuccess('File analysis completed successfully!');
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Handle different event types
              if (data.event === 'RunResponseContent') {
                console.log('📄 Streaming content received from dropped file');
                assistantMessage.content = data.content;
                
                // Update the assistant message in chat
                if (setMessages) {
                  setMessages(prev => {
                    const updated = [...(prev || [])];
                    const lastIndex = updated.length - 1;
                    if (updated[lastIndex]?.id === assistantMessage.id) {
                      updated[lastIndex] = { ...assistantMessage };
                    }
                    return updated;
                  });
                }
              } else if (data.event === 'RunResponseComplete') {
                console.log('✅ Dropped file analysis completed');
                // Final update
                assistantMessage.content = data.content;
                if (setMessages) {
                  setMessages(prev => {
                    const updated = [...(prev || [])];
                    const lastIndex = updated.length - 1;
                    if (updated[lastIndex]?.id === assistantMessage.id) {
                      updated[lastIndex] = { ...assistantMessage };
                    }
                    return updated;
                  });
                }
              } else if (data.event === 'RunResponseError') {
                console.error('❌ File processing error:', data.error);
                assistantMessage.content = `Sorry, I encountered an error processing your file: ${data.error}`;
                if (setMessages) {
                  setMessages(prev => {
                    const updated = [...(prev || [])];
                    const lastIndex = updated.length - 1;
                    if (updated[lastIndex]?.id === assistantMessage.id) {
                      updated[lastIndex] = { ...assistantMessage };
                    }
                    return updated;
                  });
                }
                toastError('File processing failed');
              }
            } catch (parseError) {
              console.warn('⚠️ Failed to parse streaming data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Streaming response error:', error);
      toastError('Error receiving file analysis response');
    }
  };

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

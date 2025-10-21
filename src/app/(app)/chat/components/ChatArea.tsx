"use client";

import type { AgentType } from "./../types/agent";
import ChatInput from "./ChatInput/ChatInput";
import MessageArea from "./MessageArea";

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
  return (
    <div className="flex flex-col h-full bg-background">
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
    </div>
  );
};

export default ChatArea;

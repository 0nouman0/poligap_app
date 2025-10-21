import { memo, useState } from "react";

import type { MessageProps, TabData, TabType } from "./../../../types/agent";
import AgentThinkingLoader from "../Chat-Components/AgentThinkingLoader";
import { ActionTab } from "./../../../components/actions/ActionTab";
import { useAgentStore } from "./../../../store/agent-store";
import Icon from "./../../../ui/icon";
import MarkdownRenderer from "./../../../ui/typography/MarkdownRenderer";
import Audios from "./../Multimedia/Audios";
import Images from "./../Multimedia/Images";
import Videos from "./../Multimedia/Videos";
import ReferenceCards from "./ReferenceCards";
import ToolCalls from "./ToolCards";

const AgentMessage = ({
  message,
  exportReactComponentAsPDF,
  handleCreateProject,
  handleCreateDoc,
}: MessageProps) => {
  const { streamingErrorMessage, isStreaming } = useAgentStore();
  const [activeTab, setActiveTab] = useState<TabType>("content");

  const tabs: TabData[] = [{ id: "content", label: "Poligap AI", icon: "poligap" }];

  if (
    message.extra_data?.references &&
    message.extra_data.references.length > 0
  ) {
    const totalReferences = message.extra_data.references.reduce(
      (acc, ref) => acc + ref.references.length,
      0
    );
    tabs.push({
      id: "references",
      label: "Sources",
      icon: "references",
      count: totalReferences,
    });
  }

  if (message.images && message.images.length > 0) {
    tabs.push({
      id: "images",
      label: "Images",
      icon: "image",
      count: message.images.length,
    });
  }

  if (message.videos && message.videos.length > 0) {
    tabs.push({
      id: "videos",
      label: "Videos",
      icon: "video",
      count: message.videos.length,
    });
  }
  if (message.tool_calls && message.tool_calls.length > 0) {
    tabs.push({
      id: "tasks",
      label: "Tasks",
      icon: "tasks",
      count: message.tool_calls.length,
    });
  }

  if (message.audio && message.audio.length > 0) {
    tabs.push({
      id: "audio",
      label: "Audio",
      icon: "audio",
      count: message.audio.length,
    });
  }

  const renderTabContent = () => {
    if (message.streamingError) {
      return (
        <p className="text-[var(--error-red)]">
          Oops! Something went wrong while streaming.{" "}
          {streamingErrorMessage ? (
            <>{streamingErrorMessage}</>
          ) : (
            "Please try refreshing the page or try again later."
          )}
        </p>
      );
    }

    switch (activeTab) {
      case "content":
        if (message.content) {
          return (
            <div className="flex w-full flex-col gap-2">
              {isStreaming === message.id && (
                <ToolCalls
                  message={message}
                  toolCalls={message.tool_calls ?? []}
                />
              )}
              <MarkdownRenderer>{message.content}</MarkdownRenderer>
              {isStreaming !== message.id && (
                <ActionTab
                  exportReactComponentAsPDF={exportReactComponentAsPDF}
                  handleCreateProject={handleCreateProject}
                  handleCreateDoc={handleCreateDoc}
                  message={message}
                />
              )}
            </div>
          );
        } else if (message.response_audio) {
          if (!message.response_audio.transcript) {
            return (
              <div className="mt-2 flex items-start">
                <AgentThinkingLoader />
              </div>
            );
          } else {
            return (
              <MarkdownRenderer>
                {message.response_audio.transcript}
              </MarkdownRenderer>
            );
          }
        } else {
          return (
            <div className="mt-2 flex">
              <AgentThinkingLoader />
            </div>
          );
        }

      case "references":
        return (
          <ReferenceCards references={message.extra_data?.references ?? []} />
        );
      case "tasks":
        return (
          <ToolCalls message={message} toolCalls={message.tool_calls ?? []} />
        );

      case "images":
        if (message.images && message.images.length > 0) {
          return <Images images={message.images} />;
        }
        return <p className="text-muted">No images available</p>;

      case "videos":
        if (message.videos && message.videos.length > 0) {
          return <Videos videos={message.videos} />;
        }
        return <p className="text-muted">No videos available</p>;

      case "audio":
        if (message.audio && message.audio.length > 0) {
          return <Audios audio={message.audio} />;
        } else if (message.response_audio?.content) {
          return <Audios audio={[message.response_audio]} />;
        }
        return <p className="text-muted">No audio available</p>;

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-row items-start gap-4">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-[30px] h-[30px] rounded-full bg-primary dark:bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-base font-normal">P</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-2 flex-1">
        {/* Agent Name */}
        <p className="text-base font-semibold text-foreground dark:text-foreground select-none">Poligap AI</p>
        
        {/* Message Content */}
        <div className="bg-card dark:bg-card rounded-tr-[20.5px] rounded-br-[20.5px] rounded-bl-[20.5px] px-4 py-3 max-w-full shadow-sm dark:shadow-md">
          {tabs.length > 0 && activeTab !== "content" && (
            <div className="mb-4 flex gap-2 border-b border-border dark:border-border pb-2 select-none">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex cursor-pointer items-center gap-1.5 px-2 py-1 text-xs font-medium transition-colors rounded ${
                    activeTab === tab.id
                      ? "bg-primary dark:bg-primary text-primary-foreground"
                      : "text-muted-foreground dark:text-muted-foreground hover:bg-accent dark:hover:bg-accent"
                  }`}
                >
                  <Icon
                    type={
                      tab.label === "Poligap AI" && isStreaming === message.id
                        ? "loading-icon"
                        : tab.icon
                    }
                    size="xs"
                    className="text-inherit"
                  />
                  <p className="text-xs text-inherit">{tab.label}</p>
                  {tab.count && (
                    <span className="text-xs text-inherit">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="text-sm text-foreground dark:text-foreground leading-[1.71] message-content">{renderTabContent()}</div>
        </div>
        
        {/* Action Buttons */}
        {message.content && isStreaming !== message.id && (
          <div className="flex items-center gap-2 select-none">
            <button className="p-1.5 hover:bg-accent dark:hover:bg-accent rounded transition-colors" title="Thumbs up">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-muted-foreground dark:text-muted-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Thumbs down">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#717171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
              </svg>
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Copy">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#717171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
AgentMessage.displayName = "AgentMessage";

const UserMessage = memo(({ message }: MessageProps) => {
  return (
    <div className="flex justify-start select-none">
      <div className="max-w-[270px] bg-muted dark:bg-muted rounded-tr-[20.5px] rounded-br-[20.5px] rounded-bl-[20.5px] px-4 py-2.5 shadow-sm dark:shadow-md">
        <p className="text-sm text-foreground dark:text-foreground leading-[1.21]">
          {message.user_query}
        </p>
      </div>
    </div>
  );
});
UserMessage.displayName = "UserMessage";

export { AgentMessage, UserMessage };

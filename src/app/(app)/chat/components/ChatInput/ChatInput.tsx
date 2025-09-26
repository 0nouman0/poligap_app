"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LucideSendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type {
  AgentType,
  MediaTypeProps,
  MultiSelectOption,
  SelectedLanguageType,
  SelectedLlmType,
} from "../../types/agent";
import { useAgentStore } from "../../store/agent-store";
import useAIChatStreamHandler from "./../../hooks/useAIStreamHandler";
import { LlmsList } from "./../../utils/utils";
import { AddMediaButton } from "./AddMediaButton";
import { LlmButton } from "./LlmButton";
import { MediaCard, MediaCardSkeleton } from "./MediaCard";
import { SelectLanguageButton } from "./SelectLanguageButton";
import { SelectMetaProperties } from "./SelectMetaProperties";
import { toastError } from "@/components/toast-varients";
import { cn } from "@/lib/utils";
import { useCompanyStore } from "@/stores/company-store";

// Parse @mentions like @contract_2023
function parseMentions(text: string): string[] {
  if (!text) return [];
  const set = new Set<string>();
  const re = /@([A-Za-z0-9_\-.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) set.add(m[0]);
  return Array.from(set);
}

function normalizeMentionName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "_");
}

const ChatInput = ({
  agent_id,
  selectedLanguage,
  selectedModel,
  medias,
  setSelectedModel,
  setSelectedLanguage,
  handleCreateConversation,
  selectedConversation,
  agno_id,
  messages,
  inputMessage,
  setInputMessage,
  isPublic,
  publicCompanyId,
  publicUserId,
  setMessages,
  agent_name,
  user_description,
  user_instructions,
  isTrained = false,
  isGlobalAgent = true,
  enabledKnowledge,
  setOpenGlobalModal,
  generateTitle,
}: AgentType) => {
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const companyId = selectedCompany?.companyId;
  const {
    chatInputRef,
    isStreaming,
    selectedMedia,
    setSelectedMedia,
    isLoadingUploadFile,
  } = useAgentStore();
  const selectedLlmModel = LlmsList.find(
    (model) => model.modelId === selectedModel
  );

  const isStreamingResponse = Boolean(isStreaming);

  const [selectedOptions, setSelectedOptions] = useState<MultiSelectOption[]>([
    { id: "web-search", label: "Enable Web Search", enabled: false },
    { id: "research", label: "Enable Reasoning", enabled: false },
    {
      id: "file-attach",
      label: "Allow user to attach any file",
      enabled: false,
    },
  ]);
  const { handleStreamResponse } = useAIChatStreamHandler({
    agent_id,
    selectedLanguage: selectedLanguage ?? { code: "en", name: "English" },
    selectedModel,
    agent_name,
    inputMessage,
    isPublic,
    setInputMessage,
    medias,
    publicCompanyId,
    publicUserId,
    selectedOptions,
    selectedMedia,
    user_description,
    user_instructions,
    isTrained,
    messages,
    setMessages,
    isGlobalAgent,
    enabledKnowledge,
    handleCreateConversation,
    agno_id,
  });
  const handleChange = (updatedOptions: MultiSelectOption[]) => {
    setSelectedOptions(updatedOptions);
  };

  const handleLanguageSelect = (language: SelectedLanguageType) => {
    if (setSelectedLanguage) {
      setSelectedLanguage(language);
    }
  };
  const handleModelSelect = (model: SelectedLlmType) => {
    if (setSelectedModel) {
      setSelectedModel(model.modelId);
    }
  };

  // Mention state
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
  const mentionRangeRef = useRef<{ start: number; end: number } | null>(null);

  // Fetch suggestions for mention
  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!mentionOpen || !mentionQuery) {
        setMentionSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/assets?search=${encodeURIComponent(mentionQuery)}`);
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          setMentionSuggestions(Array.isArray(data?.assets) ? data.assets.slice(0, 6) : []);
        } else {
          setMentionSuggestions([]);
        }
      } catch {
        if (active) setMentionSuggestions([]);
      }
    };
    const t = setTimeout(run, 180);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [mentionQuery, mentionOpen]);

  const insertMentionAtCursor = (token: string) => {
    const el = chatInputRef.current as HTMLTextAreaElement | null;
    const current = inputMessage || "";
    if (!el || !mentionRangeRef.current) {
      setInputMessage(`${current} ${token} `);
      setMentionOpen(false);
      setMentionSuggestions([]);
      return;
    }
    const { start, end } = mentionRangeRef.current;
    const before = current.slice(0, start);
    const after = current.slice(end);
    const next = `${before}${token}${after}`;
    setInputMessage(next);
    const caret = (before + token).length;
    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        el.selectionStart = el.selectionEnd = caret + 1;
      }
    });
    setMentionOpen(false);
    setMentionSuggestions([]);
  };

  const handleRemoveMention = (token: string) => {
    const current = inputMessage || "";
    const next = current.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "").replace(/\s{2,}/g, " ").trim();
    setInputMessage(next);
  };

  const handleSubmit = async () => {
    // debugger;
    if (!(inputMessage || "").trim()) return;
    if (setOpenGlobalModal) {
      setOpenGlobalModal();
    }

    const currentMessage = inputMessage;
    setInputMessage("");
    try {
      let createdConvo = {
        _id: "",
        chatName: "",
        createdAt: new Date().toISOString(),
      };

      const messagesArray = messages || [];

      if (handleCreateConversation) {
        // On first message, ensure a conversation exists
        if (messagesArray.length === 0 && (!selectedConversation || selectedConversation._id === "")) {
          createdConvo = await handleCreateConversation();
        } else if (messagesArray.length === 0 && selectedConversation && selectedConversation._id !== "") {
          createdConvo = selectedConversation;
        } else {
          createdConvo = selectedConversation ?? createdConvo;
        }
      }
      if (messagesArray.length === 0) {
        if (generateTitle) {
          console.log("generateTitle =>");
          const convoIdForTitle = createdConvo?._id || selectedConversation?._id || "";
          generateTitle(inputMessage, convoIdForTitle);
        }
      }

      console.log("createdConvo ==>", currentMessage, createdConvo);
      await handleStreamResponse(currentMessage, createdConvo);
    } catch (error) {
      toastError(
        `Error in handleSubmit: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const handleRemoveMedia = (file: MediaTypeProps) => {
    setSelectedMedia(
      selectedMedia.filter((media: MediaTypeProps) => media._id !== file._id)
    );
  };
  const selectedOptionIds = selectedOptions
    .filter((option: MultiSelectOption) => option.enabled)
    .map((option) => option.id);

  const mentionChips = useMemo(() => parseMentions(inputMessage || ""), [inputMessage]);

  return (
    <div className="font-inter mx-auto flex w-full max-w-6xl flex-col rounded-xl border p-3">
      <div className="flex">
        {isLoadingUploadFile && <MediaCardSkeleton />}
        {selectedMedia.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {selectedMedia.length > 0 &&
              selectedMedia.map((file, index) => (
                <MediaCard
                  key={index}
                  file={file}
                  onClose={() => handleRemoveMedia(file)}
                />
              ))}
          </div>
        )}
      </div>

      {/* Mention chips */}
      {mentionChips.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {mentionChips.map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
            >
              {m}
              <button
                type="button"
                onClick={() => handleRemoveMention(m)}
                className="ml-1 text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${m}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative flex w-full">
        <textarea
          placeholder="Ask anything..."
          value={inputMessage || ""}
          onChange={(e) => {
            const val = e.target.value;
            setInputMessage(val);
            const el = e.target as HTMLTextAreaElement;
            const caret = el.selectionStart;
            const prefix = val.slice(0, caret);
            const m = /@([A-Za-z0-9_\-.]{0,50})$/.exec(prefix);
            if (m) {
              setMentionOpen(true);
              setMentionQuery(m[1]);
              mentionRangeRef.current = { start: caret - m[0].length, end: caret };
            } else {
              setMentionOpen(false);
              setMentionQuery("");
              mentionRangeRef.current = null;
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isStreamingResponse) {
              e.preventDefault();
              return handleSubmit();
            }
          }}
          className="max-h-24 min-h-16 flex-1 border-none bg-transparent px-0.5 text-[13px] text-[var(--text-color)] outline-none placeholder:text-[var(--secondary-text-color)]"
          disabled={!agent_id || isStreamingResponse}
          ref={chatInputRef}
        />

        {/* Suggestions dropdown */}
        {mentionOpen && mentionSuggestions.length > 0 && (
          <div className="absolute bottom-10 left-0 z-[1600] w-80 max-w-[90%] rounded-md border bg-popover p-2 shadow-md">
            <div className="mb-1 text-xs text-muted-foreground">Insert asset mention</div>
            <ul className="max-h-64 overflow-auto">
              {mentionSuggestions.map((a) => {
                const display = a.originalName || a.filename || a.url;
                const token = `@${normalizeMentionName(display)}`;
                return (
                  <li key={a._id}>
                    <button
                      type="button"
                      onClick={() => insertMentionAtCursor(token)}
                      className="block w-full truncate rounded px-2 py-1 text-left text-sm hover:bg-accent"
                      title={display}
                    >
                      {display}
                      <span className="ml-2 text-xs text-muted-foreground">{token}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-row justify-between">
        <div className="flex gap-2">
          <SelectMetaProperties
            options={selectedOptions}
            onChange={handleChange}
            disabled={isStreamingResponse}
          />
          {selectedOptionIds.includes("file-attach") && (
            <AddMediaButton
              agent_id={agent_id}
              disabled={isStreamingResponse}
            />
          )}

          <SelectLanguageButton
            value={selectedLanguage}
            disabled={isStreamingResponse}
            onSelect={handleLanguageSelect}
          />
          <LlmButton
            value={selectedLlmModel}
            disabled={isStreamingResponse}
            onSelect={handleModelSelect}
          />
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                onClick={handleSubmit}
                disabled={
                  !agent_id ||
                  !(inputMessage || "").trim() ||
                  isStreamingResponse
                }
                size="icon"
                variant={
                  (inputMessage || "").trim().length > 0 ? "default" : "outline"
                }
                className={cn(
                  "size-7 p-1 transition-colors",
                  "cursor-pointer disabled:cursor-not-allowed",
                  (inputMessage || "").trim().length > 0
                    ? "bg-[var(--text-color)] text-white dark:text-black"
                    : "bg-transparent border border-input text-muted-foreground dark:text-muted-foreground",
                  "disabled:bg-transparent disabled:text-muted-foreground"
                )}
              >
                <LucideSendHorizontal className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent style={{ zIndex: 1600 }}>Send</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
export default ChatInput;

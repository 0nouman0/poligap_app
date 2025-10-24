import type { MessageProps, PlaygroundChatMessage } from "@/types/agent";
import React, { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Icon from "./../../ui/icon";
import MarkdownRenderer from "./../../ui/typography/MarkdownRenderer";
import { EXPORT_TYPES } from "./../../utils/utils";
import { toastError, toastSuccess } from "@/components/toast-varients";

export const ActionTab = ({
  message,
  exportReactComponentAsPDF,
  handleCreateProject,
  handleCreateDoc,
}: MessageProps) => {
  const [isExporting, setIsExporting] = useState("");
  const [isCreatingDocument, setIsCreatingDocument] = useState("");

  const onExportAsPDF = useCallback(async () => {
    setIsExporting(message.id);
    try {
      const markdown = message.content ?? "";
      const fileName = `${message.content?.slice(0, 20) ?? "AI Agent"}`;

      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown, fileName }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error(err?.error || `Export failed with status ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toastSuccess("Exported as PDF");
    } catch (error) {
      toastError(
        `Failed to export as PDF  ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsExporting("");
    }
  }, [message]);

  const onExportAsMarkdown = useCallback(() => {
    setIsExporting(message.id);

    try {
      const content = message.content ?? "";
      const fileName = `${message.content?.slice(0, 20) ?? "AI Agent"}.md`;
      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toastSuccess("Exported as Markdown");
    } catch (error) {
      toastError(
        `Failed to export as Markdown  ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsExporting("");
    }
  }, [message]);

  const handleExport = async (id: number) => {
    if (id === 1) {
      await onExportAsPDF();
    } else if (id === 2) {
      onExportAsMarkdown();
    }
  };


  const createDocument = async (message: PlaygroundChatMessage) => {
    try {
      setIsCreatingDocument(message.id);
      if (handleCreateDoc) {
        await handleCreateDoc(message);
      }
    } catch (error) {
      toastError(
        `Chat Creation Failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsCreatingDocument("");
    }
  };
  const createProject = (message: PlaygroundChatMessage) => {
    try {
      if (handleCreateProject) {
        handleCreateProject(message);
      }
    } catch (error) {
      toastError(
        `Chat Creation Failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="py-[4px]"
                disabled={isExporting === message.id}
                style={{
                  width: "min-content",
                  height: "100%",
                  borderRadius: "16px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {isExporting === message.id ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                      color="var(--text-color)"
                    />
                  ) : (
                    <Icon type="export" size="xs" color="var(--text-color)" />
                  )}
                  {isExporting === message.id ? "Exporting" : "Export"}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              style={{ zIndex: 1500, maxHeight: "200px", overflowY: "auto" }}
            >
              {EXPORT_TYPES.map((item) => {
                return (
                  <DropdownMenuItem
                    key={item.id}
                    style={{
                      fontSize: "13px",
                      backgroundColor: "transparent",
                      position: "relative",
                    }}
                    onSelect={() => handleExport(item.id)}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "100%",
                      }}
                    >
                      <Icon
                        type={item.icon}
                        size="xs"
                        color="var(--text-color)"
                      />
                      <p className="flex-1 text-[12px] text-[var(--text-color)]">
                        {item.title}
                      </p>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          {handleCreateDoc && (
            <Button
              onClick={() => createDocument(message)}
              variant="secondary"
              className="bg-[var(--text-color)] py-0.5 text-[var(--black-1000)] disabled:opacity-80"
              size="sm"
              disabled={isCreatingDocument === message.id}
              style={{ width: "min-content", height: "100%" }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                {isCreatingDocument === message.id && (
                  <Loader2
                    size={18}
                    className="animate-spin"
                    color="var(--black-1000)"
                  />
                )}
                {isCreatingDocument === message.id ? "Creating" : "Create Doc"}
              </div>
            </Button>
          )}
          {handleCreateProject && (
            <Button
              onClick={() => createProject(message)}
              variant="secondary"
              className="bg-[var(--text-color)] py-0.5 text-[var(--black-1000)] disabled:opacity-80"
              size="sm"
              disabled={isCreatingDocument === message.id}
              style={{ width: "min-content", height: "100%" }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                Create Project
              </div>
            </Button>
          )}
        </div>

      </div>
    </div>
  );
};

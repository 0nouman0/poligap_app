import type { SelectedLlmTypeProps } from "@/types/agent";
import { Check, ChevronDown } from "lucide-react";

// import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import Icon from "./../../ui/icon";
import { LlmsList } from "./../../utils/utils";
import { ModelSpecificationTooltip } from "./ModelTooltip";
import { Button } from "@/components/ui/button";

export const LlmButton = ({
  value,
  disabled = false,
  onSelect,
}: SelectedLlmTypeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                className="w-full h-6 px-2 bg-card dark:bg-card border border-border dark:border-border rounded-[3px] text-xs font-medium text-muted-foreground dark:text-muted-foreground hover:bg-accent dark:hover:bg-accent"
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}
                >
                  {value?.modelIcon && (
                    <Icon type={value.modelIcon} size="xs" />
                  )}
                  <span style={{ flex: 1 }}>{value?.shortName ?? "Select Model"}</span>
                  <ChevronDown
                    className="text-muted-foreground dark:text-muted-foreground"
                    style={{
                      width: "16px",
                      height: "16px",
                      opacity: 0.5,
                    }}
                  />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="z-[1500] w-80 max-h-[300px] overflow-y-auto bg-popover/95 dark:bg-popover/95 backdrop-blur-sm border-border/50 dark:border-border/50 shadow-lg dark:shadow-2xl rounded-[12px] p-2"
            >
              {LlmsList.map((model) => {
                const isSelected = value?.modelId === model.modelId;
                return (
                  <DropdownMenuItem
                    key={model.modelId}
                    className={`p-2 rounded-[6px] cursor-pointer transition-colors hover:bg-accent/50 dark:hover:bg-accent/50 ${isSelected ? 'bg-accent/70 dark:bg-accent/70' : ''}`}
                    onSelect={() => {
                      console.log("model ==>", model);
                      onSelect(model);
                    }}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              width: "100%",
                            }}
                          >
                            <div className="flex-shrink-0">
                              <Icon type={model.modelIcon} size="sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground dark:text-foreground truncate">
                                {model.modelName}
                              </p>
                              <p className="text-[10px] text-muted-foreground dark:text-muted-foreground capitalize leading-tight">
                                {model.provider === 'auto' ? 'Intelligent Routing' : `${model.provider} • ${model.shortName}`}
                              </p>
                            </div>
                            {isSelected && (
                              <Check
                                className="w-4 h-4 text-primary dark:text-primary ml-auto flex-shrink-0"
                              />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent style={{ zIndex: 1600 }}>
                          {" "}
                          <ModelSpecificationTooltip
                            modelName={model.modelName}
                          />{" "}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent style={{ zIndex: 1600 }}>Select model</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

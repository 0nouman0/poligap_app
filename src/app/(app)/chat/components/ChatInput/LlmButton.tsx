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
import { Button } from "@/components/common/common-button";

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
                suffixIcon={
                  <ChevronDown
                    className="text-muted-foreground dark:text-muted-foreground"
                    style={{
                      marginRight: "-4px",
                      marginLeft: "auto",
                      width: "16px",
                      height: "16px",
                      opacity: 0.5,
                    }}
                  />
                }
                variant="outline"
                size="sm"
                disabled={disabled}
                className="w-full h-6 px-2 bg-card dark:bg-card border border-border dark:border-border rounded-[3px] text-xs font-medium text-muted-foreground dark:text-muted-foreground hover:bg-accent dark:hover:bg-accent"
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  {value?.modelIcon && (
                    <Icon type={value.modelIcon} size="xs" />
                  )}
                  {value?.shortName ?? "Select Model"}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="z-[1500] max-h-[200px] overflow-y-auto bg-popover dark:bg-popover border-border dark:border-border"
            >
              {LlmsList.map((model) => {
                const isSelected = value?.modelId === model.modelId;
                return (
                  <DropdownMenuItem
                    key={model.modelId}
                    className={`text-xs ${isSelected ? 'bg-accent dark:bg-accent' : ''}`}
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
                            <Icon type={model.modelIcon} size="xs" />
                            <p className="flex-1 text-xs text-foreground dark:text-foreground">
                              {model.shortName}
                            </p>
                            {isSelected && (
                              <Check
                                className="w-3.5 h-3.5 text-foreground dark:text-foreground ml-auto"
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

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

import type { SelectedLanguageTypeProps } from "./../../types/agent";
import { LanguagesList } from "./../../utils/utils";
import { Button } from "@/components/ui/button";

export const SelectLanguageButton = ({
  value,
  disabled = false,
  onSelect,
}: SelectedLanguageTypeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground dark:text-muted-foreground font-medium whitespace-nowrap">Output in -</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-6 px-2 bg-card dark:bg-card border border-border dark:border-border rounded-[3px] text-xs font-medium text-muted-foreground dark:text-muted-foreground hover:bg-accent dark:hover:bg-accent"
                  size="sm"
                  disabled={disabled}
                >
                  <span className="flex-1">{value?.name ?? "Select Language"}</span>
                  <ChevronDown className="text-muted-foreground dark:text-muted-foreground ml-auto size-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent
              className="z-[1500] max-h-[200px] overflow-y-auto bg-popover dark:bg-popover border-border dark:border-border"
            >
              {LanguagesList.map((type) => {
                const isSelected = value?.code === type.code;
                return (
                  <DropdownMenuItem
                    key={type.name}
                    className={`text-xs ${isSelected ? 'bg-accent dark:bg-accent' : ''}`}
                    onSelect={() => onSelect(type)}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "100%",
                      }}
                    >
                      <p className="text-xs text-foreground dark:text-foreground">
                        {" "}
                        {type.name}
                      </p>
                      {isSelected && (
                        <Check
                          className="w-3.5 h-3.5 text-foreground dark:text-foreground ml-auto"
                        />
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipTrigger>
        <TooltipContent style={{ zIndex: 1600 }}>
          Select language
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

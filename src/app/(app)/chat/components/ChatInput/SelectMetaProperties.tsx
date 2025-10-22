import type { MultiSelectOption, MultiSelectProps } from "@/types/agent";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
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

export const SelectMetaProperties: React.FC<MultiSelectProps> = ({
  options: initialOptions,
  onChange,
  disabled = false,
}) => {
  // Hidden: Search and tools button removed per request
  return null;
};

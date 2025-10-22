import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: number;
  noMargin?: boolean;
  margin?: number;
  className?: string;
}

export function LoadingSpinner({
  size = 20,
  noMargin = false,
  margin = 0,
  className,
}: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn(
        "animate-spin text-current",
        !noMargin && margin > 0 && `mr-${margin}`,
        className
      )}
      style={{
        width: size,
        height: size,
        margin: noMargin ? 0 : undefined,
      }}
    />
  );
}

"use client";

import * as React from "react";
import { PiMoonStars, PiSun } from "react-icons/pi";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (!mounted) return;

    // Toggle between light and dark themes
    if (resolvedTheme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 cursor-pointer"
        disabled
      >
        <PiSun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 cursor-pointer transition-all duration-200 hover:bg-accent"
      onClick={toggleTheme}
      title={`Current: ${resolvedTheme}, Click to switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      {resolvedTheme === "dark" ? (
        <PiSun className="h-4 w-4 transition-all duration-200" />
      ) : (
        <PiMoonStars className="h-4 w-4 transition-all duration-200" />
      )}
    </Button>
  );
}

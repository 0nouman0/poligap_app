"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function TestTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8 min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Theme Test Page</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Theme Controls */}
          <div className="p-6 bg-card rounded-lg border">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">Theme Controls</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Current Theme:</span>
                <code className="px-2 py-1 bg-muted rounded text-xs">{resolvedTheme}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Theme State:</span>
                <code className="px-2 py-1 bg-muted rounded text-xs">{theme}</code>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setTheme("light")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
              >
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm"
              >
                Dark
              </button>
              <button
                onClick={() => setTheme("system")}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-md text-sm"
              >
                System
              </button>
            </div>

            <div className="mt-4">
              <ThemeToggle />
            </div>
          </div>

          {/* Color Preview */}
          <div className="p-6 bg-card rounded-lg border">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">Color Preview</h2>
            <div className="space-y-3">
              <div className="p-3 bg-background border rounded">
                <span className="text-foreground">Background</span>
              </div>
              <div className="p-3 bg-card border rounded">
                <span className="text-card-foreground">Card</span>
              </div>
              <div className="p-3 bg-muted border rounded">
                <span className="text-muted-foreground">Muted</span>
              </div>
              <div className="p-3 bg-accent border rounded">
                <span className="text-accent-foreground">Accent</span>
              </div>
              <div className="p-3 bg-primary border rounded">
                <span className="text-primary-foreground">Primary</span>
              </div>
              <div className="p-3 bg-secondary border rounded">
                <span className="text-secondary-foreground">Secondary</span>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-6 bg-card rounded-lg border">
          <h2 className="text-xl font-semibold mb-4 text-card-foreground">Debug Info</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Resolved Theme:</strong> {resolvedTheme}
            </div>
            <div>
              <strong>Theme State:</strong> {theme}
            </div>
            <div>
              <strong>HTML Class:</strong> <code>{typeof document !== 'undefined' ? document.documentElement.className : 'loading...'}</code>
            </div>
            <div>
              <strong>Local Storage:</strong> <code>{typeof window !== 'undefined' ? localStorage.getItem('poligap-theme') : 'loading...'}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";

export default function DebugThemePage() {
  return (
    <div className="p-8 min-h-screen bg-background text-foreground">
      <h1 className="text-2xl font-bold mb-4">Theme Debug Page</h1>
      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-card text-card-foreground">
          <h2 className="text-lg font-semibold mb-2">Theme Toggle Test</h2>
          <ThemeToggle />
          <p className="mt-2 text-sm text-muted-foreground">
            Click the theme toggle above. The background and text should change immediately.
          </p>
        </div>

        <div className="p-4 border rounded-lg bg-card text-card-foreground">
          <h2 className="text-lg font-semibold mb-2">Color Test</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-background border rounded">Background</div>
            <div className="p-3 bg-card border rounded">Card</div>
            <div className="p-3 bg-muted border rounded">Muted</div>
            <div className="p-3 bg-accent border rounded">Accent</div>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-card text-card-foreground">
          <h2 className="text-lg font-semibold mb-2">Text Color Test</h2>
          <p className="text-foreground">Foreground text</p>
          <p className="text-muted-foreground">Muted foreground text</p>
          <p className="text-primary">Primary text</p>
          <p className="text-secondary">Secondary text</p>
        </div>
      </div>
    </div>
  );
}

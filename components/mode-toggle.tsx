"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1">
      <button
        onClick={() => setTheme("light")}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
          theme === "light" ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground"
        )}
      >
        <Sun className="h-4 w-4" />
        Light
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
          theme === "dark" ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground"
        )}
      >
        <Moon className="h-4 w-4" />
        Dark
      </button>
      <button
        onClick={() => setTheme("system")}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
          theme === "system" ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground"
        )}
      >
        <Monitor className="h-4 w-4" />
        System
      </button>
    </div>
  );
}

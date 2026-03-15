"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface ModeToggleProps {
  compact?: boolean;
}

export function ModeToggle({ compact = false }: ModeToggleProps) {
  const { setTheme, theme } = useTheme();
  const options = [
    { key: "light", label: "Light", icon: Sun },
    { key: "dark", label: "Dark", icon: Moon },
    { key: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <div
      className={cn(
        "flex items-center rounded-xl border border-border bg-card/80 backdrop-blur-sm p-1",
        compact ? "gap-1" : "gap-2"
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = theme === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => setTheme(option.key)}
            aria-label={option.label}
            title={option.label}
            className={cn(
              "rounded-lg text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
              compact
                ? "grid h-8 w-8 place-items-center"
                : "flex items-center gap-2 px-3 py-1.5",
              active ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {!compact && option.label}
          </button>
        );
      })}
    </div>
  );
}

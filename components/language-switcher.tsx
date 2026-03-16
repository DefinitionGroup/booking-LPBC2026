"use client";

import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

const options = [
  { value: "en", short: "EN", labelKey: "language.english" },
  { value: "es", short: "ES", labelKey: "language.spanish" },
] as const;

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="flex items-center gap-1 rounded-md bg-muted/40 p-1">
      <div className="grid h-8 w-8 place-items-center text-muted-foreground" title={t("language.label")}>
        <Languages className="h-4 w-4" />
      </div>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={t(option.labelKey)}
          title={t(option.labelKey)}
          onClick={() => setLocale(option.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs transition-colors",
            locale === option.value
              ? "bg-muted text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {option.short}
        </button>
      ))}
    </div>
  );
}

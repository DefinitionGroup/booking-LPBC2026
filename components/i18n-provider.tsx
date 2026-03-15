"use client";

import {
  createContext,
  useContext,
  useMemo,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  createTranslator,
  type Locale,
  type Messages,
} from "@/lib/i18n/shared";

interface I18nContextValue {
  locale: Locale;
  setLocale: (nextLocale: Locale) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}

export function I18nProvider({ locale, messages, children }: I18nProviderProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const value = useMemo<I18nContextValue>(() => {
    const t = createTranslator(messages);

    return {
      locale,
      t,
      setLocale: (nextLocale) => {
        document.cookie = `locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
        startTransition(() => {
          router.refresh();
        });
      },
    };
  }, [locale, messages, router]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

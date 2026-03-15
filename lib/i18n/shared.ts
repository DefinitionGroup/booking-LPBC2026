import en from "@/messages/en.json";
import es from "@/messages/es.json";

export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];
export type Messages = typeof en;
export type TranslationValues = Record<string, string | number>;

const dictionaries: Record<Locale, Messages> = {
  en,
  es,
};

function getByPath(obj: unknown, path: string) {
  return path.split(".").reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === "object" && segment in acc) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, obj);
}

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDictionary(locale: Locale): Messages {
  return dictionaries[locale] ?? dictionaries.en;
}

export function createTranslator(messages: Messages) {
  return (key: string, values?: TranslationValues): string => {
    const raw = getByPath(messages, key);
    if (typeof raw !== "string") return key;

    if (!values) return raw;

    return raw.replace(/\{(\w+)\}/g, (_, variable) => {
      const value = values[variable];
      return value === undefined ? `{${variable}}` : String(value);
    });
  };
}

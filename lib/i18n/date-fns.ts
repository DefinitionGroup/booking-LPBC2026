import { enUS, es } from "date-fns/locale";
import type { Locale as DateFnsLocale } from "date-fns";
import type { Locale } from "@/lib/i18n/shared";

const locales: Record<Locale, DateFnsLocale> = {
  en: enUS,
  es,
};

export function getDateFnsLocale(locale: Locale): DateFnsLocale {
  return locales[locale] ?? enUS;
}

import { cookies } from "next/headers";
import {
  createTranslator,
  getDictionary,
  isLocale,
  type Locale,
} from "@/lib/i18n/shared";

const LOCALE_COOKIE = "locale";
const DEFAULT_LOCALE: Locale = "en";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  if (cookieLocale && isLocale(cookieLocale)) {
    return cookieLocale;
  }

  return DEFAULT_LOCALE;
}

export async function getServerI18n() {
  const locale = await getServerLocale();
  const messages = getDictionary(locale);
  const t = createTranslator(messages);

  return {
    locale,
    messages,
    t,
  };
}

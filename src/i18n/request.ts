import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override ?? base) as T;
  }

  const result: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    result[key] = key in base ? deepMerge((base as Record<string, unknown>)[key], value) : value;
  }

  return result as T;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const enMessages = (await import(`../../messages/en.json`)).default;
  if (locale === "en") {
    return {
      locale,
      messages: enMessages,
    };
  }

  const localeMessages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages: deepMerge(enMessages, localeMessages),
  };
});

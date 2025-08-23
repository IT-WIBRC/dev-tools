import { translations } from "#utils/internationalization/translation-loader.js";
import type { DeepKeys } from "#utils/configs/schema.js";

export type I18nKeys = DeepKeys<typeof import("#locales/en.json")>;

function resolveNestedKey(
  obj: Record<string, any>,
  key: string,
): string | undefined {
  const parts = key.split(".");
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

export function t(
  key: I18nKeys,
  variables: Record<string, string> = {},
): string {
  const translatedString = resolveNestedKey(translations, key as string) || key;

  let result = translatedString;
  for (const [varName, varValue] of Object.entries(variables)) {
    result = result.replace(`{${varName}}`, varValue);
  }

  return result;
}

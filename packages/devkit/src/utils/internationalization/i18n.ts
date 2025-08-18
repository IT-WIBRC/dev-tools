import fs from "fs-extra";
import path from "path";
import { osLocale } from "os-locale";
import {
  type TextLanguageValues,
  TextLanguages,
  type DeepKeys,
} from "#utils/configs/schema.js";
import { findLocalesDir } from "#utils/file-finder.js";
import { DevkitError } from "#utils/errors/base.js";

export type I18nKeys = DeepKeys<typeof import("#locales/en.json")>;

let translations: Record<string, string> = {};

function getSupportedLanguage(
  lang?: string | null,
): TextLanguageValues | undefined {
  if (!lang) return undefined;

  const supportedLanguages = Object.values(TextLanguages);
  const validatedLang = lang?.split(/[_.-]/)[0]?.toLowerCase();

  return supportedLanguages.includes(validatedLang as TextLanguageValues)
    ? (validatedLang as TextLanguageValues)
    : undefined;
}

export async function loadTranslations(
  configLang: TextLanguageValues | null,
): Promise<void> {
  const userLang = getSupportedLanguage(configLang);
  const rawSystemLocale = await osLocale();
  const systemLang = getSupportedLanguage(rawSystemLocale);
  const languageToLoad = userLang || systemLang || "en";

  try {
    const localesDir = await findLocalesDir();
    const filePath = path.join(localesDir, `${languageToLoad}.json`);

    translations = await fs.readJson(filePath, { encoding: "utf-8" });
  } catch (error) {
    const localesDir = await findLocalesDir();
    const fallbackPath = path.join(localesDir, "en.json");
    try {
      translations = await fs.readJson(fallbackPath, { encoding: "utf-8" });
    } catch (e) {
      throw new DevkitError(
        `Failed to load translations from both ${languageToLoad}.json and the fallback en.json`,
        { cause: e },
      );
    }
  }
}

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

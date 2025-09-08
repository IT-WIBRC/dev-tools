import fs from "#utils/fileSystem.js";
import path from "path";
import { osLocale } from "os-locale";
import {
  type TextLanguageValues,
  TextLanguages,
} from "#utils/configs/schema.js";
import { DevkitError } from "#utils/errors/base.js";
import { findLocalesDir } from "#utils/files/locales.js";

export let translations: Record<string, string> = {};

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

    translations = await fs.readJson(filePath);
  } catch (error) {
    const localesDir = await findLocalesDir();
    const fallbackPath = path.join(localesDir, "en.json");
    try {
      translations = await fs.readJson(fallbackPath);
    } catch (e) {
      throw new DevkitError(
        `Failed to load translations from both ${languageToLoad}.json and the fallback en.json`,
        { cause: e },
      );
    }
  }
}

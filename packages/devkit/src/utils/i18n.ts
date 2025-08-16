import fs from "fs-extra";
import path from "path";
import { osLocale } from "os-locale";
import { TextLanguageValues, TextLanguages } from "../config.js";
import { findLocalesDir } from "./file-finder.js";
import chalk from "chalk";

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
    const localesDir = findLocalesDir();
    const filePath = path.join(localesDir, `${languageToLoad}.json`);

    if (fs.existsSync(filePath)) {
      translations = await fs.readJson(filePath, { encoding: "utf-8" });
    } else {
      const fallbackPath = path.join(localesDir, "en.json");
      if (fs.existsSync(fallbackPath)) {
        translations = await fs.readJson(fallbackPath, { encoding: "utf-8" });
      }
    }
  } catch (error) {
    console.error(chalk.bgRedBright("Error loading translations:"), error);
    translations = {};
  }
}

export function t(key: string, variables: Record<string, string> = {}): string {
  let translatedString = translations[key] || key;

  for (const [varName, varValue] of Object.entries(variables)) {
    translatedString = translatedString.replace(`{${varName}}`, varValue);
  }

  return translatedString;
}

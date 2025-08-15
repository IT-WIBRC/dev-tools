import fs from "fs-extra";
import path from "path";
import { TextLanguageValues } from "../config.js";
import { findLocalesDir } from "./file-finder.js";

let translations: Record<string, string> = {};

export async function loadTranslations(
  lang: TextLanguageValues,
): Promise<void> {
  const localesDir = findLocalesDir();
  const filePath = path.join(localesDir, `${lang}.json`);

  if (fs.existsSync(filePath)) {
    translations = await fs.readJson(filePath, { encoding: "utf-8" });
  } else {
    const fallbackPath = path.join(localesDir, "en.json");
    if (fs.existsSync(fallbackPath)) {
      translations = await fs.readJson(fallbackPath, { encoding: "utf-8" });
    }
  }
}

export function t(key: string, variables: Record<string, string> = {}): string {
  let translatedString = translations[key] || key;

  for (const [varName, varValue] of Object.entries(variables)) {
    translatedString = translatedString.replace(`{${varName}}`, varValue);
  }

  return translatedString;
}

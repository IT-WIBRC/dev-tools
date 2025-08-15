import fs from "fs-extra";
import path from "path";
import { findLocalesDir } from "./file-finder.js";
let translations = {};
export async function loadTranslations(lang) {
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
export function t(key, variables = {}) {
  let translatedString = translations[key] || key;
  for (const [varName, varValue] of Object.entries(variables)) {
    translatedString = translatedString.replace(`{${varName}}`, varValue);
  }
  return translatedString;
}

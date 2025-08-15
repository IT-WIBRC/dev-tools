import fs from "fs-extra";
import path from "path";
import { TextLanguageValues } from "../config.js";
import { loadUserConfig } from "./config.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");

let translations: Record<string, string> = {};

export async function loadTranslations(
  lang: TextLanguageValues,
): Promise<void> {
  const filePath = path.join(projectRoot, "locales", `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readJsonSync(filePath, { encoding: "utf-8" });
    translations = fileContent;
  } else {
    const fallbackPath = path.join(projectRoot, "locales", "en.json");
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

(async () => {
  const config = await loadUserConfig();
  await loadTranslations(config.settings.language);
})();

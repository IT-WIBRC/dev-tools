import fs from "fs-extra";
import path, { dirname } from "path";
import os from "os";
import { CliConfig, CONFIG_FILE_NAMES, defaultCliConfig } from "../config.js";
import { t } from "./i18n.js";
import { fileURLToPath } from "url";

export function findConfigFile(): string | null {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  let currentDir = path.resolve(__dirname, "../../");

  const homeDir = os.homedir();

  while (currentDir !== homeDir && currentDir !== path.dirname(currentDir)) {
    for (const name of CONFIG_FILE_NAMES) {
      const filePath = path.join(currentDir, name);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}

export async function loadUserConfig(): Promise<CliConfig> {
  const configFilePath = findConfigFile();

  if (configFilePath) {
    try {
      const userConfig = await fs.readJson(configFilePath);
      return {
        ...defaultCliConfig,
        settings: {
          ...defaultCliConfig.settings,
          ...userConfig.settings,
        },
        templates: {
          ...defaultCliConfig.templates,
          ...userConfig.templates,
        },
      };
    } catch (error) {
      console.error(
        t("error.config.parse", {
          file: path.basename(configFilePath),
        }),
        error,
      );

      return defaultCliConfig;
    }
  }
  return defaultCliConfig;
}

export async function saveUserConfig(config: CliConfig): Promise<void> {
  const existingConfigPath = findConfigFile();
  const targetPath =
    existingConfigPath || path.join(os.homedir(), CONFIG_FILE_NAMES[1] || "");
  try {
    await fs.writeJson(targetPath, config, { spaces: 2 });
  } catch (error) {
    console.error(t("error.config.save", { file: targetPath }));
    throw error;
  }
}

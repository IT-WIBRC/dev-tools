import fs from "fs-extra";
import path from "path";
import os from "os";
import deepmerge from "deepmerge";
import {
  CliConfig,
  CONFIG_FILE_NAMES,
  defaultCliConfig,
  TextLanguageValues,
} from "../config.js";
import { findProjectRoot } from "./file-finder.js";
import { t } from "./i18n.js";
import chalk from "chalk";

export function findGlobalConfig(): string | null {
  const globalPath = path.join(
    os.homedir(),
    CONFIG_FILE_NAMES[1] || ".devkitrc.json",
  );
  return fs.existsSync(globalPath) ? globalPath : null;
}

export function findLocalConfig(): string | null {
  try {
    const projectRoot = findProjectRoot();
    for (const name of CONFIG_FILE_NAMES) {
      const filePath = path.join(projectRoot, name);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function getLocaleFromConfig(): Promise<TextLanguageValues> {
  const globalConfigPath = findGlobalConfig();
  if (globalConfigPath) {
    try {
      const globalConfig = await fs.readJson(globalConfigPath);
      if (globalConfig?.settings?.language) {
        return globalConfig.settings.language;
      }
    } catch (error) {
      console.warn(
        chalk.yellow(
          `Warning: Failed to read global config at ${globalConfigPath}. Using default language.`,
        ),
      );
    }
  }

  const localConfigPath = findLocalConfig();
  if (localConfigPath) {
    try {
      const localConfig = await fs.readJson(localConfigPath);
      if (localConfig?.settings?.language) {
        return localConfig.settings.language;
      }
    } catch (error) {
      console.warn(
        chalk.yellow(
          `Warning: Failed to read local config at ${localConfigPath}. Using default language.`,
        ),
      );
    }
  }

  return "en";
}

export async function loadUserConfig(): Promise<CliConfig> {
  let finalConfig = defaultCliConfig;

  const globalConfigPath = findGlobalConfig();
  if (globalConfigPath) {
    try {
      const globalConfig = await fs.readJson(globalConfigPath);
      finalConfig = deepmerge(finalConfig, globalConfig);
    } catch (error) {
      console.error(
        t("error.config.parse", { file: path.basename(globalConfigPath) }),
        error,
      );
    }
  } else {
    console.warn(chalk.yellow(t("warning.global.config.not.initialized")));
  }

  const localConfigPath = findLocalConfig();
  if (localConfigPath) {
    try {
      const localConfig = await fs.readJson(localConfigPath);
      finalConfig = deepmerge(finalConfig, localConfig);
    } catch (error) {
      console.error(
        t("error.config.parse", { file: path.basename(localConfigPath) }),
        error,
      );
    }
  }

  return finalConfig;
}

export async function saveGlobalConfig(config: CliConfig): Promise<void> {
  const targetPath = path.join(
    os.homedir(),
    CONFIG_FILE_NAMES[0] || ".devkitrc.json",
  );
  try {
    await fs.writeJson(targetPath, config, { spaces: 2 });
  } catch (error) {
    console.error(t("error.config.save", { file: targetPath }));
    throw error;
  }
}

export async function saveLocalConfig(config: CliConfig): Promise<void> {
  const existingConfigPath = findLocalConfig();
  if (!existingConfigPath) {
    throw new Error(t("error.save.local.config.not_found"));
  }
  try {
    await fs.writeJson(existingConfigPath, config, { spaces: 2 });
  } catch (error) {
    console.error(t("error.config.save", { file: existingConfigPath }));
    throw error;
  }
}

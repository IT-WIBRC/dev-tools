import fs from "fs-extra";
import path from "path";
import os from "os";
import deepmerge from "deepmerge";
import type { Ora } from "ora";
import chalk from "chalk";
import {
  type CliConfig,
  CONFIG_FILE_NAMES,
  defaultCliConfig,
  type TextLanguageValues,
  type CacheStrategy,
} from "./schema.js";
import { findConfigPath } from "../file-finder.js";
import { t } from "../internationalization/i18n.js";
import { ConfigError, DevkitError } from "../errors/base.js";

async function findGlobalConfigPath(): Promise<string | null> {
  const globalConfigName = CONFIG_FILE_NAMES[0] || ".devkitrc.json";
  const globalPath = path.join(os.homedir(), globalConfigName);
  try {
    await fs.promises.stat(globalPath);
    return globalPath;
  } catch (e) {
    return null;
  }
}

export async function getLocaleFromConfig(
  spinner?: Ora,
): Promise<TextLanguageValues | null> {
  if (spinner) {
    spinner.text = chalk.cyan(
      "Checking for local or monorepo configuration...",
    );
  }

  let localOrMonorepoConfigPath: string | null = null;
  try {
    localOrMonorepoConfigPath = await findConfigPath();
  } catch (error) {
    // Intentionally ignore this error to allow the function to check for a global config.
  }

  if (localOrMonorepoConfigPath) {
    try {
      const config = await fs.readJson(localOrMonorepoConfigPath);
      if (config?.settings?.language) {
        return config.settings.language;
      }
    } catch (error) {
      throw new ConfigError(
        `Failed to read local config at ${localOrMonorepoConfigPath}.`,
        localOrMonorepoConfigPath,
        { cause: error },
      );
    }
  }

  const globalConfigPath = await findGlobalConfigPath();
  if (globalConfigPath) {
    if (spinner) {
      spinner.text = chalk.cyan(
        "Local config not found. Checking for global configuration...",
      );
    }
    try {
      const config = await fs.readJson(globalConfigPath);
      if (config?.settings?.language) {
        return config.settings.language;
      }
    } catch (error) {
      throw new ConfigError(
        `Failed to read global config at ${globalConfigPath}.`,
        globalConfigPath,
        { cause: error },
      );
    }
  }

  return defaultCliConfig.settings.language;
}

export async function loadUserConfig(spinner?: Ora): Promise<CliConfig> {
  if (spinner) {
    spinner.text = chalk.cyan(t("config.check.local"));
  }

  let finalConfig = defaultCliConfig;
  let configFilePath = "";
  let configFound = false;

  try {
    configFilePath = await findConfigPath();
  } catch (error) {
    // Intentionally ignore this error to allow the function to check for a global config.
  }

  if (configFilePath) {
    configFound = true;
    try {
      const localConfig = await fs.readJson(configFilePath);
      finalConfig = deepmerge(finalConfig, localConfig);
    } catch (error) {
      throw new ConfigError(
        t("error.config.parse", { file: path.basename(configFilePath) }),
        configFilePath,
        { cause: error },
      );
    }
  }

  const globalConfigPath = await findGlobalConfigPath();
  if (globalConfigPath) {
    if (spinner) {
      spinner.text = chalk.cyan(t("config.check.global"));
    }
    try {
      const globalConfig = await fs.readJson(globalConfigPath);
      finalConfig = deepmerge(finalConfig, globalConfig);
    } catch (error) {
      throw new ConfigError(
        t("error.config.parse", { file: path.basename(globalConfigPath) }),
        globalConfigPath,
        { cause: error },
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
    throw new ConfigError(
      t("error.config.save", { file: targetPath }),
      targetPath,
      { cause: error },
    );
  }
}

export async function saveLocalConfig(config: CliConfig): Promise<void> {
  const existingConfigPath = await findConfigPath();
  if (!existingConfigPath) {
    throw new DevkitError(t("error.save.local.config.not_found"));
  }
  try {
    await fs.writeJson(existingConfigPath, config, { spaces: 2 });
  } catch (error) {
    throw new ConfigError(
      t("error.config.save", { file: existingConfigPath }),
      existingConfigPath,
      { cause: error },
    );
  }
}

export async function updateTemplateCacheStrategy(
  templateName: string,
  strategy: CacheStrategy,
  config: CliConfig,
): Promise<void> {
  const targetPath = await findConfigPath();
  if (!targetPath) {
    throw new ConfigError(t("error.config.not.found"), "");
  }

  let foundTemplate = false;
  for (const language of Object.keys(config.templates)) {
    if (config.templates[language]?.templates[templateName]) {
      config.templates[language].templates[templateName].cacheStrategy =
        strategy;
      foundTemplate = true;
      break;
    }
  }

  if (!foundTemplate) {
    throw new ConfigError(
      t("error.template.not_found", { template: templateName }),
      "",
    );
  }

  try {
    await fs.writeJson(targetPath, config, { spaces: 2 });
  } catch (error) {
    throw new ConfigError(
      t("error.config.save", { file: targetPath }),
      targetPath,
      { cause: error },
    );
  }
}

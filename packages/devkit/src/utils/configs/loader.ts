import fs from "fs-extra";
import path from "path";
import os from "os";
import deepmerge from "deepmerge";
import type { Ora } from "ora";
import {
  type CliConfig,
  CONFIG_FILE_NAMES,
  defaultCliConfig,
  type CacheStrategy,
  SUPPORTED_LANGUAGES,
  type TextLanguageValues,
  type ConfigurationSource,
} from "./schema.js";
import { findMonorepoRoot, findProjectRoot, findUp } from "../file-finder.js";
import { t } from "../internationalization/i18n.js";
import { ConfigError, DevkitError } from "../errors/base.js";

export async function getConfigFilepath(isGlobal = false): Promise<string> {
  if (isGlobal) {
    return path.join(os.homedir(), CONFIG_FILE_NAMES[0]);
  }

  const localConfigPath = await findUp([...CONFIG_FILE_NAMES], process.cwd());

  if (localConfigPath) {
    return localConfigPath;
  }

  const monorepoRoot = await findMonorepoRoot();
  if (monorepoRoot) {
    return path.join(monorepoRoot, CONFIG_FILE_NAMES[1]);
  }

  const projectRoot = await findProjectRoot();
  if (projectRoot) {
    return path.join(projectRoot, CONFIG_FILE_NAMES[1]);
  }

  return path.join(process.cwd(), CONFIG_FILE_NAMES[0]);
}

export async function getLocaleFromConfigMinimal(): Promise<TextLanguageValues> {
  const localConfigPath = await findUp([...CONFIG_FILE_NAMES], process.cwd());
  if (localConfigPath) {
    try {
      const config = await fs.readJson(localConfigPath);
      if (
        config?.settings?.language &&
        SUPPORTED_LANGUAGES.includes(config.settings.language)
      ) {
        return config.settings.language;
      }
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw new ConfigError(
          "Failed to read local config for locale.",
          localConfigPath,
          { cause: error },
        );
      }
    }
  }

  const globalConfigPath = path.join(os.homedir(), CONFIG_FILE_NAMES[0]);
  try {
    const config = await fs.readJson(globalConfigPath);
    if (
      config?.settings?.language &&
      SUPPORTED_LANGUAGES.includes(config.settings.language)
    ) {
      return config.settings.language;
    }
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      throw new ConfigError(
        "Failed to read global config for locale.",
        globalConfigPath,
        { cause: error },
      );
    }
  }
  return defaultCliConfig.settings.language;
}

export async function readConfigAtPath(
  filePath: string,
): Promise<CliConfig | null> {
  try {
    const config = await fs.readJson(filePath);
    return config;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw new ConfigError(
      t("error.config.parse", { file: path.basename(filePath) }),
      filePath,
      { cause: error },
    );
  }
}

export async function loadUserConfig(spinner?: Ora): Promise<{
  config: CliConfig;
  source: ConfigurationSource;
}> {
  let finalConfig = { ...defaultCliConfig };
  let source: ConfigurationSource = "default";

  if (spinner) {
    spinner.text = t("config.check.global");
  }

  const globalConfigPath = await getConfigFilepath(true);
  const globalConfig = await readConfigAtPath(globalConfigPath);

  if (globalConfig) {
    if (source === "default") {
      source = "global";
    }
    finalConfig = deepmerge(finalConfig, globalConfig);
  }

  if (spinner) {
    spinner.text = t("config.check.local");
  }

  const localConfigPath = await getConfigFilepath();
  const localConfig = await readConfigAtPath(localConfigPath);

  if (localConfig) {
    finalConfig = deepmerge(finalConfig, localConfig);
    source = "local";
  }

  return { config: finalConfig, source };
}

export async function saveConfig(config: CliConfig, filePath: string) {
  try {
    await fs.writeJson(filePath, config, { spaces: 2 });
  } catch (error) {
    throw new DevkitError(t("error.config.save", { file: filePath }), {
      cause: error,
    });
  }
}

export async function saveCliConfig(config: CliConfig, isGlobal = false) {
  const filePath = await getConfigFilepath(isGlobal);
  await saveConfig(config, filePath);
}

export async function saveGlobalConfig(config: CliConfig): Promise<void> {
  const targetPath = await getConfigFilepath(true);
  await saveConfig(config, targetPath);
}

export async function saveLocalConfig(config: CliConfig): Promise<void> {
  const targetPath = await getConfigFilepath();
  await saveConfig(config, targetPath);
}

export async function updateTemplateCacheStrategy(
  templateName: string,
  strategy: CacheStrategy,
  config: CliConfig,
): Promise<void> {
  const targetPath = await getConfigFilepath();
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

  await saveConfig(config, targetPath);
}

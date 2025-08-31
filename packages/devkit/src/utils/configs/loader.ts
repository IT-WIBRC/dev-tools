import deepmerge from "deepmerge";
import type { Ora } from "ora";
import fs from "fs-extra";
import {
  type CliConfig,
  CONFIG_FILE_NAMES,
  defaultCliConfig,
  SUPPORTED_LANGUAGES,
  type TextLanguageValues,
  type ConfigurationSource,
} from "./schema.js";
import { t } from "#utils/internationalization/i18n.js";
import { ConfigError } from "../errors/base.js";
import { findUp } from "../files/find-up.js";
import { getConfigFilepath } from "./path-finder.js";
import { readConfigAtPath } from "./reader.js";
import { findGlobalConfigFile, findLocalConfigFile } from "../files/finder.js";

export async function getLocaleFromConfigMinimal(): Promise<TextLanguageValues> {
  const localConfigPath = await findUp([...CONFIG_FILE_NAMES], process.cwd());
  if (localConfigPath) {
    try {
      const config = await readConfigAtPath(localConfigPath);
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

  const globalConfigPath = await getConfigFilepath(true);
  try {
    const config = await readConfigAtPath(globalConfigPath);
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

interface ReadConfigOptions {
  forceGlobal?: boolean;
  forceLocal?: boolean;
}

export async function readAndMergeConfigs(
  options: ReadConfigOptions = {},
): Promise<{ config: CliConfig; source: ConfigurationSource }> {
  let finalConfig: CliConfig = JSON.parse(JSON.stringify(defaultCliConfig));
  let source: "local" | "global" | "default" = "default";
  let configPath: string | null = null;

  if (!options.forceGlobal) {
    configPath = await findLocalConfigFile();
    if (configPath) {
      source = "local";
    }
  }

  if (source === "default") {
    configPath = await findGlobalConfigFile();
    if (configPath && (await fs.pathExists(configPath))) {
      source = "global";
    }
  }

  if (configPath && (await fs.pathExists(configPath))) {
    try {
      const foundConfig = await fs.readJson(configPath);
      finalConfig = deepmerge(finalConfig, foundConfig, {
        arrayMerge: (_, sourceArray) => sourceArray,
      });
    } catch (e) {
      console.error(
        `Warning: Invalid configuration file found at ${configPath}. Using default settings.`,
      );
      source = "default";
    }
  }

  return { config: finalConfig, source };
}

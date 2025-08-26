import os from "os";
import path from "path";
import deepmerge from "deepmerge";
import type { Ora } from "ora";
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

  const globalConfigPath = path.join(os.homedir(), CONFIG_FILE_NAMES[0]);
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

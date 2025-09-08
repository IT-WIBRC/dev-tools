import fs from "#utils/fileSystem.js";
import { DevkitError, ConfigError } from "../errors/base.js";
import { t } from "#utils/internationalization/i18n.js";
import { getConfigFilepath } from "./path-finder.js";
import { type CliConfig, type CacheStrategy } from "./schema.js";

export async function saveConfig(config: CliConfig, filePath: string) {
  try {
    await fs.writeJson(filePath, config);
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

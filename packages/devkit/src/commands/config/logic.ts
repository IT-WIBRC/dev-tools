import {
  type CliConfig,
  type TemplateConfig,
  type SupportedPackageManager,
  type CacheStrategy,
} from "#utils/schema/schema.js";
import { t } from "#utils/i18n/translator.js";
import { DevkitError } from "#utils/errors/base.js";
import deepmerge from "deepmerge";
import { readAndMergeConfigs } from "#core/config/loader.js";
import { saveGlobalConfig, saveLocalConfig } from "#core/config/writer.js";
import { validateConfigValue } from "#utils/validations/validateConfigValue.js";
import { configAliases } from "#utils/validations/configAliases.js";
import {
  validateAlias,
  validateDescription,
  validateLocation,
} from "#utils/validations/templates.js";
import {
  validatePackageManager,
  validateCacheStrategy,
} from "#utils/validations/config.js";

async function saveConfig(
  targetConfig: CliConfig,
  isGlobal: boolean,
): Promise<void> {
  if (isGlobal) {
    await saveGlobalConfig(targetConfig);
  } else {
    await saveLocalConfig(targetConfig);
  }
}

export async function handleNonInteractiveSettingsUpdate(
  key: string,
  value: string,
  isGlobal: boolean,
): Promise<void> {
  const { config, source } = await readAndMergeConfigs({
    forceGlobal: isGlobal,
  });

  if (source === "default" && !isGlobal) {
    throw new DevkitError(t("error.config.local.not.found"));
  }

  const canonicalKey = (
    configAliases as Record<string, keyof CliConfig["settings"]>
  )[key];

  validateConfigValue(canonicalKey, value);

  (config.settings[canonicalKey] as unknown) = value;

  await saveConfig(config, isGlobal);
}

export async function handleNonInteractiveTemplateUpdate(
  language: string,
  templateName: string,
  cmdOptions: {
    description?: string;
    location?: string;
    alias?: string | "null";
    cacheStrategy?: CacheStrategy | "null";
    packageManager?: SupportedPackageManager | "null";
    newName?: string;
  },
  isGlobal: boolean,
): Promise<void> {
  const { config, source } = await readAndMergeConfigs({
    forceGlobal: isGlobal,
  });

  if (source === "default" && !isGlobal) {
    throw new DevkitError(t("error.config.local.not.found"));
  }

  const languageTemplates = config.templates[language];
  if (!languageTemplates) {
    throw new DevkitError(t("error.language_config_not_found", { language }));
  }

  const templateKey = Object.keys(languageTemplates.templates).find(
    (key) =>
      key === templateName ||
      languageTemplates.templates[key]?.alias === templateName,
  );

  if (!templateKey) {
    throw new DevkitError(
      t("error.template.not_found", { template: templateName }),
    );
  }

  const templateConfig = languageTemplates.templates[templateKey]!;

  const updates: Partial<TemplateConfig> = {};
  const deletions: string[] = [];

  if (cmdOptions.description !== undefined) {
    validateDescription(cmdOptions.description);
    updates.description = cmdOptions.description;
  }
  if (cmdOptions.location !== undefined) {
    validateLocation(cmdOptions.location);
    updates.location = cmdOptions.location;
  }
  if (cmdOptions.alias !== undefined) {
    if (cmdOptions.alias === "null") {
      deletions.push("alias");
    } else {
      validateAlias(cmdOptions.alias);
      updates.alias = cmdOptions.alias;
    }
  }
  if (cmdOptions.cacheStrategy !== undefined) {
    if (cmdOptions.cacheStrategy === "null") {
      deletions.push("cacheStrategy");
    } else {
      validateCacheStrategy(cmdOptions.cacheStrategy);
      updates.cacheStrategy = cmdOptions.cacheStrategy;
    }
  }
  if (cmdOptions.packageManager !== undefined) {
    if (cmdOptions.packageManager === "null") {
      deletions.push("packageManager");
    } else {
      validatePackageManager(cmdOptions.packageManager);
      updates.packageManager = cmdOptions.packageManager;
    }
  }

  const mergedTemplate = deepmerge(templateConfig, updates);

  const finalTemplate: TemplateConfig = Object.fromEntries(
    Object.entries(mergedTemplate).filter(([key]) => !deletions.includes(key)),
  ) as TemplateConfig;

  if (cmdOptions.newName && cmdOptions.newName !== templateKey) {
    if (languageTemplates.templates[cmdOptions.newName]) {
      throw new DevkitError(
        t("error.template.exists", { template: cmdOptions.newName }),
      );
    }
    languageTemplates.templates[cmdOptions.newName] = finalTemplate;
    delete languageTemplates.templates[templateKey];
  } else {
    languageTemplates.templates[templateKey] = finalTemplate;
  }

  await saveConfig(config, isGlobal);
}

import {
  type CliConfig,
  type TemplateConfig,
  type SupportedPackageManager,
  type CacheStrategy,
  VALID_CACHE_STRATEGIES,
  VALID_PACKAGE_MANAGERS,
} from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import { DevkitError } from "#utils/errors/base.js";
import deepmerge from "deepmerge";
import { readAndMergeConfigs } from "#utils/configs/loader.js";
import { saveGlobalConfig, saveLocalConfig } from "#utils/configs/writer.js";
import { validateConfigValue } from "#utils/validations/validateConfigValue.js";
import { configAliases } from "#utils/validations/configAliases.js";

export function validateSettingsValue(key: string, value: string): void {
  validateConfigValue(key, value);
}

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

  validateSettingsValue(key, value);

  (config.settings[canonicalKey] as unknown) = value;

  await saveConfig(config, isGlobal);
}

export async function handleNonInteractiveTemplateUpdate(
  language: string,
  templateName: string,
  cmdOptions: {
    description?: string;
    location?: string;
    alias?: string;
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
    updates.description = cmdOptions.description;
  }
  if (cmdOptions.location !== undefined) {
    updates.location = cmdOptions.location;
  }
  if (cmdOptions.alias !== undefined) {
    if (cmdOptions.alias === "null") {
      deletions.push("alias");
    } else {
      updates.alias = cmdOptions.alias;
    }
  }
  if (cmdOptions.cacheStrategy !== undefined) {
    if (cmdOptions.cacheStrategy === "null") {
      deletions.push("cacheStrategy");
    } else if (!VALID_CACHE_STRATEGIES.includes(cmdOptions.cacheStrategy)) {
      throw new DevkitError(
        t("error.invalid.cache_strategy", {
          value: cmdOptions.cacheStrategy,
          options: VALID_CACHE_STRATEGIES.join(", "),
        }),
      );
    } else {
      updates.cacheStrategy = cmdOptions.cacheStrategy;
    }
  }
  if (cmdOptions.packageManager !== undefined) {
    if (cmdOptions.packageManager === "null") {
      deletions.push("packageManager");
    } else if (!VALID_PACKAGE_MANAGERS.includes(cmdOptions.packageManager)) {
      throw new DevkitError(
        t("error.invalid.package_manager", {
          value: cmdOptions.packageManager,
          options: VALID_PACKAGE_MANAGERS.join(", "),
        }),
      );
    } else {
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

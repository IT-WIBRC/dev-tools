import {
  saveLocalConfig,
  saveGlobalConfig,
  readConfigAtPath,
  getConfigFilepath,
} from "#utils/configs/loader.js";
import {
  VALID_CACHE_STRATEGIES,
  VALID_PACKAGE_MANAGERS,
  type CliConfig,
  type TemplateConfig,
  type SetupCommandOptions,
  type UpdateCommandOptions,
} from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import { DevkitError } from "#utils/errors/base.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import ora from "ora";
import chalk from "chalk";
import deepmerge from "deepmerge";

async function getTargetConfig(
  isGlobal: boolean,
  source: string,
  config: CliConfig,
): Promise<CliConfig> {
  if (!source || source === "default") {
    throw new DevkitError(t("error.config.no_file_found"));
  }

  if (isGlobal) {
    if (source === "global") {
      return deepmerge({}, config);
    } else {
      const globalConfigPath = await getConfigFilepath(true);
      const globalConfig = await readConfigAtPath(globalConfigPath);
      if (!globalConfig) {
        throw new DevkitError(t("error.config.global.not.found"));
      }
      return deepmerge({}, globalConfig);
    }
  } else {
    if (source !== "local") {
      throw new DevkitError(t("error.config.local.not.found"));
    }
    return deepmerge({}, config);
  }
}

function getTemplateConfig(
  targetConfig: CliConfig,
  language: string,
  templateName: string,
): { key: string; config: TemplateConfig } {
  const languageTemplates = targetConfig.templates[language];
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

  const templateConfig = languageTemplates.templates[templateKey];
  if (!templateConfig) {
    throw new DevkitError(
      t("error.template.not_found", { template: templateName }),
    );
  }

  return { key: templateKey, config: templateConfig };
}

function processUpdates(cmdOptions: UpdateCommandOptions): {
  updates: any;
  deletions: string[];
} {
  const { description, alias, location, cacheStrategy, packageManager } =
    cmdOptions;
  const updates: any = {};
  const deletions: string[] = [];

  if (description !== undefined) {
    if (description === "null") {
      throw new DevkitError(
        t("error.invalid.remove_required", { key: "description" }),
      );
    }
    updates.description = description;
  }

  if (location !== undefined) {
    if (location === "null") {
      throw new DevkitError(
        t("error.invalid.remove_required", { key: "location" }),
      );
    }
    updates.location = location;
  }

  if (alias !== undefined) {
    if (alias === "null") {
      deletions.push("alias");
    } else {
      updates.alias = alias;
    }
  }

  if (cacheStrategy !== undefined) {
    if (cacheStrategy === "null") {
      deletions.push("cacheStrategy");
    } else if (!VALID_CACHE_STRATEGIES.includes(cacheStrategy)) {
      throw new DevkitError(
        t("error.invalid.cache_strategy", {
          value: cacheStrategy,
          options: VALID_CACHE_STRATEGIES.join(", "),
        }),
      );
    } else {
      updates.cacheStrategy = cacheStrategy;
    }
  }

  if (packageManager !== undefined) {
    if (packageManager === "null") {
      deletions.push("packageManager");
    } else if (!VALID_PACKAGE_MANAGERS.includes(packageManager)) {
      throw new DevkitError(
        t("error.invalid.package_manager", {
          value: packageManager,
          options: VALID_PACKAGE_MANAGERS.join(", "),
        }),
      );
    } else {
      updates.packageManager = packageManager;
    }
  }

  return { updates, deletions };
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

export function setupConfigUpdateCommand(options: SetupCommandOptions) {
  const { program, config, source } = options;

  program
    .command("update")
    .alias("up")
    .description(t("config.update.command.description"))
    .argument("<language>", t("config.update.language.argument"))
    .argument("<templateName>", t("config.update.template.argument"))
    .option("-n, --new-name <string>", t("config.update.option.new_name"))
    .option("-d, --description <string>", t("config.update.option.description"))
    .option("-a, --alias <string>", t("config.update.option.alias"))
    .option("-l, --location <string>", t("config.update.option.location"))
    .option(
      "--cache-strategy <string>",
      t("config.update.option.cache_strategy"),
    )
    .option(
      "--package-manager <string>",
      t("config.update.option.package_manager"),
    )
    .option("-g, --global", t("config.update.option.global"), false)
    .action(
      async (
        language: string,
        templateName: string,
        cmdOptions: UpdateCommandOptions,
      ) => {
        const spinner = ora(
          chalk.cyan(t("config.update.updating", { templateName })),
        ).start();

        try {
          const { global: isGlobal, newName } = cmdOptions;
          const targetConfig = await getTargetConfig(
            isGlobal,
            source as string,
            config,
          );
          const { key: templateKey, config: templateConfig } =
            getTemplateConfig(targetConfig, language, templateName);
          const { updates, deletions } = processUpdates(cmdOptions);

          const mergedTemplate = deepmerge(templateConfig, updates);

          const finalTemplate = Object.fromEntries(
            Object.entries(mergedTemplate).filter(
              ([key]) => !deletions.includes(key),
            ),
          ) as TemplateConfig;

          const updatedLanguageTemplates = Object.fromEntries(
            Object.entries(targetConfig.templates[language]!.templates).filter(
              ([key]) => key !== templateKey,
            ),
          );

          if (newName && newName !== templateKey) {
            if (targetConfig.templates[language]!.templates[newName]) {
              throw new DevkitError(
                t("error.template.exists", { template: newName }),
              );
            }
            updatedLanguageTemplates[newName] = finalTemplate;
          } else {
            updatedLanguageTemplates[templateKey] = finalTemplate;
          }

          targetConfig.templates[language]!.templates =
            updatedLanguageTemplates;

          await saveConfig(targetConfig, isGlobal);

          const successMessage = newName
            ? t("config.update.success_name", {
                oldName: templateName,
                newName,
              })
            : t("config.update.success", { templateName });

          spinner.succeed(chalk.italic.green(successMessage));
        } catch (error) {
          handleErrorAndExit(error, spinner);
        }
      },
    );
}

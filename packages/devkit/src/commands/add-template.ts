import {
  type SetupCommandOptions,
  type TemplateConfig,
  VALID_CACHE_STRATEGIES,
  VALID_PACKAGE_MANAGERS,
  type CliConfig,
} from "#utils/configs/schema.js";
import {
  saveCliConfig,
  readConfigAtPath,
  getConfigFilepath,
} from "#utils/configs/loader.js";
import { t } from "#utils/internationalization/i18n.js";
import { DevkitError } from "#utils/errors/base.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import ora from "ora";
import chalk from "chalk";
import deepmerge from "deepmerge";

export function setupAddTemplateCommand(options: SetupCommandOptions) {
  const { program, config, source } = options;
  program
    .command("add-template <language> <templateName> <location>")
    .description(t("cli.add_template.description"))
    .alias("at")
    .requiredOption(
      "--description <string>",
      t("cli.add_template.options.description"),
    )
    .option("--alias <string>", t("cli.add_template.options.alias"))
    .option("--cache-strategy <string>", t("cli.add_template.options.cache"))
    .option(
      "--package-manager <string>",
      t("cli.add_template.options.package_manager"),
    )
    .option("-g, --global", t("config.set.option.global"), false)
    .action(async (language, templateName, location, cmdOptions) => {
      const addSpinner = ora(chalk.cyan(t("cli.add_template.adding"))).start();
      try {
        if (source === "default") {
          throw new DevkitError(t("error.config.not.found"));
        }

        let targetConfig: CliConfig;
        const isGlobal = cmdOptions.global;

        if (isGlobal) {
          const globalConfigPath = await getConfigFilepath(true);
          const existingGlobalConfig = await readConfigAtPath(globalConfigPath);

          if (!existingGlobalConfig) {
            throw new DevkitError(t("error.config.global.not.found"));
          }
          targetConfig = deepmerge({}, existingGlobalConfig);
        } else {
          if (source === "global") {
            throw new DevkitError(t("error.config.local.not.found"));
          }
          targetConfig = deepmerge({}, config);
        }

        if (!targetConfig.templates[language]) {
          throw new DevkitError(
            t("error.language_config_not_found", { language }),
          );
        }

        const languageConfig = targetConfig.templates[language];

        if (languageConfig.templates[templateName]) {
          throw new DevkitError(
            t("error.template.exists", { template: templateName }),
          );
        }

        if (cmdOptions.alias) {
          const aliasExists = Object.values(languageConfig.templates).some(
            (t) => t.alias === cmdOptions.alias,
          );
          if (aliasExists) {
            throw new DevkitError(
              t("error.alias.exists", { alias: cmdOptions.alias }),
            );
          }
        }

        if (
          cmdOptions.cacheStrategy &&
          !VALID_CACHE_STRATEGIES.includes(cmdOptions.cacheStrategy)
        ) {
          throw new DevkitError(
            t("error.invalid.cache_strategy", {
              value: cmdOptions.cacheStrategy,
              options: VALID_CACHE_STRATEGIES.join(", "),
            }),
          );
        }

        if (
          cmdOptions.packageManager &&
          !VALID_PACKAGE_MANAGERS.includes(cmdOptions.packageManager)
        ) {
          throw new DevkitError(
            t("error.invalid.package_manager", {
              value: cmdOptions.packageManager,
              options: VALID_PACKAGE_MANAGERS.join(", "),
            }),
          );
        }

        const newTemplate: TemplateConfig = {
          description: cmdOptions.description,
          location: location,
          alias: cmdOptions.alias,
          cacheStrategy: cmdOptions.cacheStrategy,
          packageManager: cmdOptions.packageManager,
        };

        languageConfig.templates[templateName] = newTemplate;

        await saveCliConfig(targetConfig, isGlobal);

        addSpinner.succeed(
          chalk.green(t("cli.add_template.success", { templateName })),
        );
      } catch (error) {
        handleErrorAndExit(error, addSpinner);
      }
    });
}

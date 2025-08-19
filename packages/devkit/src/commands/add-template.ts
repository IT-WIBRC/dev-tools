import {
  type SetupCommandOptions,
  type TemplateConfig,
} from "#utils/configs/schema.js";
import { saveCliConfig } from "#utils/configs/loader.js";
import { t } from "#utils/internationalization/i18n.js";
import { DevkitError } from "#utils/errors/base.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import ora from "ora";
import chalk from "chalk";

export function setupAddTemplateCommand(options: SetupCommandOptions) {
  const { program, config } = options;
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
        const languageConfig = config.templates[language];
        if (!languageConfig) {
          throw new DevkitError(
            t("error.language_config_not_found", { language }),
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

        await saveCliConfig(config, cmdOptions.global);

        addSpinner.succeed(
          chalk.green(t("cli.add_template.success", { templateName })),
        );
      } catch (error) {
        handleErrorAndExit(error, addSpinner);
      }
    });
}

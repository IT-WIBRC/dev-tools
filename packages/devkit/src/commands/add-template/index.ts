import ora from "ora";
import chalk from "chalk";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { DevkitError } from "#utils/errors/base.js";
import { t } from "#utils/internationalization/i18n.js";
import type { ConfigurationSource } from "#utils/configs/schema.js";
import type { SetupCommandOptions } from "#utils/configs/schema.js";
import { getConfig } from "./get-config.js";
import { promptForTemplateDetails } from "./prompt-details.js";
import { validateAndSaveTemplate } from "./validate-and-save.js";
import type { AddTemplateCommandOptions, AddTemplateSchema } from "./types.js";

export function setupAddTemplateCommand(
  options: Omit<SetupCommandOptions, "source"> & {
    source: ConfigurationSource;
  },
) {
  const { program, config, source } = options;
  program
    .command("add-template")
    .description(t("cli.add_template.description"))
    .alias("at")
    .option("-g, --global", t("config.set.option.global"), false)
    .option("-i, --interactive", "Force interactive mode", false)
    .option(
      "-l, --language <language>",
      t("new.project.language.argument", {
        language: "the programming language of the template",
      }),
    )
    .option("-n, --name <name>", t("new.project.name.argument"))
    .option(
      "-d, --description <description>",
      t("cli.add_template.options.description"),
    )
    .option(
      "-o, --location <location>",
      t("new.project.template.option.description"),
    )
    .option("-a, --alias <alias>", t("cli.add_template.options.alias"))
    .option(
      "-c, --cache-strategy <strategy>",
      t("cli.add_template.options.cache"),
    )
    .option(
      "-p, --package-manager <manager>",
      t("cli.add_template.options.package_manager"),
    )
    .action(async (cmdOptions: AddTemplateCommandOptions) => {
      const templateNameFromOptions = cmdOptions.name;
      const addSpinner = ora(
        chalk.cyan(
          templateNameFromOptions
            ? t("cli.add_template.adding", {
                templateName: templateNameFromOptions,
              })
            : t("cli.add_template.adding", { templateName: "new template" }),
        ),
      );

      try {
        const isGlobal = !!cmdOptions.global;
        const targetConfig = await getConfig(isGlobal, source, config);

        const isInteractiveMode =
          cmdOptions.interactive ||
          !Object.keys(cmdOptions).some(
            (key) => cmdOptions[key as keyof typeof cmdOptions] !== undefined,
          );
        const requiredOptionsProvided =
          cmdOptions.language &&
          cmdOptions.name &&
          cmdOptions.description &&
          cmdOptions.location;

        let templateDetails: AddTemplateSchema;

        if (isInteractiveMode) {
          templateDetails = await promptForTemplateDetails(
            targetConfig,
            cmdOptions,
          );
        } else {
          if (!requiredOptionsProvided) {
            const requiredFields = [
              "--language",
              "--name",
              "--description",
              "--location",
            ];
            throw new DevkitError(
              t("error.missing_required_options.add_template", {
                fields: requiredFields.join(", "),
              }),
            );
          }
          templateDetails = {
            language: cmdOptions.language!,
            templateName: cmdOptions.name!,
            description: cmdOptions.description!,
            location: cmdOptions.location!,
            alias: cmdOptions.alias,
            cacheStrategy: cmdOptions.cacheStrategy,
            packageManager: cmdOptions.packageManager,
          };
        }

        await validateAndSaveTemplate(
          templateDetails,
          targetConfig,
          isGlobal,
          addSpinner,
        );
      } catch (error) {
        handleErrorAndExit(error, addSpinner);
      }
    });
}

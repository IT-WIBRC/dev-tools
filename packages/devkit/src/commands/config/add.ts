import ora from "ora";
import chalk from "chalk";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { t } from "#utils/i18n/translator.js";
import { readAndMergeConfigs } from "#core/config/loader.js";
import { validateAndSaveTemplate } from "./validate-and-save.js";
import { DevkitError } from "#utils/errors/base.js";
import { type Command } from "commander";
import { type AddCommandOptions, type AddTemplateSchema } from "./types.js";
import { validateProgrammingLanguage } from "#utils/validations/config.js";

export function setupAddCommand(configCommand: Command): void {
  configCommand
    .command("add <language> <templateName>")
    .alias("a")
    .description(t("cli.add_template.description"))
    .option(
      "-d, --description <string>",
      t("cli.add_template.options.description"),
      "",
    )
    .option(
      "-o, --location <string>",
      t("new.project.template.option.description"),
      "",
    )
    .option("-a, --alias <string>", t("cli.add_template.options.alias"), "")
    .option(
      "-c, --cache-strategy <string>",
      t("cli.add_template.options.cache"),
      "",
    )
    .option(
      "-p, --package-manager <string>",
      t("cli.add_template.options.package_manager"),
      "",
    )
    .action(
      async (
        language: string,
        templateName: string,
        cmdOptions: AddCommandOptions,
        childCommand: Command,
      ) => {
        const { description, location, alias, cacheStrategy, packageManager } =
          cmdOptions;
        const parentOpts = childCommand?.parent?.opts();
        const isGlobal = !!parentOpts?.global;

        const spinner = ora(
          chalk.cyan(t("cli.add_template.adding", { templateName })),
        ).start();

        try {
          if (!description || !location) {
            throw new DevkitError(
              t("error.missing_required_options.add_template", {
                fields: "--description, --location",
              }),
            );
          }

          validateProgrammingLanguage(language);

          const { config } = await readAndMergeConfigs({
            forceGlobal: isGlobal,
          });

          const templateDetails: AddTemplateSchema = {
            language,
            templateName,
            description,
            location,
            alias: alias ? alias : undefined,
            cacheStrategy: cacheStrategy ? cacheStrategy : undefined,
            packageManager: packageManager ? packageManager : undefined,
          };

          await validateAndSaveTemplate(
            templateDetails,
            config,
            !!isGlobal,
            spinner,
          );
        } catch (error: unknown) {
          handleErrorAndExit(error as Error, spinner);
        }
      },
    );
}

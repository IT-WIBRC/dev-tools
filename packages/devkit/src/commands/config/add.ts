import { logger, type TSpinner } from "#utils/logger.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { t } from "#utils/i18n/translator.js";
import { readConfigSources } from "#core/config/loader.js";
import { validateAndSaveTemplate } from "./validate-and-save.js";
import { DevkitError } from "#utils/errors/base.js";
import { type Command } from "commander";
import { type AddCommandOptions, type AddTemplateSchema } from "./types.js";
import { validateProgrammingLanguage } from "#utils/validations/config.js";
import type { CliConfig } from "#utils/schema/schema.js";
import { mapLanguageAliasToCanonicalKey } from "#core/config/language.js";
import { generateDynamicHelpText } from "#utils/i18n/generate-dynamic-help-text.js";

async function getTargetConfigForModification(
  isGlobal: boolean,
): Promise<CliConfig> {
  const sources = await readConfigSources({
    forceGlobal: isGlobal,
    forceLocal: !isGlobal,
  });

  const targetConfig = isGlobal ? sources.global : sources.local;

  if (targetConfig) {
    return targetConfig;
  }

  return sources.default;
}

export function setupAddCommand(configCommand: Command): void {
  configCommand
    .command("add <language> <templateName>")
    .alias("a")
    .description(
      generateDynamicHelpText(
        "supportedLanguage",
        "commands.template.add.description",
      ),
    )
    .option(
      "-d, --description <string>",
      t("commands.template.add.options.description"),
      "",
    )
    .option(
      "-o, --location <string>",
      t("commands.template.add.prompts.location"),
      "",
    )
    .option(
      "-a, --alias <string>",
      t("commands.template.add.options.alias"),
      "",
    )
    .option(
      "-c, --cache-strategy <string>",
      generateDynamicHelpText(
        "cacheStrategy",
        "commands.template.add.options.cache",
      ),
      "",
    )
    .option(
      "-p, --package-manager <string>",
      generateDynamicHelpText(
        "packageManager",
        "commands.template.add.options.package_manager",
      ),
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

        const spinner: TSpinner = logger
          .spinner(
            logger.colors.cyan(
              t("messages.status.template_adding", { templateName }),
            ),
          )
          .start();

        try {
          if (!description || !location) {
            throw new DevkitError(
              t("errors.command.missing_required_options", {
                fields: "--description, --location",
              }),
            );
          }

          language = mapLanguageAliasToCanonicalKey(language);
          validateProgrammingLanguage(language);

          const config = await getTargetConfigForModification(isGlobal);

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

import { t } from "#utils/i18n/translator.js";
import { logger, type TSpinner } from "#utils/logger.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { handleNonInteractiveTemplateUpdate } from "../logic.js";
import { type Command } from "commander";
import { type UpdateCommandOptions } from "../types.js";
import { resolveTemplateNamesForUpdate } from "./logic.js";
import { DevkitError } from "#utils/errors/base.js";
import { validateProgrammingLanguage } from "#utils/validations/config.js";
import { mapLanguageAliasToCanonicalKey } from "#core/config/language.js";
import { generateDynamicHelpText } from "#utils/i18n/generate-dynamic-help-text.js";

export function setupUpdateCommand(configCommand: Command): void {
  configCommand
    .command("update <language> <templateName...>")
    .alias("up")
    .description(
      generateDynamicHelpText(
        "supportedLanguage",
        "commands.config.update_template.command.description",
      ),
    )
    .option(
      "-n, --new-name <string>",
      t("commands.config.update_template.options.new_name"),
    )
    .option(
      "-d, --description <string>",
      t("commands.config.update_template.options.description"),
    )
    .option(
      "-a, --alias <string>",
      t("commands.config.update_template.options.alias"),
    )
    .option(
      "-l, --location <string>",
      t("commands.config.update_template.options.location"),
    )
    .option(
      "--cache-strategy <string>",
      generateDynamicHelpText(
        "cacheStrategy",
        "commands.config.update_template.options.cache_strategy",
      ),
    )
    .option(
      "--package-manager <string>",
      generateDynamicHelpText(
        "packageManager",
        "commands.config.update_template.options.package_manager",
      ),
    )
    .option(
      "-g, --global",
      t("commands.config.update_template.options.global"),
      false,
    )
    .action(
      async (
        language: string,
        templateNames: string[],
        cmdOptions: UpdateCommandOptions,
        childCommand: Command,
      ) => {
        const parentOpts = childCommand?.parent?.opts();
        const isGlobal = !!parentOpts?.global;

        const spinner: TSpinner = logger.spinner().start(
          logger.colors.cyan(
            t("messages.status.template_updating", {
              templateName: templateNames.join(", "),
            }),
          ),
        );

        const updates = { ...cmdOptions, language };
        let hasErrors = false;
        let successfullyUpdatedCount = 0;
        let templatesToActOn: string[] = [];
        let notFoundNames: string[] = [];

        try {
          if (templateNames.length === 0) {
            throw new DevkitError(
              t("errors.validation.template_name_required"),
            );
          }

          if (language) {
            language = mapLanguageAliasToCanonicalKey(language);
            validateProgrammingLanguage(language);
          }

          const resolution = await resolveTemplateNamesForUpdate(
            language,
            templateNames,
            isGlobal,
          );
          templatesToActOn = resolution.resolvedNames;
          notFoundNames = resolution.notFoundNames;

          if (templatesToActOn.length === 0) {
            throw new DevkitError(
              t("errors.template.not_found", {
                template: notFoundNames.join(", "),
              }),
            );
          }

          for (const templateName of templatesToActOn) {
            try {
              await handleNonInteractiveTemplateUpdate(
                language,
                templateName,
                updates,
                !!isGlobal,
              );

              successfullyUpdatedCount++;
            } catch (error: unknown) {
              hasErrors = true;
              if (error instanceof DevkitError) {
                logger.log(
                  logger.colors.yellow(
                    `\n${t("errors.template.single_fail", { templateName, error: error.message })}`,
                  ),
                );
              } else {
                logger.log(
                  logger.colors.yellow(
                    `\n${t("errors.template.single_fail", { templateName, error: "unknown error" })}`,
                  ),
                );
              }
            }
          }

          spinner.stop();

          if (successfullyUpdatedCount > 0) {
            logger.log(
              logger.colors.green(
                `\n✔ ${t("messages.success.template_summary_updated", {
                  count: successfullyUpdatedCount.toString(),
                  templateName: templatesToActOn.join(", "),
                  language,
                })}`,
              ),
            );
          }

          if (notFoundNames.length > 0) {
            logger.warning(
              logger.colors.yellow(
                t("warnings.template.list_not_found", {
                  templates: notFoundNames.join(", "),
                }),
              ),
            );
          }

          if (hasErrors) {
            process.exit(1);
          }
        } catch (error: unknown) {
          handleErrorAndExit(error as Error, spinner);
        }
      },
    );
}

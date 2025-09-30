import { t } from "#utils/i18n/translator.js";
import { logger, type TSpinner } from "#utils/logger.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { handleNonInteractiveTemplateUpdate } from "./logic.js";
import { type Command } from "commander";
import { type UpdateCommandOptions } from "./types.js";
import { DevkitError } from "#utils/errors/base.js";

export function setupUpdateCommand(configCommand: Command): void {
  configCommand
    .command("update <language> <templateName...>")
    .alias("up")
    .description(t("config.update.command.description"))
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
        templateNames: string[],
        cmdOptions: UpdateCommandOptions,
        childCommand: Command,
      ) => {
        const spinner: TSpinner = logger.spinner().start(
          logger.colors.cyan(
            t("config.update.updating", {
              templateName: templateNames.join(", "),
            }),
          ),
        );

        const parentOpts = childCommand?.parent?.opts();
        const isGlobal = !!parentOpts?.global;

        const updates = { ...cmdOptions, language, isGlobal };
        let hasErrors = false;
        let successfullyUpdatedCount = 0;

        try {
          if (templateNames.length === 0) {
            throw new DevkitError(t("error.template_name_required"));
          }

          for (const templateName of templateNames) {
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
                    `\n${t("config.update.single_fail", { templateName, error: error.message })}`,
                  ),
                );
              } else {
                logger.log(
                  logger.colors.yellow(
                    `\n${t("config.update.single_fail", { templateName, error: "unknown error" })}`,
                  ),
                );
              }
            }
          }

          spinner.stop();

          if (successfullyUpdatedCount > 0) {
            logger.log(
              logger.colors.green(
                `\n✔ ${t("config.update.success_summary", {
                  count: successfullyUpdatedCount.toString(),
                  templateName: templateNames.join(", "),
                  language,
                })}`,
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

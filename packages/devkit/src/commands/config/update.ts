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
    .description(t("commands.config.update_template.command.description"))
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
      t("commands.config.update_template.options.cache_strategy"),
    )
    .option(
      "--package-manager <string>",
      t("commands.config.update_template.options.package_manager"),
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
        const spinner: TSpinner = logger.spinner().start(
          logger.colors.cyan(
            t("messages.status.template_updating", {
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
            throw new DevkitError(
              t("errors.validation.template_name_required"),
            );
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

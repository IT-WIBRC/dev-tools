import { t } from "#utils/i18n/translator.js";
import { DevkitError } from "#utils/errors/base.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { logger, type TSpinner } from "#utils/logger.js";
import { type Command } from "commander";
import { type RemoveCommandOptions } from "../types.js";
import { getTemplateNamesToActOn, saveConfig } from "./logic.js";
import { mapLanguageAliasToCanonicalKey } from "#core/config/language.js";
import { generateDynamicHelpText } from "#utils/i18n/generate-dynamic-help-text.js";

export function setupRemoveCommand(configCommand: Command): void {
  configCommand
    .command("remove <language> <templateName...>")
    .alias("rm")
    .description(
      generateDynamicHelpText(
        "supportedLanguage",
        "commands.template.remove.command.description",
      ),
    )
    .action(
      async (
        language: string,
        templateNames: string[],
        _: RemoveCommandOptions,
        childCommand: Command,
      ) => {
        const parentOpts = childCommand?.parent?.opts();
        const isGlobal = !!parentOpts?.global;

        const spinner: TSpinner = logger
          .spinner()
          .start(logger.colors.cyan(t("messages.status.template_removing")));

        try {
          if (templateNames.length === 0) {
            throw new DevkitError(
              t("errors.validation.template_name_required"),
            );
          }

          language = mapLanguageAliasToCanonicalKey(language);
          const {
            targetConfig,
            languageTemplates,
            templatesToActOn,
            notFound,
          } = await getTemplateNamesToActOn(language, templateNames, isGlobal);

          if (templatesToActOn.length === 0) {
            throw new DevkitError(
              t("errors.template.not_found", {
                template: notFound.join(", "),
              }),
            );
          }

          const templatesToKeep = Object.fromEntries(
            Object.entries(languageTemplates).filter(
              ([key]) => !templatesToActOn.includes(key),
            ),
          );

          targetConfig.templates[language].templates = templatesToKeep;

          await saveConfig(targetConfig, !!isGlobal);

          spinner.succeed(
            t("messages.success.template_removed", {
              count: templatesToActOn.length.toString(),
              templateName: templatesToActOn.join(", "),
              language,
            }),
          );

          if (notFound.length > 0) {
            logger.warning(
              logger.colors.yellow(
                t("warnings.template.list_not_found", {
                  templates: notFound.join(", "),
                }),
              ),
            );
          }
        } catch (error: unknown) {
          handleErrorAndExit(error as Error, spinner);
        }
      },
    );
}

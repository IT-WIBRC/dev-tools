import { t } from "#utils/i18n/translator.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { DevkitError } from "#utils/errors/base.js";
import { logger, type TSpinner } from "#utils/logger.js";
import { printTemplates } from "#core/template/printer.js";
import type {
  DisplayModesValues,
  SetupCommandOptions,
} from "#utils/schema/schema.js";
import {
  validateDisplayMode,
  validateProgrammingLanguage,
} from "#utils/validations/config.js";
import {
  getAnnotatedTemplates,
  type AnnotatedTemplate,
} from "#core/template/annotator.js";
import { mapLanguageAliasToCanonicalKey } from "#core/config/language.js";

type ListCommandOptions = {
  global?: boolean;
  all?: boolean;
  where?: string[];
  mode: DisplayModesValues;
  includeDefaults?: boolean;
  settings?: boolean;
};

export function setupListCommand(options: SetupCommandOptions): void {
  const { program } = options;

  program
    .command("list")
    .alias("ls")
    .description(t("commands.list.command.description"))
    .argument("[language]", t("commands.list.command.language.argument"), "")
    .option("-g, --global", t("commands.list.options.global"))
    .option("-a, --all", t("commands.list.options.all"))
    .option("-s, --settings", t("commands.list.options.settings"))
    .option("-w, --where <strings...>", t("commands.list.command.where.option"))
    .option(
      "-m, --mode <string>",
      t("commands.list.command.mode.option"),
      "tree",
    )
    .option(
      "-d, --include-defaults",
      t("commands.list.options.include_defaults"),
      false,
    )
    .action(async (language, cmdOptions: ListCommandOptions) => {
      const {
        global: isGlobal,
        all: showAll,
        where,
        mode,
        includeDefaults,
        settings,
      } = cmdOptions;

      const whereClauses: string[] = where || [];

      const spinner: TSpinner = logger
        .spinner(t("messages.status.config_loading"))
        .start();

      try {
        if (isGlobal && showAll) {
          throw new DevkitError(
            t("errors.command.mutually_exclusive_options", {
              options: "global, all",
            }),
          );
        }

        if (language) {
          language = mapLanguageAliasToCanonicalKey(language);
          validateProgrammingLanguage(language);
        }

        const annotatedTemplates: AnnotatedTemplate[] =
          await getAnnotatedTemplates({
            forceGlobal: !!isGlobal,
            mergeAll: !!showAll,
            includeDefaults: !!includeDefaults,
          });

        let finalConfig = null;
        if (settings) {
          const { getMergedConfig } = await import("#core/config/merger.js");
          finalConfig = await getMergedConfig(!!showAll || !!isGlobal);
        }

        spinner.stop();

        spinner
          .succeed(logger.colors.green(t("messages.success.config_loaded")))
          .start();

        const defaultsSuffix = includeDefaults
          ? t("messages.status.including_defaults_suffix")
          : "";

        if (settings && finalConfig) {
          const { printSettings } = await import("#core/template/printer.js");
          logger.log(
            logger.colors.bold(
              "\n" + t("commands.list.output.settings_header") + defaultsSuffix,
            ),
          );
          printSettings(finalConfig.settings || {});
        }

        let templatesToPrint: AnnotatedTemplate[] = annotatedTemplates;
        if (language) {
          templatesToPrint = annotatedTemplates.filter(
            (t) => t._language === language,
          );
        }

        if (templatesToPrint.length === 0) {
          if (!settings) {
            const translationKey = language
              ? "warnings.template.not_found_for_language"
              : "warnings.template.not_found_in_config";

            spinner.warn(
              logger.colors.yellow(
                t(translationKey, {
                  language,
                }),
              ),
            );
          }
          return;
        }

        logger.log(
          logger.colors.bold(
            "\n" + t("commands.list.output.header") + defaultsSuffix,
          ),
        );

        validateDisplayMode(mode);

        printTemplates(templatesToPrint, whereClauses, mode);

        spinner.stop();
      } catch (error: unknown) {
        handleErrorAndExit(error as Error, spinner);
      }
    });
}

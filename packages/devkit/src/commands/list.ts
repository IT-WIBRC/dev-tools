import { t } from "#utils/i18n/translator.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { DevkitError } from "#utils/errors/base.js";
import { logger, type TSpinner } from "#utils/logger.js";
import { readAndMergeConfigs } from "#core/config/loader.js";
import { printTemplates } from "#core/template/printer.js";
import type { SetupCommandOptions } from "#utils/schema/schema.js";
import { validateProgrammingLanguage } from "#utils/validations/config.js";

type ListCommandOptions = {
  global?: boolean;
  all?: boolean;
  filter?: string;
};

const getStartMessage = (
  isGlobal: boolean,
  showAll: boolean,
  source: string,
): Parameters<typeof t>[0] => {
  if (showAll) {
    if (source === "merged") {
      return "list.templates.using_local_and_global";
    }
    if (source === "global") {
      return "list.templates.using_global_only";
    }
    if (source === "local") {
      return "list.templates.using_local_only";
    }
    return "list.templates.not_found";
  }

  if (isGlobal) {
    if (source !== "global") {
      return "list.templates.no_global_config";
    }
    return "list.templates.using_global";
  }

  if (source === "local") {
    return "list.templates.using_local";
  }

  if (source === "global") {
    return "list.templates.using_global_fallback";
  }

  return "list.templates.not_found";
};

export function setupListCommand(options: SetupCommandOptions): void {
  const { program } = options;

  program
    .command("list")
    .alias("ls")
    .description(t("list.command.description"))
    .argument("[language]", t("list.command.language.argument"), "")
    .option("-g, --global", t("list.command.global.option"))
    .option("-a, --all", t("list.command.all.option"))
    .option("-f, --filter <string>", t("list.command.filter.option"))
    .action(async (language, cmdOptions: ListCommandOptions) => {
      const { global: isGlobal, all: showAll, filter } = cmdOptions;

      const spinner: TSpinner = logger
        .spinner(t("list.templates.loading"))
        .start();

      try {
        if (isGlobal && showAll) {
          throw new DevkitError(
            t("error.command.mutually_exclusive_options", {
              options: "global, all",
            }),
          );
        }

        if (language) validateProgrammingLanguage(language);

        const { config, source } = await readAndMergeConfigs({
          forceGlobal: isGlobal,
          mergeAll: showAll,
        });

        spinner.stop();

        const startMessageKey = getStartMessage(!!isGlobal, !!showAll, source);

        if (startMessageKey.startsWith("list.templates.no_")) {
          spinner.succeed(logger.colors.yellow(t(startMessageKey)));
          return;
        }

        spinner.info(t(startMessageKey)).start();

        if (Object.keys(config?.templates || {}).length === 0) {
          spinner.succeed(
            logger.colors.yellow(
              t("list.templates.not_found", {
                template: "",
              }),
            ),
          );
          return;
        }

        logger.log(logger.colors.bold("\n" + t("list.templates.header")));

        Object.entries(config?.templates || {}).forEach(
          ([lang, langTemplates]) => {
            if (language && lang !== language) return;
            printTemplates(lang, langTemplates.templates, filter);
          },
        );
        spinner.stop();
      } catch (error: unknown) {
        handleErrorAndExit(error as Error, spinner);
      }
    });
}

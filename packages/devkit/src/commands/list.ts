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
  const TEMPLATE_NOT_FOUND_KEY = "errors.template.not_found";
  const GLOBAL_NOT_FOUND_KEY = "errors.config.global_not_found";

  if (showAll) {
    if (source === "merged") {
      return "messages.config_source.using_local_and_global";
    }
    if (source === "global") {
      return "messages.config_source.global_only";
    }
    if (source === "local") {
      return "messages.config_source.local_only";
    }
    return TEMPLATE_NOT_FOUND_KEY;
  }

  if (isGlobal) {
    if (source !== "global") {
      return GLOBAL_NOT_FOUND_KEY;
    }
    return "messages.config_source.global";
  }

  if (source === "local") {
    return "messages.config_source.local";
  }

  if (source === "global") {
    return "messages.config_source.global_fallback";
  }

  return TEMPLATE_NOT_FOUND_KEY;
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
    .option("-f, --filter <string>", t("commands.list.command.filter.option"))
    .action(async (language, cmdOptions: ListCommandOptions) => {
      const { global: isGlobal, all: showAll, filter } = cmdOptions;

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

        if (language) validateProgrammingLanguage(language);

        const { config, source } = await readAndMergeConfigs({
          forceGlobal: isGlobal,
          mergeAll: showAll,
        });

        spinner.stop();

        const startMessageKey = getStartMessage(!!isGlobal, !!showAll, source);

        if (startMessageKey === "errors.config.global_not_found") {
          spinner.succeed(logger.colors.yellow(t(startMessageKey)));
          return;
        }

        spinner.info(t(startMessageKey)).start();

        if (Object.keys(config?.templates || {}).length === 0) {
          spinner.succeed(
            logger.colors.yellow(
              t("warnings.template_not_found", {
                template: "",
              }),
            ),
          );
          return;
        }

        logger.log(logger.colors.bold("\n" + t("commands.list.output.header")));

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

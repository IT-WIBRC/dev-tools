import { t } from "#utils/i18n/translator.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { DevkitError } from "#utils/errors/base.js";
import { logger, type TSpinner } from "#utils/logger.js";
import { readAndMergeConfigs } from "#core/config/loader.js";
import { printSettings, printTemplates } from "#core/template/printer.js";
import { type Command } from "commander";
import type { LanguageConfig } from "#/utils/schema/schema";

type ListCommandOptions = {
  all?: boolean;
};

const getStartMessageForConfig = (
  isGlobal: boolean,
  showAll: boolean,
  source: string,
): Parameters<typeof t>[0] => {
  if (showAll) {
    if (source === "merged") {
      return "messages.status.config_source_local_and_global";
    }
    if (source === "global") {
      return "messages.status.config_source_global";
    }
    if (source === "local") {
      return "messages.status.config_source_local";
    }
    return "warnings.no_config_found";
  }

  if (isGlobal) {
    if (source !== "global") {
      return "errors.config.global_not_found";
    }
    return "messages.status.config_source_global";
  }

  if (source === "local") {
    return "messages.status.config_source_local";
  }

  if (source === "global") {
    return "messages.status.templates_using_global_fallback";
  }

  return "warnings.no_config_found";
};

export function setupListCommand(configCommand: Command): void {
  configCommand
    .command("list")
    .alias("ls")
    .description(t("commands.config.list.command.description"))
    .option("-a, --all", t("commands.config.list.options.all"))
    .action(async (cmdOptions: ListCommandOptions, childCommand: Command) => {
      const { all: showAll } = cmdOptions;
      const parentOpts = childCommand?.parent?.opts();
      const isGlobal = !!parentOpts?.global;

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

        const { config, source } = await readAndMergeConfigs({
          forceGlobal: isGlobal,
          mergeAll: showAll,
        });

        spinner.stop();

        const startMessageKey = getStartMessageForConfig(
          isGlobal,
          !!showAll,
          source,
        );

        if (startMessageKey.startsWith("errors.config")) {
          throw new DevkitError(t(startMessageKey));
        }

        spinner.info(t(startMessageKey)).start();

        logger.log(
          logger.colors.bold("\n" + t("commands.config.list.settings_header")),
        );
        printSettings(config?.settings || {});

        logger.log(
          logger.colors.bold("\n" + t("commands.config.list.templates_header")),
        );
        if (Object.keys(config?.templates || {}).length === 0) {
          logger.log(logger.colors.yellow(t("warnings.template_not_found")));
        } else {
          Object.entries(config?.templates || {}).forEach(
            ([language, langTemplates]) => {
              printTemplates([[language, langTemplates.templates]]);
            },
          );
        }
        spinner.stop();
      } catch (error: unknown) {
        handleErrorAndExit(error as Error, spinner);
      }
    });
}

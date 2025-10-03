import { t } from "#utils/i18n/translator.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { DevkitError } from "#utils/errors/base.js";
import { logger, type TSpinner } from "#utils/logger.js";
import { printSettings, printTemplates } from "#core/template/printer.js";
import { getMergedConfig } from "#core/config/merger.js";
import {
  readConfigSources,
  type ConfigurationSources,
} from "#core/config/loader.js";
import { getAnnotatedTemplates } from "#core/template/annotator.js";
import { type Command } from "commander";

type ListCommandOptions = {
  all?: boolean;
  includeDefaults?: boolean;
};

const getStartMessageForConfig = (
  isGlobal: boolean,
  showAll: boolean,
  includeDefaults: boolean,
  sources: ConfigurationSources,
): Parameters<typeof t>[0] => {
  const hasLocal = !!sources?.local;
  const hasGlobal = !!sources?.global;

  if (isGlobal) {
    if (!hasGlobal && !includeDefaults) return "errors.config.global_not_found";
  }

  if (!isGlobal) {
    if (!hasLocal && !includeDefaults) return "errors.config.local_not_found";
  }

  if (showAll) {
    return "messages.status.config_source_local_and_global";
  }

  if (isGlobal) {
    return "messages.status.config_source_global";
  }

  if (!isGlobal) {
    return "messages.status.config_source_local";
  }

  if (isGlobal) {
    return "messages.status.config_source_global";
  }

  return "warnings.no_config_found";
};

export function setupListCommand(configCommand: Command): void {
  configCommand
    .command("list")
    .alias("ls")
    .description(t("commands.config.list.command.description"))
    .option("-a, --all", t("commands.config.list.options.all"))
    .option(
      "-d, --include-defaults",
      t("commands.list.options.include_defaults"),
      false,
    )
    .action(async (cmdOptions: ListCommandOptions, childCommand: Command) => {
      const { all: showAll, includeDefaults } = cmdOptions;
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

        const configSources = await readConfigSources({
          forceGlobal: !!isGlobal,
          mergeAll: !!showAll,
        });

        const config = await getMergedConfig(
          !!showAll || !!isGlobal || !!includeDefaults,
        );

        const annotatedTemplates = await getAnnotatedTemplates({
          forceGlobal: !!isGlobal,
          mergeAll: !!showAll,
          includeDefaults: !!includeDefaults,
        });

        spinner.stop();

        const startMessageKey = getStartMessageForConfig(
          isGlobal,
          !!showAll,
          !!includeDefaults,
          configSources,
        );

        if (startMessageKey.startsWith("errors.config")) {
          throw new DevkitError(t(startMessageKey));
        }

        let startMessage = t(startMessageKey);

        if (includeDefaults) {
          const defaultsSuffix = t("messages.status.including_defaults_suffix");

          startMessage += defaultsSuffix;
        }

        spinner.info(startMessage).start();

        logger.log(
          logger.colors.bold("\n" + t("commands.config.list.settings_header")),
        );
        printSettings(config?.settings || {});

        logger.log(
          logger.colors.bold("\n" + t("commands.config.list.templates_header")),
        );

        if (annotatedTemplates.length === 0) {
          logger.log(logger.colors.yellow(t("warnings.template.not_found")));
        } else {
          printTemplates(annotatedTemplates, [], "tree");
        }

        spinner.stop();
      } catch (error: unknown) {
        handleErrorAndExit(error as Error, spinner);
      }
    });
}

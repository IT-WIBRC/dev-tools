import { t } from "#utils/i18n/translator.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { DevkitError } from "#utils/errors/base.js";
import ora from "ora";
import chalk from "chalk";
import { readAndMergeConfigs } from "#core/config/loader.js";
import { printSettings, printTemplates } from "#core/template/printer.js";
import { type Command } from "commander";

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
      return "config.get.source.local_and_global";
    }
    if (source === "global") {
      return "config.get.source.global";
    }
    if (source === "local") {
      return "config.get.source.local";
    }
    return "warning.no_config_found";
  }

  if (isGlobal) {
    if (source !== "global") {
      return "error.config.global.not.found";
    }
    return "config.get.source.global";
  }

  if (source === "local") {
    return "config.get.source.local";
  }

  if (source === "global") {
    return "list.templates.using_global_fallback";
  }

  return "warning.no_config_found";
};

export function setupListCommand(configCommand: Command): void {
  configCommand
    .command("list")
    .alias("ls")
    .description(t("list.command.description"))
    .option("-a, --all", t("list.command.all.option"))
    .action(async (cmdOptions: ListCommandOptions, childCommand: Command) => {
      const { all: showAll } = cmdOptions;
      const parentOpts = childCommand?.parent?.opts();
      const isGlobal = !!parentOpts?.global;

      const spinner = ora(t("config.loading")).start();
      try {
        if (isGlobal && showAll) {
          throw new DevkitError(
            t("error.command.mutually_exclusive_options", {
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

        if (startMessageKey.startsWith("error.config")) {
          throw new DevkitError(t(startMessageKey));
        }

        spinner.info(t(startMessageKey)).start();

        console.log(chalk.bold("\n" + t("list.config.settings_header")));
        printSettings(config?.settings || {});

        console.log(chalk.bold("\n" + t("list.templates.header")));
        if (Object.keys(config?.templates || {}).length === 0) {
          console.log(chalk.yellow(t("list.templates.not_found")));
        } else {
          Object.entries(config?.templates || {}).forEach(
            ([lang, langTemplates]) => {
              printTemplates(lang, langTemplates.templates);
            },
          );
        }
        spinner.stop();
      } catch (error: unknown) {
        handleErrorAndExit(error as Error, spinner);
      }
    });
}

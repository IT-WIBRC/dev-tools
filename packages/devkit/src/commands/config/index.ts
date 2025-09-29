import { t } from "#utils/i18n/translator.js";
import { readAndMergeConfigs } from "#core/config/loader.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { handleNonInteractiveSettingsUpdate } from "./logic.js";
import { type Command } from "commander";
import ora, { type Ora } from "ora";
import chalk from "chalk";

import { setupAddCommand } from "./add.js";
import { setupRemoveCommand } from "./remove.js";
import { setupUpdateCommand } from "./update.js";
import { setupListCommand } from "./list.js";

interface ConfigOptions {
  global?: boolean;
  set?: string[];
}

async function handleConfigAction(
  keys: string[],
  cmdOptions: ConfigOptions,
  spinner: Ora,
): Promise<void> {
  const { global: isGlobal, set: bulkSetValues } = cmdOptions;

  const { config } = await readAndMergeConfigs({ forceGlobal: isGlobal });
  spinner.stop();

  if (bulkSetValues && bulkSetValues.length > 0) {
    if (bulkSetValues.length % 2 !== 0) {
      spinner.fail(chalk.redBright(t("error.command.set.invalid_format")));
      return;
    }
    for (let i = 0; i < bulkSetValues.length; i += 2) {
      const bulkKey = bulkSetValues[i];
      const bulkValue = bulkSetValues[i + 1];
      await handleNonInteractiveSettingsUpdate(bulkKey, bulkValue, !!isGlobal);
    }
    spinner.succeed(chalk.green(t("config.set.success")));
    return;
  }

  if (keys && keys.length > 0) {
    keys.forEach((key) => {
      const configValue = config.settings[key as keyof typeof config.settings];
      if (configValue !== undefined) {
        console.log(chalk.yellow.bold(key) + ": " + configValue);
      } else {
        console.log(chalk.redBright(t("config.get.not_found", { key })));
      }
    });
    spinner.succeed(chalk.green(t("config.get.success")));
    return;
  }

  spinner.warn(t("warning.no_command_or_option_provided"));
}

export function setupConfigCommand(program: Command): void {
  const configCommand = program
    .command("config [keys...]")
    .alias("conf")
    .description(t("config.command.description"))
    .option("-g, --global", t("config.update.option.global"), false)
    .option("-s, --set <value...>", t("config.set.option.bulk"), false)
    .action(async (keys: string[], cmdOptions: ConfigOptions) => {
      const spinner = ora(chalk.cyan(t("config.get.loading"))).start();
      try {
        await handleConfigAction(keys, cmdOptions, spinner);
      } catch (error: unknown) {
        handleErrorAndExit(error as Error, spinner);
      }
    });

  setupAddCommand(configCommand);
  setupRemoveCommand(configCommand);
  setupUpdateCommand(configCommand);
  setupListCommand(configCommand);
}

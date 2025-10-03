import { t } from "#utils/i18n/translator.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { type Command } from "commander";
import { logger, type TSpinner } from "#utils/logger.js";

import { setupAddCommand } from "./add.js";
import { setupRemoveCommand } from "./remove.js";
import { setupUpdateCommand } from "./update.js";
import { setupListCommand } from "./list.js";
import { handleSetAction } from "./set/index.js";
import { handleGetAction } from "./get/index.js";

interface ConfigOptions {
  global?: boolean;
  set?: string[];
}

async function handleConfigAction(
  keys: string[],
  cmdOptions: ConfigOptions,
  spinner: TSpinner,
): Promise<void> {
  const { global: isGlobal, set: bulkSetValues } = cmdOptions;
  spinner.stop();

  if (bulkSetValues && bulkSetValues.length > 0) {
    await handleSetAction(bulkSetValues, !!isGlobal, spinner);
    return;
  }

  if (keys && keys.length > 0) {
    await handleGetAction(keys, !!isGlobal, spinner);
    return;
  }

  spinner.warn(t("warnings.no_command_provided"));
}

export function setupConfigCommand(program: Command): void {
  const configCommand = program
    .command("config [keys...]")
    .alias("conf")
    .description(t("commands.config.command.description"))
    .option("-g, --global", t("commands.config.set.option.global"), false)
    .option("-s, --set <value...>", t("commands.config.set.option.bulk"), false)
    .action(async (keys: string[], cmdOptions: ConfigOptions) => {
      const spinner: TSpinner = logger
        .spinner()
        .start(logger.colors.cyan(t("messages.status.config_loading")));
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

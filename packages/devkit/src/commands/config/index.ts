import { t } from "#utils/i18n/translator.js";
import { readAndMergeConfigs } from "#core/config/loader.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { handleNonInteractiveSettingsUpdate } from "./logic.js";
import { type Command } from "commander";
import { logger, type TSpinner } from "#utils/logger.js";

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
  spinner: TSpinner,
): Promise<void> {
  const { global: isGlobal, set: bulkSetValues } = cmdOptions;

  const { config } = await readAndMergeConfigs({ forceGlobal: isGlobal });
  spinner.stop();

  if (bulkSetValues && bulkSetValues.length > 0) {
    if (bulkSetValues.length % 2 !== 0) {
      spinner.fail(
        logger.colors.redBright(t("errors.command.set_invalid_format")),
      );
      return;
    }
    for (let i = 0; i < bulkSetValues.length; i += 2) {
      const bulkKey = bulkSetValues[i];
      const bulkValue = bulkSetValues[i + 1];
      await handleNonInteractiveSettingsUpdate(bulkKey, bulkValue, !!isGlobal);
    }
    spinner.succeed(logger.colors.green(t("messages.success.config_updated")));
    return;
  }

  if (keys && keys.length > 0) {
    keys.forEach((key) => {
      const configValue = config.settings[key as keyof typeof config.settings];
      if (configValue !== undefined) {
        logger.log(logger.colors.yellowBold(key) + ": " + configValue);
      } else {
        logger.log(
          logger.colors.redBright(
            t("errors.config.get_key_not_found", { key }),
          ),
        );
      }
    });
    spinner.succeed(logger.colors.green(t("messages.success.config_updated")));
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

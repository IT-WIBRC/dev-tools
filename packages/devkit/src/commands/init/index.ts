import { type SetupCommandOptions } from "#utils/schema/schema.js";
import { t } from "#utils/i18n/translator.js";
import { ConfigError } from "#utils/errors/base.js";
import { logger, TSpinner } from "#utils/logger.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { handleGlobalInit, handleLocalInit } from "./logic.js";

export function setupInitCommand(options: SetupCommandOptions): void {
  const { program } = options;
  program
    .command("init")
    .alias("i")
    .description(t("commands.config.init.command.description"))
    .option("-l, --local", t("commands.config.init.option.local"), false)
    .option("-g, --global", t("commands.config.init.option.global"), false)
    .action(async (cmdOptions: { local: boolean; global: boolean }) => {
      const isLocal: boolean = cmdOptions.local;
      const isGlobal: boolean = cmdOptions.global;
      const spinner: TSpinner = logger.spinner();

      try {
        if (isLocal && isGlobal) {
          throw new ConfigError(t("errors.config.init_local_and_global"));
        }

        if (isGlobal) {
          await handleGlobalInit(spinner);
        } else {
          await handleLocalInit(spinner);
        }
      } catch (error) {
        handleErrorAndExit(error, spinner);
      }
    });
}

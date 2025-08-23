import {
  CONFIG_FILE_NAMES,
  defaultCliConfig,
  type SetupCommandOptions,
} from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import { ConfigError } from "#utils/errors/base.js";
import fs from "fs-extra";
import path from "path";
import os from "os";
import ora from "ora";
import chalk from "chalk";
import { saveGlobalConfig, saveLocalConfig } from "#utils/configs/writer.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";

export function setupInitCommand(options: SetupCommandOptions) {
  const { program } = options;
  program
    .command("init")
    .alias("i")
    .description(t("config.init.command.description"))
    .option("-l, --local", t("config.init.option.local"), false)
    .option("-g, --global", t("config.init.option.global"), false)
    .action(async (cmdOptions) => {
      const isLocal = cmdOptions.local;
      const isGlobal = cmdOptions.global;
      const spinner = ora();

      try {
        if (isLocal && isGlobal) {
          throw new ConfigError(t("error.config.init.local_and_global"));
        }

        const configPath = isGlobal
          ? path.join(os.homedir(), CONFIG_FILE_NAMES[0])
          : path.join(process.cwd(), CONFIG_FILE_NAMES[1]);

        spinner.start(
          chalk.cyan(t("config.init.initializing", { path: configPath })),
        );

        try {
          await fs.promises.stat(configPath);
          throw new ConfigError(
            t("error.config.exists", { path: configPath }),
            configPath,
          );
        } catch (error: any) {
          if (error.code !== "ENOENT") {
            throw new ConfigError(t("error.config.init.fail"), configPath, {
              cause: error,
            });
          }
        }

        if (isGlobal) {
          await saveGlobalConfig({ ...defaultCliConfig });
        } else {
          await saveLocalConfig({ ...defaultCliConfig });
        }
        spinner.succeed(chalk.green(t("config.init.success")));
      } catch (error) {
        handleErrorAndExit(error, spinner);
      }
    });
}

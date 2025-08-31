import {
  PackageManagers,
  type SetupCommandOptions,
} from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import { DevkitError } from "#utils/errors/base.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import ora from "ora";
import chalk from "chalk";
import { saveGlobalConfig, saveLocalConfig } from "#utils/configs/writer.js";
import { validateConfigValue, configAliases } from "./validate-config.js";
import { readAndMergeConfigs } from "#utils/configs/loader.js";

export function setupConfigSetCommand(options: SetupCommandOptions): void {
  const { program } = options;

  const setCommandDescription = t("config.set.command.description", {
    pmValues: Object.values(PackageManagers).join(", "),
  });

  program
    .command("set")
    .description(setCommandDescription)
    .argument("<settings...>", t("config.set.argument.description"))
    .option("-g, --global", t("config.set.option.global"), false)
    .action(async (settings, cmdOptions) => {
      const spinner = ora(chalk.cyan(t("config.set.updating"))).start();
      try {
        const { config, source } = await readAndMergeConfigs({
          forceGlobal: cmdOptions.global,
        });

        if (source === "default") {
          throw new DevkitError(t("error.config.no_file_found"));
        }

        if (settings.length % 2 !== 0) {
          throw new DevkitError(t("error.command.set.invalid_arguments_count"));
        }

        for (let i = 0; i < settings.length; i += 2) {
          const key = settings[i];
          const value = settings[i + 1];

          const canonicalKey = configAliases[key];

          if (!canonicalKey) {
            throw new DevkitError(
              t("error.invalid.key", {
                key,
                keys: Object.keys(configAliases).join(", "),
              }),
            );
          }

          validateConfigValue(canonicalKey, value);

          (config.settings[canonicalKey] as unknown) = value;
        }

        if (cmdOptions.global) {
          await saveGlobalConfig(config);
        } else {
          await saveLocalConfig(config);
        }

        spinner.succeed(chalk.bold.green(t("config.set.success")));
      } catch (error) {
        handleErrorAndExit(error, spinner);
      }
    });
}

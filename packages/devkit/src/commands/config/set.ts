import { Argument } from "commander";
import { saveLocalConfig, saveGlobalConfig } from "#utils/configs/loader.js";
import {
  type CliConfig,
  PackageManagers,
  type PackageManager,
  type CacheStrategy,
  VALID_CACHE_STRATEGIES,
  type SetupCommandOptions,
} from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import { DevkitError } from "#utils/errors/base.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import ora from "ora";
import chalk from "chalk";

function validateConfigValue(key: string, value: unknown): void {
  if (key === "defaultPackageManager") {
    const validPackageManagers = Object.values(PackageManagers);
    if (!validPackageManagers.includes(value as PackageManager)) {
      throw new DevkitError(
        t("error.invalid.value", {
          key,
          options: validPackageManagers.join(", "),
        }),
      );
    }
  } else if (key === "cacheStrategy") {
    const validStrategies = VALID_CACHE_STRATEGIES;
    if (!validStrategies.includes(value as CacheStrategy)) {
      throw new DevkitError(
        t("error.invalid.value", {
          key,
          options: validStrategies.join(", "),
        }),
      );
    }
  }
}

export function setupConfigSetCommand(options: SetupCommandOptions) {
  const { program, config, source } = options;

  const configAliases: Record<string, keyof CliConfig["settings"]> = {
    pm: "defaultPackageManager",
    packageManager: "defaultPackageManager",
    cache: "cacheStrategy",
    cacheStrategy: "cacheStrategy",
    language: "language",
    lg: "language",
  };

  const setCommandDescription = t("config.set.command.description", {
    pmValues: Object.values(PackageManagers).join(", "),
  });

  program
    .command("set")
    .description(setCommandDescription)
    .addArgument(
      new Argument("<key>", t("config.set.key.argument")).choices(
        Object.keys(configAliases),
      ),
    )
    .argument("<value>", t("config.set.value.argument"))
    .option("-g, --global", t("config.set.option.global"), false)
    .action(async (key, value, cmdOptions) => {
      const spinner = ora(chalk.cyan(t("config.set.updating"))).start();
      try {
        if (source === "default") {
          throw new DevkitError(t("error.config.no_file_found"));
        }

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

        const settings = config.settings;
        (settings[canonicalKey] as any) = value;

        if (cmdOptions.global) {
          await saveGlobalConfig(config);
        } else {
          await saveLocalConfig(config);
        }

        spinner.succeed(chalk.green(t("config.set.success")));
      } catch (error) {
        handleErrorAndExit(error, spinner);
      }
    });
}

import { saveLocalConfig, saveGlobalConfig } from "#utils/configs/loader.js";
import {
  type CliConfig,
  PackageManagers,
  type PackageManager,
  type CacheStrategy,
  VALID_CACHE_STRATEGIES,
  type SetupCommandOptions,
  TextLanguages,
  type TextLanguageValues,
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
  } else if (key === "language") {
    const validLanguages = Object.values(TextLanguages);
    if (!validLanguages.includes(value as TextLanguageValues)) {
      throw new DevkitError(
        t("error.invalid.value", {
          key,
          options: validLanguages.join(", "),
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
    .argument("<settings...>", t("config.set.argument.description"))
    .option("-g, --global", t("config.set.option.global"), false)
    .action(async (settings, cmdOptions) => {
      const spinner = ora(chalk.cyan(t("config.set.updating"))).start();
      try {
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

          (config.settings[canonicalKey] as any) = value;
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

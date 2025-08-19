import { Argument } from "commander";
import {
  saveLocalConfig,
  saveGlobalConfig,
  updateTemplateCacheStrategy,
} from "#utils/configs/loader.js";
import {
  type CliConfig,
  PackageManagers,
  CONFIG_FILE_NAMES,
  VALID_CACHE_STRATEGIES,
  type PackageManager,
  type CacheStrategy,
  defaultCliConfig,
  type SetupCommandOptions,
} from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import { DevkitError, ConfigError } from "#utils/errors/base.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import fs from "fs-extra";
import path from "path";
import os from "os";
import ora from "ora";
import chalk from "chalk";
import { setupAddTemplateCommand } from "./add-template.js";

interface SetupNewCommandOptions extends SetupCommandOptions {
  source: string;
}

function validateConfigValue(key: string, value: unknown) {
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

export function setupConfigCommand(options: SetupNewCommandOptions) {
  const { program, config, source } = options;
  const configCommand = program
    .command("config")
    .alias("cf")
    .description(t("config.command.description"));

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

  configCommand
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

  configCommand
    .command("init")
    .alias("i")
    .description(t("config.init.command.description"))
    .option("-l, --local", t("config.init.option.local"), false)
    .action(async (cmdOptions) => {
      const isLocal = cmdOptions.local;
      const configPath = isLocal
        ? path.join(process.cwd(), CONFIG_FILE_NAMES[1])
        : path.join(os.homedir(), CONFIG_FILE_NAMES[0]);

      const spinner = ora(
        chalk.cyan(t("config.init.initializing", { path: configPath })),
      ).start();

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

      if (isLocal) {
        await saveLocalConfig({ ...defaultCliConfig });
      } else {
        await saveGlobalConfig({ ...defaultCliConfig });
      }
      spinner.succeed(chalk.green(t("config.init.success")));
    });

  configCommand
    .command("cache")
    .alias("c")
    .description(t("config.cache.command.description"))
    .argument("<templateName>", t("config.cache.template.argument"))
    .addArgument(
      new Argument("<strategy>", t("config.cache.strategy.argument")).choices(
        VALID_CACHE_STRATEGIES,
      ),
    )
    .action(async (templateName, strategy) => {
      const spinner = ora(chalk.cyan(t("config.cache.updating"))).start();
      try {
        if (source === "default") {
          throw new DevkitError(t("error.config.no_file_found"));
        }
        await updateTemplateCacheStrategy(templateName, strategy, config);
        spinner.succeed(chalk.green(t("config.cache.success")));
      } catch (error) {
        handleErrorAndExit(error, spinner);
      }
    });

  setupAddTemplateCommand({
    program: configCommand,
    config,
  });
}

#!/usr/bin/env node

import { Command, Argument } from "commander";
import {
  saveLocalConfig,
  saveGlobalConfig,
  loadUserConfig,
  getLocaleFromConfig,
  updateTemplateCacheStrategy,
} from "./utils/config-loader.js";
import {
  type CliConfig,
  PackageManagers,
  defaultCliConfig,
  CONFIG_FILE_NAMES,
  VALID_CACHE_STRATEGIES,
  type PackageManager,
  type CacheStrategy,
} from "./config.js";
import { loadTranslations, t } from "./utils/i18n.js";
import ora from "ora";
import chalk from "chalk";
import { getProjectVersion } from "./utils/project.js";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { DevkitError, ConfigError } from "./utils/errors/errors.js";
import { handleErrorAndExit } from "./utils/errors/error-handler.js";

const VERSION = await getProjectVersion();

type SetupCommandOptions = {
  program: Command;
  config: CliConfig;
};

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

function setupNewCommand(options: SetupCommandOptions) {
  const { program, config } = options;
  const newCommand = program
    .command("new")
    .alias("nw")
    .description(t("new.command.description"));

  for (const [language, langConfig] of Object.entries(config.templates)) {
    for (const [templateName, templateConfig] of Object.entries(
      langConfig.templates,
    )) {
      newCommand
        .command(templateName)
        .alias(templateConfig.alias || "")
        .description(
          t("new.project.description", {
            language: language,
            template: templateName,
            description: templateConfig.description,
          }),
        )
        .argument("<projectName>", t("new.project.name.argument"))
        .action(async (projectName) => {
          const { scaffoldProject } = await import(
            `./scaffolding/${language}.js`
          );
          await scaffoldProject({
            projectName,
            templateConfig,
            packageManager:
              templateConfig.packageManager ||
              config.settings.defaultPackageManager,
            cacheStrategy:
              templateConfig.cacheStrategy ||
              config.settings.cacheStrategy ||
              "daily",
          });
        });
    }
  }
}

function setupConfigCommand(options: SetupCommandOptions) {
  const { program, config } = options;
  const configCommand = program
    .command("config")
    .alias("cf")
    .description(t("config.command.description"));

  const configAliases: Record<string, keyof CliConfig["settings"]> = {
    pm: "defaultPackageManager",
    packageManager: "defaultPackageManager",
    cache: "cacheStrategy",
    cacheStrategy: "cacheStrategy",
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
    });

  configCommand
    .command("init")
    .alias("i")
    .description(t("config.init.command.description"))
    .action(async () => {
      const globalPath = path.join(
        os.homedir(),
        CONFIG_FILE_NAMES[0] || ".devkitrc",
      );
      try {
        await fs.promises.stat(globalPath);
        throw new ConfigError(
          t("error.config.exists", { path: globalPath }),
          globalPath,
        );
      } catch (error: any) {
        if (error.code !== "ENOENT") {
          throw new ConfigError(t("error.config.init.fail"), globalPath, {
            cause: error,
          });
        }
      }
      await saveGlobalConfig(defaultCliConfig as any);
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
      await updateTemplateCacheStrategy(templateName, strategy, config);
    });
}

async function setupAndParse() {
  const program = new Command();
  const spinner = ora(chalk.cyan("Initializing CLI...")).start();

  try {
    const locale = await getLocaleFromConfig(spinner);

    await loadTranslations(locale);
    const config = await loadUserConfig(spinner);

    spinner.succeed(chalk.green(t("program.initialized")));

    program
      .name("devkit")
      .alias("dk")
      .description(t("program.description"))
      .version(VERSION, "-V, --version", t("version.description"))
      .helpOption("-h, --help", t("help.description"));

    setupNewCommand({ program, config });
    setupConfigCommand({ program, config });

    program.parse();
  } catch (error) {
    handleErrorAndExit(error, spinner);
  }
}

setupAndParse();

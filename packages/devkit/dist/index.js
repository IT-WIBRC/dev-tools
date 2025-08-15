#!/usr/bin/env node
import { Command, Argument } from "commander";
import {
  saveLocalConfig,
  saveGlobalConfig,
  loadUserConfig,
  getLocaleFromConfig,
  updateTemplateCacheStrategy,
} from "./utils/config.js";
import {
  PackageManagers,
  defaultCliConfig,
  CONFIG_FILE_NAMES,
  VALID_CACHE_STRATEGIES,
} from "./config.js";
import { loadTranslations, t } from "./utils/i18n.js";
import ora from "ora";
import chalk from "chalk";
import { getProjectVersion } from "./utils/project.js";
import fs from "fs-extra";
import path from "path";
import os from "os";
const VERSION = getProjectVersion();
function validateConfigValue(key, value) {
  if (key === "defaultPackageManager") {
    const validPackageManagers = Object.values(PackageManagers);
    if (!validPackageManagers.includes(value)) {
      throw new Error(
        t("error.invalid.value", {
          key,
          options: validPackageManagers.join(", "),
        }),
      );
    }
  } else if (key === "cacheStrategy") {
    const validStrategies = VALID_CACHE_STRATEGIES;
    if (!validStrategies.includes(value)) {
      throw new Error(
        t("error.invalid.value", {
          key,
          options: validStrategies.join(", "),
        }),
      );
    }
  }
}
function setupNewCommand(options) {
  const { program, config } = options;
  const newCommand = program
    .command("new")
    .alias("nw")
    .description(t("new.command.description"));
  for (const [language, langConfig] of Object.entries(config.templates)) {
    const langCommand = newCommand
      .command(language)
      .description(
        t("new.language.command.description", { language: language }),
      );
    for (const [templateName, templateConfig] of Object.entries(
      langConfig.templates,
    )) {
      langCommand
        .command(templateName)
        .description(
          t("new.project.description", {
            language: language,
            template: templateName,
            description: templateConfig.description,
          }),
        )
        .argument("<projectName>", t("new.project.name.argument"))
        .action(async (projectName) => {
          try {
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
          } catch (error) {
            console.error(
              chalk.red(
                t("error.scaffolding.language.not_found", {
                  language: language,
                }),
              ),
            );
            console.error(error);
            process.exit(1);
          }
        });
    }
  }
}
function setupConfigCommand(options) {
  const { program, config } = options;
  const configCommand = program
    .command("config")
    .alias("cf")
    .description(t("config.command.description"));
  const configAliases = {
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
      const spinner = ora(
        chalk.cyan(t("config.update.start", { key })),
      ).start();
      try {
        const canonicalKey = configAliases[key];
        if (!canonicalKey) {
          throw new Error(
            t("error.invalid.key", {
              key,
              keys: Object.keys(configAliases).join(", "),
            }),
          );
        }
        validateConfigValue(canonicalKey, value);
        const settings = config.settings;
        settings[canonicalKey] = value;
        if (cmdOptions.global) {
          await saveGlobalConfig(config);
        } else {
          await saveLocalConfig(config);
        }
        spinner.succeed(
          chalk.green(t("config.update.success", { key: canonicalKey, value })),
        );
      } catch (error) {
        spinner.fail(chalk.red(t("config.update.fail")));
        console.error(chalk.red(error.message));
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
      const spinner = ora(
        chalk.cyan(t("config.init.start", { path: globalPath })),
      ).start();
      try {
        if (fs.existsSync(globalPath)) {
          throw new Error(t("error.config.exists", { path: globalPath }));
        }
        await saveGlobalConfig(defaultCliConfig);
        spinner.succeed(chalk.green(t("config.init.success")));
      } catch (error) {
        spinner.fail(chalk.red(t("config.init.fail")));
        console.error(chalk.red(error.message));
      }
    });
  configCommand
    .command("cache")
    .alias("-c")
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
  const locale = await getLocaleFromConfig();
  await loadTranslations(locale);
  const config = await loadUserConfig();
  program
    .name("devkit")
    .alias("dk")
    .description(t("program.description"))
    .version(VERSION, "-V, --version", t("version.description"))
    .helpOption("-h, --help", t("help.description"));
  setupNewCommand({ program, config });
  setupConfigCommand({ program, config });
  program.parse();
}
setupAndParse();

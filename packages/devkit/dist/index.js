#!/usr/bin/env node
import { Command, Argument } from "commander";
import { loadUserConfig, saveUserConfig } from "./utils/config.js";
import { PackageManagers } from "./config.js";
import { scaffoldNodejsProject } from "./scaffolding/nodejs.js";
import { t } from "./utils/i18n.js";
import ora from "ora";
import chalk from "chalk";
import { getProjectVersion } from "./utils/project.js";
const VERSION = getProjectVersion();
async function setupAndParse() {
  const program = new Command();
  const config = await loadUserConfig();
  program
    .name("devkit")
    .description(t("program.description"))
    .version(VERSION, "-V, --version", t("version.description"))
    .helpOption("-h, --help", t("help.description"));
  const newCommand = program
    .command("new")
    .description(t("new.command.description"));
  const nodejsConfig = config.templates.nodejs;
  if (nodejsConfig) {
    for (const [templateName, templateConfig] of Object.entries(
      nodejsConfig.templates,
    )) {
      newCommand
        .command(`${templateName}`)
        .description(
          t("new.project.description", {
            language: "Node.js",
            template: templateName,
            description: templateConfig.description,
          }),
        )
        .argument("<projectName>", t("new.project.name.argument"))
        .action((projectName) => {
          scaffoldNodejsProject({
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
  const configCommand = program
    .command("config")
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
    .action(async (key, value) => {
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
        if (canonicalKey === "defaultPackageManager") {
          const validPackageManagers = Object.values(PackageManagers);
          if (!validPackageManagers.includes(value)) {
            throw new Error(
              t("error.invalid.value", {
                key: canonicalKey,
                options: validPackageManagers.join(", "),
              }),
            );
          }
        } else if (canonicalKey === "cacheStrategy") {
          const validStrategies = ["always-refresh", "never-refresh", "daily"];
          if (!validStrategies.includes(value)) {
            throw new Error(
              t("error.invalid.value", {
                key: canonicalKey,
                options: validStrategies.join(", "),
              }),
            );
          }
        }
        config.settings[canonicalKey] = value;
        await saveUserConfig(config);
        spinner.succeed(
          chalk.green(t("config.update.success", { key: canonicalKey, value })),
        );
      } catch (error) {
        spinner.fail(chalk.red(t("config.update.fail")));
        console.error(chalk.red(error.message));
      }
    });
  program.parse();
}
setupAndParse();

#!/usr/bin/env node

import { Command } from "commander";
import {
  getConfigFilepath,
  getLocaleFromConfigMinimal,
  loadUserConfig,
} from "#utils/configs/loader.js";
import { loadTranslations, t } from "#utils/internationalization/i18n.js";
import ora from "ora";
import chalk from "chalk";
import { getProjectVersion } from "#utils/project.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { setupNewCommand } from "./commands/new.js";
import { setupConfigCommand } from "./commands/config.js";
import { setupListCommand } from "./commands/list.js";
import { setupRemoveTemplateCommand } from "./commands/removeTemplate.js";

const VERSION = await getProjectVersion();

async function setupAndParse() {
  const program = new Command();
  const spinner = ora(chalk.bold.cyan("Initializing CLI...")).start();

  try {
    const locale = await getLocaleFromConfigMinimal();
    await loadTranslations(locale);

    const configPath = await getConfigFilepath();
    const { config, source } = await loadUserConfig(spinner);

    if (source === "default") {
      console.warn(
        "\n\n",
        chalk.italic.bold.yellow(t("warning.no_config_found")),
        "\n",
      );
    }

    spinner.succeed(chalk.bold.green(t("program.initialized")));

    program
      .name("devkit")
      .alias("dk")
      .description(t("program.description"))
      .version(VERSION, "-V, --version", t("version.description"))
      .helpOption("-h, --help", t("help.description"));

    const commandOptions = { program, config, configPath, source };
    setupNewCommand({ program, config });
    setupConfigCommand({ program, config, source });
    setupListCommand({ program, config });
    setupRemoveTemplateCommand(commandOptions);

    program.parse();
  } catch (error) {
    handleErrorAndExit(error, spinner);
  }
}

setupAndParse();

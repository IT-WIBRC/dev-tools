import { Command } from "commander";
import {
  getLocaleFromConfigMinimal,
  loadUserConfig,
} from "#utils/configs/loader.js";
import { loadTranslations, t } from "#utils/internationalization/i18n.js";
import ora from "ora";
import chalk from "chalk";
import { getProjectVersion } from "#utils/project.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { setupNewCommand } from "#commands/new.js";
import { setupConfigCommand } from "#commands/config/index.js";
import { setupListCommand } from "#commands/list.js";
import { setupRemoveTemplateCommand } from "#commands/removeTemplate.js";
import { setupAddTemplateCommand } from "#commands/add-template.js";
import { setupInitCommand } from "#commands/init.js";
import { setupConfigUpdateCommand } from "#commands/update.js";

export async function setupAndParse() {
  const program = new Command();

  program.option("-v, --verbose", t("program.verbose_option"));

  program.parseOptions(process.argv);
  const isVerbose = !!program.opts().verbose;

  const spinner = ora().start(
    isVerbose ? chalk.bold.cyan("Initializing CLI...") : "",
  );

  try {
    const VERSION = await getProjectVersion();
    const locale = await getLocaleFromConfigMinimal();
    await loadTranslations(locale);

    const { config, source } = await loadUserConfig(spinner);
    isVerbose && spinner.succeed(chalk.bold.green(t("program.initialized")));

    if (source === "default") {
      console.warn(
        "\n",
        chalk.italic.bold.yellow(t("warning.no_config_found")),
        "\n",
      );
    }

    program
      .name("devkit")
      .alias("dk")
      .description(t("program.description"))
      .version(VERSION, "-V, --version", t("version.description"))
      .helpOption("-h, --help", t("help.description"));

    setupInitCommand({ program, config });
    setupNewCommand({ program, config });
    setupConfigCommand({ program, config, source });
    setupListCommand({ program, config });
    setupRemoveTemplateCommand({ program, config, source });
    setupAddTemplateCommand({ program, config, source });
    setupConfigUpdateCommand({ program, config, source });

    program.parse(process.argv);
  } catch (error) {
    handleErrorAndExit(error, spinner);
  }
}

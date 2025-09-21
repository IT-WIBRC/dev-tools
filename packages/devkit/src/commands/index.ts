import { Command } from "commander";
import { readAndMergeConfigs } from "#utils/configs/loader.js";
import { loadTranslations, t } from "#utils/internationalization/i18n.js";
import ora from "ora";
import chalk from "chalk";
import { getProjectVersion } from "#utils/project.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { setupNewCommand } from "#commands/new.js";
import { setupConfigCommand } from "#commands/config/index.js";
import { setupListCommand } from "#commands/list.js";
import { setupInitCommand } from "#commands/init.js";
import { defaultCliConfig, SUPPORTED_LANGUAGES } from "#utils/configs/schema";

export async function setupAndParse() {
  const program = new Command();

  program.option("-v, --verbose", "Enable verbose logging for detailed output");

  program.parseOptions(process.argv);
  const isVerbose = !!program.opts().verbose;

  const spinner = ora().start(
    isVerbose ? chalk.bold.cyan("Initializing CLI...") : "",
  );

  try {
    const VERSION = await getProjectVersion();
    const { config, source } = await readAndMergeConfigs({
      useFallback: true,
    });

    const locale =
      config?.settings?.language &&
      SUPPORTED_LANGUAGES.includes(config?.settings?.language)
        ? config?.settings?.language || "en"
        : defaultCliConfig.settings.language;

    await loadTranslations(locale);

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
    setupConfigCommand(program);
    setupListCommand({ program, config });

    program.parse(process.argv);
    spinner.stop();
  } catch (error) {
    handleErrorAndExit(error, spinner);
  }
}

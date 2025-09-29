import { Command } from "commander";
import { readAndMergeConfigs } from "#core/config/loader.js";
import { t } from "#utils/i18n/translator.js";
import ora from "ora";
import chalk from "chalk";
import { getProjectVersion } from "#core/info/project.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { setupNewCommand } from "#commands/new.js";
import { setupConfigCommand } from "#commands/config/index.js";
import { setupListCommand } from "#commands/list.js";
import { setupInitCommand } from "#commands/init.js";
import { defaultCliConfig, SUPPORTED_LANGUAGES } from "#utils/schema/schema.js";
import { setupInfoCommand } from "#commands/info.js";
import { loadTranslations } from "#utils/i18n/translation-loader.js";

export async function setupAndParse() {
  const program = new Command();

  program.option("-v, --verbose", "Enable verbose logging for detailed output");

  program.parseOptions(process.argv);
  const isVerbose = !!program.opts().verbose;

  const spinner = ora().start(
    isVerbose ? chalk.bold.cyan("Initializing CLI...") : "",
  );

  try {
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
      .version(
        await getProjectVersion(),
        "-V, --version",
        t("version.description"),
      )
      .helpOption("-h, --help", t("help.description"));

    setupInitCommand({ program, config });
    setupNewCommand({ program, config });
    setupConfigCommand(program);
    setupListCommand({ program, config });
    setupInfoCommand({ program, config });

    program.parse(process.argv);
    spinner.stop();
  } catch (error) {
    handleErrorAndExit(error, spinner);
  }
}

import { Command } from "commander";
import { readAndMergeConfigs } from "#core/config/loader.js";
import { t } from "#utils/i18n/translator.js";
import { logger, TSpinner } from "#utils/logger.js";
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

  const spinner: TSpinner = logger
    .spinner()
    .start(
      isVerbose
        ? logger.colors.cyan(logger.colors.bold("Initializing CLI..."))
        : "",
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

    isVerbose &&
      spinner.succeed(
        logger.colors.green(
          logger.colors.bold(t("messages.success.program_initialized")),
        ),
      );

    if (source === "default") {
      logger.warning(
        `\n${logger.colors.yellowBold(logger.colors.italic(t("warnings.not_found")))}\n`,
      );
    }

    program
      .name("devkit")
      .alias("dk")
      .description(t("program.program.description"))
      .version(
        await getProjectVersion(),
        "-V, --version",
        t("program.version.description"),
      )
      .helpOption("-h, --help", t("program.help.description"));

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

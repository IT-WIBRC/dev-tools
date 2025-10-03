import { Command } from "commander";
import { readConfigSources } from "#core/config/loader.js";
import { t } from "#utils/i18n/translator.js";
import { logger, TSpinner } from "#utils/logger.js";
import { getProjectVersion } from "#core/info/project.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { setupNewCommand } from "#commands/new.js";
import { setupConfigCommand } from "#commands/config/index.js";
import { setupListCommand } from "#commands/list.js";
import { setupInitCommand } from "#commands/init.js";

import { setupInfoCommand } from "#commands/info.js";
import { loadTranslations } from "#utils/i18n/translation-loader.js";

export async function setupAndParse() {
  const spinner: TSpinner = logger.spinner();

  try {
    const { configFound, global, local } = await readConfigSources({
      mergeAll: true,
    });

    let rawLocale = local?.settings?.language || global?.settings?.language;
    await loadTranslations(rawLocale || null);

    const program = new Command();

    program.option("-v, --verbose", t("program.program.verbose_option"));

    program.parseOptions(process.argv);
    const isVerbose = !!program.opts().verbose;

    spinner.start(
      isVerbose
        ? logger.colors.cyan(
            logger.colors.bold(t("program.status.initializing")),
          )
        : "",
    );

    if (isVerbose) {
      spinner.succeed(
        logger.colors.green(
          logger.colors.bold(t("messages.success.program_initialized")),
        ),
      );
    }

    if (!configFound) {
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

    setupInitCommand({ program });
    setupNewCommand({ program });
    setupConfigCommand(program);
    setupListCommand({ program });
    setupInfoCommand({ program });

    program.parse(process.argv);
    spinner.stop();
  } catch (error) {
    handleErrorAndExit(error, spinner);
  }
}

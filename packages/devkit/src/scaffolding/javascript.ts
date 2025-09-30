import { t } from "#utils/i18n/translator.js";
import { getTemplateFromCache } from "#core/cache/index.js";
import { runCliCommand } from "#scaffolding/cli-runner.js";
import { copyLocalTemplate } from "#scaffolding/local-template.js";
import { installDependencies } from "#scaffolding/dependencies.js";
import { logger } from "#utils/logger.js";
import type {
  TemplateConfig,
  CacheStrategy,
  SupportedJavascriptPackageManager,
} from "#utils/schema/schema.js";

export interface ScaffoldJavascriptProjectOptions {
  projectName: string;
  templateConfig: TemplateConfig;
  packageManager: SupportedJavascriptPackageManager;
  cacheStrategy: CacheStrategy;
}

export async function scaffoldProject(
  options: ScaffoldJavascriptProjectOptions,
): Promise<void> {
  const { projectName, templateConfig, packageManager, cacheStrategy } =
    options;
  const spinner = logger.spinner(t("messages.status.scaffolding_project"));
  let isOfficialCli = false;

  try {
    if (templateConfig.location.includes("{pm}")) {
      isOfficialCli = true;
      spinner.text = logger.colors.cyan(
        logger.colors.bold(
          t("messages.scaffolding.run_start", {
            command: templateConfig.location,
          }),
        ),
      );
      spinner.stop();
      await runCliCommand({
        command: templateConfig.location,
        projectName,
        packageManager,
        spinner,
      });
    } else if (
      templateConfig.location.startsWith("http") ||
      templateConfig.location.startsWith("git@")
    ) {
      await getTemplateFromCache({
        url: templateConfig.location,
        projectName,
        spinner,
        strategy: cacheStrategy,
      });
    } else {
      spinner.text = logger.colors.cyan(t("messages.scaffolding.copy_start"));
      spinner.start();
      await copyLocalTemplate({
        sourcePath: templateConfig.location,
        projectName,
        spinner,
      });
      spinner.succeed(
        logger.colors.green(t("messages.scaffolding.copy_success")),
      );
    }

    if (!isOfficialCli) {
      spinner.text = logger.colors.cyan(
        logger.colors.bold(
          `${t("messages.scaffolding.install_start", { pm: packageManager })}\n`,
        ),
      );
      spinner.stop();
      await installDependencies({ projectName, packageManager, spinner });
    }

    if (!isOfficialCli) {
      logger.log(
        logger.colors.green(
          logger.colors.bold(t("messages.success.scaffolding_complete")),
        ),
      );
      logger.log(
        logger.colors.white(
          logger.colors.bold(
            logger.colors.italic(t("messages.success.next_steps")),
          ),
        ),
      );
      logger.log(
        logger.colors.green(
          logger.colors.bold(
            ` cd ${projectName}\n git init && git add -A && git commit -m "Initial commit"\n`,
          ),
        ),
      );
    }
  } catch (err: unknown) {
    spinner.fail(logger.colors.red(t("errors.scaffolding.unexpected")));

    const message = t("errors.scaffolding.unexpected");
    if (err instanceof Error) {
      logger.error(`${message}: ${err.message}`, "UNKNOWN");
    } else {
      logger.error(message, "UNKNOWN");
    }
  }
}

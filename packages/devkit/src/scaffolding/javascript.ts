import { t } from "#utils/i18n/translator.js";
import { installDependencies } from "#scaffolding/dependencies.js";
import { logger } from "#utils/logger.js";
import fs from "#utils/fs/file.js";
import { scaffoldTemplate } from "./scaffold-template.js";
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

function logSuccessMessages(projectName: string) {
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

export async function scaffoldProject(
  options: ScaffoldJavascriptProjectOptions,
): Promise<void> {
  const { projectName, templateConfig, packageManager, cacheStrategy } =
    options;
  const spinner = logger.spinner(t("messages.status.scaffolding_project"));
  let projectDirCreated = false;
  let isOfficialCli = false;

  try {
    spinner.start();
    const result = await scaffoldTemplate(
      projectName,
      templateConfig,
      packageManager,
      cacheStrategy,
      spinner,
    );
    isOfficialCli = result.isOfficialCli;
    projectDirCreated = result.projectDirCreated;

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
      logSuccessMessages(projectName);
    }
  } catch (err: unknown) {
    spinner.fail(logger.colors.red(t("errors.scaffolding.unexpected")));

    if (projectDirCreated) {
      try {
        await fs.remove(projectName);
        logger.warning(
          logger.colors.yellow(
            t("messages.status.project_removed", { project: projectName }),
          ),
        );
        // oxlint-disable-next-line no-unused-vars
      } catch (cleanupErr: unknown) {
        logger.error(
          t("errors.scaffolding.fail", { project: projectName }),
          "CLEANUP",
        );
      }
    }

    const message = t("errors.scaffolding.unexpected");
    if (err instanceof Error) {
      logger.error(`${message}: ${err.cause}`, "UNKNOWN");
    } else {
      logger.error(message, "UNKNOWN");
    }
  }
}

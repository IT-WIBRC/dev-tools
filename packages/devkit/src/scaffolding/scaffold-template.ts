import { t } from "#utils/i18n/translator.js";
import { getTemplateFromCache } from "#core/cache/index.js";
import { runCliCommand } from "#scaffolding/cli-runner.js";
import { copyLocalTemplate } from "#scaffolding/local-template.js";
import { logger } from "#utils/logger.js";
import type {
  TemplateConfig,
  CacheStrategy,
  SupportedJavascriptPackageManager,
} from "#utils/schema/schema.js";

interface TemplateScaffoldingResult {
  isOfficialCli: boolean;
  projectDirCreated: boolean;
}

export async function scaffoldTemplate(
  projectName: string,
  templateConfig: TemplateConfig,
  packageManager: SupportedJavascriptPackageManager,
  cacheStrategy: CacheStrategy,
  spinner: ReturnType<typeof logger.spinner>,
): Promise<TemplateScaffoldingResult> {
  const { location } = templateConfig;

  if (location.includes("{pm}")) {
    spinner.text = logger.colors.cyan(
      logger.colors.bold(
        t("messages.scaffolding.run_start", {
          command: location,
        }),
      ),
    );
    spinner.stop();
    await runCliCommand({
      command: location,
      projectName,
      packageManager,
      spinner,
    });
    return { isOfficialCli: true, projectDirCreated: false };
  } else if (location.startsWith("http") || location.startsWith("git@")) {
    await getTemplateFromCache({
      url: location,
      projectName,
      spinner,
      strategy: cacheStrategy,
    });
    return { isOfficialCli: false, projectDirCreated: true };
  } else {
    spinner.text = logger.colors.cyan(t("messages.scaffolding.copy_start"));
    spinner.start();
    await copyLocalTemplate({
      sourcePath: location,
      projectName,
      spinner,
    });
    spinner.succeed(
      logger.colors.green(t("messages.scaffolding.copy_success")),
    );
    return { isOfficialCli: false, projectDirCreated: true };
  }
}

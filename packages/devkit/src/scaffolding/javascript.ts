import ora from "ora";
import chalk from "chalk";
import { t } from "#utils/internationalization/i18n.js";
import { getTemplateFromCache } from "#utils/cache/index.js";
import { runCliCommand } from "#scaffolding/cli-runner.js";
import { copyLocalTemplate } from "#scaffolding/local-template.js";
import { installDependencies } from "#scaffolding/dependencies.js";
import type {
  TemplateConfig,
  CacheStrategy,
  SupportedJavascriptPackageManager,
} from "#utils/configs/schema.js";

interface ScaffoldJavascriptProjectOptions {
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
  const spinner = ora();
  let isOfficialCli = false;

  try {
    if (templateConfig.location.includes("{pm}")) {
      isOfficialCli = true;
      spinner.text = chalk.bold.cyan(
        t("scaffolding.run.start", { command: templateConfig.location }),
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
      spinner.text = chalk.cyan(t("scaffolding.copy.start"));
      spinner.start();
      await copyLocalTemplate({
        sourcePath: templateConfig.location,
        projectName,
        spinner,
      });
      spinner.succeed(chalk.green(t("scaffolding.copy.success")));
    }

    if (!isOfficialCli) {
      spinner.text = chalk.bold.cyan(
        t("scaffolding.install.start", { pm: packageManager }),
        "\n",
      );
      spinner.stop();
      await installDependencies({ projectName, packageManager, spinner });
    }

    if (!isOfficialCli) {
      console.log(chalk.bold.green(t("scaffolding.complete.success")));
      console.log(
        chalk.italic.bold.white(t("scaffolding.complete.next_steps")),
      );
      console.log(
        chalk.bold.green(
          ` cd ${projectName}\n git init && git add -A && git commit -m "Initial commit"\n`,
        ),
      );
    }
  } catch (err) {
    spinner.fail(chalk.red(t("error.scaffolding.unexpected")));
    console.error(err);
  }
}

import {
  type TemplateConfig,
  type CacheStrategy,
  type SupportedJavascriptPackageManager,
} from "#utils/configs/schema.js";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import type { Ora } from "ora";
import { execa } from "execa";
import { getTemplateFromCache } from "#utils/cache/index.js";
import { t } from "#utils/internationalization/i18n.js";
import { findPackageRoot } from "#utils/file-finder.js";
import { DevkitError } from "#utils/errors/base.js";
import { updateJavascriptProjectName } from "#utils/update-project-name.js";
import { copyJavascriptTemplate } from "#utils/template-utils.js";

interface TemplateOptions {
  projectName: string;
  spinner: Ora;
}

interface RunOfficialCliOptions extends TemplateOptions {
  command: string;
  packageManager: SupportedJavascriptPackageManager;
}

interface ScaffoldJavascriptProjectOptions {
  projectName: string;
  templateConfig: TemplateConfig;
  packageManager: SupportedJavascriptPackageManager;
  cacheStrategy: CacheStrategy;
}

async function copyLocalTemplate(
  options: TemplateOptions & { sourcePath: string },
) {
  const { sourcePath, projectName } = options;
  const projectPath = path.join(process.cwd(), projectName);
  try {
    await copyJavascriptTemplate(sourcePath, projectPath);
    await updateJavascriptProjectName(projectPath, projectName);
  } catch (error) {
    throw new DevkitError(t("scaffolding.copy.fail"), { cause: error });
  }
}

async function runOfficialCli(options: RunOfficialCliOptions) {
  const { command, projectName, packageManager } = options;
  const finalCommand = command.replace("{pm}", packageManager);

  try {
    const [exec, ...args] = finalCommand.split(" ");
    if (!exec) {
      throw new DevkitError(
        t("error.invalid.command", { command: finalCommand }),
      );
    }

    await execa(exec, [...args, projectName], { stdio: "inherit" });
  } catch (error) {
    throw new DevkitError(t("scaffolding.run.fail"), { cause: error });
  }
}

async function installDependencies(
  options: TemplateOptions & {
    packageManager: SupportedJavascriptPackageManager;
  },
) {
  const { projectName, packageManager } = options;
  const projectPath = path.join(process.cwd(), projectName);
  try {
    await execa(packageManager, ["install"], {
      cwd: projectPath,
      stdio: "inherit",
    });
  } catch (error) {
    throw new DevkitError(t("scaffolding.install.fail"), { cause: error });
  }
}

export async function scaffoldProject(
  options: ScaffoldJavascriptProjectOptions,
) {
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
      await runOfficialCli({
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
      const sourcePath = path.isAbsolute(templateConfig.location)
        ? templateConfig.location
        : path.join(await findPackageRoot(), templateConfig.location);
      await copyLocalTemplate({
        sourcePath: sourcePath,
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

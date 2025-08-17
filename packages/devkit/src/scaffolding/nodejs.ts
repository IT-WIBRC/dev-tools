import {
  PackageManagers,
  type ValuesOf,
  type TemplateConfig,
  type CacheStrategy,
} from "../config.js";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import type { Ora } from "ora";
import { execa } from "execa";
import { getTemplateFromCache } from "../utils/cache.js";
import { t } from "../utils/i18n.js";
import { findPackageRoot } from "../utils/file-finder.js";
import { DevkitError } from "../utils/errors/errors.js";

interface TemplateOptions {
  projectName: string;
  spinner: Ora;
}

interface RunOfficialCliOptions extends TemplateOptions {
  command: string;
  packageManager: ValuesOf<typeof PackageManagers>;
}

interface ScaffoldNodejsProjectOptions {
  projectName: string;
  templateConfig: TemplateConfig;
  packageManager: ValuesOf<typeof PackageManagers>;
  cacheStrategy: CacheStrategy;
}

async function copyLocalTemplate(
  options: TemplateOptions & { sourcePath: string },
) {
  const { sourcePath, projectName } = options;
  const projectPath = path.join(process.cwd(), projectName);
  try {
    await fs.copy(sourcePath, projectPath);
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
    packageManager: ValuesOf<typeof PackageManagers>;
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

export async function scaffoldNodejsProject(
  options: ScaffoldNodejsProjectOptions,
) {
  const { projectName, templateConfig, packageManager, cacheStrategy } =
    options;
  const spinner = ora();
  let isOfficialCli = false;

  try {
    if (templateConfig.location.includes("{pm}")) {
      isOfficialCli = true;
      spinner.text = chalk.cyan(
        t("scaffolding.run.start", { command: templateConfig.location }),
      );
      spinner.start();
      await runOfficialCli({
        command: templateConfig.location,
        projectName,
        packageManager,
        spinner,
      });
      spinner.succeed(chalk.green(t("scaffolding.run.success")));
    } else if (templateConfig.location.startsWith("http")) {
      await getTemplateFromCache({
        url: templateConfig.location,
        projectName,
        spinner,
        strategy: cacheStrategy,
      });
    } else {
      spinner.text = chalk.cyan(t("scaffolding.copy.start"));
      spinner.start();
      const sourceTemplateDir = path.join(
        await findPackageRoot(),
        templateConfig.location,
      );
      await copyLocalTemplate({
        sourcePath: sourceTemplateDir,
        projectName,
        spinner,
      });
      spinner.succeed(chalk.green(t("scaffolding.copy.success")));
    }

    if (!isOfficialCli) {
      spinner.text = chalk.cyan(
        t("scaffolding.install.start", { pm: packageManager }),
      );
      spinner.start();
      await installDependencies({ projectName, packageManager, spinner });
      spinner.succeed(chalk.green(t("scaffolding.install.success")));
    }
    console.log(chalk.green(t("scaffolding.complete.success")));
    console.log(chalk.cyan(t("scaffolding.complete.next_steps")));
    console.log(chalk.cyan(`  cd ${projectName}`));
    if (!isOfficialCli) {
      console.log(chalk.cyan(`  ${packageManager} install`));
    }
  } catch (err) {
    spinner.fail(chalk.red(t("error.scaffolding.unexpected")));
    console.error(err);
  }
}

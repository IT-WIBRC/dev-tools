import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { execa } from "execa";
import { getTemplateFromCache } from "../utils/cache.js";
import { t } from "../utils/i18n.js";
async function copyLocalTemplate(options) {
  const { sourcePath, projectName, spinner } = options;
  const projectPath = path.join(process.cwd(), projectName);
  spinner.text = chalk.cyan(t("scaffolding.copy.start"));
  spinner.start();
  try {
    await fs.copy(sourcePath, projectPath);
    spinner.succeed(chalk.green(t("scaffolding.copy.success")));
  } catch (error) {
    spinner.fail(chalk.red(t("scaffolding.copy.fail")));
    throw error;
  }
}
async function runOfficialCli(options) {
  const { command, projectName, packageManager, spinner } = options;
  const finalCommand = command.replace("{pm}", packageManager);
  spinner.text = chalk.cyan(
    t("scaffolding.run.start", { command: finalCommand }),
  );
  try {
    const [exec, ...args] = finalCommand.split(" ");
    if (!exec) {
      throw new Error(t("error.invalid.command", { command: finalCommand }));
    }
    await execa(exec, [...args, projectName], { stdio: "inherit" });
    spinner.succeed(chalk.green(t("scaffolding.run.success")));
  } catch (error) {
    spinner.fail(chalk.red(t("scaffolding.run.fail")));
    throw error;
  }
}
async function installDependencies(options) {
  const { projectName, packageManager, spinner } = options;
  const projectPath = path.join(process.cwd(), projectName);
  spinner.text = chalk.cyan(
    t("scaffolding.install.start", { pm: packageManager }),
  );
  spinner.start();
  try {
    await execa(packageManager, ["install"], {
      cwd: projectPath,
      stdio: "inherit",
    });
    spinner.succeed(chalk.green(t("scaffolding.install.success")));
  } catch (error) {
    spinner.fail(chalk.red(t("scaffolding.install.fail")));
    console.error(chalk.red(t("error.install.message")), error);
    throw error;
  }
}
export async function scaffoldNodejsProject(options) {
  const { projectName, templateConfig, packageManager, cacheStrategy } =
    options;
  const spinner = ora();
  try {
    const isOfficialCli = templateConfig.location.includes("{pm}");
    if (templateConfig.location.startsWith("http")) {
      await getTemplateFromCache({
        url: templateConfig.location,
        projectName,
        spinner,
        strategy: cacheStrategy,
      });
    } else if (isOfficialCli) {
      await runOfficialCli({
        command: templateConfig.location,
        projectName,
        packageManager,
        spinner,
      });
    } else {
      const currentFileUrl = import.meta.url;
      const currentDirPath = dirname(fileURLToPath(currentFileUrl));
      const sourceTemplateDir = path.resolve(
        currentDirPath,
        "..",
        templateConfig.location,
      );
      await copyLocalTemplate({
        sourcePath: sourceTemplateDir,
        projectName,
        spinner,
      });
    }
    if (!isOfficialCli) {
      await installDependencies({ projectName, packageManager, spinner });
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

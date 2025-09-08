import {
  CONFIG_FILE_NAMES,
  defaultCliConfig,
  type SetupCommandOptions,
} from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import { ConfigError } from "#utils/errors/base.js";
import fs from "#utils/fileSystem.js";
import path from "path";
import os from "os";
import ora, { type Ora } from "ora";
import chalk from "chalk";
import { select } from "@inquirer/prompts";
import { findGlobalConfigFile, findMonorepoRoot } from "#utils/files/finder.js";
import { findUp } from "#utils/files/find-up.js";
import { saveConfig } from "#utils/configs/writer.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";

async function promptForStandardOverwrite(filePath: string): Promise<boolean> {
  const response = await select({
    message: chalk.yellow(
      t("config.init.confirm_overwrite", { path: filePath }),
    ),
    choices: [
      { name: t("common.yes"), value: true },
      { name: t("common.no"), value: false },
    ],
    default: true,
  });
  return response;
}

async function promptForMonorepoOverwrite(filePath: string): Promise<boolean> {
  const response = await select({
    message: chalk.yellow(
      t("config.init.confirm_monorepo_overwrite", { path: filePath }),
    ),
    choices: [
      { name: t("common.yes"), value: true },
      { name: t("common.no"), value: false },
    ],
    default: true,
  });
  return response;
}

async function promptForMonorepoLocation(): Promise<string> {
  const response = await select({
    message: chalk.yellow(t("config.init.monorepo_location")),
    choices: [
      { name: t("config.init.location_current"), value: "local" },
      { name: t("config.init.location_root"), value: "root" },
    ],
    default: "local",
  });
  return response;
}

async function handleGlobalInit(spinner: Ora) {
  let finalPath = await findGlobalConfigFile();
  if (!finalPath) {
    finalPath = path.join(os.homedir(), CONFIG_FILE_NAMES[0]);
  }
  const shouldOverwrite = (await fs.pathExists(finalPath))
    ? await promptForStandardOverwrite(finalPath)
    : true;

  if (shouldOverwrite) {
    spinner.start(
      chalk.cyan(t("config.init.initializing", { path: finalPath })),
    );
    await saveConfig({ ...defaultCliConfig }, finalPath);
    spinner.succeed(chalk.green(t("config.init.success")));
  } else {
    spinner.info(chalk.yellow(t("config.init.aborted")));
  }
}

async function handleLocalInit(spinner: Ora) {
  const allConfigFiles = [...CONFIG_FILE_NAMES];
  const currentPath = process.cwd();
  const existingConfigPath = await findUp(allConfigFiles, currentPath);
  const monorepoRoot = await findMonorepoRoot();
  const hasRootConfig = monorepoRoot
    ? (await findUp(allConfigFiles, monorepoRoot)) !== null
    : false;

  let finalPath = "";
  let shouldOverwrite = false;

  if (monorepoRoot && hasRootConfig) {
    const isAtRoot =
      existingConfigPath && path.dirname(existingConfigPath) === monorepoRoot;

    const initCommandAtRoot = path.dirname(currentPath) === monorepoRoot;

    if (isAtRoot && initCommandAtRoot) {
      finalPath = existingConfigPath as string;
      shouldOverwrite = await promptForStandardOverwrite(finalPath);
    } else {
      const overwriteConfirmed = await promptForMonorepoOverwrite(
        existingConfigPath as string,
      );
      if (!overwriteConfirmed) {
        spinner.info(chalk.yellow(t("config.init.aborted")));
        return;
      }
      finalPath = path.join(currentPath, allConfigFiles[1]);
      shouldOverwrite = true;
    }
  } else if (monorepoRoot && !hasRootConfig) {
    const location = await promptForMonorepoLocation();
    if (location === "root") {
      finalPath = path.join(monorepoRoot, allConfigFiles[1]);
    } else {
      finalPath = path.join(currentPath, allConfigFiles[1]);
    }
    shouldOverwrite = true;
  } else {
    finalPath = path.join(currentPath, allConfigFiles[1]);
    shouldOverwrite = (await fs.pathExists(finalPath))
      ? await promptForStandardOverwrite(finalPath)
      : true;
  }

  if (shouldOverwrite) {
    spinner.start(
      chalk.cyan(t("config.init.initializing", { path: finalPath })),
    );
    await saveConfig({ ...defaultCliConfig }, finalPath);
    spinner.succeed(chalk.green(t("config.init.success")));
  } else {
    spinner.info(chalk.yellow(t("config.init.aborted")));
  }
}

export function setupInitCommand(options: SetupCommandOptions) {
  const { program } = options;
  program
    .command("init")
    .alias("i")
    .description(t("config.init.command.description"))
    .option("-l, --local", t("config.init.option.local"), false)
    .option("-g, --global", t("config.init.option.global"), false)
    .action(async (cmdOptions) => {
      const isLocal = cmdOptions.local;
      const isGlobal = cmdOptions.global;
      const spinner = ora();

      try {
        if (isLocal && isGlobal) {
          throw new ConfigError(t("error.config.init.local_and_global"));
        }

        if (isGlobal) {
          await handleGlobalInit(spinner);
        } else {
          await handleLocalInit(spinner);
        }
      } catch (error) {
        handleErrorAndExit(error, spinner);
      }
    });
}

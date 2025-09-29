import {
  CONFIG_FILE_NAMES,
  defaultCliConfig,
  type CliConfig,
  type SetupCommandOptions,
} from "#utils/schema/schema.js";
import { t } from "#utils/i18n/translator.js";
import { ConfigError } from "#utils/errors/base.js";
import fs from "#utils/fs/file.js";
import path from "path";
import os from "os";
import ora, { type Ora } from "ora";
import chalk from "chalk";
import { select } from "@inquirer/prompts";
import { findGlobalConfigFile } from "#core/config/search.js";
import { findMonorepoRoot, findProjectRoot } from "#utils/fs/finder.js";
import { findUp } from "#utils/fs/find-up.js";
import { saveConfig } from "#core/config/writer.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { getPackageManager } from "#utils/package-manager/index.js";

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

async function getUpdatedConfig(): Promise<CliConfig> {
  const detectedPackageManager = await getPackageManager(true);
  return {
    ...defaultCliConfig,
    settings: {
      ...defaultCliConfig.settings,
      defaultPackageManager:
        detectedPackageManager ||
        defaultCliConfig.settings.defaultPackageManager,
    },
  };
}

async function handleGlobalInit(spinner: Ora): Promise<void> {
  let finalPath = await findGlobalConfigFile();
  if (!finalPath) {
    finalPath = path.join(os.homedir(), CONFIG_FILE_NAMES[0]);
  }

  const shouldOverwrite = (await fs.pathExists(finalPath))
    ? await promptForStandardOverwrite(finalPath)
    : true;

  if (shouldOverwrite) {
    const configToSave = await getUpdatedConfig();
    spinner.start(
      chalk.cyan(t("config.init.initializing", { path: finalPath })),
    );
    await saveConfig(configToSave, finalPath);
    spinner.succeed(chalk.green(t("config.init.success")));
  } else {
    spinner.info(chalk.yellow(t("config.init.aborted")));
  }
}

async function handleLocalInit(spinner: Ora): Promise<void> {
  const allConfigFiles = [...CONFIG_FILE_NAMES];
  const currentPath = process.cwd();
  const monorepoRoot = await findMonorepoRoot();
  const projectRoot = await findProjectRoot();

  let finalPath: string | null = null;
  let shouldOverwrite = true;
  const rootDir = monorepoRoot || projectRoot || currentPath;

  const existingConfigPath = await findUp({
    files: allConfigFiles,
    cwd: rootDir,
    limit: rootDir,
  });

  if (existingConfigPath) {
    finalPath = existingConfigPath;
    shouldOverwrite = await promptForStandardOverwrite(finalPath);
  } else {
    finalPath = path.join(rootDir, allConfigFiles[1]);
  }

  if (shouldOverwrite && finalPath) {
    const configToSave = await getUpdatedConfig();
    spinner.start(
      chalk.cyan(t("config.init.initializing", { path: finalPath })),
    );
    await saveConfig(configToSave, finalPath);
    spinner.succeed(chalk.green(t("config.init.success")));
  } else {
    spinner.info(chalk.yellow(t("config.init.aborted")));
  }
}

export function setupInitCommand(options: SetupCommandOptions): void {
  const { program } = options;
  program
    .command("init")
    .alias("i")
    .description(t("config.init.command.description"))
    .option("-l, --local", t("config.init.option.local"), false)
    .option("-g, --global", t("config.init.option.global"), false)
    .action(async (cmdOptions: { local: boolean; global: boolean }) => {
      const isLocal: boolean = cmdOptions.local;
      const isGlobal: boolean = cmdOptions.global;
      const spinner: Ora = ora();

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

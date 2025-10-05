import {
  CONFIG_FILE_NAMES,
  defaultCliConfig,
  type CliConfig,
} from "#utils/schema/schema.js";
import { t } from "#utils/i18n/translator.js";
import fs from "#utils/fs/file.js";
import path from "path";
import os from "os";
import { logger, TSpinner } from "#utils/logger.js";
import { select } from "@inquirer/prompts";
import { findGlobalConfigFile } from "#core/config/search.js";
import { findMonorepoRoot, findProjectRoot } from "#utils/fs/finder.js";
import { findUp } from "#utils/fs/find-up.js";
import { saveConfig } from "#core/config/writer.js";
import { getPackageManager } from "#utils/package-manager/index.js";

export async function promptForStandardOverwrite(
  filePath: string,
  skipConfirmation: boolean = false,
): Promise<boolean> {
  if (skipConfirmation) {
    logger.info(
      logger.colors.yellow(
        t("commands.config.init.skip_yes_confirm", { path: filePath }),
      ),
    );
    return true;
  }

  const response = await select({
    message: logger.colors.yellow(
      t("commands.config.init.confirm_overwrite", { path: filePath }),
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

export async function handleGlobalInit(
  spinner: TSpinner,
  skipConfirmation: boolean = false,
): Promise<void> {
  let finalPath = await findGlobalConfigFile();
  if (!finalPath) {
    finalPath = path.join(os.homedir(), CONFIG_FILE_NAMES[0]);
  }

  const shouldOverwrite = (await fs.pathExists(finalPath))
    ? await promptForStandardOverwrite(finalPath, skipConfirmation)
    : true;

  if (shouldOverwrite) {
    const configToSave = await getUpdatedConfig();
    spinner.start(
      logger.colors.cyan(
        t("messages.status.config_init_start", { path: finalPath }),
      ),
    );
    await saveConfig(configToSave, finalPath);
    spinner.succeed(
      logger.colors.green(t("messages.success.config_initialized")),
    );
  } else {
    spinner.info(logger.colors.yellow(t("commands.config.init.aborted")));
  }
}

export async function handleLocalInit(
  spinner: TSpinner,
  skipConfirmation: boolean = false,
): Promise<void> {
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
    shouldOverwrite = await promptForStandardOverwrite(
      finalPath,
      skipConfirmation,
    );
  } else {
    finalPath = path.join(rootDir, allConfigFiles[1]);
  }

  if (shouldOverwrite && finalPath) {
    const configToSave = await getUpdatedConfig();
    spinner.start(
      logger.colors.cyan(
        t("messages.status.config_init_start", { path: finalPath }),
      ),
    );
    await saveConfig(configToSave, finalPath);
    spinner.succeed(
      logger.colors.green(t("messages.success.config_initialized")),
    );
  } else {
    spinner.info(logger.colors.yellow(t("commands.config.init.aborted")));
  }
}

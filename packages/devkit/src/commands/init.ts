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

interface InitResult {
  finalPath: string;
  shouldOverwrite: boolean;
}

interface InitContext {
  allConfigFiles: string[];
  currentPath: string;
  monorepoRoot: string | null;
  hasRootConfig: boolean;
  spinner: Ora;
}

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

async function handleGlobalInit(spinner: Ora): Promise<void> {
  let finalPath = await findGlobalConfigFile();
  if (!finalPath) {
    finalPath = path.join(os.homedir(), CONFIG_FILE_NAMES[0]);
  }
  const shouldOverwrite: boolean = (await fs.pathExists(finalPath))
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

async function handleMonorepoWithConfig(
  context: InitContext,
): Promise<InitResult> {
  const { allConfigFiles, currentPath, monorepoRoot } = context;
  const existingConfigPath = await findUp(allConfigFiles, currentPath);

  if (existingConfigPath) {
    const isAtRoot = path.dirname(existingConfigPath) === monorepoRoot;
    if (isAtRoot) {
      const shouldOverwrite =
        await promptForMonorepoOverwrite(existingConfigPath);
      return { finalPath: existingConfigPath, shouldOverwrite };
    }
  }

  return {
    finalPath: path.join(currentPath, allConfigFiles[1]),
    shouldOverwrite: true,
  };
}

async function handleMonorepoWithoutConfig(
  context: InitContext,
): Promise<InitResult> {
  const { allConfigFiles, currentPath, monorepoRoot } = context;
  const location: string = await promptForMonorepoLocation();
  const finalPath: string =
    location === "root"
      ? path.join(monorepoRoot!, allConfigFiles[1])
      : path.join(currentPath, allConfigFiles[1]);
  return { finalPath, shouldOverwrite: true };
}

async function handleStandardMultiRepo(
  context: InitContext,
): Promise<InitResult> {
  const { allConfigFiles, currentPath } = context;
  const projectRoot = await findUp("package.json", currentPath);
  const existingRootConfig = projectRoot
    ? await findUp(allConfigFiles, path.dirname(projectRoot))
    : null;

  if (existingRootConfig) {
    const shouldOverwrite =
      await promptForStandardOverwrite(existingRootConfig);
    return { finalPath: existingRootConfig, shouldOverwrite };
  }

  const finalPath: string = path.join(currentPath, allConfigFiles[1]);
  const shouldOverwrite =
    !(await fs.pathExists(finalPath)) ||
    (await promptForStandardOverwrite(finalPath));
  return { finalPath, shouldOverwrite };
}

async function handleLocalInit(spinner: Ora): Promise<void> {
  const allConfigFiles = [...CONFIG_FILE_NAMES];
  const currentPath = process.cwd();
  const monorepoRoot = await findMonorepoRoot();

  const hasRootConfig: boolean = monorepoRoot
    ? (await findUp(allConfigFiles, monorepoRoot)) !== null
    : false;

  let finalPath = "";
  let shouldOverwrite = false;

  const context: InitContext = {
    allConfigFiles,
    currentPath,
    monorepoRoot,
    hasRootConfig,
    spinner,
  };

  if (monorepoRoot && hasRootConfig) {
    ({ finalPath, shouldOverwrite } = await handleMonorepoWithConfig(context));
  } else if (monorepoRoot && !hasRootConfig) {
    ({ finalPath, shouldOverwrite } =
      await handleMonorepoWithoutConfig(context));
  } else {
    console.log("===---->");
    ({ finalPath, shouldOverwrite } = await handleStandardMultiRepo(context));
  }

  if (!shouldOverwrite) {
    spinner.info(chalk.yellow(t("config.init.aborted")));
    return;
  }

  spinner.start(chalk.cyan(t("config.init.initializing", { path: finalPath })));
  await saveConfig({ ...defaultCliConfig }, finalPath);
  spinner.succeed(chalk.green(t("config.init.success")));
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

import { getMergedConfig } from "../config/merger.js";
import { defaultCliConfig, type CliConfig } from "#utils/schema/schema.js";
import { getPackageManager } from "#utils/package-manager/index.js";
import { findGlobalConfigFile, findLocalConfigFile } from "../config/search.js";
import { t } from "#utils/i18n/translator.js";
import { execute } from "#utils/shell.js";
import os from "os";

const getPackageManagerVersion = async (
  config: CliConfig | undefined,
): Promise<string> => {
  let managerToQuery: string;

  if (config?.settings?.defaultPackageManager) {
    managerToQuery = config.settings.defaultPackageManager;
  } else {
    const detectedManager = await getPackageManager();

    if (detectedManager) {
      managerToQuery = detectedManager;
    } else {
      managerToQuery = defaultCliConfig.settings.defaultPackageManager;
    }
  }

  try {
    const { stdout } = await execute(managerToQuery, ["--version"]);
    return `${managerToQuery} v${(stdout as string)?.trim?.()}`;
    // oxlint-disable-next-line no-unused-vars
  } catch (_error: unknown) {
    return t("errors.system.info_package_manager_not_found", {
      manager: managerToQuery,
    });
  }
};

export type SystemInfo = {
  cliVersion: string;
  os: string;
  arch: string;
  shell: string;
  runtimeVersion: string;
  runtimeName: string;
  packageManagerVersion: string;
  homeDir: string;
  globalConfig: { path: string; exists: boolean };
  localConfig: { path: string; exists: boolean };
};

export const collectSystemInfo = async (
  cliVersion: string,
): Promise<SystemInfo> => {
  const config = await getMergedConfig(true);

  const packageManagerVersion = await getPackageManagerVersion(config);

  const foundGlobalPath = await findGlobalConfigFile();
  const foundLocalPath = await findLocalConfigFile();

  const homeDir = os.homedir();

  const globalConfigPath = foundGlobalPath
    ? foundGlobalPath
    : t("commands.info.config.global_expected_location");

  const localConfigPath = foundLocalPath
    ? foundLocalPath
    : t("commands.info.config.local_expected_location");

  let runtimeName: string;
  let runtimeVersion: string;

  const isBunRuntime = typeof (globalThis as any).Bun !== "undefined";
  if (isBunRuntime) {
    runtimeName = "Bun";
    runtimeVersion = `v${(globalThis as any).Bun.version}`;
  } else {
    runtimeName = "Node.js";
    runtimeVersion = process.version;
  }

  return {
    cliVersion,
    os: `${os.type()} ${os.release()}`,
    arch: os.arch(),
    shell:
      process.env.SHELL ||
      process.env.COMSPEC ||
      t("commands.info.shell.unknown"),
    runtimeName,
    runtimeVersion,
    packageManagerVersion: packageManagerVersion,
    homeDir: homeDir,
    globalConfig: {
      path: globalConfigPath,
      exists: !!foundGlobalPath,
    },
    localConfig: {
      path: localConfigPath,
      exists: !!foundLocalPath,
    },
  };
};

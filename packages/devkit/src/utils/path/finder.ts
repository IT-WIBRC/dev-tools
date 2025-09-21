import path from "path";
import {
  CONFIG_FILE_NAMES,
  type ConfigurationSource,
  type ReadConfigOptions,
} from "#utils/configs/schema.js";
import { findUp } from "#utils/files/find-up.js";
import {
  findGlobalConfigFile,
  findLocalConfigFile,
} from "#utils/configs/search.js";
import fs from "#utils/fileSystem.js";

export async function getConfigFilepath(isGlobal = false): Promise<string> {
  const allConfigFiles = [...CONFIG_FILE_NAMES];

  if (isGlobal) {
    return (await findGlobalConfigFile()) || "";
  }

  const localConfigPath = await findUp({
    files: [...allConfigFiles],
    cwd: process.cwd(),
  });

  if (localConfigPath) {
    return localConfigPath;
  }

  return path.join(process.cwd(), allConfigFiles[1]);
}

type ReadConfig = Omit<ReadConfigOptions, "useFallback">;
export async function findConfigPaths(options: ReadConfig): Promise<{
  primary: string | null;
  secondary: string | null;
  source: ConfigurationSource;
  configFound: boolean;
}> {
  const shouldMergeAll =
    !!options.mergeAll || (!!options.forceGlobal && !!options.forceLocal);

  let primaryPath: string | null = null;
  let secondaryPath: string | null = null;
  let source: ConfigurationSource = "default";
  let configFound = false;

  const isConfigPathExist = async (path: string | null): Promise<boolean> =>
    path ? await fs.pathExists(path) : false;

  if (shouldMergeAll) {
    const localPath = await findLocalConfigFile();
    const globalPath = await findGlobalConfigFile();
    const hasLocal = await isConfigPathExist(localPath);
    const hasGlobal = await isConfigPathExist(globalPath);

    if (hasLocal) {
      primaryPath = localPath;
      configFound = true;
      source = hasGlobal ? "merged" : "local";
      if (hasGlobal) {
        secondaryPath = globalPath;
      }
    } else if (hasGlobal) {
      primaryPath = globalPath;
      configFound = true;
      source = "global";
    }
  } else if (options.forceLocal) {
    primaryPath = await findLocalConfigFile();
    if (await isConfigPathExist(primaryPath)) {
      source = "local";
      configFound = true;
    }
  } else if (options.forceGlobal) {
    primaryPath = await findGlobalConfigFile();
    if (await isConfigPathExist(primaryPath)) {
      source = "global";
      configFound = true;
    }
  } else {
    primaryPath = await findLocalConfigFile();
    if (await isConfigPathExist(primaryPath)) {
      source = "local";
      configFound = true;
    } else {
      primaryPath = await findGlobalConfigFile();
      if (await isConfigPathExist(primaryPath)) {
        source = "global";
        configFound = true;
      }
    }
  }

  return {
    primary: primaryPath,
    secondary: secondaryPath,
    source,
    configFound,
  };
}

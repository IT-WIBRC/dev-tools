import {
  CONFIG_FILE_NAMES,
  type ReadConfigOptions,
} from "#utils/schema/schema.js";
import fs from "#utils/fs/file.js";
import { findUp } from "#utils/fs/find-up.js";
import { findGlobalConfigFile, findLocalConfigFile } from "./search.js";
import path from "path";

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
export async function getConfigPathSources(options: ReadConfig): Promise<{
  localPath: string | null;
  globalPath: string | null;
}> {
  const localConfigPath = await findLocalConfigFile();
  const globalConfigPath = await findGlobalConfigFile();

  const isConfigPathExist = async (path: string | null): Promise<boolean> =>
    path ? await fs.pathExists(path) : false;

  const hasLocal = await isConfigPathExist(localConfigPath);
  const hasGlobal = await isConfigPathExist(globalConfigPath);

  let finalLocalPath: string | null = null;
  let finalGlobalPath: string | null = null;

  const shouldMergeAll = !!options.mergeAll;

  if (shouldMergeAll) {
    finalLocalPath = hasLocal ? localConfigPath : null;
    finalGlobalPath = hasGlobal ? globalConfigPath : null;
  } else if (options.forceLocal) {
    finalLocalPath = hasLocal ? localConfigPath : null;
    finalGlobalPath = null;
  } else if (options.forceGlobal) {
    finalLocalPath = null;
    finalGlobalPath = hasGlobal ? globalConfigPath : null;
  } else {
    if (hasLocal) {
      finalLocalPath = localConfigPath;
      finalGlobalPath = null;
    } else if (hasGlobal) {
      finalLocalPath = null;
      finalGlobalPath = globalConfigPath;
    }
  }

  return {
    localPath: finalLocalPath,
    globalPath: finalGlobalPath,
  };
}

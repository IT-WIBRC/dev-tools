import os from "os";
import { CONFIG_FILE_NAMES } from "#utils/schema/schema.js";
import {
  findFileInDirectory,
  findMonorepoRoot,
  findProjectRoot,
} from "#utils/fs/finder.js";
import { findUp } from "#utils/fs/find-up.js";

const allConfigFiles = [...CONFIG_FILE_NAMES];

export async function findGlobalConfigFile(): Promise<string | null> {
  const homeDir = os.homedir();
  return findFileInDirectory(homeDir, allConfigFiles);
}

export async function findLocalConfigFile(): Promise<string | null> {
  const monorepoRoot = await findMonorepoRoot();
  const projectRoot = await findProjectRoot();

  const searchLimit = monorepoRoot || projectRoot;

  if (!searchLimit) {
    return findUp({
      files: [...CONFIG_FILE_NAMES],
      cwd: process.cwd(),
      limit: process.cwd(),
    });
  }

  return findUp({
    files: [...CONFIG_FILE_NAMES],
    cwd: process.cwd(),
    limit: searchLimit,
  });
}

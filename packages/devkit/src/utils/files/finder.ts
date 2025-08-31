import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import os from "os";
import fs from "fs-extra";
import { CONFIG_FILE_NAMES, FILE_NAMES } from "#utils/configs/schema.js";
import { DevkitError } from "#utils/errors/base.js";
import { findUp } from "./find-up.js";

const allConfigFiles = [...CONFIG_FILE_NAMES];
async function findFileInDirectory(
  directory: string,
  fileNames: string[],
): Promise<string | null> {
  for (const fileName of fileNames) {
    const filePath = path.join(directory, fileName);
    if (await fs.pathExists(filePath)) {
      return filePath;
    }
  }
  return null;
}

export async function findGlobalConfigFile(): Promise<string | null> {
  const homeDir = os.homedir();
  return findFileInDirectory(homeDir, allConfigFiles);
}

export async function findLocalConfigFile(): Promise<string | null> {
  const monorepoRoot = await findMonorepoRoot();
  let currentDir = process.cwd();

  while (true) {
    const filePath = await findFileInDirectory(
      currentDir,
      [...allConfigFiles].reverse(),
    );
    if (filePath) {
      return filePath;
    }

    const parentDir = path.dirname(currentDir);

    if (
      currentDir === parentDir ||
      (monorepoRoot && currentDir === monorepoRoot)
    ) {
      return null;
    }

    currentDir = parentDir;
  }
}

export async function findMonorepoRoot(): Promise<string | null> {
  const monorepoIndicators = ["pnpm-workspace.yaml", "lerna.json"];
  const searchFor = [...monorepoIndicators, FILE_NAMES.packageJson];

  let currentSearchDir = process.cwd();

  while (true) {
    const foundFile = await findUp(searchFor, currentSearchDir);

    if (!foundFile) {
      return null;
    }

    const rootDir = path.dirname(foundFile);
    const isBunOrYarnOrNpm =
      path.basename(foundFile) === FILE_NAMES.packageJson;

    if (isBunOrYarnOrNpm) {
      try {
        const packageJson = await fs.readJson(foundFile);
        if (packageJson.workspaces) {
          return rootDir;
        }
      } catch (e) {
        return null;
      }
    } else {
      return rootDir;
    }
    currentSearchDir = path.dirname(rootDir);
  }
}

export async function findProjectRoot(): Promise<string | null> {
  const filePath = await findUp(FILE_NAMES.packageJson, process.cwd());
  if (!filePath) {
    return null;
  }
  return path.dirname(filePath);
}

export async function findPackageRoot(): Promise<string> {
  const __filename = fileURLToPath(import.meta.url);
  const startDir = dirname(__filename);
  const filePath = await findUp(FILE_NAMES.packageJson, startDir);
  if (!filePath) {
    throw new DevkitError(
      "Package root not found. Cannot determine the root of the devkit.",
    );
  }
  return path.dirname(filePath);
}

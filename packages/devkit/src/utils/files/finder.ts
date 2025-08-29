import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import os from "os";
import fs from "fs-extra";
import { CONFIG_FILE_NAMES, FILE_NAMES } from "#utils/configs/schema.js";
import { DevkitError } from "#utils/errors/base.js";
import { findUp } from "./find-up.js";

export async function findMonorepoRoot(): Promise<string | null> {
  const monorepoIndicators = ["pnpm-workspace.yaml", "lerna.json"];
  const searchFor = [...monorepoIndicators, "package.json"];

  let currentSearchDir = process.cwd();

  while (true) {
    const foundFile = await findUp(searchFor, currentSearchDir);

    if (!foundFile) {
      return null;
    }

    const rootDir = path.dirname(foundFile);
    const isBunOrYarnOrNpm = path.basename(foundFile) === "package.json";

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

export async function findGlobalConfigFile(): Promise<string> {
  const allConfigFiles = [...CONFIG_FILE_NAMES];
  const homeDir = os.homedir();

  for (const fileName of allConfigFiles) {
    const globalConfigPath = path.join(homeDir, fileName);
    if (await fs.pathExists(globalConfigPath)) {
      return globalConfigPath;
    }
  }
  return path.join(homeDir, allConfigFiles[0]);
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

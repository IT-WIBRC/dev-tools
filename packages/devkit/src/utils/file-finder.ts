import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { homedir } from "os";
import { FILE_NAMES } from "#utils/configs/schema.js";
import { DevkitError } from "#utils/errors/base.js";

export async function findUp(
  fileName: string | string[],
  startDir: string,
): Promise<string | null> {
  let currentDir = path.resolve(startDir);
  const filesToFind = Array.isArray(fileName) ? fileName : [fileName];

  while (true) {
    for (const file of filesToFind) {
      const filePath = path.join(currentDir, file);
      try {
        await fs.promises.stat(filePath);
        return filePath;
      } catch (e) {
        // File does not exist, continue search
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir || currentDir === homedir()) {
      break;
    }
    currentDir = parentDir;
  }
  return null;
}

export async function findMonorepoRoot(): Promise<string | null> {
  const monorepoIndicators = ["pnpm-workspace.yaml", "lerna.json"];
  const rootFile = await findUp(monorepoIndicators, process.cwd());
  return rootFile ? path.dirname(rootFile) : null;
}

export async function findProjectRoot(): Promise<string | null> {
  const filePath = await findUp(FILE_NAMES.common.packageJson, process.cwd());
  if (!filePath) {
    return null;
  }
  return path.dirname(filePath);
}

export async function findPackageRoot(): Promise<string> {
  const __filename = fileURLToPath(import.meta.url);
  const startDir = dirname(__filename);
  const filePath = await findUp(FILE_NAMES.common.packageJson, startDir);
  if (!filePath) {
    throw new DevkitError(
      "Package root not found. Cannot determine the root of the devkit.",
    );
  }
  return path.dirname(filePath);
}

export async function findLocalesDir(): Promise<string> {
  const packageRoot = await findPackageRoot();
  return path.join(packageRoot, "locales");
}

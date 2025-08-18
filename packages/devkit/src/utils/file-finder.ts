import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { homedir } from "os";
import { CONFIG_FILE_NAMES } from "#utils/configs/schema.js";
import { DevkitError, ConfigError } from "#utils/errors/base.js";

export async function findUp(
  fileName: string | string[],
  startDir: string,
): Promise<string> {
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

    const packageJsonPath = path.join(currentDir, "package.json");
    try {
      const packageJson = await fs.readJson(packageJsonPath);
      if (packageJson.workspaces) {
        return packageJsonPath;
      }
    } catch (e) {
      // package.json doesn't exist or is invalid, continue search
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir || currentDir === homedir()) {
      break;
    }
    currentDir = parentDir;
  }
  return "";
}

export async function findProjectRoot(): Promise<string> {
  const filePath = await findUp("package.json", process.cwd());
  if (!filePath) {
    throw new DevkitError(
      "Project root not found. Please ensure a package.json file exists.",
    );
  }
  return path.dirname(filePath);
}

export async function findPackageRoot(): Promise<string> {
  const __filename = fileURLToPath(import.meta.url);
  const startDir = dirname(__filename);
  const filePath = await findUp("package.json", startDir);
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

export async function findConfigPath(): Promise<string> {
  const monorepoIndicators = ["pnpm-workspace.yaml", "lerna.json"];
  const monorepoRootPath = await findUp(monorepoIndicators, process.cwd());

  if (monorepoRootPath) {
    for (const name of CONFIG_FILE_NAMES) {
      const monorepoConfigPath = path.join(
        path.dirname(monorepoRootPath),
        name,
      );
      try {
        await fs.promises.stat(monorepoConfigPath);
        return monorepoConfigPath;
      } catch (e) {
        // File not found, try next name
      }
    }
  }

  let projectRoot = "";
  try {
    projectRoot = await findProjectRoot();
  } catch (e) {}

  if (projectRoot) {
    for (const name of CONFIG_FILE_NAMES) {
      const localConfigPath = path.join(projectRoot, name);
      try {
        await fs.promises.stat(localConfigPath);
        return localConfigPath;
      } catch (e) {
        // File not found, try next name
      }
    }
  }

  throw new ConfigError(
    "No configuration file found in project or monorepo root.",
  );
}

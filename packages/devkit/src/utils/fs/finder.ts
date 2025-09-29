import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "./file.js";
import { FILE_NAMES } from "#utils/schema/schema.js";
import { DevkitError } from "#utils/errors/base.js";
import { findUp } from "./find-up.js";

export async function findFileInDirectory(
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

const MONOREPO_INDICATORS: string[] = [
  "pnpm-workspace.yaml",
  "lerna.json",
] as const;
const NODE_MODULES = "node_modules";

export async function findMonorepoRoot(): Promise<string | null> {
  const foundFile = await findUp({
    files: [...MONOREPO_INDICATORS, NODE_MODULES],
  });

  if (!foundFile) {
    return null;
  }

  const rootDir = path.dirname(foundFile);
  const fileName = path.basename(foundFile);

  if (MONOREPO_INDICATORS.includes(fileName) || fileName === NODE_MODULES) {
    return rootDir;
  }

  return null;
}

export async function findProjectRoot(): Promise<string | null> {
  const filePath = await findUp({
    files: [NODE_MODULES],
  });
  if (!filePath) {
    return null;
  }
  return path.dirname(filePath);
}

export async function findPackageRoot(): Promise<string> {
  const __filename = fileURLToPath(import.meta.url);
  const startDir = dirname(__filename);
  const filePath = await findUp({
    files: [FILE_NAMES.packageJson],
    cwd: startDir,
  });
  if (!filePath) {
    throw new DevkitError(
      "Package root not found. Cannot determine the root of the devkit.",
    );
  }
  return path.dirname(filePath);
}

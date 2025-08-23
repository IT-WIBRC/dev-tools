import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { FILE_NAMES } from "#utils/configs/schema.js";
import { DevkitError } from "#utils/errors/base.js";
import { findUp } from "./find-up.js";

export async function findMonorepoRoot(): Promise<string | null> {
  const monorepoIndicators = ["pnpm-workspace.yaml", "lerna.json"];
  const rootFile = await findUp(monorepoIndicators, process.cwd());
  return rootFile ? path.dirname(rootFile) : null;
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

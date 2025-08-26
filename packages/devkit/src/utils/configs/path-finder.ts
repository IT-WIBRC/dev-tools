import path from "path";
import os from "os";
import { CONFIG_FILE_NAMES } from "./schema.js";
import { findMonorepoRoot, findProjectRoot } from "../files/finder.js";
import { findUp } from "../files/find-up.js";

export async function getConfigFilepath(isGlobal = false): Promise<string> {
  if (isGlobal) {
    return path.join(os.homedir(), CONFIG_FILE_NAMES[0]);
  }

  const localConfigPath = await findUp([...CONFIG_FILE_NAMES], process.cwd());

  if (localConfigPath) {
    return localConfigPath;
  }

  const monorepoRoot = await findMonorepoRoot();
  if (monorepoRoot) {
    return path.join(monorepoRoot, CONFIG_FILE_NAMES[1]);
  }

  const projectRoot = await findProjectRoot();
  if (projectRoot) {
    return path.join(projectRoot, CONFIG_FILE_NAMES[1]);
  }

  return path.join(process.cwd(), CONFIG_FILE_NAMES[0]);
}

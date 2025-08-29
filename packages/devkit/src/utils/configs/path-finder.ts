import path from "path";
import { CONFIG_FILE_NAMES } from "./schema.js";
import { findUp } from "../files/find-up.js";
import { findGlobalConfigFile } from "../files/finder.js";

export async function getConfigFilepath(isGlobal = false): Promise<string> {
  const allConfigFiles = [...CONFIG_FILE_NAMES];

  if (isGlobal) {
    return findGlobalConfigFile();
  }

  const localConfigPath = await findUp([...allConfigFiles], process.cwd());

  if (localConfigPath) {
    return localConfigPath;
  }

  return path.join(process.cwd(), allConfigFiles[1]);
}

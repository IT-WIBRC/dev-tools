import fs from "fs-extra";
import path from "path";
import { findProjectRoot } from "./file-finder.js";
import { CONFIG_FILE_NAMES } from "../config.js";

export function findConfigFile(): string | null {
  let projectRoot: string;
  try {
    projectRoot = findProjectRoot();
  } catch (e) {
    console.warn(e);
    return null;
  }

  for (const name of CONFIG_FILE_NAMES) {
    const filePath = path.join(projectRoot, name);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
}

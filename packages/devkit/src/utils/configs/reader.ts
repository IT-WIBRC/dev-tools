import fs from "#utils/fileSystem.js";
import { readFile } from "fs/promises";
import { type CliConfig } from "#utils/configs/schema.js";
import { getConfigFilepath } from "#utils/configs/path-finder.js";

const { existsSync } = fs;

export async function readConfigAtPath(
  filePath: string,
): Promise<CliConfig | null> {
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    const fileContent = await readFile(filePath, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    throw new Error(`Failed to read or parse config file at ${filePath}`);
  }
}

export async function readLocalConfig() {
  const filePath = await getConfigFilepath(false);
  if (!filePath || !existsSync(filePath)) {
    return null;
  }
  const config = await readConfigAtPath(filePath);
  if (!config) return null;
  return { config, filePath, source: "local" };
}

export async function readGlobalConfig() {
  const filePath = await getConfigFilepath(true);
  if (!filePath || !existsSync(filePath)) {
    return null;
  }
  const config = await readConfigAtPath(filePath);
  if (!config) return null;
  return { config, filePath, source: "global" };
}

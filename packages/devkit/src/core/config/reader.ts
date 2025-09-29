import fs from "#utils/fs/file.js";
import { type CliConfig } from "#utils/schema/schema.js";
import { getConfigFilepath } from "./finder.js";

const { existsSync } = fs;

export async function readConfigAtPath(
  filePath: string,
): Promise<CliConfig | null> {
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    return await fs.readJson(filePath);
  } catch (error) {
    throw new Error(`Failed to read or parse config file at ${filePath}`, {
      cause: error,
    });
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

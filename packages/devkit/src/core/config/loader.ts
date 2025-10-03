import {
  type CliConfig,
  defaultCliConfig,
  type ReadConfigOptions,
} from "#utils/schema/schema.js";
import fs from "#utils/fs/file.js";
import { getConfigPathSources } from "./finder.js";

export type ConfigurationSources = {
  default: CliConfig;
  global: CliConfig | null;
  local: CliConfig | null;
  configFound: boolean;
};

async function readSingleConfig(
  path: string | null,
): Promise<CliConfig | null> {
  if (path && (await fs.pathExists(path))) {
    try {
      return (await fs.readJson(path)) as CliConfig;
    } catch (e: unknown) {
      console.error(
        `Warning: Failed to parse configuration file at "${path}". The file may be invalid.`,
        (e as Error).cause,
      );
    }
  }
  return null;
}

export async function readConfigSources(
  options: ReadConfigOptions = {},
): Promise<ConfigurationSources> {
  const { localPath, globalPath } = await getConfigPathSources(options);

  const [localConfig, globalConfig] = await Promise.all([
    readSingleConfig(localPath),
    readSingleConfig(globalPath),
  ]);

  const configFound = !!localConfig || !!globalConfig;

  return {
    default: structuredClone(defaultCliConfig),
    global: structuredClone(globalConfig),
    local: structuredClone(localConfig),
    configFound,
  };
}

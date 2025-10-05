import {
  type CliConfig,
  defaultCliConfig,
  type ReadConfigOptions,
} from "#utils/schema/schema.js";
import fs from "#utils/fs/file.js";
import { getConfigPathSources } from "./finder.js";
import { logger } from "#utils/logger.js";
import { t } from "#utils/i18n/translator.js";

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
      if (e instanceof Error) {
        logger.error(t("errors.config.read_fail_path", { path }), "ERR");
        logger.warning(t("warnings.not_found"));
      } else {
        logger.error(t("errors.generic.unexpected"), "UNKNOWN");
      }
      return null;
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

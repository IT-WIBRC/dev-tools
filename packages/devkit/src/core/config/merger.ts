import deepmerge from "deepmerge";
import { readConfigSources } from "./loader.js";
import { type CliConfig } from "#utils/schema/schema.js";

export function mergeCliConfigs(
  configs: (CliConfig | null | undefined)[],
): CliConfig {
  const mergeOptions: deepmerge.Options = {
    arrayMerge: (_, sourceArray) => sourceArray,
  };

  const validConfigs = configs.filter(
    (config): config is CliConfig => !!config,
  );

  if (validConfigs.length === 0) {
    return {} as CliConfig;
  }

  const mergedConfig = validConfigs.reduce((accumulator, currentConfig) => {
    return deepmerge(accumulator, currentConfig, mergeOptions) as CliConfig;
  });

  return mergedConfig;
}

export async function getMergedConfig(
  mergeAll: boolean = true,
): Promise<CliConfig> {
  const {
    local,
    global,
    default: defaultConfig,
  } = await readConfigSources({
    mergeAll: mergeAll,
  });

  return mergeCliConfigs([defaultConfig, global, local]);
}

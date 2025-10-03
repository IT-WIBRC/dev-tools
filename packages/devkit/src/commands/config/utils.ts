import type { CliConfig } from "#utils/schema/schema.js";
import { readConfigSources } from "#core/config/loader.js";
import { configAliases } from "#utils/validations/configAliases";

export const CONFIG_KEY_ALIASES = configAliases;

export function resolveKeys(
  keys: string[],
): Array<keyof CliConfig["settings"]> {
  return keys.map((key) => {
    const alias = CONFIG_KEY_ALIASES[key];
    return (alias || key) as keyof CliConfig["settings"];
  });
}

export function resolveSingleKey(key: string): keyof CliConfig["settings"] {
  const alias = CONFIG_KEY_ALIASES[key];
  return (alias || key) as keyof CliConfig["settings"];
}

export async function getSettingsConfig(isGlobal: boolean): Promise<CliConfig> {
  const isLocal = !isGlobal;
  const configSources = await readConfigSources({
    forceGlobal: isGlobal,
    forceLocal: isLocal,
  });

  function getConfig(config: CliConfig | null): CliConfig {
    return (config || { settings: {} }) as CliConfig;
  }

  return isLocal
    ? getConfig(configSources?.local)
    : getConfig(configSources?.global);
}

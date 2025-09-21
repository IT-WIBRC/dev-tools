import deepmerge from "deepmerge";
import { getConfigFilepath } from "#utils/path/finder.js";
import { readConfigAtPath } from "#utils/configs/reader.js";
import { t } from "#utils/internationalization/i18n.js";
import { DevkitError } from "#utils/errors/base.js";
import type { CliConfig, ConfigurationSource } from "#utils/configs/schema.js";

export async function getConfig(
  isGlobal: boolean,
  source: ConfigurationSource,
  config: CliConfig,
): Promise<CliConfig> {
  if (source === "default") {
    throw new DevkitError(t("error.config.not.found"));
  }

  let targetConfig: CliConfig;

  if (isGlobal) {
    const globalConfigPath = await getConfigFilepath(true);
    const existingGlobalConfig = await readConfigAtPath(globalConfigPath);

    if (!existingGlobalConfig) {
      throw new DevkitError(t("error.config.global.not.found"));
    }
    targetConfig = deepmerge({}, existingGlobalConfig);
  } else {
    if (source === "global") {
      throw new DevkitError(t("error.config.local.not.found"));
    }
    targetConfig = deepmerge({}, config);
  }

  return targetConfig;
}

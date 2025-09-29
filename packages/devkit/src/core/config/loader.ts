import deepmerge from "deepmerge";
import fs from "#utils/fs/file.js";
import {
  type CliConfig,
  defaultCliConfig,
  type ConfigurationSource,
  type ReadConfigOptions,
} from "#utils/schema/schema.js";
import { findConfigPaths } from "./finder.js";

async function readAndMergeSingleConfig(
  currentConfig: CliConfig,
  path: string,
): Promise<CliConfig> {
  if (path && (await fs.pathExists(path))) {
    try {
      const foundConfig = await fs.readJson(path);
      return deepmerge(currentConfig, foundConfig, {
        arrayMerge: (_, sourceArray) => sourceArray,
      });
    } catch (e: unknown) {
      console.error(
        `Warning: Failed to parse configuration file at "${path}". The file may be invalid.`,
        (e as Error).cause,
      );
    }
  }
  return currentConfig;
}

export async function readAndMergeConfigs(
  options: ReadConfigOptions = {},
): Promise<{ config: CliConfig; source: ConfigurationSource }> {
  const { primary, secondary, source, configFound } =
    await findConfigPaths(options);

  let finalConfig: CliConfig = {} as CliConfig;

  if (configFound) {
    finalConfig = await readAndMergeSingleConfig(
      structuredClone(finalConfig),
      primary || "",
    );
    if (secondary) {
      finalConfig = await readAndMergeSingleConfig(
        structuredClone(finalConfig),
        secondary,
      );
    }
  }

  if (!configFound && options.useFallback) {
    finalConfig = deepmerge(structuredClone(defaultCliConfig), finalConfig);
  }

  return { config: finalConfig, source };
}

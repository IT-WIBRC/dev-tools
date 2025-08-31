import {
  PackageManagers,
  type PackageManager,
  type CacheStrategy,
  VALID_CACHE_STRATEGIES,
  TextLanguages,
  type TextLanguageValues,
  type CliConfig,
} from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import { DevkitError } from "#utils/errors/base.js";

export function validateConfigValue(key: string, value: unknown): void {
  if (key === "defaultPackageManager") {
    const validPackageManagers = Object.values(PackageManagers);
    if (!validPackageManagers.includes(value as PackageManager)) {
      throw new DevkitError(
        t("error.invalid.value", {
          key,
          options: validPackageManagers.join(", "),
        }),
      );
    }
  } else if (key === "cacheStrategy") {
    const validStrategies = VALID_CACHE_STRATEGIES;
    if (!validStrategies.includes(value as CacheStrategy)) {
      throw new DevkitError(
        t("error.invalid.value", {
          key,
          options: validStrategies.join(", "),
        }),
      );
    }
  } else if (key === "language") {
    const validLanguages = Object.values(TextLanguages);
    if (!validLanguages.includes(value as TextLanguageValues)) {
      throw new DevkitError(
        t("error.invalid.value", {
          key,
          options: validLanguages.join(", "),
        }),
      );
    }
  }
}

export const configAliases: Record<string, keyof CliConfig["settings"]> = {
  pm: "defaultPackageManager",
  packageManager: "defaultPackageManager",
  cache: "cacheStrategy",
  cacheStrategy: "cacheStrategy",
  language: "language",
  lg: "language",
};

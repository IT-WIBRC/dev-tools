import {
  PackageManagers,
  type PackageManager,
  type CacheStrategy,
  VALID_CACHE_STRATEGIES,
  TextLanguages,
  type TextLanguageValues,
  ProgrammingLanguage,
  type SupportedProgrammingLanguageValues,
  type SupportedPackageManager,
} from "#utils/configs/schema.js";
import { DevkitError } from "#utils/errors/base.js";
import { t } from "#utils/internationalization/i18n.js";

export function validatePackageManager(
  value: string,
): asserts value is SupportedPackageManager {
  const validPackageManagers = Object.values(PackageManagers);
  if (!validPackageManagers.includes(value as PackageManager)) {
    throw new DevkitError(
      t("error.invalid.value", {
        key: "defaultPackageManager",
        options: validPackageManagers.join(", "),
      }),
    );
  }
}

export function validateCacheStrategy(
  value: string,
): asserts value is CacheStrategy {
  const validStrategies = VALID_CACHE_STRATEGIES;
  if (!validStrategies.includes(value as CacheStrategy)) {
    throw new DevkitError(
      t("error.invalid.value", {
        key: "cacheStrategy",
        options: validStrategies.join(", "),
      }),
    );
  }
}

export function validateLanguage(
  value: string,
): asserts value is TextLanguageValues {
  const validLanguages = Object.values(TextLanguages);
  if (!validLanguages.includes(value as TextLanguageValues)) {
    throw new DevkitError(
      t("error.invalid.value", {
        key: "language",
        options: validLanguages.join(", "),
      }),
    );
  }
}

export function validateProgrammingLanguage(
  value: string,
): asserts value is SupportedProgrammingLanguageValues {
  const validLanguages = Object.values(ProgrammingLanguage).map((value) =>
    value.toLowerCase(),
  );
  if (!validLanguages.includes(value as SupportedProgrammingLanguageValues)) {
    throw new DevkitError(
      t("error.invalid.value", {
        key: "language",
        options: validLanguages.join(", "),
      }),
    );
  }
}

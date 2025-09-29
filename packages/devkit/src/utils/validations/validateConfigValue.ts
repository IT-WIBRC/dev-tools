import { configAliases } from "./configAliases.js";
import {
  validatePackageManager,
  validateCacheStrategy,
  validateLanguage,
} from "./config.js";
import { DevkitError } from "#utils/errors/base.js";
import { t } from "#utils/i18n/translator.js";

export function validateConfigValue(key: string, value: string): void {
  const resolvedKey = configAliases[key];

  if (!resolvedKey) {
    throw new DevkitError(
      t("error.invalid.key", {
        key,
        keys: Object.keys(configAliases).join(", "),
      }),
    );
  }

  switch (resolvedKey) {
    case "defaultPackageManager":
      validatePackageManager(value);
      break;
    case "cacheStrategy":
      validateCacheStrategy(value);
      break;
    case "language":
      validateLanguage(value);
      break;
    default:
      break;
  }
}

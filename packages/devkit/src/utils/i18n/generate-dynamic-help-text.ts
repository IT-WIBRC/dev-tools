import { t } from "#utils/i18n/translator.js";
import {
  VALID_CACHE_STRATEGIES,
  VALID_PACKAGE_MANAGERS,
  SUPPORTED_LANGUAGES,
  ProgrammingLanguage,
  ProgrammingLanguageAlias,
  DisplayModes,
} from "#utils/schema/schema.js";

const CONSTRAINED_VALUES_MAP = {
  cacheStrategy: VALID_CACHE_STRATEGIES,
  packageManager: VALID_PACKAGE_MANAGERS,
  language: SUPPORTED_LANGUAGES,
  supportedLanguage: Object.values(ProgrammingLanguage)
    .map((v) => v.toLowerCase())
    .concat(...Object.keys(ProgrammingLanguageAlias)),
  mode: Object.values(DisplayModes).map((v) => v.toLowerCase()),
} as const;

type ConstrainedKey = keyof typeof CONSTRAINED_VALUES_MAP;

export function generateDynamicHelpText(
  key: ConstrainedKey,
  i18nKey: Parameters<typeof t>[0],
): string {
  const values = CONSTRAINED_VALUES_MAP[key];

  const valueList = values
    .map((v) => (typeof v === "string" ? v : String(v)))
    .map((v) => `\`${v}\``)
    .join(", ");

  return t(i18nKey, { options: valueList });
}

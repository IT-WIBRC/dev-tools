import { t } from "#utils/i18n/translator";
import { logger } from "#utils/logger.js";
import {
  type TemplateConfig,
  type LanguageConfig,
} from "#utils/schema/schema.js";

type TemplateMap = LanguageConfig["templates"];
type TemplateEntry = [string, TemplateConfig];

/**
 * @const {object} FILTER_SYMBOLS - Reserved symbols used for presence/absence checks.
 */
export const FILTER_SYMBOLS = {
  PRESENT: "*",
  MISSING: "~",
  REGEX_START: "/",
  REGEX_END: "/",
} as const;

/**
 * @const {object} FILTER_DELIMITERS - Supported characters for separating property from value.
 */
export const FILTER_DELIMITERS = {
  COLON: ":",
  EQUALS: "=",
} as const;

const PROPERTY_KEY_MAP: Record<string, keyof TemplateConfig | "name"> = {
  name: "name",
  alias: "alias",
  desc: "description",
  description: "description",
  pm: "packageManager",
  packageManager: "packageManager",
  cache: "cacheStrategy",
  cacheStrategy: "cacheStrategy",
  loc: "location",
  location: "location",
};

function findDelimiterIndex(clause: string): number {
  const colonIndex = clause.indexOf(FILTER_DELIMITERS.COLON);
  const equalsIndex = clause.indexOf(FILTER_DELIMITERS.EQUALS);

  if (colonIndex > -1 && (equalsIndex === -1 || colonIndex < equalsIndex)) {
    return colonIndex;
  }
  if (equalsIndex > -1) {
    return equalsIndex;
  }
  return -1;
}

export const filterTemplatesByWhereClause = (
  templates: TemplateMap,
  whereClauses: string[],
): TemplateEntry[] => {
  if (!whereClauses || whereClauses.length === 0) {
    return Object.entries(templates);
  }

  const parsedFilters = whereClauses
    .map((clause) => {
      const delimiterIndex = findDelimiterIndex(clause);

      if (delimiterIndex === -1) {
        logger.warning(
          t("warnings.filter_delimiter_missing", {
            delimiter1: FILTER_DELIMITERS.COLON,
            delimiter2: FILTER_DELIMITERS.EQUALS,
            clause: clause,
          }),
        );
        return null;
      }

      const propKey = clause.substring(0, delimiterIndex).trim();
      const value = clause.substring(delimiterIndex + 1).trim();

      const templateProp = PROPERTY_KEY_MAP[propKey.toLowerCase()];

      if (!templateProp) {
        logger.warning(
          t("warnings.filter_property_unrecognized", {
            property: propKey,
          }),
        );
        return null;
      }

      const isRegex =
        value.startsWith(FILTER_SYMBOLS.REGEX_START) &&
        value.endsWith(FILTER_SYMBOLS.REGEX_END) &&
        value.length > 1;

      let regex: RegExp | undefined;

      if (isRegex) {
        const pattern = value.substring(1, value.length - 1);
        try {
          regex = new RegExp(pattern, "i");
        } catch (e) {
          logger.error(
            t("errors.validation.template_name_required", {
              clause: clause,
              error: (e as Error).message,
            }),
          );
          return null;
        }
      }

      const processedValue = isRegex ? value : value.toLowerCase();

      return { templateProp, value: processedValue, isRegex, regex };
    })
    .filter((filter): filter is NonNullable<typeof filter> => filter !== null);

  if (parsedFilters.length === 0) {
    return Object.entries(templates);
  }

  return Object.entries(templates).filter(([templateName, templateConfig]) => {
    return parsedFilters.every(
      ({ templateProp, value: filterValue, isRegex, regex }) => {
        let templateValue: string | undefined;

        if (templateProp === "name") {
          templateValue = templateName;
        } else {
          templateValue = templateConfig[templateProp] ?? undefined;
        }

        const isPresent = !!templateValue && templateValue.length > 0;

        if (!isRegex && filterValue === FILTER_SYMBOLS.PRESENT) {
          return isPresent;
        }
        if (!isRegex && filterValue === FILTER_SYMBOLS.MISSING) {
          return !isPresent;
        }

        if (!isPresent) {
          return false;
        }

        if (isRegex && regex) {
          return regex.test(templateValue!);
        }

        return templateValue!.toLowerCase().includes(filterValue as string);
      },
    );
  });
};

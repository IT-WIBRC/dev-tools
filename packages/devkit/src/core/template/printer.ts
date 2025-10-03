import { t } from "#utils/i18n/translator.js";
import {
  type CliConfig,
  type DisplayModesValues,
} from "#utils/schema/schema.js";
import { logger } from "#utils/logger.js";
import { filterTemplatesByWhereClause } from "./filter.js";
import { type AnnotatedTemplate } from "./annotator.js";

function getSourceTag(source: AnnotatedTemplate["_source"]): string {
  const dim = logger.colors.dim;
  switch (source) {
    case "local":
      return logger.colors.blue("(local)");
    case "global":
      return logger.colors.magenta("(global)");
    case "default":
      return dim("(default)");
    default:
      return "";
  }
}

export function printTemplatesTree(templates: AnnotatedTemplate[]): void {
  if (templates.length === 0) return;

  const language = templates[0]._language;
  const languageFormatted =
    language.charAt(0).toUpperCase() + language.slice(1).toLowerCase();

  logger.log(`\n${logger.colors.boldBlue(languageFormatted)}:`);

  templates.forEach((templateConfig) => {
    const dim = logger.colors.dim;
    const cyanDim = logger.colors.cyanDim;

    const sourceTag = getSourceTag(templateConfig._source);

    const alias = templateConfig?.alias
      ? cyanDim(
          `(${t("commands.template.add.options.alias")}: ${templateConfig.alias})`,
        )
      : "";

    const description = templateConfig?.description
      ? `\n    ${dim(t("commands.template.add.options.description"))}: ${templateConfig.description}`
      : "";
    const location = templateConfig?.location
      ? `\n    ${dim("Location")}: ${templateConfig.location}`
      : "";
    const cacheStrategy = templateConfig?.cacheStrategy
      ? `\n    ${dim(t("commands.template.add.options.cache"))}: ${templateConfig.cacheStrategy}`
      : "";
    const packageManager = templateConfig?.packageManager
      ? `\n    ${dim(t("commands.template.add.options.package_manager"))}: ${templateConfig.packageManager}`
      : "";

    const coloredName = logger.colors.green(templateConfig._name);

    logger.log(
      ` - ${coloredName} ${sourceTag} ${alias}${description}${location}${cacheStrategy}${packageManager}\n`,
    );
  });
}

function printTemplatesTable(
  templates: AnnotatedTemplate[],
  whereClauses: string[],
): void {
  const tableData: string[][] = [];
  const languageHeader = logger.colors.bold("Language");
  const nameHeader = logger.colors.bold("Name");
  const aliasHeader = logger.colors.bold("Alias");
  const sourceHeader = logger.colors.bold("Source");
  const descriptionHeader = logger.colors.bold("Description");
  const locationHeader = logger.colors.bold("Location");

  tableData.push([
    languageHeader,
    nameHeader,
    aliasHeader,
    sourceHeader,
    descriptionHeader,
    locationHeader,
  ]);

  templates.forEach((templateConfig) => {
    const row = [
      logger.colors.boldBlue(
        templateConfig._language.charAt(0).toUpperCase() +
          templateConfig._language.slice(1),
      ),
      logger.colors.green(templateConfig._name),
      templateConfig.alias || logger.colors.dim("N/A"),
      getSourceTag(templateConfig._source),
      templateConfig.description || logger.colors.dim("N/A"),
      templateConfig.location || logger.colors.dim("N/A"),
    ];
    tableData.push(row);
  });

  if (tableData.length > 1) {
    logger.table(tableData);
    return;
  }

  const messageKey =
    whereClauses.length > 0
      ? "warnings.template.not_found_with_filter"
      : "warnings.template.not_found";

  logger.warning(t(messageKey));
}

export function printTemplates(
  templatesList: AnnotatedTemplate[],
  whereClauses: string[] = [],
  mode: DisplayModesValues = "tree",
): void {
  if (templatesList.length === 0) {
    const messageKey =
      whereClauses.length > 0
        ? "warnings.template.not_found_with_filter"
        : "warnings.template.not_found";
    logger.warning(t(messageKey));
    return;
  }

  const finalFilteredList: AnnotatedTemplate[] = templatesList.filter(
    (template) => {
      const templateMap = { [template._name]: template };
      return filterTemplatesByWhereClause(templateMap, whereClauses).length > 0;
    },
  );

  if (finalFilteredList.length === 0) {
    const messageKey =
      whereClauses.length > 0
        ? "warnings.template.not_found_with_filter"
        : "warnings.template.not_found";
    logger.warning(t(messageKey));
    return;
  }

  const finalTemplatesByLanguage = finalFilteredList.reduce(
    (acc, template) => {
      const lang = template._language;
      if (!acc[lang]) {
        acc[lang] = [];
      }
      acc[lang].push(template);
      return acc;
    },
    {} as Record<string, AnnotatedTemplate[]>,
  );

  if (mode === "table") {
    printTemplatesTable(finalFilteredList, whereClauses);
    return;
  }

  Object.entries(finalTemplatesByLanguage).forEach(([_, templates]) => {
    printTemplatesTree(templates);
  });
}

export function printSettings(settings: CliConfig["settings"]): void {
  Object.entries(settings).forEach(([key, value]) => {
    const keyString = logger.colors.yellowBold(`  ${key}:`);
    const valueString = logger.colors.cyan(value);
    logger.log(`${keyString} ${valueString}`);
  });
}

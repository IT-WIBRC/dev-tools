import { t } from "#utils/i18n/translator.js";
import {
  type CliConfig,
  type DisplayModesValues,
  type LanguageConfig,
} from "#utils/schema/schema.js";
import { logger } from "#utils/logger.js";
import { filterTemplatesByWhereClause } from "./filter.js";

type TemplateMap = LanguageConfig["templates"];
export type TemplateList = [string, TemplateMap];

export function printTemplatesTree(
  language: string,
  templates: TemplateMap,
  whereClauses: string[],
): void {
  const filteredTemplates = filterTemplatesByWhereClause(
    templates,
    whereClauses,
  );

  if (filteredTemplates.length === 0) return;

  logger.log(`\n${logger.colors.boldBlue(language.toUpperCase())}:`);

  filteredTemplates.forEach(([templateName, templateConfig]) => {
    const dim = logger.colors.dim;
    const cyanDim = logger.colors.cyanDim;

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

    const coloredName = logger.colors.green(templateName);

    logger.log(
      ` - ${coloredName} ${alias}${description}${location}${cacheStrategy}${packageManager}\n`,
    );
  });
}

function printTemplatesTable(
  templatesList: TemplateList[],
  whereClauses: string[],
): void {
  const tableData: string[][] = [];
  const languageHeader = logger.colors.bold("Language");
  const nameHeader = logger.colors.bold("Name");
  const aliasHeader = logger.colors.bold("Alias");
  const descriptionHeader = logger.colors.bold("Description");
  const locationHeader = logger.colors.bold("Location");

  tableData.push([
    languageHeader,
    nameHeader,
    aliasHeader,
    descriptionHeader,
    locationHeader,
  ]);

  templatesList.forEach(([lang, templates]) => {
    const filteredTemplates = filterTemplatesByWhereClause(
      templates,
      whereClauses,
    );

    filteredTemplates.forEach(([templateName, templateConfig]) => {
      const row = [
        logger.colors.boldBlue(lang.charAt(0).toUpperCase() + lang.slice(1)),
        logger.colors.green(templateName),
        templateConfig.alias || logger.colors.dim("N/A"),
        templateConfig.description || logger.colors.dim("N/A"),
        templateConfig.location || logger.colors.dim("N/A"),
      ];
      tableData.push(row);
    });
  });

  if (tableData.length > 1) {
    logger.table(tableData);
    return;
  }

  const messageKey =
    whereClauses.length > 0
      ? "warnings.template_not_found_with_filter"
      : "warnings.template_not_found";

  logger.warning(t(messageKey));
}

export function printTemplates(
  templatesList: TemplateList[],
  whereClauses: string[] = [],
  mode: DisplayModesValues = "tree",
): void {
  if (mode === "table") {
    printTemplatesTable(templatesList, whereClauses);
    return;
  }

  templatesList.forEach(([lang, templates]) => {
    printTemplatesTree(lang, templates, whereClauses);
  });
}

export function printSettings(settings: CliConfig["settings"]): void {
  Object.entries(settings).forEach(([key, value]) => {
    const keyString = logger.colors.yellowBold(`  ${key}:`);
    const valueString = logger.colors.cyan(value);
    logger.log(`${keyString} ${valueString}`);
  });
}

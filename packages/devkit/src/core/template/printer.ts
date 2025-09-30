import { t } from "#utils/i18n/translator.js";
import { type CliConfig, type LanguageConfig } from "#utils/schema/schema.js";
import { logger } from "#utils/logger.js";

type TemplateMap = LanguageConfig["templates"];

export function printTemplates(
  language: string,
  templates: TemplateMap,
  filter?: string,
): void {
  let filteredTemplates = Object.entries(templates);
  if (filter) {
    filteredTemplates = filteredTemplates.filter(
      ([templateName, templateConfig]) => {
        const name = templateName.toLowerCase();
        const alias = templateConfig?.alias?.toLowerCase() ?? "";
        return (
          name.includes(filter.toLowerCase()) ||
          alias.includes(filter.toLowerCase())
        );
      },
    );
  }

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

export function printSettings(settings: CliConfig["settings"]): void {
  Object.entries(settings).forEach(([key, value]) => {
    const keyString = logger.colors.yellowBold(`  ${key}:`);
    const valueString = logger.colors.cyan(value);
    logger.log(`${keyString} ${valueString}`);
  });
}

import chalk from "chalk";
import { t } from "#utils/internationalization/i18n.js";
import { type CliConfig, type LanguageConfig } from "#utils/configs/schema.js";

type TemplateMap = LanguageConfig["templates"];

export function printTemplates(
  language: string,
  templates: TemplateMap,
  filter?: string,
): void {
  const filteredTemplates = Object.entries(templates).filter(
    ([templateName, templateConfig]) => {
      if (!filter) return true;
      const name = templateName.toLowerCase();
      const alias = templateConfig?.alias?.toLowerCase() ?? "";
      return (
        name.includes(filter.toLowerCase()) ||
        alias.includes(filter.toLowerCase())
      );
    },
  );

  if (filteredTemplates.length === 0) return;

  console.log(`\n${chalk.blue.bold(language.toUpperCase())}:`);

  filteredTemplates.forEach(([templateName, templateConfig]) => {
    const alias = templateConfig?.alias
      ? chalk.cyan.dim(
          `(${t("cli.add_template.options.alias")}: ${templateConfig.alias})`,
        )
      : "";
    const description = templateConfig?.description
      ? `\n    ${chalk.dim(t("cli.add_template.options.description"))}: ${templateConfig.description}`
      : "";
    const location = templateConfig?.location
      ? `\n    ${chalk.dim("Location:")} ${templateConfig.location}`
      : "";
    const cacheStrategy = templateConfig?.cacheStrategy
      ? `\n    ${chalk.dim(t("cli.add_template.options.cache"))}: ${templateConfig.cacheStrategy}`
      : "";
    const packageManager = templateConfig?.packageManager
      ? `\n    ${chalk.dim(t("cli.add_template.options.package_manager"))}: ${templateConfig.packageManager}`
      : "";

    console.log(
      ` - ${chalk.green(templateName)} ${alias}${description}${location}${cacheStrategy}${packageManager}\n`,
    );
  });
}

export function printSettings(settings: CliConfig["settings"]): void {
  Object.entries(settings).forEach(([key, value]) => {
    console.log(`${chalk.bold.yellow(`  ${key}:`)} ${chalk.cyan(value)}`);
  });
}

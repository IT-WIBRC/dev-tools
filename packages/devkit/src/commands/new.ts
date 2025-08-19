import { type SetupCommandOptions } from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";

export function setupNewCommand(options: SetupCommandOptions) {
  const { program, config } = options;
  const newCommand = program
    .command("new")
    .alias("nw")
    .description(t("new.command.description"));

  for (const [language, langConfig] of Object.entries(config.templates)) {
    for (const [templateName, templateConfig] of Object.entries(
      langConfig.templates,
    )) {
      newCommand
        .command(templateName)
        .alias(templateConfig.alias || "")
        .description(
          t("new.project.description", {
            language: language,
            template: templateName,
            description: templateConfig.description,
          }),
        )
        .argument("<projectName>", t("new.project.name.argument"))
        .action(async (projectName) => {
          const { scaffoldProject } = await import(
            `@scaffolding/${language}.js`
          );
          await scaffoldProject({
            projectName,
            templateConfig,
            packageManager:
              templateConfig.packageManager ||
              config.settings.defaultPackageManager,
            cacheStrategy:
              templateConfig.cacheStrategy ||
              config.settings.cacheStrategy ||
              "daily",
          });
        });
    }
  }
}

import { type SetupCommandOptions } from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import { DevkitError } from "#utils/errors/base.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import ora from "ora";

export function setupNewCommand(options: SetupCommandOptions) {
  const { program, config } = options;
  program
    .command("new")
    .alias("nw")
    .description(t("new.command.description"))
    .argument("<language>", t("new.project.language.argument"))
    .argument("<projectName>", t("new.project.name.argument"))
    .option(
      "-t, --template <string>",
      t("new.project.template.option.description"),
    )
    .action(async (language, projectName, cmdOptions) => {
      const { template } = cmdOptions;
      const scaffoldSpinner = ora(
        t("new.project.scaffolding", { projectName }),
      );

      try {
        const languageTemplates = config.templates[language];
        if (!languageTemplates) {
          throw new DevkitError(
            t("error.language_config_not_found", { language }),
          );
        }

        let templateConfig = languageTemplates.templates[template];

        if (!templateConfig) {
          const foundTemplateName = Object.keys(
            languageTemplates.templates,
          ).find((key) => languageTemplates.templates[key]?.alias === template);
          if (foundTemplateName) {
            templateConfig = languageTemplates.templates[foundTemplateName];
          }
        }

        if (!templateConfig) {
          throw new DevkitError(t("error.template.not_found", { template }));
        }

        const { scaffoldProject } = await import(`#scaffolding/${language}.js`);
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
      } catch (error) {
        handleErrorAndExit(error, scaffoldSpinner);
      }
    });
}

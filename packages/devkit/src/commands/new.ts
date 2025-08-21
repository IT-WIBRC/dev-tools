import {
  type SetupCommandOptions,
  type TemplateConfig,
} from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import { DevkitError } from "#utils/errors/base.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import ora from "ora";
import chalk from "chalk";

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
        chalk.cyan(
          t("new.project.scaffolding", {
            projectName,
            template: template || "default",
          }),
        ),
      ).start();

      try {
        const languageTemplates = config.templates[language];
        if (!languageTemplates) {
          throw new DevkitError(
            t("error.language_config_not_found", { language }),
          );
        }

        let templateConfig: TemplateConfig | undefined;

        if (template) {
          templateConfig = languageTemplates.templates[template];

          if (!templateConfig) {
            templateConfig = Object.values(languageTemplates.templates).find(
              (t) => t.alias === template,
            );
          }
        }

        if (!templateConfig) {
          if (languageTemplates.templates.default) {
            templateConfig = languageTemplates.templates.default;
          } else {
            throw new DevkitError(
              t("error.template.not_found", { template: template || "N/A" }),
            );
          }
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

        scaffoldSpinner.succeed(
          chalk.green(t("new.project.success", { projectName })),
        );
      } catch (error) {
        handleErrorAndExit(error, scaffoldSpinner);
      }
    });
}

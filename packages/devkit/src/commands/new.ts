import { type SetupCommandOptions } from "#utils/configs/schema.js";
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
    .requiredOption(
      "-t, --template <string>",
      t("new.project.template.option.description"),
    )
    .action(async (language, projectName, cmdOptions) => {
      const { template } = cmdOptions;
      const scaffoldSpinner = ora(
        chalk.cyan(
          t("new.project.scaffolding", {
            projectName,
            template: template,
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

        const templateConfig =
          languageTemplates.templates[template] ||
          Object.values(languageTemplates.templates).find(
            (t) => t.alias === template,
          );

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

        scaffoldSpinner.succeed(
          chalk.green(t("new.project.success", { projectName })),
        );
      } catch (error) {
        handleErrorAndExit(error, scaffoldSpinner);
      }
    });
}

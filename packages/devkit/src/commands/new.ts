import { type SetupCommandOptions } from "#utils/schema/schema.js";
import { t } from "#utils/i18n/translator.js";
import { DevkitError } from "#utils/errors/base.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { logger, type TSpinner } from "#utils/logger.js";
import { validateProgrammingLanguage } from "#utils/validations/config.js";
import { getMergedConfig } from "#core/config/merger.js";
import { mapLanguageAliasToCanonicalKey } from "#core/config/language.js";
import { generateDynamicHelpText } from "#utils/i18n/generate-dynamic-help-text.js";

const getScaffolder = async (language: string) => {
  if (["javascript", "typescript", "nodejs"].includes(language)) {
    const { scaffoldProject } = await import("#scaffolding/javascript.js");
    return scaffoldProject;
  }
  throw new DevkitError(
    t("errors.scaffolding.language_not_found", { language }),
  );
};

export function setupNewCommand(options: SetupCommandOptions) {
  const { program } = options;
  program
    .command("new")
    .alias("nw")
    .description(t("commands.new.command.description"))
    .argument(
      "<language>",
      generateDynamicHelpText(
        "language",
        "commands.new.project.language.argument",
      ),
    )
    .argument("<projectName>", t("commands.new.project.name.argument"))
    .requiredOption(
      "-t, --template <string>",
      t("commands.new.project.template.option.description"),
    )
    .action(async (language, projectName, cmdOptions) => {
      const { template } = cmdOptions;

      const scaffoldSpinner: TSpinner = logger
        .spinner(
          logger.colors.cyan(
            t("messages.status.scaffolding_project", {
              projectName,
              template: template,
            }),
          ),
        )
        .start();

      try {
        language = mapLanguageAliasToCanonicalKey(language);
        validateProgrammingLanguage(language);

        const config = await getMergedConfig(true);
        const languageTemplates = config.templates[language];
        if (!languageTemplates) {
          throw new DevkitError(
            t("errors.scaffolding.language_not_found", { language }),
          );
        }

        const templateConfig =
          languageTemplates.templates[template] ||
          Object.values(languageTemplates.templates).find(
            (t) => t.alias === template,
          );

        if (!templateConfig) {
          throw new DevkitError(t("errors.template.not_found", { template }));
        }

        const scaffoldAppropriateProject = await getScaffolder(language);
        scaffoldSpinner.stop();

        await scaffoldAppropriateProject({
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
          logger.colors.green(
            t("messages.success.new_project", { projectName }),
          ),
        );
      } catch (error) {
        handleErrorAndExit(error, scaffoldSpinner);
      }
    });
}

import { type SetupCommandOptions } from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import { DevkitError } from "#utils/errors/base.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import ora from "ora";
import { getConfigFilepath } from "#utils/configs/path-finder.js";
import { readConfigAtPath } from "#utils/configs/reader.js";
import { saveGlobalConfig, saveLocalConfig } from "#utils/configs/writer.js";

export function setupRemoveTemplateCommand(options: SetupCommandOptions) {
  const { program, config, source } = options;
  program
    .command("remove-template")
    .alias("rt")
    .description(t("remove_template.command.description"))
    .argument("<language>", t("remove_template.language.argument"))
    .argument("<templateName>", t("remove_template.name.argument"))
    .option("-g, --global", t("remove_template.option.global"), false)
    .action(async (language, templateName, commandOptions) => {
      const { global: isGlobal } = commandOptions;

      const spinner = ora(t("remove_template.start")).start();

      let targetConfig: typeof config;

      try {
        if (source === "default") {
          throw new DevkitError(t("error.config.no_file_found"));
        }

        if (isGlobal) {
          if (source === "global") {
            targetConfig = config;
          } else {
            const globalConfigPath = await getConfigFilepath(true);
            const globalConfig = await readConfigAtPath(globalConfigPath);
            if (!globalConfig) {
              throw new DevkitError(t("error.config.global.not.found"));
            }
            targetConfig = globalConfig;
          }
        } else {
          if (source !== "local") {
            throw new DevkitError(t("error.config.local.not.found"));
          }
          targetConfig = config;
        }

        const languageTemplates = targetConfig.templates[language];
        if (!languageTemplates) {
          throw new DevkitError(
            t("error.language_config_not_found", { language }),
          );
        }

        let templateToRemove = templateName;
        let templateConfig = languageTemplates.templates[templateToRemove];

        if (!templateConfig) {
          const foundTemplateName = Object.keys(
            languageTemplates.templates,
          ).find(
            (key) => languageTemplates.templates[key]?.alias === templateName,
          );

          if (foundTemplateName) {
            templateToRemove = foundTemplateName;
            templateConfig = languageTemplates.templates[foundTemplateName];
          }
        }

        if (!templateConfig) {
          throw new DevkitError(
            t("error.template.not_found", { template: templateName }),
          );
        }

        const updatedTemplates = { ...languageTemplates.templates };
        const { [templateToRemove]: _, ...restOfTemplates } = updatedTemplates;

        languageTemplates.templates = restOfTemplates;

        if (isGlobal) {
          await saveGlobalConfig(targetConfig);
        } else {
          await saveLocalConfig(targetConfig);
        }

        spinner.succeed(
          t("remove_template.success", { templateName, language }),
        );
      } catch (error) {
        handleErrorAndExit(error, spinner);
      }
    });
}

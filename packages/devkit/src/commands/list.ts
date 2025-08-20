import { type SetupCommandOptions } from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { DevkitError } from "#utils/errors/base.js";
import ora from "ora";
import chalk from "chalk";

export function setupListCommand(options: SetupCommandOptions) {
  const { program, config } = options;
  program
    .command("list")
    .alias("ls")
    .description(t("list.command.description"))
    .argument("[language]", t("list.command.language.argument"), "")
    .action(async (language) => {
      const spinner = ora(t("list.templates.loading")).start();

      try {
        const templates = config.templates;
        if (Object.keys(templates).length === 0) {
          spinner.info(chalk.yellow(t("list.templates.not_found")));
          return;
        }

        spinner.stop();
        console.log("\n", chalk.bold(t("list.templates.header")));

        if (language) {
          const languageTemplates = templates[language];
          if (!languageTemplates) {
            throw new DevkitError(
              t("error.language_config_not_found", { language }),
            );
          }

          console.log(`\n${chalk.blue.bold(language.toUpperCase())}:`);
          for (const [templateName, templateConfig] of Object.entries(
            languageTemplates.templates,
          )) {
            const description = templateConfig.description
              ? `- ${templateConfig.description}`
              : "";
            console.log(`  - ${chalk.green(templateName)} ${description}`);
          }
        } else {
          for (const [lang, langTemplates] of Object.entries(templates)) {
            console.log(`\n${chalk.blue.bold(lang.toUpperCase())}:`);
            for (const [templateName, templateConfig] of Object.entries(
              langTemplates.templates,
            )) {
              const description = templateConfig.description
                ? `- ${templateConfig.description}`
                : "";
              console.log(`  - ${chalk.green(templateName)} ${description}`);
            }
          }
        }
      } catch (error) {
        handleErrorAndExit(error, spinner);
      }
    });
}

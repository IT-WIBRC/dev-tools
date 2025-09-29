import { t } from "#utils/i18n/translator.js";
import { DevkitError } from "#utils/errors/base.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import ora from "ora";
import { readAndMergeConfigs } from "#core/config/loader.js";
import { saveGlobalConfig, saveLocalConfig } from "#core/config/writer.js";
import chalk from "chalk";
import { type Command } from "commander";
import { type CliConfig } from "#utils/schema/schema.js";
import { type RemoveCommandOptions } from "./types.js";
import { validateProgrammingLanguage } from "#utils/validations/config.js";

async function saveConfig(
  targetConfig: CliConfig,
  isGlobal: boolean,
): Promise<void> {
  if (isGlobal) {
    await saveGlobalConfig(targetConfig);
  } else {
    await saveLocalConfig(targetConfig);
  }
}

export function setupRemoveCommand(configCommand: Command): void {
  configCommand
    .command("remove <language> <templateName...>")
    .alias("rm")
    .description(t("remove_template.command.description"))
    .action(
      async (
        language: string,
        templateNames: string[],
        _: RemoveCommandOptions,
        childCommand: Command,
      ) => {
        const parentOpts = childCommand?.parent?.opts();
        const isGlobal = !!parentOpts?.global;

        const spinner = ora().start(chalk.cyan(t("remove_template.start")));

        try {
          validateProgrammingLanguage(language);

          const { config: targetConfig } = await readAndMergeConfigs({
            forceGlobal: isGlobal,
          });

          const languageTemplates = targetConfig?.templates?.[language];
          if (!languageTemplates.templates) {
            throw new DevkitError(
              t("error.template.language_not_found", { language: language }),
            );
          }

          const templatesToRemove: string[] = [];
          const notFound: string[] = [];

          const templatesMap = Object.entries(
            languageTemplates.templates,
          ).reduce(
            (acc, [name, template]) => {
              acc[name] = name;
              if (template?.alias) {
                acc[template.alias] = name;
              }
              return acc;
            },
            {} as Record<string, string>,
          );

          for (const templateName of templateNames) {
            const actualName = templatesMap[templateName];
            if (actualName) {
              templatesToRemove.push(actualName);
            } else {
              notFound.push(templateName);
            }
          }

          if (templatesToRemove.length === 0) {
            throw new DevkitError(
              t("error.template.not_found", { template: notFound.join(", ") }),
            );
          }

          const templatesToKeep = Object.fromEntries(
            Object.entries(languageTemplates?.templates || {}).filter(
              ([key]) => !templatesToRemove.includes(key),
            ),
          );

          languageTemplates.templates = templatesToKeep;

          await saveConfig(targetConfig, !!isGlobal);
          spinner.succeed(
            t("remove_template.success", {
              count: templatesToRemove.length.toString(),
              templateName: templatesToRemove.join(", "),
              language,
            }),
          );

          if (notFound.length > 0) {
            console.log(
              chalk.yellow(
                t("remove_template.not_found_warning", {
                  template: notFound.join(", "),
                }),
              ),
            );
          }
        } catch (error: unknown) {
          handleErrorAndExit(error as Error, spinner);
        }
      },
    );
}

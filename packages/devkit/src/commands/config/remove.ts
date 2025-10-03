import { t } from "#utils/i18n/translator.js";
import { DevkitError } from "#utils/errors/base.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { logger, type TSpinner } from "#utils/logger.js";
import { readConfigSources } from "#core/config/loader.js";
import { saveGlobalConfig, saveLocalConfig } from "#core/config/writer.js";
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

async function getTargetConfigForModification(
  isGlobal: boolean,
): Promise<CliConfig> {
  const sources = await readConfigSources({
    forceGlobal: isGlobal,
    forceLocal: !isGlobal,
  });

  const targetConfig = isGlobal ? sources.global : sources.local;

  if (!targetConfig) {
    if (isGlobal) {
      throw new DevkitError(t("errors.config.global_not_found"));
    } else {
      throw new DevkitError(t("errors.config.local_not_found"));
    }
  }

  return targetConfig;
}

export function setupRemoveCommand(configCommand: Command): void {
  configCommand
    .command("remove <language> <templateName...>")
    .alias("rm")
    .description(t("commands.template.remove.command.description"))
    .action(
      async (
        language: string,
        templateNames: string[],
        _: RemoveCommandOptions,
        childCommand: Command,
      ) => {
        const parentOpts = childCommand?.parent?.opts();
        const isGlobal = !!parentOpts?.global;

        const spinner: TSpinner = logger
          .spinner()
          .start(logger.colors.cyan(t("messages.status.template_removing")));

        try {
          validateProgrammingLanguage(language);

          const targetConfig = await getTargetConfigForModification(isGlobal);

          const languageTemplates = targetConfig?.templates?.[language];
          if (!languageTemplates?.templates) {
            throw new DevkitError(
              t("errors.template.language_not_found", { language: language }),
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
            if (notFound.length === templateNames.length) {
              throw new DevkitError(
                t("errors.template.not_found", {
                  template: notFound.join(", "),
                }),
              );
            }
          }

          const templatesToKeep = Object.fromEntries(
            Object.entries(languageTemplates?.templates || {}).filter(
              ([key]) => !templatesToRemove.includes(key),
            ),
          );

          languageTemplates.templates = templatesToKeep;

          await saveConfig(targetConfig, !!isGlobal);

          spinner.succeed(
            t("messages.success.template_removed", {
              count: templatesToRemove.length.toString(),
              templateName: templatesToRemove.join(", "),
              language,
            }),
          );

          if (notFound.length > 0) {
            logger.warning(
              logger.colors.yellow(
                t("warnings.template.list_not_found", {
                  templates: notFound.join(", "),
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

import {
  type LanguageConfig,
  type SetupCommandOptions,
} from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { DevkitError } from "#utils/errors/base.js";
import ora from "ora";
import chalk from "chalk";
import { readGlobalConfig, readLocalConfig } from "#utils/configs/reader.js";
import type { Ora } from "ora";

type ConfigsToDisplay = {
  templates: Record<string, LanguageConfig>;
}[];

async function getConfigsToDisplay(
  opts: Record<string, unknown>,
  spinner: Ora,
): Promise<ConfigsToDisplay> {
  const { global, local, all } = opts;
  const configs: ConfigsToDisplay = [];

  const addTemplates = (config: any) => {
    if (config) {
      configs.push({ templates: config.config.templates });
    }
  };

  const getAndAddLocalConfig = async () => {
    const localConfig = await readLocalConfig();
    addTemplates(localConfig);
    return localConfig;
  };

  const getAndAddGlobalConfig = async () => {
    const globalConfig = await readGlobalConfig();
    addTemplates(globalConfig);
    return globalConfig;
  };

  if (all) {
    await getAndAddLocalConfig();
    await getAndAddGlobalConfig();
  } else if (global) {
    const globalConfig = await getAndAddGlobalConfig();
    if (globalConfig) {
      spinner.info(t("list.templates.using_global")).start();
    }
  } else if (local) {
    const localConfig = await getAndAddLocalConfig();
    if (localConfig) {
      spinner.info(t("list.templates.using_local")).start();
    }
  } else {
    const localConfig = await getAndAddLocalConfig();
    if (!localConfig) {
      const globalConfig = await getAndAddGlobalConfig();
      if (globalConfig) {
        spinner.info(t("list.templates.using_global_fallback")).start();
      }
    }
  }
  return configs;
}

export function setupListCommand(options: SetupCommandOptions) {
  const { program } = options;
  program
    .command("list")
    .alias("ls")
    .description(t("list.command.description"))
    .argument("[language]", t("list.command.language.argument"), "")
    .option("-g, --global", t("list.command.global.option"))
    .option("-l, --local", t("list.command.local.option"))
    .option("-a, --all", t("list.command.all.option"))
    .action(async (language, opts) => {
      const spinner = ora(t("list.templates.loading")).start();
      try {
        const configsToDisplay = await getConfigsToDisplay(opts, spinner);

        const allTemplatesFound = configsToDisplay.some(
          (config) => Object.keys(config.templates).length > 0,
        );

        if (!allTemplatesFound) {
          spinner.succeed(chalk.yellow(t("list.templates.not_found")));
          return;
        }

        spinner.stop();
        console.log("\n", chalk.bold(t("list.templates.header")));

        if (language) {
          const foundTemplates = configsToDisplay.flatMap((configSource) =>
            Object.entries(configSource.templates)
              .filter(([lang]) => lang === language)
              .map(([_, langTemplates]) => langTemplates),
          );

          if (foundTemplates.length === 0) {
            throw new DevkitError(
              t("error.language_config_not_found", { language }),
            );
          }

          foundTemplates.forEach((langTemplates) => {
            printTemplates(language, langTemplates.templates);
          });
        } else {
          for (const configSource of configsToDisplay) {
            for (const [lang, langTemplates] of Object.entries(
              configSource.templates,
            )) {
              printTemplates(lang, (langTemplates as LanguageConfig).templates);
            }
          }
        }
      } catch (error) {
        handleErrorAndExit(error, spinner);
      }
    });
}

function printTemplates(
  language: string,
  templates: LanguageConfig["templates"],
) {
  console.log(`\n${chalk.blue.bold(language.toUpperCase())}:`);
  for (const [templateName, templateConfig] of Object.entries(templates)) {
    const alias = templateConfig.alias
      ? chalk.dim(`(alias: ${templateConfig.alias})`)
      : "";
    const description = templateConfig.description
      ? `\n    ${chalk.dim("Description:")} ${templateConfig.description}`
      : "";
    const location = templateConfig.location
      ? `\n    ${chalk.dim("Location:")} ${templateConfig.location}`
      : "";
    const cacheStrategy = templateConfig.cacheStrategy
      ? `\n    ${chalk.dim("Cache Strategy:")} ${templateConfig.cacheStrategy}`
      : "";

    console.log(
      ` - ${chalk.green(templateName)} ${alias}${description}${location}${cacheStrategy}\n`,
    );
  }
}

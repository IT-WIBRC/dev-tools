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

function printTemplates(
  language: string,
  templates: LanguageConfig["templates"],
  filter?: string,
) {
  console.log(`\n${chalk.blue.bold(language.toUpperCase())}:`);
  Object.entries(templates)
    .filter(([templateName, templateConfig]) => {
      if (!filter) return true;
      const name = templateName.toLowerCase();
      const alias = templateConfig.alias?.toLowerCase() ?? "";
      return (
        name.includes(filter.toLowerCase()) ||
        alias.includes(filter.toLowerCase())
      );
    })
    .forEach(([templateName, templateConfig]) => {
      const alias = templateConfig.alias
        ? chalk.dim(
            `(${t("cli.add_template.options.alias")}: ${templateConfig.alias})`,
          )
        : "";
      const description = templateConfig.description
        ? `\n    ${chalk.dim(
            `${t("cli.add_template.options.description")}:`,
          )} ${templateConfig.description}`
        : "";
      const location = templateConfig.location
        ? `\n    ${chalk.dim("Location:")} ${templateConfig.location}`
        : "";
      const cacheStrategy = templateConfig.cacheStrategy
        ? `\n    ${chalk.dim(`${t("cli.add_template.options.cache")}:`)} ${templateConfig.cacheStrategy}`
        : "";
      const packageManager = templateConfig.packageManager
        ? `\n    ${chalk.dim(
            `${t("cli.add_template.options.package_manager")}:`,
          )} ${templateConfig.packageManager}`
        : "";

      console.log(
        ` - ${chalk.green(templateName)} ${alias}${description}${location}${cacheStrategy}${packageManager}\n`,
      );
    });
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
    .option("-f, --filter <string>", t("list.command.filter.option"))
    .action(async (language, opts) => {
      const spinner = ora(t("list.templates.loading")).start();
      try {
        const configsToDisplay = await getConfigsToDisplay(opts, spinner);

        if (
          !configsToDisplay.some(
            (config) => Object.keys(config.templates).length > 0,
          )
        ) {
          spinner.succeed(chalk.yellow(t("list.templates.not_found")));
          return;
        }

        spinner.stop();
        console.log("\n", chalk.bold(t("list.templates.header")));

        const displayMode = opts.all
          ? "all"
          : opts.global
            ? "global"
            : opts.local
              ? "local"
              : language
                ? "language"
                : "default";

        const displayActions: Record<string, () => void> = {
          all: () => {
            configsToDisplay.forEach((configSource, idx) => {
              const label =
                idx === 0
                  ? chalk.magenta.bold(t("list.templates.using_local"))
                  : chalk.cyan.bold(t("list.templates.using_global"));
              console.log("\n" + label);
              console.log(chalk.gray("-".repeat(30)));
              Object.entries(configSource.templates).forEach(
                ([lang, langTemplates]) => {
                  printTemplates(
                    lang,
                    (langTemplates as LanguageConfig).templates,
                    opts.filter,
                  );
                },
              );
            });
          },
          global: () => {
            configsToDisplay.forEach((configSource) => {
              console.log(
                "\n" + chalk.cyan.bold(t("list.templates.using_global")),
              );
              console.log(chalk.gray("-".repeat(30)));
              Object.entries(configSource.templates).forEach(
                ([lang, langTemplates]) => {
                  printTemplates(
                    lang,
                    (langTemplates as LanguageConfig).templates,
                    opts.filter,
                  );
                },
              );
            });
          },
          local: () => {
            configsToDisplay.forEach((configSource) => {
              console.log(
                "\n" + chalk.magenta.bold(t("list.templates.using_local")),
              );
              console.log(chalk.gray("-".repeat(30)));
              Object.entries(configSource.templates).forEach(
                ([lang, langTemplates]) => {
                  printTemplates(
                    lang,
                    (langTemplates as LanguageConfig).templates,
                    opts.filter,
                  );
                },
              );
            });
          },
          language: () => {
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
              printTemplates(language, langTemplates.templates, opts.filter);
            });
          },
          default: () => {
            configsToDisplay.forEach((configSource) => {
              Object.entries(configSource.templates).forEach(
                ([lang, langTemplates]) => {
                  printTemplates(
                    lang,
                    (langTemplates as LanguageConfig).templates,
                    opts.filter,
                  );
                },
              );
            });
          },
        };

        displayActions[displayMode]();
      } catch (error) {
        handleErrorAndExit(error, spinner);
      }
    });
}

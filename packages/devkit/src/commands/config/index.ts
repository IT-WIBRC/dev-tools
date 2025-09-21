import { t } from "#utils/internationalization/i18n.js";
import { type SetupCommandOptions } from "#utils/configs/schema.js";
import { readAndMergeConfigs } from "#utils/configs/loader.js";
import {
  handleNonInteractiveSettingsUpdate,
  handleNonInteractiveTemplateUpdate,
} from "./logic.js";
import ora from "ora";
import chalk from "chalk";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { handleInteractiveConfig } from "./prompts.js";

export function setupConfigCommand(options: SetupCommandOptions): void {
  const { program } = options;

  program
    .command("config")
    .alias("cf")
    .description(t("config.command.description"))
    .option("-s, --set <value...>", t("config.set.command.description"))
    .option(
      "-t, --template <language> <templateName>",
      t("config.template.description"),
    )
    .option("-d, --description <string>", t("config.update.option.description"))
    .option("-l, --location <string>", t("config.update.option.location"))
    .option("-a, --alias <string>", t("config.update.option.alias"))
    .option(
      "--cache-strategy <string>",
      t("config.update.option.cache_strategy"),
    )
    .option(
      "--package-manager <string>",
      t("config.update.option.package_manager"),
    )
    .option("-n, --new-name <string>", t("config.update.option.new_name"))
    .option("-g, --global", t("config.update.option.global"), false)
    .action(async (cmdOptions) => {
      console.log(cmdOptions);
      const {
        set,
        template,
        description,
        location,
        alias,
        cacheStrategy,
        packageManager,
        newName,
        global: isGlobal,
      } = cmdOptions;

      const spinner = ora(chalk.cyan(t("config.get.loading"))).start();

      try {
        const { config } = await readAndMergeConfigs({
          forceGlobal: isGlobal,
        });

        spinner.stop();

        if (set) {
          const [key, value] = set;
          await handleNonInteractiveSettingsUpdate(key, value, isGlobal);
          spinner.succeed(chalk.green(t("config.set.success")));
          return;
        }

        if (template) {
          const [language, templateName] = template;
          const updates = {
            description,
            location,
            alias,
            cacheStrategy,
            packageManager,
            newName,
          };
          await handleNonInteractiveTemplateUpdate(
            language,
            templateName,
            updates,
            isGlobal,
          );
          const message = newName
            ? t("config.update.success_name", {
                oldName: templateName,
                newName,
              })
            : t("config.update.success", { templateName });
          spinner.succeed(chalk.green(message));
          return;
        }

        await handleInteractiveConfig(config, isGlobal);
        spinner.succeed(chalk.green(t("config.interactive.success")));
      } catch (error) {
        handleErrorAndExit(error as Error, spinner);
      }
    });
}

import {
  type CliConfig,
  type SetupCommandOptions,
} from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { configAliases } from "./validate-config.js";
import chalk from "chalk";
import ora from "ora";
import { readAndMergeConfigs } from "#utils/configs/loader.js";

export function setupConfigGetCommand(options: SetupCommandOptions): void {
  const { program } = options;

  program
    .command("get")
    .description(t("config.get.command.description"))
    .argument("[key]", t("config.get.argument.description"), "")
    .option("-g, --global", t("config.get.option.global"), false)
    .action(async (key, cmdOptions) => {
      const spinner = ora(chalk.cyan(t("config.get.loading"))).start();

      let activeConfig: CliConfig["settings"];
      let sourceMessage: string | null = null;
      let configSource: string;

      try {
        const { config, source } = await readAndMergeConfigs({
          forceGlobal: cmdOptions.global,
          forceLocal: !cmdOptions.global,
        });

        activeConfig = config.settings;
        configSource = source;

        if (cmdOptions.global) {
          if (configSource === "default") {
            sourceMessage = t("config.get.fallback.global");
          } else {
            sourceMessage = t("config.get.source.global");
          }
        } else {
          if (configSource === "default") {
            sourceMessage = t("config.get.fallback.local");
          } else if (configSource === "global") {
            sourceMessage = t("config.get.fallback.local_to_global");
          } else {
            sourceMessage = t("config.get.source.local");
          }
        }

        spinner.succeed(chalk.bold.green(t("config.get.success")));

        if (sourceMessage) {
          console.log(chalk.bold.yellow(sourceMessage));
        }

        if (key) {
          printConfigValue(activeConfig, key);
        } else {
          printConfig(activeConfig);
        }
      } catch (error) {
        handleErrorAndExit(error, spinner);
      }
    });
}

function printConfig(activeConfig: CliConfig["settings"]) {
  console.log(`\n${chalk.bold.blue("Current Configuration:")}`);

  for (const [key, value] of Object.entries(activeConfig)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      console.log(` - ${chalk.green(key)}:`);
      for (const [subKey, subValue] of Object.entries(value)) {
        console.log(`   - ${chalk.yellow(subKey)}: ${chalk.white(subValue)}`);
      }
    } else {
      console.log(` - ${chalk.green(key)}: ${chalk.white(value)}`);
    }
  }

  console.log("");
}

function printConfigValue(activeConfig: CliConfig["settings"], key: string) {
  const canonicalKey = configAliases[key] || key;
  const value = activeConfig[canonicalKey as keyof CliConfig["settings"]];

  if (value === undefined) {
    console.log(chalk.red(t("config.get.not_found", { key: canonicalKey })));
    return;
  }

  const outputValue =
    typeof value === "object" ? JSON.stringify(value, null, 2) : value;

  console.log(`\n${chalk.cyan(canonicalKey)}: ${chalk.white(outputValue)}\n`);
}

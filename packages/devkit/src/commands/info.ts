import { t } from "#utils/internationalization/i18n.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import ora from "ora";
import chalk from "chalk";
import type { SetupCommandOptions } from "#utils/configs/schema.js";
import { collectSystemInfo, type SystemInfo } from "#utils/system/info.js";

const printInfo = (info: SystemInfo): void => {
  const sections: {
    titleKey: Parameters<typeof t>[0];
    items: [string, string | { path: string; exists: boolean }][];
  }[] = [
    {
      titleKey: "info.header.cli",
      items: [[t("info.cli.version"), info.cliVersion]],
    },
    {
      titleKey: "info.header.runtime",
      items: [
        [t("info.runtime.runtime_name"), info.runtimeName],
        [t("info.runtime.runtime_version"), info.runtimeVersion],
        [t("info.runtime.package_manager"), info.packageManagerVersion],
      ],
    },
    {
      titleKey: "info.header.os_details",
      items: [
        [t("info.os.type_version"), info.os],
        [t("info.os.architecture"), info.arch],
        [t("info.os.shell"), info.shell],
        [t("info.os.home_dir"), info.homeDir],
      ],
    },
    {
      titleKey: "info.header.config_files",
      items: [
        [t("info.config.global_path"), info.globalConfig],
        [t("info.config.local_path"), info.localConfig],
      ],
    },
  ];

  console.log();

  sections.forEach((section) => {
    console.log(chalk.bold.cyan(`--- ${t(section.titleKey)} ---`));

    section.items.forEach(([label, value]) => {
      let displayValue: string;
      let labelPadded = label.padEnd(27, " ");

      if (typeof value === "string") {
        displayValue = value;
      } else {
        const status = value.exists
          ? chalk.green(t("info.config.found"))
          : chalk.red(t("info.config.not_found"));
        displayValue = `${value.path} ${status}`;
      }

      console.log(`${chalk.yellow(labelPadded)}: ${displayValue}`);
    });
    console.log();
  });
};

export function setupInfoCommand(options: SetupCommandOptions): void {
  const { program } = options;
  const cliVersion = program.version() as string;

  program
    .command("info")
    .alias("in")
    .description(t("info.command.description"))
    .action(async () => {
      const spinner = ora(t("info.loading")).start();
      try {
        const info = await collectSystemInfo(cliVersion);

        spinner.stop();
        spinner.succeed(t("info.success_message"));

        printInfo(info);
      } catch (error: unknown) {
        handleErrorAndExit(error as Error, spinner);
      }
    });
}

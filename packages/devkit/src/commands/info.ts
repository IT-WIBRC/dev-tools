import { t } from "#utils/i18n/translator.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { logger, type TSpinner } from "#utils/logger.js";
import type { SetupCommandOptions } from "#utils/schema/schema.js";
import { collectSystemInfo, type SystemInfo } from "#core/info/info.js";

const printInfo = (info: SystemInfo): void => {
  const sections: {
    titleKey: Parameters<typeof t>[0];
    items: [string, string | { path: string; exists: boolean }][];
  }[] = [
    {
      titleKey: "commands.info.header.cli",
      items: [[t("commands.info.cli.version"), info.cliVersion]],
    },
    {
      titleKey: "commands.info.header.runtime",
      items: [
        [t("commands.info.runtime.runtime_name"), info.runtimeName],
        [t("commands.info.runtime.runtime_version"), info.runtimeVersion],
        [
          t("commands.info.runtime.package_manager"),
          info.packageManagerVersion,
        ],
      ],
    },
    {
      titleKey: "commands.info.header.os_details",
      items: [
        [t("commands.info.os.type_version"), info.os],
        [t("commands.info.os.architecture"), info.arch],
        [t("commands.info.os.shell"), info.shell],
        [t("commands.info.os.home_dir"), info.homeDir],
      ],
    },
    {
      titleKey: "commands.info.header.config_files",
      items: [
        [t("commands.info.config.global_path"), info.globalConfig],
        [t("commands.info.config.local_path"), info.localConfig],
      ],
    },
  ];

  logger.log("\n");

  sections.forEach((section) => {
    logger.log(
      logger.colors.cyan(logger.colors.bold(`--- ${t(section.titleKey)} ---`)),
    );

    section.items.forEach(([label, value]) => {
      let displayValue: string;
      let labelPadded = label.padEnd(27, " ");

      if (typeof value === "string") {
        displayValue = value;
      } else {
        const status = value.exists
          ? logger.colors.green(t("commands.info.config.found"))
          : logger.colors.red(t("commands.info.config.not_found"));
        displayValue = `${value.path} ${status}`;
      }

      logger.log(`${logger.colors.yellow(labelPadded)}: ${displayValue}`);
    });
    logger.log("\n");
  });
};

export function setupInfoCommand(options: SetupCommandOptions): void {
  const { program } = options;
  const cliVersion = program.version() as string;

  program
    .command("info")
    .alias("in")
    .description(t("commands.info.command.description"))
    .action(async () => {
      const spinner: TSpinner = logger
        .spinner(t("messages.status.info_loading"))
        .start();
      try {
        const info = await collectSystemInfo(cliVersion);

        spinner.stop();
        spinner.succeed(t("messages.success.info_collected"));

        printInfo(info);
      } catch (error: unknown) {
        handleErrorAndExit(error as Error, spinner);
      }
    });
}

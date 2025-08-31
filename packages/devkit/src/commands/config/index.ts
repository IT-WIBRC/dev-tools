import { type SetupCommandOptions } from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import { setupConfigSetCommand } from "#commands/config/set.js";
import { setupConfigGetCommand } from "#commands/config/get.js";

export function setupConfigCommand(options: SetupCommandOptions) {
  const { program, config, source } = options;
  const configCommand = program
    .command("config")
    .alias("cf")
    .description(t("config.command.description"));

  setupConfigSetCommand({ program: configCommand, config, source });
  setupConfigGetCommand({ program: configCommand, config, source });
}

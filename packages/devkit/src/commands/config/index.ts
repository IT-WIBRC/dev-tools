import { type SetupCommandOptions } from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import { setupConfigSetCommand } from "./set.js";
import { setupConfigUpdateCommand } from "./update.js";

export function setupConfigCommand(options: SetupCommandOptions) {
  const { program, config, source } = options;
  const configCommand = program
    .command("config")
    .alias("cf")
    .description(t("config.command.description"));

  setupConfigSetCommand({ program: configCommand, config, source });
  setupConfigUpdateCommand({ program: configCommand, config, source });
}

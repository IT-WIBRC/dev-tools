import { t } from "#utils/i18n/translator.js";
import { logger, type TSpinner } from "#utils/logger.js";
import { handleNonInteractiveSettingsUpdate } from "../logic.js";

export async function handleSetAction(
  bulkSetValues: string[],
  isGlobal: boolean,
  spinner: TSpinner,
): Promise<void> {
  if (bulkSetValues.length % 2 !== 0) {
    spinner.fail(
      logger.colors.redBright(t("errors.command.set_invalid_format")),
    );
    return;
  }

  for (let i = 0; i < bulkSetValues.length; i += 2) {
    const bulkKey = bulkSetValues[i];
    const bulkValue = bulkSetValues[i + 1];

    await handleNonInteractiveSettingsUpdate(bulkKey, bulkValue, isGlobal);
  }
  spinner.succeed(logger.colors.green(t("messages.success.config_updated")));
}

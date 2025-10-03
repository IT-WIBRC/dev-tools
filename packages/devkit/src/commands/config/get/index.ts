import { t } from "#utils/i18n/translator.js";
import { logger, type TSpinner } from "#utils/logger.js";
import { resolveKeys, getSettingsConfig } from "../utils.js";
import type { CliConfig } from "#utils/schema/schema.js";

export async function handleGetAction(
  keys: string[],
  isGlobal: boolean,
  spinner: TSpinner,
): Promise<void> {
  const config = await getSettingsConfig(isGlobal);

  const resolvedKeys = resolveKeys(keys);

  resolvedKeys.forEach((key: keyof CliConfig["settings"], index: number) => {
    const inputKey = keys[index];
    const configValue = config.settings[key];

    if (Object.prototype.hasOwnProperty.call(config.settings, key)) {
      logger.log(logger.colors.yellowBold(inputKey) + ": " + configValue);
    } else {
      logger.log(
        logger.colors.redBright(
          t("errors.config.get_key_not_found", { key: inputKey }),
        ),
      );
    }
  });
  spinner.succeed(logger.colors.green(t("messages.success.config_read")));
}

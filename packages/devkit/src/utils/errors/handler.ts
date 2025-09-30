import { logger, type TSpinner } from "../logger.js";
import { ConfigError, GitError, DevkitError } from "./base.js";
import { t } from "../i18n/translator.js";

export function handleErrorAndExit(error: unknown, spinner?: TSpinner): void {
  spinner?.stop();

  if (error instanceof ConfigError) {
    logger.error(`${t("error.config.generic")}: ${error.message}`, "CONFIG");

    if (error.filePath) {
      logger.dimmed(`File path: ${error.filePath}`);
    }
  } else if (error instanceof GitError) {
    logger.error(`${t("error.git.generic")}: ${error.message}`, "GIT");
    if (error.url) {
      logger.dimmed(`Repository URL: ${error.url}`);
    }
  } else if (error instanceof DevkitError) {
    logger.error(`${t("error.devkit_specific")}: ${error.message}`, "DEV");
  } else if (error instanceof Error) {
    logger.error(`${t("error.unexpected")}: ${error.message}`, "ERR");
  } else {
    logger.error(t("error.unknown"), "UNKNOWN");
  }

  const cause = error instanceof Error ? error.cause : undefined;
  if (cause instanceof Error) {
    logger.dimmed(`Cause: ${cause.message}`);
  }

  process.exit(1);
}

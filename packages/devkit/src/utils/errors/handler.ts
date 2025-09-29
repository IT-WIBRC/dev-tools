import { logger } from "#utils/logger.js";
import { ConfigError, GitError } from "./base.js";
import { t } from "../i18n/translator.js";
import type { Ora } from "ora";

export function handleErrorAndExit(error: unknown, spinner?: Ora): void {
  spinner?.stop();

  if (error instanceof ConfigError) {
    logger.error(`${t("error.config.generic")}: ${error.message}`);
    if (error.filePath) {
      logger.error(`File path: ${error.filePath}`);
    }
  } else if (error instanceof GitError) {
    logger.error(`${t("error.git.generic")}: ${error.message}`);
    if (error.url) {
      logger.error(`Repository URL: ${error.url}`);
    }
  } else if (error instanceof Error) {
    logger.error(`${t("error.unexpected")}: ${error.message}`);
  } else {
    logger.error(t("error.unknown"));
  }

  process.exit(1);
}

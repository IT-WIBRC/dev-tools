import type { Ora } from "ora";
import chalk from "chalk";
import { ConfigError, GitError } from "./errors.js";
import { t } from "../i18n.js";

export function handleErrorAndExit(error: unknown, spinner: Ora): void {
  spinner.stop();

  if (error instanceof ConfigError) {
    console.error(
      chalk.red(`\n${t("error.config.generic")}: ${error.message}`),
    );
    if (error.filePath) {
      console.error(chalk.red(`File path: ${error.filePath}`));
    }
  } else if (error instanceof GitError) {
    console.error(chalk.red(`\n${t("error.git.generic")}: ${error.message}`));
    if (error.url) {
      console.error(chalk.red(`Repository URL: ${error.url}`));
    }
  } else if (error instanceof Error) {
    console.error(chalk.red(`\n${t("error.unexpected")}: ${error.message}`));
  } else {
    console.error(chalk.red(`\n${t("error.unknown")}`));
  }

  process.exit(1);
}

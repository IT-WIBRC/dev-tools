import chalk from "chalk";
import ora, { type Ora } from "ora";

export const logger = {
  info(message: string) {
    console.log(chalk.blue(message));
  },

  success(message: string) {
    console.log(chalk.green(`✔ ${message}`));
  },

  warning(message: string) {
    console.log(chalk.yellow(`⚠️ ${message}`));
  },

  error(message: string) {
    console.error(chalk.red(`\n❌ ${message}`));
  },

  log(message: string) {
    console.log(message);
  },

  spinner(text: string): Ora {
    return ora(text);
  },

  dimmed(message: string) {
    console.log(chalk.dim(message));
  },
};

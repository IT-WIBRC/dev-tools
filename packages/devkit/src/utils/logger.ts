import chalk from "chalk";
import ora, { type Ora } from "ora";

function getTimestamp(): string {
  const date = new Date();
  const time = date.toTimeString().split(" ")[0];
  return chalk.dim(`[${time}]`);
}

function formatError(message: string, errorType: ErrorType): string {
  const timestamp = getTimestamp();
  const typeTag = chalk.bold.red(`❌${timestamp}::[${errorType}]`);
  const coloredMessage = chalk.redBright(`${message}`);

  return `${typeTag}>> ${coloredMessage}`;
}

export type ErrorType =
  | "UNKNOWN"
  | "WARNING"
  | "INFO"
  | "DEV"
  | "GIT"
  | "ERR"
  | "CONFIG"
  | "TEMPL"
  | "CACHE";
export type TSpinner = Ora;

export const logger = {
  info(message: string) {
    console.log(chalk.blue(message));
  },

  success(message: string) {
    console.log(chalk.green(`\n✔ ${message}`));
  },

  warning(message: string) {
    console.log(chalk.yellow(`⚠️ ${message}`));
  },

  error(message: string, errorType: ErrorType = "UNKNOWN") {
    console.error(formatError(message, errorType));
  },

  log(message: string) {
    console.log(message);
  },

  spinner(text?: string): TSpinner {
    return ora(text);
  },

  dimmed(message: string) {
    console.log(chalk.dim(message.trim()));
  },

  colors: {
    white: (message: string) => chalk.white(message),
    blue: (message: string) => chalk.blue(message),
    green: (message: string) => chalk.green(message),
    yellow: (message: string) => chalk.yellow(message),
    red: (message: string) => chalk.red(message),
    cyan: (message: string) => chalk.cyan(message),
    dim: (message: string) => chalk.dim(message),
    bold: (message: string) => chalk.bold(message),
    italic: (message: string) => chalk.italic(message),
    boldBlue: (message: string) => chalk.bold.blue(message),
    cyanDim: (message: string) => chalk.cyan.dim(message),
    yellowBold: (message: string) => chalk.bold.yellow(message),
    redBright: (message: string) => chalk.redBright(message),
    greenBright: (message: string) => chalk.greenBright(message),
    magenta: (message: string) => chalk.magenta(message),
    magentaBright: (message: string) => chalk.magentaBright(message),
  },
};

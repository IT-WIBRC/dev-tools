import chalk from "chalk";
import ora, { type Ora } from "ora";

const stripAnsi = (str: string): string => {
  return str.replace(
    // oxlint-disable-next-line no-control-regex
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    "",
  );
};

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

function _logTable(data: string[][]): void {
  if (!Array.isArray(data) || data.length <= 1 || data[0].length === 0) {
    return;
  }

  const numCols = data[0].length;
  // oxlint-disable-next-line no-new-array
  const colWidths = new Array(numCols).fill(0);
  const PADDING = 3;

  for (const row of data) {
    for (let i = 0; i < numCols; i++) {
      const cell = row[i] || "";
      const cellTextLength = stripAnsi(cell).length;
      if (cellTextLength > colWidths[i]) {
        colWidths[i] = cellTextLength;
      }
    }
  }

  data.forEach((row, rowIndex) => {
    let line = "";
    for (let i = 0; i < numCols; i++) {
      const cell = row[i] || "";
      const targetWidth = colWidths[i];
      const cellTextLength = stripAnsi(cell).length;

      const paddingSpaces = " ".repeat(targetWidth - cellTextLength);

      const columnSeparator = " ";

      line += cell + paddingSpaces + columnSeparator.repeat(PADDING);
    }

    console.log(line.trimEnd());

    if (rowIndex === 0) {
      const totalWidth =
        colWidths.reduce((sum, width) => sum + width, 0) +
        (numCols - 1) * PADDING;
      console.log(chalk.dim("-".repeat(totalWidth)));
    }
  });
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
  | "CLEANUP"
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

  table(data: string[][]): void {
    _logTable(data);
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

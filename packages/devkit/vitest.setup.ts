import { vi } from "vitest";
import type { TSpinner } from "./src/utils/logger";

const {
  mocktFn,
  mockLoadTranslations,
  mockProgram,
  mockSpinner,
  mockExeca,
  mockExecuteCommand,
  mockLogger,
} = vi.hoisted(() => {
  const mocktFn = vi.fn().mockImplementation(
    (key: string, options?: Record<string, unknown>) =>
      `${key}` +
      (options
        ? `- options ${Object.entries(options)
            .map(([k, v]) => `${k}:${v}`)
            .join(", ")}`
        : ""),
  );

  const mockLoadTranslations = vi.fn();

  const mockSpinner = {
    text: "",
    start: vi.fn(() => {
      return mockSpinner;
    }),
    succeed: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(() => {
      return mockSpinner;
    }),
    fail: vi.fn(),
    stop: vi.fn(),
  } as unknown as TSpinner;

  const mockProgram = {
    name: vi.fn(() => {
      return mockProgram;
    }),
    alias: vi.fn(() => {
      return mockProgram;
    }),
    description: vi.fn(() => {
      return mockProgram;
    }),
    version: vi.fn(() => {
      return mockProgram;
    }),
    helpOption: vi.fn(() => {
      return mockProgram;
    }),
    command: vi.fn(() => {
      return mockProgram;
    }),
    requiredOption: vi.fn(() => {
      return mockProgram;
    }),
    option: vi.fn(() => {
      return mockProgram;
    }),
    parse: vi.fn(() => {
      return mockProgram;
    }),
    opts: vi.fn(),
    parseOptions: vi.fn(),
  };

  const mockExeca = vi.fn();
  const mockExecuteCommand = vi.fn();

  const mockLogger = {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    log: vi.fn(),
    warning: vi.fn(),
    dimmed: vi.fn(),
    spinner: vi.fn(() => mockSpinner),
    colors: {
      yellow: vi.fn((text: string) => text),
      yellowBold: vi.fn((text: string) => text),
      green: vi.fn((text: string) => text),
      cyan: vi.fn((text: string) => text),
      red: vi.fn((text: string) => text),
      magenta: vi.fn((text: string) => text),
      bold: vi.fn((text: string) => text),
      italic: vi.fn((text: string) => text),
      blue: vi.fn((text: string) => text),
      dim: vi.fn((text: string) => text),
      cyanDim: vi.fn((text: string) => text),
      redBright: vi.fn((text: string) => text),
      boldBlue: vi.fn((text: string) => text),
    },
  };

  return {
    mocktFn,
    mockLoadTranslations,
    mockProgram,
    mockSpinner,
    mockExeca,
    mockExecuteCommand,
    mockLogger,
  };
});

vi.mock("commander", () => ({ Command: vi.fn(() => mockProgram) }));

vi.mock("#utils/i18n/translator.js", () => ({
  loadTranslations: mockLoadTranslations,
  t: mocktFn,
}));

vi.mock("#utils/shell.js", () => ({
  execute: mockExeca,
  executeCommand: mockExecuteCommand,
}));

vi.mock("#utils/logger.js", () => ({
  logger: mockLogger,
}));

export {
  mockProgram,
  mockSpinner,
  mockLoadTranslations,
  mocktFn,
  mockExeca,
  mockExecuteCommand,
  mockLogger,
};

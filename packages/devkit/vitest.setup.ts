import type { Ora } from "ora";
import { vi } from "vitest";

const { mocktFn, mockLoadTranslations, mockProgram, mockSpinner } = vi.hoisted(
  () => {
    const mockSpinner = {
      text: "",
      start: vi.fn(() => mockSpinner),
      succeed: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(() => mockSpinner),
      fail: vi.fn(),
      stop: vi.fn(),
    } as unknown as Ora;

    return {
      mocktFn: vi.fn().mockImplementation(
        (key: string, options?: Record<string, unknown>) =>
          `${key}` +
          (options
            ? `- options ${Object.entries(options)
                .map(([k, v]) => `${k}:${v}`)
                .join(", ")}`
            : ""),
      ),
      mockLoadTranslations: vi.fn(),
      mockProgram: {
        name: vi.fn(() => mockProgram),
        alias: vi.fn(() => mockProgram),
        description: vi.fn(() => mockProgram),
        version: vi.fn(() => mockProgram),
        helpOption: vi.fn(() => mockProgram),
        command: vi.fn(() => mockProgram),
        requiredOption: vi.fn(() => mockProgram),
        option: vi.fn(() => mockProgram),
        parse: vi.fn(() => mockProgram),
        opts: vi.fn(),
        parseOptions: vi.fn(),
      },
      mockSpinner,
    };
  },
);

const mockChalk = vi.hoisted(() => {
  const handler = {
    get: (target: any, prop: any) => {
      return typeof target[prop] !== "undefined"
        ? target[prop]
        : (...args: any[]) => target(...args);
    },
    apply: (_: any, __: any, args: any[]) => {
      return `${args.join("_")}`;
    },
  };

  const baseMock = (...args: any[]) => `mocked_chalk_string_${args.join("_")}`;

  const chainableMock = new Proxy(baseMock, handler);
  const methods = [
    "bold",
    "blue",
    "cyan",
    "green",
    "gray",
    "yellow",
    "magenta",
    "red",
    "dim",
    "italic",
    "redBright",
    "white",
  ];
  methods.forEach((method) => {
    (chainableMock as any)[method] = new Proxy(baseMock, handler);
  });

  return chainableMock;
});

vi.mock("commander", () => ({ Command: vi.fn(() => mockProgram) }));
vi.mock("ora", () => ({ default: () => mockSpinner }));
vi.mock("chalk", () => ({ default: mockChalk }));

vi.mock("#utils/i18n/translator.js", () => ({
  loadTranslations: mockLoadTranslations,
  t: mocktFn,
}));

const { mockExeca, mockExecuteCommand } = vi.hoisted(() => ({
  mockExeca: vi.fn(),
  mockExecuteCommand: vi.fn(),
}));

vi.mock("#utils/shell.js", () => ({
  execute: mockExeca,
  executeCommand: mockExecuteCommand,
}));

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("#utils/logger.js", () => ({
  logger: mockLogger,
}));

export {
  mockProgram,
  mockSpinner,
  mockChalk,
  mockLoadTranslations,
  mocktFn,
  mockExeca,
  mockExecuteCommand,
  mockLogger,
};

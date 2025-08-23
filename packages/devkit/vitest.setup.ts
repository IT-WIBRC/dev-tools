import { vi } from "vitest";

const { mocktFn, mockLoadTranslations, mockProgram, mockSpinner } = vi.hoisted(
  () => {
    const mockSpinner = {
      text: "",
      start: vi.fn(() => mockSpinner),
      succeed: vi.fn(),
      info: vi.fn(),
      fail: vi.fn(),
      stop: vi.fn(),
    };

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
        parse: vi.fn(() => Promise.resolve()),
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
    "yellow",
    "red",
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

vi.mock("#utils/internationalization/i18n.js", () => ({
  loadTranslations: mockLoadTranslations,
  t: mocktFn,
}));
const { mockExeca, mockExecaCommand } = vi.hoisted(() => ({
  mockExeca: vi.fn(),
  mockExecaCommand: vi.fn(),
}));

vi.mock("execa", () => ({
  execa: mockExeca,
  execaCommand: mockExecaCommand,
}));

export {
  mockProgram,
  mockSpinner,
  mockChalk,
  mockLoadTranslations,
  mocktFn,
  mockExeca,
  mockExecaCommand,
};

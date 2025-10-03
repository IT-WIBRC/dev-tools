import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupListCommand } from "../../../../src/commands/config/list.js";
import { mockSpinner, mockLogger, mocktFn } from "../../../../vitest.setup.js";
import { DevkitError } from "../../../../src/utils/errors/base.js";
import type { CliConfig } from "../../../../src/utils/schema/schema.js";

type AnnotatedTemplate = {
  _language: string;
  name: string;
  description: string;
  location: string;
};

const MOCK_SETTINGS = {
  language: "typescript",
  packageManager: "npm",
};

const MOCK_CONFIG: CliConfig = {
  settings: MOCK_SETTINGS as any,
  templates: {},
};

const MOCK_ANNOTATED_TEMPLATES: AnnotatedTemplate[] = [
  {
    _language: "javascript",
    name: "vue-basic",
    description: "A basic Vue template",
    location: "https://github.com/vuejs/vue",
  },
  {
    _language: "typescript",
    name: "ts-node",
    description: "A simple TS project",
    location: "https://github.com/microsoft/TypeScript-Node-Starter",
  },
];

const MOCK_CONFIG_SOURCES = {
  local: MOCK_CONFIG,
  global: MOCK_CONFIG,
  default: MOCK_CONFIG,
  configFound: true,
};

const {
  mockHandleErrorAndExit,
  mockReadConfigSources,
  mockGetMergedConfig,
  mockGetAnnotatedTemplates,
  mockPrintSettings,
  mockPrintTemplates,
} = vi.hoisted(() => ({
  mockHandleErrorAndExit: vi.fn(),
  mockReadConfigSources: vi.fn(),
  mockGetMergedConfig: vi.fn(),
  mockGetAnnotatedTemplates: vi.fn(),
  mockPrintSettings: vi.fn(),
  mockPrintTemplates: vi.fn(),
}));

let actionFn: (...options: unknown[]) => Promise<void>;
const mockParent = {
  opts: vi.fn(() => ({ global: false })),
};

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#core/config/loader.js", () => ({
  readConfigSources: mockReadConfigSources,
}));

vi.mock("#core/config/merger.js", () => ({
  getMergedConfig: mockGetMergedConfig,
}));

vi.mock("#core/template/annotator.js", () => ({
  getAnnotatedTemplates: mockGetAnnotatedTemplates,
}));

vi.mock("#core/template/printer.js", () => ({
  printSettings: mockPrintSettings,
  printTemplates: mockPrintTemplates,
}));

const consoleLogSpy = mockLogger.log;

describe("setupListCommand", () => {
  let mockConfigCommand: any;

  const CONFIG_LIST_DESC = "commands.config.list.command.description";
  const CONFIG_LIST_ALL_OPT = "commands.config.list.options.all";
  const CONFIG_LIST_DEFAULTS_OPT = "commands.list.options.include_defaults";

  const CONFIG_SOURCE_LOCAL = "messages.status.config_source_local";
  const CONFIG_SOURCE_GLOBAL = "messages.status.config_source_global";
  const CONFIG_SOURCE_MERGED = "messages.status.config_source_local_and_global";
  const DEFAULTS_SUFFIX = "messages.status.including_defaults_suffix";
  const TEMPLATES_NOT_FOUND = "warnings.template.not_found";
  const ERR_LOCAL_NOT_FOUND = "errors.config.local_not_found";
  const ERR_GLOBAL_NOT_FOUND = "errors.config.global_not_found";
  const ERR_MUTUALLY_EXCLUSIVE = "errors.command.mutually_exclusive_options";
  const SETTINGS_HEADER = "commands.config.list.settings_header";
  const TEMPLATES_HEADER = "commands.config.list.templates_header";
  const NO_CONFIG_FOUND = "warnings.no_config_found";

  beforeEach(() => {
    vi.clearAllMocks();
    mockParent.opts.mockReturnValue({ global: false });
    actionFn = vi.fn();
    mockConfigCommand = {
      command: vi.fn(() => mockConfigCommand),
      alias: vi.fn(() => mockConfigCommand),
      description: vi.fn(() => mockConfigCommand),
      option: vi.fn(() => mockConfigCommand),
      action: vi.fn((fn) => {
        actionFn = fn;
        return mockConfigCommand;
      }),
    };

    mockReadConfigSources.mockResolvedValue(MOCK_CONFIG_SOURCES);
    mockGetMergedConfig.mockResolvedValue(MOCK_CONFIG);
    mockGetAnnotatedTemplates.mockResolvedValue(MOCK_ANNOTATED_TEMPLATES);
  });

  it("should set up the list command with correct options, including the new --include-defaults flag", () => {
    setupListCommand(mockConfigCommand);
    expect(mockConfigCommand.command).toHaveBeenCalledWith("list");
    expect(mockConfigCommand.alias).toHaveBeenCalledWith("ls");

    expect(mockConfigCommand.description).toHaveBeenCalledWith(
      mocktFn(CONFIG_LIST_DESC),
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "-a, --all",
      mocktFn(CONFIG_LIST_ALL_OPT),
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "-d, --include-defaults",
      mocktFn(CONFIG_LIST_DEFAULTS_OPT),
      false,
    );
  });

  it("should display local configuration and templates by default", async () => {
    setupListCommand(mockConfigCommand);
    await actionFn({}, { parent: mockParent });

    expect(mockReadConfigSources).toHaveBeenCalledWith({
      forceGlobal: false,
      mergeAll: false,
    });
    expect(mockGetMergedConfig).toHaveBeenCalledWith(false);
    expect(mockGetAnnotatedTemplates).toHaveBeenCalledWith({
      forceGlobal: false,
      mergeAll: false,
      includeDefaults: false,
    });

    expect(mockSpinner.info).toHaveBeenCalledWith(mocktFn(CONFIG_SOURCE_LOCAL));

    expect(consoleLogSpy).toHaveBeenCalledWith(
      mockLogger.colors.bold("\n" + mocktFn(SETTINGS_HEADER)),
    );
    expect(mockPrintSettings).toHaveBeenCalledWith(MOCK_SETTINGS);
    expect(mockPrintTemplates).toHaveBeenCalledWith(
      MOCK_ANNOTATED_TEMPLATES,
      [],
      "tree",
    );
    expect(mockSpinner.stop).toHaveBeenCalledTimes(2);
  });

  it("should display both local and global configs with --all flag", async () => {
    setupListCommand(mockConfigCommand);
    await actionFn({ all: true }, { parent: mockParent });

    expect(mockReadConfigSources).toHaveBeenCalledWith({
      forceGlobal: false,
      mergeAll: true,
    });
    expect(mockGetMergedConfig).toHaveBeenCalledWith(true);
    expect(mockGetAnnotatedTemplates).toHaveBeenCalledWith({
      forceGlobal: false,
      mergeAll: true,
      includeDefaults: false,
    });

    expect(mockSpinner.info).toHaveBeenCalledWith(
      mocktFn(CONFIG_SOURCE_MERGED),
    );
  });

  it("should display global configuration when --global flag is used", async () => {
    mockParent.opts.mockReturnValue({ global: true });

    setupListCommand(mockConfigCommand);
    await actionFn({}, { parent: mockParent });

    expect(mockReadConfigSources).toHaveBeenCalledWith({
      forceGlobal: true,
      mergeAll: false,
    });
    expect(mockGetMergedConfig).toHaveBeenCalledWith(true);
    expect(mockGetAnnotatedTemplates).toHaveBeenCalledWith({
      forceGlobal: true,
      mergeAll: false,
      includeDefaults: false,
    });

    expect(mockSpinner.info).toHaveBeenCalledWith(
      mocktFn(CONFIG_SOURCE_GLOBAL),
    );
  });

  it("should include defaults and append suffix when --include-defaults flag is used (Default/Local mode)", async () => {
    setupListCommand(mockConfigCommand);
    await actionFn({ includeDefaults: true }, { parent: mockParent });

    expect(mockReadConfigSources).toHaveBeenCalledWith({
      forceGlobal: false,
      mergeAll: false,
    });
    expect(mockGetMergedConfig).toHaveBeenCalledWith(true);
    expect(mockGetAnnotatedTemplates).toHaveBeenCalledWith({
      forceGlobal: false,
      mergeAll: false,
      includeDefaults: true,
    });

    expect(mockSpinner.info).toHaveBeenCalledWith(
      mocktFn(CONFIG_SOURCE_LOCAL) + mocktFn(DEFAULTS_SUFFIX),
    );
  });

  it("should include defaults and append suffix when --include-defaults is used with --global", async () => {
    mockParent.opts.mockReturnValue({ global: true });

    setupListCommand(mockConfigCommand);
    await actionFn({ includeDefaults: true }, { parent: mockParent });

    expect(mockSpinner.info).toHaveBeenCalledWith(
      mocktFn(CONFIG_SOURCE_GLOBAL) + mocktFn(DEFAULTS_SUFFIX),
    );
  });

  it("should throw error if global flag is used but global config is missing AND defaults are NOT included", async () => {
    mockReadConfigSources.mockResolvedValue({
      local: MOCK_CONFIG,
      global: null,
      default: MOCK_CONFIG,
      configFound: true,
    });
    mockParent.opts.mockReturnValue({ global: true });

    setupListCommand(mockConfigCommand);
    await actionFn({}, { parent: mockParent });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(mocktFn(ERR_GLOBAL_NOT_FOUND)),
      mockSpinner,
    );
  });

  it("should NOT throw error if global flag is used, global config is missing, BUT defaults ARE included", async () => {
    mockReadConfigSources.mockResolvedValue({
      local: MOCK_CONFIG,
      global: null,
      default: MOCK_CONFIG,
      configFound: true,
    });
    mockParent.opts.mockReturnValue({ global: true });

    setupListCommand(mockConfigCommand);
    await actionFn({ includeDefaults: true }, { parent: mockParent });

    expect(mockSpinner.info).toHaveBeenCalledWith(
      mocktFn(CONFIG_SOURCE_GLOBAL) + mocktFn(DEFAULTS_SUFFIX),
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should throw error if no flag is used (default mode) but local config is missing AND defaults are NOT included", async () => {
    mockReadConfigSources.mockResolvedValue({
      local: null,
      global: MOCK_CONFIG,
      default: MOCK_CONFIG,
      configFound: true,
    });
    mockParent.opts.mockReturnValue({ global: false }); // !isGlobal: true

    setupListCommand(mockConfigCommand);
    await actionFn({}, { parent: mockParent });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(mocktFn(ERR_LOCAL_NOT_FOUND)),
      mockSpinner,
    );
  });

  it("should handle no templates found gracefully", async () => {
    mockGetAnnotatedTemplates.mockResolvedValue([]);

    setupListCommand(mockConfigCommand);
    await actionFn({}, { parent: mockParent });

    expect(mockPrintSettings).toHaveBeenCalledWith(MOCK_SETTINGS);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      mockLogger.colors.yellow(mocktFn(TEMPLATES_NOT_FOUND)),
    );
    expect(mockPrintTemplates).not.toHaveBeenCalled();
  });

  it("should throw a DevkitError if both --global and --all flags are used", async () => {
    setupListCommand(mockConfigCommand);
    await actionFn(
      { all: true },
      { parent: { opts: () => ({ global: true }) } },
    );

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(
        mocktFn(ERR_MUTUALLY_EXCLUSIVE, {
          options: "global, all",
        }),
      ),
      mockSpinner,
    );
  });

  it("should handle unexpected errors gracefully", async () => {
    const mockError = new Error("Unexpected error");
    mockReadConfigSources.mockRejectedValue(mockError);

    setupListCommand(mockConfigCommand);
    await actionFn({}, { parent: mockParent });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(mockError, mockSpinner);
  });
});

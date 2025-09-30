import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupListCommand } from "../../../../src/commands/config/list.js";
import { mockSpinner, mockLogger, mocktFn } from "../../../../vitest.setup.js";
import { DevkitError } from "../../../../src/utils/errors/base.js";

const {
  mockHandleErrorAndExit,
  mockReadAndMergeConfigs,
  mockPrintSettings,
  mockPrintTemplates,
} = vi.hoisted(() => ({
  mockHandleErrorAndExit: vi.fn(),
  mockReadAndMergeConfigs: vi.fn(),
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
  readAndMergeConfigs: mockReadAndMergeConfigs,
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
  const CONFIG_SOURCE_LOCAL = "messages.status.config_source_local";
  const CONFIG_SOURCE_GLOBAL = "messages.status.config_source_global";
  const CONFIG_SOURCE_MERGED = "messages.status.config_source_local_and_global";
  const TEMPLATES_NOT_FOUND = "warnings.template_not_found";
  const ERR_GLOBAL_NOT_FOUND = "errors.config.global_not_found";
  const ERR_MUTUALLY_EXCLUSIVE = "errors.command.mutually_exclusive_options";
  const SETTINGS_HEADER = "commands.config.list.settings_header";
  const TEMPLATES_HEADER = "commands.config.list.templates_header";

  const sampleConfig = {
    settings: {
      language: "typescript",
      packageManager: "npm",
    },
    templates: {
      javascript: {
        templates: {
          "vue-basic": {
            description: "A basic Vue template",
            location: "https://github.com/vuejs/vue",
          },
        },
      },
      typescript: {
        templates: {
          "ts-node": {
            description: "A simple TS project",
            location: "https://github.com/microsoft/TypeScript-Node-Starter",
          },
        },
      },
    },
  };

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
  });

  it("should set up the list command with correct options and arguments", () => {
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
  });

  describe("action handler", () => {
    it("should display a local configuration by default", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: structuredClone(sampleConfig),
        source: "local",
      });

      setupListCommand(mockConfigCommand);
      await actionFn({}, { parent: mockParent });

      expect(mockSpinner.start).toHaveBeenCalled();

      expect(mockSpinner.info).toHaveBeenCalledWith(
        mocktFn(CONFIG_SOURCE_LOCAL),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockLogger.colors.bold("\n" + mocktFn(SETTINGS_HEADER)),
      );
      expect(mockPrintSettings).toHaveBeenCalledOnce();
      expect(mockPrintSettings).toHaveBeenCalledWith(sampleConfig.settings);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockLogger.colors.bold("\n" + mocktFn(TEMPLATES_HEADER)),
      );
      expect(mockPrintTemplates).toHaveBeenCalledWith(
        "javascript",
        sampleConfig.templates.javascript.templates,
      );
      expect(mockPrintTemplates).toHaveBeenCalledWith(
        "typescript",
        sampleConfig.templates.typescript.templates,
      );
      expect(mockSpinner.stop).toHaveBeenCalled();
    });

    it("should display a global configuration with --global flag", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: structuredClone(sampleConfig),
        source: "global",
      });
      mockParent.opts.mockReturnValue({ global: true });

      setupListCommand(mockConfigCommand);
      await actionFn({}, { parent: mockParent });

      expect(mockSpinner.start).toHaveBeenCalled();

      expect(mockSpinner.info).toHaveBeenCalledWith(
        mocktFn(CONFIG_SOURCE_GLOBAL),
      );
      expect(mockPrintSettings).toHaveBeenCalledWith(sampleConfig.settings);
      expect(mockPrintTemplates).toHaveBeenCalledWith(
        "javascript",
        sampleConfig.templates.javascript.templates,
      );
    });

    it("should display both local and global configs with --all flag", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: structuredClone(sampleConfig),
        source: "merged",
      });

      setupListCommand(mockConfigCommand);
      await actionFn({ all: true }, { parent: mockParent });

      expect(mockSpinner.start).toHaveBeenCalled();

      expect(mockSpinner.info).toHaveBeenCalledWith(
        mocktFn(CONFIG_SOURCE_MERGED),
      );
      expect(mockPrintSettings).toHaveBeenCalledWith(sampleConfig.settings);
      expect(mockPrintTemplates).toHaveBeenCalledWith(
        "javascript",
        sampleConfig.templates.javascript.templates,
      );
      expect(mockPrintTemplates).toHaveBeenCalledWith(
        "typescript",
        sampleConfig.templates.typescript.templates,
      );
    });

    it("should handle no templates found gracefully", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: { settings: {}, templates: {} },
        source: "local",
      });

      setupListCommand(mockConfigCommand);
      await actionFn({}, { parent: mockParent });

      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.info).toHaveBeenCalledWith(
        mocktFn(CONFIG_SOURCE_LOCAL),
      );
      expect(mockPrintSettings).toHaveBeenCalledWith({});
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockLogger.colors.yellow(mocktFn(TEMPLATES_NOT_FOUND)),
      );
      expect(mockPrintTemplates).not.toHaveBeenCalled();
    });

    it("should handle the case when global config is requested but not found", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: structuredClone(sampleConfig),
        source: "local",
      });
      mockParent.opts.mockReturnValue({ global: true });

      setupListCommand(mockConfigCommand);
      await actionFn({}, { parent: mockParent });

      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        new DevkitError(mocktFn(ERR_GLOBAL_NOT_FOUND)),
        mockSpinner,
      );
    });

    it("should throw a DevkitError if both --global and --all flags are used", async () => {
      setupListCommand(mockConfigCommand);
      await actionFn(
        { all: true },
        { parent: { opts: () => ({ global: true }) } },
      );

      expect(mockSpinner.start).toHaveBeenCalled();
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
      mockReadAndMergeConfigs.mockRejectedValue(mockError);

      setupListCommand(mockConfigCommand);
      await actionFn({}, { parent: mockParent });

      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
    });
  });
});

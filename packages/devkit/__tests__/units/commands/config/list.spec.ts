import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupListCommand } from "../../../../src/commands/config/list.js";
import { mockSpinner, mockChalk, mocktFn } from "../../../../vitest.setup.js";
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

let actionFn: any;
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

const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

describe("setupListCommand", () => {
  let mockConfigCommand: any;

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
      mocktFn("list.command.description"),
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "-a, --all",
      mocktFn("list.command.all.option"),
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
        mocktFn("config.get.source.local"),
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
        mocktFn("config.get.source.global"),
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
        mocktFn("config.get.source.local_and_global"),
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
        mocktFn("config.get.source.local"),
      );
      expect(mockPrintSettings).toHaveBeenCalledWith({});
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.yellow(mocktFn("list.templates.not_found")),
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
        new DevkitError(mocktFn("error.config.global.not.found")),
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
          mocktFn("error.command.mutually_exclusive_options", {
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

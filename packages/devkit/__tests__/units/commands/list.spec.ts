import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupListCommand } from "../../../src/commands/list.js";
import { mockSpinner, mockChalk } from "../../../vitest.setup.js";
import { DevkitError } from "../../../src/utils/errors/base.js";
import { t } from "../../../src/utils/internationalization/i18n.js";

const { mockHandleErrorAndExit, mockReadGlobalConfig, mockReadLocalConfig } =
  vi.hoisted(() => ({
    mockHandleErrorAndExit: vi.fn(),
    mockReadLocalConfig: vi.fn(),
    mockReadGlobalConfig: vi.fn(),
  }));

let actionFn: any;

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#utils/configs/reader.js", () => ({
  readLocalConfig: mockReadLocalConfig,
  readGlobalConfig: mockReadGlobalConfig,
}));

const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

describe("setupListCommand", () => {
  let mockProgram: any;

  const sampleLocalConfig = {
    templates: {
      javascript: {
        templates: {
          "vue-basic": {
            description: "A basic Vue template",
            location: "https://github.com/vuejs/vue",
            alias: "vb",
            cacheStrategy: "daily",
          },
          "react-basic": {
            description: "A basic React template",
            location: "https://github.com/facebook/react",
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

  const sampleGlobalConfig = {
    templates: {
      python: {
        templates: {
          "python-flask": {
            description: "A Python Flask API",
            location: "https://github.com/pallets/flask",
          },
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    actionFn = vi.fn();
    mockProgram = {
      command: vi.fn(() => mockProgram),
      alias: vi.fn(() => mockProgram),
      description: vi.fn(() => mockProgram),
      argument: vi.fn(() => mockProgram),
      option: vi.fn(() => mockProgram),
      action: vi.fn((fn) => {
        actionFn = fn;
        return mockProgram;
      }),
    };
  });

  it("should set up the list command with correct options and arguments", () => {
    setupListCommand({ program: mockProgram });
    expect(mockProgram.command).toHaveBeenCalledWith("list");
    expect(mockProgram.alias).toHaveBeenCalledWith("ls");
    expect(mockProgram.description).toHaveBeenCalledWith(
      "list.command.description",
    );
    expect(mockProgram.argument).toHaveBeenCalledWith(
      "[language]",
      expect.any(String),
      "",
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-g, --global",
      "list.command.global.option",
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-l, --local",
      "list.command.local.option",
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-a, --all",
      "list.command.all.option",
    );
  });

  describe("when no flags are provided (default behavior)", () => {
    it("should list templates from the local config if it exists", async () => {
      mockReadLocalConfig.mockResolvedValue({
        config: sampleLocalConfig,
        filePath: "/path/to/local",
        source: "local",
      });
      mockReadGlobalConfig.mockResolvedValue(null);

      setupListCommand({ program: mockProgram });
      await actionFn("", {});

      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.stop).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "\n",
        mockChalk.bold("list.templates.header"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `\n${mockChalk.blue.bold("JAVASCRIPT")}:`,
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(" - vue-basic "),
      );
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        `\n${mockChalk.blue.bold("PYTHON")}:`,
      );
      expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
    });

    it("should fallback to global config if no local config is found", async () => {
      mockReadLocalConfig.mockResolvedValue(null);
      mockReadGlobalConfig.mockResolvedValue({
        config: sampleGlobalConfig,
        filePath: "/path/to/global",
        source: "global",
      });

      setupListCommand({ program: mockProgram });
      await actionFn("", {});

      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.info).toHaveBeenCalledWith(
        "list.templates.using_global_fallback",
      );
      expect(mockSpinner.stop).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "\n",
        mockChalk.bold("list.templates.header"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `\n${mockChalk.blue.bold("PYTHON")}:`,
      );
      expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
    });

    it("should show a 'not found' message if both configs are empty", async () => {
      mockReadLocalConfig.mockResolvedValue(null);
      mockReadGlobalConfig.mockResolvedValue(null);

      setupListCommand({ program: mockProgram });
      await actionFn("", {});

      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mockChalk.yellow("list.templates.not_found"),
      );
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe("when flags are provided", () => {
    it("should list templates only from the local config with --local flag", async () => {
      mockReadLocalConfig.mockResolvedValue({
        config: sampleLocalConfig,
        filePath: "/path/to/local",
        source: "local",
      });
      mockReadGlobalConfig.mockResolvedValue({
        config: sampleGlobalConfig,
        filePath: "/path/to/global",
        source: "global",
      });

      setupListCommand({ program: mockProgram });
      await actionFn("", { local: true });

      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.info).toHaveBeenCalledWith(
        "list.templates.using_local",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `\n${mockChalk.blue.bold("JAVASCRIPT")}:`,
      );
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        `\n${mockChalk.blue.bold("PYTHON")}:`,
      );
    });

    it("should list templates only from the global config with --global flag", async () => {
      mockReadLocalConfig.mockResolvedValue({
        config: sampleLocalConfig,
        filePath: "/path/to/local",
        source: "local",
      });
      mockReadGlobalConfig.mockResolvedValue({
        config: sampleGlobalConfig,
        filePath: "/path/to/global",
        source: "global",
      });

      setupListCommand({ program: mockProgram });
      await actionFn("", { global: true });

      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.info).toHaveBeenCalledWith(
        "list.templates.using_global",
      );
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        `\n${mockChalk.blue.bold("JAVASCRIPT")}:`,
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `\n${mockChalk.blue.bold("PYTHON")}:`,
      );
    });

    it("should list templates from both configs with --all flag", async () => {
      mockReadLocalConfig.mockResolvedValue({
        config: sampleLocalConfig,
        filePath: "/path/to/local",
        source: "local",
      });
      mockReadGlobalConfig.mockResolvedValue({
        config: sampleGlobalConfig,
        filePath: "/path/to/global",
        source: "global",
      });

      setupListCommand({ program: mockProgram });
      await actionFn("", { all: true });

      expect(mockSpinner.start).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `\n${mockChalk.blue.bold("JAVASCRIPT")}:`,
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `\n${mockChalk.blue.bold("TYPESCRIPT")}:`,
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `\n${mockChalk.blue.bold("PYTHON")}:`,
      );
    });
  });

  describe("filtering by language", () => {
    beforeEach(() => {
      mockReadLocalConfig.mockResolvedValue({
        config: sampleLocalConfig,
        filePath: "/path/to/local",
        source: "local",
      });
      mockReadGlobalConfig.mockResolvedValue({
        config: sampleGlobalConfig,
        filePath: "/path/to/global",
        source: "global",
      });
    });

    it("should list templates for a specific language from all sources by default", async () => {
      setupListCommand({ program: mockProgram });
      await actionFn("javascript", {});

      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.stop).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `\n${mockChalk.blue.bold("JAVASCRIPT")}:`,
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(" - vue-basic "),
      );
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        `\n${mockChalk.blue.bold("TYPESCRIPT")}:`,
      );
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        `\n${mockChalk.blue.bold("PYTHON")}:`,
      );
      expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
    });

    it("should list templates for a specific language from both local and global with --all flag", async () => {
      setupListCommand({ program: mockProgram });
      await actionFn("python", { all: true });

      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.stop).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `\n${mockChalk.blue.bold("PYTHON")}:`,
      );
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        `\n${mockChalk.blue.bold("JAVASCRIPT")}:`,
      );
      expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      mockReadLocalConfig.mockResolvedValue({
        config: sampleLocalConfig,
        filePath: "/path/to/local",
        source: "local",
      });
      mockReadGlobalConfig.mockResolvedValue({
        config: sampleGlobalConfig,
        filePath: "/path/to/global",
        source: "global",
      });
    });

    it("should throw a DevkitError if the specified language is not found", async () => {
      setupListCommand({ program: mockProgram });
      await actionFn("go", {});

      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.stop).toHaveBeenCalled();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        new DevkitError(
          t("error.language_config_not_found", { language: "go" }),
        ),
        mockSpinner,
      );
    });

    it("should handle unexpected errors gracefully", async () => {
      const mockError = new Error("Unexpected error");
      vi.spyOn(Object, "entries").mockImplementationOnce(() => {
        throw mockError;
      });

      setupListCommand({ program: mockProgram });
      await actionFn("", {});

      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
    });
  });
});

import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupConfigGetCommand } from "../../../../src/commands/config/get.js";
import { mockSpinner, mockChalk } from "../../../../vitest.setup.js";
import type { CliConfig } from "../../../../src/utils/configs/schema.js";

const { mockHandleErrorAndExit, mockReadAndMergeConfigs } = vi.hoisted(() => ({
  mockHandleErrorAndExit: vi.fn(),
  mockReadAndMergeConfigs: vi.fn(),
}));

let actionFn: any;
vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#utils/configs/loader.js", () => ({
  readAndMergeConfigs: mockReadAndMergeConfigs,
}));

vi.mock("chalk", () => ({
  default: {
    cyan: vi.fn((message) => message),
    bold: {
      green: vi.fn((message) => message),
      yellow: vi.fn((message) => message),
    },
    white: vi.fn((message) => message),
    red: vi.fn((message) => message),
  },
}));

describe("setupConfigGetCommand", () => {
  let mockProgram: any;
  const initialConfig: CliConfig = {
    settings: {
      defaultPackageManager: "npm",
      cacheStrategy: "daily",
      language: "en",
    },
    templates: {},
  };

  const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    actionFn = vi.fn();
    mockProgram = {
      command: vi.fn(() => mockProgram),
      description: vi.fn(() => mockProgram),
      argument: vi.fn(() => mockProgram),
      option: vi.fn(() => mockProgram),
      action: vi.fn((fn) => {
        actionFn = fn;
        return mockProgram;
      }),
    };

    mockReadAndMergeConfigs.mockResolvedValue({
      config: JSON.parse(JSON.stringify(initialConfig)),
      source: "local",
    });
  });

  it("should set up the config get command correctly", () => {
    setupConfigGetCommand({
      program: mockProgram,
      config: initialConfig,
      source: "local",
    });
    expect(mockProgram.command).toHaveBeenCalledWith("get");
    expect(mockProgram.description).toHaveBeenCalledWith(
      "config.get.command.description",
    );
    expect(mockProgram.argument).toHaveBeenCalledWith(
      "[key]",
      "config.get.argument.description",
      "",
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-g, --global",
      "config.get.option.global",
      false,
    );
  });

  describe("get command action", () => {
    it("should print the entire local config when no key is provided", async () => {
      setupConfigGetCommand({
        program: mockProgram,
        config: initialConfig,
        source: "local",
      });
      await actionFn("", {});
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mockChalk.bold.green("config.get.success"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.bold.yellow("config.get.source.local"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.white(JSON.stringify(initialConfig.settings, null, 2)),
      );
      expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
    });

    it("should print a specific value for a valid key", async () => {
      setupConfigGetCommand({
        program: mockProgram,
        config: initialConfig,
        source: "local",
      });
      await actionFn("language", {});
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mockChalk.bold.green("config.get.success"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.cyan("language:"),
        mockChalk.white("en"),
      );
      expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
    });

    it("should use the canonical key when an alias is provided", async () => {
      setupConfigGetCommand({
        program: mockProgram,
        config: initialConfig,
        source: "local",
      });
      await actionFn("pm", {});
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.cyan("defaultPackageManager:"),
        mockChalk.white("npm"),
      );
    });

    it("should print an error message for an invalid key", async () => {
      setupConfigGetCommand({
        program: mockProgram,
        config: initialConfig,
        source: "local",
      });
      await actionFn("invalid-key", {});
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.red("config.get.not_found- options key:invalid-key"),
      );
    });

    it("should get from global config when --global flag is used", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: {
          ...initialConfig,
          settings: { ...initialConfig.settings, language: "fr" },
        },
        source: "global",
      });
      setupConfigGetCommand({
        program: mockProgram,
        config: initialConfig,
        source: "local",
      });
      await actionFn("language", { global: true });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.bold.yellow("config.get.source.global"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.cyan("language:"),
        mockChalk.white("fr"),
      );
    });

    it("should handle local fallback to global config", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: {
          ...initialConfig,
          settings: { ...initialConfig.settings, language: "fr" },
        },
        source: "global",
      });
      setupConfigGetCommand({
        program: mockProgram,
        config: initialConfig,
        source: "local",
      });
      await actionFn("language", { global: false });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.bold.yellow("config.get.fallback.local_to_global"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.cyan("language:"),
        mockChalk.white("fr"),
      );
    });

    it("should handle default fallback when --global is used and no config is found", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: initialConfig,
        source: "default",
      });
      setupConfigGetCommand({
        program: mockProgram,
        config: initialConfig,
        source: "local",
      });
      await actionFn("language", { global: true });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.bold.yellow("config.get.fallback.global"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.cyan("language:"),
        mockChalk.white("en"),
      );
    });

    it("should handle an error during the action", async () => {
      const mockError = new Error("Config read failed");
      mockReadAndMergeConfigs.mockRejectedValueOnce(mockError);
      setupConfigGetCommand({
        program: mockProgram,
        config: initialConfig,
        source: "local",
      });
      await actionFn("language", {});
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
    });
  });
});

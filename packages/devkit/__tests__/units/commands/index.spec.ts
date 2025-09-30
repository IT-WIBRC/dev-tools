import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockProgram, mockSpinner, mockLogger } from "../../../vitest.setup.js";
import { setupAndParse } from "../../../src/commands/index.js";
import type { CliConfig } from "../../../src/utils/schema/schema.js";

const {
  mockSetupInitCommand,
  mockSetupNewCommand,
  mockSetupConfigCommand,
  mockSetupListCommand,
  mockHandleErrorAndExit,
  mockReadAndMergeConfigs,
  mockSetupInfoCommand,
} = vi.hoisted(() => ({
  mockSetupInitCommand: vi.fn(),
  mockSetupNewCommand: vi.fn(),
  mockSetupConfigCommand: vi.fn(),
  mockSetupListCommand: vi.fn(),
  mockHandleErrorAndExit: vi.fn(),
  mockReadAndMergeConfigs: vi.fn(),
  mockSetupInfoCommand: vi.fn(),
}));

vi.mock("#commands/init.js", () => ({
  setupInitCommand: mockSetupInitCommand,
}));

vi.mock("#commands/new.js", () => ({
  setupNewCommand: mockSetupNewCommand,
}));

vi.mock("#commands/config/index.js", () => ({
  setupConfigCommand: mockSetupConfigCommand,
}));

vi.mock("#commands/list.js", () => ({
  setupListCommand: mockSetupListCommand,
}));

vi.mock("#commands/info.js", () => ({
  setupInfoCommand: mockSetupInfoCommand,
}));

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#core/info/project.js", () => ({
  getProjectVersion: vi.fn().mockResolvedValue("1.0.0"),
}));

vi.mock("#core/config/loader.js", () => ({
  readAndMergeConfigs: mockReadAndMergeConfigs,
}));

const warnSpy = mockLogger.warning;
const optsSpy = vi.spyOn(mockProgram, "opts");
const parseOptionsSpy = vi.spyOn(mockProgram, "parseOptions");

describe("index.ts (Entry point)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockedConfig: CliConfig = {
    settings: {
      cacheStrategy: "daily",
      defaultPackageManager: "bun",
      language: "en",
    },
    templates: {},
  } as const;

  describe("Initialization", () => {
    it("should initialize the CLI and set up commands correctly in non-verbose mode", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: { ...mockedConfig },
        source: "local",
      });
      optsSpy.mockReturnValue({});
      mockProgram.parse.mockReturnValue(mockProgram);

      await setupAndParse();
      await vi.runAllTimersAsync();

      expect(parseOptionsSpy).toHaveBeenCalledOnce();
      expect(mockSpinner.start).toHaveBeenCalledWith("");
      expect(mockSpinner.stop).toHaveBeenCalledOnce();
      expect(mockSpinner.succeed).not.toHaveBeenCalled();
    });

    it("should display a success message and info spinner in verbose mode", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: { ...mockedConfig },
        source: "local",
      });
      optsSpy.mockReturnValue({ verbose: true });
      mockProgram.parse.mockReturnValue(mockProgram);

      await setupAndParse();
      await vi.runAllTimersAsync();

      expect(parseOptionsSpy).toHaveBeenCalledOnce();
      expect(mockSpinner.start).toHaveBeenCalledWith("Initializing CLI...");
      expect(mockSpinner.succeed).toHaveBeenCalledOnce();
      expect(mockSpinner.stop).toHaveBeenCalled();
    });

    it("should display a warning if a default config is used (always visible)", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: { ...mockedConfig },
        source: "default",
      });
      optsSpy.mockReturnValue({});
      mockProgram.parse.mockReturnValue(mockProgram);

      await setupAndParse();
      await vi.runAllTimersAsync();

      expect(warnSpy).toHaveBeenCalledOnce();
      expect(warnSpy).toHaveBeenCalledWith("\nwarnings.not_found\n");
    });
  });

  describe("Command Setup and Execution", () => {
    it("should set up all commands with the correct arguments", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: { ...mockedConfig },
        source: "local",
      });
      optsSpy.mockReturnValueOnce({});
      mockProgram.parse.mockReturnValue(mockProgram);

      await setupAndParse();
      await vi.runAllTimersAsync();

      expect(mockSetupInitCommand).toHaveBeenCalledOnce();
      expect(mockSetupInitCommand).toHaveBeenCalledWith({
        config: mockedConfig,
        program: mockProgram,
      });

      expect(mockSetupNewCommand).toHaveBeenCalledOnce();
      expect(mockSetupNewCommand).toHaveBeenCalledWith({
        config: mockedConfig,
        program: mockProgram,
      });

      expect(mockSetupConfigCommand).toHaveBeenCalledOnce();
      expect(mockSetupConfigCommand).toHaveBeenCalledWith(mockProgram);

      expect(mockSetupListCommand).toHaveBeenCalledOnce();
      expect(mockSetupListCommand).toHaveBeenCalledWith({
        config: mockedConfig,
        program: mockProgram,
      });

      expect(mockSetupInfoCommand).toHaveBeenCalledOnce();
      expect(mockSetupInfoCommand).toHaveBeenCalledWith({
        config: mockedConfig,
        program: mockProgram,
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle and exit gracefully on an initialization error", async () => {
      const testError = new Error("Config load failed");
      mockReadAndMergeConfigs.mockRejectedValue(testError);
      optsSpy.mockReturnValue({});
      mockProgram.parse.mockReturnValue(mockProgram);

      await setupAndParse();
      await vi.runAllTimersAsync();

      expect(mockReadAndMergeConfigs).toHaveBeenCalledOnce();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        testError,
        mockSpinner,
      );
      expect(mockSpinner.succeed).not.toHaveBeenCalled();
      expect(mockProgram.parse).not.toHaveBeenCalled();
    });
  });
});

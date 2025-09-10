import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockProgram, mockSpinner } from "../../../vitest.setup.js";
import { setupAndParse } from "../../../src/commands/index.js";
import type { CliConfig } from "../../../src/utils/configs/schema.js";

const {
  mockSetupInitCommand,
  mockSetupNewCommand,
  mockSetupConfigCommand,
  mockSetupListCommand,
  mockSetupRemoveTemplateCommand,
  mockSetupAddTemplateCommand,
  mockHandleErrorAndExit,
  mockGetProjectVersion,
  mockGetLocaleFromConfigMinimal,
  mockLoadUserConfig,
  mockSetupConfigUpdateCommand,
} = vi.hoisted(() => ({
  mockSetupInitCommand: vi.fn(),
  mockSetupNewCommand: vi.fn(),
  mockSetupConfigCommand: vi.fn(),
  mockSetupListCommand: vi.fn(),
  mockSetupRemoveTemplateCommand: vi.fn(),
  mockSetupAddTemplateCommand: vi.fn(),
  mockHandleErrorAndExit: vi.fn(),
  mockGetProjectVersion: vi.fn(),
  mockLoadUserConfig: vi.fn(),
  mockGetLocaleFromConfigMinimal: vi.fn(),
  mockSetupConfigUpdateCommand: vi.fn(),
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

vi.mock("#commands/add-template.js", () => ({
  setupAddTemplateCommand: vi.fn(),
}));

vi.mock("#commands/removeTemplate.js", () => ({
  setupRemoveTemplateCommand: mockSetupRemoveTemplateCommand,
}));

vi.mock("#commands/add-template.js", () => ({
  setupAddTemplateCommand: mockSetupAddTemplateCommand,
}));

vi.mock("#commands/update.js", () => ({
  setupConfigUpdateCommand: mockSetupConfigUpdateCommand,
}));

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#utils/project.js", () => ({
  getProjectVersion: vi.fn().mockResolvedValue("1.0.0"),
}));

vi.mock("#utils/project.js", () => ({
  getProjectVersion: mockGetProjectVersion,
}));

vi.mock("#utils/configs/loader.js", () => ({
  getLocaleFromConfigMinimal: mockGetLocaleFromConfigMinimal,
  loadUserConfig: mockLoadUserConfig,
}));

const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
const optsSpy = vi.spyOn(mockProgram, "opts");
const parseOptionsSpy = vi.spyOn(mockProgram, "parseOptions");

describe("index.ts (Entry point)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    warnSpy.mockClear();
    mockSpinner.start.mockReturnValue(mockSpinner);
    mockSpinner.stop.mockReturnValue(mockSpinner);
    mockSpinner.succeed.mockReturnValue(mockSpinner);
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
      mockGetLocaleFromConfigMinimal.mockResolvedValueOnce("en");
      mockLoadUserConfig.mockResolvedValueOnce({
        config: { ...mockedConfig },
        source: "local",
      });
      optsSpy.mockReturnValue({});
      mockProgram.parse.mockReturnValue(mockProgram);

      await setupAndParse();
      await vi.runAllTimersAsync();

      expect(parseOptionsSpy).toHaveBeenCalledOnce();
      expect(mockSpinner.start).toHaveBeenCalledWith("");
      expect(mockSpinner.succeed).not.toHaveBeenCalled();
    });

    it("should display a success message and info spinner in verbose mode", async () => {
      mockGetLocaleFromConfigMinimal.mockResolvedValueOnce("en");
      mockLoadUserConfig.mockResolvedValueOnce({
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
      expect(mockSpinner.stop).not.toHaveBeenCalled();
    });

    it("should display a warning if a default config is used (always visible)", async () => {
      mockGetLocaleFromConfigMinimal.mockResolvedValue("en");
      mockLoadUserConfig.mockResolvedValue({
        config: { ...mockedConfig },
        source: "default",
      });
      optsSpy.mockReturnValue({});
      mockProgram.parse.mockReturnValue(mockProgram);

      await setupAndParse();
      await vi.runAllTimersAsync();

      expect(warnSpy).toHaveBeenCalledOnce();
      expect(warnSpy).toHaveBeenCalledWith(
        "\n",
        expect.stringContaining("warning.no_config_found"),
        "\n",
      );
    });
  });

  describe("Command Setup and Execution", () => {
    it("should set up all commands with the correct arguments", async () => {
      mockGetLocaleFromConfigMinimal.mockResolvedValue("en");
      mockLoadUserConfig.mockResolvedValue({
        config: { ...mockedConfig },
        source: "local",
      });
      optsSpy.mockReturnValue({});
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
      expect(mockSetupConfigCommand).toHaveBeenCalledWith({
        config: mockedConfig,
        program: mockProgram,
        source: "local",
      });

      expect(mockSetupListCommand).toHaveBeenCalledOnce();
      expect(mockSetupListCommand).toHaveBeenCalledWith({
        config: mockedConfig,
        program: mockProgram,
      });

      expect(mockSetupRemoveTemplateCommand).toHaveBeenCalledOnce();
      expect(mockSetupRemoveTemplateCommand).toHaveBeenCalledWith({
        config: mockedConfig,
        program: mockProgram,
        source: "local",
      });

      expect(mockSetupAddTemplateCommand).toHaveBeenCalledOnce();
      expect(mockSetupAddTemplateCommand).toHaveBeenCalledWith({
        config: mockedConfig,
        program: mockProgram,
        source: "local",
      });

      expect(mockSetupConfigUpdateCommand).toHaveBeenCalledOnce();
      expect(mockSetupConfigUpdateCommand).toHaveBeenCalledWith({
        config: mockedConfig,
        program: mockProgram,
        source: "local",
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle and exit gracefully on an initialization error", async () => {
      const testError = new Error("Config load failed");
      mockGetLocaleFromConfigMinimal.mockResolvedValue("en");
      mockLoadUserConfig.mockRejectedValue(testError);
      optsSpy.mockReturnValue({});
      mockProgram.parse.mockReturnValue(mockProgram);

      await setupAndParse();
      await vi.runAllTimersAsync();

      expect(mockLoadUserConfig).toHaveBeenCalled();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        testError,
        mockSpinner,
      );
      expect(mockSpinner.succeed).not.toHaveBeenCalled();
      expect(mockProgram.parse).not.toHaveBeenCalled();
    });
  });
});

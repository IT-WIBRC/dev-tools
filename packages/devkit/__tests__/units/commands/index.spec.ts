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
  mockReadConfigSources,
  mockSetupInfoCommand,
  mockLoadTranslations,
  mockT,
} = vi.hoisted(() => ({
  mockSetupInitCommand: vi.fn(),
  mockSetupNewCommand: vi.fn(),
  mockSetupConfigCommand: vi.fn(),
  mockSetupListCommand: vi.fn(),
  mockHandleErrorAndExit: vi.fn(),
  mockReadConfigSources: vi.fn(),
  mockSetupInfoCommand: vi.fn(),
  mockLoadTranslations: vi.fn().mockResolvedValue(undefined),
  mockT: vi.fn((key) => key),
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
  readConfigSources: mockReadConfigSources,
}));

vi.mock("#utils/i18n/translation-loader.js", () => ({
  loadTranslations: mockLoadTranslations,
}));

vi.mock("#utils/i18n/translator.js", () => ({
  t: mockT,
}));

const warnSpy = mockLogger.warning;
const optsSpy = vi.spyOn(mockProgram, "opts");
const parseOptionsSpy = vi.spyOn(mockProgram, "parseOptions");

const mockLocalConfig: Partial<CliConfig> = {
  settings: {
    language: "fr",
    cacheStrategy: "daily",
    defaultPackageManager: "bun",
  },
};
const mockGlobalConfig: Partial<CliConfig> = {
  settings: {
    language: "en",
    cacheStrategy: "never-refresh",
    defaultPackageManager: "npm",
  },
};
const mockDefaultConfig: CliConfig = {
  settings: {
    cacheStrategy: "daily",
    defaultPackageManager: "bun",
    language: "en",
  },
  templates: {},
} as const;

describe("index.ts (Entry point)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockProgram.parse.mockReturnValue(mockProgram);

    mockReadConfigSources.mockResolvedValue({
      local: mockLocalConfig,
      global: mockGlobalConfig,
      default: mockDefaultConfig,
      configFound: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Initialization", () => {
    it("should initialize the CLI and set up commands correctly in non-verbose mode", async () => {
      optsSpy.mockReturnValue({});

      await setupAndParse();
      await vi.runAllTimersAsync();

      expect(parseOptionsSpy).toHaveBeenCalledOnce();
      expect(mockSpinner.start).toHaveBeenCalledWith("");
      expect(mockSpinner.stop).toHaveBeenCalledOnce();
      expect(mockSpinner.succeed).not.toHaveBeenCalled();

      expect(mockLoadTranslations).toHaveBeenCalledWith("fr");
    });

    it("should display a success message and info spinner in verbose mode", async () => {
      optsSpy.mockReturnValue({ verbose: true });

      await setupAndParse();
      await vi.runAllTimersAsync();

      expect(parseOptionsSpy).toHaveBeenCalledOnce();
      expect(mockSpinner.start).toHaveBeenCalledWith(
        expect.stringContaining("program.status.initializing"),
      );
      expect(mockSpinner.succeed).toHaveBeenCalledOnce();
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        expect.stringContaining("messages.success.program_initialized"),
      );
      expect(mockSpinner.stop).toHaveBeenCalled();

      expect(mockLoadTranslations).toHaveBeenCalledWith("fr");
    });

    it("should prioritize local language setting for translations, then global, then null", async () => {
      mockReadConfigSources.mockResolvedValueOnce({
        local: { settings: { language: "fr" } },
        global: { settings: { language: "en" } },
        configFound: true,
      });
      await setupAndParse();
      await vi.runAllTimersAsync();
      expect(mockLoadTranslations).toHaveBeenCalledWith("fr");

      vi.clearAllMocks();
      mockReadConfigSources.mockResolvedValueOnce({
        local: null,
        global: { settings: { language: "es" } },
        configFound: true,
      });
      mockProgram.parse.mockReturnValue(mockProgram);
      await setupAndParse();
      await vi.runAllTimersAsync();
      expect(mockLoadTranslations).toHaveBeenCalledWith("es");

      vi.clearAllMocks();
      mockReadConfigSources.mockResolvedValueOnce({
        local: null,
        global: null,
        configFound: false,
      });
      mockProgram.parse.mockReturnValue(mockProgram);
      await setupAndParse();
      await vi.runAllTimersAsync();
      expect(mockLoadTranslations).toHaveBeenCalledWith(null);
    });

    it("should display a warning if configFound is false (always visible)", async () => {
      mockReadConfigSources.mockResolvedValue({
        local: null,
        global: null,
        default: mockDefaultConfig,
        configFound: false,
      });
      optsSpy.mockReturnValue({});

      await setupAndParse();
      await vi.runAllTimersAsync();

      expect(warnSpy).toHaveBeenCalledOnce();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("warnings.not_found"),
      );
    });
  });

  describe("Command Setup and Execution", () => {
    it("should set up all commands passing ONLY the program object", async () => {
      optsSpy.mockReturnValueOnce({});

      await setupAndParse();
      await vi.runAllTimersAsync();

      const expectedArg = { program: mockProgram };

      expect(mockSetupInitCommand).toHaveBeenCalledOnce();
      expect(mockSetupInitCommand).toHaveBeenCalledWith(expectedArg);

      expect(mockSetupNewCommand).toHaveBeenCalledOnce();
      expect(mockSetupNewCommand).toHaveBeenCalledWith(expectedArg);

      expect(mockSetupConfigCommand).toHaveBeenCalledOnce();
      expect(mockSetupConfigCommand).toHaveBeenCalledWith(mockProgram);

      expect(mockSetupListCommand).toHaveBeenCalledOnce();
      expect(mockSetupListCommand).toHaveBeenCalledWith(expectedArg);

      expect(mockSetupInfoCommand).toHaveBeenCalledOnce();
      expect(mockSetupInfoCommand).toHaveBeenCalledWith(expectedArg);

      expect(mockProgram.name).toHaveBeenCalledWith("devkit");
      expect(mockProgram.alias).toHaveBeenCalledWith("dk");
      expect(mockProgram.version).toHaveBeenCalledWith(
        "1.0.0",
        "-V, --version",
        "program.version.description",
      );
      expect(mockProgram.parse).toHaveBeenCalledOnce();
    });
  });

  describe("Error Handling", () => {
    it("should handle and exit gracefully on an initialization error", async () => {
      const testError = new Error("Config load failed");
      mockReadConfigSources.mockRejectedValue(testError);
      optsSpy.mockReturnValue({});

      await setupAndParse();
      await vi.runAllTimersAsync();

      expect(mockReadConfigSources).toHaveBeenCalledOnce();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        testError,
        mockSpinner,
      );
      expect(mockProgram.parse).not.toHaveBeenCalled();
      expect(mockLoadTranslations).not.toHaveBeenCalled();
    });
  });
});

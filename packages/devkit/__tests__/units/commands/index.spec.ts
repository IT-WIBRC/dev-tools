import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockProgram, mockSpinner, mockLogger } from "../../../vitest.setup.js";
import { setupAndParse } from "../../../src/commands/index.js";
import type { CliConfig } from "../../../src/utils/schema/schema.js";
import { ConfigError } from "../../../src/utils/errors/base.js";

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
  mockValidateConfig,
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
  mockValidateConfig: vi.fn(),
}));

vi.mock("#commands/init/index.js", () => ({
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

vi.mock("#core/config/validation.js", () => ({
  validateConfig: mockValidateConfig,
}));

vi.mock("#utils/i18n/translation-loader.js", () => ({
  loadTranslations: mockLoadTranslations,
}));

vi.mock("#utils/i18n/translator.js", () => ({
  t: mockT,
}));

const warnSpy = mockLogger.warning;
const optsSpy = vi.spyOn(mockProgram, "opts");

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

    mockValidateConfig.mockImplementation((config) => config);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Initialization and Translation Loading", () => {
    it("should call loadTranslations twice: once for system locale, once for config locale", async () => {
      optsSpy.mockReturnValue({});

      await setupAndParse();
      await vi.runAllTimersAsync();

      expect(mockLoadTranslations).toHaveBeenNthCalledWith(1, null);

      expect(mockLoadTranslations).toHaveBeenNthCalledWith(2, "fr");
    });

    it("should successfully validate local and global configs before reading language setting", async () => {
      optsSpy.mockReturnValue({});

      await setupAndParse();
      await vi.runAllTimersAsync();

      expect(mockValidateConfig).toHaveBeenCalledTimes(2);
      expect(mockValidateConfig).toHaveBeenCalledWith(mockLocalConfig);
      expect(mockValidateConfig).toHaveBeenCalledWith(mockGlobalConfig);

      expect(mockLoadTranslations).toHaveBeenNthCalledWith(2, "fr");
    });

    it("should prioritize local language setting, then global, then null/os-locale", async () => {
      mockReadConfigSources.mockResolvedValueOnce({
        local: { settings: { language: "fr" } },
        global: { settings: { language: "en" } },
        configFound: true,
      });
      mockValidateConfig
        .mockResolvedValueOnce({ settings: { language: "fr" } })
        .mockResolvedValueOnce({ settings: { language: "en" } });

      await setupAndParse();
      await vi.runAllTimersAsync();
      expect(mockLoadTranslations).toHaveBeenNthCalledWith(2, "fr");

      vi.clearAllMocks();
      mockReadConfigSources.mockResolvedValueOnce({
        local: null,
        global: { settings: { language: "es" } },
        configFound: true,
      });
      mockValidateConfig.mockResolvedValueOnce({
        settings: { language: "es" },
      });
      mockProgram.parse.mockReturnValue(mockProgram);
      await setupAndParse();
      await vi.runAllTimersAsync();
      expect(mockLoadTranslations).toHaveBeenNthCalledWith(1, null);
      expect(mockLoadTranslations).toHaveBeenNthCalledWith(2, "es");

      vi.clearAllMocks();
      mockReadConfigSources.mockResolvedValueOnce({
        local: { settings: { some_other_setting: true } },
        global: null,
        configFound: true,
      });
      mockValidateConfig.mockResolvedValueOnce({
        settings: { some_other_setting: true },
      });
      mockProgram.parse.mockReturnValue(mockProgram);
      await setupAndParse();
      await vi.runAllTimersAsync();
      expect(mockLoadTranslations).toHaveBeenNthCalledWith(1, null);
      expect(mockLoadTranslations).toHaveBeenNthCalledWith(2, null);
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

  describe("Error Handling", () => {
    it("should handle and exit gracefully on a validation error (ConfigError)", async () => {
      const testError = new ConfigError("Template is malformed");

      mockValidateConfig.mockRejectedValue(testError);
      optsSpy.mockReturnValue({});

      await setupAndParse();
      await vi.runAllTimersAsync();

      expect(mockLoadTranslations).toHaveBeenNthCalledWith(1, null);

      expect(mockValidateConfig).toHaveBeenCalledOnce();

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        testError,
        mockSpinner,
      );

      expect(mockProgram.parse).not.toHaveBeenCalled();
    });

    it("should handle and exit gracefully on an initialization error (Read Error)", async () => {
      const testError = new Error("Config load failed");
      mockReadConfigSources.mockRejectedValue(testError);
      optsSpy.mockReturnValue({});

      await setupAndParse();
      await vi.runAllTimersAsync();

      expect(mockLoadTranslations).toHaveBeenNthCalledWith(1, null);

      expect(mockReadConfigSources).toHaveBeenCalledOnce();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        testError,
        mockSpinner,
      );
      expect(mockProgram.parse).not.toHaveBeenCalled();

      expect(mockValidateConfig).not.toHaveBeenCalled();
    });
  });

  describe("Command Setup and Execution", () => {
    it("should set up all commands passing ONLY the program object", async () => {
      optsSpy.mockReturnValueOnce({});

      await setupAndParse();
      await vi.runAllTimersAsync();

      const expectedArg = { program: mockProgram };

      expect(mockSetupInitCommand).toHaveBeenCalledWith(expectedArg);
      expect(mockSetupNewCommand).toHaveBeenCalledWith(expectedArg);
      expect(mockSetupConfigCommand).toHaveBeenCalledWith(mockProgram);
      expect(mockSetupListCommand).toHaveBeenCalledWith(expectedArg);
      expect(mockSetupInfoCommand).toHaveBeenCalledWith(expectedArg);

      expect(mockProgram.name).toHaveBeenCalledWith("devkit");
      expect(mockProgram.parse).toHaveBeenCalledOnce();
    });
  });
});

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mockProgram,
  mockSpinner,
  mockLoadTranslations,
} from "../../../vitest.setup.js";
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

describe("index.ts (Entry point)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    warnSpy.mockClear();
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

  describe("Successful Execution", () => {
    it("should initialize the CLI, load config, and set up commands correctly", async () => {
      mockGetLocaleFromConfigMinimal.mockResolvedValueOnce("en");
      mockLoadUserConfig.mockResolvedValueOnce({
        config: { ...mockedConfig },
        source: "local",
      });

      await setupAndParse();
      await vi.runAllTimersAsync();

      expect(mockGetProjectVersion).toHaveBeenCalled();
      expect(mockLoadUserConfig).toHaveBeenCalledOnce();
      expect(mockLoadTranslations).toHaveBeenCalledOnce();

      expect(mockSpinner.start).toHaveBeenCalledOnce();
      expect(mockSpinner.succeed).toHaveBeenCalledOnce();

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

      expect(mockProgram.parse).toHaveBeenCalledOnce();
      expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
    });

    it("should display a warning if a default config is used", async () => {
      mockGetLocaleFromConfigMinimal.mockResolvedValue("en");
      mockLoadUserConfig.mockResolvedValue({
        config: { ...mockedConfig },
        source: "default",
      });

      const setupPromise = setupAndParse();
      await vi.runAllTimersAsync();
      await setupPromise;

      expect(mockLoadUserConfig).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(warnSpy).toHaveBeenCalledWith(
        "\n\n",
        expect.stringContaining("warning.no_config_found"),
        "\n",
      );
      expect(mockSpinner.succeed).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle and exit gracefully on an initialization error", async () => {
      const testError = new Error("Config load failed");
      mockGetLocaleFromConfigMinimal.mockResolvedValue("en");
      mockLoadUserConfig.mockRejectedValue(testError);

      const setupPromise = setupAndParse();
      await vi.runAllTimersAsync();
      await setupPromise;

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

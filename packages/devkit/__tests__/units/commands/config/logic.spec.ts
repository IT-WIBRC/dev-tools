import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleNonInteractiveSettingsUpdate,
  handleNonInteractiveTemplateUpdate,
} from "../../../../src/commands/config/logic.js";
import { VALID_CACHE_STRATEGIES } from "../../../../src/utils/schema/schema.js";
import { DevkitError } from "../../../../src/utils/errors/base.js";
import { mocktFn } from "../../../../vitest.setup.js";
import type { CliConfig } from "../../../../src/utils/schema/schema.js";

const {
  mockReadConfigSources,
  mockSaveGlobalConfig,
  mockSaveLocalConfig,
  mockValidateConfigValue,
  mockValidateAlias,
  mockValidateDescription,
  mockValidateLocation,
  mockValidatePackageManager,
  mockValidateCacheStrategy,
  mockValidateProgrammingLanguage,
} = vi.hoisted(() => ({
  mockReadConfigSources: vi.fn(),
  mockSaveGlobalConfig: vi.fn(),
  mockSaveLocalConfig: vi.fn(),
  mockValidateConfigValue: vi.fn(),
  mockValidateAlias: vi.fn(),
  mockValidateDescription: vi.fn(),
  mockValidateLocation: vi.fn(),
  mockValidatePackageManager: vi.fn(),
  mockValidateCacheStrategy: vi.fn(),
  mockValidateProgrammingLanguage: vi.fn(),
}));

vi.mock("#core/config/loader.js", () => ({
  readConfigSources: mockReadConfigSources,
}));

vi.mock("#core/config/writer.js", () => ({
  saveGlobalConfig: mockSaveGlobalConfig,
  saveLocalConfig: mockSaveLocalConfig,
}));

vi.mock("#utils/validations/validateConfigValue.js", () => ({
  validateConfigValue: mockValidateConfigValue,
}));

vi.mock("#utils/validations/templates.js", () => ({
  validateAlias: mockValidateAlias,
  validateDescription: mockValidateDescription,
  validateLocation: mockValidateLocation,
}));

vi.mock("#utils/validations/config.js", () => ({
  validatePackageManager: mockValidatePackageManager,
  validateCacheStrategy: mockValidateCacheStrategy,
  validateProgrammingLanguage: mockValidateProgrammingLanguage,
}));

vi.mock("deepmerge", () => ({
  default: vi.fn((target, source) => ({ ...target, ...source })),
}));

const baseConfig: CliConfig = {
  settings: {
    language: "en",
    defaultPackageManager: "npm",
    cacheStrategy: "daily",
  },
  templates: {
    typescript: {
      templates: {
        web: {
          description: "A web template",
          location: "https://example.com/web",
          alias: "w",
          cacheStrategy: "always-refresh",
          packageManager: "npm",
        },
        cli: {
          description: "A CLI template",
          location: "https://example.com/cli",
        },
      },
    },
  },
} as const;

const createMockSources = (
  targetType: "local" | "global" | "default",
): ReturnType<typeof mockReadConfigSources> => {
  const local = targetType === "local" ? structuredClone(baseConfig) : null;
  const global = targetType === "global" ? structuredClone(baseConfig) : null;
  return Promise.resolve({
    local,
    global,
    default: structuredClone(baseConfig),
    configFound: targetType !== "default",
  });
};

describe("Non-interactive Config Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateAlias.mockReturnValue(undefined);
    mockValidateDescription.mockReturnValue(undefined);
    mockValidateLocation.mockReturnValue(undefined);
    mockValidatePackageManager.mockReturnValue(undefined);
    mockValidateCacheStrategy.mockReturnValue(undefined);
  });

  describe("handleNonInteractiveSettingsUpdate", () => {
    it("should update a global setting successfully", async () => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources("global"),
      );
      mockSaveGlobalConfig.mockResolvedValueOnce(undefined);

      await handleNonInteractiveSettingsUpdate("language", "fr", true);

      expect(mockReadConfigSources).toHaveBeenCalledWith({
        forceGlobal: true,
        forceLocal: false,
      });

      expect(mockValidateConfigValue).toHaveBeenCalledOnce();
      expect(mockValidateConfigValue).toHaveBeenCalledWith("language", "fr");

      expect(mockSaveGlobalConfig).toHaveBeenCalledOnce();
      const updatedConfig = mockSaveGlobalConfig.mock.calls[0]![0];
      expect(updatedConfig.settings.language).toBe("fr");
    });

    it("should update a local setting successfully", async () => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources("local"),
      );
      mockSaveLocalConfig.mockResolvedValueOnce(undefined);

      await handleNonInteractiveSettingsUpdate("language", "fr", false);

      expect(mockReadConfigSources).toHaveBeenCalledWith({
        forceGlobal: false,
        forceLocal: true,
      });

      expect(mockValidateConfigValue).toHaveBeenCalledOnce();
      expect(mockValidateConfigValue).toHaveBeenCalledWith("language", "fr");

      expect(mockSaveLocalConfig).toHaveBeenCalledOnce();
      const updatedConfig = mockSaveLocalConfig.mock.calls[0]![0];
      expect(updatedConfig.settings.language).toBe("fr");
    });

    it("should throw an error if local config is not found (isGlobal=false)", async () => {
      mockReadConfigSources.mockResolvedValue({
        local: null,
        global: structuredClone(baseConfig),
        default: structuredClone(baseConfig),
        configFound: true,
      });

      await expect(
        handleNonInteractiveSettingsUpdate("language", "fr", false),
      ).rejects.toThrow(
        new DevkitError(mocktFn("errors.config.local_not_found")),
      );

      expect(mockReadConfigSources).toHaveBeenCalledWith({
        forceGlobal: false,
        forceLocal: true,
      });
      expect(mockValidateConfigValue).not.toHaveBeenCalledOnce();
    });

    it("should throw an error if global config is not found (isGlobal=true)", async () => {
      mockReadConfigSources.mockResolvedValue({
        local: structuredClone(baseConfig),
        global: null,
        default: structuredClone(baseConfig),
        configFound: true,
      });

      await expect(
        handleNonInteractiveSettingsUpdate("language", "fr", true),
      ).rejects.toThrow(new DevkitError(mocktFn("errors.config.not_found")));

      expect(mockReadConfigSources).toHaveBeenCalledWith({
        forceGlobal: true,
        forceLocal: false,
      });
      expect(mockValidateConfigValue).not.toHaveBeenCalledOnce();
    });

    it("should use the canonical key for an alias", async () => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources("local"),
      );
      mockSaveLocalConfig.mockResolvedValue(undefined);

      await handleNonInteractiveSettingsUpdate("packageManager", "bun", false);

      expect(mockSaveLocalConfig).toHaveBeenCalledOnce();
      const updatedConfig = mockSaveLocalConfig.mock.calls[0]![0];
      expect(updatedConfig.settings.defaultPackageManager).toBe("bun");

      expect(mockValidateConfigValue).toHaveBeenCalledWith(
        "defaultPackageManager",
        "bun",
      );
    });
  });

  describe("handleNonInteractiveTemplateUpdate", () => {
    beforeEach(() => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources("local"),
      );
      mockSaveLocalConfig.mockResolvedValue(undefined);
    });

    it("should update a single template property successfully (calls validation)", async () => {
      await handleNonInteractiveTemplateUpdate(
        "typescript",
        "web",
        { description: "A new description" },
        false,
      );

      expect(mockValidateDescription).toHaveBeenCalledWith("A new description");

      expect(mockSaveLocalConfig).toHaveBeenCalled();
      const updatedConfig = mockSaveLocalConfig.mock.calls[0]![0];
      expect(updatedConfig.templates.typescript.templates.web.description).toBe(
        "A new description",
      );
    });

    it("should update a template property by alias name successfully", async () => {
      await handleNonInteractiveTemplateUpdate(
        "typescript",
        "w",
        { description: "Updated via alias" },
        false,
      );

      expect(mockSaveLocalConfig).toHaveBeenCalled();
      const updatedConfig = mockSaveLocalConfig.mock.calls[0]![0];
      expect(updatedConfig.templates.typescript.templates.web.description).toBe(
        "Updated via alias",
      );
    });

    it("should delete a template property if value is 'null' (alias)", async () => {
      await handleNonInteractiveTemplateUpdate(
        "typescript",
        "web",
        { alias: "null" },
        false,
      );

      expect(mockValidateAlias).not.toHaveBeenCalled();

      expect(mockSaveLocalConfig).toHaveBeenCalled();
      const updatedConfig = mockSaveLocalConfig.mock.calls[0]![0];
      expect(
        updatedConfig.templates.typescript.templates.web.alias,
      ).toBeUndefined();
    });

    it("should delete a template property if value is 'null' (cacheStrategy)", async () => {
      await handleNonInteractiveTemplateUpdate(
        "typescript",
        "web",
        { cacheStrategy: "null" },
        false,
      );

      expect(mockValidateCacheStrategy).not.toHaveBeenCalled();

      expect(mockSaveLocalConfig).toHaveBeenCalled();
      const updatedConfig = mockSaveLocalConfig.mock.calls[0]![0];
      expect(
        updatedConfig.templates.typescript.templates.web.cacheStrategy,
      ).toBeUndefined();
    });

    it("should rename a template successfully", async () => {
      await handleNonInteractiveTemplateUpdate(
        "typescript",
        "web",
        { newName: "new-name" },
        false,
      );

      expect(mockSaveLocalConfig).toHaveBeenCalled();
      const updatedConfig = mockSaveLocalConfig.mock.calls[0]![0];
      expect(
        updatedConfig.templates.typescript.templates["new-name"],
      ).toBeDefined();
      expect(updatedConfig.templates.typescript.templates.web).toBeUndefined();
    });

    it("should throw an error if local config is not found", async () => {
      mockReadConfigSources.mockResolvedValue({
        local: null,
        global: structuredClone(baseConfig),
        default: structuredClone(baseConfig),
        configFound: true,
      });

      await expect(
        handleNonInteractiveTemplateUpdate(
          "typescript",
          "web",
          { newName: "new-name" },
          false,
        ),
      ).rejects.toThrow(
        new DevkitError(mocktFn("errors.config.local_not_found")),
      );

      expect(mockReadConfigSources).toHaveBeenCalledWith({
        forceGlobal: false,
        forceLocal: true,
      });

      expect(mockValidateConfigValue).not.toHaveBeenCalledOnce();
    });

    it("should throw an error if global config is not found (isGlobal=true)", async () => {
      mockReadConfigSources.mockResolvedValue({
        local: structuredClone(baseConfig),
        global: null,
        default: structuredClone(baseConfig),
        configFound: true,
      });

      await expect(
        handleNonInteractiveTemplateUpdate(
          "typescript",
          "web",
          { newName: "new-name" },
          true,
        ),
      ).rejects.toThrow(new DevkitError(mocktFn("errors.config.not_found")));

      expect(mockReadConfigSources).toHaveBeenCalledWith({
        forceGlobal: true,
        forceLocal: false,
      });
      expect(mockValidateConfigValue).not.toHaveBeenCalledOnce();
    });

    it("should throw an error if the programming language is not found in templates (but exists in config)", async () => {
      mockReadConfigSources.mockResolvedValue({
        local: { ...structuredClone(baseConfig), templates: {} },
        global: null,
        default: structuredClone(baseConfig),
        configFound: true,
      });

      await expect(
        handleNonInteractiveTemplateUpdate(
          "javascript",
          "web",
          { newName: "new-name" },
          false,
        ),
      ).rejects.toThrow(
        new DevkitError(
          mocktFn("errors.template.not_found", { template: "web" }),
        ),
      );
    });

    it("should throw an error for an invalid template name (template not found)", async () => {
      await expect(
        handleNonInteractiveTemplateUpdate("typescript", "unknown", {}, false),
      ).rejects.toThrow(
        new DevkitError(
          mocktFn("errors.template.not_found", { template: "unknown" }),
        ),
      );
    });

    it("should throw an error for an invalid cache strategy value", async () => {
      const cacheStrategyError = new DevkitError(
        mocktFn("errors.validation.invalid_cache_strategy", {
          value: "invalid_strategy",
          options: VALID_CACHE_STRATEGIES.join(", "),
        }),
      );
      mockValidateCacheStrategy.mockImplementationOnce(() => {
        throw cacheStrategyError;
      });

      await expect(
        handleNonInteractiveTemplateUpdate(
          "typescript",
          "web",
          { cacheStrategy: "invalid_strategy" },
          false,
        ),
      ).rejects.toThrow(cacheStrategyError);
      expect(mockValidateCacheStrategy).toHaveBeenCalledWith(
        "invalid_strategy",
      );
    });

    it("should throw an error for an invalid location value", async () => {
      const locationError = new DevkitError(
        mocktFn("errors.validation.invalid_location", {
          value: "invalid_url",
        }),
      );
      mockValidateLocation.mockImplementationOnce(() => {
        throw locationError;
      });

      await expect(
        handleNonInteractiveTemplateUpdate(
          "typescript",
          "web",
          { location: "invalid_url" },
          false,
        ),
      ).rejects.toThrow(locationError);
      expect(mockValidateLocation).toHaveBeenCalledWith("invalid_url");
    });

    it("should throw an error for an invalid alias value", async () => {
      const aliasError = new DevkitError(
        mocktFn("errors.validation.invalid_alias", {
          alias: "a",
        }),
      );
      mockValidateAlias.mockImplementationOnce(() => {
        throw aliasError;
      });

      await expect(
        handleNonInteractiveTemplateUpdate(
          "typescript",
          "web",
          { alias: "a" },
          false,
        ),
      ).rejects.toThrow(aliasError);
      expect(mockValidateAlias).toHaveBeenCalledWith("a");
    });

    it("should throw an error for an invalid 'packageManager' value", async () => {
      const pmError = new DevkitError(
        mocktFn("errors.validation.invalid_pm", {
          packageManager: "pm",
        }),
      );
      mockValidatePackageManager.mockImplementationOnce(() => {
        throw pmError;
      });

      await expect(
        handleNonInteractiveTemplateUpdate(
          "typescript",
          "web",
          { packageManager: "pm" },
          false,
        ),
      ).rejects.toThrow(pmError);
      expect(mockValidatePackageManager).toHaveBeenCalledWith("pm");
    });

    it("should throw an error if the new name already exists", async () => {
      await expect(
        handleNonInteractiveTemplateUpdate(
          "typescript",
          "web",
          { newName: "cli" },
          false,
        ),
      ).rejects.toThrow(
        new DevkitError(mocktFn("errors.template.exists", { template: "cli" })),
      );
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleNonInteractiveSettingsUpdate,
  handleNonInteractiveTemplateUpdate,
} from "../../../../src/commands/config/logic.js";
import {
  VALID_CACHE_STRATEGIES,
  PackageManagers,
} from "../../../../src/utils/schema/schema.js";
import deepmerge from "deepmerge";
import { DevkitError } from "../../../../src/utils/errors/base.js";
import { mocktFn } from "../../../../vitest.setup.js";
import {
  validateAlias,
  validateDescription,
  validateLocation,
} from "../../../../src/utils/validations/templates.js";
import {
  validatePackageManager,
  validateCacheStrategy,
} from "../../../../src/utils/validations/config.js";

const {
  mockReadAndMergeConfigs,
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
  mockReadAndMergeConfigs: vi.fn(),
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
  readAndMergeConfigs: mockReadAndMergeConfigs,
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

describe("Non-interactive Config Logic", () => {
  const baseConfig = {
    settings: {
      language: "en",
      defaultPackageManager: "npm",
    },
    templates: {
      typescript: {
        templates: {
          web: {
            description: "A web template",
            location: "https://example.com/web",
            alias: "w",
            cacheStrategy: "network_only",
            packageManager: "npm",
          },
          cli: {
            description: "A CLI template",
            location: "https://example.com/cli",
          },
        },
      },
    },
  };

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
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: structuredClone(baseConfig),
        source: "global",
      });
      mockSaveGlobalConfig.mockResolvedValueOnce(undefined);

      await handleNonInteractiveSettingsUpdate("language", "fr", true);

      expect(mockReadAndMergeConfigs).toHaveBeenCalledOnce();
      expect(mockReadAndMergeConfigs).toHaveBeenCalledWith({
        forceGlobal: true,
      });

      expect(mockValidateConfigValue).toHaveBeenCalledOnce();
      expect(mockValidateConfigValue).toHaveBeenCalledWith("language", "fr");

      expect(mockSaveGlobalConfig).toHaveBeenCalledOnce();
      const updatedConfig = mockSaveGlobalConfig.mock.calls[0]![0];
      expect(updatedConfig.settings.language).toBe("fr");
    });

    it("should update a local setting successfully", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: structuredClone(baseConfig),
        source: "local",
      });
      mockSaveLocalConfig.mockResolvedValueOnce(undefined);

      await handleNonInteractiveSettingsUpdate("language", "fr", false);

      expect(mockReadAndMergeConfigs).toHaveBeenCalledOnce();
      expect(mockReadAndMergeConfigs).toHaveBeenCalledWith({
        forceGlobal: false,
      });

      expect(mockValidateConfigValue).toHaveBeenCalledOnce();
      expect(mockValidateConfigValue).toHaveBeenCalledWith("language", "fr");

      expect(mockSaveLocalConfig).toHaveBeenCalledOnce();
      const updatedConfig = mockSaveLocalConfig.mock.calls[0]![0];
      expect(updatedConfig.settings.language).toBe("fr");
    });

    it("should throw an error if local config is not found", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: structuredClone(baseConfig),
        source: "default",
      });

      await expect(
        handleNonInteractiveSettingsUpdate("language", "fr", false),
      ).rejects.toThrow(
        new DevkitError(mocktFn("errors.config.local_not_found")),
      );

      expect(mockReadAndMergeConfigs).toHaveBeenCalledOnce();
      expect(mockReadAndMergeConfigs).toHaveBeenCalledWith({
        forceGlobal: false,
      });

      expect(mockValidateConfigValue).not.toHaveBeenCalledOnce();
    });

    it("should use the canonical key for an alias", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: structuredClone(baseConfig),
        source: "local",
      });
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
    it("should update a single template property successfully (calls validation)", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: structuredClone(baseConfig),
        source: "local",
      });

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

    it("should delete a template property if value is 'null' (alias)", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: structuredClone(baseConfig),
        source: "local",
      });

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

    it("should rename a template successfully", async () => {
      const initialConfig = structuredClone(baseConfig);
      mockReadAndMergeConfigs.mockResolvedValue({
        config: initialConfig,
        source: "local",
      });

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
      mockReadAndMergeConfigs.mockResolvedValue({
        config: structuredClone(baseConfig),
        source: "default",
      });
      mockValidateProgrammingLanguage.mockReturnValueOnce(undefined);

      await expect(
        handleNonInteractiveTemplateUpdate(
          "javascript",
          "web",
          { newName: "new-name" },
          false,
        ),
      ).rejects.toThrow(
        new DevkitError(mocktFn("errors.config.local_not_found")),
      );

      expect(mockReadAndMergeConfigs).toHaveBeenCalledOnce();
      expect(mockReadAndMergeConfigs).toHaveBeenCalledWith({
        forceGlobal: false,
      });

      expect(mockValidateConfigValue).not.toHaveBeenCalledOnce();
    });

    it("should throw an error if there is no template inside fro this programming language", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: {
          ...structuredClone(baseConfig),
          templates: {},
        },
        source: "local",
      });
      mockValidateProgrammingLanguage.mockReturnValueOnce(undefined);

      await expect(
        handleNonInteractiveTemplateUpdate(
          "javascript",
          "web",
          { newName: "new-name" },
          false,
        ),
      ).rejects.toThrow(
        new DevkitError(
          mocktFn("errors.template.language_not_found", {
            language: "javascript",
          }),
        ),
      );

      expect(mockReadAndMergeConfigs).toHaveBeenCalledOnce();
      expect(mockReadAndMergeConfigs).toHaveBeenCalledWith({
        forceGlobal: false,
      });

      expect(mockValidateConfigValue).not.toHaveBeenCalledOnce();
    });

    it("should throw an error for an invalid template name", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: structuredClone(baseConfig),
        source: "local",
      });

      await expect(
        handleNonInteractiveTemplateUpdate("typescript", "unknown", {}, false),
      ).rejects.toThrow(
        new DevkitError(
          mocktFn("errors.template.not_found", { template: "unknown" }),
        ),
      );
    });

    it("should throw an error for an invalid cache strategy value", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: structuredClone(baseConfig),
        source: "local",
      });

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
      mockReadAndMergeConfigs.mockResolvedValue({
        config: structuredClone(baseConfig),
        source: "local",
      });

      const locationError = new DevkitError(
        mocktFn("errors.validation.invalid_location", {
          value: "location",
        }),
      );
      mockValidateLocation.mockImplementationOnce(() => {
        throw locationError;
      });

      await expect(
        handleNonInteractiveTemplateUpdate(
          "typescript",
          "web",
          {
            description: "A great description",
            cacheStrategy: "daily" as "null",
            location: "location",
          },
          false,
        ),
      ).rejects.toThrow(locationError);
      expect(mockValidateLocation).toHaveBeenCalledWith("location");
    });

    it("should throw an error for an invalid alias value", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: structuredClone(baseConfig),
        source: "local",
      });

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
          {
            description: "A great description",
            cacheStrategy: "daily" as "null",
            location: "location",
            alias: "a",
          },
          false,
        ),
      ).rejects.toThrow(aliasError);
      expect(mockValidateAlias).toHaveBeenCalledWith("a");
    });

    it("should throw an error for an invalid 'packageManager' value", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: structuredClone(baseConfig),
        source: "local",
      });

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
          {
            description: "A great description",
            cacheStrategy: "daily" as "null",
            location: "location",
            alias: "a",
            packageManager: "pm",
          },
          false,
        ),
      ).rejects.toThrow(pmError);
      expect(mockValidatePackageManager).toHaveBeenCalledWith("pm");
    });

    it("should throw an error if the new name already exists", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: structuredClone(baseConfig),
        source: "local",
      });

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

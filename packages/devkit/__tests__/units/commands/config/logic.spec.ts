import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleNonInteractiveSettingsUpdate,
  handleNonInteractiveTemplateUpdate,
} from "../../../../src/commands/config/logic.js";
import { VALID_CACHE_STRATEGIES } from "../../../../src/utils/schema/schema.js";
import deepmerge from "deepmerge";
import { DevkitError } from "../../../../src/utils/errors/base.js";
import { mocktFn } from "../../../../vitest.setup.js";

const {
  mockReadAndMergeConfigs,
  mockSaveGlobalConfig,
  mockSaveLocalConfig,
  mockValidateConfigValue,
} = vi.hoisted(() => ({
  mockReadAndMergeConfigs: vi.fn(),
  mockSaveGlobalConfig: vi.fn(),
  mockSaveLocalConfig: vi.fn(),
  mockValidateConfigValue: vi.fn(),
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

vi.mock("deepmerge");

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
      ).rejects.toThrow(new DevkitError("error.config.local.not.found"));

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
    });
  });

  describe("handleNonInteractiveTemplateUpdate", () => {
    it("should update a single template property successfully", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: baseConfig,
        source: "local",
      });
      vi.mocked(deepmerge).mockReturnValueOnce({
        ...baseConfig.templates.typescript.templates.web,
        description: "A new description",
      });

      await handleNonInteractiveTemplateUpdate(
        "typescript",
        "web",
        { description: "A new description" },
        false,
      );

      expect(mockSaveLocalConfig).toHaveBeenCalled();
      const updatedConfig = mockSaveLocalConfig.mock.calls[0]![0];
      expect(updatedConfig.templates.typescript.templates.web.description).toBe(
        "A new description",
      );
    });

    it("should delete a template property if value is 'null'", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: structuredClone(baseConfig),
        source: "local",
      });
      vi.mocked(deepmerge).mockReturnValue({
        ...baseConfig.templates.typescript.templates.web,
      });

      await handleNonInteractiveTemplateUpdate(
        "typescript",
        "web",
        { alias: "null" },
        false,
      );

      expect(mockSaveLocalConfig).toHaveBeenCalled();
      const updatedConfig = mockSaveLocalConfig.mock.calls[0]![0];
      expect(
        updatedConfig.templates.typescript.templates.web.alias,
      ).toBeUndefined();
    });

    it("should rename a template successfully", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: structuredClone(baseConfig),
        source: "local",
      });
      vi.mocked(deepmerge).mockReturnValue({
        ...baseConfig.templates.typescript.templates.web,
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

    it("should throw an error for an invalid template name", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: baseConfig,
        source: "local",
      });

      await expect(
        handleNonInteractiveTemplateUpdate("typescript", "unknown", {}, false),
      ).rejects.toThrow(
        new DevkitError("error.template.not_found- options template:unknown"),
      );
    });

    it("should throw an error for an invalid cache strategy", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: baseConfig,
        source: "local",
      });

      await expect(
        handleNonInteractiveTemplateUpdate(
          "typescript",
          "web",
          { cacheStrategy: "invalid_strategy" as "null" },
          false,
        ),
      ).rejects.toThrow(
        new DevkitError(
          mocktFn("error.invalid.value", {
            key: "cacheStrategy",
            options: VALID_CACHE_STRATEGIES.join(", "),
          }),
        ),
      );
    });
  });
});

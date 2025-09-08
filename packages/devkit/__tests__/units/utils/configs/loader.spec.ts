import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  getLocaleFromConfigMinimal,
  loadUserConfig,
  readAndMergeConfigs,
} from "../../../../src/utils/configs/loader.js";
import {
  CONFIG_FILE_NAMES,
  defaultCliConfig,
} from "../../../../src/utils/configs/schema.js";
import { ConfigError } from "../../../../src/utils/errors/base.js";

const {
  mockFindUp,
  mockReadConfigAtPath,
  mockGetConfigFilepath,
  mockFs,
  mockFindGlobalConfigFile,
  mockFindLocalConfigFile,
} = vi.hoisted(() => ({
  mockFindUp: vi.fn(),
  mockReadConfigAtPath: vi.fn(),
  mockGetConfigFilepath: vi.fn(),
  mockFs: {
    pathExists: vi.fn(),
    readJson: vi.fn(),
  },
  mockFindGlobalConfigFile: vi.fn(),
  mockFindLocalConfigFile: vi.fn(),
}));

vi.mock("#utils/configs/path-finder.js", () => ({
  getConfigFilepath: mockGetConfigFilepath,
}));

vi.mock("#utils/files/find-up.js", () => ({
  findUp: mockFindUp,
}));

vi.mock("#utils/configs/reader.js", () => ({
  readConfigAtPath: mockReadConfigAtPath,
}));

vi.mock("#utils/fileSystem.js", () => ({
  default: {
    pathExists: mockFs.pathExists,
    readJson: mockFs.readJson,
  },
}));

vi.mock("#utils/files/finder.js", () => ({
  findGlobalConfigFile: mockFindGlobalConfigFile,
  findLocalConfigFile: mockFindLocalConfigFile,
}));

const mockOra = {
  text: "",
};

describe("Configuration Loader Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConfigFilepath.mockResolvedValue("/some/path/config.json");
    mockFindGlobalConfigFile.mockResolvedValue("/global/config.json");
    mockFindLocalConfigFile.mockResolvedValue("/local/config.json");
  });

  describe("getLocaleFromConfigMinimal", () => {
    it("should return locale from local config if it exists", async () => {
      mockFindUp.mockResolvedValueOnce("/local/config.json");
      mockReadConfigAtPath.mockResolvedValueOnce({
        settings: { language: "en" },
      });
      const locale = await getLocaleFromConfigMinimal();
      expect(locale).toBe("en");
      expect(mockReadConfigAtPath).toHaveBeenCalledOnce();
      expect(mockReadConfigAtPath).toHaveBeenCalledWith("/local/config.json");
      expect(mockFindUp).toHaveBeenCalledOnce();
      expect(mockFindUp).toHaveBeenCalledWith(
        [...CONFIG_FILE_NAMES],
        expect.any(String),
      );
    });

    it("should return locale from global config if local is not found", async () => {
      mockFindUp.mockResolvedValueOnce(null);
      mockGetConfigFilepath.mockResolvedValueOnce("/global/config.json");
      mockReadConfigAtPath.mockResolvedValueOnce({
        settings: { language: "fr" },
      });
      const locale = await getLocaleFromConfigMinimal();
      expect(locale).toBe("fr");
      expect(mockReadConfigAtPath).toHaveBeenCalledWith("/global/config.json");
      expect(mockFindUp).toHaveBeenCalledOnce();
      expect(mockGetConfigFilepath).toHaveBeenCalledWith(true);
    });

    it("should return default locale if no config is found", async () => {
      mockFindUp.mockResolvedValueOnce(null);
      mockGetConfigFilepath.mockResolvedValueOnce(null);
      mockReadConfigAtPath.mockResolvedValueOnce(null);
      const locale = await getLocaleFromConfigMinimal();
      expect(locale).toBe(defaultCliConfig.settings.language);
    });

    it("should throw a ConfigError on invalid local config", async () => {
      mockFindUp.mockResolvedValueOnce("/local/config.json");
      mockReadConfigAtPath.mockRejectedValueOnce(new Error("Invalid config"));
      await expect(getLocaleFromConfigMinimal()).rejects.toThrow(ConfigError);
    });
  });

  describe("loadUserConfig", () => {
    it("should merge with global config if found", async () => {
      mockGetConfigFilepath
        .mockResolvedValueOnce("/global/config.json")
        .mockResolvedValueOnce(null);
      mockReadConfigAtPath.mockResolvedValueOnce({
        settings: { language: "es" },
      });
      const { config, source } = await loadUserConfig(mockOra as any);
      expect(config.settings.language).toBe("es");
      expect(source).toBe("global");
      expect(mockOra.text).toBe("config.check.local");
    });

    it("should merge with local config and override global", async () => {
      mockGetConfigFilepath.mockResolvedValueOnce("/global/config.json");
      mockReadConfigAtPath.mockResolvedValueOnce({
        settings: { language: "es" },
      });
      mockGetConfigFilepath.mockResolvedValueOnce("/local/config.json");
      mockReadConfigAtPath.mockResolvedValueOnce({
        settings: { language: "fr" },
      });
      const { config, source } = await loadUserConfig(mockOra as any);
      expect(config.settings.language).toBe("fr");
      expect(source).toBe("local");
    });

    it("should return default config if no files are found", async () => {
      mockGetConfigFilepath.mockResolvedValue(null);
      mockReadConfigAtPath.mockResolvedValue(null);
      const { config, source } = await loadUserConfig(mockOra as any);
      expect(config).toEqual(defaultCliConfig);
      expect(source).toBe("default");
      expect(mockOra.text).toBe("config.check.local");
    });
  });

  describe("readAndMergeConfigs", () => {
    it("should merge with local config by default", async () => {
      mockFindLocalConfigFile.mockResolvedValueOnce("/local/config.json");
      mockFs.pathExists.mockResolvedValueOnce(true);
      mockFs.readJson.mockResolvedValueOnce({ settings: { language: "fr" } });
      const { config, source } = await readAndMergeConfigs();
      expect(config.settings.language).toBe("fr");
      expect(source).toBe("local");
    });

    it("should fallback to global if no local config exists", async () => {
      mockFindLocalConfigFile.mockResolvedValueOnce(null);
      mockFindGlobalConfigFile.mockResolvedValueOnce("/global/config.json");
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValueOnce({ settings: { language: "es" } });
      const { config, source } = await readAndMergeConfigs();
      expect(config.settings.language).toBe("es");
      expect(source).toBe("global");
    });

    it("should use forced global config when options.forceGlobal is true", async () => {
      mockFindGlobalConfigFile.mockResolvedValueOnce("/global/config.json");
      mockFs.pathExists.mockResolvedValueOnce(true);
      mockFs.readJson.mockResolvedValueOnce({ settings: { language: "pt" } });
      const { config, source } = await readAndMergeConfigs({
        forceGlobal: true,
      });
      expect(config.settings.language).toBe("pt");
      expect(source).toBe("global");
      expect(mockFindGlobalConfigFile).toHaveBeenCalled();
      expect(mockFindLocalConfigFile).not.toHaveBeenCalled();
    });

    it("should return default config if no files are found", async () => {
      mockFindLocalConfigFile.mockResolvedValueOnce(null);
      mockFindGlobalConfigFile.mockResolvedValueOnce(null);
      mockFs.pathExists.mockResolvedValue(false);
      const { config, source } = await readAndMergeConfigs();
      expect(config).toEqual(defaultCliConfig);
      expect(source).toBe("default");
    });

    it("should return default config on invalid local file", async () => {
      mockFindLocalConfigFile.mockResolvedValueOnce("/local/config.json");
      mockFs.pathExists.mockResolvedValueOnce(true);
      mockFs.readJson.mockRejectedValueOnce(new Error("Malformed JSON"));
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { config, source } = await readAndMergeConfigs();
      expect(config).toEqual(defaultCliConfig);
      expect(source).toBe("default");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

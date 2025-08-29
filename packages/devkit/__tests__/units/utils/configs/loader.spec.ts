import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  getLocaleFromConfigMinimal,
  loadUserConfig,
} from "../../../../src/utils/configs/loader.js";
import {
  CONFIG_FILE_NAMES,
  defaultCliConfig,
} from "../../../../src/utils/configs/schema.js";
import { ConfigError } from "../../../../src/utils/errors/base.js";

const { mockFindUp, mockReadConfigAtPath, mockGetConfigFilepath } = vi.hoisted(
  () => ({
    mockFindUp: vi.fn(),
    mockReadConfigAtPath: vi.fn(),
    mockGetConfigFilepath: vi.fn(),
  }),
);

vi.mock("../../../../src/utils/configs/path-finder.js", () => ({
  getConfigFilepath: mockGetConfigFilepath,
}));

vi.mock("../../../../src/utils/files/find-up.js", () => ({
  findUp: mockFindUp,
}));

vi.mock("../../../../src/utils/configs/reader.js", () => ({
  readConfigAtPath: mockReadConfigAtPath,
}));

const mockOra = {
  text: "",
};

describe("Configuration Loader Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      mockReadConfigAtPath.mockResolvedValueOnce({
        settings: { language: "fr" },
      });
      const locale = await getLocaleFromConfigMinimal();
      expect(locale).toBe("fr");
    });

    it("should return default locale if no config is found", async () => {
      mockFindUp.mockResolvedValueOnce(null);
      mockReadConfigAtPath.mockResolvedValue(null);
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
    it("should return default config if no files are found", async () => {
      mockGetConfigFilepath.mockResolvedValue(null);
      mockReadConfigAtPath.mockResolvedValue(null);
      const { config, source } = await loadUserConfig(mockOra as any);
      expect(config).toEqual(defaultCliConfig);
      expect(source).toBe("default");
      expect(mockOra.text).toBe("config.check.local");
    });

    it("should merge with global config if found", async () => {
      mockGetConfigFilepath.mockResolvedValueOnce("/global.json");
      mockGetConfigFilepath.mockResolvedValueOnce(null);
      mockReadConfigAtPath.mockResolvedValueOnce({
        settings: { language: "es" },
      });
      mockReadConfigAtPath.mockResolvedValueOnce(null);
      const { config, source } = await loadUserConfig(mockOra as any);
      expect(config.settings.language).toBe("es");
      expect(source).toBe("global");
    });

    it("should merge with local config and override global", async () => {
      mockGetConfigFilepath.mockResolvedValueOnce("/global.json");
      mockGetConfigFilepath.mockResolvedValueOnce("/local.json");
      mockReadConfigAtPath.mockResolvedValueOnce({
        settings: { language: "es" },
      });
      mockReadConfigAtPath.mockResolvedValueOnce({
        settings: { language: "fr" },
      });
      const { config, source } = await loadUserConfig(mockOra as any);
      expect(config.settings.language).toBe("fr");
      expect(source).toBe("local");
    });
  });
});

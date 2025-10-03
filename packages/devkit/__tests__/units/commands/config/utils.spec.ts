import {
  resolveKeys,
  resolveSingleKey,
  getSettingsConfig,
} from "../../../../src/commands/config/utils.js";
import { vi, describe, it, expect, beforeEach } from "vitest";

const mockReadConfigSources = vi.hoisted(() => vi.fn());

vi.mock("#core/config/loader.js", () => ({
  readConfigSources: mockReadConfigSources,
}));

const mockLocalConfig = {
  settings: {
    language: "fr",
    defaultPackageManager: "npm",
    cacheStrategy: "daily",
  },
  templates: {},
};

const mockGlobalConfig = {
  settings: {
    language: "en",
    defaultPackageManager: "bun",
  },
  templates: {},
};

describe("Config Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("resolveKeys", () => {
    it("should resolve known short keys to full keys", () => {
      const shortKeys = ["lang", "pm", "cache"];
      const resolved = resolveKeys(shortKeys);
      expect(resolved).toEqual([
        "language",
        "defaultPackageManager",
        "cacheStrategy",
      ]);
    });

    it("should return full keys unchanged", () => {
      const fullKeys = ["language", "defaultPackageManager"];
      const resolved = resolveKeys(fullKeys);
      expect(resolved).toEqual(fullKeys);
    });

    it("should handle a mix of short and full keys", () => {
      const mixedKeys = ["lang", "defaultPackageManager", "pm", "nonexistent"];
      const resolved = resolveKeys(mixedKeys);
      expect(resolved).toEqual([
        "language",
        "defaultPackageManager",
        "defaultPackageManager",
        "nonexistent",
      ]);
    });

    it("should handle the 'lg' alias", () => {
      const keys = ["lg"];
      const resolved = resolveKeys(keys);
      expect(resolved).toEqual(["language"]);
    });
  });

  describe("resolveSingleKey", () => {
    it("should resolve a known short key to a full key", () => {
      const resolved = resolveSingleKey("pm");
      expect(resolved).toBe("defaultPackageManager");
    });

    it("should return a full key unchanged", () => {
      const resolved = resolveSingleKey("language");
      expect(resolved).toBe("language");
    });
  });

  describe("getSettingsConfig", () => {
    it("should return local config when isGlobal is false", async () => {
      mockReadConfigSources.mockResolvedValueOnce({
        local: mockLocalConfig as any,
        global: mockGlobalConfig as any,
      });

      const config = await getSettingsConfig(false);
      expect(mockReadConfigSources).toHaveBeenCalledWith({
        forceGlobal: false,
        forceLocal: true,
      });
      expect(config.settings).toEqual(mockLocalConfig.settings);
    });

    it("should return global config when isGlobal is true", async () => {
      mockReadConfigSources.mockResolvedValueOnce({
        local: mockLocalConfig as any,
        global: mockGlobalConfig as any,
      });

      const config = await getSettingsConfig(true);
      expect(mockReadConfigSources).toHaveBeenCalledWith({
        forceGlobal: true,
        forceLocal: false,
      });
      expect(config.settings).toEqual(mockGlobalConfig.settings);
    });

    it("should return empty settings when config source is null", async () => {
      mockReadConfigSources.mockResolvedValueOnce({
        local: null,
        global: null,
      });

      const localConfig = await getSettingsConfig(false);
      const globalConfig = await getSettingsConfig(true);

      expect(localConfig.settings).toEqual({});
      expect(globalConfig.settings).toEqual({});
    });
  });
});

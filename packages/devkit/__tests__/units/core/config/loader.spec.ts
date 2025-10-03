import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  readConfigSources,
  type ConfigurationSources,
} from "../../../../src/core/config/loader.js";
import { defaultCliConfig } from "../../../../src/utils/schema/schema.js";

const { mockFs, mockGetConfigPathSources } = vi.hoisted(() => ({
  mockFs: {
    pathExists: vi.fn(),
    readJson: vi.fn(),
  },
  mockGetConfigPathSources: vi.fn(),
}));

vi.mock("../../../../src/core/config/finder.js", () => ({
  getConfigPathSources: mockGetConfigPathSources,
}));

vi.mock("#utils/fs/file.js", () => ({
  default: {
    pathExists: mockFs.pathExists,
    readJson: mockFs.readJson,
  },
}));

const mockStructuredClone = vi.fn((obj) => JSON.parse(JSON.stringify(obj)));
vi.stubGlobal("structuredClone", mockStructuredClone);

describe("Configuration Loader Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFs.pathExists.mockResolvedValue(true);
  });

  describe("readConfigSources", () => {
    const localConfig = { settings: { language: "fr" } };
    const globalConfig = { settings: { defaultPackageManager: "pnpm" } };
    const localPath = "/project/.devkitrc";
    const globalPath = "/user/.devkitrc";

    it("should load all three sources (Local, Global, Default) when both config files exist", async () => {
      mockGetConfigPathSources.mockResolvedValue({
        localPath: localPath,
        globalPath: globalPath,
      });

      mockFs.readJson
        .mockResolvedValueOnce(localConfig)
        .mockResolvedValueOnce(globalConfig);

      const options = {};
      const sources: ConfigurationSources = await readConfigSources(options);

      expect(mockGetConfigPathSources).toHaveBeenCalledWith(options);

      expect(mockFs.readJson).toHaveBeenCalledWith(localPath);
      expect(mockFs.readJson).toHaveBeenCalledWith(globalPath);
      expect(mockFs.readJson).toHaveBeenCalledTimes(2);

      expect(sources.local).toEqual(localConfig);
      expect(sources.global).toEqual(globalConfig);
      expect(sources.default).toEqual(defaultCliConfig);
      expect(sources.configFound).toBe(true);

      expect(mockStructuredClone).toHaveBeenCalledTimes(3);
    });

    it("should load only Global and Default when Local path is null/config doesn't exist", async () => {
      mockGetConfigPathSources.mockResolvedValue({
        localPath: null,
        globalPath: globalPath,
      });

      mockFs.readJson.mockResolvedValueOnce(globalConfig);

      mockFs.pathExists.mockImplementation(async (path) => path === globalPath);

      const sources: ConfigurationSources = await readConfigSources();

      expect(mockFs.readJson).toHaveBeenCalledWith(globalPath);
      expect(mockFs.readJson).toHaveBeenCalledTimes(1);

      expect(sources.local).toBeNull();
      expect(sources.global).toEqual(globalConfig);
      expect(sources.default).toEqual(defaultCliConfig);
      expect(sources.configFound).toBe(true);
    });

    it("should return null for Local and Global when neither config file exists", async () => {
      mockGetConfigPathSources.mockResolvedValue({
        localPath: localPath,
        globalPath: globalPath,
      });

      mockFs.pathExists.mockResolvedValue(false);

      const sources: ConfigurationSources = await readConfigSources();

      expect(mockFs.readJson).not.toHaveBeenCalled();

      expect(sources.local).toBeNull();
      expect(sources.global).toBeNull();
      expect(sources.default).toEqual(defaultCliConfig);
      expect(sources.configFound).toBe(false);
    });

    it("should handle JSON parsing errors gracefully and return null for the corrupted config", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockGetConfigPathSources.mockResolvedValue({
        localPath: localPath,
        globalPath: globalPath,
      });

      mockFs.readJson
        .mockRejectedValueOnce(new Error("Invalid JSON"))
        .mockResolvedValueOnce(globalConfig);

      const sources: ConfigurationSources = await readConfigSources();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Warning: Failed to parse configuration file at "${localPath}". The file may be invalid.`,
        undefined,
      );

      expect(sources.local).toBeNull();
      expect(sources.global).toEqual(globalConfig);
      expect(sources.configFound).toBe(true);

      consoleErrorSpy.mockRestore();
    });

    it("should pass options (e.g., forceGlobal) to getConfigPathSources", async () => {
      mockGetConfigPathSources.mockResolvedValue({
        localPath: null,
        globalPath: globalPath,
      });
      mockFs.readJson.mockResolvedValueOnce(globalConfig);

      const options = { forceGlobal: true };
      await readConfigSources(options);

      expect(mockGetConfigPathSources).toHaveBeenCalledWith({
        forceGlobal: true,
      });
    });
  });
});

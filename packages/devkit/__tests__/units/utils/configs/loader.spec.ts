import { vi, describe, it, expect, beforeEach } from "vitest";
import { readAndMergeConfigs } from "../../../../src/utils/configs/loader.js";
import { defaultCliConfig } from "../../../../src/utils/configs/schema.js";

const { mockFs, mockDeepmerge, mockFindConfigPaths } = vi.hoisted(() => ({
  mockFs: {
    pathExists: vi.fn(),
    readJson: vi.fn(),
  },
  mockDeepmerge: vi.fn(),
  mockFindConfigPaths: vi.fn(),
}));

vi.mock("#utils/path/finder.js", () => ({
  findConfigPaths: mockFindConfigPaths,
}));

vi.mock("deepmerge", () => ({
  default: mockDeepmerge,
}));

vi.mock("#utils/fileSystem.js", () => ({
  default: {
    pathExists: mockFs.pathExists,
    readJson: mockFs.readJson,
  },
}));

describe("Configuration Loader Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeepmerge.mockImplementation((x, y) => ({ ...x, ...y }));
  });

  describe("readAndMergeConfigs", () => {
    const localConfig = { settings: { language: "fr" } };
    const globalConfig = { settings: { defaultPackageManager: "pnpm" } };

    it("should load only the local config when it exists", async () => {
      mockFindConfigPaths.mockResolvedValue({
        primary: "/local/.devkitrc",
        secondary: null,
        source: "local",
        configFound: true,
      });
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(localConfig);

      const { config, source } = await readAndMergeConfigs();

      expect(mockFindConfigPaths).toHaveBeenCalledWith({});
      expect(mockFs.readJson).toHaveBeenCalledWith("/local/.devkitrc");
      expect(config).toEqual(localConfig);
      expect(source).toBe("local");
    });

    it("should load only the global config when local does not exist", async () => {
      mockFindConfigPaths.mockResolvedValue({
        primary: "/global/.devkitrc",
        secondary: null,
        source: "global",
        configFound: true,
      });
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(globalConfig);

      const { config, source } = await readAndMergeConfigs();

      expect(mockFindConfigPaths).toHaveBeenCalledWith({});
      expect(mockFs.readJson).toHaveBeenCalledWith("/global/.devkitrc");
      expect(config).toEqual(globalConfig);
      expect(source).toBe("global");
    });

    it("should merge local and global configs when mergeAll is true", async () => {
      mockFindConfigPaths.mockResolvedValue({
        primary: "/local/.devkitrc",
        secondary: "/global/.devkitrc",
        source: "local",
        configFound: true,
      });
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson
        .mockResolvedValueOnce(localConfig)
        .mockResolvedValueOnce(globalConfig);
      mockDeepmerge
        .mockReturnValueOnce(localConfig)
        .mockReturnValueOnce({ ...localConfig, ...globalConfig });

      const { config, source } = await readAndMergeConfigs({ mergeAll: true });

      expect(mockFindConfigPaths).toHaveBeenCalledWith({ mergeAll: true });
      expect(mockFs.readJson).toHaveBeenCalledTimes(2);
      expect(mockFs.readJson).toHaveBeenCalledWith("/local/.devkitrc");
      expect(mockFs.readJson).toHaveBeenCalledWith("/global/.devkitrc");
      expect(config).toEqual({ ...localConfig, ...globalConfig });
      expect(source).toBe("local");
    });

    it("should use fallback to default config when no config is found and useFallback is true", async () => {
      mockFindConfigPaths.mockResolvedValue({
        primary: null,
        secondary: null,
        source: "default",
        configFound: false,
      });
      mockDeepmerge.mockReturnValue(defaultCliConfig);

      const { config, source } = await readAndMergeConfigs({
        useFallback: true,
      });

      expect(mockFindConfigPaths).toHaveBeenCalledWith({ useFallback: true });
      expect(mockFs.readJson).not.toHaveBeenCalled();
      expect(mockDeepmerge).toHaveBeenCalledWith(defaultCliConfig, {});
      expect(config).toEqual(defaultCliConfig);
      expect(source).toBe("default");
    });

    it("should return an empty config when no config is found and useFallback is false", async () => {
      mockFindConfigPaths.mockResolvedValue({
        primary: null,
        secondary: null,
        source: "default",
        configFound: false,
      });

      const { config, source } = await readAndMergeConfigs();

      expect(mockFindConfigPaths).toHaveBeenCalledWith({});
      expect(mockFs.readJson).not.toHaveBeenCalled();
      expect(mockDeepmerge).not.toHaveBeenCalled();
      expect(config).toEqual({});
      expect(source).toBe("default");
    });

    it("should handle JSON parsing errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockFindConfigPaths.mockResolvedValue({
        primary: "/bad/.devkitrc",
        secondary: null,
        source: "local",
        configFound: true,
      });
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockRejectedValue(new Error("Invalid JSON"));

      const { config, source } = await readAndMergeConfigs();

      expect(config).toEqual({});
      expect(source).toBe("local");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Warning: Failed to parse configuration file at "/bad/.devkitrc". The file may be invalid.',
        undefined,
      );
      consoleErrorSpy.mockRestore();
    });

    it("should force loading global config", async () => {
      mockFindConfigPaths.mockResolvedValue({
        primary: "/global/.devkitrc",
        secondary: null,
        source: "global",
        configFound: true,
      });
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(globalConfig);

      const { config, source } = await readAndMergeConfigs({
        forceGlobal: true,
      });

      expect(mockFindConfigPaths).toHaveBeenCalledWith({ forceGlobal: true });
      expect(mockFs.readJson).toHaveBeenCalledWith("/global/.devkitrc");
      expect(config).toEqual(globalConfig);
      expect(source).toBe("global");
    });
  });
});

import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  readConfigSources,
  type ConfigurationSources,
} from "../../../../src/core/config/loader.js";
import { defaultCliConfig } from "../../../../src/utils/schema/schema.js";

const MOCK_I18N_ERROR = "i18n-read-fail";
const MOCK_I18N_WARNING = "i18n-warning-not-found";

const { mockFs, mockGetConfigPathSources, mockLogger } = vi.hoisted(() => ({
  mockFs: {
    pathExists: vi.fn(),
    readJson: vi.fn(),
  },
  mockGetConfigPathSources: vi.fn(),
  mockLogger: {
    error: vi.fn(),
    warning: vi.fn(),
  },
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

vi.mock("#utils/logger.js", () => ({
  logger: mockLogger,
}));

vi.mock("#utils/i18n/translator.js", () => ({
  t: vi.fn((key) => {
    if (key.includes("read_fail")) return MOCK_I18N_ERROR;
    if (key.includes("not_found")) return MOCK_I18N_WARNING;
    return key;
  }),
}));

const mockStructuredClone = vi.fn((obj) => JSON.parse(JSON.stringify(obj)));
vi.stubGlobal("structuredClone", mockStructuredClone);

describe("Configuration Loader Functions", () => {
  const localConfig = { settings: { language: "fr" } };
  const globalConfig = { settings: { defaultPackageManager: "pnpm" } };
  const localPath = "/project/.devkitrc";
  const globalPath = "/user/.devkitrc";

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs.pathExists.mockResolvedValue(true);
  });

  describe("readConfigSources", () => {
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
      expect(mockLogger.error).not.toHaveBeenCalled();
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
      expect(mockLogger.error).not.toHaveBeenCalled();
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
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it("should handle JSON parsing errors gracefully using logger.error and return null for the corrupted config", async () => {
      mockGetConfigPathSources.mockResolvedValue({
        localPath: localPath,
        globalPath: globalPath,
      });

      mockFs.readJson
        .mockRejectedValueOnce(new Error("Invalid JSON"))
        .mockResolvedValueOnce(globalConfig);

      const sources: ConfigurationSources = await readConfigSources();

      expect(mockLogger.error).toHaveBeenCalledWith(MOCK_I18N_ERROR, "ERR");

      expect(mockLogger.warning).toHaveBeenCalledWith(MOCK_I18N_WARNING);

      expect(sources.local).toBeNull();
      expect(sources.global).toEqual(globalConfig);
      expect(sources.configFound).toBe(true);
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

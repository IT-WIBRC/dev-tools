import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  getConfigFilepath,
  getConfigPathSources,
} from "../../../../src/core/config/finder.js";
import { CONFIG_FILE_NAMES } from "../../../../src/utils/schema/schema.js";
import path from "path";

const {
  mockFindUp,
  mockFindGlobalConfigFile,
  mockFindLocalConfigFile,
  mockPathExists,
} = vi.hoisted(() => ({
  mockFindUp: vi.fn(),
  mockPathExists: vi.fn(),
  mockFindGlobalConfigFile: vi.fn(),
  mockFindLocalConfigFile: vi.fn(),
}));

vi.mock("#utils/fs/find-up.js", () => ({
  findUp: mockFindUp,
}));

vi.mock("../../../../src/core/config/search.js", () => ({
  findGlobalConfigFile: mockFindGlobalConfigFile,
  findLocalConfigFile: mockFindLocalConfigFile,
}));

vi.mock("#utils/fs/file.js", () => ({
  default: {
    pathExists: mockPathExists,
  },
}));

vi.spyOn(process, "cwd").mockReturnValue("/current/working/dir");

vi.spyOn(path, "join").mockImplementation((...args) => args.join("/"));

describe("getConfigFilepath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the global config path when isGlobal is true", async () => {
    mockFindGlobalConfigFile.mockResolvedValueOnce("/home/user/.devkitrc.json");
    const result = await getConfigFilepath(true);
    expect(result).toBe("/home/user/.devkitrc.json");
    expect(mockFindGlobalConfigFile).toHaveBeenCalled();
    expect(mockFindUp).not.toHaveBeenCalled();
  });

  it("should return an empty string if global config is not found", async () => {
    mockFindGlobalConfigFile.mockResolvedValueOnce(null);
    const result = await getConfigFilepath(true);
    expect(result).toBe("");
  });

  it("should return the local config path if found", async () => {
    mockFindUp.mockResolvedValueOnce("/project/dir/custom-config.json");
    const result = await getConfigFilepath();
    expect(result).toBe("/project/dir/custom-config.json");
    expect(mockFindUp).toHaveBeenCalled();
    expect(mockFindGlobalConfigFile).not.toHaveBeenCalled();
  });

  it("should return the default path if no local config is found", async () => {
    mockFindUp.mockResolvedValueOnce(null);
    const result = await getConfigFilepath();
    expect(result).toBe("/current/working/dir/.devkit.json");
    expect(mockFindUp).toHaveBeenCalled();
    expect(mockFindGlobalConfigFile).not.toHaveBeenCalled();
  });
});

describe("getConfigPathSources", () => {
  const localConfigPath = "/local/config.json";
  const globalConfigPath = "/global/config.json";

  beforeEach(() => {
    vi.restoreAllMocks();
    mockFindLocalConfigFile.mockResolvedValue(localConfigPath);
    mockFindGlobalConfigFile.mockResolvedValue(globalConfigPath);
  });

  const mockConfigExistence = (hasLocal: boolean, hasGlobal: boolean) => {
    mockPathExists.mockImplementation(async (path) => {
      if (path === localConfigPath) return hasLocal;
      if (path === globalConfigPath) return hasGlobal;
      return false;
    });
  };

  it("should return BOTH paths when mergeAll is TRUE and both exist", async () => {
    mockConfigExistence(true, true);

    const result = await getConfigPathSources({ mergeAll: true });

    expect(result).toEqual({
      localPath: localConfigPath,
      globalPath: globalConfigPath,
    });
  });

  it("should return ONLY localPath when mergeAll is TRUE and only local exists", async () => {
    mockConfigExistence(true, false);

    const result = await getConfigPathSources({ mergeAll: true });

    expect(result).toEqual({
      localPath: localConfigPath,
      globalPath: null,
    });
  });

  it("should return ONLY globalPath when mergeAll is TRUE and only global exists", async () => {
    mockConfigExistence(false, true);

    const result = await getConfigPathSources({ mergeAll: true });

    expect(result).toEqual({
      localPath: null,
      globalPath: globalConfigPath,
    });
  });

  it("should return NULL paths when mergeAll is TRUE and neither exists", async () => {
    mockConfigExistence(false, false);

    const result = await getConfigPathSources({ mergeAll: true });

    expect(result).toEqual({
      localPath: null,
      globalPath: null,
    });
  });

  it("should return ONLY localPath when forceLocal is TRUE and local exists", async () => {
    mockConfigExistence(true, true);

    const result = await getConfigPathSources({ forceLocal: true });

    expect(result).toEqual({
      localPath: localConfigPath,
      globalPath: null,
    });
  });

  it("should return NULL paths when forceLocal is TRUE and local does NOT exist", async () => {
    mockConfigExistence(false, true);

    const result = await getConfigPathSources({ forceLocal: true });

    expect(result).toEqual({
      localPath: null,
      globalPath: null,
    });
  });

  it("should return ONLY globalPath when forceGlobal is TRUE and global exists", async () => {
    mockConfigExistence(true, true);

    const result = await getConfigPathSources({ forceGlobal: true });

    expect(result).toEqual({
      localPath: null,
      globalPath: globalConfigPath,
    });
  });

  it("should return NULL paths when forceGlobal is TRUE and global does NOT exist", async () => {
    mockConfigExistence(true, false);

    const result = await getConfigPathSources({ forceGlobal: true });

    expect(result).toEqual({
      localPath: null,
      globalPath: null,
    });
  });

  it("should return ONLY localPath when local exists and no options are set", async () => {
    mockConfigExistence(true, true);

    const result = await getConfigPathSources({});

    expect(result).toEqual({
      localPath: localConfigPath,
      globalPath: null,
    });
  });

  it("should return ONLY globalPath when local does NOT exist and global exists", async () => {
    mockConfigExistence(false, true);

    const result = await getConfigPathSources({});

    expect(result).toEqual({
      localPath: null,
      globalPath: globalConfigPath,
    });
  });

  it("should return NULL paths when neither local nor global exists and no options are set", async () => {
    mockConfigExistence(false, false);

    const result = await getConfigPathSources({});

    expect(result).toEqual({
      localPath: null,
      globalPath: null,
    });
  });

  it("should return NULL paths if findLocalConfigFile/findGlobalConfigFile return null, even if pathExists is true", async () => {
    mockFindLocalConfigFile.mockResolvedValue(null);
    mockFindGlobalConfigFile.mockResolvedValue(null);
    mockConfigExistence(true, true);

    const result = await getConfigPathSources({});

    expect(result).toEqual({
      localPath: null,
      globalPath: null,
    });
  });
});

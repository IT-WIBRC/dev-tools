import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  findConfigPaths,
  getConfigFilepath,
} from "../../../../src/core/config/finder.js";
import { CONFIG_FILE_NAMES } from "../../../../src/utils/schema/schema.js";

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
    expect(result).toBe("/current/working/dir/" + CONFIG_FILE_NAMES[1]);
    expect(mockFindUp).toHaveBeenCalled();
    expect(mockFindGlobalConfigFile).not.toHaveBeenCalled();
  });
});

describe("findConfigPaths", () => {
  const localConfigPath = "/local/config.json";
  const globalConfigPath = "/global/config.json";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return both the local and global config paths when `forceGlobal` and `forceLocal` are set to `TRUE` with the source as `merged`", async () => {
    mockFindLocalConfigFile.mockResolvedValueOnce(localConfigPath);
    mockFindGlobalConfigFile.mockResolvedValueOnce(globalConfigPath);
    mockPathExists.mockResolvedValue(true).mockResolvedValue(true);

    const mergedConfig = await findConfigPaths({
      forceGlobal: true,
      forceLocal: true,
    });

    expect(mergedConfig).toEqual({
      configFound: true,
      source: "merged",
      primary: localConfigPath,
      secondary: globalConfigPath,
    });
  });

  it("should return both the local and global config paths when `mergeAll` is set to `TRUE` with the source as `merged`", async () => {
    mockFindLocalConfigFile.mockResolvedValueOnce(localConfigPath);
    mockFindGlobalConfigFile.mockResolvedValueOnce(globalConfigPath);
    mockPathExists.mockResolvedValue(true).mockResolvedValue(true);

    const mergedConfig = await findConfigPaths({
      mergeAll: true,
    });

    expect(mergedConfig).toEqual({
      configFound: true,
      source: "merged",
      primary: localConfigPath,
      secondary: globalConfigPath,
    });
  });

  it("should only return the local config when `forceLocal` is set to `TRUE`", async () => {
    mockFindLocalConfigFile.mockResolvedValueOnce(localConfigPath);
    mockPathExists.mockResolvedValueOnce(true);

    const finalConfigs = await findConfigPaths({
      forceLocal: true,
    });
    expect(finalConfigs).toEqual({
      primary: localConfigPath,
      secondary: null,
      source: "local",
      configFound: true,
    });
  });

  it("should only return the global config when `forceGlobal` is set to `TRUE`", async () => {
    mockFindGlobalConfigFile.mockResolvedValueOnce(globalConfigPath);
    mockPathExists.mockResolvedValueOnce(true);
    const finalConfigs = await findConfigPaths({
      forceGlobal: true,
    });
    expect(finalConfigs).toEqual({
      primary: globalConfigPath,
      secondary: null,
      source: "global",
      configFound: true,
    });
  });

  it("should only return the local config path when found, global config path is not found and `mergeAll` is not set to `True`", async () => {
    mockFindLocalConfigFile.mockResolvedValueOnce(localConfigPath);
    mockFindGlobalConfigFile.mockResolvedValueOnce(null);
    mockPathExists.mockResolvedValueOnce(true);
    const finalConfigs = await findConfigPaths({
      mergeAll: true,
    });
    expect(finalConfigs).toEqual({
      primary: localConfigPath,
      secondary: null,
      source: "local",
      configFound: true,
    });
  });

  it("should only return the global config path when found, local config path is not found and `mergeAll` is not set to `True`", async () => {
    mockFindLocalConfigFile.mockResolvedValueOnce(null);
    mockFindGlobalConfigFile.mockResolvedValueOnce(globalConfigPath);
    mockPathExists.mockResolvedValue(false).mockResolvedValue(true);
    const finalConfigs = await findConfigPaths({
      mergeAll: true,
    });
    expect(finalConfigs).toEqual({
      primary: globalConfigPath,
      secondary: null,
      source: "global",
      configFound: true,
    });
  });

  it("should only return the local config path when found when no param is set", async () => {
    mockFindLocalConfigFile.mockResolvedValueOnce(localConfigPath);
    mockPathExists.mockResolvedValue(true);
    const finalConfigs = await findConfigPaths({});
    expect(finalConfigs).toEqual({
      primary: localConfigPath,
      secondary: null,
      source: "local",
      configFound: true,
    });
  });

  it("should only return the global config path when found when no param is set", async () => {
    mockFindLocalConfigFile.mockResolvedValueOnce(null);
    mockFindGlobalConfigFile.mockResolvedValueOnce(globalConfigPath);
    mockPathExists.mockResolvedValue(false).mockResolvedValue(true);
    const finalConfigs = await findConfigPaths({});
    expect(finalConfigs).toEqual({
      primary: globalConfigPath,
      secondary: null,
      source: "global",
      configFound: true,
    });
  });
});

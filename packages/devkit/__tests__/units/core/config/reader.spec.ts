import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  readConfigAtPath,
  readLocalConfig,
  readGlobalConfig,
} from "../../../../src/core/config/reader.js";
import { getConfigFilepath } from "../../../../src/core/config/finder.js";

const { mockExistsSync, mockGetConfigFilePath, mockReadJson } = vi.hoisted(
  () => ({
    mockExistsSync: vi.fn(),
    mockReadJson: vi.fn(),
    mockGetConfigFilePath: vi.fn(),
  }),
);

vi.mock("#utils/fs/file.js", () => ({
  default: {
    readJson: mockReadJson,
    existsSync: mockExistsSync,
  },
}));

vi.mock("../../../../src/core/config/finder.js", () => ({
  getConfigFilepath: mockGetConfigFilePath,
}));

describe("readConfigAtPath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should read and return a valid config file", async () => {
    const mockConfig = { settings: { language: "en" } };
    mockExistsSync.mockReturnValue(true);
    mockReadJson.mockResolvedValue(mockConfig);

    const result = await readConfigAtPath("/path/to/.devkitrc.json");

    expect(result).toEqual(mockConfig);
    expect(mockExistsSync).toHaveBeenCalledWith("/path/to/.devkitrc.json");
    expect(mockReadJson).toHaveBeenCalledWith("/path/to/.devkitrc.json");
  });

  it("should return null if the file does not exist", async () => {
    mockExistsSync.mockReturnValue(false);

    const result = await readConfigAtPath("/path/to/.devkitrc.json");

    expect(result).toBeNull();
    expect(mockExistsSync).toHaveBeenCalledWith("/path/to/.devkitrc.json");
    expect(mockReadJson).not.toHaveBeenCalled();
  });

  it("should throw an error if the file cannot be parsed", async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadJson.mockRejectedValue("invalid json content");

    await expect(readConfigAtPath("/path/to/.devkitrc.json")).rejects.toThrow(
      `Failed to read or parse config file at /path/to/.devkitrc.json`,
    );
    expect(mockExistsSync).toHaveBeenCalledWith("/path/to/.devkitrc.json");
    expect(mockReadJson).toHaveBeenCalledWith("/path/to/.devkitrc.json");
  });
});

describe("readLocalConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the local config if found", async () => {
    const mockConfig = { templates: { javascript: {} } };
    mockGetConfigFilePath.mockResolvedValue("/mock/path/.devkitrc.json");
    mockExistsSync.mockReturnValue(true);
    mockReadJson.mockResolvedValue(mockConfig);

    const result = await readLocalConfig();

    expect(result).toEqual({
      config: mockConfig,
      filePath: "/mock/path/.devkitrc.json",
      source: "local",
    });
    expect(mockGetConfigFilePath).toHaveBeenCalledWith(false);
  });

  it("should return null if local config is not found", async () => {
    mockGetConfigFilePath.mockResolvedValue(null);

    const result = await readLocalConfig();

    expect(result).toBeNull();
    expect(getConfigFilepath).toHaveBeenCalledWith(false);
  });
});

describe("readGlobalConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the global config if found", async () => {
    const mockConfig = { templates: { python: {} } };
    mockGetConfigFilePath.mockResolvedValue("/mock/path/.devkitrc");
    mockExistsSync.mockReturnValue(true);
    mockReadJson.mockResolvedValue(mockConfig);

    const result = await readGlobalConfig();

    expect(result).toEqual({
      config: mockConfig,
      filePath: "/mock/path/.devkitrc",
      source: "global",
    });
    expect(getConfigFilepath).toHaveBeenCalledWith(true);
  });

  it("should return null if global config is not found", async () => {
    mockGetConfigFilePath.mockResolvedValue(null);

    const result = await readGlobalConfig();

    expect(result).toBeNull();
    expect(getConfigFilepath).toHaveBeenCalledWith(true);
  });
});

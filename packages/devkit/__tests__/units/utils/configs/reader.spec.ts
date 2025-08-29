import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  readConfigAtPath,
  readLocalConfig,
  readGlobalConfig,
} from "../../../../src/utils/configs/reader.js";
import { getConfigFilepath } from "../../../../src/utils/configs/path-finder.js";

const { mockExistsSync, mockGetConfigFilePath, mockReadFile } = vi.hoisted(
  () => ({
    mockExistsSync: vi.fn(),
    mockReadFile: vi.fn(),
    mockGetConfigFilePath: vi.fn(),
  }),
);

vi.mock("fs-extra", () => ({
  existsSync: mockExistsSync,
}));

vi.mock("fs/promises", () => ({
  readFile: mockReadFile,
}));

vi.mock("../../../../src/utils/configs/path-finder.js", () => ({
  getConfigFilepath: mockGetConfigFilePath,
}));

describe("readConfigAtPath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should read and return a valid config file", async () => {
    const mockConfig = { settings: { language: "en" } };
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(JSON.stringify(mockConfig));

    const result = await readConfigAtPath("/path/to/.devkitrc.json");

    expect(result).toEqual(mockConfig);
    expect(mockExistsSync).toHaveBeenCalledWith("/path/to/.devkitrc.json");
    expect(mockReadFile).toHaveBeenCalledWith(
      "/path/to/.devkitrc.json",
      "utf-8",
    );
  });

  it("should return null if the file does not exist", async () => {
    mockExistsSync.mockReturnValue(false);

    const result = await readConfigAtPath("/path/to/.devkitrc.json");

    expect(result).toBeNull();
    expect(mockExistsSync).toHaveBeenCalledWith("/path/to/.devkitrc.json");
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it("should throw an error if the file cannot be parsed", async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue("invalid json content");

    await expect(readConfigAtPath("/path/to/.devkitrc.json")).rejects.toThrow(
      `Failed to read or parse config file at /path/to/.devkitrc.json`,
    );
    expect(mockExistsSync).toHaveBeenCalledWith("/path/to/.devkitrc.json");
    expect(mockReadFile).toHaveBeenCalledWith(
      "/path/to/.devkitrc.json",
      "utf-8",
    );
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
    mockReadFile.mockResolvedValue(JSON.stringify(mockConfig));

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
    mockReadFile.mockResolvedValue(JSON.stringify(mockConfig));

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

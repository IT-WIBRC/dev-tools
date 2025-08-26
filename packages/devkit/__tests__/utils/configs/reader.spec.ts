import { vi, describe, it, expect, beforeEach } from "vitest";
import fs from "fs-extra";
import { readConfigAtPath } from "../../../src/utils/configs/reader.js";
import { ConfigError } from "../../../src/utils/errors/base.js";

const mockReadJson = vi.hoisted(() => vi.fn());
vi.mock("fs-extra", () => ({
  default: {
    readJson: mockReadJson,
  },
}));

describe("readConfigAtPath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should read and return a valid config file", async () => {
    const mockConfig = { settings: { language: "en" } };
    mockReadJson.mockResolvedValueOnce(mockConfig);
    const result = await readConfigAtPath("/path/to/.devkitrc.json");
    expect(result).toEqual(mockConfig);
    expect(vi.mocked(fs.readJson)).toHaveBeenCalledWith(
      "/path/to/.devkitrc.json",
    );
  });

  it("should return null if the file does not exist (ENOENT)", async () => {
    const error = new Error("File not found");
    (error as any).code = "ENOENT";
    mockReadJson.mockRejectedValueOnce(error);
    const result = await readConfigAtPath("/path/to/.devkitrc.json");
    expect(result).toBeNull();
  });

  it("should throw a ConfigError if the file cannot be parsed", async () => {
    const error = new Error("Invalid JSON");
    mockReadJson.mockRejectedValue(error);
    await expect(readConfigAtPath("/path/to/.devkitrc.json")).rejects.toThrow(
      ConfigError,
    );
    await expect(readConfigAtPath("/path/to/.devkitrc.json")).rejects.toThrow(
      "error.config.parse",
    );
  });
});

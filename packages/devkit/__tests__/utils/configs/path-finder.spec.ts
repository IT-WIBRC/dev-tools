import { vi, describe, it, expect, beforeEach } from "vitest";
import path from "path";
import os from "os";
import { getConfigFilepath } from "../../../src/utils/configs/path-finder.js";
import { CONFIG_FILE_NAMES } from "../../../src/utils/configs/schema.js";

const { mockFindUp, mockFindMonorepoRoot, mockFindProjectRoot } = vi.hoisted(
  () => ({
    mockFindUp: vi.fn(),
    mockFindMonorepoRoot: vi.fn(),
    mockFindProjectRoot: vi.fn(),
  }),
);

vi.mock("../../../src/utils/files/find-up.js", () => ({
  findUp: mockFindUp,
}));

vi.mock("../../../src/utils/files/finder.js", () => ({
  findMonorepoRoot: mockFindMonorepoRoot,
  findProjectRoot: mockFindProjectRoot,
}));

vi.spyOn(os, "homedir").mockReturnValue("/home/user");

describe("getConfigFilepath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the global config path when isGlobal is true", async () => {
    const result = await getConfigFilepath(true);
    expect(result).toBe(path.join("/home/user", CONFIG_FILE_NAMES[0]));
    expect(mockFindUp).not.toHaveBeenCalled();
    expect(mockFindMonorepoRoot).not.toHaveBeenCalled();
    expect(mockFindProjectRoot).not.toHaveBeenCalled();
  });

  it("should return the local config path if found", async () => {
    mockFindUp.mockResolvedValueOnce("/project/dir/custom-config.json");
    const result = await getConfigFilepath();
    expect(result).toBe("/project/dir/custom-config.json");
    expect(mockFindUp).toHaveBeenCalled();
    expect(mockFindMonorepoRoot).not.toHaveBeenCalled();
    expect(mockFindProjectRoot).not.toHaveBeenCalled();
  });

  it("should return the monorepo root path if no local config is found", async () => {
    mockFindUp.mockResolvedValueOnce(null);
    mockFindMonorepoRoot.mockResolvedValueOnce("/monorepo/root");
    const result = await getConfigFilepath();
    expect(result).toBe(path.join("/monorepo/root", CONFIG_FILE_NAMES[1]));
    expect(mockFindUp).toHaveBeenCalled();
    expect(mockFindMonorepoRoot).toHaveBeenCalled();
    expect(mockFindProjectRoot).not.toHaveBeenCalled();
  });

  it("should return the project root path if no local or monorepo config is found", async () => {
    mockFindUp.mockResolvedValueOnce(null);
    mockFindMonorepoRoot.mockResolvedValueOnce(null);
    mockFindProjectRoot.mockResolvedValueOnce("/project/root");
    const result = await getConfigFilepath();
    expect(result).toBe(path.join("/project/root", CONFIG_FILE_NAMES[1]));
    expect(mockFindUp).toHaveBeenCalled();
    expect(mockFindMonorepoRoot).toHaveBeenCalled();
    expect(mockFindProjectRoot).toHaveBeenCalled();
  });

  it("should return the default path if no config files are found", async () => {
    mockFindUp.mockResolvedValueOnce(null);
    mockFindMonorepoRoot.mockResolvedValueOnce(null);
    mockFindProjectRoot.mockResolvedValueOnce(null);

    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/default/path");
    const result = await getConfigFilepath();

    expect(result).toBe(path.join("/default/path", CONFIG_FILE_NAMES[0]));

    expect(cwdSpy).toHaveBeenCalled();
  });
});

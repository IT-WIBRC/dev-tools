import { vi, describe, it, expect, beforeEach } from "vitest";
import { getConfigFilepath } from "../../../../src/utils/configs/path-finder.js";
import { CONFIG_FILE_NAMES } from "../../../../src/utils/configs/schema.js";

// Mock external dependencies
const { mockFindUp, mockFindGlobalConfigFile } = vi.hoisted(() => ({
  mockFindUp: vi.fn(),
  mockFindGlobalConfigFile: vi.fn(),
}));

vi.mock("../../../../src/utils/files/find-up.js", () => ({
  findUp: mockFindUp,
}));

vi.mock("../../../../src/utils/files/finder.js", () => ({
  findGlobalConfigFile: mockFindGlobalConfigFile,
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

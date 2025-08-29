import { vi, describe, it, expect, beforeEach } from "vitest";
import path from "path";
import { homedir } from "os";
import { findUp } from "../../../../src/utils/files/find-up.js";

const { mockFsStat } = vi.hoisted(() => ({
  mockFsStat: vi.fn(),
}));

vi.mock("fs-extra", () => ({
  default: {
    promises: {
      stat: mockFsStat,
    },
  },
}));

describe("findUp", () => {
  const currentDir = path.resolve(process.cwd());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should find a single file in the current directory", async () => {
    mockFsStat.mockResolvedValueOnce({} as any);
    const result = await findUp("file.txt", currentDir);
    expect(result).toBe(path.join(currentDir, "file.txt"));
  });

  it("should find a single file in a parent directory", async () => {
    const parentDir = path.dirname(currentDir);
    mockFsStat.mockRejectedValueOnce(new Error("File not found"));
    mockFsStat.mockResolvedValueOnce({} as any);
    const result = await findUp("file.txt", currentDir);
    expect(result).toBe(path.join(parentDir, "file.txt"));
    expect(mockFsStat).toHaveBeenCalledTimes(2);
  });

  it("should find one of multiple files", async () => {
    mockFsStat
      .mockRejectedValueOnce(new Error("Not found"))
      .mockResolvedValueOnce({} as any);

    const result = await findUp(["file1.txt", "file2.txt"], currentDir);

    expect(result).toBe(path.join(currentDir, "file2.txt"));

    expect(mockFsStat).toHaveBeenCalledTimes(2);
    expect(mockFsStat).toHaveBeenNthCalledWith(
      1,
      path.join(currentDir, "file1.txt"),
    );
    expect(mockFsStat).toHaveBeenNthCalledWith(
      2,
      path.join(currentDir, "file2.txt"),
    );
  });

  it("should return null if the file is not found up to the home directory", async () => {
    mockFsStat.mockRejectedValue(new Error("Not found"));
    const result = await findUp("non-existent-file.txt", homedir());
    expect(result).toBeNull();
  });
});

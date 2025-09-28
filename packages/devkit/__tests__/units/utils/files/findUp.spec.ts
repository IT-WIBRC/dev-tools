import { vi, describe, it, expect, beforeEach } from "vitest";
import path from "path";
import { findUp } from "../../../../src/utils/files/find-up.js";

const { mockFsStat } = vi.hoisted(() => ({
  mockFsStat: vi.fn(),
}));

vi.mock("#utils/system/file.js", () => ({
  default: {
    stat: mockFsStat,
  },
}));

vi.mock("path", () => ({
  default: {
    resolve: vi.fn((p) => p),
    join: vi.fn((...args) => {
      const parts = args.filter(Boolean);
      if (parts[0] === "/") {
        return parts.join("");
      }
      return parts.join("/");
    }),
    dirname: vi.fn((p) => p.split("/").slice(0, -1).join("/")),
  },
}));

vi.mock("os", async () => {
  const actual = await vi.importActual("os");
  return {
    ...actual,
    default: {
      ...(actual as { default: {} }).default,
      homedir: vi.fn(() => "/mock-home"),
    },
  };
});

describe("findUp", () => {
  const currentDir = "/mock-cwd";
  const parentDir = "/mock";
  const limitDir = "/mock-limit";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, "cwd").mockReturnValue(currentDir);
  });

  it("should find a single file in the current directory", async () => {
    mockFsStat.mockResolvedValueOnce({
      isFile: () => true,
      isDirectory: () => false,
    });
    const result = await findUp({
      files: "file.txt",
      cwd: currentDir,
    });
    expect(result).toBe(`${currentDir}/file.txt`);
    expect(mockFsStat).toHaveBeenCalledTimes(1);
    expect(mockFsStat).toHaveBeenCalledWith(`${currentDir}/file.txt`);
  });

  it("should find a single file in a parent directory", async () => {
    vi.spyOn(path, "dirname").mockImplementation((p) => {
      if (p === currentDir) return parentDir;
      return "/";
    });
    mockFsStat
      .mockRejectedValueOnce(new Error("Not found"))
      .mockResolvedValueOnce({
        isFile: () => true,
        isDirectory: () => false,
      });
    const result = await findUp({
      files: "file.txt",
      cwd: currentDir,
    });
    expect(result).toBe(`${parentDir}/file.txt`);
    expect(mockFsStat).toHaveBeenCalledTimes(2);
    expect(mockFsStat).toHaveBeenNthCalledWith(1, `${currentDir}/file.txt`);
    expect(mockFsStat).toHaveBeenNthCalledWith(2, `${parentDir}/file.txt`);
  });

  it("should find a single directory in the current directory", async () => {
    mockFsStat.mockResolvedValueOnce({
      isFile: () => false,
      isDirectory: () => true,
    });
    const result = await findUp({
      files: "directory",
      cwd: currentDir,
    });
    expect(result).toBe(`${currentDir}/directory`);
    expect(mockFsStat).toHaveBeenCalledTimes(1);
    expect(mockFsStat).toHaveBeenCalledWith(`${currentDir}/directory`);
  });

  it("should find one of multiple files in the current directory", async () => {
    mockFsStat
      .mockRejectedValueOnce(new Error("Not found"))
      .mockResolvedValueOnce({
        isFile: () => true,
        isDirectory: () => false,
      });
    const result = await findUp({
      files: ["file1.txt", "file2.txt"],
      cwd: currentDir,
    });
    expect(result).toBe(`${currentDir}/file2.txt`);
    expect(mockFsStat).toHaveBeenCalledTimes(2);
    expect(mockFsStat).toHaveBeenNthCalledWith(1, `${currentDir}/file1.txt`);
    expect(mockFsStat).toHaveBeenNthCalledWith(2, `${currentDir}/file2.txt`);
  });

  it("should find one of multiple files in a parent directory", async () => {
    vi.spyOn(path, "dirname").mockImplementation((p) => {
      if (p === currentDir) return parentDir;
      return "/";
    });
    mockFsStat
      .mockRejectedValueOnce(new Error("Not found"))
      .mockRejectedValueOnce(new Error("Not found"))
      .mockResolvedValueOnce({
        isFile: () => true,
        isDirectory: () => false,
      });

    const result = await findUp({
      files: ["file1.txt", "file2.txt"],
      cwd: currentDir,
    });
    expect(result).toBe(`${parentDir}/file1.txt`);
    expect(mockFsStat).toHaveBeenCalledTimes(3);
    expect(mockFsStat).toHaveBeenNthCalledWith(1, `${currentDir}/file1.txt`);
    expect(mockFsStat).toHaveBeenNthCalledWith(2, `${currentDir}/file2.txt`);
    expect(mockFsStat).toHaveBeenNthCalledWith(3, `${parentDir}/file1.txt`);
  });

  it("should stop searching at the specified limit directory", async () => {
    vi.spyOn(path, "dirname").mockImplementation((p) => {
      if (p === currentDir) return parentDir;
      if (p === parentDir) return limitDir;
      return "/";
    });
    mockFsStat.mockRejectedValue(new Error("Not found"));
    const result = await findUp({
      files: "file.txt",
      cwd: currentDir,
      limit: limitDir,
    });
    expect(result).toBeNull();
    expect(mockFsStat).toHaveBeenCalledTimes(3);
  });

  it("should find a file at the limit directory", async () => {
    vi.spyOn(path, "dirname").mockImplementation((p) => {
      if (p === currentDir) return parentDir;
      if (p === parentDir) return limitDir;
      return "/";
    });
    mockFsStat
      .mockRejectedValueOnce(new Error("Not found"))
      .mockRejectedValueOnce(new Error("Not found"))
      .mockResolvedValueOnce({
        isFile: () => true,
        isDirectory: () => false,
      });

    const result = await findUp({
      files: "file.txt",
      cwd: currentDir,
      limit: limitDir,
    });
    expect(result).toBe(`${limitDir}/file.txt`);
    expect(mockFsStat).toHaveBeenCalledTimes(3);
    expect(mockFsStat).toHaveBeenNthCalledWith(3, `${limitDir}/file.txt`);
  });

  it("should return null if the file is not found up to the home directory", async () => {
    mockFsStat.mockRejectedValue(new Error("Not found"));
    const result = await findUp({
      files: "non-existent-file.txt",
      cwd: "/",
    });
    expect(result).toBeNull();
  });

  it("should handle `startDir` being the root directory correctly", async () => {
    mockFsStat.mockResolvedValueOnce({
      isFile: () => true,
      isDirectory: () => false,
    });
    const result = await findUp({
      files: "file.txt",
      cwd: "/",
    });
    expect(result).toBe("/file.txt");
    expect(mockFsStat).toHaveBeenCalledTimes(1);
  });

  it("should handle an empty list of files correctly", async () => {
    const result = await findUp({
      files: [],
      cwd: currentDir,
    });
    expect(result).toBeNull();
    expect(mockFsStat).not.toHaveBeenCalled();
  });
});

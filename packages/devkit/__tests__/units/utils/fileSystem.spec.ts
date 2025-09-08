import { vi, describe, it, expect, beforeEach } from "vitest";
import fileSystem from "../../../src/utils/fileSystem.js";

const {
  mockWriteFile,
  mockReadFile,
  mockStat,
  mockReaddir,
  mockCopyFile,
  mockMkdir,
  mockRm,
  mockAccess,
  mockExistsSync,
} = vi.hoisted(() => ({
  mockWriteFile: vi.fn(),
  mockReadFile: vi.fn(),
  mockStat: vi.fn(),
  mockReaddir: vi.fn(),
  mockCopyFile: vi.fn(),
  mockMkdir: vi.fn(),
  mockRm: vi.fn(),
  mockAccess: vi.fn(),
  mockExistsSync: vi.fn(),
}));

vi.mock("fs", () => ({
  promises: {
    writeFile: mockWriteFile,
    readFile: mockReadFile,
    stat: mockStat,
    readdir: mockReaddir,
    copyFile: mockCopyFile,
    mkdir: mockMkdir,
    rm: mockRm,
    access: mockAccess,
  },
  existsSync: mockExistsSync,
}));

vi.mock("path", async () => {
  const actual = await vi.importActual("path");
  return {
    ...(actual as object),
    resolve: vi.fn(),
    join: vi.fn().mockImplementation((...args) => args.join("/")),
  };
});

describe("fileSystem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("readJson", () => {
    it("should read a JSON file and return the parsed content", async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify({ name: "test" }));
      const data = await fileSystem.readJson("path/to/file.json");
      expect(mockReadFile).toHaveBeenCalledWith("path/to/file.json", {
        encoding: "utf8",
      });
      expect(data).toEqual({ name: "test" });
    });

    it("should throw an error if the file cannot be read", async () => {
      const readError = new Error("File not found");
      mockReadFile.mockRejectedValue(readError);
      await expect(fileSystem.readJson("path/to/file.json")).rejects.toThrow(
        readError,
      );
    });
  });

  describe("writeJson", () => {
    it("should write data to a JSON file", async () => {
      const data = { name: "test" };
      await fileSystem.writeJson("path/to/file.json", data);
      expect(mockWriteFile).toHaveBeenCalledWith(
        "path/to/file.json",
        JSON.stringify(data, null, 2),
      );
    });

    it("should throw an error if the file cannot be written", async () => {
      const writeError = new Error("Permission denied");
      mockWriteFile.mockRejectedValue(writeError);
      await expect(
        fileSystem.writeJson("path/to/file.json", {}),
      ).rejects.toThrow(writeError);
    });
  });

  describe("existsSync", () => {
    it("should return true if the path exists", () => {
      mockExistsSync.mockReturnValueOnce(true);
      expect(fileSystem.existsSync("path/to/file")).toBe(true);
      expect(mockExistsSync).toHaveBeenCalledWith("path/to/file");
    });

    it("should return false if the path does not exist", () => {
      mockExistsSync.mockReturnValueOnce(false);
      expect(fileSystem.existsSync("path/to/file")).toBe(false);
      expect(mockExistsSync).toHaveBeenCalledWith("path/to/file");
    });
  });

  describe("copy", () => {
    it("should copy a file without a filter", async () => {
      mockStat.mockResolvedValueOnce({
        isFile: () => true,
        isDirectory: () => false,
      });
      await fileSystem.copy("src/file.js", "dest/file.js");
      expect(mockStat).toHaveBeenCalledWith("src/file.js");
      expect(mockCopyFile).toHaveBeenCalledWith("src/file.js", "dest/file.js");
    });

    it("should copy a directory recursively", async () => {
      mockStat
        .mockResolvedValueOnce({
          isFile: () => false,
          isDirectory: () => true,
        })
        .mockResolvedValueOnce({
          isFile: () => true,
          isDirectory: () => false,
        });
      mockReaddir.mockResolvedValueOnce(["file.js"]);
      mockMkdir.mockResolvedValueOnce(undefined);
      mockCopyFile.mockResolvedValueOnce(undefined);
      await fileSystem.copy("src/dir", "dest/dir");
      expect(mockStat).toHaveBeenCalledWith("src/dir");
      expect(mockMkdir).toHaveBeenCalledWith("dest/dir", { recursive: true });
      expect(mockReaddir).toHaveBeenCalledWith("src/dir");
      expect(mockCopyFile).toHaveBeenCalledWith(
        "src/dir/file.js",
        "dest/dir/file.js",
      );
    });

    it("should not copy a filtered file", async () => {
      mockStat.mockResolvedValueOnce({
        isFile: () => true,
        isDirectory: () => false,
      });
      await fileSystem.copy("src/file.js", "dest/file.js", {
        filter: (src) => src !== "src/file.js",
      });
      expect(mockCopyFile).not.toHaveBeenCalled();
    });
  });

  describe("pathExists", () => {
    it("should return true if the path exists", async () => {
      mockAccess.mockResolvedValueOnce(undefined);
      const exists = await fileSystem.pathExists("path/to/file");
      expect(mockAccess).toHaveBeenCalledWith("path/to/file");
      expect(exists).toBe(true);
    });

    it("should return false if the path does not exist", async () => {
      mockAccess.mockRejectedValueOnce(new Error("Path does not exist"));
      const exists = await fileSystem.pathExists("path/to/file");
      expect(mockAccess).toHaveBeenCalledWith("path/to/file");
      expect(exists).toBe(false);
    });
  });

  describe("stat", () => {
    it("should return stat information for a file", async () => {
      const mockStats = {
        isFile: () => true,
        isDirectory: () => false,
      };
      mockStat.mockResolvedValueOnce(mockStats);
      const stats = await fileSystem.stat("path/to/file");
      expect(mockStat).toHaveBeenCalledWith("path/to/file");
      expect(stats).toEqual(mockStats);
    });

    it("should throw an error if the path does not exist", async () => {
      const statError = new Error("No such file or directory");
      mockStat.mockRejectedValueOnce(statError);
      await expect(fileSystem.stat("path/to/file")).rejects.toThrow(statError);
    });
  });

  describe("ensureDir", () => {
    it("should create a new directory and resolve", async () => {
      mockMkdir.mockResolvedValueOnce(undefined);
      await expect(
        fileSystem.ensureDir("path/to/new/dir"),
      ).resolves.toBeUndefined();
      expect(mockMkdir).toHaveBeenCalledWith("path/to/new/dir", {
        recursive: true,
      });
    });

    it("should not throw an error if the directory already exists", async () => {
      mockMkdir.mockResolvedValueOnce(undefined);
      await expect(
        fileSystem.ensureDir("path/to/existing/dir"),
      ).resolves.toBeUndefined();
      expect(mockMkdir).toHaveBeenCalledWith("path/to/existing/dir", {
        recursive: true,
      });
    });

    it("should throw an error for a permission issue", async () => {
      const permissionError = new Error(
        "EACCES: permission denied, mkdir 'path/to/dir'",
      );
      mockMkdir.mockRejectedValueOnce(permissionError);
      await expect(fileSystem.ensureDir("path/to/dir")).rejects.toThrow(
        permissionError,
      );
      expect(mockMkdir).toHaveBeenCalledWith("path/to/dir", {
        recursive: true,
      });
    });
  });

  describe("remove", () => {
    it("should call rm with recursive and force options", async () => {
      await fileSystem.remove("path/to/remove");
      expect(mockRm).toHaveBeenCalledWith("path/to/remove", {
        recursive: true,
        force: true,
      });
    });
  });

  describe("writeFile", () => {
    it("should call writeJson to write data to a file", async () => {
      mockWriteFile.mockResolvedValueOnce(null);
      const data = { key: "value" };
      await fileSystem.writeFile("path/to/file.json", data);

      expect(mockWriteFile).toHaveBeenCalledWith(
        "path/to/file.json",
        JSON.stringify(data, null, 2),
      );
    });

    it("should throw an error if writeJson fails", async () => {
      const writeError = new Error("Permission denied");
      const data = { key: "value" };

      await expect(
        fileSystem.writeFile("path/to/file.json", data),
      ).rejects.toThrow(writeError);

      expect(mockWriteFile).toHaveBeenCalledWith(
        "path/to/file.json",
        JSON.stringify(data, null, 2),
      );
    });
  });
});

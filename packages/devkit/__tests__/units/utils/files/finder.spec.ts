import { vi, describe, it, expect, beforeEach } from "vitest";
import { DevkitError } from "../../../../src/utils/errors/base.js";
import {
  findMonorepoRoot,
  findGlobalConfigFile,
  findProjectRoot,
  findPackageRoot,
  findLocalConfigFile,
} from "../../../../src/utils/files/finder.js";
import * as path from "path";

const { mockFindUp, mockFs, mockOs } = vi.hoisted(() => ({
  mockFindUp: vi.fn(),
  mockFs: {
    readJson: vi.fn(),
    pathExists: vi.fn(),
  },
  mockOs: {
    homedir: vi.fn(),
  },
}));

vi.mock("../../../../src/utils/files/find-up.js", () => ({
  findUp: mockFindUp,
}));

vi.mock("fs-extra", () => ({
  default: {
    readJson: mockFs.readJson,
    pathExists: mockFs.pathExists,
  },
}));

vi.mock("os", () => ({
  default: {
    homedir: mockOs.homedir,
  },
}));

vi.mock("url", () => ({
  fileURLToPath: vi.fn().mockReturnValue("/test/devkit/dist/finder.js"),
}));

vi.mock("path", async (importOriginal) => {
  const actual = await importOriginal<typeof import("path")>();
  return {
    ...actual,
    dirname: vi.fn(actual.dirname),
    join: vi.fn(actual.join),
  };
});

describe("Finder Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findMonorepoRoot", () => {
    it("should return the monorepo root path when pnpm-workspace.yaml is found", async () => {
      mockFindUp.mockResolvedValueOnce("/test/monorepo/pnpm-workspace.yaml");
      const result = await findMonorepoRoot();
      expect(result).toBe("/test/monorepo");
    });

    it("should return the monorepo root path when lerna.json is found", async () => {
      mockFindUp.mockResolvedValueOnce("/test/monorepo/lerna.json");
      const result = await findMonorepoRoot();
      expect(result).toBe("/test/monorepo");
    });

    it("should return the monorepo root path when package.json with 'workspaces' is found", async () => {
      mockFindUp.mockResolvedValueOnce("/test/monorepo/package.json");
      mockFs.readJson.mockResolvedValueOnce({ workspaces: ["packages/*"] });
      const result = await findMonorepoRoot();
      expect(result).toBe("/test/monorepo");
    });

    it("should return null if no monorepo indicators are found", async () => {
      mockFindUp.mockResolvedValue(null);
      const result = await findMonorepoRoot();
      expect(result).toBeNull();
    });

    it("should search parent directories if a package.json without 'workspaces' is found", async () => {
      mockFindUp
        .mockResolvedValueOnce("/test/project/package.json")
        .mockResolvedValueOnce("/test/monorepo/package.json");
      mockFs.readJson
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ workspaces: ["packages/*"] });
      const result = await findMonorepoRoot();
      expect(result).toBe("/test/monorepo");
      expect(mockFindUp).toHaveBeenCalledTimes(2);
    });
  });

  describe("findGlobalConfigFile", () => {
    it("should return the path of an existing global config file", async () => {
      mockOs.homedir.mockReturnValue("/home/user");
      vi.mocked(path.join).mockReturnValueOnce("/home/user/.devkitrc");
      mockFs.pathExists.mockResolvedValueOnce(true);

      const result = await findGlobalConfigFile();
      expect(result).toBe("/home/user/.devkitrc");
    });

    it("should return the default path if no global config file exists", async () => {
      mockOs.homedir.mockReturnValueOnce("/home/user");
      vi.mocked(path.join).mockReturnValueOnce("/home/user/.devkitrc");
      mockFs.pathExists.mockResolvedValueOnce(false);

      const result = await findGlobalConfigFile();
      expect(result).toBe("/home/user/.devkitrc");
    });
  });

  describe("findProjectRoot", () => {
    it("should return the project root path", async () => {
      mockFindUp.mockResolvedValue("/test/project/package.json");
      const result = await findProjectRoot();
      expect(result).toBe("/test/project");
    });

    it("should return null if project root is not found", async () => {
      mockFindUp.mockResolvedValue(null);
      const result = await findProjectRoot();
      expect(result).toBeNull();
    });
  });

  describe("findPackageRoot", () => {
    it("should return the package root path", async () => {
      mockFindUp.mockResolvedValue("/test/package/package.json");
      const result = await findPackageRoot();
      expect(result).toBe("/test/package");
    });

    it("should throw a DevkitError if package root is not found", async () => {
      mockFindUp.mockResolvedValue(null);
      await expect(findPackageRoot()).rejects.toThrow(DevkitError);
    });
  });

  describe("findLocalConfigFile", () => {
    it("should find the config file by searching upwards in a non-monorepo and checking both file names", async () => {
      vi.spyOn(process, "cwd").mockReturnValue("/test/project/src");
      mockFs.pathExists
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result = await findLocalConfigFile();
      expect(result).toBe("/test/project/.devkitrc");
      expect(mockFs.pathExists).toHaveBeenCalledTimes(4);
    });

    it("should find the config file in the monorepo root from a package subdirectory", async () => {
      vi.spyOn(process, "cwd").mockReturnValue(
        "/test/monorepo/packages/my-package",
      );
      vi.spyOn(
        await import("../../../../src/utils/files/finder.js"),
        "findMonorepoRoot",
      ).mockResolvedValueOnce("/test/monorepo");

      mockFs.pathExists
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result = await findLocalConfigFile();
      expect(result).toBe("/test/monorepo/.devkit.json");
      expect(mockFs.pathExists).toHaveBeenCalledWith(
        "/test/monorepo/.devkit.json",
      );
    });
  });
});

import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  findMonorepoRoot,
  findProjectRoot,
  findPackageRoot,
} from "../../../../src/utils/files/finder.js";
import { DevkitError } from "../../../../src/utils/errors/base.js";

const { mockFsStat, mockFsReadJson, mockFindUpLogic } = vi.hoisted(() => {
  const mockFsStat = vi.fn();
  const mockFsReadJson = vi.fn();

  const mockFindUpLogic = vi.fn(async ({ files, cwd = process.cwd() }) => {
    let currentDir = cwd;
    const filesToFind = Array.isArray(files) ? files : [files];

    while (true) {
      for (const file of filesToFind) {
        const filePath = `${currentDir}/${file}`.replace(/\/\//g, "/");

        try {
          const stats = await mockFsStat(filePath);
          if (stats.isFile() || stats.isDirectory()) {
            return filePath;
          }
        } catch (e) {
          // File not found, continue search
        }
      }

      const parentDir = currentDir.split("/").slice(0, -1).join("/") || "/";

      if (parentDir === currentDir || currentDir === "/mock-home") {
        break;
      }

      currentDir = parentDir;
    }

    return null;
  });

  return { mockFsStat, mockFsReadJson, mockFindUpLogic };
});

vi.mock("#utils/fileSystem.js", () => ({
  default: {
    stat: mockFsStat,
    readJson: mockFsReadJson,
    pathExists: vi.fn(async (p) => {
      try {
        await mockFsStat(p);
        return true;
      } catch (e) {
        return false;
      }
    }),
  },
}));

vi.mock("path", () => {
  const pathMock = {
    dirname: vi.fn((p) => {
      const parts = p.split("/");
      if (parts.length <= 2 && parts[0] === "") return "/";
      return parts.slice(0, -1).join("/");
    }),
    basename: vi.fn((p) => p.split("/").pop()),
    join: vi.fn((...args) => args.join("/")),
    resolve: vi.fn((p) => p),
  };
  return { ...pathMock, default: pathMock };
});

vi.mock("os", async () => {
  const actual = await vi.importActual("os");
  return {
    ...actual,
    homedir: vi.fn(() => "/mock-home"),
  };
});

vi.mock("../../../../src/utils/files/find-up.js", () => ({
  findUp: mockFindUpLogic,
}));

vi.mock("url", () => ({
  fileURLToPath: vi.fn().mockReturnValue("/test/devkit/dist/finder.js"),
}));

describe("Finder Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findMonorepoRoot", () => {
    it("should return the monorepo root path when a pnpm-workspace.yaml is found", async () => {
      vi.spyOn(process, "cwd").mockReturnValue(
        "/test/monorepo/packages/my-package",
      );
      mockFsStat.mockImplementation(async (filePath) => {
        if (filePath === "/test/monorepo/pnpm-workspace.yaml") {
          return { isFile: () => true, isDirectory: () => false };
        }
        throw new Error("Not found");
      });
      const result = await findMonorepoRoot();
      expect(result).toBe("/test/monorepo");
    });

    it("should return the monorepo root path when a lerna.json is found", async () => {
      vi.spyOn(process, "cwd").mockReturnValue(
        "/test/monorepo/packages/my-package",
      );
      mockFsStat.mockImplementation(async (filePath) => {
        if (filePath === "/test/monorepo/lerna.json") {
          return { isFile: () => true, isDirectory: () => false };
        }
        throw new Error("Not found");
      });
      const result = await findMonorepoRoot();
      expect(result).toBe("/test/monorepo");
    });

    it("should return the monorepo root path when node_modules is found", async () => {
      vi.spyOn(process, "cwd").mockReturnValue(
        "/test/monorepo/packages/my-package",
      );
      mockFsStat.mockImplementation(async (filePath) => {
        if (filePath === "/test/monorepo/node_modules") {
          return { isFile: () => false, isDirectory: () => true };
        }
        throw new Error("Not found");
      });
      const result = await findMonorepoRoot();
      expect(result).toBe("/test/monorepo");
    });

    it("should return null if no monorepo indicators are found", async () => {
      vi.spyOn(process, "cwd").mockReturnValue("/test/project/my-package");
      mockFsStat.mockRejectedValue(new Error("Not found"));
      const result = await findMonorepoRoot();
      expect(result).toBeNull();
    });
  });

  describe("findProjectRoot", () => {
    it("should return the project root path when node_modules is found", async () => {
      vi.spyOn(process, "cwd").mockReturnValue("/test/project/src");
      mockFsStat.mockImplementation(async (filePath) => {
        if (filePath === "/test/project/node_modules") {
          return { isFile: () => false, isDirectory: () => true };
        }
        throw new Error("Not found");
      });
      const result = await findProjectRoot();
      expect(result).toBe("/test/project");
    });

    it("should return null if node_modules is not found", async () => {
      vi.spyOn(process, "cwd").mockReturnValue("/test/project/src");
      mockFsStat.mockRejectedValue(new Error("Not found"));
      const result = await findProjectRoot();
      expect(result).toBeNull();
    });
  });

  describe("findPackageRoot", () => {
    it("should return the package root path", async () => {
      mockFsStat.mockImplementation(async (filePath) => {
        if (filePath === "/test/devkit/package.json") {
          return { isFile: () => true, isDirectory: () => false };
        }
        throw new Error("Not found");
      });
      const result = await findPackageRoot();
      expect(result).toBe("/test/devkit");
    });

    it("should throw a DevkitError if package root is not found", async () => {
      mockFsStat.mockRejectedValue(new Error("Not found"));
      await expect(findPackageRoot()).rejects.toThrow(DevkitError);
    });
  });
});

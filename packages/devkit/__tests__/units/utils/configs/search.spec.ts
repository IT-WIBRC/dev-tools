import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  findLocalConfigFile,
  findGlobalConfigFile,
} from "../../../../src/utils/configs/search.js";
import { CONFIG_FILE_NAMES as configFileNames } from "../../../integrations/common.js";

const CONFIG_FILE_NAMES = configFileNames as unknown as string[];
const {
  mockFindFileInDirectory,
  mockFindMonorepoRoot,
  mockFindProjectRoot,
  mockFindUp,
  mockOs,
} = vi.hoisted(() => ({
  mockFindFileInDirectory: vi.fn(),
  mockFindMonorepoRoot: vi.fn(),
  mockFindProjectRoot: vi.fn(),
  mockFindUp: vi.fn(),
  mockOs: {
    homedir: vi.fn(),
  },
}));

vi.mock("#utils/files/finder.js", () => ({
  findFileInDirectory: mockFindFileInDirectory,
  findMonorepoRoot: mockFindMonorepoRoot,
  findProjectRoot: mockFindProjectRoot,
}));

vi.mock("#utils/files/find-up.js", () => ({
  findUp: mockFindUp,
}));

vi.mock("os", () => ({
  default: {
    homedir: mockOs.homedir,
  },
}));

describe("Config Search Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findGlobalConfigFile", () => {
    it("should call findFileInDirectory with the home directory", async () => {
      const homeDir = "/home/user";
      mockOs.homedir.mockReturnValue(homeDir);
      mockFindFileInDirectory.mockResolvedValueOnce(
        `${homeDir}/${CONFIG_FILE_NAMES[0]}`,
      );

      const result = await findGlobalConfigFile();

      expect(mockOs.homedir).toHaveBeenCalled();
      expect(mockFindFileInDirectory).toHaveBeenCalledWith(
        homeDir,
        expect.arrayContaining(CONFIG_FILE_NAMES),
      );
      expect(result).toBe(`${homeDir}/${CONFIG_FILE_NAMES[0]}`);
    });

    it("should return null if no global config is found", async () => {
      mockOs.homedir.mockReturnValue("/home/user");
      mockFindFileInDirectory.mockResolvedValueOnce(null);

      const result = await findGlobalConfigFile();

      expect(result).toBeNull();
    });
  });

  describe("findLocalConfigFile", () => {
    const cwd = "/current/dir";
    const monorepoRoot = "/monorepo/root";
    const projectRoot = "/project/root";
    const localConfigPath = `${cwd}/${CONFIG_FILE_NAMES[0]}`;

    beforeEach(() => {
      vi.spyOn(process, "cwd").mockReturnValue(cwd);
    });

    it("should use the monorepo root as the search limit if it exists", async () => {
      mockFindMonorepoRoot.mockResolvedValueOnce(monorepoRoot);
      mockFindProjectRoot.mockResolvedValueOnce(projectRoot);
      mockFindUp.mockResolvedValueOnce(
        `${monorepoRoot}/${CONFIG_FILE_NAMES[0]}`,
      );

      const result = await findLocalConfigFile();

      expect(mockFindUp).toHaveBeenCalledWith({
        files: expect.arrayContaining(CONFIG_FILE_NAMES),
        cwd: cwd,
        limit: monorepoRoot,
      });
      expect(result).toBe(`${monorepoRoot}/${CONFIG_FILE_NAMES[0]}`);
    });

    it("should use the project root as the search limit if it exists and no monorepo root is found", async () => {
      mockFindMonorepoRoot.mockResolvedValueOnce(null);
      mockFindProjectRoot.mockResolvedValueOnce(projectRoot);
      mockFindUp.mockResolvedValueOnce(
        `${projectRoot}/${CONFIG_FILE_NAMES[0]}`,
      );

      const result = await findLocalConfigFile();

      expect(mockFindUp).toHaveBeenCalledWith({
        files: expect.arrayContaining(CONFIG_FILE_NAMES),
        cwd: cwd,
        limit: projectRoot,
      });
      expect(result).toBe(`${projectRoot}/${CONFIG_FILE_NAMES[0]}`);
    });

    it("should use the current working directory as the search limit if no project or monorepo root is found", async () => {
      mockFindMonorepoRoot.mockResolvedValueOnce(null);
      mockFindProjectRoot.mockResolvedValueOnce(null);
      mockFindUp.mockResolvedValueOnce(localConfigPath);

      const result = await findLocalConfigFile();

      expect(mockFindUp).toHaveBeenCalledWith({
        files: expect.arrayContaining(CONFIG_FILE_NAMES),
        cwd: cwd,
        limit: cwd,
      });
      expect(result).toBe(localConfigPath);
    });

    it("should return null if no local config file is found within the search limit", async () => {
      mockFindMonorepoRoot.mockResolvedValueOnce(null);
      mockFindProjectRoot.mockResolvedValueOnce(projectRoot);
      mockFindUp.mockResolvedValueOnce(null);

      const result = await findLocalConfigFile();

      expect(result).toBeNull();
    });
  });
});

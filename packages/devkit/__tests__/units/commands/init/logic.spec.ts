import { vi, describe, it, expect, beforeEach, afterAll } from "vitest";
import {
  promptForStandardOverwrite,
  handleGlobalInit,
  handleLocalInit,
} from "../../../../src/commands/init/logic.js";
import { CONFIG_FILE_NAMES } from "../../../../src/utils/schema/schema.js";
import { mockSpinner, mocktFn, mockLogger } from "../../../../vitest.setup.js";

const {
  mockFs,
  mockPath,
  mockOs,
  mockSelect,
  mockFindGlobalConfigFile,
  mockFindMonorepoRoot,
  mockFindProjectRoot,
  mockFindUp,
  mockSaveConfig,
  mockGetPackageManager,
} = vi.hoisted(() => ({
  mockFs: {
    pathExists: vi.fn(),
  },
  mockPath: {
    join: vi.fn(),
  },
  mockOs: {
    homedir: vi.fn(),
  },
  mockSelect: vi.fn(),
  mockFindGlobalConfigFile: vi.fn(),
  mockFindMonorepoRoot: vi.fn(),
  mockFindProjectRoot: vi.fn(),
  mockFindUp: vi.fn(),
  mockSaveConfig: vi.fn(),
  mockGetPackageManager: vi.fn(),
}));

vi.mock("#utils/fs/file.js", () => ({ default: mockFs }));
vi.mock("path", () => ({ default: mockPath }));
vi.mock("os", () => ({ default: mockOs }));
vi.mock("@inquirer/prompts", () => ({ select: mockSelect }));
vi.mock("#core/config/search.js", () => ({
  findGlobalConfigFile: mockFindGlobalConfigFile,
}));
vi.mock("#utils/fs/finder.js", () => ({
  findMonorepoRoot: mockFindMonorepoRoot,
  findProjectRoot: mockFindProjectRoot,
}));
vi.mock("#utils/fs/find-up.js", () => ({ findUp: mockFindUp }));
vi.mock("#core/config/writer.js", () => ({ saveConfig: mockSaveConfig }));
vi.mock("#utils/package-manager/index.js", () => ({
  getPackageManager: mockGetPackageManager,
}));

const CONFIG_INIT_START_KEY = "messages.status.config_init_start";
const CONFIG_INITIALIZED_KEY = "messages.success.config_initialized";
const CONFIRM_OVERWRITE_KEY = "commands.config.init.confirm_overwrite";
const INIT_ABORTED_KEY = "commands.config.init.aborted";
const COMMON_YES_KEY = "common.yes";
const COMMON_NO_KEY = "common.no";

describe("Init Command Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPath.join.mockImplementation((...args) => args.join("/"));
    mockOs.homedir.mockReturnValue("/home/user");
    mockGetPackageManager.mockResolvedValue("pnpm");
  });

  describe("promptForStandardOverwrite", () => {
    const mockPath = "/path/to/config.json";

    it("should return true if the user selects 'yes'", async () => {
      mockSelect.mockResolvedValue(true);
      const result = await promptForStandardOverwrite(mockPath);

      expect(mockSelect).toHaveBeenCalledWith({
        message: mockLogger.colors.yellow(
          mocktFn(CONFIRM_OVERWRITE_KEY, { path: mockPath }),
        ),
        choices: [
          { name: mocktFn(COMMON_YES_KEY), value: true },
          { name: mocktFn(COMMON_NO_KEY), value: false },
        ],
        default: true,
      });
      expect(result).toBe(true);
    });

    it("should return false if the user selects 'no'", async () => {
      mockSelect.mockResolvedValue(false);
      const result = await promptForStandardOverwrite(mockPath);
      expect(result).toBe(false);
    });
  });

  describe("handleGlobalInit", () => {
    const globalFileName = CONFIG_FILE_NAMES[0];
    const defaultGlobalPath = `/home/user/${globalFileName}`;

    it("should create config at default global path if no existing file is found", async () => {
      mockFindGlobalConfigFile.mockResolvedValue(null);
      mockFs.pathExists.mockResolvedValue(false);

      await handleGlobalInit(mockSpinner);

      expect(mockPath.join).toHaveBeenCalledWith("/home/user", globalFileName);

      expect(mockSaveConfig).toHaveBeenCalledTimes(1);
      expect(mockSaveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({ defaultPackageManager: "pnpm" }),
        }),
        defaultGlobalPath,
      );

      expect(mockSpinner.start).toHaveBeenCalledWith(
        mockLogger.colors.cyan(
          mocktFn(CONFIG_INIT_START_KEY, { path: defaultGlobalPath }),
        ),
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mockLogger.colors.green(mocktFn(CONFIG_INITIALIZED_KEY)),
      );
      expect(mockSpinner.info).not.toHaveBeenCalled();
    });

    it("should use existing global config path if found and overwrite is confirmed", async () => {
      const existingPath = "/etc/custom/config.json";
      mockFindGlobalConfigFile.mockResolvedValue(existingPath);
      mockFs.pathExists.mockResolvedValue(true);
      mockSelect.mockResolvedValue(true);

      await handleGlobalInit(mockSpinner);

      expect(mockSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(existingPath),
        }),
      );

      expect(mockSaveConfig).toHaveBeenCalledWith(
        expect.any(Object),
        existingPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalled();
      expect(mockSpinner.info).not.toHaveBeenCalled();
    });

    it("should abort if existing global config file is found and overwrite is denied", async () => {
      const existingPath = "/home/user/.cli-config.json";
      mockFindGlobalConfigFile.mockResolvedValue(null);
      mockFs.pathExists.mockResolvedValue(true);
      mockSelect.mockResolvedValue(false);

      await handleGlobalInit(mockSpinner);

      expect(mockSelect).toHaveBeenCalled();

      expect(mockSaveConfig).not.toHaveBeenCalled();
      expect(mockSpinner.info).toHaveBeenCalledWith(
        mockLogger.colors.yellow(mocktFn(INIT_ABORTED_KEY)),
      );
      expect(mockSpinner.succeed).not.toHaveBeenCalled();
    });

    it("should detect and set 'yarn' as the default package manager", async () => {
      mockFindGlobalConfigFile.mockResolvedValue(null);
      mockFs.pathExists.mockResolvedValue(false);
      mockGetPackageManager.mockResolvedValue("yarn");

      await handleGlobalInit(mockSpinner);

      expect(mockSaveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({ defaultPackageManager: "yarn" }),
        }),
        defaultGlobalPath,
      );
    });
  });

  describe("handleLocalInit", () => {
    const localFileName = CONFIG_FILE_NAMES[1];
    const currentPath = "/project/current";
    const monorepoRoot = "/project";
    const projectRoot = "/project/sub";

    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(currentPath);

    it("should create config at the project root if no existing file is found", async () => {
      mockFindUp.mockResolvedValue(null);
      mockFindMonorepoRoot.mockResolvedValue(null);
      mockFindProjectRoot.mockResolvedValue(projectRoot);

      const expectedPath = `${projectRoot}/${localFileName}`;

      await handleLocalInit(mockSpinner);

      expect(mockFindUp).toHaveBeenCalledWith(
        expect.objectContaining({ cwd: projectRoot, limit: projectRoot }),
      );
      expect(mockPath.join).toHaveBeenCalledWith(projectRoot, localFileName);

      expect(mockSaveConfig).toHaveBeenCalledWith(
        expect.any(Object),
        expectedPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalled();
    });

    it("should prioritize monorepo root for path construction", async () => {
      mockFindUp.mockResolvedValue(null);
      mockFindMonorepoRoot.mockResolvedValue(monorepoRoot);
      mockFindProjectRoot.mockResolvedValue(projectRoot);

      const expectedPath = `${monorepoRoot}/${localFileName}`;

      await handleLocalInit(mockSpinner);

      expect(mockFindUp).toHaveBeenCalledWith(
        expect.objectContaining({ cwd: monorepoRoot, limit: monorepoRoot }),
      );
      expect(mockPath.join).toHaveBeenCalledWith(monorepoRoot, localFileName);
      expect(mockSaveConfig).toHaveBeenCalledWith(
        expect.any(Object),
        expectedPath,
      );
    });

    it("should use process.cwd() if no project or monorepo root is found", async () => {
      mockFindUp.mockResolvedValue(null);
      mockFindMonorepoRoot.mockResolvedValue(null);
      mockFindProjectRoot.mockResolvedValue(null);

      const expectedPath = `${currentPath}/${localFileName}`;

      await handleLocalInit(mockSpinner);

      expect(mockFindUp).toHaveBeenCalledWith(
        expect.objectContaining({ cwd: currentPath, limit: currentPath }),
      );
      expect(mockPath.join).toHaveBeenCalledWith(currentPath, localFileName);
      expect(mockSaveConfig).toHaveBeenCalledWith(
        expect.any(Object),
        expectedPath,
      );
    });

    it("should use existing config path and save if overwrite is confirmed", async () => {
      const existingPath = "/project/.cli-config.json";
      mockFindUp.mockResolvedValue(existingPath);
      mockSelect.mockResolvedValue(true);
      mockFindMonorepoRoot.mockResolvedValue(monorepoRoot);

      await handleLocalInit(mockSpinner);

      expect(mockSelect).toHaveBeenCalled();
      expect(mockSaveConfig).toHaveBeenCalledWith(
        expect.any(Object),
        existingPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalled();
    });

    it("should use existing config path and abort if overwrite is denied", async () => {
      const existingPath = "/project/current/.cli-config.json";
      mockFindUp.mockResolvedValue(existingPath);
      mockSelect.mockResolvedValue(false);

      await handleLocalInit(mockSpinner);

      expect(mockSelect).toHaveBeenCalled();

      expect(mockSaveConfig).not.toHaveBeenCalled();
      expect(mockSpinner.info).toHaveBeenCalledWith(
        mockLogger.colors.yellow(mocktFn(INIT_ABORTED_KEY)),
      );
      expect(mockSpinner.succeed).not.toHaveBeenCalled();
    });

    afterAll(() => {
      cwdSpy.mockRestore();
    });
  });
});

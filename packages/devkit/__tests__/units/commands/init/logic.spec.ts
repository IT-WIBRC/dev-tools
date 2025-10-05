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

const CONFIRM_OVERWRITE_KEY = "commands.config.init.confirm_overwrite";
const INIT_ABORTED_KEY = "commands.config.init.aborted";
const SKIP_YES_CONFIRM_KEY = "commands.config.init.skip_yes_confirm";
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

    it("should return true if the user selects 'yes' (interactive)", async () => {
      mockSelect.mockResolvedValue(true);
      const result = await promptForStandardOverwrite(mockPath, false);

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
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it("should return false if the user selects 'no' (interactive)", async () => {
      mockSelect.mockResolvedValue(false);
      const result = await promptForStandardOverwrite(mockPath, false);
      expect(result).toBe(false);
    });

    it("should return true immediately and log info if skipConfirmation is true", async () => {
      const result = await promptForStandardOverwrite(mockPath, true);

      expect(mockSelect).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        mockLogger.colors.yellow(
          mocktFn(SKIP_YES_CONFIRM_KEY, { path: mockPath }),
        ),
      );
      expect(result).toBe(true);
    });
  });

  describe("handleGlobalInit", () => {
    it("should create config at default global path if no existing file is found", async () => {
      mockFindGlobalConfigFile.mockResolvedValue(null);
      mockFs.pathExists.mockResolvedValue(false);

      await handleGlobalInit(mockSpinner, false);

      expect(mockSaveConfig).toHaveBeenCalledTimes(1);
      expect(mockSpinner.succeed).toHaveBeenCalled();
    });

    it("should use existing global config path if found and overwrite is confirmed (interactive)", async () => {
      const existingPath = "/etc/custom/config.json";
      mockFindGlobalConfigFile.mockResolvedValue(existingPath);
      mockFs.pathExists.mockResolvedValue(true);
      mockSelect.mockResolvedValue(true);

      await handleGlobalInit(mockSpinner, false);

      expect(mockSelect).toHaveBeenCalled();
      expect(mockSaveConfig).toHaveBeenCalledWith(
        expect.any(Object),
        existingPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalled();
    });

    it("should abort if existing global config file is found and overwrite is denied (interactive)", async () => {
      mockFindGlobalConfigFile.mockResolvedValue(null);
      mockFs.pathExists.mockResolvedValue(true);
      mockSelect.mockResolvedValue(false);

      await handleGlobalInit(mockSpinner, false);

      expect(mockSelect).toHaveBeenCalled();
      expect(mockSaveConfig).not.toHaveBeenCalled();
      expect(mockSpinner.info).toHaveBeenCalledWith(
        mockLogger.colors.yellow(mocktFn(INIT_ABORTED_KEY)),
      );
    });

    it("should overwrite existing config without prompting if skipConfirmation is true", async () => {
      const existingPath = "/etc/custom/config.json";
      mockFindGlobalConfigFile.mockResolvedValue(existingPath);
      mockFs.pathExists.mockResolvedValue(true);

      await handleGlobalInit(mockSpinner, true);

      expect(mockSelect).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        mockLogger.colors.yellow(
          mocktFn(SKIP_YES_CONFIRM_KEY, { path: existingPath }),
        ),
      );
      expect(mockSaveConfig).toHaveBeenCalledWith(
        expect.any(Object),
        existingPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalled();
    });
  });

  describe("handleLocalInit", () => {
    const localFileName = CONFIG_FILE_NAMES[1];
    const currentPath = "/project/current";
    const monorepoRoot = "/project";
    const projectRoot = "/project/sub";
    const existingPath = "/project/.cli-config.json";

    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(currentPath);

    it("should create config at the project root if no existing file is found", async () => {
      mockFindUp.mockResolvedValue(null);
      mockFindMonorepoRoot.mockResolvedValue(null);
      mockFindProjectRoot.mockResolvedValue(projectRoot);

      const expectedPath = `${projectRoot}/${localFileName}`;

      await handleLocalInit(mockSpinner, false);

      expect(mockPath.join).toHaveBeenCalledWith(projectRoot, localFileName);
      expect(mockSaveConfig).toHaveBeenCalledWith(
        expect.any(Object),
        expectedPath,
      );
    });

    it("should use existing config path and save if overwrite is confirmed (interactive)", async () => {
      mockFindUp.mockResolvedValue(existingPath);
      mockSelect.mockResolvedValue(true);
      mockFindMonorepoRoot.mockResolvedValue(monorepoRoot);

      await handleLocalInit(mockSpinner, false);

      expect(mockSelect).toHaveBeenCalled();
      expect(mockSaveConfig).toHaveBeenCalledWith(
        expect.any(Object),
        existingPath,
      );
    });

    it("should use existing config path and abort if overwrite is denied (interactive)", async () => {
      mockFindUp.mockResolvedValue(existingPath);
      mockSelect.mockResolvedValue(false);

      await handleLocalInit(mockSpinner, false);

      expect(mockSelect).toHaveBeenCalled();
      expect(mockSaveConfig).not.toHaveBeenCalled();
      expect(mockSpinner.info).toHaveBeenCalledWith(
        mockLogger.colors.yellow(mocktFn(INIT_ABORTED_KEY)),
      );
    });

    it("should overwrite existing config without prompting if skipConfirmation is true", async () => {
      mockFindUp.mockResolvedValue(existingPath);

      await handleLocalInit(mockSpinner, true);

      expect(mockSelect).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        mockLogger.colors.yellow(
          mocktFn(SKIP_YES_CONFIRM_KEY, { path: existingPath }),
        ),
      );
      expect(mockSaveConfig).toHaveBeenCalledWith(
        expect.any(Object),
        existingPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalled();
    });

    afterAll(() => {
      cwdSpy.mockRestore();
    });
  });
});

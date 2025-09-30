import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupInitCommand } from "../../../src/commands/init.js";
import {
  CONFIG_FILE_NAMES,
  defaultCliConfig,
} from "../../../src/utils/schema/schema.js";
import { mockSpinner } from "../../../vitest.setup.js";
import { ConfigError } from "../../../src/utils/errors/base.js";
import path from "path";
import os from "os";

const {
  mockFs,
  mockInquirerSelect,
  mockSaveConfig,
  mockHandleErrorAndExit,
  mockFindUp,
  mockFindMonorepoRoot,
  mockFindProjectRoot,
  mockFindGlobalConfigFile,
  mockGetPackageManager,
} = vi.hoisted(() => ({
  mockFs: {
    pathExists: vi.fn(),
  },
  mockInquirerSelect: vi.fn(),
  mockSaveConfig: vi.fn(),
  mockHandleErrorAndExit: vi.fn(),
  mockFindUp: vi.fn(),
  mockFindMonorepoRoot: vi.fn(),
  mockFindProjectRoot: vi.fn(),
  mockFindGlobalConfigFile: vi.fn(),
  mockGetPackageManager: vi.fn(),
}));

let actionFn: (...options: unknown[]) => Promise<void>;
vi.mock("os", async () => {
  const actual = await vi.importActual("os");
  return {
    ...actual,
    homedir: vi.fn(() => "/home/user"),
  };
});

vi.mock("process", () => ({
  default: {
    cwd: vi.fn(() => "/current/directory"),
  },
}));

vi.mock("#utils/fs/file.js", () => ({
  default: {
    pathExists: mockFs.pathExists,
  },
}));

vi.mock("#utils/package-manager/index.js", () => ({
  getPackageManager: mockGetPackageManager,
}));

vi.mock("@inquirer/prompts", () => ({ select: mockInquirerSelect }));

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#core/config/writer.js", () => ({
  saveConfig: mockSaveConfig,
}));

vi.mock("#utils/fs/find-up.js", () => ({
  findUp: mockFindUp,
}));

vi.mock("#utils/fs/finder.js", () => ({
  findMonorepoRoot: mockFindMonorepoRoot,
  findProjectRoot: mockFindProjectRoot,
}));

vi.mock("#core/config/search.js", () => ({
  findGlobalConfigFile: mockFindGlobalConfigFile,
}));

const LOCAL_OPTION_KEY = "commands.config.init.option.local";
const GLOBAL_OPTION_KEY = "commands.config.init.option.global";
const CONFIRM_OVERWRITE_KEY = "commands.config.init.confirm_overwrite";
const SUCCESS_KEY = "messages.success.config_initialized";
const ABORTED_KEY = "commands.config.init.aborted";
const YES_KEY = "common.yes";
const NO_KEY = "common.no";
const LOCAL_GLOBAL_ERROR_KEY = "errors.config.init_local_and_global";

describe("setupInitCommand", () => {
  let mockProgram: any;
  const localConfigFile = CONFIG_FILE_NAMES[1];
  const globalConfigFile = CONFIG_FILE_NAMES[0];
  const localConfigPath = `/current/directory/${localConfigFile}`;
  const globalConfigPath = `/home/user/${globalConfigFile}`;
  const monorepoRootPath = "/monorepo/root";
  const monorepoRootConfigPath = path.join(monorepoRootPath, localConfigFile);
  const projectRootPath = "/project/root";
  const projectRootConfigPath = path.join(projectRootPath, localConfigFile);

  const mockDetectedConfig = {
    ...defaultCliConfig,
    settings: { ...defaultCliConfig.settings, defaultPackageManager: "npm" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    actionFn = vi.fn();
    mockProgram = {
      command: vi.fn(() => mockProgram),
      alias: vi.fn(() => mockProgram),
      description: vi.fn(() => mockProgram),
      option: vi.fn(() => mockProgram),
      action: vi.fn((fn) => {
        actionFn = fn;
        return mockProgram;
      }),
    };
    vi.spyOn(process, "cwd").mockReturnValue("/current/directory");
    vi.spyOn(os, "homedir").mockReturnValue("/home/user");
    mockGetPackageManager.mockResolvedValue("npm");
  });

  it("should set up the init command correctly", () => {
    setupInitCommand({ program: mockProgram });
    expect(mockProgram.command).toHaveBeenCalledWith("init");
    expect(mockProgram.alias).toHaveBeenCalledWith("i");
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-l, --local",
      LOCAL_OPTION_KEY,
      false,
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-g, --global",
      GLOBAL_OPTION_KEY,
      false,
    );
  });

  describe("handleGlobalInit", () => {
    it("should create a global config file when --global flag is set and no file exists", async () => {
      mockFindGlobalConfigFile.mockResolvedValueOnce(null);
      mockFs.pathExists.mockResolvedValueOnce(false);
      setupInitCommand({ program: mockProgram });
      await actionFn({ local: false, global: true });

      expect(mockFindGlobalConfigFile).toHaveBeenCalledOnce();
      expect(mockFs.pathExists).toHaveBeenCalledOnce();
      expect(mockFs.pathExists).toHaveBeenCalledWith(globalConfigPath);
      expect(mockGetPackageManager).toHaveBeenCalledOnce();
      expect(mockSaveConfig).toHaveBeenCalledWith(
        mockDetectedConfig,
        globalConfigPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(SUCCESS_KEY);
    });

    it("should default to homedir if findGlobalConfigFile returns null", async () => {
      mockFindGlobalConfigFile.mockResolvedValueOnce(null);
      mockFs.pathExists.mockResolvedValueOnce(false);
      setupInitCommand({ program: mockProgram });
      await actionFn({ local: false, global: true });

      expect(mockFindGlobalConfigFile).toHaveBeenCalledOnce();
      expect(mockFs.pathExists).toHaveBeenCalledOnce();
      expect(mockFs.pathExists).toHaveBeenCalledWith(globalConfigPath);
      expect(mockGetPackageManager).toHaveBeenCalledOnce();
      expect(mockSaveConfig).toHaveBeenCalledWith(
        mockDetectedConfig,
        globalConfigPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(SUCCESS_KEY);
    });

    it("should overwrite a global config file when --global flag is set and user confirms", async () => {
      mockFindGlobalConfigFile.mockResolvedValueOnce(globalConfigPath);
      mockFs.pathExists.mockResolvedValueOnce(true);
      mockInquirerSelect.mockResolvedValueOnce(true);
      setupInitCommand({ program: mockProgram });

      await actionFn({ local: false, global: true });

      expect(mockFs.pathExists).toHaveBeenCalledWith(globalConfigPath);
      expect(mockInquirerSelect).toHaveBeenCalledWith({
        message: `${CONFIRM_OVERWRITE_KEY}- options path:${globalConfigPath}`,
        choices: [
          { name: YES_KEY, value: true },
          { name: NO_KEY, value: false },
        ],
        default: true,
      });
      expect(mockGetPackageManager).toHaveBeenCalledOnce();
      expect(mockSaveConfig).toHaveBeenCalledWith(
        mockDetectedConfig,
        globalConfigPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(SUCCESS_KEY);
    });

    it("should not overwrite a global config file when user cancels", async () => {
      mockFindGlobalConfigFile.mockResolvedValueOnce(globalConfigPath);
      mockFs.pathExists.mockResolvedValueOnce(true);
      mockInquirerSelect.mockResolvedValueOnce(false);
      setupInitCommand({ program: mockProgram });

      await actionFn({ local: false, global: true });

      expect(mockFs.pathExists).toHaveBeenCalledWith(globalConfigPath);
      expect(mockGetPackageManager).not.toHaveBeenCalled();
      expect(mockSaveConfig).not.toHaveBeenCalled();
      expect(mockSpinner.info).toHaveBeenCalledWith(ABORTED_KEY);
    });
  });

  describe("handleLocalInit", () => {
    it("should create a local config file in a non-monorepo project when no local config exists", async () => {
      mockFindMonorepoRoot.mockResolvedValueOnce(null);
      mockFindProjectRoot.mockResolvedValueOnce(null);
      mockFindUp.mockResolvedValueOnce(null);

      setupInitCommand({ program: mockProgram });
      await actionFn({ local: true, global: false });

      expect(mockFindMonorepoRoot).toHaveBeenCalled();
      expect(mockFindProjectRoot).toHaveBeenCalled();
      expect(mockFindUp).toHaveBeenCalledWith({
        files: CONFIG_FILE_NAMES,
        cwd: "/current/directory",
        limit: "/current/directory",
      });
      expect(mockGetPackageManager).toHaveBeenCalledOnce();
      expect(mockSaveConfig).toHaveBeenCalledWith(
        mockDetectedConfig,
        localConfigPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(SUCCESS_KEY);
    });

    it("should ask to overwrite a local config file if it already exists", async () => {
      mockFindMonorepoRoot.mockResolvedValueOnce(null);
      mockFindProjectRoot.mockResolvedValueOnce(null);
      mockFindUp.mockResolvedValueOnce(localConfigPath);
      mockInquirerSelect.mockResolvedValueOnce(true);

      setupInitCommand({ program: mockProgram });
      await actionFn({ local: true, global: false });

      expect(mockFindMonorepoRoot).toHaveBeenCalledOnce();
      expect(mockFindProjectRoot).toHaveBeenCalledOnce();
      expect(mockFindUp).toHaveBeenCalledWith({
        files: CONFIG_FILE_NAMES,
        cwd: "/current/directory",
        limit: "/current/directory",
      });
      expect(mockInquirerSelect).toHaveBeenCalledWith({
        message: `${CONFIRM_OVERWRITE_KEY}- options path:${localConfigPath}`,
        choices: [
          { name: YES_KEY, value: true },
          { name: NO_KEY, value: false },
        ],
        default: true,
      });
      expect(mockGetPackageManager).toHaveBeenCalledOnce();
      expect(mockSaveConfig).toHaveBeenCalledWith(
        mockDetectedConfig,
        localConfigPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(SUCCESS_KEY);
    });

    it("should use the monorepo root as the limit and overwrite an existing config there", async () => {
      mockFindMonorepoRoot.mockResolvedValueOnce(monorepoRootPath);
      mockFindProjectRoot.mockResolvedValueOnce(null);
      mockFindUp.mockResolvedValueOnce(monorepoRootConfigPath);
      mockInquirerSelect.mockResolvedValueOnce(true);

      setupInitCommand({ program: mockProgram });
      await actionFn({ local: true, global: false });

      expect(mockFindMonorepoRoot).toHaveBeenCalledOnce();
      expect(mockFindProjectRoot).toHaveBeenCalledOnce();
      expect(mockFindUp).toHaveBeenCalledWith({
        files: CONFIG_FILE_NAMES,
        cwd: monorepoRootPath,
        limit: monorepoRootPath,
      });
      expect(mockInquirerSelect).toHaveBeenCalledWith({
        message: `${CONFIRM_OVERWRITE_KEY}- options path:${monorepoRootConfigPath}`,
        choices: [
          { name: YES_KEY, value: true },
          { name: NO_KEY, value: false },
        ],
        default: true,
      });
      expect(mockGetPackageManager).toHaveBeenCalledOnce();
      expect(mockSaveConfig).toHaveBeenCalledWith(
        mockDetectedConfig,
        monorepoRootConfigPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(SUCCESS_KEY);
    });

    it("should use the project root as the limit and overwrite an existing config there", async () => {
      mockFindMonorepoRoot.mockResolvedValueOnce(null);
      mockFindProjectRoot.mockResolvedValueOnce(projectRootPath);
      mockFindUp.mockResolvedValueOnce(projectRootConfigPath);
      mockInquirerSelect.mockResolvedValueOnce(true);

      setupInitCommand({ program: mockProgram });
      await actionFn({ local: true, global: false });

      expect(mockFindMonorepoRoot).toHaveBeenCalledOnce();
      expect(mockFindProjectRoot).toHaveBeenCalledOnce();
      expect(mockFindUp).toHaveBeenCalledWith({
        files: CONFIG_FILE_NAMES,
        cwd: projectRootPath,
        limit: projectRootPath,
      });
      expect(mockInquirerSelect).toHaveBeenCalledWith({
        message: `${CONFIRM_OVERWRITE_KEY}- options path:${projectRootConfigPath}`,
        choices: [
          { name: YES_KEY, value: true },
          { name: NO_KEY, value: false },
        ],
        default: true,
      });
      expect(mockGetPackageManager).toHaveBeenCalledOnce();
      expect(mockSaveConfig).toHaveBeenCalledWith(
        mockDetectedConfig,
        projectRootConfigPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(SUCCESS_KEY);
    });
  });

  it("should throw a ConfigError when both --local and --global flags are used", async () => {
    setupInitCommand({ program: mockProgram });
    await actionFn({ local: true, global: true });
    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new ConfigError(LOCAL_GLOBAL_ERROR_KEY),
      mockSpinner,
    );
    expect(mockSaveConfig).not.toHaveBeenCalled();
    expect(mockGetPackageManager).not.toHaveBeenCalled();
  });
});

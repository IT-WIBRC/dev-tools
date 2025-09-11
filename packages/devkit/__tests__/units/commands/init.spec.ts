import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupInitCommand } from "../../../src/commands/init.js";
import {
  CONFIG_FILE_NAMES,
  defaultCliConfig,
} from "../../../src/utils/configs/schema.js";
import { mockSpinner } from "../../../vitest.setup.js";
import { ConfigError } from "../../../src/utils/errors/base.js";

const {
  mockFs,
  mockInquirerSelect,
  mockSaveConfig,
  mockHandleErrorAndExit,
  mockFindUp,
  mockFindMonorepoRoot,
  mockFindProjectRoot,
  mockFindGlobalConfigFile,
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
}));

let actionFn: any;

vi.mock("os", () => ({
  default: {
    homedir: vi.fn(() => "/home/user"),
  },
}));

vi.mock("#utils/fileSystem.js", () => ({
  default: {
    pathExists: mockFs.pathExists,
  },
}));

vi.mock("@inquirer/prompts", () => ({ select: mockInquirerSelect }));

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#utils/configs/writer.js", () => ({
  saveConfig: mockSaveConfig,
}));

vi.mock("#utils/files/find-up.js", () => ({
  findUp: mockFindUp,
}));

vi.mock("#utils/files/finder.js", () => ({
  findMonorepoRoot: mockFindMonorepoRoot,
  findProjectRoot: mockFindProjectRoot,
}));

vi.mock("#utils/configs/search.js", () => ({
  findGlobalConfigFile: mockFindGlobalConfigFile,
}));

describe("setupInitCommand", () => {
  let mockProgram: any;
  const localConfigFile = CONFIG_FILE_NAMES[1];
  const globalConfigFile = CONFIG_FILE_NAMES[0];
  const localConfigPath = `/current/directory/${localConfigFile}`;
  const globalConfigPath = `/home/user/${globalConfigFile}`;
  const monorepoRootPath = "/monorepo/root";
  const monorepoRootConfigPath = `${monorepoRootPath}/${localConfigFile}`;
  const projectRootPath = "/project/root";
  const projectRootConfigPath = `${projectRootPath}/${localConfigFile}`;

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
  });

  it("should set up the init command correctly", () => {
    setupInitCommand({ program: mockProgram });
    expect(mockProgram.command).toHaveBeenCalledWith("init");
    expect(mockProgram.alias).toHaveBeenCalledWith("i");
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-l, --local",
      "config.init.option.local",
      false,
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-g, --global",
      "config.init.option.global",
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
      expect(mockSaveConfig).toHaveBeenCalledWith(
        defaultCliConfig,
        globalConfigPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith("config.init.success");
    });

    it("should default to homedir if findGlobalConfigFile returns null", async () => {
      mockFindGlobalConfigFile.mockResolvedValueOnce(null);
      mockFs.pathExists.mockResolvedValueOnce(false);
      setupInitCommand({ program: mockProgram });
      await actionFn({ local: false, global: true });

      expect(mockFindGlobalConfigFile).toHaveBeenCalledOnce();
      expect(mockFs.pathExists).toHaveBeenCalledOnce();
      expect(mockFs.pathExists).toHaveBeenCalledWith(globalConfigPath);
      expect(mockSaveConfig).toHaveBeenCalledWith(
        defaultCliConfig,
        globalConfigPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith("config.init.success");
    });

    it("should overwrite a global config file when --global flag is set and user confirms", async () => {
      mockFindGlobalConfigFile.mockResolvedValueOnce(globalConfigPath);
      mockFs.pathExists.mockResolvedValueOnce(true);
      mockInquirerSelect.mockResolvedValueOnce(true);
      setupInitCommand({ program: mockProgram });

      await actionFn({ local: false, global: true });

      expect(mockFs.pathExists).toHaveBeenCalledWith(globalConfigPath);
      expect(mockInquirerSelect).toHaveBeenCalledWith({
        message: `config.init.confirm_overwrite- options path:${globalConfigPath}`,
        choices: [
          { name: "common.yes", value: true },
          { name: "common.no", value: false },
        ],
        default: true,
      });
      expect(mockSaveConfig).toHaveBeenCalledWith(
        defaultCliConfig,
        globalConfigPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith("config.init.success");
    });

    it("should not overwrite a global config file when user cancels", async () => {
      mockFindGlobalConfigFile.mockResolvedValueOnce(globalConfigPath);
      mockFs.pathExists.mockResolvedValueOnce(true);
      mockInquirerSelect.mockResolvedValueOnce(false);
      setupInitCommand({ program: mockProgram });

      await actionFn({ local: false, global: true });

      expect(mockFs.pathExists).toHaveBeenCalledWith(globalConfigPath);
      expect(mockSaveConfig).not.toHaveBeenCalled();
      expect(mockSpinner.info).toHaveBeenCalledWith("config.init.aborted");
    });
  });

  describe("handleLocalInit", () => {
    it("should create a local config file in a non-monorepo project when no local config exists", async () => {
      mockFindMonorepoRoot.mockResolvedValueOnce(null);
      mockFindProjectRoot.mockResolvedValueOnce(null);
      mockFindUp.mockResolvedValue(null);

      setupInitCommand({ program: mockProgram });
      await actionFn({ local: true, global: false });

      expect(mockFindMonorepoRoot).toHaveBeenCalled();
      expect(mockFindProjectRoot).toHaveBeenCalled();
      expect(mockFindUp).toHaveBeenCalledWith({
        files: CONFIG_FILE_NAMES,
        cwd: "/current/directory",
        limit: "/current/directory",
      });
      expect(mockSaveConfig).toHaveBeenCalledWith(
        defaultCliConfig,
        localConfigPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith("config.init.success");
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
        message: `config.init.confirm_overwrite- options path:${localConfigPath}`,
        choices: [
          { name: "common.yes", value: true },
          { name: "common.no", value: false },
        ],
        default: true,
      });
      expect(mockSaveConfig).toHaveBeenCalledWith(
        defaultCliConfig,
        localConfigPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith("config.init.success");
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
        message: `config.init.confirm_overwrite- options path:${monorepoRootConfigPath}`,
        choices: [
          { name: "common.yes", value: true },
          { name: "common.no", value: false },
        ],
        default: true,
      });
      expect(mockSaveConfig).toHaveBeenCalledWith(
        defaultCliConfig,
        monorepoRootConfigPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith("config.init.success");
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
        message: `config.init.confirm_overwrite- options path:${projectRootConfigPath}`,
        choices: [
          { name: "common.yes", value: true },
          { name: "common.no", value: false },
        ],
        default: true,
      });
      expect(mockSaveConfig).toHaveBeenCalledWith(
        defaultCliConfig,
        projectRootConfigPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith("config.init.success");
    });
  });

  it("should throw a ConfigError when both --local and --global flags are used", async () => {
    setupInitCommand({ program: mockProgram });
    await actionFn({ local: true, global: true });
    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new ConfigError("error.config.init.local_and_global"),
      mockSpinner,
    );
    expect(mockSaveConfig).not.toHaveBeenCalled();
  });
});

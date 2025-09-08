import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupInitCommand } from "../../../src/commands/init.js";
import {
  CONFIG_FILE_NAMES,
  defaultCliConfig,
} from "../../../src/utils/configs/schema.js";
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
  mockFindGlobalConfigFile: vi.fn(),
}));

let actionFn: any;

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
  findGlobalConfigFile: mockFindGlobalConfigFile,
}));

describe("setupInitCommand", () => {
  let mockProgram: any;
  const localConfigFile = CONFIG_FILE_NAMES[1] || "";
  const globalConfigFile = CONFIG_FILE_NAMES[0] || "";
  const localConfigPath = path.join("/current/directory", localConfigFile);
  const globalConfigPath = path.join(os.homedir(), globalConfigFile);
  const monorepoRootPath = "/monorepo/root";
  const monorepoRootConfigPath = path.join(monorepoRootPath, localConfigFile);

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
    vi.spyOn(path, "join").mockImplementation((...args) => args.join(path.sep));
    vi.spyOn(path, "dirname").mockImplementation((p) =>
      p.split(path.sep).slice(0, -1).join(path.sep),
    );
    mockFindUp.mockResolvedValue(null);
    mockFindMonorepoRoot.mockResolvedValue(null);
    mockFindGlobalConfigFile.mockResolvedValue(globalConfigPath);
  });

  it("should set up the init command correctly", () => {
    setupInitCommand({ program: mockProgram });
    expect(mockProgram.command).toHaveBeenCalledWith("init");
    expect(mockProgram.alias).toHaveBeenCalledWith("i");
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-l, --local",
      expect.any(String),
      false,
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-g, --global",
      expect.any(String),
      false,
    );
  });

  describe("handleGlobalInit", () => {
    it("should create a global config file when --global flag is set and no file exists", async () => {
      mockFs.pathExists.mockResolvedValue(false);
      setupInitCommand({ program: mockProgram });
      await actionFn({ local: false, global: true });

      expect(mockFindGlobalConfigFile).toHaveBeenCalledOnce();
      expect(mockFs.pathExists).toHaveBeenCalledWith(globalConfigPath);
      expect(mockSaveConfig).toHaveBeenCalledWith(
        { ...defaultCliConfig },
        globalConfigPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(expect.any(String));
    });

    it("should default to homedir if findGlobalConfigFile returns null", async () => {
      mockFindGlobalConfigFile.mockResolvedValue(null);
      mockFs.pathExists.mockResolvedValue(false);
      setupInitCommand({ program: mockProgram });
      await actionFn({ local: false, global: true });

      expect(mockFindGlobalConfigFile).toHaveBeenCalledOnce();
      expect(mockFs.pathExists).toHaveBeenCalledWith(globalConfigPath);
      expect(mockSaveConfig).toHaveBeenCalledWith(
        { ...defaultCliConfig },
        globalConfigPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(expect.any(String));
    });

    it("should overwrite a global config file when --global flag is set and user confirms", async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockInquirerSelect.mockResolvedValueOnce(true);
      setupInitCommand({ program: mockProgram });

      await actionFn({ local: false, global: true });

      expect(mockFs.pathExists).toHaveBeenCalledWith(globalConfigPath);
      expect(mockInquirerSelect).toHaveBeenCalled();
      expect(mockSaveConfig).toHaveBeenCalledWith(
        { ...defaultCliConfig },
        globalConfigPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(expect.any(String));
    });

    it("should not overwrite a global config file when user cancels", async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockInquirerSelect.mockResolvedValueOnce(false);
      setupInitCommand({ program: mockProgram });

      await actionFn({ local: false, global: true });

      expect(mockFs.pathExists).toHaveBeenCalledWith(globalConfigPath);
      expect(mockSaveConfig).not.toHaveBeenCalled();
      expect(mockSpinner.info).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe("handleLocalInit", () => {
    it("should create a local config file by default in a non-monorepo project", async () => {
      mockFs.pathExists.mockResolvedValue(false);
      setupInitCommand({ program: mockProgram });
      await actionFn({ local: false, global: false });

      expect(mockFindMonorepoRoot).toHaveBeenCalled();
      expect(mockFs.pathExists).toHaveBeenCalledWith(localConfigPath);
      expect(mockSaveConfig).toHaveBeenCalledWith(
        { ...defaultCliConfig },
        localConfigPath,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(expect.any(String));
    });

    it("should ask to overwrite a local config file if it already exists", async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockInquirerSelect.mockResolvedValueOnce(true);
      setupInitCommand({ program: mockProgram });

      await actionFn({ local: false, global: false });

      expect(mockFs.pathExists).toHaveBeenCalledWith(localConfigPath);
      expect(mockInquirerSelect).toHaveBeenCalledTimes(1);
      expect(mockSaveConfig).toHaveBeenCalledWith(
        { ...defaultCliConfig },
        localConfigPath,
      );
    });

    describe("in a monorepo with no root config", () => {
      beforeEach(() => {
        mockFindMonorepoRoot.mockResolvedValue(monorepoRootPath);
        mockFindUp.mockResolvedValue(null);
      });

      it("should create a config in the package if user chooses local", async () => {
        mockInquirerSelect.mockResolvedValueOnce("local");
        setupInitCommand({ program: mockProgram });

        await actionFn({ local: false, global: false });

        expect(mockFindMonorepoRoot).toHaveBeenCalled();
        expect(mockInquirerSelect).toHaveBeenCalledWith({
          message: expect.any(String),
          choices: expect.any(Array),
          default: expect.any(String),
        });
        expect(mockSaveConfig).toHaveBeenCalledWith(
          { ...defaultCliConfig },
          localConfigPath,
        );
        expect(mockSpinner.succeed).toHaveBeenCalledWith(expect.any(String));
      });

      it("should create a config in the root if user chooses root", async () => {
        mockInquirerSelect.mockResolvedValueOnce("root");
        setupInitCommand({ program: mockProgram });

        await actionFn({ local: false, global: false });

        expect(mockFindMonorepoRoot).toHaveBeenCalled();
        expect(mockInquirerSelect).toHaveBeenCalledWith({
          message: expect.any(String),
          choices: expect.any(Array),
          default: expect.any(String),
        });
        expect(mockSaveConfig).toHaveBeenCalledWith(
          { ...defaultCliConfig },
          monorepoRootConfigPath,
        );
        expect(mockSpinner.succeed).toHaveBeenCalledWith(expect.any(String));
      });
    });

    describe("in a monorepo with an existing root config", () => {
      beforeEach(() => {
        mockFindMonorepoRoot.mockResolvedValue(monorepoRootPath);
        mockFindUp.mockResolvedValue(monorepoRootConfigPath);
        vi.spyOn(process, "cwd").mockReturnValue(
          "/monorepo/root/packages/sub-package",
        );
      });

      it("should prompt for overwrite if in a sub-package and user confirms", async () => {
        mockInquirerSelect.mockResolvedValueOnce(true);
        setupInitCommand({ program: mockProgram });

        await actionFn({ local: false, global: false });

        expect(mockFindMonorepoRoot).toHaveBeenCalled();
        expect(mockFindUp).toHaveBeenCalledTimes(2);
        expect(mockInquirerSelect).toHaveBeenCalledWith({
          message: expect.stringContaining(monorepoRootConfigPath),
          choices: expect.any(Array),
          default: expect.any(Boolean),
        });
        expect(mockSaveConfig).toHaveBeenCalledWith(
          { ...defaultCliConfig },
          path.join(process.cwd(), localConfigFile),
        );
      });

      it("should abort if in a sub-package and user cancels overwrite", async () => {
        mockInquirerSelect.mockResolvedValueOnce(false);
        setupInitCommand({ program: mockProgram });

        await actionFn({ local: false, global: false });

        expect(mockSaveConfig).not.toHaveBeenCalled();
        expect(mockSpinner.info).toHaveBeenCalledWith(expect.any(String));
      });
    });
  });

  it("should throw an error when both --local and --global flags are used", async () => {
    setupInitCommand({ program: mockProgram });
    await actionFn({ local: true, global: true });
    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      expect.any(ConfigError),
      mockSpinner,
    );
    expect(mockSaveConfig).not.toHaveBeenCalled();
  });
});

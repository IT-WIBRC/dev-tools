import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupInitCommand } from "../../../src/commands/init.js";
import { defaultCliConfig } from "../../../src/utils/configs/schema.js";
import { mockSpinner } from "../../../vitest.setup.js";
import { ConfigError } from "../../../src/utils/errors/base.js";
import path from "path";
import fs from "fs-extra";
import { CONFIG_FILE_NAMES } from "#utils/configs/schema.js";

const {
  mockFs,
  mockPrompts,
  mockSaveConfig,
  mockHandleErrorAndExit,
  mockFindUp,
  mockFindMonorepoRoot,
  mockFindGlobalConfigFile,
} = vi.hoisted(() => ({
  mockFs: {
    pathExists: vi.fn(),
  },
  mockPrompts: vi.fn(),
  mockSaveConfig: vi.fn(),
  mockHandleErrorAndExit: vi.fn(),
  mockFindUp: vi.fn(),
  mockFindMonorepoRoot: vi.fn(),
  mockFindGlobalConfigFile: vi.fn(),
}));

let actionFn: any;

vi.mock("fs-extra", () => ({
  default: {
    pathExists: mockFs.pathExists,
  },
}));
vi.mock("prompts", () => ({ default: mockPrompts }));

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
  const localConfigPath = "/current/directory/" + localConfigFile;
  const globalConfigPath = "/home/user/" + localConfigFile;
  const monorepoRootPath = "/monorepo/root";

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
    vi.spyOn(path, "join").mockImplementation((...args) => args.join("/"));
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
      "config.init.option.local",
      false,
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-g, --global",
      "config.init.option.global",
      false,
    );
  });

  it("should create a global config file when --global flag is set", async () => {
    mockFs.pathExists.mockResolvedValue(false);
    setupInitCommand({ program: mockProgram });
    await actionFn({ local: false, global: true });

    expect(mockFindGlobalConfigFile).toHaveBeenCalledOnce();
    expect(fs.pathExists).toHaveBeenCalledWith(globalConfigPath);
    expect(mockSaveConfig).toHaveBeenCalledWith(
      { ...defaultCliConfig },
      globalConfigPath,
    );
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      expect.stringContaining("config.init.success"),
    );
  });

  it("should overwrite a global config file when --global flag is set and user confirms", async () => {
    mockFs.pathExists.mockResolvedValue(true);
    mockPrompts.mockResolvedValue({ overwrite: true });
    setupInitCommand({ program: mockProgram });

    await actionFn({ local: false, global: true });

    expect(fs.pathExists).toHaveBeenCalledWith(globalConfigPath);
    expect(mockPrompts).toHaveBeenCalledWith({
      type: "select",
      name: "overwrite",
      message: expect.stringContaining(globalConfigPath),
      choices: expect.any(Array),
      initial: 0,
    });
    expect(mockSaveConfig).toHaveBeenCalledWith(
      { ...defaultCliConfig },
      globalConfigPath,
    );
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      expect.stringContaining("config.init.success"),
    );
  });

  it("should not overwrite a global config file when --global flag is set and user cancels", async () => {
    mockFs.pathExists.mockResolvedValue(true);
    mockPrompts.mockResolvedValue({ overwrite: false });
    setupInitCommand({ program: mockProgram });

    await actionFn({ local: false, global: true });

    expect(fs.pathExists).toHaveBeenCalledWith(globalConfigPath);
    expect(mockSaveConfig).not.toHaveBeenCalled();
    expect(mockSpinner.info).toHaveBeenCalledWith(
      expect.stringContaining("config.init.aborted"),
    );
  });

  it("should create a local config file by default in a non-monorepo project", async () => {
    mockFs.pathExists.mockResolvedValue(false);
    setupInitCommand({ program: mockProgram });
    await actionFn({ local: false, global: false });

    expect(mockFindMonorepoRoot).toHaveBeenCalled();
    expect(fs.pathExists).toHaveBeenCalledWith(localConfigPath);
    expect(mockSaveConfig).toHaveBeenCalledWith(
      { ...defaultCliConfig },
      localConfigPath,
    );
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      expect.stringContaining("config.init.success"),
    );
  });

  it("should ask to overwrite a local config file if it already exists", async () => {
    mockFs.pathExists.mockResolvedValue(true);
    mockPrompts.mockResolvedValue({ overwrite: true });
    setupInitCommand({ program: mockProgram });

    await actionFn({ local: true, global: false });

    expect(fs.pathExists).toHaveBeenCalledWith(localConfigPath);
    expect(mockPrompts).toHaveBeenCalled();
    expect(mockSaveConfig).toHaveBeenCalledWith(
      { ...defaultCliConfig },
      localConfigPath,
    );
  });

  it("should handle a monorepo with no root config and create a config in the package", async () => {
    mockFindMonorepoRoot.mockResolvedValue(monorepoRootPath);
    mockFs.pathExists.mockResolvedValue(false);
    mockPrompts.mockResolvedValue({ location: "local" });
    setupInitCommand({ program: mockProgram });

    await actionFn({ local: false, global: false });

    expect(mockFindUp).toHaveBeenCalled();
    expect(mockFindMonorepoRoot).toHaveBeenCalled();
    expect(mockPrompts).toHaveBeenCalledWith({
      type: "select",
      name: "location",
      message: expect.any(String),
      choices: expect.any(Array),
      initial: 0,
    });
    expect(mockSaveConfig).toHaveBeenCalledWith(
      { ...defaultCliConfig },
      localConfigPath,
    );
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      expect.stringContaining("config.init.success"),
    );
  });

  it("should handle a monorepo with no root config and create a config in the root", async () => {
    mockFindMonorepoRoot.mockResolvedValue(monorepoRootPath);
    mockFs.pathExists.mockResolvedValue(false);
    mockPrompts.mockResolvedValue({ location: "root" });
    const rootConfigPath = path.join(monorepoRootPath, localConfigFile);
    setupInitCommand({ program: mockProgram });

    await actionFn({ local: false, global: false });

    expect(mockSaveConfig).toHaveBeenCalledWith(
      { ...defaultCliConfig },
      rootConfigPath,
    );
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      expect.stringContaining("config.init.success"),
    );
  });

  it("should ask to overwrite a root monorepo config if a config exists at the root", async () => {
    mockFindMonorepoRoot.mockResolvedValue(monorepoRootPath);
    mockFindUp.mockResolvedValue(path.join(monorepoRootPath, localConfigFile));
    mockPrompts.mockResolvedValue({ overwrite: true });

    setupInitCommand({ program: mockProgram });

    await actionFn({ local: false, global: false });

    expect(mockFindUp).toHaveBeenCalled();
    expect(mockPrompts).toHaveBeenCalledWith({
      type: "select",
      name: "overwrite",
      message: expect.stringContaining(
        path.join(monorepoRootPath, localConfigFile),
      ),
      choices: [
        {
          title: "common.yes",
          value: true,
        },
        {
          title: "common.no",
          value: false,
        },
      ],
      initial: 0,
    });
    expect(mockSaveConfig).toHaveBeenCalledWith(
      { ...defaultCliConfig },
      path.join(monorepoRootPath, localConfigFile),
    );
  });

  it("should ask to overwrite a root monorepo config if a config exists at the root", async () => {
    mockFindMonorepoRoot.mockResolvedValue(monorepoRootPath);
    mockFindUp.mockResolvedValueOnce(
      path.join(monorepoRootPath, localConfigFile),
    );

    mockPrompts.mockResolvedValue({ overwrite: true });

    setupInitCommand({ program: mockProgram });

    await actionFn({ local: false, global: false });

    expect(mockFindUp).toHaveBeenCalled();

    expect(mockPrompts).toHaveBeenCalledTimes(1);

    expect(mockPrompts).toHaveBeenCalledWith({
      type: "select",
      name: "location",
      message: "config.init.monorepo_location",
      choices: [
        {
          title: "config.init.location_current",
          value: "local",
        },
        {
          title: "config.init.location_root",
          value: "root",
        },
      ],
      initial: 0,
    });

    expect(mockSaveConfig).toHaveBeenCalledWith(
      { ...defaultCliConfig },
      localConfigPath,
    );
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

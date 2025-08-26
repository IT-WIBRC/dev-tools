import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupInitCommand } from "../../src/commands/init.js";
import { defaultCliConfig } from "../../src/utils/configs/schema.js";
import { mockSpinner } from "../../vitest.setup.js";
import { ConfigError } from "../../src/utils/errors/base.js";

const {
  mockFs,
  mockPath,
  mockOs,
  mockPrompts,
  mockSaveGlobalConfig,
  mockSaveLocalConfig,
  mockHandleErrorAndExit,
} = vi.hoisted(() => ({
  mockFs: {
    promises: {
      stat: vi.fn(),
    },
  },
  mockPath: {
    join: vi.fn(),
  },
  mockOs: {
    homedir: vi.fn(),
  },
  mockPrompts: vi.fn(),
  mockSaveGlobalConfig: vi.fn(),
  mockSaveLocalConfig: vi.fn(),
  mockHandleErrorAndExit: vi.fn(),
}));

let actionFn: any;

vi.mock("fs-extra", () => ({ default: mockFs }));
vi.mock("path", () => ({ default: mockPath }));
vi.mock("os", () => ({ default: mockOs }));
vi.mock("prompts", () => ({ default: mockPrompts }));

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#utils/configs/writer", () => ({
  saveGlobalConfig: mockSaveGlobalConfig,
  saveLocalConfig: mockSaveLocalConfig,
}));

describe("setupInitCommand", () => {
  let mockProgram: any;
  const localConfigPath = "/current/directory/devkitrc.json";
  const globalConfigPath = "/home/user/.devkitrc.json";

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
    // Default mock for path.join
    mockPath.join.mockImplementation((...args) => args.join("/"));
    // Default mock for os.homedir
    mockOs.homedir.mockReturnValue("/home/user");
  });

  it("should set up the init command correctly", () => {
    setupInitCommand({ program: mockProgram, config: {}, source: "local" });
    expect(mockProgram.command).toHaveBeenCalledWith("init");
    expect(mockProgram.alias).toHaveBeenCalledWith("i");
    expect(mockProgram.description).toHaveBeenCalledWith(
      "config.init.command.description",
    );
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

  it("should create a local config file by default when no file exists", async () => {
    mockFs.promises.stat.mockRejectedValue({ code: "ENOENT" });
    mockPath.join.mockReturnValue(localConfigPath);
    vi.spyOn(process, "cwd").mockReturnValue("/current/directory");

    setupInitCommand({
      program: mockProgram,
      config: {},
      source: "local",
    });
    await actionFn({ local: false, global: false });

    expect(mockFs.promises.stat).toHaveBeenCalledWith(localConfigPath);
    expect(mockSaveLocalConfig).toHaveBeenCalledWith({
      ...defaultCliConfig,
    });
    expect(mockSpinner.succeed).toHaveBeenCalledWith("config.init.success");
    expect(mockSaveGlobalConfig).not.toHaveBeenCalled();
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should create a global config file when --global flag is set and no file exists", async () => {
    mockFs.promises.stat.mockRejectedValue({ code: "ENOENT" });
    mockPath.join.mockReturnValue(globalConfigPath);

    setupInitCommand({ program: mockProgram, config: {}, source: "local" });
    await actionFn({ local: false, global: true });

    expect(mockFs.promises.stat).toHaveBeenCalledWith(globalConfigPath);
    expect(mockSaveGlobalConfig).toHaveBeenCalledWith({ ...defaultCliConfig });
    expect(mockSpinner.succeed).toHaveBeenCalledWith("config.init.success");
    expect(mockSaveLocalConfig).not.toHaveBeenCalled();
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should overwrite a local config file when it exists and the user confirms", async () => {
    mockFs.promises.stat.mockResolvedValue({});
    mockPath.join.mockReturnValue(localConfigPath);
    mockPrompts.mockResolvedValue({ overwrite: true });
    vi.spyOn(process, "cwd").mockReturnValue("/current/directory");

    setupInitCommand({ program: mockProgram, config: {}, source: "local" });
    await actionFn({ local: true, global: false });

    expect(mockPrompts).toHaveBeenCalledWith({
      type: "confirm",
      name: "overwrite",
      message: expect.stringContaining(localConfigPath),
      initial: false,
    });
    expect(mockFs.promises.stat).toHaveBeenCalledWith(localConfigPath);
    expect(mockSaveLocalConfig).toHaveBeenCalledWith({
      ...defaultCliConfig,
    });
    expect(mockSpinner.succeed).toHaveBeenCalledWith("config.init.success");
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should not overwrite a local config file when it exists and the user cancels", async () => {
    mockFs.promises.stat.mockResolvedValue({});
    mockPath.join.mockReturnValue(localConfigPath);
    mockPrompts.mockResolvedValue({ overwrite: false });
    vi.spyOn(process, "cwd").mockReturnValue("/current/directory");

    setupInitCommand({ program: mockProgram, config: {}, source: "local" });
    await actionFn({ local: true, global: false });

    expect(mockPrompts).toHaveBeenCalledWith({
      type: "confirm",
      name: "overwrite",
      message: expect.stringContaining(localConfigPath),
      initial: false,
    });
    expect(mockFs.promises.stat).toHaveBeenCalledWith(localConfigPath);
    expect(mockSaveLocalConfig).not.toHaveBeenCalled();
    expect(mockSpinner.info).toHaveBeenCalledWith("config.init.aborted");
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should throw a ConfigError when both --local and --global flags are used", async () => {
    setupInitCommand({ program: mockProgram, config: {}, source: "local" });
    await actionFn({ local: true, global: true });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new ConfigError("error.config.init.local_and_global"),
      mockSpinner,
    );
    expect(mockSaveLocalConfig).not.toHaveBeenCalled();
    expect(mockSaveGlobalConfig).not.toHaveBeenCalled();
  });

  it("should handle unexpected I/O errors during file stat", async () => {
    const mockError = new Error("Permission denied");
    (mockError as any).code = "EACCES";
    mockFs.promises.stat.mockRejectedValue(mockError);
    mockPath.join.mockReturnValue(localConfigPath);

    setupInitCommand({ program: mockProgram, config: {}, source: "local" });
    await actionFn({ local: false, global: false });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new ConfigError("error.config.init.fail", localConfigPath, {
        cause: mockError,
      }),
      mockSpinner,
    );
    expect(mockSaveLocalConfig).not.toHaveBeenCalled();
  });
});

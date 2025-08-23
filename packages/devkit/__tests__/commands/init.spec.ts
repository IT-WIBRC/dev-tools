import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupInitCommand } from "../../src/commands/init.js";
import {
  defaultCliConfig,
  CONFIG_FILE_NAMES,
} from "../../src/utils/configs/schema.js";
import { mockSpinner } from "../../vitest.setup.js";
import { ConfigError } from "../../src/utils/errors/base.js";

const {
  mockFs,
  mockPath,
  mockOs,
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
  mockChalk: {
    cyan: vi.fn((message) => message),
    green: vi.fn((message) => message),
  },
  mockSaveGlobalConfig: vi.fn(),
  mockSaveLocalConfig: vi.fn(),
  mockHandleErrorAndExit: vi.fn(),
}));

let actionFn: any;

vi.mock("fs-extra", () => ({ default: mockFs }));
vi.mock("path", () => ({ default: mockPath }));
vi.mock("os", () => ({ default: mockOs }));

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#utils/configs/writer", () => ({
  saveGlobalConfig: mockSaveGlobalConfig,
  saveLocalConfig: mockSaveLocalConfig,
}));

describe("setupInitCommand", () => {
  let mockProgram: any;

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
    mockPath.join.mockImplementation((...args) => args.join("/"));
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

  it("should create a local config file by default", async () => {
    mockFs.promises.stat.mockRejectedValue({ code: "ENOENT" });
    const joinReturnPath = "/current/directory/.devkitrc.json";
    mockPath.join.mockReturnValue(joinReturnPath);
    vi.spyOn(process, "cwd").mockReturnValue("/home/user");

    setupInitCommand({
      program: mockProgram,
      config: {},
      source: "local",
    });
    await actionFn({ local: false, global: false });

    expect(mockPath.join).toHaveBeenCalledWith(
      "/home/user",
      CONFIG_FILE_NAMES[1],
    );
    expect(mockFs.promises.stat).toHaveBeenCalledWith(joinReturnPath);
    expect(mockSaveLocalConfig).toHaveBeenCalledWith({
      ...defaultCliConfig,
    });
    expect(mockSpinner.succeed).toHaveBeenCalledWith("config.init.success");
    expect(mockSaveGlobalConfig).not.toHaveBeenCalled();
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should create a global config file when --global flag is set", async () => {
    mockFs.promises.stat.mockRejectedValue({ code: "ENOENT" });
    mockPath.join.mockReturnValue("/home/user/.devkitrc.json");
    mockOs.homedir.mockReturnValue("/home/user");

    setupInitCommand({ program: mockProgram, config: {}, source: "local" });
    await actionFn({ local: false, global: true });

    expect(mockPath.join).toHaveBeenCalledWith(
      mockOs.homedir(),
      CONFIG_FILE_NAMES[0],
    );
    expect(mockFs.promises.stat).toHaveBeenCalledWith(
      "/home/user/.devkitrc.json",
    );
    expect(mockSaveGlobalConfig).toHaveBeenCalledWith({ ...defaultCliConfig });
    expect(mockSpinner.succeed).toHaveBeenCalledWith("config.init.success");
    expect(mockSaveLocalConfig).not.toHaveBeenCalled();
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

  it("should throw a ConfigError if a local config file already exists", async () => {
    mockFs.promises.stat.mockResolvedValue({});
    mockPath.join.mockReturnValue("/current/directory/.devkit.json");

    setupInitCommand({ program: mockProgram, config: {}, source: "local" });
    await actionFn({ local: true, global: false });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new ConfigError(
        "error.config.init.fail",
        "/current/directory/.devkit.json",
        {
          cause: new ConfigError(
            "error.config.exists- options path:/current/directory/.devkit.json",
            "/current/directory/.devkit.json",
          ),
        },
      ),
      mockSpinner,
    );
    expect(mockSaveLocalConfig).not.toHaveBeenCalled();
  });

  it("should throw a ConfigError if a global config file already exists", async () => {
    mockFs.promises.stat.mockResolvedValue({});
    mockPath.join.mockReturnValue("/home/user/.devkitrc.json");
    mockOs.homedir.mockReturnValue("/home/user");

    setupInitCommand({ program: mockProgram, config: {}, source: "local" });
    await actionFn({ local: false, global: true });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new ConfigError("error.config.init.fail", "/home/user/.devkitrc.json", {
        cause: new ConfigError(
          "error.config.exists- options path:/home/user/.devkitrc.json",
          "/home/user/.devkitrc.json",
        ),
      }),
      mockSpinner,
    );
    expect(mockSaveGlobalConfig).not.toHaveBeenCalled();
  });

  it("should handle unexpected I/O errors during file stat", async () => {
    const mockError = new Error("Permission denied");
    (mockError as any).code = "EACCES";
    mockFs.promises.stat.mockRejectedValue(mockError);
    mockPath.join.mockReturnValue("/current/directory/.devkitrc.json");

    setupInitCommand({ program: mockProgram, config: {}, source: "local" });
    await actionFn({ local: true, global: false });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new ConfigError(
        "error.config.init.fail",
        "/current/directory/.devkitrc.json",
        { cause: mockError },
      ),
      mockSpinner,
    );
    expect(mockSaveLocalConfig).not.toHaveBeenCalled();
  });
});
